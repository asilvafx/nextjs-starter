// app/main/page.jsx (homepage)
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FaCartShopping } from 'react-icons/fa6';
import { useCart } from 'react-use-cart';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingPage } from '@/components/ui/loading-spinner';
import { ThemeSwitchGroup } from '@/components/ui/theme-mode';
import { useAuth } from '@/hooks/useAuth';

const Homepage = () => {
    console.log('Homepage component rendered');
    const [setupData, setSetupData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { isAuthenticated, user, logout } = useAuth();
    const { totalItems } = useCart();

    const testVisitorTracking = () => {
        if (window.VisitorTracker) {
            window.VisitorTracker.trackPageView();
        }
    };

    const handleSignOut = async () => {
        await logout();
    };

    // Function to check setup
    useEffect(() => {
        const setupDbEnv = async () => {
            try {
                setLoading(true);
                const response = await fetch('/main/setup');
                const data = await response.json();
                setSetupData(data);
            } catch (err) {
                console.error('❌ Error loading setup:', err);
                toast.error(`Error loading setup: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        setupDbEnv();
    }, []);

    if (loading) {
        return <LoadingPage />;
    }

    return (
        <>
            <div className="section">
                <div className="flex flex-col items-center justify-center gap-4">
                    <Link href="/" className="mb-4 flex" prefetch={false}>
                        <Image
                            alt="Logo"
                            src="/next.svg"
                            width={0}
                            height={30}
                            className="h-6 w-auto dark:invert"
                            priority={true}
                        />
                    </Link>

                    <div className="mb-4">
                        <ThemeSwitchGroup />
                    </div>

                    <div className="flex gap-2">
                        {!isAuthenticated ? (
                            <>
                                <Link href="/auth/login" prefetch={false}>
                                    <Button variant="outline" className="justify-self-end">
                                        Sign in
                                    </Button>
                                </Link>
                                <Link href="/auth/register" prefetch={false}>
                                    <Button className="justify-self-end">Create account</Button>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link href="/admin" prefetch={false}>
                                    <Button className="justify-self-end">Administration</Button>
                                </Link>
                                <Button onClick={handleSignOut} className="justify-self-end">
                                    {' '}
                                    Sign Out
                                </Button>
                            </>
                        )}

                        <Link href="/shop" className="relative">
                            <Button>Shop</Button>
                        </Link>

                        <Link href="/shop/cart" className="relative">
                            <Button>
                                <FaCartShopping />
                                Cart
                                <span className="badge -top-2 -right-2 absolute flex items-center justify-center rounded-full border bg-white px-2 font-bold text-black text-sm dark:bg-black dark:text-white">
                                    {totalItems}
                                </span>
                            </Button>
                        </Link>
                    </div>
                    {/* Temporary test button for visitor tracking */}
                    <div className="mb-4">
                        <Button onClick={testVisitorTracking} variant="outline" size="sm">
                            Test Visitor Tracking
                        </Button>
                    </div>
                </div>
            </div>
            <div className="section">
                <Card>
                    <CardHeader>
                        <CardTitle>Welcome to Next.js Starter!</CardTitle>
                        <CardDescription>Your go-to boilerplate for Next.js projects.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {setupData?.setupComplete ? (
                            <p className="text-green-600">✅ Setup is complete!</p>
                        ) : (
                            <div>
                                <p className="text-red-600">❌ Setup incomplete</p>
                                <p>Progress: {setupData?.setupPercentage}%</p>
                                <p>Missing: {setupData?.status?.missing?.join(', ')}</p>
                                <p>Empty: {setupData?.status?.empty?.join(', ')}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default Homepage;
