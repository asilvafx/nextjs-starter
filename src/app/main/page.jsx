// app/main/page.jsx (homepage)
"use client"

import Link from "next/link"
import Image from "next/image";
import { useEffect, useState } from "react"; 
import { toast } from 'sonner'; 
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from '@/hooks/useAuth';
import { useCart } from 'react-use-cart';
import { FaCartShopping } from "react-icons/fa6"; 
import { Button } from "@/components/ui/button"
import { ThemeSwitchGroup } from '@/components/ui/theme-mode';
 
const Homepage = () => { 
    const [setupData, setSetupData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { isAuthenticated, user, status, logout } = useAuth();
    const { totalItems } = useCart();

    const handleSignOut = async() => {
    await logout();
    };

    // Function to check setup
    useEffect(() => {
        const setupDbEnv = async () => {
            try {
                const response = await fetch('/main/setup');
                const data = await response.json();
                setSetupData(data);
                setLoading(false);
            } catch (err) {
                console.error("❌ Error loading setup:", err);
                toast.error(`Error loading setup: ${err.message}`);
                setLoading(false);
            }
        };
        setupDbEnv();
    }, []); 

    if (loading) return <div className="section"><span>Loading...</span></div>;

    return (
        <>
            <div className="section">
            <div className="flex flex-col justify-center items-center gap-4">
            <Link href="/" className="flex mb-4" prefetch={false}>
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
                    <Link 
                    href="/auth/login" 
                    prefetch={false}
                    >
                    <Button variant="outline" className="justify-self-end">
                        Sign in
                    </Button>
                    </Link> 
                    <Link 
                        href="/auth/register" 
                        prefetch={false}
                    >
                    <Button className="justify-self-end">Create account</Button>
                    </Link>
                    </>
                ) : (
                    <Button 
                        onClick={handleSignOut}
                        className="justify-self-end" 
                    > Sign Out
                    </Button>
                )} 
                
                <Link
                    href="/shop/cart"
                    className="relative"
                >
                    <Button>
                        <FaCartShopping />
                        Cart
                        <span
                            className="badge bg-white text-black dark:bg-black dark:text-white absolute -top-2 -right-2 border font-bold px-2 text-sm rounded-full flex items-center justify-center">
                            {totalItems}
                        </span>
                    </Button>
                </Link>
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
