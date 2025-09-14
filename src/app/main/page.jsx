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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchUsers() {
            console.log("🚀 Starting fetchUsers...");
            toast("🚀 Starting fetchUsers...");
            try {
                setLoading(true);
                setError(null);

                // Get all users
                const result = await getAllPublic('users');

                console.log("📨 Response received:", result);

                if (result.success) {
                    console.log("✅ Success! Users count:", result.data?.length || 0);
                    // Limit to 10 users
                    setUsers(result.data.slice(0, 10));
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

    // Function to create a test user using the create function
    const createTestUser = async () => {
        if (!isAuthenticated) {
            toast.error("Please sign in to create users");
            return;
        }

        toast("🚀 Creating test user...");
        try {
            const testUser = {
                displayName: `Test User ${Date.now()}`,
                email: `test${Date.now()}@example.com`,
                role: 'user',
                createdAt: new Date().toISOString()
            };

            console.log("📤 Creating user with data:", testUser);

            // Use the direct fetch to test endpoint for now
            const res = await fetch("/api/test/users", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testUser),
            });

            const data = await res.json();
            console.log("Create user response:", data);

            if (data.success) {
                console.log("✅ User created successfully!");
                toast.success("User created successfully!");
                // Refetch users to update the list
                window.location.reload();
            } else {
                console.error("❌ Failed to create user:", data.error);
                toast.error(`Failed to create user: ${data.error}`);
            }
        } catch (err) {
            console.error("❌ Error creating test user:", err);
            toast.error(`Error creating user: ${err.message}`);
        }
    };

    // Test database connection
    const testConnection = async () => {
        toast("🧪 Testing database connection...");
        try {
            const res = await fetch("/api/test/connection");
            const data = await res.json();
            console.log("Connection test result:", data);
            toast.success("Connection test completed - check console for details");
        } catch (err) {
            console.error("Connection test failed:", err);
            toast.error(`Connection test failed: ${err.message}`);
        }
    };

    const handleSignOut = async() => {
        await logout();
    };

    return (
        <div className="section">
            <div className="w-full flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Test Page</h1>
                <ThemeSwitch />
            </div>

            {/* User Auth */}
            <div className="border border-gray-700 p-4 mb-6 rounded bg-white/5">
                <h3 className="font-bold mb-2">Auth Info:</h3>

                {status === 'loading' ? (
                    <div className="flex">Loading...</div>
                ) : isAuthenticated ? (
                    <div className="flex gap-2">
                        <p>
                            Welcome, {user?.displayName || user?.email}! Role: {user?.role}
                        </p>
                        <button
                            onClick={handleSignOut}
                            className="button px-4 py-2 rounded-sm relative ml-2"
                        >
                            Sign Out
                        </button>
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

            <div className="mb-6 flex gap-4">
                <button
                    onClick={createTestUser}
                    className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-600"
                    disabled={loading || !isAuthenticated}
                >
                    {loading ? 'Loading...' : 'Create Test User'}
                </button>

                <button
                    onClick={testConnection}
                    className="bg-purple-700 text-white px-4 py-2 rounded hover:bg-purple-600"
                >
                    Test DB Connection
                </button>

                <button
                    onClick={() => window.location.reload()}
                    className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                    Reload Page
                </button>
            </div>

            <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-4">Users ({users.length})</h2>

                {!isAuthenticated && status !== 'loading' && (
                    <div className="text-yellow-600 p-4 bg-yellow-50 rounded mb-4">
                        Please sign in to view users data.
                    </div>
                )}

                {loading && isAuthenticated && (
                    <div className="text-blue-600 p-4 bg-white/5 rounded">
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
                            <div key={user.id || index} className="border border-gray-700 p-4 mb-2 rounded bg-white/5">
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
