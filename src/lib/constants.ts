// MISLEDI - Sabit Değerler ve Türkçe Metinler

export const APP_NAME = "Misledi";
export const APP_DESCRIPTION = "Trendyol Satıcı Operasyon Yönetim Sistemi";

// Maksimum kullanıcı sayısı
export const MAX_USERS = 3;

// Para formatı
export const CURRENCY = "₺";
export const LOCALE = "tr-TR";

// Uyarı türleri
export const ALERT_TYPES = {
    LOSS_NOW: "LOSS_NOW",
    BELOW_BREAK_EVEN: "BELOW_BREAK_EVEN",
    LOW_MARGIN: "LOW_MARGIN",
    MISSING_COST: "MISSING_COST",
} as const;

// Uyarı öncelikleri
export const ALERT_SEVERITY = {
    INFO: "INFO",
    WARNING: "WARNING",
    CRITICAL: "CRITICAL",
} as const;

// Kargo modelleri
export const SHIPPING_MODELS = {
    FIXED_PER_ORDER: "FIXED_PER_ORDER",
    FIXED_PER_UNIT: "FIXED_PER_UNIT",
} as const;

// Türkçe metinler
export const TR = {
    // Genel
    app_name: "Misledi",
    app_tagline: "Yapmadan Önce Bakılan Yer",

    // Auth
    login: "Giriş Yap",
    logout: "Çıkış Yap",
    email: "E-posta",
    password: "Şifre",
    remember_me: "Beni Hatırla",
    forgot_password: "Şifremi Unuttum",
    login_error: "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.",

    // Dashboard
    dashboard: "Kontrol Paneli",
    today: "Bugün",
    last_7_days: "Son 7 Gün",
    last_30_days: "Son 30 Gün",
    net_profit: "Net Kâr",
    total_revenue: "Toplam Ciro",
    total_commission: "Toplam Komisyon",
    total_shipping: "Toplam Kargo",
    products_in_loss: "Zarardaki Ürünler",
    products_missing_cost: "Maliyet Eksik",

    // Ürünler, Siparişler
    orders: "Siparişler",
    order: "Sipariş",
    products: "Ürünler",
    product: "Ürün",
    sku: "SKU",
    barcode: "Barkod",
    title: "Ürün Adı",
    sale_price: "Satış Fiyatı",
    list_price: "Liste Fiyatı",
    stock: "Stok",
    commission: "Komisyon",
    estimated_profit: "Tahmini Kâr",
    margin: "Marj",

    // Maliyet Kartı
    cost_card: "Maliyet Kartı",
    purchase_cost: "Alış Maliyeti",
    packaging_cost: "Paketleme Maliyeti",
    shipping_cost: "Kargo Maliyeti",
    commission_percent: "Komisyon (%)",

    // Etiketler
    label_loss: "ZARARDA",
    label_low_margin: "DÜŞÜK MARJ",
    label_missing_cost: "MALİYET EKSİK",
    label_flash_ready: "FLAŞA UYGUN",
    label_risky: "RİSKLİ",
    label_money_burner: "PARA YAKIYOR",

    // Uyarılar
    alerts: "Uyarılar",
    alert_loss_now: "Bu ürün şu an zarar ediyor",
    alert_below_break_even: "Satış fiyatı zararsız fiyatın altında",
    alert_low_margin: "Marj çok düşük",
    alert_missing_cost: "Maliyet kartı eksik",

    // Senaryo
    simulation: "Senaryo Simülasyonu",
    discount_percent: "İndirim (%)",
    discount_amount: "İndirim (TL)",
    new_price: "Yeni Fiyat",
    calculate: "Hesapla",
    break_even: "Zararsız Fiyat",
    profit_change: "Kâr Değişimi",
    warning_loss: "Bu senaryo zarar ettirir!",

    // Ayarlar
    settings: "Ayarlar",
    default_commission: "Varsayılan Komisyon (%)",
    default_shipping: "Varsayılan Kargo (TL)",
    margin_threshold: "Düşük Marj Eşiği (%)",

    // Sync
    sync: "Senkronizasyon",
    last_sync: "Son Senkron",
    sync_now: "Şimdi Senkronize Et",
    sync_error: "Senkronizasyon hatası",

    // Aktivite Log
    audit_log: "Aktivite Geçmişi",
    who: "Kim",
    what: "Ne",
    when: "Ne Zaman",

    // Genel
    save: "Kaydet",
    cancel: "İptal",
    delete: "Sil",
    edit: "Düzenle",
    view: "Görüntüle",
    search: "Ara",
    filter: "Filtrele",
    loading: "Yükleniyor...",
    no_data: "Veri bulunamadı",
    error: "Hata",
    success: "Başarılı",
    confirm: "Onayla",

    // Formatlar
    format_currency: (value: number) => `${CURRENCY}${value.toLocaleString(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    format_percent: (value: number) => `%${value.toFixed(2)}`,
    format_date: (date: Date) => date.toLocaleDateString(LOCALE),
    format_datetime: (date: Date) => date.toLocaleString(LOCALE),
};

// Para formatı helper
export function formatMoney(value: number): string {
    const formatted = Math.abs(value).toLocaleString(LOCALE, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return value < 0 ? `-${CURRENCY}${formatted}` : `${CURRENCY}${formatted}`;
}

// Yüzde formatı helper
export function formatPercent(value: number): string {
    return `%${value.toFixed(2)}`;
}
