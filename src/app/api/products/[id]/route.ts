import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { calculateProfit, CostCardData, DEFAULT_COST_CARD } from "@/lib/profit-calculator";

// GET: Fetch a single product with cost card and calculations
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                costCard: true
            }
        });

        if (!product) {
            return NextResponse.json(
                { error: "Ürün bulunamadı" },
                { status: 404 }
            );
        }

        // Calculate profit if cost card exists
        let calculation = null;
        if (product.costCard) {
            const costCard = product.costCard as Record<string, unknown>;
            const costCardData: CostCardData = {
                costPurchase: Number(costCard.costPurchase),
                costPackaging: Number(costCard.costPackaging),
                commissionPercent: Number(costCard.commissionPercent),
                influencerPercent: Number(costCard.influencerPercent ?? 0),
                shippingBase: Number(costCard.shippingBase ?? DEFAULT_COST_CARD.shippingBase),
                serviceFeeBase: Number(costCard.serviceFeeBase ?? DEFAULT_COST_CARD.serviceFeeBase),
                kdvRate: Number(costCard.kdvRate ?? 20),
            };
            calculation = calculateProfit(Number(product.salePrice), costCardData);
        }

        return NextResponse.json({
            ...product,
            salePrice: Number(product.salePrice),
            listPrice: product.listPrice ? Number(product.listPrice) : null,
            calculation
        });
    } catch (error) {
        console.error("Product GET error:", error);
        return NextResponse.json(
            { error: "Ürün yüklenirken hata oluştu" },
            { status: 500 }
        );
    }
}

// PUT: Update product cost card
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const {
            costPurchase,
            costPackaging,
            commissionPercent,
            influencerPercent,
            shippingBase,
            serviceFeeBase,
            kdvRate
        } = body;

        // Validate
        if (costPurchase === undefined || costPurchase < 0) {
            return NextResponse.json(
                { error: "Geçerli bir alış fiyatı girin" },
                { status: 400 }
            );
        }

        // Check product exists
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) {
            return NextResponse.json(
                { error: "Ürün bulunamadı" },
                { status: 404 }
            );
        }

        // Upsert cost card with new fields
        const costCard = await prisma.costCard.upsert({
            where: { productId: id },
            update: {
                costPurchase,
                costPackaging: costPackaging ?? DEFAULT_COST_CARD.costPackaging,
                commissionPercent: commissionPercent ?? DEFAULT_COST_CARD.commissionPercent,
                influencerPercent: influencerPercent ?? 0,
                shippingBase: shippingBase ?? DEFAULT_COST_CARD.shippingBase,
                serviceFeeBase: serviceFeeBase ?? DEFAULT_COST_CARD.serviceFeeBase,
                kdvRate: kdvRate ?? DEFAULT_COST_CARD.kdvRate,
            },
            create: {
                productId: id,
                costPurchase,
                costPackaging: costPackaging ?? DEFAULT_COST_CARD.costPackaging,
                commissionPercent: commissionPercent ?? DEFAULT_COST_CARD.commissionPercent,
                influencerPercent: influencerPercent ?? 0,
                shippingBase: shippingBase ?? DEFAULT_COST_CARD.shippingBase,
                serviceFeeBase: serviceFeeBase ?? DEFAULT_COST_CARD.serviceFeeBase,
                kdvRate: kdvRate ?? DEFAULT_COST_CARD.kdvRate,
            }
        });

        // Calculate profit with new data
        const costCardData: CostCardData = {
            costPurchase,
            costPackaging: costPackaging ?? DEFAULT_COST_CARD.costPackaging,
            commissionPercent: commissionPercent ?? DEFAULT_COST_CARD.commissionPercent,
            influencerPercent: influencerPercent ?? 0,
            shippingBase: shippingBase ?? DEFAULT_COST_CARD.shippingBase,
            serviceFeeBase: serviceFeeBase ?? DEFAULT_COST_CARD.serviceFeeBase,
            kdvRate: kdvRate ?? DEFAULT_COST_CARD.kdvRate,
        };
        const calculation = calculateProfit(Number(product.salePrice), costCardData);

        return NextResponse.json({
            success: true,
            costCard,
            calculation
        });
    } catch (error) {
        console.error("Product PUT error:", error);
        return NextResponse.json(
            { error: "Maliyet kartı kaydedilirken hata oluştu" },
            { status: 500 }
        );
    }
}
