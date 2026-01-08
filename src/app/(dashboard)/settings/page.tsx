"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Settings,
    Percent,
    Truck,
    TrendingDown,
    Save,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    Link as LinkIcon,
    DollarSign,
    Package,
    Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TR } from "@/lib/constants";

export default function SettingsPage() {
    // Varsayılan Maliyet Kartı Değerleri (Yeni hesaplama modeli)
    const [defaults, setDefaults] = useState({
        commissionPercent: "17",      // Trendyol komisyonu %
        influencerPercent: "0",       // Influencer komisyonu %
        shippingBase: "38.77",        // Kargo baz (KDV hariç)
        serviceFeeBase: "6.99",       // Hizmet bedeli (KDV hariç)
        packagingCost: "12",          // Karton/paketleme
        kdvRate: "20",                // KDV oranı
        lowMarginThreshold: "5",      // Düşük marj eşiği
    });

    // Trendyol API
    const [supplierId, setSupplierId] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [apiSecret, setApiSecret] = useState("");

    // Durum
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingApi, setIsSavingApi] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveApiSuccess, setSaveApiSuccess] = useState(false);
    const [apiError, setApiError] = useState("");
    const [connectionStatus, setConnectionStatus] = useState<"pending" | "connected" | "error">("pending");

    // Load existing settings on mount
    useEffect(() => {
        // Load Trendyol API settings
        fetch("/api/settings")
            .then(res => res.json())
            .then(data => {
                if (data.supplierId) setSupplierId(data.supplierId);
                if (data.apiKey) setApiKey(data.apiKey);
                if (data.apiSecret) setApiSecret(data.apiSecret);
                if (data.status === "ACTIVE" || data.status === "OK") setConnectionStatus("connected");
            })
            .catch(() => { });

        // Load default cost card settings
        fetch("/api/settings/defaults")
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setDefaults({
                        commissionPercent: data.commissionPercent || "17",
                        influencerPercent: data.influencerPercent || "0",
                        shippingBase: data.shippingBase || "38.77",
                        serviceFeeBase: data.serviceFeeBase || "6.99",
                        packagingCost: data.packagingCost || "12",
                        kdvRate: data.kdvRate || "20",
                        lowMarginThreshold: data.lowMarginThreshold || "5"
                    });
                }
            })
            .catch(() => { });
    }, []);

    const handleSaveDefaults = async () => {
        setIsSaving(true);
        setSaveSuccess(false);

        try {
            const res = await fetch("/api/settings/defaults", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(defaults)
            });
            if (res.ok) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            }
        } catch (error) {
            console.error("Save defaults error:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveApi = async () => {
        setIsSavingApi(true);
        setSaveApiSuccess(false);
        setApiError("");

        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ supplierId, apiKey, apiSecret })
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Kayıt hatası");
            }

            setSaveApiSuccess(true);
            setConnectionStatus("connected");
            setTimeout(() => setSaveApiSuccess(false), 3000);
        } catch (err) {
            setApiError(err instanceof Error ? err.message : "Bir hata oluştu");
            setConnectionStatus("error");
        } finally {
            setIsSavingApi(false);
        }
    };

    const handleTestConnection = async () => {
        setConnectionStatus("pending");
        setApiError("");

        try {
            const res = await fetch("/api/settings/test-connection", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ supplierId, apiKey, apiSecret })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setConnectionStatus("connected");
            } else {
                setConnectionStatus("error");
                setApiError(data.error || "Bağlantı başarısız");
            }
        } catch (error) {
            console.error(error);
            setConnectionStatus("error");
            setApiError("Sunucu bağlantı hatası");
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">{TR.settings}</h1>
                <p className="text-slate-400 mt-1">Maliyet kartı varsayılanları ve entegrasyon ayarları</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Default Cost Card Values */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="bg-slate-900/50 border-slate-800/50">
                        <CardHeader>
                            <CardTitle className="text-lg text-white flex items-center gap-2">
                                <Settings className="w-5 h-5 text-cyan-400" />
                                Varsayılan Maliyet Kartı
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Yeni ürünler için başlangıç değerleri (Trendyol hesaplama modeli)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Sabit Giderler */}
                            <div className="border-b border-slate-800 pb-4">
                                <p className="text-xs text-slate-500 font-medium mb-3">Sabit Giderler</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-slate-400 text-xs flex items-center gap-1">
                                            <Package className="w-3 h-3" />
                                            Karton/Paket ₺
                                        </Label>
                                        <Input
                                            type="number"
                                            value={defaults.packagingCost}
                                            onChange={(e) => setDefaults({ ...defaults, packagingCost: e.target.value })}
                                            className="mt-1 bg-slate-800/50 border-slate-700 text-white h-9 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-slate-400 text-xs flex items-center gap-1">
                                            <Truck className="w-3 h-3" />
                                            Kargo Baz (KDV hariç)
                                        </Label>
                                        <Input
                                            type="number"
                                            value={defaults.shippingBase}
                                            onChange={(e) => setDefaults({ ...defaults, shippingBase: e.target.value })}
                                            className="mt-1 bg-slate-800/50 border-slate-700 text-white h-9 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-slate-400 text-xs flex items-center gap-1">
                                            <DollarSign className="w-3 h-3" />
                                            Hizmet Bedeli (KDV hariç)
                                        </Label>
                                        <Input
                                            type="number"
                                            value={defaults.serviceFeeBase}
                                            onChange={(e) => setDefaults({ ...defaults, serviceFeeBase: e.target.value })}
                                            className="mt-1 bg-slate-800/50 border-slate-700 text-white h-9 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-slate-400 text-xs flex items-center gap-1">
                                            <Percent className="w-3 h-3" />
                                            KDV Oranı %
                                        </Label>
                                        <Input
                                            type="number"
                                            value={defaults.kdvRate}
                                            onChange={(e) => setDefaults({ ...defaults, kdvRate: e.target.value })}
                                            className="mt-1 bg-slate-800/50 border-slate-700 text-white h-9 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Komisyonlar */}
                            <div className="border-b border-slate-800 pb-4">
                                <p className="text-xs text-slate-500 font-medium mb-3">Komisyon Oranları</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-slate-400 text-xs flex items-center gap-1">
                                            <Percent className="w-3 h-3 text-amber-400" />
                                            Trendyol Komisyonu %
                                        </Label>
                                        <Input
                                            type="number"
                                            value={defaults.commissionPercent}
                                            onChange={(e) => setDefaults({ ...defaults, commissionPercent: e.target.value })}
                                            className="mt-1 bg-slate-800/50 border-slate-700 text-white h-9 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-slate-400 text-xs flex items-center gap-1">
                                            <Users className="w-3 h-3 text-purple-400" />
                                            Influencer Komisyonu %
                                        </Label>
                                        <Input
                                            type="number"
                                            value={defaults.influencerPercent}
                                            onChange={(e) => setDefaults({ ...defaults, influencerPercent: e.target.value })}
                                            className="mt-1 bg-slate-800/50 border-slate-700 text-white h-9 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Uyarı Eşiği */}
                            <div>
                                <Label className="text-slate-400 text-xs flex items-center gap-1">
                                    <TrendingDown className="w-3 h-3 text-red-400" />
                                    Düşük Marj Uyarı Eşiği %
                                </Label>
                                <Input
                                    type="number"
                                    value={defaults.lowMarginThreshold}
                                    onChange={(e) => setDefaults({ ...defaults, lowMarginThreshold: e.target.value })}
                                    className="mt-1 bg-slate-800/50 border-slate-700 text-white h-9 text-sm"
                                />
                                <p className="text-xs text-slate-600 mt-1">
                                    Bu oranın altındaki marjlar uyarı alır
                                </p>
                            </div>

                            <Button
                                onClick={handleSaveDefaults}
                                disabled={isSaving}
                                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                            >
                                {isSaving ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Kaydediliyor...
                                    </>
                                ) : saveSuccess ? (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Kaydedildi!
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        {TR.save}
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Trendyol API */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="bg-slate-900/50 border-slate-800/50">
                        <CardHeader>
                            <CardTitle className="text-lg text-white flex items-center gap-2">
                                <LinkIcon className="w-5 h-5 text-orange-400" />
                                Trendyol Entegrasyonu
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Trendyol Satıcı API bilgileri
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Connection Status */}
                            <div className={`flex items-center gap-3 p-3 rounded-lg border ${connectionStatus === "connected"
                                ? "bg-emerald-500/10 border-emerald-500/20"
                                : connectionStatus === "error"
                                    ? "bg-red-500/10 border-red-500/20"
                                    : "bg-slate-800/50 border-slate-700"
                                }`}>
                                {connectionStatus === "connected" ? (
                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                ) : connectionStatus === "error" ? (
                                    <AlertCircle className="w-5 h-5 text-red-400" />
                                ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-slate-600" />
                                )}
                                <div>
                                    <p className={`text-sm font-medium ${connectionStatus === "connected"
                                        ? "text-emerald-400"
                                        : connectionStatus === "error"
                                            ? "text-red-400"
                                            : "text-slate-400"
                                        }`}>
                                        {connectionStatus === "connected"
                                            ? "Bağlantı Başarılı"
                                            : connectionStatus === "error"
                                                ? "Bağlantı Hatası"
                                                : "Bağlantı Bekleniyor"
                                        }
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {connectionStatus === "connected"
                                            ? "Trendyol API aktif"
                                            : "API bilgilerini girin"
                                        }
                                    </p>
                                </div>
                            </div>

                            {apiError && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                    <p className="text-sm text-red-400">{apiError}</p>
                                </div>
                            )}

                            <div>
                                <Label className="text-slate-300">Satıcı ID</Label>
                                <Input
                                    type="text"
                                    value={supplierId}
                                    onChange={(e) => setSupplierId(e.target.value)}
                                    className="mt-1 bg-slate-800/50 border-slate-700 text-white"
                                    placeholder="123456"
                                />
                            </div>

                            <div>
                                <Label className="text-slate-300">API Key</Label>
                                <Input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className="mt-1 bg-slate-800/50 border-slate-700 text-white"
                                    placeholder="••••••••••••••••"
                                />
                            </div>

                            <div>
                                <Label className="text-slate-300">API Secret</Label>
                                <Input
                                    type="password"
                                    value={apiSecret}
                                    onChange={(e) => setApiSecret(e.target.value)}
                                    className="mt-1 bg-slate-800/50 border-slate-700 text-white"
                                    placeholder="••••••••••••••••"
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handleTestConnection}
                                    className="flex-1 bg-slate-800/50 border-slate-700 text-slate-300"
                                >
                                    Bağlantı Test
                                </Button>
                                <Button
                                    onClick={handleSaveApi}
                                    disabled={isSavingApi}
                                    className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                                >
                                    {isSavingApi ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Kaydediliyor...
                                        </>
                                    ) : saveApiSuccess ? (
                                        <>
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Kaydedildi!
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            {TR.save}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Formula Explanation */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <Card className="bg-slate-900/50 border-slate-800/50">
                    <CardHeader>
                        <CardTitle className="text-base text-white">Kâr Hesaplama Formülü</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-slate-400 font-mono bg-slate-800/50 p-4 rounded-lg">
                            <p className="text-cyan-400 mb-2">Net Kâr = KDV Hariç Satış - Değişken Giderler - Sabit Giderler</p>
                            <p className="text-slate-500 text-xs mt-2">Değişken Giderler = (Trendyol % + Influencer %) × KDV Hariç Satış</p>
                            <p className="text-slate-500 text-xs">Sabit Giderler = Alış + Karton + (Kargo × 1.20) + (Hizmet × 1.20)</p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
