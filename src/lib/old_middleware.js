// @/middleware.js
import { NextResponse } from "next/server"
import { auth } from "@/auth"  

// Define protected routes - these will be checked for authentication and role access
const protectedRoutes = [
    "/account",
    "/dashboard", 
    "/admin"
];

// Role-based access control mapping (fallback)
const roleRouteAccess = {
    admin: ["/", "/admin"], // Admin has access to everything
    user: ["/"]
};

// Cache for roles data
let rolesCache = null;
let lastCacheUpdate = null;
let cachePromise = null; // To prevent multiple simultaneous fetches
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Function to fetch and cache roles
async function getCachedRoles(origin, forceRefresh = false) {
    // Check if cache is still valid (unless force refresh is requested)
    if (!forceRefresh && rolesCache && lastCacheUpdate && 
        (Date.now() - lastCacheUpdate) < CACHE_DURATION) {
        return rolesCache;
    }

    // If there's already a fetch in progress, wait for it
    if (cachePromise) {
        return await cachePromise;
    }

    // Start new fetch and cache the promise
    cachePromise = (async () => {
        try {
            // Add cache busting parameter when force refreshing
            const url = forceRefresh 
                ? `${origin}/api/query/public/roles?_t=${Date.now()}`
                : `${origin}/api/query/public/roles`;
            const res = await fetch(url);
            const rolesData = await res.json();
            
            if (rolesData.success && Array.isArray(rolesData.data)) {
                rolesCache = rolesData;
                lastCacheUpdate = Date.now(); 
                return rolesData;
            } else {
                throw new Error('Invalid roles data structure');
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
            // Return cached data if available, even if expired
            if (rolesCache) { 
                return rolesCache;
            }
            throw error;
        } finally {
            // Clear the promise reference
            cachePromise = null;
        }
    })();

    return await cachePromise;
}

// Function to clear the cache (can be called when roles are updated)
function clearRolesCache() {
    rolesCache = null;
    lastCacheUpdate = null;
    cachePromise = null; 
}

// Cache for settings data
let settingsCache = null;
let lastSettingsCacheUpdate = null;
let settingsCachePromise = null;

// Function to fetch and cache site settings
async function getCachedSettings(origin, forceRefresh = false) {
    // Check if cache is still valid (unless force refresh is requested)
    if (!forceRefresh && settingsCache && lastSettingsCacheUpdate && 
        (Date.now() - lastSettingsCacheUpdate) < CACHE_DURATION) {
        return settingsCache;
    }

    // If there's already a fetch in progress, wait for it
    if (settingsCachePromise) {
        return await settingsCachePromise;
    }

    // Start new fetch and cache the promise
    settingsCachePromise = (async () => {
        try {
            const url = forceRefresh 
                ? `${origin}/api/query/public/site_settings?_t=${Date.now()}`
                : `${origin}/api/query/public/site_settings`;
            const res = await fetch(url);
            const settingsData = await res.json();
            
            if (settingsData.success && Array.isArray(settingsData.data) && settingsData.data.length > 0) {
                const settings = settingsData.data[0];
                settingsCache = settings;
                lastSettingsCacheUpdate = Date.now(); 
                return settings;
            } else {
                // Return default settings if none found
                const defaultSettings = {
                    allowRegistration: true,
                    enableFrontend: true
                };
                settingsCache = defaultSettings;
                lastSettingsCacheUpdate = Date.now();
                return defaultSettings;
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            // Return cached data if available, even if expired
            if (settingsCache) { 
                return settingsCache;
            }
            // Return default settings as fallback
            return {
                allowRegistration: true,
                enableFrontend: true
            };
        } finally {
            settingsCachePromise = null;
        }
    })();

    return await settingsCachePromise;
}

function checkRouteAccess(userRole, pathname) {
    if (!userRole) return false;
    
    // Admin has access to everything
    if (userRole.toLowerCase() === 'admin') return true;
    
    const allowedRoutes = roleRouteAccess[userRole.toLowerCase()] || roleRouteAccess.user;
    
    return allowedRoutes.some(route => {
        return pathname === route || pathname.startsWith(route + '/');
    });
}

function checkDynamicRouteAccess(userRole, pathname, dynamicRoleAccess) {
    if (!userRole) return false;
    
    // Admin has access to everything
    if (userRole.toLowerCase() === 'admin') return true;
    
    const allowedRoutes = dynamicRoleAccess[userRole.toLowerCase()] || dynamicRoleAccess.user || ['/dashboard', '/account'];
    
    return allowedRoutes.some(route => {
        return pathname === route || pathname.startsWith(route + '/');
    });
}

export default auth(async(req) => {
    const { pathname } = req.nextUrl
    const session = req.auth;

    try {
        try {\n        // Get cached settings data for frontend control\n        const settings = await getCachedSettings(req.nextUrl.origin);\n        \n        // Check if frontend is disabled\n        if (settings && settings.enableFrontend === false) {\n            // Allow access to auth routes, API routes, and admin routes\n            const allowedPaths = ['/auth', '/api', '/admin', '/_next', '/favicon.ico'];\n            const isAllowedPath = allowedPaths.some(path => pathname.startsWith(path));\n            \n            if (!isAllowedPath) {\n                if (session?.user) {\n                    // If user is logged in, redirect to admin dashboard\n                    return NextResponse.redirect(new URL(\"/admin\", req.url));\n                } else {\n                    // If not logged in, redirect to login\n                    return NextResponse.redirect(new URL(\"/auth/login\", req.url));\n                }\n            }\n        }\n        \n        // Get cached roles data\n        const rolesData = await getCachedRoles(req.nextUrl.origin);
        
        let dynamicRoleRouteAccess = {};
        let allProtectedRoutes = new Set(protectedRoutes);
        
        if (rolesData && rolesData.success && Array.isArray(rolesData.data)) {
            // Build dynamic role mappings from database
            rolesData.data.forEach(role => {
                const roleName = role.title?.toLowerCase();
                if (roleName && Array.isArray(role.routes)) {
                    // Process routes - handle wildcards
                    const processedRoutes = role.routes.map(route => {
                        // Add to protected routes set
                        if (route.endsWith('/*')) {
                            const baseRoute = route.slice(0, -2);
                            allProtectedRoutes.add(baseRoute);
                            return baseRoute;
                        } else {
                            allProtectedRoutes.add(route);
                            return route;
                        }
                    });
                    
                    dynamicRoleRouteAccess[roleName] = processedRoutes;
                }
            });
            
            const cacheAge = lastCacheUpdate ? (Date.now() - lastCacheUpdate) / 1000 : 0; 
        }
        
        // Convert Set back to array for checking
        const allProtectedRoutesArray = Array.from(allProtectedRoutes);
        
        // Check if current path requires authentication using dynamic routes
        const requiresAuth = allProtectedRoutesArray.some(route => 
            pathname === route || pathname.startsWith(route + '/')
        );

        // If route requires authentication but user is not logged in
        if (requiresAuth && !session?.user) {
            const loginUrl = new URL("/auth/login", req.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }

        // If user is logged in and accessing protected route, check role-based access
        if (session?.user && requiresAuth) {
            // Use dynamic roles if available, fallback to static roles
            const roleAccess = Object.keys(dynamicRoleRouteAccess).length > 0 
                ? dynamicRoleRouteAccess 
                : roleRouteAccess;
                
            const hasAccess = checkDynamicRouteAccess(session.user.role, pathname, roleAccess);
            
            if (!hasAccess) {
                // Redirect to appropriate page based on role
                if (session.user.role === 'user') {
                    return NextResponse.redirect(new URL("/dashboard", req.url));
                } else {
                    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
                }
            }
        }

        return NextResponse.next();
        
    } catch (error) {
        console.error('Middleware error:', error);
        
        // Fallback to static role checking if API fails
        const requiresAuth = protectedRoutes.some(route => pathname.startsWith(route));
        
        if (requiresAuth && !session?.user) {
            const loginUrl = new URL("/auth/login", req.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }

        if (session?.user && requiresAuth) {
            const hasAccess = checkRouteAccess(session.user.role, pathname);
            
            if (!hasAccess) {
                if (session.user.role === 'user') {
                    return NextResponse.redirect(new URL("/dashboard", req.url));
                } else {
                    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
                }
            }
        }
        
        return NextResponse.next();
    }
})



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
