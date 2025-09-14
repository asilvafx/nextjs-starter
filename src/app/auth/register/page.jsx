"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Turnstile from "react-turnstile";
import { motion } from "framer-motion";
import Link from "next/link";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import Fingerprint from '@/utils/fingerprint.js';

const TurnstileKey = process.env.NEXT_PUBLIC_CF_TURNSTILE_API || null;

const RegisterPage = () => {
    const router = useRouter();
    const { data: session, status } = useSession();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isTurnstileVerified, setIsTurnstileVerified] = useState(false);

    useEffect(() => {
        if (status === "authenticated") {
            router.push("/");
        }
    }, [status, router]);

    const showPassword = () => setShowPwd((prev) => !prev);

    const passwordValid = (pwd) => {
        return (
            pwd.length >= 8 &&
            pwd.length <= 32 &&
            /[a-z]/.test(pwd) &&
            /[A-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)
        );
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (TurnstileKey && !isTurnstileVerified) {
            toast.error('Please complete the verification.');
            return;
        }
        if (!confirmPassword || password !== confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }
        setLoading(true);

        try {
            const browserUnique = await Fingerprint();
            const passwordHash = btoa(password);

            const result = await signIn('credentials', {
                name,
                email,
                password: passwordHash,
                client: browserUnique,
                action: 'register',
                redirect: false
            });

            if (result?.error) {

                console.log(result)
                toast.error(result.error);
                setLoading(false);
                return;
            }

            if (result?.ok) {

                toast.success('Registration successful!');
                router.push("/");
            }
        } catch (err) {
            console.error('Registration error:', err);
            toast.error("Registration failed.");
        }
        setLoading(false);
    };

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
        <div className="auth-section section">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Join us today! Create your account to get started.
                </p>
            </div>

            <motion.form
                className="auth-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                onSubmit={handleRegister}
            >
                <div className="auth-input-group">
                    <label className="block font-semibold mb-2">Account Name</label>
                    <div className="relative flex h-12 items-center">
                        <input
                            disabled={loading}
                            type="text"
                            placeholder="Enter your Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full"
                            required
                        />
                    </div>
                </div>

                <div className="auth-input-group">
                    <label className="block font-semibold mb-2">Email</label>
                    <div className="relative flex h-12 items-center">
                        <input
                            disabled={loading}
                            type="email"
                            placeholder="Enter your Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border-none outline-none"
                            required
                        />
                    </div>
                </div>

                <div className="auth-input-group">
                    <label className="block font-semibold mb-2">Password</label>
                    <div className="relative flex h-12 items-center">
                        <input
                            disabled={loading}
                            type={showPwd ? "text" : "password"}
                            placeholder="Enter your Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
                        <li className={password.length >= 8 && password.length <= 32 ? "text-green-600" : "text-red-500"}>
                            8–32 characters
                        </li>
                        <li className={/[a-z]/.test(password) ? "text-green-600" : "text-red-500"}>
                            Includes lowercase letter
                        </li>
                        <li className={/[A-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) ? "text-green-600" : "text-red-500"}>
                            Includes uppercase, number, or symbol
                        </li>
                    </ul>
                </div>

                <div className="auth-input-group">
                    <label className="block font-semibold mb-2">Confirm Password</label>
                    <div className="relative flex h-12 items-center">
                        <input
                            disabled={loading}
                            type={showPwd ? "text" : "password"}
                            placeholder="Confirm your Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full border-none outline-none"
                            required
                        />
                        <span
                            onClick={showPassword}
                            className="button absolute end-0 top-0 bottom-0 ml-2 border-none bg-transparent text-sm hover:text-gray-600"
                        >
                            {showPwd ? <IoMdEyeOff size={22}/> : <IoMdEye size={22}/>}
                        </span>
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
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading || (TurnstileKey && !isTurnstileVerified)}
                    className="w-full primary"
                >
                    {loading ? "Please wait..." : "Create Account"}
                </motion.button>

                <p className="text-center text-sm text-gray-500">
                    Already have an account?{" "}
                    <Link href="/auth/login" className="text-blue-500 font-medium hover:underline">
                        Sign In
                    </Link>
                </p>

            </motion.form>

            <div className="mt-6 text-center">
                <Link href="/" className="text-blue-500 hover:underline">
                    ← Back to Home
                </Link>
            </div>
        </div>
    );
};

export default RegisterPage;
