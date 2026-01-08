import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET: Fetch all alerts
export async function GET() {
    try {
        const alerts = await prisma.alert.findMany({
            include: {
                product: {
                    select: {
                        sku: true,
                        title: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 100
        });

        const transformedAlerts = alerts.map(alert => ({
            id: alert.id,
            type: alert.type,
            severity: alert.severity,
            productSku: alert.product?.sku || "N/A",
            productTitle: alert.product?.title || "Bilinmeyen Ürün",
            message: getAlertMessage(alert.type, alert.payloadJson),
            payload: alert.payloadJson ? JSON.parse(alert.payloadJson) : {},
            isRead: alert.isRead,
            createdAt: formatDate(alert.createdAt)
        }));

        return NextResponse.json(transformedAlerts);
    } catch (error) {
        console.error("Alerts GET error:", error);
        return NextResponse.json(
            { error: "Uyarılar yüklenirken hata oluştu" },
            { status: 500 }
        );
    }
}

// POST: Mark alerts as read
export async function POST(request: Request) {
    try {
        const { alertIds, markAll } = await request.json();

        if (markAll) {
            await prisma.alert.updateMany({
                where: { isRead: false },
                data: { isRead: true }
            });
        } else if (alertIds && alertIds.length > 0) {
            await prisma.alert.updateMany({
                where: { id: { in: alertIds } },
                data: { isRead: true }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Alerts POST error:", error);
        return NextResponse.json(
            { error: "Uyarılar güncellenirken hata oluştu" },
            { status: 500 }
        );
    }
}

function getAlertMessage(type: string, payloadJson: string | null): string {
    const payload = payloadJson ? JSON.parse(payloadJson) : {};

    switch (type) {
        case "LOSS_NOW":
            return `Bu ürün şu an zararda satılıyor. Adet başı ${payload.loss || 0}₺ zarar.`;
        case "BELOW_BREAK_EVEN":
            return `Fiyat, başabaş noktasının altında. Minimum ${payload.breakEven || 0}₺ olmalı.`;
        case "LOW_MARGIN":
            return `Kâr marjı çok düşük: %${payload.margin || 0}. Dikkatli olun.`;
        case "MISSING_COST":
            return "Bu ürün için maliyet kartı tanımlanmamış. Kâr hesaplanamaz.";
        default:
            return "Bilinmeyen uyarı türü";
    }
}

function formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Az önce";
    if (minutes < 60) return `${minutes} dakika önce`;
    if (hours < 24) return `${hours} saat önce`;
    if (days < 7) return `${days} gün önce`;

    return date.toLocaleDateString("tr-TR");
}
