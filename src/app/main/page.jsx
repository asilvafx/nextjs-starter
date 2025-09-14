"use client"

import { useEffect, useState } from "react";
import { useAuth } from '@/hooks/useAuth';
import ThemeSwitch from './components/ThemeSwitch';
import Link from 'next/link';

const Homepage = () => {
    const { isAuthenticated, user, status, logout } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchUsers() {
            console.log("🚀 Starting fetchUsers...");
            try {
                setLoading(true);
                setError(null);

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

                const res = await fetch("/api/test/users", {
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                console.log("📨 Response received");
                console.log("Response status:", res);

                const data = await res.json();
                console.log("Response data:", data);

                if (data.success) {
                    console.log("✅ Success! Users count:", data.data?.length || 0);
                    // Limit to 10 users
                    setUsers(data.data.slice(0, 10));
                } else {
                    setError(data.error || "Unknown API error");
                }
            } catch (err) {
                console.error("❌ Fetch error:", err);

                if (err.name === 'AbortError') {
                    setError("Request timed out after 20 seconds");
                } else {
                    setError(err.message || "Network error");
                }
            } finally {
                setLoading(false);
            }
        }

        fetchUsers();
    }, []);

    // Function to create a test user
    const createTestUser = async () => {
        console.log("🚀 Creating test user...");
        try {
            const testUser = {
                name: `Test User ${Date.now()}`,
                email: `test${Date.now()}@example.com`,
                role: 'user',
                createdAt: new Date().toISOString()
            };

            console.log("📤 Sending POST request with data:", testUser);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000);

            const res = await fetch("/api/test/users", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testUser),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            console.log("📨 Create user response status:", res.status);
            const data = await res.json();
            console.log("Create user response:", data);

            if (data.success) {
                console.log("✅ User created successfully!");
                // Refetch users to update the list
                window.location.reload();
            } else {
                console.error("❌ Failed to create user:", data.error);
                alert(`Failed to create user: ${data.error}`);
            }
        } catch (err) {
            console.error("❌ Error creating test user:", err);
            if (err.name === 'AbortError') {
                alert("Request timed out after 20 seconds");
            } else {
                alert(`Error creating user: ${err.message}`);
            }
        }
    };

    // Test database connection
    const testConnection = async () => {
        console.log("🧪 Testing database connection...");
        try {
            const res = await fetch("/api/test/connection");
            const data = await res.json();
            console.log("Connection test result:", data);
            alert(JSON.stringify(data, null, 2));
        } catch (err) {
            console.error("Connection test failed:", err);
            alert(`Connection test failed: ${err.message}`);
        }
    };

    const handleSignOut = async() => {
        await logout({ callbackUrl: '/auth/login' });
    };

    return (
        <div className="section">

            <div className="w-full flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold mb-6">Test Page</h1>
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
                            Welcome, {user?.displayName || user?.email}!
                        </p>
                        <button
                            onClick={handleSignOut}
                            className="button px-4 py-2 rounded-sm relative ml-2"
                        >
                            Sign Out
                        </button>
                    </div>

                ) : (
                    <Link
                        href="/auth/login"
                        className="bg-white text-black px-4 py-2 rounded-sm relative"
                    >
                        Login
                    </Link>
                )}
            </div>

            {/* Environment Info */}
            <div className="border border-gray-700 p-4 mb-6 rounded bg-white/5">
                <h3 className="font-bold mb-2">Debug Info:</h3>
                <p>Postgres URL configured: {process.env.POSTGRES_URL ? 'Yes' : 'No'}</p>
                <p>Current time: {new Date().toISOString()}</p>
            </div>

            <div className="mb-6 flex gap-4">
                <button
                    onClick={createTestUser}
                    className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-600"
                    disabled={loading}
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

                {loading && (
                    <div className="text-blue-600 p-4 bg-white/5 rounded">
                        <div className="animate-pulse">Loading users... This might take up to 30 seconds.</div>
                    </div>
                )}

                {error && (
                    <div className="text-red-600 bg-red-50 p-4 rounded">
                        <strong>Error:</strong> {error}
                        <details className="mt-2">
                            <summary className="cursor-pointer">Debug Details</summary>
                            <pre className="mt-2 text-xs">{JSON.stringify({
                                timestamp: new Date().toISOString(),
                                userAgent: navigator.userAgent,
                                url: window.location.href
                            }, null, 2)}</pre>
                        </details>
                    </div>
                )}

                {!loading && !error && users.length === 0 && (
                    <div className="text-gray-500 italic p-4 bg-gray-50 rounded">
                        No users found. Try creating a test user first.
                    </div>
                )}

                {users.length > 0 && (
                    <div className="grid gap-4">
                        {users.map((user) => (
                            <div key={user.id} className="border border-gray-700 p-4 mb-2 rounded bg-white/5">
                                <div className="font-semibold">ID: {user.id}</div>
                                <div>Name: {user.name || 'N/A'}</div>
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
