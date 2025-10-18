'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ResetForm } from '@/components/reset-form';

const ResetPasswordPage = () => {
    const _router = useRouter();
    const searchParams = useSearchParams();
    const [isValidating, setIsValidating] = useState(true);
    const [validParams, setValidParams] = useState({ email: '', token: '' });

    useEffect(() => {
        const emailParam = searchParams.get('email');
        const codeParam = searchParams.get('code');
        const tokenParam = searchParams.get('token');

        if (emailParam && codeParam && tokenParam) {
            setValidParams({
                email: decodeURIComponent(emailParam),
                code: decodeURIComponent(codeParam),
                token: decodeURIComponent(tokenParam)
            });
        }
        setIsValidating(false);
    }, [searchParams]);

    if (isValidating) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2"></div>
                    <p className="text-gray-600">Validating reset link...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className="auth-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}>
            <ResetForm
                initialEmail={validParams.email}
                initialCode={validParams.code}
                initialToken={validParams.token}
            />
            <div className="mt-6 text-center">
                <Link href="/" className="text-blue-500 hover:underline">
                    ← Back to Home
                </Link>
            </div>
        </motion.div>
    );
};

export default ResetPasswordPage;
