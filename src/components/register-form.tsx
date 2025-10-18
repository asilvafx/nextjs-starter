import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { IoMdEye, IoMdEyeOff } from 'react-icons/io';
import Turnstile from 'react-turnstile';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getTurnstileSiteKey } from '@/lib/client/integrations';
import { cn } from '@/lib/utils';
import Fingerprint from '@/utils/fingerprint.js';

export function RegisterForm({ className, ...props }: React.ComponentProps<'div'>) {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isTurnstileVerified, setIsTurnstileVerified] = useState(false);
    const [turnstileKey, setTurnstileKey] = useState<string | null>(null);

    const showPassword = () => setShowPwd((prev) => !prev);

    useEffect(() => {
        const fetchTurnstileKey = async () => {
            const key = await getTurnstileSiteKey();
            setTurnstileKey(key);
        };
        fetchTurnstileKey();
    }, []);

    const _passwordValid = (pwd: string) => {
        return (
            pwd.length >= 8 &&
            pwd.length <= 32 &&
            /[a-z]/.test(pwd) &&
            /[A-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)
        );
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (turnstileKey && !isTurnstileVerified) {
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
                console.log(result);
                toast.error(result.error);
                setLoading(false);
                return;
            }

            if (result?.ok) {
                toast.success('Registration successful!');
                router.push('/');
            }
        } catch (err) {
            console.error('Registration error:', err);
            toast.error('Registration failed.');
        }
        setLoading(false);
    };

    return (
        <div className={cn('flex flex-col gap-6', className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle>Create Account</CardTitle>
                    <CardDescription>Join us today! Create your account to get started.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegister}>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="name">Account Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    name="name"
                                    disabled={loading}
                                    placeholder="Enter your Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    disabled={loading}
                                    placeholder="Enter your Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPwd ? 'text' : 'password'}
                                        disabled={loading}
                                        placeholder="Enter your Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        tabIndex={-1}
                                        type="button"
                                        onClick={showPassword}
                                        className="-translate-y-1/2 absolute top-1/2 right-2 text-gray-500 hover:text-gray-700">
                                        {showPwd ? <IoMdEyeOff size={22} /> : <IoMdEye size={22} />}
                                    </button>
                                </div>

                                {/* Password Requirements */}
                                <ul className="ml-6 list-disc space-y-1 text-gray-500 text-sm">
                                    <li
                                        className={
                                            password.length >= 8 && password.length <= 32
                                                ? 'text-green-600'
                                                : 'text-red-500'
                                        }>
                                        8–32 characters
                                    </li>
                                    <li className={/[a-z]/.test(password) ? 'text-green-600' : 'text-red-500'}>
                                        Includes lowercase letter
                                    </li>
                                    <li
                                        className={
                                            /[A-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
                                                ? 'text-green-600'
                                                : 'text-red-500'
                                        }>
                                        Includes uppercase, number, or symbol
                                    </li>
                                </ul>
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showPwd ? 'text' : 'password'}
                                        disabled={loading}
                                        placeholder="Confirm your Password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        tabIndex={-1}
                                        type="button"
                                        onClick={showPassword}
                                        className="-translate-y-1/2 absolute top-1/2 right-2 text-gray-500 hover:text-gray-700">
                                        {showPwd ? <IoMdEyeOff size={22} /> : <IoMdEye size={22} />}
                                    </button>
                                </div>
                            </div>

                            {turnstileKey && (
                                <div className="flex justify-center">
                                    <Turnstile
                                        sitekey={turnstileKey}
                                        theme="light"
                                        size="flexible"
                                        onVerify={() => setIsTurnstileVerified(true)}
                                    />
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                <Button
                                    type="submit"
                                    disabled={loading || (!!turnstileKey && !isTurnstileVerified)}
                                    className="w-full">
                                    {loading ? 'Please wait...' : 'Create Account'}
                                </Button>
                            </div>
                        </div>
                        <div className="mt-4 text-center text-sm">
                            Already have an account?{' '}
                            <Link href="/auth/login" className="text-blue-500 hover:underline">
                                Sign In
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
