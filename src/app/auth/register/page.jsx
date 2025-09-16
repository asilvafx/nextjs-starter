'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RegisterForm } from "@/components/register-form";
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';

const RegisterPage = () => {
    const router = useRouter();
    const { status } = useSession();

    useEffect(() => {
        if (status === "authenticated") {
            router.push("/");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (status === "authenticated") {
        return null;
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
