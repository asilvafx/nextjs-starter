// app/auth/logout/page.js
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/hooks/useAuth';

export default function LogoutPage() {
    const { logout, status, session } = useAuth();
    const router = useRouter();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [hasSignedOut, setHasSignedOut] = useState(false);

    useEffect(() => {
        const handleSignOut = async () => {
            if (status !== 'loading' && session && !isSigningOut && !hasSignedOut) {
                setIsSigningOut(true);
                try {
                    await logout();
                    setHasSignedOut(true);
                } catch (error) {
                    console.error('Sign out error:', error);
                    // Force redirect even if there's an error
                    router.push('/auth/login');
                }
            } else if (status !== 'loading') {
                // Already signed out, redirect to login
                router.push('/auth/login');
            }
        };

        // Small delay to prevent flash
        const timeout = setTimeout(handleSignOut, 500);
        return () => clearTimeout(timeout);
    }, [session, isSigningOut, hasSignedOut]);

    // Show different content based on auth status
    if (status === 'loading') {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                    <div className="text-lg">Loading...</div>
                </motion.div>
            </div>
        );
    }

    if (status === 'unauthenticated' || hasSignedOut) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-auto max-w-md p-6 text-center">
                    <div className="mb-4 font-bold text-2xl text-gray-900">Signed Out Successfully</div>
                    <p className="mb-6 text-gray-600">You have been signed out of your account.</p>
                    <div className="space-y-3">
                        <Link href="/" className="block">
                            <Button>Back to Home</Button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                <div className="text-lg">Signing out...</div>
                <div className="mt-4">
                    <LoadingSpinner size="lg" className="mx-auto" />
                </div>
            </motion.div>
        </div>
    );
}
