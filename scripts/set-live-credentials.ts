import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

const ALGORITHM = "aes-256-gcm";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "misledi-default-encryption-key-32b";

function getKey(): Buffer {
    // Ensure key is exactly 32 bytes (Matching lib/encryption.ts logic)
    const key = ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32);
    return Buffer.from(key, "utf-8");
}

function encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:content
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

async function main() {
    console.log("🔒 Injecting Live Trendyol Credentials...");

    const credentials = {
        supplierId: "797978",
        apiKey: "LmjcBXbn1yYnZMFIF2Jd",
        apiSecret: "eDwyYENCPLbZfxGLA3qu"
    };

    console.log(`🔑 Supplier ID: ${credentials.supplierId}`);

    // Ayarları güncelle
    // 1. Supplier ID
    await prisma.setting.upsert({
        where: { key: "trendyol_supplier_id" },
        update: { value: credentials.supplierId },
        create: { key: "trendyol_supplier_id", value: credentials.supplierId }
    });

    // 2. API Key (Encrypted)
    const encryptedKey = encrypt(credentials.apiKey);
    await prisma.setting.upsert({
        where: { key: "trendyol_api_key" },
        update: { value: encryptedKey },
        create: { key: "trendyol_api_key", value: encryptedKey }
    });

    // 3. API Secret (Encrypted)
    const encryptedSecret = encrypt(credentials.apiSecret);
    await prisma.setting.upsert({
        where: { key: "trendyol_api_secret" },
        update: { value: encryptedSecret },
        create: { key: "trendyol_api_secret", value: encryptedSecret }
    });

    // 4. Entegrasyon Durumunu Güncelle
    // API ile uyumlu format: encrypt(JSON.stringify({ apiKey, apiSecret }))
    const credentialsPayload = JSON.stringify({
        apiKey: credentials.apiKey,
        apiSecret: credentials.apiSecret
    });
    const encryptedCredentials = encrypt(credentialsPayload);

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
        }
    });

    // 5. Demo verilerini (Sadece siparişleri) temizle - Opsiyonel
    // Kullanıcı "demoyu da kaldır" dediği için temizleyelim.
    // Ancak ürünleri silersek cost cardlar da gidebilir, dikkatli olalım.
    // Şimdilik sadece "Demo" tag'li siparişleri silmek isterdim ama DB'de öyle bir tag yok.
    // En güvenlisi: Eski siparişleri silmek.

    // await prisma.order.deleteMany({}); // RİSKLİ OLABİLİR. Ama demo için ok.
    // console.log("🧹 Demo orders cleared.");

    console.log("✅ Credentials injected successfully!");
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
