import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET: Load default cost card settings
export async function GET() {
    try {
        const settings = await prisma.setting.findMany({
            where: {
                key: {
                    in: [
                        "default_commission_percent",
                        "default_influencer_percent",
                        "default_shipping_base",
                        "default_service_fee_base",
                        "default_packaging_cost",
                        "default_kdv_rate",
                        "low_margin_threshold"
                    ]
                }
            }
        });

        // Convert to object
        const defaults: Record<string, string> = {};
        for (const setting of settings) {
            // Convert key format: default_commission_percent -> commissionPercent
            const key = setting.key
                .replace("default_", "")
                .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            defaults[key] = setting.value;
        }

        return NextResponse.json({
            commissionPercent: defaults.commissionPercent || "17",
            influencerPercent: defaults.influencerPercent || "0",
            shippingBase: defaults.shippingBase || "38.77",
            serviceFeeBase: defaults.serviceFeeBase || "6.99",
            packagingCost: defaults.packagingCost || "12",
            kdvRate: defaults.kdvRate || "20",
            lowMarginThreshold: defaults.lowMarginThreshold || "5"
        });
    } catch (error) {
        console.error("Settings defaults GET error:", error);
        return NextResponse.json(
            { error: "Ayarlar yüklenirken hata oluştu" },
            { status: 500 }
        );
    }
}

// POST: Save default cost card settings
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            commissionPercent,
            influencerPercent,
            shippingBase,
            serviceFeeBase,
            packagingCost,
            kdvRate,
            lowMarginThreshold
        } = body;

        // Settings to upsert
        const settingsToSave = [
            { key: "default_commission_percent", value: String(commissionPercent || "17") },
            { key: "default_influencer_percent", value: String(influencerPercent || "0") },
            { key: "default_shipping_base", value: String(shippingBase || "38.77") },
            { key: "default_service_fee_base", value: String(serviceFeeBase || "6.99") },
            { key: "default_packaging_cost", value: String(packagingCost || "12") },
            { key: "default_kdv_rate", value: String(kdvRate || "20") },
            { key: "low_margin_threshold", value: String(lowMarginThreshold || "5") }
        ];

        // Upsert each setting
        for (const setting of settingsToSave) {
            await prisma.setting.upsert({
                where: { key: setting.key },
                update: { value: setting.value },
                create: { key: setting.key, value: setting.value }
            });
        }

        // Log the action (use system user ID)
        const systemUser = await prisma.user.findFirst({ where: { email: "admin@misledi.com" } });
        if (systemUser) {
            await prisma.auditLog.create({
                data: {
                    userId: systemUser.id,
                    action: "SETTINGS_UPDATE",
                    entityType: "Setting",
                    entityId: "defaults",
                    diffJson: JSON.stringify({
                        commissionPercent,
                        influencerPercent,
                        shippingBase,
                        serviceFeeBase
                    })
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Settings defaults POST error:", error);
        return NextResponse.json(
            { error: "Ayarlar kaydedilirken hata oluştu" },
            { status: 500 }
        );
    }
}
