import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const supplierId = searchParams.get("supplierId");
    const apiKey = searchParams.get("apiKey");
    const apiSecret = searchParams.get("apiSecret");

    if (!supplierId || !apiKey || !apiSecret) {
        return NextResponse.json({
            error: "Missing parameters",
            usage: "/api/debug-trendyol?supplierId=XXX&apiKey=XXX&apiSecret=XXX"
        });
    }

    const authHeader = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;
    const url = `https://api.trendyol.com/sapigw/suppliers/${supplierId}/products?page=0&size=1`;

    // Trendyol'un beklediği User-Agent formatları
    const userAgentFormats = [
        `${supplierId} - SelfIntegration`,
        `${supplierId} - Misledi`,
        `${supplierId}-SelfIntegration`,
        `SelfIntegration-${supplierId}`,
    ];

    const results = [];

    for (const userAgent of userAgentFormats) {
        try {
            const response = await fetch(url, {
                headers: {
                    "Authorization": authHeader,
                    "User-Agent": userAgent,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            });

            const responseText = await response.text();
            let isJson = false;
            try {
                JSON.parse(responseText);
                isJson = true;
            } catch {
                isJson = false;
            }

            results.push({
                userAgent,
                status: response.status,
                success: response.ok,
                isJsonResponse: isJson,
                preview: responseText.substring(0, 200)
            });

            // Eğer başarılıysa, daha fazla denemeye gerek yok
            if (response.ok) {
                return NextResponse.json({
                    success: true,
                    workingUserAgent: userAgent,
                    status: response.status,
                    message: "Bağlantı başarılı! Bu User-Agent formatı çalışıyor."
                });
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            results.push({
                userAgent,
                error: errorMessage
            });
        }
    }

    return NextResponse.json({
        success: false,
        message: "Hiçbir User-Agent formatı çalışmadı",
        testedFormats: results,
        suggestion: "Trendyol destek ile iletişime geçip doğru User-Agent formatını öğrenin veya API anahtarlarınızı kontrol edin."
    });
}
