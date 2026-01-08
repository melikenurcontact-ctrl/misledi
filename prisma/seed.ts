import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

// Encryption helper (Seed içinde)
function encrypt(text: string): string {
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "misledi_secret_key_32_chars_long!!";
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

async function main() {
    console.log("🌱 Seeding database with full data...");

    // 1. Admin kullanıcı
    const hashedPassword = await bcrypt.hash("admin123", 12);
    const admin = await prisma.user.upsert({
        where: { email: "admin@misledi.com" },
        update: { passwordHash: hashedPassword },
        create: {
            email: "admin@misledi.com",
            passwordHash: hashedPassword,
            isActive: true,
        },
    });
    console.log("✅ Admin user ready:", admin.email);

    // 2. Canlı Trendyol Entegrasyon Bilgileri (Gömülü)
    const credentials = {
        supplierId: "797978",
        apiKey: "LmjcBXbn1yYnZMFIF2Jd",
        apiSecret: "eDwyYENCPLbZfxGLA3qu"
    };

    // API formatı: encrypt(JSON.stringify({ apiKey, apiSecret }))
    const credentialsPayload = JSON.stringify({
        apiKey: credentials.apiKey,
        apiSecret: credentials.apiSecret
    });
    const encryptedCredentials = encrypt(credentialsPayload);

    // Ayarları kaydet (Key-Value) - Bunlar API'de kullanılmıyor ama referans olsun
    // Not: Setting tablosunda tek tek tutmak yerine Integration tablosu esas alınıyor.
    // Ancak Setting tarafında da tutarlılık olsun diye encrypted değerleri (json değil) saklayabiliriz veya boş geçebiliriz.
    // Şimdilik sadece Integration'a odaklanalım.

    const settings = [
        { key: "trendyol_supplier_id", value: credentials.supplierId },
        // apiKey ve apiSecret'ı burada tutmuyoruz, Integration tablosunda tutuyoruz.
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
    console.log("✅ Live Settings & Credentials injected");

    // 3. Entegrasyon Durumu (Aktif)
    await prisma.integration.upsert({
        where: { id: "trendyol-default" },
        update: {
            status: "ACTIVE",
            supplierId: credentials.supplierId,
            credentialsEncrypted: encryptedCredentials,
            lastSyncAt: new Date()
        },
        create: {
            id: "trendyol-default",
            provider: "trendyol",
            status: "ACTIVE",
            supplierId: credentials.supplierId,
            credentialsEncrypted: encryptedCredentials,
            lastSyncAt: new Date()
        },
    });
    console.log("✅ Integration activated");

    // Demo ürünler kaldırıldı. 
    // Kullanıcıya temiz bir başlangıç sunuluyor.
    console.log("🎉 Başlangıç verileri oluşturuldu! (Demo veri yok)");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
