import { NextResponse } from "next/server";
import prisma from "@/lib/db"; // Use the existing prisma client instance
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Encryption helper specifically for this setup route to ensure consistency
function encrypt(text: string): string {
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "misledi_default_encryption_key_32b";
    // Ensure key is 32 bytes
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return Format: iv:authTag:encrypted
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
                password: hashedPassword,
                name: "Admin",
                role: "ADMIN"
            }
        });

        // 2. Integration
        await prisma.integration.upsert({
            where: { id: "trendyol" }, // Assuming ID is predictable or check provider
            update: {}, // Don't overwrite if exists
            create: {
                id: "trendyol",
                provider: "trendyol",
                name: "Trendyol Mağazam",
                credentials: encrypt(JSON.stringify({
                    supplierId: "",
                    apiKey: "",
                    apiSecret: ""
                })),
                settings: JSON.stringify({
                    commissionRate: 21,
                    taxRate: 20
                }),
                status: "PASSIVE"
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

        return NextResponse.json({ message: "Setup completed successfully! database seeded." });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
