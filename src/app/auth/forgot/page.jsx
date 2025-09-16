// app/auth/forgot/page.jsx
"use client";

import { useState } from "react";
import { toast } from "@/components/ui/sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Turnstile from "react-turnstile";
import { motion, AnimatePresence } from "framer-motion";

const TurnstileKey = process.env.NEXT_PUBLIC_CF_TURNSTILE_API || null;

const ForgotPasswordPage = () => {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [step, setStep] = useState("email"); // 'email' | 'code'
    const [code, setCode] = useState("");
    const [encryptedCode, setEncryptedCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [isTurnstileVerified, setIsTurnstileVerified] = useState(false);

    const handleSendCode = async (e) => {
        e.preventDefault();
        if (TurnstileKey && !isTurnstileVerified) {
            toast.error('Please complete the verification.');
            return;
        }
        setLoading(true);

        try {
            const response = await fetch('/auth/api/forgot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email.toLowerCase() }),
            });

            const data = await response.json();

            if (!data.success) {
                toast.error(data.error);
                setLoading(false);
                return;
            }

            if (data.encryptedCode) {
                setEncryptedCode(data.encryptedCode);
                toast.success(`${data.message}`);
                setStep("code");
            } else {
                // Email doesn't exist in system, but don't reveal this for security
                toast.success(data.message);
            }

        } catch (error) {
            console.error('Send code error:', error);
            toast.error("Error sending code.");
        }

        setLoading(false);
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/auth/api/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: code,
                    encryptedCode: encryptedCode
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error);
                setLoading(false);
                return;
            }

            toast.success(data.message);
            // Navigate to reset password page with email and token
            router.push(`/auth/reset?email=${encodeURIComponent(email)}&code=${code}&token=${encodeURIComponent(encryptedCode)}`);

        } catch (error) {
            console.error('Verify code error:', error);
            toast.error("Error verifying code.");
        }

        setLoading(false);
    };

    return (
        <div className="auth-section section">
            <div className="w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Forgot Password</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        {step === "email"
                            ? "Enter your email to receive a reset code"
                            : "Enter the 6-digit code sent to your email"
                        }
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {step === "email" && (
                        <motion.form
                            key="email"
                            onSubmit={handleSendCode}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="auth-card"
                        >
                            <div className="auth-input-group">
                                <label className="block font-semibold mb-2">Email Address</label>
                                <div className="relative flex h-12 items-center">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="w-full border-none outline-none"
                                        disabled={loading}
                                        required
                                    />
                                </div>
                            </div>

                            {TurnstileKey && (
                                <div className="flex justify-center">
                                    <Turnstile
                                        sitekey={TurnstileKey}
                                        theme="light"
                                        size="flexible"
                                        onVerify={() => setIsTurnstileVerified(true)}
                                    />
                                </div>
                            )}

                            <motion.button
                                type="submit"
                                whileTap={{ scale: 0.98 }}
                                whileHover={{ scale: 1.02 }}
                                disabled={loading || (TurnstileKey && !isTurnstileVerified)}
                                className="w-full bg-black text-white"
                            >
                                {loading ? "Sending..." : "Send Reset Code"}
                            </motion.button>
                        </motion.form>
                    )}

                    {step === "code" && (
                        <motion.form
                            key="code"
                            onSubmit={handleVerifyCode}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="card"
                        >
                            <div className="auth-input-group">
                                <label className="block font-semibold mb-2">Verification Code</label>
                                <div className="relative flex h-12 items-center">
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="••••••"
                                        className="w-full border-none outline-none text-center tracking-widest text-xl font-mono"
                                        disabled={loading}
                                        maxLength={6}
                                        required
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Code sent to: {email}
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <motion.button
                                    type="button"
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        setStep("email");
                                        setCode("");
                                        setEncryptedCode("");
                                    }}
                                    className="flex-1"
                                >
                                    Back
                                </motion.button>

                                <motion.button
                                    type="submit"
                                    whileTap={{ scale: 0.98 }}
                                    whileHover={{ scale: 1.02 }}
                                    disabled={loading || code.length !== 6}
                                    className="flex-1 w-full bg-black text-white"
                                >
                                    {loading ? "Verifying..." : "Verify Code"}
                                </motion.button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>

                <div className="mt-6 text-center">
                    <Link href="/auth/login" className="text-blue-500 hover:underline">
                        ← Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
