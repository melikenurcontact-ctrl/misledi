"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Calculator,
    Package,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Percent,
    DollarSign,
    ArrowRight,
    RefreshCw,
    ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TR, formatMoney, formatPercent } from "@/lib/constants";

interface Product {
    id: string;
    sku: string;
    title: string;
    salePrice: number;
    costCard: {
        costPurchase: number;
        costPackaging: number;
        commissionPercent: number;
        influencerPercent: number;
        shippingBase: number;
        serviceFeeBase: number;
        kdvRate: number;
    } | null;
}

interface SimulationResult {
    // Mevcut durum
    originalPrice: number;
    originalPriceWithoutKdv: number;
    originalProfit: number;
    originalMargin: number;

    // Yeni durum
    newPrice: number;
    newPriceWithoutKdv: number;
    newProfit: number;
    newMargin: number;

    // Değişim
    profitChange: number;
    marginChange: number;

    // Detaylar
    breakEvenPrice: number;
    trendyolCommission: number;
    influencerCommission: number;
    totalVariableCosts: number;
    totalFixedCosts: number;
    isLoss: boolean;
}

export default function SimulatePage() {
    // Products
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<string>("");
    const [showProductDropdown, setShowProductDropdown] = useState(false);

    // Temel Bilgiler
    const [sku, setSku] = useState("");
    const [currentPrice, setCurrentPrice] = useState<string>("189.99");

    // Maliyet Kartı Bilgileri
    const [purchaseCost, setPurchaseCost] = useState<string>("24");
    const [packagingCost, setPackagingCost] = useState<string>("12");
    const [commissionPercent, setCommissionPercent] = useState<string>("17");
    const [influencerPercent, setInfluencerPercent] = useState<string>("15");
    const [shippingBase, setShippingBase] = useState<string>("38.77");
    const [serviceFeeBase, setServiceFeeBase] = useState<string>("6.99");
    const [kdvRate, setKdvRate] = useState<string>("20");

    // Senaryo parametreleri
    const [discountPercent, setDiscountPercent] = useState<string>("0");
    const [discountAmount, setDiscountAmount] = useState<string>("0");
    const [newPriceOverride, setNewPriceOverride] = useState<string>("");

    // Sonuç
    const [result, setResult] = useState<SimulationResult | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const res = await fetch("/api/products");
                const data = await res.json();
                setProducts(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Products fetch error:", error);
            }
        };
        loadProducts();
    }, []);

    const handleSelectProduct = (product: Product) => {
        setSelectedProduct(product.id);
        setSku(product.sku);
        setCurrentPrice(product.salePrice.toString());
        if (product.costCard) {
            setPurchaseCost(product.costCard.costPurchase.toString());
            setPackagingCost(product.costCard.costPackaging.toString());
            setCommissionPercent(product.costCard.commissionPercent.toString());
            setInfluencerPercent(product.costCard.influencerPercent.toString());
            setShippingBase(product.costCard.shippingBase.toString());
            setServiceFeeBase(product.costCard.serviceFeeBase.toString());
            setKdvRate(product.costCard.kdvRate.toString());
        }
        setShowProductDropdown(false);
        setResult(null);
    };

    const calculateProfit = (salePriceWithKdv: number) => {
        const kdv = (parseFloat(kdvRate) || 20) / 100;
        const kdvMultiplier = 1 + kdv;

        // KDV hariç satış
        const salePriceWithoutKdv = salePriceWithKdv / kdvMultiplier;

        // Değişken giderler (KDV hariç satış üzerinden)
        const trendyolComm = salePriceWithoutKdv * ((parseFloat(commissionPercent) || 0) / 100);
        const influencerComm = salePriceWithoutKdv * ((parseFloat(influencerPercent) || 0) / 100);
        const totalVariable = trendyolComm + influencerComm;

        // Sabit giderler
        const productCost = parseFloat(purchaseCost) || 0;
        const shipping = (parseFloat(shippingBase) || 0) * kdvMultiplier;
        const packaging = parseFloat(packagingCost) || 0;
        const serviceFee = (parseFloat(serviceFeeBase) || 0) * kdvMultiplier;
        const totalFixed = productCost + shipping + packaging + serviceFee;

        // Net kâr
        const netProfit = salePriceWithoutKdv - totalVariable - totalFixed;
        const margin = salePriceWithKdv > 0 ? (netProfit / salePriceWithKdv) * 100 : 0;

        // Break-even
        const totalCommPercent = ((parseFloat(commissionPercent) || 0) + (parseFloat(influencerPercent) || 0)) / 100;
        const breakEvenWithoutKdv = totalFixed / (1 - totalCommPercent);
        const breakEvenPrice = breakEvenWithoutKdv * kdvMultiplier;

        return {
            salePriceWithoutKdv,
            netProfit,
            margin,
            breakEvenPrice,
            trendyolComm,
            influencerComm,
            totalVariable,
            totalFixed
        };
    };

    const handleCalculate = () => {
        setIsCalculating(true);

        const price = parseFloat(currentPrice) || 0;
        const discPct = (parseFloat(discountPercent) || 0) / 100;
        const discAmt = parseFloat(discountAmount) || 0;
        const priceOverride = parseFloat(newPriceOverride) || 0;

        // Yeni fiyatı hesapla
        let newPrice = price;
        if (priceOverride > 0) {
            newPrice = priceOverride;
        } else {
            newPrice = price * (1 - discPct) - discAmt;
        }

        // Orijinal ve yeni kâr hesaplama
        const original = calculateProfit(price);
        const newCalc = calculateProfit(newPrice);

        setTimeout(() => {
            setResult({
                originalPrice: price,
                originalPriceWithoutKdv: original.salePriceWithoutKdv,
                originalProfit: original.netProfit,
                originalMargin: original.margin,

                newPrice,
                newPriceWithoutKdv: newCalc.salePriceWithoutKdv,
                newProfit: newCalc.netProfit,
                newMargin: newCalc.margin,

                profitChange: newCalc.netProfit - original.netProfit,
                marginChange: newCalc.margin - original.margin,

                breakEvenPrice: newCalc.breakEvenPrice,
                trendyolCommission: newCalc.trendyolComm,
                influencerCommission: newCalc.influencerComm,
                totalVariableCosts: newCalc.totalVariable,
                totalFixedCosts: newCalc.totalFixed,
                isLoss: newCalc.netProfit < 0,
            });
            setIsCalculating(false);
        }, 300);
    };

    const handleReset = () => {
        setDiscountPercent("0");
        setDiscountAmount("0");
        setNewPriceOverride("");
        setResult(null);
    };

    const selectedProductData = products.find(p => p.id === selectedProduct);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">{TR.simulation}</h1>
                <p className="text-slate-400 mt-1">
                    İndirim veya fiyat değişikliğinin kâr üzerindeki etkisini simüle edin
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-4">
                    {/* Ürün Seçimi */}
                    <Card className="bg-slate-900/50 border-slate-800/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base text-white flex items-center gap-2">
                                <Package className="w-4 h-4 text-cyan-400" />
                                Ürün Seç
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowProductDropdown(!showProductDropdown)}
                                    className="w-full justify-between bg-slate-800/50 border-slate-700 text-white"
                                >
                                    {selectedProductData
                                        ? `${selectedProductData.sku} - ${selectedProductData.title.substring(0, 25)}...`
                                        : "Ürün seçin veya manuel girin"
                                    }
                                    <ChevronDown className={`w-4 h-4 transition-transform ${showProductDropdown ? "rotate-180" : ""}`} />
                                </Button>
                                {showProductDropdown && (
                                    <div className="absolute z-10 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                        {products.length === 0 ? (
                                            <div className="p-3 text-sm text-slate-500">Ürün bulunamadı</div>
                                        ) : (
                                            products.map((product) => (
                                                <button
                                                    key={product.id}
                                                    onClick={() => handleSelectProduct(product)}
                                                    className="w-full text-left p-3 hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0"
                                                >
                                                    <div className="flex justify-between">
                                                        <span className="font-mono text-xs text-cyan-400">{product.sku}</span>
                                                        <span className="text-xs text-slate-500">{formatMoney(product.salePrice)}</span>
                                                    </div>
                                                    <div className="text-sm text-white truncate">{product.title}</div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Maliyet Kartı */}
                    <Card className="bg-slate-900/50 border-slate-800/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base text-white flex items-center gap-2">
                                <Calculator className="w-4 h-4 text-amber-400" />
                                Maliyet Kartı
                            </CardTitle>
                            <CardDescription className="text-slate-400 text-xs">
                                Trendyol kâr hesaplama formülü
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-slate-400 text-xs">SKU</Label>
                                    <Input
                                        value={sku}
                                        onChange={(e) => setSku(e.target.value)}
                                        placeholder="Opsiyonel"
                                        className="bg-slate-800/50 border-slate-700 text-white h-9 text-sm"
                                    />
                                </div>
                                <div>
                                    <Label className="text-slate-400 text-xs">Satış Fiyatı (KDV dahil)</Label>
                                    <Input
                                        type="number"
                                        value={currentPrice}
                                        onChange={(e) => setCurrentPrice(e.target.value)}
                                        className="bg-slate-800/50 border-slate-700 text-white h-9 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-slate-800 pt-3">
                                <p className="text-xs text-slate-500 mb-2">Sabit Giderler</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-slate-400 text-xs">Alış Maliyeti ₺</Label>
                                        <Input
                                            type="number"
                                            value={purchaseCost}
                                            onChange={(e) => setPurchaseCost(e.target.value)}
                                            className="bg-slate-800/50 border-slate-700 text-white h-9 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-slate-400 text-xs">Karton/Paket ₺</Label>
                                        <Input
                                            type="number"
                                            value={packagingCost}
                                            onChange={(e) => setPackagingCost(e.target.value)}
                                            className="bg-slate-800/50 border-slate-700 text-white h-9 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-slate-400 text-xs">Kargo Baz (KDV hariç)</Label>
                                        <Input
                                            type="number"
                                            value={shippingBase}
                                            onChange={(e) => setShippingBase(e.target.value)}
                                            className="bg-slate-800/50 border-slate-700 text-white h-9 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-slate-400 text-xs">Hizmet Bedeli (KDV hariç)</Label>
                                        <Input
                                            type="number"
                                            value={serviceFeeBase}
                                            onChange={(e) => setServiceFeeBase(e.target.value)}
                                            className="bg-slate-800/50 border-slate-700 text-white h-9 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-800 pt-3">
                                <p className="text-xs text-slate-500 mb-2">Komisyonlar (KDV hariç satış üzerinden)</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <Label className="text-slate-400 text-xs">Trendyol %</Label>
                                        <Input
                                            type="number"
                                            value={commissionPercent}
                                            onChange={(e) => setCommissionPercent(e.target.value)}
                                            className="bg-slate-800/50 border-slate-700 text-white h-9 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-slate-400 text-xs">Influencer %</Label>
                                        <Input
                                            type="number"
                                            value={influencerPercent}
                                            onChange={(e) => setInfluencerPercent(e.target.value)}
                                            className="bg-slate-800/50 border-slate-700 text-white h-9 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-slate-400 text-xs">KDV %</Label>
                                        <Input
                                            type="number"
                                            value={kdvRate}
                                            onChange={(e) => setKdvRate(e.target.value)}
                                            className="bg-slate-800/50 border-slate-700 text-white h-9 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Senaryo */}
                    <Card className="bg-slate-900/50 border-slate-800/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base text-white flex items-center gap-2">
                                <Percent className="w-4 h-4 text-purple-400" />
                                Senaryo
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <Label className="text-slate-400 text-xs">İndirim %</Label>
                                    <Input
                                        type="number"
                                        value={discountPercent}
                                        onChange={(e) => {
                                            setDiscountPercent(e.target.value);
                                            setNewPriceOverride("");
                                        }}
                                        className="bg-slate-800/50 border-slate-700 text-white h-9 text-sm"
                                    />
                                </div>
                                <div>
                                    <Label className="text-slate-400 text-xs">İndirim ₺</Label>
                                    <Input
                                        type="number"
                                        value={discountAmount}
                                        onChange={(e) => {
                                            setDiscountAmount(e.target.value);
                                            setNewPriceOverride("");
                                        }}
                                        className="bg-slate-800/50 border-slate-700 text-white h-9 text-sm"
                                    />
                                </div>
                                <div>
                                    <Label className="text-slate-400 text-xs">veya Yeni Fiyat</Label>
                                    <Input
                                        type="number"
                                        value={newPriceOverride}
                                        onChange={(e) => {
                                            setNewPriceOverride(e.target.value);
                                            if (e.target.value) {
                                                setDiscountPercent("0");
                                                setDiscountAmount("0");
                                            }
                                        }}
                                        placeholder="₺"
                                        className="bg-slate-800/50 border-slate-700 text-white h-9 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    onClick={handleCalculate}
                                    disabled={isCalculating}
                                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 h-10"
                                >
                                    {isCalculating ? (
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Calculator className="w-4 h-4 mr-2" />
                                    )}
                                    {TR.calculate}
                                </Button>
                                <Button variant="outline" onClick={handleReset} className="bg-slate-800/50 border-slate-700 text-slate-300 h-10">
                                    Sıfırla
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Results Section */}
                <div className="space-y-4">
                    {result ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-4"
                        >
                            {/* Loss Warning */}
                            {result.isLoss && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                                    <Card className="bg-red-500/10 border-red-500/30">
                                        <CardContent className="p-4 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                                                <AlertTriangle className="w-5 h-5 text-red-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-red-400">{TR.warning_loss}</h3>
                                                <p className="text-sm text-red-300/80">
                                                    Bu fiyatla satış yaparsanız adet başı {formatMoney(Math.abs(result.newProfit))} zarar edersiniz.
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}

                            {/* Price Comparison */}
                            <Card className="bg-slate-900/50 border-slate-800/50 overflow-hidden">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="text-center flex-1">
                                            <p className="text-xs text-slate-400 mb-1">Mevcut Fiyat</p>
                                            <p className="text-xl font-bold text-white">{formatMoney(result.originalPrice)}</p>
                                            <p className="text-xs text-slate-500">KDV hariç: {formatMoney(result.originalPriceWithoutKdv)}</p>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-cyan-400" />
                                        <div className="text-center flex-1">
                                            <p className="text-xs text-slate-400 mb-1">Yeni Fiyat</p>
                                            <p className={`text-xl font-bold ${result.newPrice < result.originalPrice ? "text-amber-400" : "text-emerald-400"}`}>
                                                {formatMoney(result.newPrice)}
                                            </p>
                                            <p className="text-xs text-slate-500">KDV hariç: {formatMoney(result.newPriceWithoutKdv)}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Profit Cards */}
                            <div className="grid grid-cols-2 gap-3">
                                <Card className={result.newProfit >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            {result.newProfit >= 0 ? (
                                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                                            ) : (
                                                <TrendingDown className="w-4 h-4 text-red-400" />
                                            )}
                                            <span className="text-xs text-slate-400">Net Kâr</span>
                                        </div>
                                        <p className={`text-xl font-bold ${result.newProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                            {formatMoney(result.newProfit)}
                                        </p>
                                        <p className={`text-xs mt-1 ${result.profitChange >= 0 ? "text-emerald-400/70" : "text-red-400/70"}`}>
                                            {result.profitChange >= 0 ? "+" : ""}{formatMoney(result.profitChange)} değişim
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-slate-800/50 border-slate-700/50">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Percent className="w-4 h-4 text-cyan-400" />
                                            <span className="text-xs text-slate-400">Marj</span>
                                        </div>
                                        <p className={`text-xl font-bold ${result.newMargin >= 10 ? "text-emerald-400" : result.newMargin >= 5 ? "text-amber-400" : "text-red-400"}`}>
                                            {formatPercent(result.newMargin)}
                                        </p>
                                        <p className={`text-xs mt-1 ${result.marginChange >= 0 ? "text-emerald-400/70" : "text-red-400/70"}`}>
                                            {result.marginChange >= 0 ? "+" : ""}{formatPercent(result.marginChange)} değişim
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Cost Breakdown */}
                            <Card className="bg-slate-900/50 border-slate-800/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm text-white">Maliyet Dağılımı</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between text-slate-400">
                                            <span>Trendyol Komisyonu ({commissionPercent}%)</span>
                                            <span className="text-white">{formatMoney(result.trendyolCommission)}</span>
                                        </div>
                                        {parseFloat(influencerPercent) > 0 && (
                                            <div className="flex justify-between text-slate-400">
                                                <span>Influencer Komisyonu ({influencerPercent}%)</span>
                                                <span className="text-white">{formatMoney(result.influencerCommission)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-2">
                                            <span>Toplam Değişken Gider</span>
                                            <span className="text-amber-400">{formatMoney(result.totalVariableCosts)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-400">
                                            <span>Toplam Sabit Gider</span>
                                            <span className="text-amber-400">{formatMoney(result.totalFixedCosts)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Break-even */}
                            <Card className="bg-slate-900/50 border-slate-800/50">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                                <DollarSign className="w-5 h-5 text-amber-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-400">{TR.break_even}</p>
                                                <p className="text-xs text-slate-500">Bu fiyatın altına inersen zarar</p>
                                            </div>
                                        </div>
                                        <p className="text-xl font-bold text-amber-400">{formatMoney(result.breakEvenPrice)}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="text-center">
                                <p className="text-xs text-slate-600">
                                    ⚠️ Bu simülasyon gerçek veriyi değiştirmez. Sadece hesaplama yapar.
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <Card className="bg-slate-900/50 border-slate-800/50">
                            <CardContent className="py-16 text-center">
                                <Calculator className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-slate-300 mb-2">Hesaplama Bekliyor</h3>
                                <p className="text-slate-500 text-sm">
                                    Soldaki bilgileri girdikten sonra &quot;Hesapla&quot; butonuna tıklayın
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
