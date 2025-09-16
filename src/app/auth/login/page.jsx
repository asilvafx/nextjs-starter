// app/auth/login/page.jsx
'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Fingerprint from '@/utils/fingerprint.js';

import { motion } from 'framer-motion';
import { signIn, useSession } from 'next-auth/react';
import { toast } from '@/components/ui/sonner';
import { IoMdEye, IoMdEyeOff } from 'react-icons/io';
import Turnstile from 'react-turnstile';

// app/auth/login/page.jsx

const TurnstileKey = process.env.NEXT_PUBLIC_CF_TURNSTILE_API || null;

const LoginPage = () => {
    const router = useRouter();
    const { data: session, status } = useSession();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isTurnstileVerified, setIsTurnstileVerified] = useState(false);

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/');
        }

        // Check for email in URL params (from reset password redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const emailParam = urlParams.get('email');
        if (emailParam) {
            setEmail(decodeURIComponent(emailParam));
        }
    }, [status, router]);

    const showPassword = () => setShowPwd((prev) => !prev);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (TurnstileKey && !isTurnstileVerified) {
            toast.error('Please complete the verification.');
            return;
        }
        setLoading(true);

        try {
            const browserUnique = await Fingerprint();
            const passwordHash = btoa(password);

            const result = await signIn('credentials', {
                email,
                password: passwordHash,
                client: browserUnique,
                action: 'login',
                redirect: false
            });

            if (result?.error) {
                toast.error('Invalid credentials');
                setLoading(false);
                return;
            }

            if (result?.ok) {
                toast.success('Login successful!');
                router.push('/');
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Login failed.');
            setLoading(false);
        }
    };

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

    return (
        <div className='auth-section'>
            <div className='mb-8 text-center'>
                <h1 className='text-3xl font-bold'>Sign In</h1>
                <p className='mt-2 text-sm text-gray-600'>Welcome back! Please sign in to your account.</p>
            </div>

            <motion.form
                className='auth-card'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                onSubmit={handleLogin}>
                <div className='auth-input-group'>
                    <label aria-label='email' className='mb-2 block font-semibold'>
                        Email
                    </label>
                    <input
                        name='email'
                        disabled={loading}
                        type='email'
                        placeholder='Enter your Email'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className='w-full py-1 px-2 border-none outline-none'
                        required
                    />
                </div>

                <div className='auth-input-group'>
                    <label className='mb-2 block font-semibold'>Password</label>
                    <div className='relative flex h-12 items-center'>
                        <input
                            disabled={loading}
                            type={showPwd ? 'text' : 'password'}
                            placeholder='Enter your Password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className='w-full py-1 px-2 border-none outline-none'
                            required
                        />
                        <span
                            onClick={showPassword}
                            className='button absolute end-0 top-0 bottom-0 flex items-center mr-2 border-none bg-transparent text-sm hover:text-gray-600'>
                            {showPwd ? <IoMdEyeOff size={22} /> : <IoMdEye size={22} />}
                        </span>
                    </div>
                </div>


                {TurnstileKey && (
                    <div className='flex justify-center'>
                        <Turnstile
                            sitekey={TurnstileKey}
                            theme='light'
                            size='flexible'
                            onVerify={() => setIsTurnstileVerified(true)}
                        />
                    </div>
                )}

                <motion.button
                    type='submit'
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading || (TurnstileKey && !isTurnstileVerified)}
                    className='w-full bg-black text-white py-1 px-2 text-lg font-semibold'>
                    {loading ? 'Please wait...' : 'Sign In'}
                </motion.button>

                <div className="w-full flex flex-nowrap items-center justify-between">

                    <p className='text-center text-sm text-gray-500'>
                        Don't have an account?{' '}
                        <Link href='/auth/register' className='font-medium text-blue-500 hover:underline'>
                            Sign Up
                        </Link>
                    </p>
                    <p className="text-sm">
                        <Link href='/auth/forgot' className='text-blue-500 hover:underline'>
                            Forgot password?
                        </Link>
                    </p>
                </div>
            </motion.form>

            <div className='mt-6 text-center'>
                <Link href='/' className='text-blue-500 hover:underline'>
                    ← Back to Home
                </Link>
            </div>
        </div>
    );
};

export default LoginPage;
