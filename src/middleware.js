// middleware.js
import { NextResponse } from "next/server"
import { auth } from "@/auth"

const privateRoutes = ["/account/profile"];
const adminRoutes = ["/dashboard", "/admin"];

export default auth((req) => {
    const { pathname } = req.nextUrl

    // Get session from the auth middleware
    const session = req.auth;

    // Handle private routes
    if (privateRoutes.some(route => pathname.startsWith(route))) {
        if (!session?.user) {
            const loginUrl = new URL("/auth/login", req.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // Handle admin routes
    if (adminRoutes.some(route => pathname.startsWith(route))) {
        if (!session?.user) {
            const loginUrl = new URL("/auth/login", req.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }
        if (!checkUserRole(session.user, ['admin', 'user'])) {
            return NextResponse.redirect(new URL("/", req.url));
        }
    }

    return NextResponse.next();
})

/**
 * Check if user role matches required roles
 * @param {Object} user - User object with role property
 * @param {Array} requiredRoles - Array of required roles
 * @returns {boolean} True if user has required role
 */
function checkUserRole(user, requiredRoles = []) {
    if (!user || !user.role) {
        return false;
    }

    // Admin always has access
    if (user.role === 'admin') {
        return true;
    }

    // Check if user role is in required roles
    return requiredRoles.includes(user.role);
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
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
