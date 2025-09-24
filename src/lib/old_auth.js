// @/auth.js
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import FacebookProvider from 'next-auth/providers/facebook';
import TwitterProvider from 'next-auth/providers/twitter';
import DiscordProvider from 'next-auth/providers/discord';
import LinkedInProvider from 'next-auth/providers/linkedin'; 

// Function to fetch settings from API
async function fetchSettings() {
    try {
        // Use process.env.NEXTAUTH_URL or build URL
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/query/public/site_settings?_t=${Date.now()}`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data && data.data.length > 0) {
                return data.data[0];
            }
        }
    } catch (error) {
        console.error('Failed to fetch settings:', error);
    }
    return null;
}

// Utility function to get base URL from various sources
export function getBaseUrl(req = null) {

    // 1. Try NEXTAUTH_URL (NextAuth's standard env var)
    if (process.env.NEXTAUTH_URL) {
        return process.env.NEXTAUTH_URL;
    }

    // 2. If we have a request object (rare in NextAuth context)
    if (req) {
        const headers = req.headers;
        const host = headers.get?.('host') || headers.host;
        const protocol = headers.get?.('x-forwarded-proto') ||
            headers['x-forwarded-proto'] ||
            (host?.includes('localhost') ? 'http' : 'https');
        return `${protocol}://${host}`;
    }

    // 6. Last resort - throw error
    throw new Error('Unable to determine base URL. Please set NEXTAUTH_URL environment variable.');
}

// Function to build auth config dynamically\nasync function buildAuthConfig() {\n    const settings = await fetchSettings();\n    \n    // Start with credentials provider\n    const providers = [\n        CredentialsProvider({\n            id: 'credentials',\n            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
                client: { label: 'Client', type: 'text' },
                action: { label: 'Action', type: 'text' },
                name: { label: 'Name', type: 'text' }
            },
            async authorize(credentials, req) {
                try {
                    const { email, password, client, action, name } = credentials;

                    if (!client) {
                        throw new Error('Invalid request: Client mismatch.');
                    }
                    if (!email || !password) {
                        throw new Error('Email and Password are required.');
                    }

                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(email)) {
                        throw new Error('Invalid email format.');
                    }

                    const inpEmail = email.toLowerCase();
                    const passwordHash = atob(password);

                    // Get base URL automatically
                    const baseUrl = getBaseUrl(req);

                    console.log('Using base URL:', baseUrl); // For debugging

                    const authResponse = await fetch(`${baseUrl}/auth/api/handler`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            email: inpEmail,
                            password: passwordHash,
                            client,
                            action,
                            name
                        })
                    });

                    if(authResponse.ok){
                        console.log(authResponse); // For debugging 
                        const res = await authResponse.json();

                        if (res?.error) {
                            return res.error;
                        }

                        return res;
                    } else {
                        return null;
                    }

                    return null;
                } catch (error) {
                    console.error('Auth error:', error);
                    throw error;
                }
            }
        })
    ],
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60 // 30 days
    },
    jwt: {
        maxAge: 30 * 24 * 60 * 60 // 30 days
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.displayName = user.displayName;
                token.role = user.role;
                token.client = user.client;
                token.web3 = user.web3;
                token.created_at = user.created_at;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.email = token.email;
                session.user.displayName = token.displayName;
                session.user.role = token.role;
                session.user.client = token.client;
                session.user.web3 = token.web3;
                session.user.created_at = token.created_at;
            }
            return session;
        }
    },
    pages: {
        signIn: '/auth/login',
        signOut: '/auth/logout',
        error: '/auth/error'
    },
    secret: process.env.NEXT_SECRET,
    debug: process.env.NODE_ENV === 'development'
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig)
