"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Bell,
    AlertTriangle,
    TrendingDown,
    Package,
    Check,
    Clock,
    AlertCircle,
    Info,
    RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TR } from "@/lib/constants";

type AlertType = "LOSS_NOW" | "BELOW_BREAK_EVEN" | "LOW_MARGIN" | "MISSING_COST";
type Severity = "INFO" | "WARNING" | "CRITICAL";

interface Alert {
    id: string;
    type: AlertType;
    severity: Severity;
    productSku: string;
    productTitle: string;
    message: string;
    payload: Record<string, number | string>;
    isRead: boolean;
    createdAt: string;
}

const alertTypeConfig = {
    LOSS_NOW: {
        icon: TrendingDown,
        label: "Zararda",
        color: "text-red-400",
        bg: "bg-red-500/10 border-red-500/20"
    },
    BELOW_BREAK_EVEN: {
        icon: AlertTriangle,
        label: "Break-even Altı",
        color: "text-amber-400",
        bg: "bg-amber-500/10 border-amber-500/20"
    },
    LOW_MARGIN: {
        icon: AlertCircle,
        label: "Düşük Marj",
        color: "text-amber-400",
        bg: "bg-amber-500/10 border-amber-500/20"
    },
    MISSING_COST: {
        icon: Package,
        label: "Maliyet Eksik",
        color: "text-slate-400",
        bg: "bg-slate-500/10 border-slate-500/20"
    },
};

const severityConfig = {
    INFO: { color: "text-blue-400", bg: "bg-blue-500/10" },
    WARNING: { color: "text-amber-400", bg: "bg-amber-500/10" },
    CRITICAL: { color: "text-red-400", bg: "bg-red-500/10" },
};

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState<AlertType | null>(null);
    const [filterSeverity, setFilterSeverity] = useState<Severity | null>(null);

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/alerts");
            const data = await res.json();
            setAlerts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Alerts fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await fetch("/api/alerts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAll: true })
            });
            fetchAlerts();
        } catch (error) {
            console.error("Mark all read error:", error);
        }
    };

    const handleMarkRead = async (alertId: string) => {
        try {
            await fetch("/api/alerts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ alertIds: [alertId] })
            });
            fetchAlerts();
        } catch (error) {
            console.error("Mark read error:", error);
        }
    };

    const filteredAlerts = alerts.filter((alert) => {
        const matchesType = !filterType || alert.type === filterType;
        const matchesSeverity = !filterSeverity || alert.severity === filterSeverity;
        return matchesType && matchesSeverity;
    });

    const stats = {
        total: alerts.length,
        unread: alerts.filter((a) => !a.isRead).length,
        critical: alerts.filter((a) => a.severity === "CRITICAL").length,
        warning: alerts.filter((a) => a.severity === "WARNING").length,
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">{TR.alerts}</h1>
                    <p className="text-slate-400 mt-1">Dikkat edilmesi gereken ürünler ve durumlar</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={fetchAlerts}
                        disabled={isLoading}
                        variant="outline"
                        className="bg-slate-800/50 border-slate-700 text-slate-300"
                    >
                        {isLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4" />
                        )}
                    </Button>
                    <Button
                        onClick={handleMarkAllRead}
                        variant="outline"
                        className="bg-slate-800/50 border-slate-700 text-slate-300"
                        disabled={stats.unread === 0}
                    >
                        <Check className="w-4 h-4 mr-2" />
                        Tümünü Okundu İşaretle
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-slate-900/50 border-slate-800/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                                <Bell className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Toplam</p>
                                <p className="text-xl font-bold text-white">{stats.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-blue-500/5 border-blue-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Info className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Okunmamış</p>
                                <p className="text-xl font-bold text-blue-400">{stats.unread}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-red-500/5 border-red-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Kritik</p>
                                <p className="text-xl font-bold text-red-400">{stats.critical}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-amber-500/5 border-amber-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Uyarı</p>
                                <p className="text-xl font-bold text-amber-400">{stats.warning}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="bg-slate-900/50 border-slate-800/50">
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={filterSeverity === "CRITICAL" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterSeverity(filterSeverity === "CRITICAL" ? null : "CRITICAL")}
                            className={filterSeverity === "CRITICAL" ? "bg-red-600" : "bg-slate-800/50 border-red-500/20 text-red-400"}
                        >
                            Kritik
                        </Button>
                        <Button
                            variant={filterSeverity === "WARNING" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterSeverity(filterSeverity === "WARNING" ? null : "WARNING")}
                            className={filterSeverity === "WARNING" ? "bg-amber-600" : "bg-slate-800/50 border-amber-500/20 text-amber-400"}
                        >
                            Uyarı
                        </Button>
                        <Button
                            variant={filterType === "LOSS_NOW" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterType(filterType === "LOSS_NOW" ? null : "LOSS_NOW")}
                            className="bg-slate-800/50 border-slate-700 text-slate-300"
                        >
                            Zararda
                        </Button>
                        <Button
                            variant={filterType === "MISSING_COST" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterType(filterType === "MISSING_COST" ? null : "MISSING_COST")}
                            className="bg-slate-800/50 border-slate-700 text-slate-300"
                        >
                            Maliyet Eksik
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Alerts List */}
            <Card className="bg-slate-900/50 border-slate-800/50">
                <CardHeader className="border-b border-slate-800/50">
                    <CardTitle className="text-lg text-white">Uyarı Listesi</CardTitle>
                    <CardDescription className="text-slate-400">
                        {filteredAlerts.length} uyarı listeleniyor
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="text-center py-16">
                            <RefreshCw className="w-8 h-8 text-slate-600 mx-auto mb-4 animate-spin" />
                            <p className="text-slate-500">Yükleniyor...</p>
                        </div>
                    ) : filteredAlerts.length === 0 ? (
                        <div className="text-center py-16">
                            <Bell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-300 mb-2">Uyarı Yok</h3>
                            <p className="text-slate-500 text-sm">
                                Şu anda dikkat edilmesi gereken bir durum bulunmuyor.
                                <br />
                                Sistem sessiz, her şey yolunda görünüyor.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-800/30">
                            {filteredAlerts.map((alert, index) => {
                                const typeConfig = alertTypeConfig[alert.type];
                                const TypeIcon = typeConfig.icon;

                                return (
                                    <motion.div
                                        key={alert.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`p-4 hover:bg-slate-800/30 transition-colors ${!alert.isRead ? "bg-slate-800/20" : ""}`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`w-10 h-10 rounded-lg ${typeConfig.bg} flex items-center justify-center shrink-0`}>
                                                <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${severityConfig[alert.severity].bg} ${severityConfig[alert.severity].color}`}>
                                                        {alert.severity}
                                                    </span>
                                                    <span className="text-xs text-slate-500">{typeConfig.label}</span>
                                                </div>
                                                <p className="text-sm text-white font-medium">{alert.message}</p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    <span className="font-mono text-cyan-400">{alert.productSku}</span>
                                                    {" - "}
                                                    {alert.productTitle}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                                    <Clock className="w-3 h-3" />
                                                    {alert.createdAt}
                                                </div>
                                                {!alert.isRead && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="mt-2 text-xs text-slate-400"
                                                        onClick={() => handleMarkRead(alert.id)}
                                                    >
                                                        <Check className="w-3 h-3 mr-1" />
                                                        Okundu
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Info */}
            <div className="text-center">
                <p className="text-xs text-slate-600">
                    ℹ️ Uyarılar günde en fazla 1 kez tetiklenir. Aynı durum için spam oluşturulmaz.
                </p>
            </div>
        </div>
    );
}
