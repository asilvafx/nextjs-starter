// app/main/page.jsx (homepage)
"use client"

import { useEffect, useState } from "react";
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import ThemeSwitch from './components/ThemeSwitch';
import { Button } from "@/ui/components/button"
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label" 

const Homepage = () => {
    const { isAuthenticated, user, status, logout } = useAuth();
    const [setupData, setSetupData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Function to check setup
    useEffect(() => {
        const setupDbEnv = async () => {
        try {
        fetch('/api/setup')
            .then(res => res.json())
            .then(data => {
                setSetupData(data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Setup check failed:', error);
                setLoading(false);
            });
        } catch (err) {
            console.error("❌ Error loading setup:", err);
            toast.error(`Error loading setup: ${err.message}`);
        }
        }
        setupDbEnv();
    }, []);

    const handleSignOut = async() => {
        await logout();
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="section">
            <div className="w-full flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Test Page</h1>
                <ThemeSwitch />
            </div>
            <div className="border border-gray-300 dark:border-gray-700 p-4 mb-6 rounded bg-black/5 dark:bg-white/5">
                <h1>Environment Setup Status</h1>
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
            </div>

            {/* User Auth */}
            <div className="border border-gray-300 dark:border-gray-700 p-4 mb-6 rounded bg-black/5 dark:bg-white/5">
                {status === 'loading' ? (
                    <div className="flex">Loading...</div>
                ) : isAuthenticated ? (
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                        <div className="flex flex-col gap-2">
                            <span>
                                Welcome, {user?.displayName || user?.email}!
                            </span>
                            <span>
                                  Role: {user?.role}
                            </span>
                        </div>
                        <div className="my-auto w-full md:w-auto grid grid-cols-2 md:flex gap-2 items-center">
                            <Link href="/account/profile">
                                <Button>
                                    Edit Profile
                                </Button>
                            </Link>
                            <Button
                                variant="outline"
                                onClick={handleSignOut}
                            >
                                Sign Out
                            </Button>
                        </div>

                    </div>
                ) : (
                    <div className="flex gap-2">
                        <Link
                            href="/auth/login"
                        >
                            <Button>
                            Sign in
                            </Button>
                        </Link>
                        <Link
                            href="/auth/register"
                       >
                            <Button variant="outline">
                            Create new account
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Homepage;
