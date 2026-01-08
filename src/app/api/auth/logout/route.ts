import { NextRequest, NextResponse } from "next/server";
import { deleteSessionCookie, getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();

        if (user) {
            // Audit log oluştur
            await prisma.auditLog.create({
                data: {
                    userId: user.userId,
                    action: "LOGOUT",
                    entityType: "User",
                    entityId: user.userId,
                    ip: request.headers.get("x-forwarded-for") || undefined,
                    userAgent: request.headers.get("user-agent") || undefined,
                },
            });
        }

        // Session cookie'sini sil
        await deleteSessionCookie();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json(
            { error: "Çıkış yapılırken bir hata oluştu" },
            { status: 500 }
        );
    }
}
