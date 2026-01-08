import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Encryption helper
function encrypt(text: string): string {
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "misledi_default_encryption_key_32b";
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export async function GET() {
    try {
        // 1. Admin User
        const hashedPassword = await bcrypt.hash("123456", 10);
        await prisma.user.upsert({
            where: { email: "admin@misledi.com" },
            update: {},
            create: {
                email: "admin@misledi.com",
                passwordHash: hashedPassword,
            }
        });

        // 2. Trendyol Integration (Passive by default)
        await prisma.integration.upsert({
            where: { id: "trendyol-main" },
            update: {},
            create: {
                id: "trendyol-main",
                provider: "trendyol",
                credentialsEncrypted: encrypt(JSON.stringify({
                    supplierId: "",
                    apiKey: "",
                    apiSecret: ""
                })),
                status: "PENDING"
            }
        });

        // 3. Settings
        await prisma.setting.upsert({
            where: { key: "global_config" },
            update: {},
            create: {
                key: "global_config",
                value: JSON.stringify({
                    siteName: "Misledi",
                    currency: "TRY"
                })
            }
        });

        // 4. Create database tables
        // Tables should already exist from prisma db push

        return NextResponse.json({
            success: true,
            message: "Kurulum tamamlandı! Artık giriş yapabilirsiniz.",
            credentials: {
                email: "admin@misledi.com",
                password: "123456"
            }
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
