import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { calculateProfit, CostCardData, DEFAULT_COST_CARD } from "@/lib/profit-calculator";

// GET: Fetch all products with their cost cards
export async function GET() {
    try {
        const products = await prisma.product.findMany({
            include: {
                costCard: true
            },
            orderBy: {
                updatedAt: "desc"
            }
        });

        // Transform products for frontend
        const transformedProducts = products.map((product) => {
            const costCard = product.costCard;
            let status: "profit" | "loss" | "low_margin" | "missing_cost" = "missing_cost";
            let estimatedProfit: number | null = null;
            let marginPercent: number | null = null;
            let breakEvenPrice: number | null = null;

            if (costCard) {
                const salePrice = Number(product.salePrice);

                // Build cost card data for calculator
                const costCardData: CostCardData = {
                    costPurchase: Number(costCard.costPurchase),
                    costPackaging: Number(costCard.costPackaging),
                    commissionPercent: Number(costCard.commissionPercent),
                    influencerPercent: Number((costCard as Record<string, unknown>).influencerPercent ?? 0),
                    shippingBase: Number((costCard as Record<string, unknown>).shippingBase ?? DEFAULT_COST_CARD.shippingBase),
                    serviceFeeBase: Number((costCard as Record<string, unknown>).serviceFeeBase ?? DEFAULT_COST_CARD.serviceFeeBase),
                    kdvRate: Number((costCard as Record<string, unknown>).kdvRate ?? 20),
                };

                // Calculate profit using new engine
                const calculation = calculateProfit(salePrice, costCardData);

                estimatedProfit = calculation.netProfit;
                marginPercent = calculation.profitMargin;
                breakEvenPrice = calculation.breakEvenPrice;

                if (estimatedProfit < 0) {
                    status = "loss";
                } else if (marginPercent < 5) {
                    status = "low_margin";
                } else {
                    status = "profit";
                }
            }

            return {
                id: product.id,
                sku: product.sku,
                barcode: product.barcode,
                title: product.title,
                salePrice: Number(product.salePrice),
                listPrice: product.listPrice ? Number(product.listPrice) : null,
                stock: product.stock,
                isActive: product.isActive,
                estimatedProfit,
                marginPercent,
                breakEvenPrice,
                hasCostCard: !!costCard,
                status,
                costCard: costCard ? {
                    costPurchase: Number(costCard.costPurchase),
                    costPackaging: Number(costCard.costPackaging),
                    commissionPercent: Number(costCard.commissionPercent),
                    influencerPercent: Number((costCard as Record<string, unknown>).influencerPercent ?? 0),
                    shippingBase: Number((costCard as Record<string, unknown>).shippingBase ?? DEFAULT_COST_CARD.shippingBase),
                    serviceFeeBase: Number((costCard as Record<string, unknown>).serviceFeeBase ?? DEFAULT_COST_CARD.serviceFeeBase),
                    kdvRate: Number((costCard as Record<string, unknown>).kdvRate ?? 20),
                } : null
            };
        });

        return NextResponse.json(transformedProducts);
    } catch (error) {
        console.error("Products GET error:", error);
        return NextResponse.json(
            { error: "Ürünler yüklenirken hata oluştu" },
            { status: 500 }
        );
    }
}
