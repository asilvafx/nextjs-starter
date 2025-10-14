// app/auth/logout/page.js
"use client";

import { useEffect, useState } from "react"; 
import {useAuth} from "@/hooks/useAuth";
import { motion } from "framer-motion";
import Link from "next/link";
import {useRouter} from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function LogoutPage() { 
    const { logout, status, session } = useAuth();
    const router = useRouter();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [hasSignedOut, setHasSignedOut] = useState(false);

    useEffect(() => {
        const handleSignOut = async () => {
            if (status !== "loading" && session && !isSigningOut && !hasSignedOut) {
                setIsSigningOut(true);
                try {
                    await logout();
                    setHasSignedOut(true);
                } catch (error) {
                    console.error('Sign out error:', error);
                    // Force redirect even if there's an error
                    router.push('/auth/login')
                }
            } else if(status !== "loading") {
                // Already signed out, redirect to login
                router.push('/auth/login')
            }
        };

        // Small delay to prevent flash
        const timeout = setTimeout(handleSignOut, 500);
        return () => clearTimeout(timeout);
    }, [session, isSigningOut, hasSignedOut]);

    // Show different content based on auth status
    if (status === "loading") {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                >
                    <div className="text-lg">Loading...</div>
                </motion.div>
            </div>
        );
    }

    if (status === "unauthenticated" || hasSignedOut) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-md mx-auto p-6"
                >
                    <div className="text-2xl font-bold text-gray-900 mb-4">
                        Signed Out Successfully
                    </div>
                    <p className="text-gray-600 mb-6">
                        You have been signed out of your account.
                    </p>
                    <div className="space-y-3"> 
                        <Link
                            href="/"
                            className="block"
                        >
                            <Button> 
                            Back to Home
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex justify-center items-center">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
            >
                <div className="text-lg">Signing out...</div>
                <div className="mt-4">
                    <LoadingSpinner size="lg" className="mx-auto" />
                </div>
            </motion.div>
        </div>
    );
}
