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

    try {
        const response = await fetch(url, {
            headers: {
                "Authorization": authHeader,
                "User-Agent": `${supplierId} - SelfIntegration`
            }
        });

        const responseText = await response.text();
        let responseJson;
        try {
            responseJson = JSON.parse(responseText);
        } catch {
            responseJson = null;
        }

        return NextResponse.json({
            success: response.ok,
            status: response.status,
            statusText: response.statusText,
            url: url,
            authHeaderPreview: authHeader.substring(0, 20) + "...",
            userAgent: `${supplierId} - SelfIntegration`,
            responseBody: responseJson || responseText
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({
            success: false,
            error: errorMessage,
            url: url
        });
    }
}
