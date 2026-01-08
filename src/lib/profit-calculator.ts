/**
 * MISLEDI - Kâr Hesaplama Motoru
 * 
 * Bu dosya tüm kâr/zarar hesaplamalarını yapar.
 * Trendyol satışları için KDV hesabı dahil.
 */

export interface CostCardData {
    costPurchase: number;      // Ürün alış maliyeti (KDV dahil)
    costPackaging: number;     // Karton/paketleme maliyeti
    commissionPercent: number; // Trendyol komisyonu %
    influencerPercent: number; // Influencer komisyonu %
    shippingBase: number;      // Kargo baz ücreti (KDV hariç)
    serviceFeeBase: number;    // Trendyol hizmet bedeli (KDV hariç)
    kdvRate: number;           // KDV oranı % (genelde 20)
}

export interface ProfitCalculation {
    // Satış
    salePriceWithKdv: number;    // KDV dahil satış fiyatı
    kdvAmount: number;           // KDV tutarı
    salePriceWithoutKdv: number; // KDV hariç satış fiyatı

    // Değişken Giderler
    trendyolCommission: number;  // Trendyol komisyonu ₺
    influencerCommission: number;// Influencer komisyonu ₺
    totalVariableCosts: number;  // Toplam değişken gider

    // Sabit Giderler
    productCost: number;         // Ürün maliyeti
    shippingWithKdv: number;     // Kargo (KDV dahil)
    packagingCost: number;       // Paketleme/karton
    serviceFeeWithKdv: number;   // Hizmet bedeli (KDV dahil)
    totalFixedCosts: number;     // Toplam sabit gider

    // Sonuç
    netProfit: number;           // Net kâr
    profitMargin: number;        // Kâr marjı %
    breakEvenPrice: number;      // Başabaş noktası (KDV dahil satış fiyatı)
}

export type ScenarioType = "NORMAL" | "DISCOUNT" | "FLASH" | "SHOCK_MIX";

export interface ScenarioResult extends ProfitCalculation {
    scenario: ScenarioType;
    label: string;
    description: string;
}

export interface SimulationParams {
    discountedPrice?: number;   // İndirimli fiyat (Süper Eko vb.)
    flashPrice?: number;        // Flaş indirim fiyatı
    couponAmount?: number;      // Satıcı kuponu (TL)
    flashCommission?: number;   // Flaşta komisyon oranı (daha düşük olabilir)
}

/**
 * Tek bir ürün için kâr hesaplama
 */
export function calculateProfit(
    salePriceWithKdv: number,
    costCard: CostCardData,
    overrideCommission?: number // Opsiyonel: Komisyonu ezmek için (Flaş vb.)
): ProfitCalculation {
    const kdvMultiplier = 1 + (costCard.kdvRate / 100);

    // 1. SATIŞ GELİRİ
    const kdvAmount = salePriceWithKdv - (salePriceWithKdv / kdvMultiplier);
    const salePriceWithoutKdv = salePriceWithKdv / kdvMultiplier;

    // 2. DEĞİŞKEN GİDERLER (KDV hariç satış üzerinden hesaplanır)
    const commissionRate = overrideCommission ?? costCard.commissionPercent;
    const trendyolCommission = salePriceWithoutKdv * (commissionRate / 100);
    const influencerCommission = salePriceWithoutKdv * (costCard.influencerPercent / 100);
    const totalVariableCosts = trendyolCommission + influencerCommission;

    // 3. SABİT GİDERLER
    const productCost = costCard.costPurchase;
    const shippingWithKdv = costCard.shippingBase * kdvMultiplier;
    const packagingCost = costCard.costPackaging;
    const serviceFeeWithKdv = costCard.serviceFeeBase * kdvMultiplier;
    const totalFixedCosts = productCost + shippingWithKdv + packagingCost + serviceFeeWithKdv;

    // 4. NET KÂR
    const netProfit = salePriceWithoutKdv - totalVariableCosts - totalFixedCosts;

    // 5. KÂR MARJI (%)
    const profitMargin = salePriceWithKdv > 0 ? (netProfit / salePriceWithKdv) * 100 : 0;

    // 6. BAŞABAŞ NOKTASI (minimum KDV dahil satış fiyatı)
    const totalCommissionPercent = (commissionRate + costCard.influencerPercent) / 100;
    const breakEvenWithoutKdv = totalFixedCosts / (1 - totalCommissionPercent);
    const breakEvenPrice = breakEvenWithoutKdv * kdvMultiplier;

    return {
        salePriceWithKdv,
        kdvAmount: Math.round(kdvAmount * 100) / 100,
        salePriceWithoutKdv: Math.round(salePriceWithoutKdv * 100) / 100,

        trendyolCommission: Math.round(trendyolCommission * 100) / 100,
        influencerCommission: Math.round(influencerCommission * 100) / 100,
        totalVariableCosts: Math.round(totalVariableCosts * 100) / 100,

        productCost,
        shippingWithKdv: Math.round(shippingWithKdv * 100) / 100,
        packagingCost,
        serviceFeeWithKdv: Math.round(serviceFeeWithKdv * 100) / 100,
        totalFixedCosts: Math.round(totalFixedCosts * 100) / 100,

        netProfit: Math.round(netProfit * 100) / 100,
        profitMargin: Math.round(profitMargin * 100) / 100,
        breakEvenPrice: Math.round(breakEvenPrice * 100) / 100,
    };
}

/**
 * 4'lü Senaryo Matrisi Hesaplama
 */
export function calculateScenarioMatrix(
    normalPrice: number,
    costCard: CostCardData,
    params: SimulationParams = {}
): Record<ScenarioType, ScenarioResult> {
    // 1. Normal Satış
    const normalCalc = calculateProfit(normalPrice, costCard);
    const normalScenario: ScenarioResult = {
        ...normalCalc,
        scenario: "NORMAL",
        label: "Normal Satış",
        description: "Standart liste fiyatı ve komisyon"
    };

    // 2. İndirimli Satış (Varsa kullanılır, yoksa Normal ile aynı)
    const discountPrice = params.discountedPrice ?? normalPrice;
    const discountCalc = calculateProfit(discountPrice, costCard);
    const discountScenario: ScenarioResult = {
        ...discountCalc,
        scenario: "DISCOUNT",
        label: "İndirimli Satış",
        description: params.discountedPrice ? "Süper Eko / Kampanyalı Fiyat" : "İndirim tanımlı değil"
    };

    // 3. Flaş Satış (Genelde daha düşük komisyon olur)
    const flashPrice = params.flashPrice ?? (normalPrice * 0.9); // Varsayılan %10 indirim
    const flashCommission = params.flashCommission ?? costCard.commissionPercent;
    const flashCalc = calculateProfit(flashPrice, costCard, flashCommission);
    const flashScenario: ScenarioResult = {
        ...flashCalc,
        scenario: "FLASH",
        label: "Flaş Satış",
        description: `Flaş Fiyatı + %${flashCommission} Komisyon`
    };

    // 4. Çakışma Senaryosu (Flaş + Kupon)
    // Kupon düşüldükten sonra kalan tutar üzerinden komisyon kesilir mi? 
    // MANTIKSAL DÜZELTME: Trendyol'da kupon satıcıdansa, komisyon brüt satıştan kesilir, kupon maliyeti net kârdan düşülür.
    // Bu yüzden burada calculateProfit'i çağırıp, SONUCUNDAN kuponu düşeceğiz.

    // Temel Flaş Hesabı (Komisyon brüt fiyattan)
    const shockCalcBase = calculateProfit(flashPrice, costCard, flashCommission);

    // Kuponu kârdan düş (Satıcı karşılıyorsa)
    const couponCost = params.couponAmount ?? 0;
    const shockNetProfit = shockCalcBase.netProfit - couponCost;

    // Marjı tekrar hesapla
    const shockMargin = flashPrice > 0 ? (shockNetProfit / flashPrice) * 100 : 0;

    const shockScenario: ScenarioResult = {
        ...shockCalcBase,
        netProfit: Math.round(shockNetProfit * 100) / 100,
        profitMargin: Math.round(shockMargin * 100) / 100,
        scenario: "SHOCK_MIX",
        label: "Çakışma (Flaş+Kupon)",
        description: "Flaş Fiyat + Satıcı Kuponu + İndirimler"
    };

    return {
        NORMAL: normalScenario,
        DISCOUNT: discountScenario,
        FLASH: flashScenario,
        SHOCK_MIX: shockScenario
    };
}

/**
 * Kâr durumunu belirle
 */
export function getProfitStatus(netProfit: number, profitMargin: number): {
    status: "PROFIT" | "LOW_MARGIN" | "LOSS";
    color: string;
    label: string;
} {
    if (netProfit < 0) {
        return { status: "LOSS", color: "text-red-400", label: "Zararda" };
    }
    if (profitMargin < 5) {
        return { status: "LOW_MARGIN", color: "text-amber-400", label: "Düşük Marj" };
    }
    return { status: "PROFIT", color: "text-emerald-400", label: "Kârlı" };
}

/**
 * Varsayılan maliyet kartı değerleri
 */
export const DEFAULT_COST_CARD: CostCardData = {
    costPurchase: 0,
    costPackaging: 12,        // Karton
    commissionPercent: 17,    // Trendyol komisyonu
    influencerPercent: 0,     // Influencer komisyonu (opsiyonel)
    shippingBase: 38.77,      // Kargo baz (KDV hariç)
    serviceFeeBase: 6.99,     // Hizmet bedeli (KDV hariç)
    kdvRate: 20,              // KDV oranı
};
