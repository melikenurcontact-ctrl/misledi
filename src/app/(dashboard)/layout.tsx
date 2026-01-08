"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    Calculator,
    Bell,
    History,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronRight,
    TrendingUp,
    AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TR } from "@/lib/constants";

const menuItems = [
    {
        name: TR.dashboard,
        href: "/dashboard",
        icon: LayoutDashboard,
        description: "Genel bakış"
    },
    {
        name: TR.products,
        href: "/products",
        icon: Package,
        description: "Ürün listesi"
    },
    {
        name: TR.simulation,
        href: "/simulate",
        icon: Calculator,
        description: "Senaryo analizi"
    },
    {
        name: TR.orders,
        href: "/orders",
        icon: ShoppingBag,
        description: "Siparişler & Kâr"
    },
    {
        name: TR.alerts,
        href: "/alerts",
        icon: Bell,
        description: "Uyarı merkezi"
    },
    {
        name: TR.audit_log,
        href: "/audit",
        icon: History,
        description: "İşlem geçmişi"
    },
    {
        name: TR.settings,
        href: "/settings",
        icon: Settings,
        description: "Sistem ayarları"
    },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
            router.refresh();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/50 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-800/50">
                        <Link href="/dashboard" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                                <span className="text-lg font-bold text-white">M</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">{TR.app_name}</h1>
                                <p className="text-xs text-slate-500">{TR.app_tagline}</p>
                            </div>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                        ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border border-cyan-500/20"
                                        : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                                        }`}
                                >
                                    <item.icon className={`w-5 h-5 ${isActive ? "text-cyan-400" : ""}`} />
                                    <div className="flex-1">
                                        <span className="font-medium">{item.name}</span>
                                        <p className={`text-xs mt-0.5 ${isActive ? "text-cyan-400/70" : "text-slate-500"}`}>
                                            {item.description}
                                        </p>
                                    </div>
                                    {isActive && (
                                        <ChevronRight className="w-4 h-4 text-cyan-400" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Quick Stats */}
                    <div className="p-4 border-t border-slate-800/50">
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <TrendingUp className="w-4 h-4 text-emerald-400 mb-1" />
                                <p className="text-xs text-slate-400">Bugün Kâr</p>
                                <p className="text-sm font-bold text-emerald-400">₺0</p>
                            </div>
                            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <AlertTriangle className="w-4 h-4 text-amber-400 mb-1" />
                                <p className="text-xs text-slate-400">Uyarılar</p>
                                <p className="text-sm font-bold text-amber-400">0</p>
                            </div>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <div className="p-4 border-t border-slate-800/50">
                        <Button
                            variant="ghost"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                        >
                            <LogOut className="w-4 h-4 mr-3" />
                            {isLoggingOut ? TR.loading : TR.logout}
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="lg:pl-72">
                {/* Top Header */}
                <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
                    <div className="flex items-center justify-between px-6 py-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden text-slate-400 hover:text-white"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-4">
                            {/* Sync Status */}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs text-slate-400">Senkron</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
