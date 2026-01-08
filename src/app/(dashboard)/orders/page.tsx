"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    ShoppingBag,
    RefreshCw,
    Search,
    Filter,
    ChevronDown,
    MoreHorizontal,
    Package,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    Truck,
    Clock,
    XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TR, formatMoney, formatPercent } from "@/lib/constants";

// Types
interface Order {
    id: string;
    providerOrderId: string;
    orderDate: string;
    status: string;
    totalPrice: number;
    customerFirstName: string | null;
    customerLastName: string | null;
    cargoProvider: string | null;
    cargoTrackingNumber: string | null;
    orderLines: any[];
    analysis: {
        netProfit: number;
        totalCost: number;
        totalCommission: number;
    };
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/orders");
            const data = await res.json();
            setOrders(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Orders fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch("/api/orders/sync", { method: "POST" });
            const result = await res.json();
            if (result.success) {
                // Başarılıysa listeyi yenile
                await fetchOrders();
            } else {
                alert("Senkronizasyon hatası: " + result.error);
            }
        } catch (error) {
            console.error("Sync error:", error);
            alert("Senkronizasyon sırasında hata oluştu.");
        } finally {
            setIsSyncing(false);
        }
    };

    // Filter logic
    const filteredOrders = orders.filter(order =>
        order.providerOrderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customerFirstName && order.customerFirstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.customerLastName && order.customerLastName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Delivered": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
            case "Shipped": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
            case "Cancelled": return "text-red-400 bg-red-500/10 border-red-500/20";
            case "Returned": return "text-red-400 bg-red-500/10 border-red-500/20";
            case "Created": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
            default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "Delivered": return <CheckCircle className="w-3 h-3" />;
            case "Shipped": return <Truck className="w-3 h-3" />;
            case "Cancelled": return <XCircle className="w-3 h-3" />;
            case "Returned": return <TrendingDown className="w-3 h-3" />;
            default: return <Clock className="w-3 h-3" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ShoppingBag className="w-6 h-6 text-cyan-400" />
                        {TR.orders}
                    </h1>
                    <p className="text-slate-400 mt-1">Trendyol siparişleri ve kârlılık analizi</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                        {isSyncing ? "Çekiliyor..." : "Trendyol'dan Çek"}
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800/50 backdrop-blur-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                        placeholder="Sipariş No veya Müşteri ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-slate-950 border-slate-800 focus:border-cyan-500/50"
                    />
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800/50">
                            <tr>
                                <th className="px-6 py-3 font-medium">Sipariş No</th>
                                <th className="px-6 py-3 font-medium">Tarih</th>
                                <th className="px-6 py-3 font-medium">Durum</th>
                                <th className="px-6 py-3 font-medium text-right">Tutar</th>
                                <th className="px-6 py-3 font-medium text-right">Maliyet</th>
                                <th className="px-6 py-3 font-medium text-right">Net Kâr</th>
                                <th className="px-6 py-3 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                            Yükleniyor...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                                                <ShoppingBag className="w-6 h-6 text-slate-600" />
                                            </div>
                                            <p>Henüz sipariş bulunmuyor. "Trendyol'dan Çek" butonunu kullanın.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => {
                                    const profitStatus = order.analysis.netProfit >= 0 ? "positive" : "negative";

                                    return (
                                        <motion.tr
                                            key={order.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-slate-800/30 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-white">{order.providerOrderId}</div>
                                                <div className="text-xs text-slate-500">
                                                    {order.customerFirstName} {order.customerLastName}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">
                                                {new Date(order.orderDate).toLocaleDateString('tr-TR')}
                                                <div className="text-xs text-slate-600">
                                                    {new Date(order.orderDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                                    {getStatusIcon(order.status)}
                                                    {order.status}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-white">
                                                {formatMoney(Number(order.totalPrice))}
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-400">
                                                {formatMoney(order.analysis.totalCost + order.analysis.totalCommission)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className={`font-bold ${profitStatus === "positive" ? "text-emerald-400" : "text-red-400"}`}>
                                                    {formatMoney(order.analysis.netProfit)}
                                                </div>
                                                <div className={`text-xs ${profitStatus === "positive" ? "text-emerald-500/50" : "text-red-500/50"}`}>
                                                    {order.totalPrice > 0 ? formatPercent((order.analysis.netProfit / Number(order.totalPrice)) * 100) : "%0"} Marj
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                                                    <ChevronDown className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
