// app/auth/login/page.jsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoginForm } from "@/components/login-form";
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';

const LoginPage = () => {
    const router = useRouter();
    const { status } = useSession();

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/');
        }
    }, [status, router]);

    if (status === 'loading') {
        return (
            <div className='flex min-h-screen items-center justify-center'>
                <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500'></div>
            </div>
        );
    }

    if (status === 'authenticated') {
        return null;
    }

    // Get email from URL params if it exists
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const emailParam = urlParams?.get('email');
    const initialEmail = emailParam ? decodeURIComponent(emailParam) : '';

    return (
        <motion.div 
            className='auth-section'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <LoginForm initialEmail={initialEmail} />
            <div className='mt-6 text-center'>
                <Link href='/' className='text-blue-500 hover:underline'>
                    ← Back to Home
                </Link>
            </div>
        </motion.div>
    );
};

export default LoginPage;
