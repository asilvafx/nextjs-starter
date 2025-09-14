// lib/auth.js
import { NextResponse } from 'next/server';

import { getToken } from 'next-auth/jwt';


// Mock API Keys Data
const mockApiKeys = [
    {
        id: '1',
        key: 'ak_dev_1a2b3c4d5e6f7g8h9i0j',
        name: 'Development Key',
        description: 'Development environment access',
        active: true,
        permissions: ['read', 'write'],
        rateLimit: 1000, // requests per hour
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
    },
    {
        id: '3',
        key: 'ak_partner_m1n2o3p4q5r6s7t8u9v0',
        name: 'Partner API Key',
        description: 'External partner read-only access',
        active: true,
        permissions: ['read'],
        rateLimit: 500,
        lastUsed: '2024-12-10T15:45:00Z',
        created_at: '2024-06-01T00:00:00Z',
        created_by: 'partner-manager',
        expires_at: '2025-12-01T00:00:00Z'
    },
    {
        id: '4',
        key: 'ak_mobile_a9b8c7d6e5f4g3h2i1j0',
        name: 'Mobile App Key',
        description: 'Mobile application access (disabled)',
        active: false, // Disabled key
        permissions: ['read'],
        rateLimit: 200,
        lastUsed: '2024-11-01T08:20:00Z',
        created_at: '2024-03-01T00:00:00Z',
        created_by: 'mobile-team',
        expires_at: '2024-12-01T00:00:00Z' // Expired
    },
    {
        id: '5',
        key: 'ak_testing_x1y2z3a4b5c6d7e8f9g0',
        name: 'Testing Key',
        description: 'QA testing environment',
        active: true,
        permissions: ['read', 'write'],
        rateLimit: 100,
        lastUsed: null,
        created_at: '2024-11-01T00:00:00Z',
        created_by: 'qa-team',
        expires_at: '2025-03-01T00:00:00Z'
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
        value: '10.0.0.1',
        description: 'VPN gateway server',
        active: true,
        category: 'infrastructure',
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'devops',
        last_accessed: '2024-12-14T09:15:00Z'
    },
    {
        id: '3',
        type: 'ip',
        value: '203.0.113.0/24',
        description: 'Partner company network',
        active: true,
        category: 'partner',
        created_at: '2024-03-15T00:00:00Z',
        created_by: 'partner-manager',
        last_accessed: '2024-12-10T16:45:00Z'
    },
    {
        id: '4',
        type: 'ip',
        value: '198.51.100.5',
        description: 'Legacy system (disabled)',
        active: false, // Disabled IP
        category: 'legacy',
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'admin',
        last_accessed: '2024-10-01T12:00:00Z'
    },
    {
        id: '5',
        type: 'domain',
        value: 'example.com',
        description: 'Main partner domain',
        active: true,
        category: 'partner',
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'admin',
        last_accessed: '2024-12-15T11:20:00Z'
    },
    {
        id: '6',
        type: 'domain',
        value: 'api.partner.com',
        description: 'Partner API subdomain',
        active: true,
        category: 'partner',
        created_at: '2024-02-01T00:00:00Z',
        created_by: 'partner-manager',
        last_accessed: '2024-12-14T13:30:00Z'
    },
    {
        id: '7',
        type: 'domain',
        value: 'app.client.org',
        description: 'Client application domain',
        active: true,
        category: 'client',
        created_at: '2024-05-01T00:00:00Z',
        created_by: 'client-manager',
        last_accessed: '2024-12-12T10:45:00Z'
    },
    {
        id: '8',
        type: 'domain',
        value: 'old-domain.com',
        description: 'Deprecated partner domain',
        active: false, // Disabled domain
        category: 'deprecated',
        created_at: '2024-01-01T00:00:00Z',
        created_by: 'admin',
        last_accessed: '2024-08-15T16:20:00Z'
    }
];


export async function verifyToken(request) {
    try {
        // Get token from NextAuth JWT
        const token = await getToken({
            req: request,
            secret: process.env.NEXT_SECRET_KEY
        });

        if (!token) {
            return { error: 'No token provided.', status: 403 };
        }

        // Return user data from token
        return {
            user: {
                id: token.id,
                email: token.email,
                displayName: token.displayName,
                role: token.role,
                client: token.client,
                web3: token.web3,
                created_at: token.created_at
            }
        };
    } catch (error) {
        console.error('Token verification error:', error);
        return { error: 'Invalid token.', status: 403 };
    }
}

// Helper function to get CSRF token from NextAuth v5
export async function getCsrfToken() {
    try {
        // Get CSRF token from NextAuth v5
        const csrfResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/csrf`, {
            credentials: 'include'
        });

        if (!csrfResponse.ok) {
            throw new Error('Failed to fetch CSRF token');
        }

        const csrfData = await csrfResponse.json();
        const csrfToken = csrfData.csrfToken;

        if (!csrfToken) {
            throw new Error('Unable to obtain CSRF token');
        }

        return csrfToken;
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
        return null;
    }
}

// Verify CSRF token for public requests (NextAuth v5)
export async function verifyCsrfToken(request) {
    try {
        // Get CSRF token from NextAuth v5
        // Get CSRF token from request headers
        const headerCsrfToken = request.headers.get('x-csrf-token') ||
            request.headers.get('csrf-token');

        if (!headerCsrfToken) {
            return { error: 'CSRF token not provided in request headers.', status: 403 };
        }

        const cookieStore = await cookies();
        const csrfCookie = cookieStore.get("next-auth.csrf-token")?.value;

        if (!csrfCookie) return { error: 'CSRF token not provided in cookies.', status: 403 };

        // cookie format: "<token>|<hash>"
        const [token, hash] = csrfCookie.split("|");

        if (!token || !hash) return { error: 'CSRF token hash failed.', status: 403 };

        console.log(token);

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

// Enhanced public access middleware with better API key validation
export async function withPublicAccess(handler, options = {}) {
    const {
        requireApiKey = false,
        requireIpWhitelist = false,
        skipCsrfForApiKey = true,
        requiredPermission = null,
        logAccess = false
    } = options;

    return async (request, context) => {
        try {

            // Verify CSRF token (skip API key)
            let skipApi = false;
            if (skipCsrfForApiKey) {
                const csrfResult = await verifyCsrfToken(request);
                if (!csrfResult.error) {
                    skipApi = true;
                }
            }
            if (!skipApi && requireApiKey) {
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
            }

            return handler(request, context);
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
export async function withAuth(handler) {
    return async (request, context) => {

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

        return handler(request, context);
    };
}

// Higher-order function for protecting API routes with role requirement
export async function withAuthAndRole(requiredRoles = []) {
    return function(handler) {
        return async (request, context) => {
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

            return handler(request, context);
        };
    };
}

// Convenience function for admin-only routes
export async function withAdminAuth(handler) {
    return withAuthAndRole(['admin'])(handler);
}

// Validate API key for public requests
export async function validateApiKey(request) {
    try {
        // Get API key from headers
        const apiKey = request.headers.get('x-api-key') ||
            request.headers.get('authorization')?.replace('Bearer ', '');

        if (!apiKey) {
            return { error: 'API key is required for external access.', status: 401 };
        }

        // Get allowed API keys from environment
        const allowedApiKeys = mockApiKeys || [];

        if (!allowedApiKeys.includes(apiKey)) {
            return { error: 'Invalid API key.', status: 401 };
        }

        return { success: true };
    } catch (error) {
        console.error('API key validation error:', error);
        return { error: 'API key validation failed.', status: 401 };
    }
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
        const userAgent = request.headers.get('user-agent');

        // Check if it's an internal request (same host)
        const host = request.headers.get('host');
        const isInternal = origin?.includes(host) || referer?.includes(host) || clientIp === '127.0.0.1' || clientIp === '::1';

        if (isInternal) {
            return { success: true, isInternal: true };
        }

        // Get whitelisted IPs and domains from environment
        const whitelistedIps = mockWhitelist || [];
        const whitelistedDomains = mockWhitelist || [];

        // Check IP whitelist
        const isIpWhitelisted = whitelistedIps.some(ip => {
            if (ip.includes('/')) {
                // CIDR notation support (basic)
                const [network, mask] = ip.split('/');
                return clientIp.startsWith(network.split('.').slice(0, parseInt(mask) / 8).join('.'));
            }
            return clientIp === ip;
        });

        // Check domain whitelist
        const isDomainWhitelisted = whitelistedDomains.some(domain => {
            return origin?.includes(domain) || referer?.includes(domain);
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
