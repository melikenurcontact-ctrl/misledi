import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { TrendyolService } from "@/lib/trendyol-service";
import { calculateProfit, CostCardData, DEFAULT_COST_CARD } from "@/lib/profit-calculator";

export async function POST() {
    try {
        const trendyolService = new TrendyolService();
        await trendyolService.initialize();

        // 1. Trendyol'dan siparişleri çek (Son siparişler)
        const orders = await trendyolService.fetchOrders(50);

        let processedCount = 0;
        let createdCount = 0;

        // 2. Siparişleri işle ve veritabanına kaydet
        for (const orderData of orders) {
            // Siparişi veritabanında bul veya oluştur
            const order = await prisma.order.upsert({
                where: { providerOrderId: orderData.orderNumber },
                update: {
                    status: orderData.status,
                    totalPrice: orderData.totalPrice,
                    updatedAt: new Date()
                },
                create: {
                    providerOrderId: orderData.orderNumber,
                    orderNumber: orderData.orderNumber,
                    orderDate: new Date(orderData.orderDate),
                    status: orderData.status,
                    totalPrice: orderData.totalPrice,
                    grossPrice: orderData.grossPrice,
                    currency: orderData.currencyCode,
                    customerFirstName: orderData.customerFirstName,
                    customerLastName: orderData.customerLastName,
                    cargoTrackingNumber: orderData.cargoTrackingNumber,
                    cargoProvider: orderData.cargoProvider
                }
            });

            if (order) createdCount++;

            // Sipariş satırlarını işle
            for (const lineData of orderData.lines) {
                // Ürünü bul (SKU ile)
                const product = await prisma.product.findUnique({
                    where: { sku: lineData.sku },
                    include: { costCard: true }
                });

                // Sipariş satırını oluştur/güncelle
                const orderLine = await prisma.orderLine.upsert({
                    where: {
                        // providerLineId olmadığı için orderId + sku kombinasyonuyla unique varsayıyoruz (basitlik için)
                        // Gerçek senaryoda providerLineId olmalı. Burada id ile bulamayız, create yapacağız.
                        // upsert için unique constraint lazım. Şimdilik findFirst ile kontrol edip create/update yapalım.
                        id: "temp-id-wont-be-used"
                    },
                    update: {}, // Aşağıda manuel logic kuracağız
                    create: {
                        orderId: order.id,
                        merchantSku: lineData.merchantSku,
                        productId: product?.id,
                        skuSnapshot: lineData.sku,
                        titleSnapshot: lineData.productName,
                        quantity: lineData.quantity,
                        unitSalePrice: lineData.salesPrice,
                        vatBaseAmount: lineData.vatBaseAmount,
                        discountAmount: lineData.discount
                    }
                }).catch(async () => {
                    // Upsert yerine manuel kontrol + create (Unique constraint yoksa)
                    // OrderLine tablosunda unique bir alanımız yok (providerLineId nullable).
                    // Bu yüzden önce var mı diye bakalım.
                    const existingLine = await prisma.orderLine.findFirst({
                        where: {
                            orderId: order.id,
                            skuSnapshot: lineData.sku
                        }
                    });

                    if (existingLine) {
                        return existingLine;
                    }

                    return await prisma.orderLine.create({
                        data: {
                            orderId: order.id,
                            merchantSku: lineData.merchantSku,
                            productId: product?.id,
                            skuSnapshot: lineData.sku,
                            titleSnapshot: lineData.productName,
                            quantity: lineData.quantity,
                            unitSalePrice: lineData.salesPrice,
                            vatBaseAmount: lineData.vatBaseAmount,
                            discountAmount: lineData.discount
                        }
                    });
                });

                // 3. Kâr Hesaplaması (Gerçekleşen)
                // O anki CostCard verilerini kullan
                const costCard = product?.costCard;

                const costData: CostCardData = {
                    costPurchase: Number(costCard?.costPurchase ?? 0),
                    costPackaging: Number(costCard?.costPackaging ?? DEFAULT_COST_CARD.costPackaging),
                    commissionPercent: Number(costCard?.commissionPercent ?? DEFAULT_COST_CARD.commissionPercent),
                    influencerPercent: Number(costCard?.influencerPercent ?? 0), // Influencer var mı siparişten anlaşılabilir ama şimdilik karttan
                    shippingBase: Number(costCard?.shippingBase ?? DEFAULT_COST_CARD.shippingBase),
                    serviceFeeBase: Number(costCard?.serviceFeeBase ?? DEFAULT_COST_CARD.serviceFeeBase),
                    kdvRate: Number(costCard?.kdvRate ?? DEFAULT_COST_CARD.kdvRate)
                };

                // Hesapla
                // Not: calculateProfit tek ürün için hesaplar. Toplam için çarpmamız gerekebilir veya unit profit saklarız.
                // ProfitCalculation tablosu satır bazlı, yani o satırın toplam kârını tutmalı.
                // calculateProfit fonksiyonu unit bazlı çalışıyor.
                const unitCalculation = calculateProfit(lineData.salesPrice, costData);

                const totalNetProfit = unitCalculation.netProfit * lineData.quantity;
                const totalGrossRevenue = lineData.salesPrice * lineData.quantity;
                const totalCommission = (unitCalculation.trendyolCommission + unitCalculation.influencerCommission) * lineData.quantity;
                // Kargo ve Hizmet bedeli sipariş başına mı ürün başına mı?
                // Genelde sipariş başına ama Trendyol'da ürün başınadır.
                const totalShipping = unitCalculation.shippingWithKdv * lineData.quantity;
                // Hizmet bedeli de adet başı ise * quantity. Cost packaging de * quantity.

                // ProfitCalculation tablosuna kaydet
                await prisma.profitCalculation.upsert({
                    where: { orderLineId: orderLine.id },
                    update: {
                        grossRevenue: totalGrossRevenue,
                        commission: totalCommission,
                        cogs: Number(costData.costPurchase) * lineData.quantity,
                        packaging: Number(costData.costPackaging) * lineData.quantity,
                        shipping: totalShipping,
                        netProfit: totalNetProfit,
                        marginPercent: unitCalculation.profitMargin,
                        calculatedAt: new Date()
                    },
                    create: {
                        orderLineId: orderLine.id,
                        grossRevenue: totalGrossRevenue,
                        commission: totalCommission,
                        cogs: Number(costData.costPurchase) * lineData.quantity,
                        packaging: Number(costData.costPackaging) * lineData.quantity,
                        shipping: totalShipping,
                        netProfit: totalNetProfit,
                        marginPercent: unitCalculation.profitMargin
                    }
                });
            }

            processedCount++;
        }

        return NextResponse.json({
            success: true,
            processed: processedCount,
            message: `${processedCount} sipariş senkronize edildi.`
        });

    } catch (error) {
        console.error("Order sync error:", error);
        return NextResponse.json(
            { error: "Siparişler senkronize edilirken hata oluştu: " + (error instanceof Error ? error.message : String(error)) },
            { status: 500 }
        );
    }
}
