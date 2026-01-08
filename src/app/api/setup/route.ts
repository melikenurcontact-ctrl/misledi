import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Tek seferlik setup endpoint - admin ve ayarları oluşturur
export async function GET() {
    const prisma = new PrismaClient();

    try {
        // Zaten admin var mı kontrol et
        const existingAdmin = await prisma.user.findFirst();

        if (existingAdmin) {
            await prisma.$disconnect();
            return NextResponse.json({
                success: false,
                message: "Setup zaten tamamlanmış. Admin kullanıcı mevcut.",
                email: existingAdmin.email,
            });
        }

        // Admin kullanıcı oluştur
        const hashedPassword = await bcrypt.hash("admin123", 12);

        const admin = await prisma.user.create({
            data: {
                email: "admin@misledi.com",
                passwordHash: hashedPassword,
                isActive: true,
            },
        });

        // Varsayılan ayarlar
        const settings = [
            { key: "default_commission_percent", value: "15" },
            { key: "default_shipping_cost", value: "35" },
            { key: "low_margin_threshold", value: "5" },
        ];

        for (const setting of settings) {
            await prisma.setting.upsert({
                where: { key: setting.key },
                update: { value: setting.value },
                create: setting,
            });
        }

        // Varsayılan entegrasyon
        await prisma.integration.create({
            data: {
                id: "trendyol-default",
                provider: "trendyol",
                status: "PENDING",
            },
        });

        await prisma.$disconnect();

        return NextResponse.json({
            success: true,
            message: "Setup tamamlandı!",
            admin: {
                email: admin.email,
                password: "admin123 (lütfen değiştirin)",
            },
            settings: settings,
        });
    } catch (error) {
        await prisma.$disconnect();
        console.error("Setup error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Setup başarısız",
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
