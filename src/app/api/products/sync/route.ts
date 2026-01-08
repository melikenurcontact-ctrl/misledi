import { NextResponse } from "next/server";
import { TrendyolService } from "@/lib/trendyol-service";
import prisma from "@/lib/db";

const trendyolService = new TrendyolService();

export async function POST() {
    try {
        console.log("🔄 Trendyol ürün senkronizasyonu başladı...");

        // Trendyol'dan ürünleri çek (İlk 1000 ürün için sayfalama yapabiliriz ama şimdilik tek seferde 100 deneyelim)
        // Trendyol product API pagination destekler.

        const products = await trendyolService.fetchProducts(0, 1000);
        console.log(`📦 Trendyol'dan ${products.length} ürün çekildi.`);

        if (products.length === 0) {
            return NextResponse.json({ message: "Trendyol'da ürün bulunamadı veya API hatası." }, { status: 404 });
        }

        let syncedCount = 0;

        // Varsayılan ayarları çek
        const defaultSettings = await prisma.setting.findMany();
        const getSetting = (key: string, def: string) => Number(defaultSettings.find(s => s.key === key)?.value || def);

        const defaultCommission = getSetting("default_commission_percent", "20");
        const defaultShipping = getSetting("default_shipping_cost", "40");
        const defaultServiceFee = 5; // Sabit

        for (const p of products) {
            // Trendyol API Response alanları
            const sku = p.stockCode || p.productCode || p.barcode;
            const barcode = p.barcode;
            const title = p.title;
            const salePrice = p.salePrice || 0;
            const listPrice = p.listPrice || 0;
            const stock = p.quantity || 0;

            if (!sku) continue;

            // 1. Ürünü Kaydet/Güncelle
            const product = await prisma.product.upsert({
                where: { sku: sku },
                update: {
                    barcode: barcode,
                    title: title,
                    salePrice: salePrice,
                    listPrice: listPrice,
                    stock: stock
                },
                create: {
                    sku: sku,
                    barcode: barcode,
                    title: title,
                    salePrice: salePrice,
                    listPrice: listPrice,
                    stock: stock
                }
            });

            // 2. Maliyet Kartı Yoksa Oluştur (Varsayılanlarla)
            // Böylece kâr hesaplama hemen çalışır
            const existingCost = await prisma.costCard.findUnique({ where: { productId: product.id } });

            if (!existingCost) {
                await prisma.costCard.create({
                    data: {
                        productId: product.id,
                        costPurchase: 0, // Kullanıcı girmeli
                        costPackaging: 5,
                        commissionPercent: defaultCommission,
                        influencerPercent: 0 as any,
                        shippingBase: defaultShipping,
                        serviceFeeBase: defaultServiceFee,
                        kdvRate: 20 // Standart %20
                    }
                });
            }

            syncedCount++;
        }

        return NextResponse.json({
            success: true,
            message: `${syncedCount} ürün başarıyla senkronize edildi.`,
            count: syncedCount
        });

    } catch (error: any) {
        console.error("Product sync error:", error);
        return NextResponse.json({ error: error.message || "Senkronizasyon hatası" }, { status: 500 });
    }
}
