import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { TrendyolService } from "@/lib/trendyol-service";
import { calculateScenarioMatrix, CostCardData, DEFAULT_COST_CARD } from "@/lib/profit-calculator";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const productId = searchParams.get("id");

        if (!productId) {
            return NextResponse.json({ error: "Ürün ID gerekli" }, { status: 400 });
        }

        // 1. Ürün ve Maliyet Kartını DB'den al
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: { costCard: true }
        });

        if (!product) {
            return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 404 });
        }

        // 2. Maliyet Kartı Verisini Hazırla
        const costCard = product.costCard as Record<string, unknown>;
        const costCardData: CostCardData = costCard ? {
            costPurchase: Number(costCard.costPurchase),
            costPackaging: Number(costCard.costPackaging),
            commissionPercent: Number(costCard.commissionPercent),
            influencerPercent: Number(costCard.influencerPercent ?? 0),
            shippingBase: Number(costCard.shippingBase ?? DEFAULT_COST_CARD.shippingBase),
            serviceFeeBase: Number(costCard.serviceFeeBase ?? DEFAULT_COST_CARD.serviceFeeBase),
            kdvRate: Number(costCard.kdvRate ?? 20),
        } : DEFAULT_COST_CARD;

        // 3. Trendyol Servisinden Piyasa İstihbaratı Al
        const trendyolService = new TrendyolService();
        let marketData;

        try {
            // Gerçek entegrasyon varsa veriyi çek, yoksa varsayılanları kullan
            marketData = await trendyolService.getProductMarketIntelligence(product.barcode);
        } catch (error) {
            console.warn("Trendyol API error, using fallback:", error);
            // Fallback data
            marketData = {
                currentSalePrice: Number(product.salePrice),
                promotions: {
                    hasFlashSale: false,
                    flashSalePrice: null,
                    flashCommissionRate: null,
                    hasCoupon: false,
                    couponAmount: 0
                }
            };
        }

        // 4. Analiz Matrisini Hesapla
        const currentPrice = marketData.currentSalePrice > 0 ? marketData.currentSalePrice : Number(product.salePrice);

        // Simülasyon parametrelerini hazırla (API'den gelen verilerle)
        const simulationParams = {
            discountedPrice: currentPrice, // Şimdilik normal fiyatın aynısı (gerçek indirim verisi gelene kadar)
            flashPrice: marketData.promotions.flashSalePrice ?? (currentPrice * 0.90), // %10 varsayılan indirim
            couponAmount: marketData.promotions.couponAmount,
            flashCommission: marketData.promotions.flashCommissionRate ?? costCardData.commissionPercent
        };

        const matrix = calculateScenarioMatrix(currentPrice, costCardData, simulationParams);

        return NextResponse.json({
            product: {
                id: product.id,
                title: product.title,
                sku: product.sku,
                image: product.image,
            },
            marketData,
            matrix
        });

    } catch (error) {
        console.error("Analysis API error:", error);
        return NextResponse.json(
            { error: "Analiz yapılırken hata oluştu" },
            { status: 500 }
        );
    }
}
