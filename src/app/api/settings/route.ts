import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { encrypt, decrypt } from "@/lib/encryption";

// GET: Fetch current integration settings
export async function GET() {
    try {
        const integration = await prisma.integration.findFirst({
            where: { provider: "trendyol" }
        });

        if (!integration) {
            return NextResponse.json({
                supplierId: "",
                apiKey: "",
                apiSecret: "",
                status: "PENDING"
            });
        }

        // Decrypt credentials if they exist
        let credentials = { apiKey: "", apiSecret: "" };
        if (integration.credentialsEncrypted) {
            try {
                credentials = JSON.parse(decrypt(integration.credentialsEncrypted));
            } catch {
                // If decryption fails, return empty
            }
        }

        return NextResponse.json({
            supplierId: integration.supplierId || "",
            apiKey: credentials.apiKey ? "***" + credentials.apiKey.slice(-4) : "",
            apiSecret: credentials.apiSecret ? "********" : "",
            status: integration.status,
            lastSyncAt: integration.lastSyncAt
        });
    } catch (error) {
        console.error("Settings GET error:", error);
        return NextResponse.json(
            { error: "Ayarlar yüklenirken hata oluştu" },
            { status: 500 }
        );
    }
}

// POST: Save integration settings
export async function POST(request: NextRequest) {
    try {
        const { supplierId, apiKey, apiSecret } = await request.json();

        // Validate
        if (!supplierId || !apiKey || !apiSecret) {
            return NextResponse.json(
                { error: "Tüm alanlar zorunludur" },
                { status: 400 }
            );
        }

        // Mevcut entegrasyonu çek (Eski şifreleri korumak için)
        const existingIntegration = await prisma.integration.findUnique({
            where: { id: "trendyol-default" }
        });

        let finalApiKey = apiKey;
        let finalApiSecret = apiSecret;

        // Maskelik kontrolü (Eğer input *** içeriyorsa ve eski kayıt varsa, eskiyi kullan)
        if (existingIntegration && existingIntegration.credentialsEncrypted) {
            try {
                const decryptedPayload = decrypt(existingIntegration.credentialsEncrypted);
                const oldCreds = JSON.parse(decryptedPayload);

                if (apiKey.includes("***")) {
                    finalApiKey = oldCreds.apiKey;
                }
                if (apiSecret.includes("***")) {
                    finalApiSecret = oldCreds.apiSecret;
                }
            } catch (decError) {
                console.warn("Eski şifreler çözülemedi, yeni girilenler kullanılacak.");
            }
        }

        // Encrypt credentials (API'nin beklediği format: encrypt(JSON))
        const credentialsEncrypted = encrypt(JSON.stringify({
            apiKey: finalApiKey,
            apiSecret: finalApiSecret
        }));

        // Upsert integration
        await prisma.integration.upsert({
            where: { id: "trendyol-default" },
            update: {
                supplierId,
                credentialsEncrypted,
                status: "ACTIVE" // Kaydedince ACTIVE yapıyoruz
            },
            create: {
                id: "trendyol-default",
                provider: "trendyol",
                supplierId,
                credentialsEncrypted,
                status: "ACTIVE"
            }
        });

        return NextResponse.json({ success: true, message: "Ayarlar kaydedildi" });
    } catch (error) {
        console.error("Settings POST error:", error);
        return NextResponse.json(
            { error: "Ayarlar kaydedilirken hata oluştu" },
            { status: 500 }
        );
    }
}
