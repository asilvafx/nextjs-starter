// app/main/page.jsx (homepage)
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FaCartShopping } from 'react-icons/fa6';
import { useCart } from 'react-use-cart';
import { toast } from 'sonner';
import LanguageSwitch from '@/components/language-switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingPage } from '@/components/ui/loading-spinner';
import { ThemeSwitchGroup } from '@/components/ui/theme-mode';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Fingerprint from '@/utils/fingerprint';

const Homepage = () => {
    console.log('Homepage component rendered');
    const [setupData, setSetupData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [setupPhase, setSetupPhase] = useState('checking'); // checking, database-init, first-user, complete
    const [needsFirstUser, setNeedsFirstUser] = useState(false);
    const [setupComplete, setSetupComplete] = useState(false);
    const [showSetupDirWarning, setShowSetupDirWarning] = useState(false);
    
    // First user form state
    const [userFormData, setUserFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        country: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isCreatingUser, setIsCreatingUser] = useState(false);

    const { isAuthenticated, logout } = useAuth();
    const { totalItems } = useCart();
 
    const handleSignOut = async () => {
        await logout();
    };

    // Check if setup directory exists
    const checkSetupDirectory = async () => {
        try {
            const response = await fetch('/main/setup');
            return response.ok;
        } catch (error) {
            return false;
        }
    };

    // Handle first user creation
    const handleCreateFirstUser = async (e) => {
        e.preventDefault();
        
        if (userFormData.password !== userFormData.confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }

        if (userFormData.password.length < 8) {
            toast.error("Password must be at least 8 characters long");
            return;
        }

        setIsCreatingUser(true);

        try {
            // Generate browser fingerprint
            const browserUnique = await Fingerprint();
            // Hash password (simple base64 encoding as in register form)
            const passwordHash = btoa(userFormData.password);

            const response = await fetch('/main/setup/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...userFormData,
                    password: passwordHash,
                    client: browserUnique
                })
            });

            const result = await response.json();

            if (result.success) {
                toast.success('First admin user created successfully!');
                setNeedsFirstUser(false);
                setSetupComplete(true);
                
                // Check if setup directory still exists
                const setupDirExists = await checkSetupDirectory();
                setShowSetupDirWarning(setupDirExists);
            } else {
                toast.error(result.error || 'Failed to create user');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            toast.error('Failed to create user');
        } finally {
            setIsCreatingUser(false);
        }
    };

    // Function to check setup and load languages
    useEffect(() => {
        const setupDbEnv = async () => {
            try {
                setLoading(true);
                setSetupPhase('checking');

                // Fetch setup data
                const response = await fetch('/main/setup');
                const data = await response.json();
                setSetupData(data);

                if (data.setupComplete) {
                    setSetupPhase('database-init');
                    
                    // Wait a moment to show the database initialization phase
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    // Check if we need to create first user
                    const usersResponse = await fetch('/main/setup/users');
                    const usersData = await usersResponse.json();
                    
                    if (usersData.success && usersData.needsFirstUser) {
                        setSetupPhase('first-user');
                        setNeedsFirstUser(true);
                        setLoading(false);
                    } else {
                        // Setup is complete, check if setup dir exists
                        setSetupPhase('complete');
                        setSetupComplete(true);
                        const setupDirExists = await checkSetupDirectory();
                        setShowSetupDirWarning(setupDirExists);
                        setLoading(false);
                    }
                } else {
                    // Setup is not complete
                    setLoading(false);
                }
            } catch (err) {
                console.error('❌ Error loading setup:', err);
                toast.error(`Error loading setup: ${err.message}`);
                setLoading(false);
            }
        };
        setupDbEnv();
    }, []);

    // Use the centralized LanguageSwitch component which will fetch languages
    // when no `initialLanguages` prop is provided.

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            {setupPhase === 'checking' && 'Checking Setup...'}
                            {setupPhase === 'database-init' && 'Initializing Database...'}
                            {setupPhase === 'first-user' && 'Setup Almost Complete'}
                        </CardTitle>
                        <CardDescription>
                            {setupPhase === 'checking' && 'Verifying environment configuration and database connection...'}
                            {setupPhase === 'database-init' && 'Creating default tables and initial data...'}
                            {setupPhase === 'first-user' && 'Please create your admin account'}
                        </CardDescription>
                    </CardHeader>
                    {setupPhase === 'database-init' && (
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                    <span>Creating site_settings table</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                    <span>Creating store_settings table</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                    <span>Creating roles table</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Loader2 className="h-2 w-2 animate-spin text-primary" />
                                    <span>Setting up database tables...</span>
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>
            </div>
        );
    }

    // Show first user creation form
    if (needsFirstUser && setupPhase === 'first-user') {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Create First Admin User</CardTitle>
                        <CardDescription>
                            Welcome! Create your admin account to complete the setup process.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateFirstUser} className="space-y-4">
                            <div className="grid gap-3">
                                <Label htmlFor="displayName">Full Name</Label>
                                <Input
                                    id="displayName"
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={userFormData.displayName}
                                    onChange={(e) => setUserFormData(prev => ({ ...prev, displayName: e.target.value }))}
                                    required
                                    disabled={isCreatingUser}
                                />
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={userFormData.email}
                                    onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                                    required
                                    disabled={isCreatingUser}
                                />
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        value={userFormData.password}
                                        onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                                        required
                                        disabled={isCreatingUser}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        disabled={isCreatingUser}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm your password"
                                    value={userFormData.confirmPassword}
                                    onChange={(e) => setUserFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    required
                                    disabled={isCreatingUser}
                                />
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="phone">Phone (Optional)</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="Enter your phone number"
                                    value={userFormData.phone}
                                    onChange={(e) => setUserFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    disabled={isCreatingUser}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={isCreatingUser}>
                                {isCreatingUser ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating Admin Account...
                                    </>
                                ) : (
                                    'Create Admin Account'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show setup completion messages
    if (setupComplete) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="w-full max-w-2xl space-y-6">
                    {showSetupDirWarning ? (
                        <Card className="border-orange-200 bg-orange-50">
                            <CardHeader>
                                <CardTitle className="text-orange-800">⚠️ Security Notice</CardTitle>
                                <CardDescription className="text-orange-700">
                                    For security purposes, please delete the setup directory.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-orange-700">
                                <p className="mb-4">
                                    Please delete the <code className="rounded bg-orange-100 px-2 py-1 font-mono text-sm">/src/app/main/setup</code> directory 
                                    from your project to complete the setup process.
                                </p>
                                <p className="text-sm">
                                    You can do this by running: <code className="rounded bg-orange-100 px-2 py-1 font-mono text-sm">rm -rf src/app/main/setup</code>
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-green-200 bg-green-50">
                            <CardHeader>
                                <CardTitle className="text-green-800">🎉 Setup Complete!</CardTitle>
                                <CardDescription className="text-green-700">
                                    Your CMS platform is ready to use.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-green-700">
                                <p className="mb-4">
                                    Congratulations! Your Next.js CMS platform has been successfully set up.
                                </p>
                                <p className="mb-4">
                                    You can now customize the homepage by editing the{' '}
                                    <code className="rounded bg-green-100 px-2 py-1 font-mono text-sm">/src/app/main/page.jsx</code> file.
                                </p>
                                <div className="flex gap-3">
                                    <Link href="/auth/login">
                                        <Button>Sign In</Button>
                                    </Link>
                                    <Link href="/admin">
                                        <Button variant="outline">Go to Admin</Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        );
    }

    // Normal homepage when setup is incomplete
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

                    <div className="mb-4 flex items-center gap-4">
                        <ThemeSwitchGroup />
                        <LanguageSwitch slim={false} />
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        {!isAuthenticated ? (
                            <>
                                <Link href="/auth/login" prefetch={false}>
                                    <Button variant="outline" className="w-full sm:w-auto sm:justify-self-end">
                                        Sign in
                                    </Button>
                                </Link>
                                <Link href="/auth/register" prefetch={false}>
                                    <Button className="w-full sm:w-auto sm:justify-self-end">Create account</Button>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link href="/account" prefetch={false}>
                                    <Button className="w-full sm:w-auto sm:justify-self-end">My Account</Button>
                                </Link>
                                <Link href="/admin" prefetch={false}>
                                    <Button className="w-full sm:w-auto sm:justify-self-end">Administration</Button>
                                </Link>
                                <Button onClick={handleSignOut} className="w-full sm:w-auto sm:justify-self-end">
                                    Sign Out
                                </Button>
                            </>
                        )}

                        <Link href="/blocks-demo" className="relative">
                            <Button className="w-full sm:w-auto">Blocks</Button>
                        </Link>

                        <Link href="/book-service" className="relative">
                            <Button className="w-full sm:w-auto">Online Booking</Button>
                        </Link>

                        <Link href="/shop" className="relative">
                            <Button className="w-full sm:w-auto">Shop</Button>
                        </Link>

                        <Link href="/shop/cart" className="relative">
                            <Button className="w-full sm:w-auto">
                                <FaCartShopping />
                                Cart
                                <span className="badge -top-2 -right-2 absolute flex items-center justify-center rounded-full border bg-white px-2 font-bold text-black text-sm dark:bg-black dark:text-white">
                                    {totalItems}
                                </span>
                            </Button>
                        </Link>
                    </div> 
                </div>
            </div>
            <div className="section mb-4">
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
                                {setupData?.status?.missing?.length > 0 && (
                                    <p>Missing: {setupData.status.missing.join(', ')}</p>
                                )}
                                {setupData?.status?.empty?.length > 0 && (
                                    <p>Empty: {setupData.status.empty.join(', ')}</p>
                                )}
                                {setupData?.databaseInitialization && (
                                    <div className="mt-3">
                                        <p className="font-medium">Database Status:</p>
                                        <p className="text-sm text-gray-600">{setupData.databaseInitialization.message}</p>
                                        {setupData.databaseInitialization.tablesCreated?.length > 0 && (
                                            <p className="text-sm text-green-600">
                                                Tables created: {setupData.databaseInitialization.tablesCreated.join(', ')}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default Homepage;
