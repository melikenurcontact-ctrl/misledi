import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
    try {
        const session = await getCurrentUser();

        if (!session) {
            return NextResponse.json(
                { error: "Oturum bulunamadı" },
                { status: 401 }
            );
        }

        // Kullanıcı bilgilerini getir
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: {
                id: true,
                email: true,
                isActive: true,
                createdAt: true,
            },
        });

        if (!user || !user.isActive) {
            return NextResponse.json(
                { error: "Kullanıcı bulunamadı veya devre dışı" },
                { status: 401 }
            );
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Auth me error:", error);
        return NextResponse.json(
            { error: "Bir hata oluştu" },
            { status: 500 }
        );
    }
}
