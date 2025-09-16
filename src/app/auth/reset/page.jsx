// app/auth/reset/page.jsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";

const ResetPasswordPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [email, setEmail] = useState("");
    const [token, setToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const emailParam = searchParams.get('email');
        const tokenParam = searchParams.get('token');

        if (!emailParam || !tokenParam) {
            toast.error('Invalid reset link. Please try again.');
            router.push('/auth/forgot');
            return;
        }

        setEmail(decodeURIComponent(emailParam));
        setToken(decodeURIComponent(tokenParam));
    }, [searchParams, router]);

    const showPassword = () => setShowPwd((prev) => !prev);

    const passwordValid = (pwd) => {
        return (
            pwd.length >= 8 &&
            pwd.length <= 32 &&
            /[a-z]/.test(pwd) &&
            /[A-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)
        );
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Client-side validation
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match.');
            setLoading(false);
            return;
        }

        if (!passwordValid(newPassword)) {
            toast.error('Password must be at least 8 characters with lowercase and one uppercase or number.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/auth/api/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    newPassword,
                    confirmPassword,
                    token, // Pass the encrypted code as token
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error);

                // If token is expired/invalid, redirect to forgot password
                if (data.error.includes('expired') || data.error.includes('Invalid')) {
                    setTimeout(() => {
                        router.push('/auth/forgot');
                    }, 2000);
                }
                setLoading(false);
                return;
            }

            toast.success(data.message);
            // Navigate to login page with email pre-filled
            router.push(`/auth/login?email=${encodeURIComponent(email)}`);

        } catch (error) {
            console.error('Reset password error:', error);
            toast.error("Failed to update password.");
        }

        setLoading(false);
    };

    if (!email || !token) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Validating reset link...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-section section">
            <div className="w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Enter your new password for <strong>{email}</strong>
                    </p>
                </div>

                <motion.form
                    onSubmit={handlePasswordReset}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="auth-card"
                >
                    <div className="auth-input-group">
                        <label className="block font-semibold mb-2">New Password</label>
                        <div className="relative flex h-12 items-center">
                            <input
                                disabled={loading}
                                type={showPwd ? "text" : "password"}
                                placeholder="Enter your new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full border-none outline-none"
                                required
                            />
                            <span
                                onClick={showPassword}
                                className="button absolute end-0 top-0 bottom-0 ml-2 border-none bg-transparent text-sm hover:text-gray-600"
                            >
                                {showPwd ? <IoMdEyeOff size={22} /> : <IoMdEye size={22} />}
                            </span>
                        </div>

                        {/* Password Requirements */}
                        <ul className="mt-2 text-sm text-gray-500 list-disc ml-6 space-y-1">
                            <li className={newPassword.length >= 8 && newPassword.length <= 32 ? "text-green-600" : "text-red-500"}>
                                8–32 characters
                            </li>
                            <li className={/[a-z]/.test(newPassword) ? "text-green-600" : "text-red-500"}>
                                Includes lowercase letter
                            </li>
                            <li className={/[A-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword) ? "text-green-600" : "text-red-500"}>
                                Includes uppercase, number, or symbol
                            </li>
                        </ul>
                    </div>

                    <div className="auth-input-group">
                        <label className="block font-semibold mb-2">Confirm New Password</label>
                        <div className="relative flex h-12 items-center">
                            <input
                                disabled={loading}
                                type={showPwd ? "text" : "password"}
                                placeholder="Confirm your new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full border-none outline-none"
                                required
                            />
                            <span
                                onClick={showPassword}
                                className="button absolute end-0 top-0 bottom-0 ml-2 border-none bg-transparent text-sm hover:text-gray-600"
                            >
                                {showPwd ? <IoMdEyeOff size={22} /> : <IoMdEye size={22} />}
                            </span>
                        </div>

                        {confirmPassword && newPassword !== confirmPassword && (
                            <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
                        )}
                    </div>

                    <motion.button
                        type="submit"
                        whileTap={{ scale: 0.98 }}
                        whileHover={{ scale: 1.02 }}
                        disabled={
                            loading ||
                            !passwordValid(newPassword) ||
                            newPassword !== confirmPassword
                        }
                        className="w-full w-full bg-black text-white dark:bg-white dark:text-black"
                    >
                        {loading ? "Updating Password..." : "Reset Password"}
                    </motion.button>
                </motion.form>

                <div className="mt-6 text-center">
                    <Link href="/auth/login" className="text-blue-500 hover:underline">
                        ← Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
