// app/dashboard/access/page.jsx
'use client';
import { useEffect, useState } from 'react';
import { ActionButtons, DataTable, StatusBadge } from '../components/common/Common';
import SkeletonRow from '../components/skeletons/SkeletonRow';
import { getAll } from '@/lib/client/query';

const DashboardUsers = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true); // Fixed: changed from isLoading
    const [error, setError] = useState(null);
    const [filterRole, setFilterRole] = useState('all');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await getAll('users', null, true); // Fixed: properly await the function

                if (response && response.success) {
                    // Transform data if needed (similar to your shop component)
                    const transformedUsers = response.data.map(user => ({
                        ...user,
                        // Add any transformations needed
                        joined: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
                        status: user.isActive ? 'active' : 'inactive'
                    }));

                    setUsers(transformedUsers);
                } else {
                    setError('Failed to load users');
                }
            } catch (err) {
                console.error('Error fetching users:', err);
                setError('Failed to load users');
            } finally {
                setLoading(false); // Fixed: proper state setter
            }
        };

        fetchUsers(); // Fixed: actually call the function
    }, []);

    const handleEditUser = (userId) => {
        console.log('Edit user:', userId);
    };

    const handleViewUser = (userId) => {
        console.log('View user:', userId);
    };

    const handleDeleteUser = (userId) => {
        console.log('Delete user:', userId);
    };

    // Filter users based on search term and role
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="fade-in">
            <div className="dashboard-card-header">
                <div>
                    <h1 className="dashboard-card-title">Users Management</h1>
                    <p className="dashboard-card-subtitle">Manage user accounts and permissions</p>
                </div>
                <button className="button primary">Add New User</button>
            </div>

            {/* Search and Filters */}
            <div className="search-filters">
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                    disabled={loading}
                />
                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="filter-select"
                    disabled={loading}
                >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="customer">Customer</option>
                    <option value="moderator">Moderator</option>
                </select>
            </div>

            {/* Users Table */}
            <div className="section">
                {error ? (
                    <div className="text-center py-8">
                        <div className="text-red-600 mb-4">
                            <h3 className="text-lg font-semibold mb-2">Error Loading Users</h3>
                            <p>{error}</p>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="button secondary"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <DataTable headers={['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions']}>
                        {loading ? (
                            Array.from({ length: 3 }).map((_, index) => (
                                <SkeletonRow key={index} />
                            ))
                        ) : filteredUsers.length > 0 ? (
                            // Show actual user data
                            filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td data-label="Account name">{user.name || 'N/A'}</td>
                                    <td data-label="Email">{user.email || 'N/A'}</td>
                                    <td data-label="Role" className="capitalize">{user.role || 'N/A'}</td>
                                    <td data-label="Status">
                                        <StatusBadge status={user.status || 'inactive'} />
                                    </td>
                                    <td data-label="Joined at">{user.joined}</td>
                                    <td>
                                        <ActionButtons
                                            onEdit={() => handleEditUser(user.id)}
                                            onView={() => handleViewUser(user.id)}
                                            onDelete={() => handleDeleteUser(user.id)}
                                        />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            // No users found
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-gray-500">
                                    {searchTerm || filterRole !== 'all'
                                        ? 'No users found matching the current filters.'
                                        : 'No users found.'
                                    }
                                </td>
                            </tr>
                        )}
                    </DataTable>
                )}
            </div>

            {/* Results summary */}
            {!loading && !error && (
                <div className="mt-4 text-sm text-gray-600">
                    Showing {filteredUsers.length} of {users.length} users
                </div>
            )}
        </div>
    );
};

export default DashboardUsers;
