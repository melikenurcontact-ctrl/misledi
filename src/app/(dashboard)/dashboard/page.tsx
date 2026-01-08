"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    TrendingUp,
    TrendingDown,
    Package,
    AlertTriangle,
    DollarSign,
    Zap,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    Clock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TR, formatMoney, formatPercent } from "@/lib/constants";

interface DashboardData {
    netProfit: { value: number; change: number; period: string };
    revenue: { value: number; change: number; period: string };
    commission: { value: number; change: number; period: string };
    shipping: { value: number; change: number; period: string };
    productsInLoss: number;
    productsMissingCost: number;
    worstProducts: Array<{
        id: string;
        sku: string;
        title: string;
        loss: number;
        reason: string;
    }>;
    flashSaleRisks: Array<{
        id: string;
        sku: string;
        title: string;
        normalProfit: number;
        flashLoss: number;
    }>;
    totalProducts: number;
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/dashboard");
            const result = await res.json();
            setData(result);
        } catch (error) {
            console.error("Dashboard fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const stats = data || {
        netProfit: { value: 0, change: 0, period: "today" },
        revenue: { value: 0, change: 0, period: "today" },
        commission: { value: 0, change: 0, period: "today" },
        shipping: { value: 0, change: 0, period: "today" },
        productsInLoss: 0,
        productsMissingCost: 0,
        worstProducts: [],
        flashSaleRisks: [],
        totalProducts: 0
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">{TR.dashboard}</h1>
                    <p className="text-slate-400 mt-1">Genel bakış ve risk analizi</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={fetchDashboard}
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                        className="bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700"
                    >
                        {isLoading ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Yenile
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Net Profit Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm overflow-hidden h-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
                        <CardContent className="p-6 relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div className={`flex items-center gap-1 text-sm ${stats.netProfit.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                    {stats.netProfit.change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                    {formatPercent(Math.abs(stats.netProfit.change))}
                                </div>
                            </div>
                            <p className="text-sm text-slate-400">{TR.net_profit}</p>
                            <p className={`text-3xl font-bold mt-1 ${stats.netProfit.value >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {formatMoney(stats.netProfit.value)}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Revenue Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm overflow-hidden h-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent" />
                        <CardContent className="p-6 relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-cyan-400" />
                                </div>
                                <div className={`flex items-center gap-1 text-sm ${stats.revenue.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                    {stats.revenue.change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                    {formatPercent(Math.abs(stats.revenue.change))}
                                </div>
                            </div>
                            <p className="text-sm text-slate-400">{TR.total_revenue}</p>
                            <p className="text-3xl font-bold mt-1 text-white">
                                {formatMoney(stats.revenue.value)}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Products In Loss Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card className="bg-red-500/5 border-red-500/20 backdrop-blur-sm overflow-hidden h-full">
                        <CardContent className="p-6 relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                                    <TrendingDown className="w-6 h-6 text-red-400" />
                                </div>
                            </div>
                            <p className="text-sm text-slate-400">{TR.products_in_loss}</p>
                            <p className="text-3xl font-bold mt-1 text-red-400">
                                {stats.productsInLoss}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Missing Cost Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Card className="bg-amber-500/5 border-amber-500/20 backdrop-blur-sm overflow-hidden h-full">
                        <CardContent className="p-6 relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                    <Package className="w-6 h-6 text-amber-400" />
                                </div>
                            </div>
                            <p className="text-sm text-slate-400">{TR.products_missing_cost}</p>
                            <p className="text-3xl font-bold mt-1 text-amber-400">
                                {stats.productsMissingCost}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Lists Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 1. Flash Sale Risks (Riskli Ürünler) */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                    <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm h-full flex flex-col">
                        <CardHeader className="border-b border-slate-800/50 pb-4">
                            <CardTitle className="text-lg text-white flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-400" />
                                Flaş Satış Riski
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Normalde kârlı ama flaşa girerse (%10 indirimle) zarar edecekler.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4 flex-1">
                            {stats.flashSaleRisks.length === 0 ? (
                                <div className="text-center py-8 h-full flex flex-col items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                                        <TrendingUp className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <p className="text-slate-500 text-sm">
                                        {stats.totalProducts === 0
                                            ? "Ürün verisi bekleniyor..."
                                            : "Süper! Flaş riski taşıyan ürün yok."}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {stats.flashSaleRisks.map((product, index) => (
                                        <div key={product.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                                            <span className="text-xs font-bold text-amber-500/50 w-4">{index + 1}</span>

                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{product.title}</p>
                                                <p className="text-xs text-slate-500 font-mono">{product.sku}</p>
                                            </div>

                                            <div className="text-right flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="text-slate-400">Flaş:</span>
                                                    <span className="font-bold text-red-400">{formatMoney(product.flashLoss)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px]">
                                                    <span className="text-slate-500">Normal:</span>
                                                    <span className="text-emerald-500/70">{formatMoney(product.normalProfit)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* 2. Worst Products (Mevcut Zararlar) */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                    <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm h-full flex flex-col">
                        <CardHeader className="border-b border-slate-800/50 pb-4">
                            <CardTitle className="text-lg text-white flex items-center gap-2">
                                <TrendingDown className="w-5 h-5 text-red-400" />
                                Mevcut Zarardakiler
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Şu anki satış fiyatıyla zarar eden ürünler.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4 flex-1">
                            {stats.worstProducts.length === 0 ? (
                                <div className="text-center py-8 h-full flex flex-col items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                                        <Package className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <p className="text-slate-500 text-sm">
                                        Harika! Zararda ürün bulunmuyor.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {stats.worstProducts.map((product, index) => (
                                        <div key={product.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                                            <span className="text-xs font-bold text-red-500/50 w-4">{index + 1}</span>

                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{product.title}</p>
                                                <p className="text-xs text-red-400/70">{product.reason}</p>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-sm font-bold text-red-400">{formatMoney(product.loss)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

            </div>

            {/* Footer Note */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center py-6 text-xs text-slate-600 flex items-center justify-center gap-2"
            >
                <Clock className="w-3 h-3" />
                <span>Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}</span>
            </motion.div>
        </div>
    );
}
