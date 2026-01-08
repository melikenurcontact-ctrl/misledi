import { NextRequest, NextResponse } from "next/server";
import { TrendyolService } from "@/lib/trendyol-service";
import prisma from "@/lib/db";
import { decrypt } from "@/lib/encryption";

export async function POST(request: NextRequest) {
    try {
        const { supplierId, apiKey, apiSecret } = await request.json();

        if (!supplierId || !apiKey || !apiSecret) {
            return NextResponse.json(
                { error: "Tüm alanlar zorunludur" },
                { status: 400 }
            );
        }

        // Maskeli veri çözme (api/settings/route.ts ile aynı mantık)
        let finalApiKey = apiKey;
        let finalApiSecret = apiSecret;

        if (apiKey.includes("***") || apiSecret.includes("***")) {
            const existingIntegration = await prisma.integration.findUnique({
                where: { id: "trendyol-default" }
            });

            if (existingIntegration && existingIntegration.credentialsEncrypted) {
                try {
                    const decryptedPayload = decrypt(existingIntegration.credentialsEncrypted);
                    const oldCreds = JSON.parse(decryptedPayload);

                    if (apiKey.includes("***")) finalApiKey = oldCreds.apiKey;
                    if (apiSecret.includes("***")) finalApiSecret = oldCreds.apiSecret;
                } catch (error) {
                    console.warn("Test connection: Credential decryption failed", error);
                }
            }
        }

        const service = new TrendyolService();
        const isValid = await service.validateCredentials(supplierId, finalApiKey, finalApiSecret);

        if (isValid) {
            return NextResponse.json({ success: true, message: "Bağlantı başarılı" });
        } else {
            return NextResponse.json(
                { success: false, error: "Trendyol API bağlantısı kurulamadı. Bilgileri veya IP iznini kontrol edin." },
                { status: 400 }
            );
        }

    } catch (error) {
        console.error("Test connection error:", error);
        return NextResponse.json(
            { error: "Bağlantı testi sırasında sunucu hatası" },
            { status: 500 }
        );
    }
}
