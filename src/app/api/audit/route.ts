import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET: Fetch audit logs
export async function GET() {
    try {
        const logs = await prisma.auditLog.findMany({
            include: {
                user: {
                    select: {
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 100
        });

        const transformedLogs = logs.map(log => ({
            id: log.id,
            userId: log.userId,
            userEmail: log.user.email,
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            description: getActionDescription(log.action, log.entityType, log.diffJson),
            ip: log.ip,
            createdAt: formatDate(log.createdAt)
        }));

        return NextResponse.json(transformedLogs);
    } catch (error) {
        console.error("Audit GET error:", error);
        return NextResponse.json(
            { error: "Denetim logları yüklenirken hata oluştu" },
            { status: 500 }
        );
    }
}

function getActionDescription(action: string, entityType: string, diffJson: string | null): string {
    switch (action) {
        case "LOGIN":
            return "Sisteme giriş yapıldı";
        case "LOGOUT":
            return "Sistemden çıkış yapıldı";
        case "UPDATE_COST":
            if (diffJson) {
                try {
                    const diff = JSON.parse(diffJson);
                    return `Maliyet kartı güncellendi: ${diff.sku || entityType}`;
                } catch {
                    return "Maliyet kartı güncellendi";
                }
            }
            return "Maliyet kartı güncellendi";
        case "SYNC_TRIGGER":
            return "Trendyol senkronizasyonu başlatıldı";
        case "UPDATE_SETTINGS":
            return "Sistem ayarları güncellendi";
        case "CREATE_PRODUCT":
            return "Yeni ürün eklendi";
        case "DELETE_PRODUCT":
            return "Ürün silindi";
        default:
            return `${action} işlemi gerçekleştirildi (${entityType})`;
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

    return date.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}
