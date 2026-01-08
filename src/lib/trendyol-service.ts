import prisma from "@/lib/db";
import { decrypt } from "@/lib/encryption";

const TRENDYOL_API_BASE = "https://api.trendyol.com/sapigw";

interface TrendyolCredentials {
    supplierId: string;
    apiKey: string;
    apiSecret: string;
}

export class TrendyolService {
    private creds: TrendyolCredentials | null = null;
    private authHeader: string = "";

    constructor() { }

    async initialize() {
        const integration = await prisma.integration.findFirst({
            where: { provider: "trendyol" }
        });

        if (!integration || !integration.credentialsEncrypted) {
            console.warn("Trendyol API bilgileri eksik (Integration tablosu).");
            return;
        }

        try {
            // Yeni format: Encrypted string contains JSON { apiKey, apiSecret }
            // Veya eski formatla karışık olabilir, o yüzden try-catch ile kontrol etmeliyiz.
            // Ancak şu an sistemimiz sadece yeni formatı destekliyor: encrypt(JSON)

            const decryptedPayload = decrypt(integration.credentialsEncrypted);
            const { apiKey, apiSecret } = JSON.parse(decryptedPayload);

            if (!integration.supplierId || !apiKey || !apiSecret) {
                console.warn("Trendyol API kimlik bilgileri eksik (JSON parse sonrası).");
                return;
            }

            this.creds = { supplierId: integration.supplierId, apiKey, apiSecret };
            this.authHeader = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;
        } catch (error) {
            console.error("Credential decryption error:", error);
            // throw new Error("API şifreleri çözülemedi."); // Sessizce fail olmasını tercih ederiz, log basarız.
        }
    }

    /**
     * Trendyol'dan son siparişleri çek (CANLI)
     * @param limit Son kaç sipariş çekilecek
     */
    async fetchOrders(limit = 50) {
        if (!this.creds) await this.initialize();

        if (!this.creds) {
            // Demo verisi yok, sadece boş dönüyoruz. Kullanıcı giriş yapmalı.
            return [];
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 15); // Son 15 gün

        // Trendyol Orders API
        // Dokuman: https://developers.trendyol.com/en/orders-integration/get-orders
        const url = `${TRENDYOL_API_BASE}/suppliers/${this.creds.supplierId}/orders?status=Created,Picking,Invoiced,Shipped,Delivered,Cancelled,Returned&startDate=${startDate.getTime()}&size=${limit}&orderBy=LastModifiedDate&order=DESC`;

        try {
            const response = await fetch(url, {
                headers: {
                    "Authorization": this.authHeader,
                    "User-Agent": `${this.creds.supplierId} - SelfIntegration`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Trendyol API Hatası: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            const orders = data.content || [];

            // Trendyol API Response Mapping
            return orders.map((order: any) => ({
                orderNumber: order.orderNumber,
                orderDate: order.createdDate,
                status: order.status,
                totalPrice: order.totalAmount,
                grossPrice: order.grossAmount,
                customerFirstName: order.customerFirstName,
                customerLastName: order.customerLastName,
                cargoTrackingNumber: order.cargoTrackingNumber,
                cargoProvider: order.cargoProviderName,
                currencyCode: order.currencyCode,
                lines: (order.lines || []).map((line: any) => ({
                    quantity: line.quantity,
                    salesPrice: line.price,
                    merchantSku: line.merchantSku,
                    productName: line.productName,
                    sku: line.sku || line.merchantSku, // MerchantSku'yu SKU olarak kullanıyoruz
                    discount: line.discount,
                    vatBaseAmount: line.vatBaseAmount
                }))
            }));

        } catch (error) {
            console.error("Fetch orders error:", error);
            throw error;
        }
    }

    /**
     * Trendyol'dan ürünleri çek (Fiyat ve Stok) (CANLI)
     */
    async fetchProducts(page = 0, size = 50) {
        if (!this.creds) await this.initialize();
        if (!this.creds) return [];

        const url = `${TRENDYOL_API_BASE}/suppliers/${this.creds!.supplierId}/products?page=${page}&size=${size}`;

        try {
            const response = await fetch(url, {
                headers: {
                    "Authorization": this.authHeader,
                    "User-Agent": `${this.creds!.supplierId} - SelfIntegration`
                }
            });

            if (!response.ok) return [];

            const data = await response.json();
            return data.content || [];
        } catch (error) {
            console.error("Fetch products error:", error);
            return [];
        }
    }

    /**
     * Aktif promosyonları çek (CANLI)
     */
    async fetchPromotions() {
        if (!this.creds) await this.initialize();
        if (!this.creds) return [];

        const url = `${TRENDYOL_API_BASE}/suppliers/${this.creds!.supplierId}/promotions`;

        try {
            const response = await fetch(url, {
                headers: {
                    "Authorization": this.authHeader,
                    "User-Agent": `${this.creds!.supplierId} - SelfIntegration`
                }
            });

            if (!response.ok) return [];

            const data = await response.json();
            return data.content || [];
        } catch (error) {
            // console.warn("Promotions fetch error (non-critical):", error);
            return [];
        }
    }

    /**
     * Tek bir ürün için detaylı fiyat/kampanya bilgisi al
     * (CANLI) - Şimdilik sadece placeholder, çünkü detaylı product content API entegrasyonu yapılmadı.
     */
    async getProductMarketIntelligence(barcode: string) {
        // Otomatik mock üretmek yerine, eğer veri çekilemiyorsa "Bilinmiyor" dönüyoruz.
        // İleride buraya Product Content API entegre edilecek.

        return {
            barcode,
            currentSalePrice: 0,
            promotions: {
                hasFlashSale: false,
                flashSalePrice: null,
                flashCommissionRate: null,
                hasCoupon: false,
                couponAmount: 0,
            }
        };
    }
    /**
     * Verilen kimlik bilgilerini test et (Kaydetmeden önce kontrol için)
     */
    async validateCredentials(supplierId: string, apiKey: string, apiSecret: string): Promise<boolean> {
        const testAuthHeader = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;
        // En hafif endpoint: Single product fetch veya boş search
        const url = `${TRENDYOL_API_BASE}/suppliers/${supplierId}/products?page=0&size=1`;

        try {
            const response = await fetch(url, {
                headers: {
                    "Authorization": testAuthHeader,
                    "User-Agent": `${supplierId} - SelfIntegration`
                }
            });
            return response.ok;
        } catch (error) {
            console.error("Validation error:", error);
            return false;
        }
    }
}
