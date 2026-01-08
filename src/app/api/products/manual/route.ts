import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// POST: Create a new product manually
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sku, barcode, title, salePrice, listPrice, stock, costPurchase, costPackaging, commissionPercent } = body;

        // Validation
        if (!sku || !title || !salePrice) {
            return NextResponse.json(
                { error: "SKU, başlık ve satış fiyatı zorunludur" },
                { status: 400 }
            );
        }

        // Check if SKU already exists
        const existing = await prisma.product.findUnique({ where: { sku } });
        if (existing) {
            return NextResponse.json(
                { error: "Bu SKU zaten mevcut" },
                { status: 400 }
            );
        }

        // Create product
        const product = await prisma.product.create({
            data: {
                sku,
                barcode: barcode || null,
                title,
                salePrice: parseFloat(salePrice),
                listPrice: listPrice ? parseFloat(listPrice) : null,
                stock: stock ? parseInt(stock) : 0,
                isActive: true
            }
        });

        // Create cost card if cost info provided
        if (costPurchase || costPackaging || commissionPercent) {
            await prisma.costCard.create({
                data: {
                    productId: product.id,
                    costPurchase: costPurchase ? parseFloat(costPurchase) : 0,
                    costPackaging: costPackaging ? parseFloat(costPackaging) : 0,
                    commissionPercent: commissionPercent ? parseFloat(commissionPercent) : 21,
                    shippingBase: 30,
                    serviceFeeBase: 5,
                    kdvRate: 20
                }
            });
        }

        return NextResponse.json({
            success: true,
            message: "Ürün başarıyla eklendi",
            product
        });

    } catch (error: unknown) {
        console.error("Manual product create error:", error);
        const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

// PUT: Update existing product
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, sku, barcode, title, salePrice, listPrice, stock, costPurchase, costPackaging, commissionPercent } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Ürün ID gerekli" },
                { status: 400 }
            );
        }

        // Update product
        const product = await prisma.product.update({
            where: { id },
            data: {
                sku,
                barcode: barcode || null,
                title,
                salePrice: parseFloat(salePrice),
                listPrice: listPrice ? parseFloat(listPrice) : null,
                stock: stock ? parseInt(stock) : 0
            }
        });

        // Update or create cost card
        if (costPurchase !== undefined || costPackaging !== undefined || commissionPercent !== undefined) {
            await prisma.costCard.upsert({
                where: { productId: id },
                update: {
                    costPurchase: costPurchase ? parseFloat(costPurchase) : 0,
                    costPackaging: costPackaging ? parseFloat(costPackaging) : 0,
                    commissionPercent: commissionPercent ? parseFloat(commissionPercent) : 21
                },
                create: {
                    productId: id,
                    costPurchase: costPurchase ? parseFloat(costPurchase) : 0,
                    costPackaging: costPackaging ? parseFloat(costPackaging) : 0,
                    commissionPercent: commissionPercent ? parseFloat(commissionPercent) : 21,
                    shippingBase: 30,
                    serviceFeeBase: 5,
                    kdvRate: 20
                }
            });
        }

        return NextResponse.json({
            success: true,
            message: "Ürün güncellendi",
            product
        });

    } catch (error: unknown) {
        console.error("Manual product update error:", error);
        const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

// DELETE: Remove product
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Ürün ID gerekli" },
                { status: 400 }
            );
        }

        // Delete cost card first (foreign key)
        await prisma.costCard.deleteMany({ where: { productId: id } });

        // Delete product
        await prisma.product.delete({ where: { id } });

        return NextResponse.json({
            success: true,
            message: "Ürün silindi"
        });

    } catch (error: unknown) {
        console.error("Manual product delete error:", error);
        const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
