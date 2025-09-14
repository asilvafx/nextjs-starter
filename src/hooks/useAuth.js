// src/hooks/useAuth.js
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

// Client-side hook for components
export const useAuth = () => {
    const { data: session, status } = useSession();

    const logout = async () => {
        await signOut({
            callbackUrl: '/auth/login',
            redirect: true
        });
    };

    return {
        user: session?.user || null,
        isAuthenticated: status === "authenticated",
        isLoading: status === "loading",
        logout,
        session,
        status
    };
};

// Utility function for making authenticated API calls
export const authenticatedFetch = async (url, options = {}) => {
    const defaultOptions = {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    try {
        const response = await fetch(url, defaultOptions);

        // If session expired, redirect to login
        if (response.status === 401 || response.status === 403) {
            await signOut({
                callbackUrl: '/auth/login',
                redirect: true
            });
            return null;
        }

        return response;
    } catch (error) {
        console.error('Authenticated fetch error:', error);
        throw error;
    }
};

// Hook for checking authentication status
export const useAuthCheck = () => {
    const { status } = useSession();

    const checkAuth = () => {
        return status === "authenticated";
    };

    return {
        checkAuth,
        isLoading: status === "loading",
        isAuthenticated: status === "authenticated"
    };
};

// HOC for protecting pages
export const withAuth = (WrappedComponent) => {
    return function AuthenticatedComponent(props) {
        const { status } = useSession();
        const router = useRouter();

        if (status === "loading") {
            return (
                <div className="min-h-screen flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            );
        }

        if (status === "unauthenticated") {
            router.push('/auth/login');
            return null;
        }

        return <WrappedComponent {...props} />;
    };
};

// HOC for protecting pages with role requirements
export const withAuthAndRole = (requiredRoles = []) => {
    return (WrappedComponent) => {
        return function RoleAuthenticatedComponent(props) {
            const { data: session, status } = useSession();
            const router = useRouter();

            if (status === "loading") {
                return (
                    <div className="min-h-screen flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                );
            }

            if (status === "unauthenticated") {
                router.push('/auth/login');
                return null;
            }

            const userRole = session?.user?.role;
            const roles = [...requiredRoles, 'admin'];

            if (roles.length > 0 && !roles.includes(userRole)) {
                return (
                    <div className="min-h-screen flex justify-center items-center">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                            <p className="mt-2 text-gray-600">
                                You don't have permission to access this page.
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                Required role(s): {roles.join(', ')}. Your role: {userRole}
                            </p>
                        </div>
                    </div>
                );
            }

            return <WrappedComponent {...props} />;
        };
    };
};

// Convenience HOC for admin-only pages
export const withAdminAuth = (WrappedComponent) => {
    return withAuthAndRole(['admin'])(WrappedComponent);
};
