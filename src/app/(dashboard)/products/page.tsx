"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Package,
    Search,
    Plus,
    ChevronRight,
    TrendingDown,
    AlertTriangle,
    Box,
    RefreshCw,
    X,
    Save,
    Calculator,
    Zap,
    Ticket,
    ArrowRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TR, formatMoney, formatPercent } from "@/lib/constants";

// Tipler
interface Product {
    id: string;
    sku: string;
    title: string;
    salePrice: number;
    stock: number;
    estimatedProfit: number | null;
    marginPercent: number | null;
    status: "profit" | "loss" | "low_margin" | "missing_cost";
    image: string | null;
}

interface ScenarioResult {
    scenario: "NORMAL" | "DISCOUNT" | "FLASH" | "SHOCK_MIX";
    label: string;
    description: string;
    salePriceWithKdv: number;
    netProfit: number;
    profitMargin: number;
    totalVariableCosts: number;
    totalFixedCosts: number;
    influencerCommission: number;
    trendyolCommission: number;
    productCost: number;
}

interface AnalysisResult {
    product: {
        id: string;
        title: string;
        sku: string;
    };
    marketData: {
        currentSalePrice: number;
        promotions: {
            hasFlashSale: boolean;
            flashSalePrice: number | null;
            flashCommissionRate: number | null;
            hasCoupon: boolean;
            couponAmount: number | null;
        };
    };
    matrix: Record<string, ScenarioResult>;
}

const statusBadges = {
    profit: { label: "KÂRLI", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    loss: { label: "ZARARDA", color: "bg-red-500/10 text-red-400 border-red-500/20" },
    low_margin: { label: "DÜŞÜK MARJ", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    missing_cost: { label: "MALİYET EKSİK", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
};

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string | null>(null);

    // Analysis Modal State
    const [analyzingProduct, setAnalyzingProduct] = useState<Product | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/products");
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Products fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const openAnalysisModal = async (product: Product) => {
        setAnalyzingProduct(product);
        setIsAnalyzing(true);
        setAnalysisResult(null);

        try {
            // "Otomatik Trendyol'dan Çek" simülasyonu
            const res = await fetch(`/api/products/analyze?id=${product.id}`);
            const data = await res.json();
            if (res.ok) {
                setAnalysisResult(data);
            }
        } catch (error) {
            console.error("Analysis error:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const closeAnalysisModal = () => {
        setAnalyzingProduct(null);
        setAnalysisResult(null);
    };

    const filteredProducts = products.filter((product) => {
        const matchesSearch =
            product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = !filterStatus || product.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const stats = {
        total: products.length,
        inLoss: products.filter((p) => p.status === "loss").length,
        lowMargin: products.filter((p) => p.status === "low_margin").length,
        missingCost: products.filter((p) => p.status === "missing_cost").length,
    };

    // Senaryo Kartı Bileşeni
    const ScenarioCard = ({ result, isHighlight = false }: { result: ScenarioResult; isHighlight?: boolean }) => {
        const isProfit = result.netProfit > 0;
        const colorClass = isProfit ? "text-emerald-400" : "text-red-400";
        const bgClass = isProfit ? "bg-emerald-500/5" : "bg-red-500/5";
        const borderClass = isProfit ? "border-emerald-500/20" : "border-red-500/20";

        // Flaş veya Şok senaryolarda özel ikon
        const Icon = result.scenario === "FLASH" ? Zap : result.scenario === "SHOCK_MIX" ? AlertTriangle : Box;

        return (
            <div className={`rounded-xl border p-4 ${isHighlight ? borderClass + " " + bgClass + " ring-1 ring-inset " + (isProfit ? "ring-emerald-500/20" : "ring-red-500/20") : "border-slate-800 bg-slate-900/50"}`}>
                <div className="flex items-center gap-2 mb-3">
                    <div className={`p-1.5 rounded-md ${isHighlight ? bgClass : "bg-slate-800"}`}>
                        <Icon className={`w-4 h-4 ${isHighlight ? colorClass : "text-slate-400"}`} />
                    </div>
                    <div>
                        <h3 className={`text-sm font-medium ${isHighlight ? "text-white" : "text-slate-300"}`}>{result.label}</h3>
                        <p className="text-[10px] text-slate-500">{result.description}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-baseline">
                        <span className="text-xs text-slate-400">Satış Fiyatı</span>
                        <span className="text-sm font-medium text-white">{formatMoney(result.salePriceWithKdv)}</span>
                    </div>

                    <div className="flex justify-between items-baseline">
                        <span className="text-xs text-slate-400">Kesintiler</span>
                        <span className="text-xs text-slate-300">
                            -{formatMoney(result.totalVariableCosts + result.totalFixedCosts)}
                        </span>
                    </div>

                    <div className="h-px bg-slate-700/50 my-2" />

                    <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-slate-300">NET SONUÇ</span>
                        <div className="text-right">
                            <span className={`text-lg font-bold ${colorClass}`}>
                                {formatMoney(result.netProfit)}
                            </span>
                            <div className={`text-[10px] ${isProfit ? "text-emerald-500/70" : "text-red-500/70"}`}>
                                %{formatPercent(result.profitMargin)} Marj
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">{TR.products}</h1>
                    <p className="text-slate-400 mt-1">Trendyol Fiyatlandırma & Promosyon Aklı</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={async () => {
                            setIsLoading(true);
                            try {
                                const res = await fetch("/api/products/sync", { method: "POST" });
                                if (res.ok) {
                                    await fetchProducts(); // Listeyi güncelle
                                } else {
                                    alert("Ürünler çekilemedi. API ayarlarını kontrol edin.");
                                }
                            } catch (e) {
                                console.error(e);
                                alert("Bir hata oluştu.");
                            } finally {
                                setIsLoading(false);
                            }
                        }}
                        disabled={isLoading}
                        variant="outline"
                        className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Trendyol'dan Çek
                    </Button>
                    <Button
                        onClick={fetchProducts}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                        Yenile
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* ... (Stats Cards similar to before but updated UI) ... */}
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                        <Package className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Toplam Ürün</p>
                        <p className="text-2xl font-bold text-white">{stats.total}</p>
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <TrendingDown className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Zararda</p>
                        <p className="text-2xl font-bold text-red-400">{stats.inLoss}</p>
                    </div>
                </div>
                {/* ... More stats ... */}
            </div>

            {/* Products Table */}
            <Card className="bg-slate-900/50 border-slate-800/50 overflow-hidden">
                <CardHeader className="border-b border-slate-800/50">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-white">Ürün Listesi</CardTitle>
                        {/* Search Input */}
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Ara..."
                                className="pl-9 h-9 bg-slate-800 border-slate-700 text-xs"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full">
                        <thead className="bg-slate-800/30 text-xs text-slate-400 uppercase font-medium">
                            <tr>
                                <th className="text-left p-4">SKU / Ürün</th>
                                <th className="text-right p-4">Satış Fiyatı</th>
                                <th className="text-right p-4">Kâr Durumu</th>
                                <th className="text-center p-4">Analiz</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/30">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-white font-medium">{product.title}</span>
                                            <span className="text-xs text-slate-500 font-mono">{product.sku}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right text-white font-mono">
                                        {formatMoney(product.salePrice)}
                                    </td>
                                    <td className="p-4 text-right">
                                        {product.estimatedProfit !== null ? (
                                            <div className="flex flex-col items-end">
                                                <span className={`text-sm font-bold ${product.estimatedProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                                    {formatMoney(product.estimatedProfit)}
                                                </span>
                                                <span className="text-[10px] text-slate-500">
                                                    %{formatPercent(product.marginPercent ?? 0)}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-500">Hesaplanmıyor</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openAnalysisModal(product)}
                                            className="bg-slate-800 border-slate-700 text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/50"
                                        >
                                            <Calculator className="w-4 h-4 mr-2" />
                                            Analiz Et
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* Analysis Modal (Fiyatlandırma Matrisi) */}
            <AnimatePresence>
                {analyzingProduct && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-cyan-900/10"
                        >
                            <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
                                <div>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-amber-400" />
                                        Fiyatlandırma & Promosyon Aklı
                                    </h2>
                                    <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded bg-slate-800 text-white font-mono text-xs">{analyzingProduct.sku}</span>
                                        {analyzingProduct.title}
                                    </p>
                                </div>
                                <button onClick={closeAnalysisModal} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>

                            <div className="p-6">
                                {isAnalyzing ? (
                                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                        <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                                        <p className="text-slate-400 animate-pulse">Trendyol verileri çekiliyor ve analiz ediliyor...</p>
                                    </div>
                                ) : analysisResult ? (
                                    <div className="space-y-8">
                                        {/* Market Info Alert */}
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm">
                                            <RefreshCw className="w-4 h-4" />
                                            <span>Veriler Trendyol API üzerinden anlık olarak çekildi. (Otomatik Mod)</span>
                                        </div>

                                        {/* 4-Column Matrix */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <ScenarioCard result={analysisResult.matrix.NORMAL} />
                                            <ScenarioCard result={analysisResult.matrix.DISCOUNT} />
                                            <ScenarioCard result={analysisResult.matrix.FLASH} isHighlight={true} />
                                            <ScenarioCard result={analysisResult.matrix.SHOCK_MIX} isHighlight={true} />
                                        </div>

                                        {/* Detail Breakdown (Tabular) */}
                                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                                            <div className="px-6 py-4 border-b border-slate-800">
                                                <h3 className="font-semibold text-white">Detaylı Kırılım Hesaplaması</h3>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="bg-slate-800/30 text-left text-xs text-slate-400 uppercase">
                                                            <th className="p-4">Kalem</th>
                                                            <th className="p-4 text-right">Normal</th>
                                                            <th className="p-4 text-right text-amber-400">Flaş Satış</th>
                                                            <th className="p-4 text-right text-red-400">Çakışma (En Kötü)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-800/30 text-slate-300">
                                                        <tr>
                                                            <td className="p-4 font-medium text-white">Satış Fiyatı (KDV Dahil)</td>
                                                            <td className="p-4 text-right">{formatMoney(analysisResult.matrix.NORMAL.salePriceWithKdv)}</td>
                                                            <td className="p-4 text-right font-medium">{formatMoney(analysisResult.matrix.FLASH.salePriceWithKdv)}</td>
                                                            <td className="p-4 text-right font-medium">{formatMoney(analysisResult.matrix.SHOCK_MIX.salePriceWithKdv)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="p-4">Trendyol Komisyonu</td>
                                                            <td className="p-4 text-right text-red-300">-{formatMoney(analysisResult.matrix.NORMAL.trendyolCommission)}</td>
                                                            <td className="p-4 text-right text-red-300">-{formatMoney(analysisResult.matrix.FLASH.trendyolCommission)}</td>
                                                            <td className="p-4 text-right text-red-300">-{formatMoney(analysisResult.matrix.SHOCK_MIX.trendyolCommission)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="p-4">Sabit Giderler (Kargo+Hizmet)</td>
                                                            <td className="p-4 text-right text-red-300">-{formatMoney(analysisResult.matrix.NORMAL.totalFixedCosts - analysisResult.matrix.NORMAL.productCost)}</td>
                                                            <td className="p-4 text-right text-red-300">-{formatMoney(analysisResult.matrix.FLASH.totalFixedCosts - analysisResult.matrix.FLASH.productCost)}</td>
                                                            <td className="p-4 text-right text-red-300">-{formatMoney(analysisResult.matrix.SHOCK_MIX.totalFixedCosts - analysisResult.matrix.SHOCK_MIX.productCost)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="p-4">Ürün Alış Maliyeti</td>
                                                            <td className="p-4 text-right text-slate-500">-{formatMoney(analysisResult.matrix.NORMAL.productCost)}</td>
                                                            <td className="p-4 text-right text-slate-500">-{formatMoney(analysisResult.matrix.FLASH.productCost)}</td>
                                                            <td className="p-4 text-right text-slate-500">-{formatMoney(analysisResult.matrix.SHOCK_MIX.productCost)}</td>
                                                        </tr>
                                                        <tr className="bg-slate-800/50 font-bold">
                                                            <td className="p-4 text-white">NET KÂR / ZARAR</td>
                                                            <td className={`p-4 text-right ${analysisResult.matrix.NORMAL.netProfit > 0 ? "text-emerald-400" : "text-red-400"}`}>
                                                                {formatMoney(analysisResult.matrix.NORMAL.netProfit)}
                                                            </td>
                                                            <td className={`p-4 text-right ${analysisResult.matrix.FLASH.netProfit > 0 ? "text-emerald-400" : "text-red-400"}`}>
                                                                {formatMoney(analysisResult.matrix.FLASH.netProfit)}
                                                            </td>
                                                            <td className={`p-4 text-right ${analysisResult.matrix.SHOCK_MIX.netProfit > 0 ? "text-emerald-400" : "text-red-400"}`}>
                                                                {formatMoney(analysisResult.matrix.SHOCK_MIX.netProfit)}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        <p className="text-center text-xs text-slate-500 mt-6">
                                            * Bu hesaplamalar anlık Trendyol verileri ve sistemdeki maliyet kartı kullanılarak yapılmıştır. Kesin sonuçlar fatura döneminde farklılık gösterebilir.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-center text-red-400 py-10">
                                        Analiz verisi alınamadı.
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
