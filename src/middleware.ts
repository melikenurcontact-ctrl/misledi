import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "fallback-secret-change-me"
);

// Korunan rotalar
const protectedRoutes = ["/dashboard", "/products", "/simulate", "/alerts", "/audit", "/settings"];
// Auth rotaları (giriş yapmış kullanıcılar erişemez)
const authRoutes = ["/login"];

async function verifyTokenEdge(token: string): Promise<boolean> {
    try {
        await jose.jwtVerify(token, JWT_SECRET);
        return true;
    } catch {
        return false;
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Session token'ı al
    const token = request.cookies.get("misledi_session")?.value;
    const isAuthenticated = token ? await verifyTokenEdge(token) : false;

    // Auth rotalarına giriş yapmış kullanıcı gelirse dashboard'a yönlendir
    if (authRoutes.some((route) => pathname.startsWith(route))) {
        if (isAuthenticated) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
        return NextResponse.next();
    }

    // Korunan rotalara giriş yapmamış kullanıcı gelirse login'e yönlendir
    if (protectedRoutes.some((route) => pathname.startsWith(route))) {
        if (!isAuthenticated) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
        return NextResponse.next();
    }

    // Ana sayfa -> dashboard veya login'e yönlendir
    if (pathname === "/") {
        if (isAuthenticated) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
