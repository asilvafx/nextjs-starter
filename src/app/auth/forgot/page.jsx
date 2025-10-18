'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ForgotForm } from '@/components/forgot-form';

const ForgotPasswordPage = () => {
    return (
        <motion.div
            className="auth-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}>
            <ForgotForm />
            <div className="mt-6 text-center">
                <Link href="/" className="text-blue-500 hover:underline">
                    ← Back to Home
                </Link>
            </div>
        </motion.div>
    );
};

export default ForgotPasswordPage;
