// @/lib/server/auth.js

import { NextResponse } from 'next/server';
import { auth } from '@/auth.js';
import { cookies } from 'next/headers';

// Mock API Keys Data
const mockApiKeys = [
    {
        id: '1',
        key: 'ak_dev_1a2b3c4d5e6f7g8h9i0j',
        name: 'Development Key',
        description: 'Development environment access',
        active: true,
        permissions: ['read', 'write'],
        rateLimit: 1000,
        lastUsed: null,
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'admin',
        expires_at: '2025-01-01T00:00:00Z'
    },
    {
        id: '2',
        key: 'ak_prod_9z8y7x6w5v4u3t2s1r0q',
        name: 'Production Key',
        description: 'Production environment full access',
        active: true,
        permissions: ['read', 'write', 'delete'],
        rateLimit: 5000,
        lastUsed: '2024-12-15T10:30:00Z',
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'admin',
        expires_at: '2025-06-01T00:00:00Z'
    }
];

// Mock Whitelist Data
const mockWhitelist = [
    {
        id: '1',
        type: 'ip',
        value: 'localhost',
        description: 'Internal company network',
        active: true,
        category: 'internal',
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'admin',
        last_accessed: '2024-12-15T14:30:00Z'
    },
    {
        id: '2',
        type: 'ip',
        value: '127.0.0.1',
        description: 'Localhost',
        active: true,
        category: 'internal',
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'admin',
        last_accessed: '2024-12-15T14:30:00Z'
    }
];


export async function verifyToken(request) {
    try {
        // Get session from NextAuth v5
        const session = await auth();

        if (!session?.user) {
            return { error: 'No token provided.', status: 403 };
        }

        // Return user data from session
        return {
            user: {
                id: session.user.id,
                email: session.user.email,
                displayName: session.user.displayName,
                role: session.user.role,
                client: session.user.client,
                web3: session.user.web3,
                created_at: session.user.created_at
            }
        };
    } catch (error) {
        console.error('Token verification error:', error);
        return { error: 'Invalid token.', status: 403 };
    }
}

// Verify CSRF token for public requests (NextAuth v5)
export async function verifyCsrfToken(request) {
    try {
        // Get CSRF token from request headers
        const headerCsrfToken = request.headers.get('x-csrf-token') ||
            request.headers.get('csrf-token');

        if (!headerCsrfToken) {
            return { error: 'CSRF token not provided in request headers.', status: 403 };
        }

        const cookieStore = await cookies();

        // Get all cookies and find the one that contains "authjs.csrf-token"
        const allCookies = cookieStore.getAll();
        const csrfCookie = allCookies.find(cookie =>
            cookie.name.includes('authjs.csrf-token')
        )?.value;

        if (!csrfCookie) {
            return { error: 'CSRF token not provided in cookies.', status: 403 };
        }

        // cookie format: "<token>|<hash>"
        const [token, hash] = csrfCookie.split("|");

        if (!token || !hash) {
            return { error: 'CSRF token hash failed.', status: 403 };
        }

        // Compare the tokens
        if (headerCsrfToken !== token) {
            console.error('CSRF token mismatch:', {
                header: headerCsrfToken,
                cookie: token
            });
            return { error: 'CSRF token mismatch.', status: 403 };
        }

        return { success: true };
    } catch (error) {
        console.error('CSRF token verification error:', error);
        return { error: 'CSRF token verification failed.', status: 500 };
    }
}

// Enhanced public access middleware
export function withPublicAccess(handler, options = {}) {
    const {
        requireApiKey = true,
        requireIpWhitelist = true,
        skipCsrfForApiKey = true,
        requiredPermission = null,
        logAccess = false
    } = options;

    return async (request, context) => {
        try {
            let hasValidApiKey = false;

            // Check for API key first
            if (requireApiKey) {
                const apiKey = request.headers.get('x-api-key') ||
                    request.headers.get('authorization')?.replace('Bearer ', '');

                if (!apiKey) {
                    return NextResponse.json(
                        { error: 'API key is required for external access.' },
                        { status: 401 }
                    );
                }

                // Validate API key against mock data
                const validKey = mockApiKeys.find(key =>
                    key.key === apiKey &&
                    key.active &&
                    new Date(key.expires_at) > new Date()
                );

                if (!validKey) {
                    return NextResponse.json(
                        { error: 'Invalid or expired API key.' },
                        { status: 401 }
                    );
                }

                // Check permissions if required
                if (requiredPermission && !validKey.permissions.includes(requiredPermission)) {
                    return NextResponse.json(
                        { error: `API key lacks required permission: ${requiredPermission}` },
                        { status: 403 }
                    );
                }

                hasValidApiKey = true;
            }

            // If we have a valid API key and skipCsrfForApiKey is true, skip CSRF check
            if (!(hasValidApiKey && skipCsrfForApiKey)) {
                // Verify CSRF token
                const validate = await validateIpAndDomain(request);
                if (validate.isInternal) {
                    return await handler(request, context);
                } 
                const csrfResult = await verifyCsrfToken(request);
                if (csrfResult.error) {
                    return NextResponse.json(
                        { error: csrfResult.error },
                        { status: csrfResult.status }
                    );
                }
            }

            // Check IP whitelist if required
            if (requireIpWhitelist) {
                const ipResult = await validateIpAndDomain(request);
                if (ipResult.error) {
                    return NextResponse.json(
                        { error: ipResult.error },
                        { status: ipResult.status }
                    );
                }
            }

            return await handler(request, context);
        } catch (error) {
            console.error('Public access middleware error:', error);
            return NextResponse.json(
                { error: 'Access validation failed.' },
                { status: 500 }
            );
        }
    };
}

// Higher-order function for protecting API routes
export function withAuth(handler) {
    return async (request, context) => {
        try {
            // Proceed with normal token verification for non-public requests
            const authResult = await verifyToken(request);

            if (authResult.error) {
                return NextResponse.json(
                    { message: authResult.error },
                    { status: authResult.status }
                );
            }

            // Add user data to request context
            request.user = authResult.user;

            return await handler(request, context);
        } catch (error) {
            console.error('Auth middleware error:', error);
            return NextResponse.json(
                { message: 'Authentication failed' },
                { status: 500 }
            );
        }
    };
}

// Higher-order function for protecting API routes with role requirement
export function withAuthAndRole(requiredRoles = []) {
    return function(handler) {
        return async (request, context) => {
            try {
                const authResult = await verifyToken(request);

                if (authResult.error) {
                    return NextResponse.json(
                        { message: authResult.error },
                        { status: authResult.status }
                    );
                }

                // Create a copy of requiredRoles to avoid mutating the original array
                const roles = [...requiredRoles, 'admin'];

                // Add user data to request context
                request.user = authResult.user;

                // Check if user has required role
                const userRole = authResult.user.role;

                if (roles.length > 0 && !roles.includes(userRole)) {
                    return NextResponse.json(
                        {
                            message: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${userRole}`
                        },
                        { status: 403 }
                    );
                }

                return await handler(request, context);
            } catch (error) {
                console.error('Auth and role middleware error:', error);
                return NextResponse.json(
                    { message: 'Authentication failed' },
                    { status: 500 }
                );
            }
        };
    };
}

// Convenience function for admin-only routes
export function withAdminAuth(handler) {
    return withAuthAndRole(['admin'])(handler);
}

// Check if request is from whitelisted IP or domain
export async function validateIpAndDomain(request) {
    try {
        // Get client IP
        const forwarded = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');
        const clientIp = forwarded ? forwarded.split(',')[0] : realIp || 'unknown';

        // Get origin/referer
        const origin = request.headers.get('origin');
        const referer = request.headers.get('referer');

        // Check if it's an internal request (same host)
        const host = request.headers.get('host');
        const isInternal = origin?.includes(host) || referer?.includes(host) ||
            clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === 'localhost';

        if (isInternal) {
            return { success: true, isInternal: true };
        }

        // Get whitelisted IPs and domains
        const whitelistedEntries = mockWhitelist.filter(entry => entry.active);

        // Check IP whitelist
        const isIpWhitelisted = whitelistedEntries.some(entry => {
            if (entry.type === 'ip') {
                if (entry.value.includes('/')) {
                    // CIDR notation support (basic)
                    const [network, mask] = entry.value.split('/');
                    return clientIp.startsWith(network.split('.').slice(0, parseInt(mask) / 8).join('.'));
                }
                return clientIp === entry.value || entry.value === 'localhost';
            }
            return false;
        });

        // Check domain whitelist
        const isDomainWhitelisted = whitelistedEntries.some(entry => {
            if (entry.type === 'domain') {
                return origin?.includes(entry.value) || referer?.includes(entry.value);
            }
            return false;
        });

        if (!isIpWhitelisted && !isDomainWhitelisted) {
            return {
                error: `Access denied. IP: ${clientIp}, Origin: ${origin || 'none'}`,
                status: 403
            };
        }

        return { success: true, isInternal: false };
    } catch (error) {
        console.error('IP/Domain validation error:', error);
        return { error: 'Access validation failed.', status: 403 };
    }
}
