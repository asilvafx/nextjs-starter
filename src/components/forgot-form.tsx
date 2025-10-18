import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Turnstile from 'react-turnstile';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getTurnstileSiteKey } from '@/lib/client/integrations';
import { cn } from '@/lib/utils';

export function ForgotForm({ className, ...props }: React.ComponentProps<'div'>) {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [step, setStep] = useState('email'); // 'email' | 'code'
    const [code, setCode] = useState('');
    const [encryptedCode, setEncryptedCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [isTurnstileVerified, setIsTurnstileVerified] = useState(false);
    const [turnstileKey, setTurnstileKey] = useState<string | null>(null);

    useEffect(() => {
        const fetchTurnstileKey = async () => {
            const key = await getTurnstileSiteKey();
            setTurnstileKey(key);
        };
        fetchTurnstileKey();
    }, []);

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (turnstileKey && !isTurnstileVerified) {
            toast.error('Please complete the verification.');
            return;
        }
        setLoading(true);

        try {
            const response = await fetch('/auth/api/forgot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email.toLowerCase() })
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
                setStep('code');
            } else {
                // Email doesn't exist in system, but don't reveal this for security
                toast.success(data.message);
            }
        } catch (error) {
            console.error('Send code error:', error);
            toast.error('Error sending code.');
        }

        setLoading(false);
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/auth/api/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: code,
                    encryptedCode: encryptedCode
                })
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error);
                setLoading(false);
                return;
            }

            toast.success(data.message);
            // Navigate to reset password page with email and token
            router.push(
                `/auth/reset?email=${encodeURIComponent(email)}&code=${code}&token=${encodeURIComponent(encryptedCode)}`
            );
        } catch (error) {
            console.error('Verify code error:', error);
            toast.error('Error verifying code.');
            setLoading(false);
        }
    };

    return (
        <div className={cn('flex flex-col gap-6', className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle>Forgot Password</CardTitle>
                    <CardDescription>
                        {step === 'email'
                            ? 'Enter your email to receive a reset code'
                            : 'Enter the 6-digit code sent to your email'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AnimatePresence mode="wait">
                        {step === 'email' ? (
                            <motion.form
                                key="email"
                                onSubmit={handleSendCode}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4 }}
                                className="flex flex-col gap-6">
                                <div className="grid gap-3">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        disabled={loading}
                                        required
                                    />
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

                                <Button
                                    type="submit"
                                    disabled={loading || (!!turnstileKey && !isTurnstileVerified)}
                                    className="w-full">
                                    {loading ? 'Sending...' : 'Send Reset Code'}
                                </Button>
                            </motion.form>
                        ) : (
                            <motion.form
                                key="code"
                                onSubmit={handleVerifyCode}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4 }}
                                className="flex flex-col gap-6">
                                <div className="grid gap-3">
                                    <Label htmlFor="code">Verification Code</Label>
                                    <Input
                                        id="code"
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="••••••"
                                        className="text-center font-mono text-xl tracking-widest"
                                        disabled={loading}
                                        maxLength={6}
                                        required
                                    />
                                    <p className="text-gray-500 text-xs">Code sent to: {email}</p>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setStep('email');
                                            setCode('');
                                            setEncryptedCode('');
                                        }}
                                        className="flex-1">
                                        Back
                                    </Button>

                                    <Button type="submit" disabled={loading || code.length !== 6} className="flex-1">
                                        {loading ? 'Verifying...' : 'Verify Code'}
                                    </Button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    <div className="mt-4 text-center text-sm">
                        Remember your password?{' '}
                        <Link href="/auth/login" className="text-blue-500 hover:underline">
                            Sign In
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
