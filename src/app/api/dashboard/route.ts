import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { calculateProfit, calculateScenarioMatrix, CostCardData, DEFAULT_COST_CARD, ScenarioResult } from "@/lib/profit-calculator";

export async function GET() {
    try {
        // Get all products with cost cards
        const products = await prisma.product.findMany({
            include: { costCard: true }
        });

        // Calculate stats using new profit calculator
        let productsInLoss = 0;
        let productsMissingCost = 0;
        let totalProfit = 0;
        let totalRevenue = 0;

        const worstProducts: Array<{
            id: string;
            sku: string;
            title: string;
            loss: number;
            reason: string;
        }> = [];

        // Hangi ürünler flaşa girerse zarar eder?
        const flashSaleRisks: Array<{
            id: string;
            sku: string;
            title: string;
            normalProfit: number;
            flashLoss: number;
        }> = [];

        for (const product of products) {
            if (!product.costCard) {
                productsMissingCost++;
                continue;
            }

            const salePrice = Number(product.salePrice);
            const costCard = product.costCard as Record<string, unknown>;

            // Build cost card data for calculator
            const costCardData: CostCardData = {
                costPurchase: Number(costCard.costPurchase),
                costPackaging: Number(costCard.costPackaging),
                commissionPercent: Number(costCard.commissionPercent),
                influencerPercent: Number(costCard.influencerPercent ?? 0),
                shippingBase: Number(costCard.shippingBase ?? DEFAULT_COST_CARD.shippingBase),
                serviceFeeBase: Number(costCard.serviceFeeBase ?? DEFAULT_COST_CARD.serviceFeeBase),
                kdvRate: Number(costCard.kdvRate ?? 20),
            };

            // 1. Mevcut Durum Analizi (Normal Satış)
            const calculation = calculateProfit(salePrice, costCardData);

            totalRevenue += salePrice;
            totalProfit += calculation.netProfit;

            if (calculation.netProfit < 0) {
                productsInLoss++;
                let reason = "Yüksek maliyet";
                if (costCardData.influencerPercent > 0) reason = "Influencer komisyonu";
                else if (costCardData.commissionPercent > 20) reason = "Yüksek komisyon";

                worstProducts.push({
                    id: product.id,
                    sku: product.sku,
                    title: product.title,
                    loss: calculation.netProfit,
                    reason
                });
            }

            // 2. Gelecek Analizi (Flaş Satış Riski)
            // Varsayılan: Fiyat %10 düşer, Komisyon aynı kalır (kötü senaryo) veya Flaşta %5 olur.
            // Risk analizi için "kötü senaryo"yu (komisyon düşmezse) veya "beklenen"i alabiliriz.
            // Kullanıcı "Duygusuz Gerçek" istedi. Genelde flaşta fiyat düşer.

            const matrix = calculateScenarioMatrix(salePrice, costCardData, {
                flashPrice: salePrice * 0.90, // %10 İndirim simülasyonu
                flashCommission: costCardData.commissionPercent // Komisyon düşmediği varsayımı (Risk analizi)
            });

            // Eğer normalde kârlı ama flaşta zarara düşüyorsa -> Risk Listesine Ekle
            if (matrix.NORMAL.netProfit > 0 && matrix.FLASH.netProfit < 0) {
                flashSaleRisks.push({
                    id: product.id,
                    sku: product.sku,
                    title: product.title,
                    normalProfit: matrix.NORMAL.netProfit,
                    flashLoss: matrix.FLASH.netProfit
                });
            }
        }

        // Sort lists
        worstProducts.sort((a, b) => a.loss - b.loss); // En çok zarar edenler
        flashSaleRisks.sort((a, b) => a.flashLoss - b.flashLoss); // Flaşta en çok zarar edecekler

        return NextResponse.json({
            netProfit: { value: Math.round(totalProfit * 100) / 100, change: 0, period: "today" },
            revenue: { value: Math.round(totalRevenue * 100) / 100, change: 0, period: "today" },
            commission: { value: 0, change: 0, period: "today" },
            shipping: { value: 0, change: 0, period: "today" },
            productsInLoss,
            productsMissingCost,
            worstProducts: worstProducts.slice(0, 5),
            flashSaleRisks: flashSaleRisks.slice(0, 5), // Top 5 Flaş Riski
            totalProducts: products.length
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);
        return NextResponse.json(
            { error: "Dashboard verileri yüklenirken hata oluştu" },
            { status: 500 }
        );
    }
}
