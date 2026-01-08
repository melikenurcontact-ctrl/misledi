import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";
const SESSION_COOKIE_NAME = "misledi_session";

export interface JWTPayload {
    userId: string;
    email: string;
    iat?: number;
    exp?: number;
}

// Şifre hashleme
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

// Şifre doğrulama
export async function verifyPassword(
    password: string,
    hashedPassword: string
): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

// JWT oluşturma
export function createToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// JWT doğrulama
export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
        return null;
    }
}

// Session cookie'si ayarlama
export async function setSessionCookie(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 gün
        path: "/",
    });
}

// Session cookie'si silme
export async function deleteSessionCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}

// Session cookie'si okuma
export async function getSessionToken(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}

// Mevcut kullanıcıyı getir
export async function getCurrentUser(): Promise<JWTPayload | null> {
    const token = await getSessionToken();
    if (!token) return null;
    return verifyToken(token);
}
