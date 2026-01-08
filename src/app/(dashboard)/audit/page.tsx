"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    History,
    User,
    Clock,
    Search,
    LogIn,
    LogOut,
    Edit,
    RefreshCw,
    Settings,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TR } from "@/lib/constants";

interface AuditLogEntry {
    id: string;
    userId: string;
    userEmail: string;
    action: string;
    entityType: string;
    entityId: string | null;
    description: string;
    ip: string | null;
    createdAt: string;
}

const actionConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
    LOGIN: { icon: LogIn, label: "Giriş", color: "text-emerald-400" },
    LOGOUT: { icon: LogOut, label: "Çıkış", color: "text-slate-400" },
    UPDATE_COST: { icon: Edit, label: "Maliyet Güncelleme", color: "text-amber-400" },
    SYNC_TRIGGER: { icon: RefreshCw, label: "Senkronizasyon", color: "text-cyan-400" },
    UPDATE_SETTINGS: { icon: Settings, label: "Ayar Değişikliği", color: "text-blue-400" },
};

export default function AuditPage() {
    const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterAction, setFilterAction] = useState<string | null>(null);

    useEffect(() => {
        fetchAuditLogs();
    }, []);

    const fetchAuditLogs = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/audit");
            const data = await res.json();
            setAuditLogs(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Audit fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredLogs = auditLogs.filter((log) => {
        const matchesSearch =
            log.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (log.entityId && log.entityId.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesFilter = !filterAction || log.action === filterAction;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">{TR.audit_log}</h1>
                    <p className="text-slate-400 mt-1">Sistemde yapılan tüm işlemlerin kaydı</p>
                </div>
                <Button
                    onClick={fetchAuditLogs}
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
            </div>

            {/* Filters */}
            <Card className="bg-slate-900/50 border-slate-800/50">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input
                                placeholder="Kullanıcı veya işlem ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                variant={filterAction === null ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilterAction(null)}
                                className={filterAction === null ? "bg-cyan-600" : "bg-slate-800/50 border-slate-700 text-slate-300"}
                            >
                                Tümü
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFilterAction("LOGIN")}
                                className={`bg-slate-800/50 border-slate-700 ${filterAction === "LOGIN" ? "text-emerald-400 border-emerald-500/30" : "text-slate-300"}`}
                            >
                                Giriş
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFilterAction("UPDATE_COST")}
                                className={`bg-slate-800/50 border-slate-700 ${filterAction === "UPDATE_COST" ? "text-amber-400 border-amber-500/30" : "text-slate-300"}`}
                            >
                                Maliyet
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFilterAction("SYNC_TRIGGER")}
                                className={`bg-slate-800/50 border-slate-700 ${filterAction === "SYNC_TRIGGER" ? "text-cyan-400 border-cyan-500/30" : "text-slate-300"}`}
                            >
                                Senkron
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Audit Log List */}
            <Card className="bg-slate-900/50 border-slate-800/50">
                <CardHeader className="border-b border-slate-800/50">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                        <History className="w-5 h-5 text-cyan-400" />
                        İşlem Geçmişi
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        {filteredLogs.length} kayıt listeleniyor
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="text-center py-16">
                            <RefreshCw className="w-8 h-8 text-slate-600 mx-auto mb-4 animate-spin" />
                            <p className="text-slate-500">Yükleniyor...</p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="text-center py-16">
                            <History className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-300 mb-2">Kayıt Yok</h3>
                            <p className="text-slate-500 text-sm">
                                Henüz işlem kaydı bulunmuyor.
                                <br />
                                Giriş yaptığınızda, maliyet güncellediğinizde kayıtlar burada görünecek.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-800/30">
                            {filteredLogs.map((log, index) => {
                                const config = actionConfig[log.action] || {
                                    icon: History,
                                    label: log.action,
                                    color: "text-slate-400",
                                };
                                const ActionIcon = config.icon;

                                return (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="p-4 hover:bg-slate-800/30 transition-colors"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center shrink-0">
                                                <ActionIcon className={`w-5 h-5 ${config.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-sm font-medium ${config.color}`}>
                                                        {config.label}
                                                    </span>
                                                    <span className="text-xs text-slate-500">•</span>
                                                    <span className="text-xs text-slate-500">{log.entityType}</span>
                                                </div>
                                                <p className="text-sm text-white">{log.description}</p>
                                                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                                    <div className="flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {log.userEmail}
                                                    </div>
                                                    {log.ip && (
                                                        <span>IP: {log.ip}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                                    <Clock className="w-3 h-3" />
                                                    {log.createdAt}
                                                </div>
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
                    🔒 Log kayıtları silinemez. Tüm değişiklikler kalıcı olarak saklanır.
                </p>
            </div>
        </div>
    );
}
