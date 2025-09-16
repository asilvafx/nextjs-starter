// app/admin/page.jsx
"use client"
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { getAllPublic } from '@/lib/query.js';

const Page = () => {

    const { isAuthenticated, user, status } = useAuth();
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

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

    
    return (
        <div className="section">
            <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-4">Users ({users.length})</h2>

                {!isAuthenticated && status !== 'loading' && (
                    <div className="text-red-600 bg-red-50/90 dark:text-red-100 dark:bg-red-50/10 rounded p-4 mb-4">
                        Please sign in to view data.
                    </div>
                )}

                {loading && (
                    <div className="text-blue-600 p-4 bg-black/5 dark:bg-white/5 rounded">
                        <div className="animate-pulse">Loading data...</div>
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
                        No data found. Try creating a new record first.
                    </div>
                )}

                {users.length > 0 && (
                    <div className="grid gap-4">
                        {users.map((user, index) => (
                            <div key={user.id || index}
                                 className="border border-gray-300 dark:border-gray-700 p-4 mb-2 rounded bg-black/5 dark:bg-white/5">
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

export default Page;
