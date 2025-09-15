// app/main/page.jsx (homepage)
"use client"

import { useEffect, useState } from "react";
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import ThemeSwitch from './components/ThemeSwitch';
import Link from 'next/link';
import { getAllPublic } from '@/lib/query.js';

const Homepage = () => {
    const { isAuthenticated, user, status, logout } = useAuth();
    const [users, setUsers] = useState([]);
    const [setupData, setSetupData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchUsers() {
            console.log("🚀 Starting fetchUsers...");
            toast("🚀 Starting fetchUsers...");
            try {
                setLoading(true);
                setError(null);

                // Get all users, limit to 10 users
                const result = await getAllPublic('users', {limit: 10});

                console.log("📨 Response received:", result);

                if (result.success) {
                    setUsers(result.data);
                } else {
                    setError(result.error || "Unknown API error");
                }
            } catch (err) {
                console.error("❌ Fetch error:", err);
                setError(err.message || "Network error");
            } finally {
                setLoading(false);
            }
        }

        // Only fetch if authenticated
        if (isAuthenticated) {
            fetchUsers();
        } else if (!isAuthenticated && status !== 'loading') {
            setLoading(false);
        }
    }, [isAuthenticated, status]);

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
                    <div className="flex tems-center justify-between gap-2">
                        <div className="flex flex-col gap-2">
                            <span>
                                Welcome, {user?.displayName || user?.email}!
                            </span>
                            <span>
                                  Role: {user?.role}
                            </span>
                        </div>
                        <div className="my-auto">
                            <button
                                onClick={handleSignOut}
                                className="bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-sm relative"
                            >
                                Sign Out
                            </button>
                        </div>

                    </div>
                ) : (
                    <div className="flex gap-2">
                        <Link
                            href="/auth/login"
                            className="bg-white text-black px-4 py-2 rounded-sm relative"
                        >
                            Sign in
                        </Link>
                        <Link
                            href="/auth/register"
                            className="bg-black/10 text-white border px-4 py-2 rounded-sm relative"
                        >
                            Create new account
                        </Link>
                    </div>
                )}
            </div>

            <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-4">Users ({users.length})</h2>

                {!isAuthenticated && status !== 'loading' && (
                    <div className="text-yellow-600 p-4 bg-yellow-50 rounded mb-4">
                        Please sign in to view users data.
                    </div>
                )}

                {loading && isAuthenticated && (
                    <div className="text-blue-600 p-4 bg-black/5 dark:bg-white/5 rounded">
                        <div className="animate-pulse">Loading users...</div>
                    </div>
                )}

                {error && isAuthenticated && (
                    <div className="text-red-600 bg-red-50 p-4 rounded">
                        <strong>Error:</strong> {error}
                        <details className="mt-2">
                            <summary className="cursor-pointer">Debug Details</summary>
                            <pre className="mt-2 text-xs">{JSON.stringify({
                                timestamp: new Date().toISOString(),
                                isAuthenticated,
                                userRole: user?.role,
                                error: error
                            }, null, 2)}</pre>
                        </details>
                    </div>
                )}

                {!loading && !error && users.length === 0 && isAuthenticated && (
                    <div className="text-gray-500 italic p-4 bg-gray-50 rounded">
                        No users found. Try creating a test user first.
                    </div>
                )}

                {users.length > 0 && (
                    <div className="grid gap-4">
                        {users.map((user, index) => (
                            <div key={user.id || index} className="border border-gray-300 dark:border-gray-700 p-4 mb-2 rounded bg-black/5 dark:bg-white/5">
                                <div className="font-semibold">ID: {user.id}</div>
                                <div>Name: {user.name || user.displayName || 'N/A'}</div>
                                <div>Email: {user.email || 'N/A'}</div>
                                <div>Role: {user.role || 'N/A'}</div>
                                {user.createdAt && (
                                    <div className="text-sm text-gray-600">
                                        Created: {new Date(user.createdAt).toLocaleString()}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Homepage;
