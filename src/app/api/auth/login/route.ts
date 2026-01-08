import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyPassword, createToken, setSessionCookie } from "@/lib/auth";

// Rate limiting için basit in-memory store (production'da Redis kullanılmalı)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 dakika

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        // Basit validasyon
        if (!email || !password) {
            return NextResponse.json(
                { error: "E-posta ve şifre gereklidir" },
                { status: 400 }
            );
        }

        // IP bazlı rate limiting
        const ip = request.headers.get("x-forwarded-for") || "unknown";
        const attempts = loginAttempts.get(ip);

        if (attempts) {
            const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;

            if (attempts.count >= MAX_ATTEMPTS && timeSinceLastAttempt < LOCKOUT_TIME) {
                const remainingTime = Math.ceil((LOCKOUT_TIME - timeSinceLastAttempt) / 60000);
                return NextResponse.json(
                    { error: `Çok fazla başarısız deneme. ${remainingTime} dakika sonra tekrar deneyin.` },
                    { status: 429 }
                );
            }

            // Lockout süresi geçtiyse sıfırla
            if (timeSinceLastAttempt >= LOCKOUT_TIME) {
                loginAttempts.delete(ip);
            }
        }

        // Kullanıcıyı bul
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user || !user.isActive) {
            // Başarısız deneme kaydet
            const currentAttempts = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
            loginAttempts.set(ip, {
                count: currentAttempts.count + 1,
                lastAttempt: Date.now(),
            });

            return NextResponse.json(
                { error: "E-posta veya şifre hatalı" },
                { status: 401 }
            );
        }

        // Şifreyi doğrula
        const isValidPassword = await verifyPassword(password, user.passwordHash);

        if (!isValidPassword) {
            // Başarısız deneme kaydet
            const currentAttempts = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
            loginAttempts.set(ip, {
                count: currentAttempts.count + 1,
                lastAttempt: Date.now(),
            });

            return NextResponse.json(
                { error: "E-posta veya şifre hatalı" },
                { status: 401 }
            );
        }

        // Başarılı giriş - rate limit sıfırla
        loginAttempts.delete(ip);

        // JWT oluştur ve cookie'ye kaydet
        const token = createToken({
            userId: user.id,
            email: user.email,
        });

        await setSessionCookie(token);

        // Audit log oluştur
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: "LOGIN",
                entityType: "User",
                entityId: user.id,
                ip,
                userAgent: request.headers.get("user-agent") || undefined,
            },
        });

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Bir hata oluştu. Lütfen tekrar deneyin." },
            { status: 500 }
        );
    }
}
