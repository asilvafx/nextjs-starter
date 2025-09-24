// @/app/auth/register/page.jsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RegisterForm } from "@/components/register-form";
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';

const RegisterPage = () => {
    const router = useRouter();
    const { status } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [registrationAllowed, setRegistrationAllowed] = useState(false);

    useEffect(() => {
        const checkSettings = async () => {
            try {
                const response = await fetch('/api/query/public/site_settings?_t=' + Date.now());
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data && data.data.length > 0) {
                        const settings = data.data[0];
                        if (settings.allowRegistration === false) {
                            router.push('/auth/login');
                            return;
                        }
                        setRegistrationAllowed(true);
                    } else {
                        // If no settings found, allow registration by default
                        setRegistrationAllowed(true);
                    }
                } else {
                    // If API fails, allow registration by default
                    setRegistrationAllowed(true);
                }
            } catch (error) {
                console.error('Failed to fetch settings:', error);
                // If error, allow registration by default
                setRegistrationAllowed(true);
            } finally {
                setIsLoading(false);
            }
        };

        if (status === "authenticated") {
            router.push("/");
        } else if (status === "unauthenticated") {
            checkSettings();
        }
    }, [status, router]);

    if (status === "loading" || isLoading) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (status === "authenticated") {
        return null;
    }

    if (!registrationAllowed) {
        return null; // Will redirect to login
    }

    return (
        <motion.div 
            className='auth-section'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <RegisterForm />
            <div className='mt-6 text-center'>
                <Link href='/' className='text-blue-500 hover:underline'>
                    ← Back to Home
                </Link>
            </div>
        </motion.div>
    );
};

export default RegisterPage;