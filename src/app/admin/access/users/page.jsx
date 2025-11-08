// @/app/admin/access/users/page.jsx

'use client';

import AdminHeader from '@/app/admin/components/AdminHeader';
import { ArrowUpDown, Eye, Loader2, MoreHorizontal, Pencil, Plus, Search, Trash2, User2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { v6 as uuidv6 } from 'uuid'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { AdminPagination } from '@/components/ui/pagination.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { create, getAll, remove, update } from '@/lib/client/query';

const initialFormData = {
    displayName: '',
    email: '',
    role: 'user',
    password: '',
    sendEmail: true,
    changePassword: false
};

import { TableSkeleton } from '@/components/ui/skeleton';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [_rolesLoading, setRolesLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const { user: currentUser, status } = useAuth();
    const [editUser, setEditUser] = useState(null);
    const [search, setSearch] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [formData, setFormData] = useState(initialFormData);
    const [allUsers, setAllUsers] = useState([]);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [viewUser, setViewUser] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Use refs to prevent multiple API calls
    const hasFetchedRoles = useRef(false);
    const hasFetchedUsers = useRef(false);

    const fetchRoles = async () => {
        // Prevent multiple simultaneous fetch requests
        if (hasFetchedRoles.current) {
            return;
        }

        try {
            hasFetchedRoles.current = true;
            setRolesLoading(true);
            const response = await getAll('roles');

            // Ensure data is an array and extract role titles
            const rolesArray = Array.isArray(response.data) ? response.data : [];
            const rolesList = rolesArray.map((role) => role.title?.toLowerCase()).filter(Boolean);

            // Set roles with fallback to default roles if none exist
            if (rolesList.length === 0) {
                setRoles(['user', 'admin', 'editor', 'moderator']);
            } else {
                setRoles(rolesList);
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
            // Fallback to default roles on error
            setRoles(['user', 'admin', 'editor', 'moderator']);
            hasFetchedRoles.current = false;
        } finally {
            setRolesLoading(false);
        }
    };

    const fetchUsers = async () => {
        // Prevent multiple simultaneous fetch requests
        if (hasFetchedUsers.current) {
            return;
        }

        try {
            hasFetchedUsers.current = true;
            setLoading(true);
            const response = await getAll('users', {
                page: currentPage,
                limit: 10
            });
            if (response.success) {
                setUsers(response.data);
                setAllUsers((prev) => {
                    const newUsers = [...prev];
                    response.data.forEach((user) => {
                        const index = newUsers.findIndex((u) => u.id === user.id);
                        if (index !== -1) {
                            newUsers[index] = user;
                        } else {
                            newUsers.push(user);
                        }
                    });
                    return newUsers;
                });
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to fetch users');
            hasFetchedUsers.current = false;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status !== 'loading' && currentUser?.id && !hasFetchedRoles.current) {
            fetchRoles();
        }
    }, [currentUser?.id, status]);

    useEffect(() => {
        if (!hasFetchedUsers.current || currentPage !== 1) {
            fetchUsers();
        }
    }, [currentPage]);

    // Sorting function
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Filter and sort users
    const getFilteredAndSortedUsers = useCallback(() => {
        let filteredUsers = [...allUsers];

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            filteredUsers = filteredUsers.filter(
                (user) =>
                    user.displayName?.toLowerCase().includes(searchLower) ||
                    user.email?.toLowerCase().includes(searchLower)
            );
        }

        // Apply sorting
        if (sortConfig.key) {
            filteredUsers.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle dates
                if (sortConfig.key === 'createdAt') {
                    aValue = new Date(aValue).getTime();
                    bValue = new Date(bValue).getTime();
                } else {
                    // Convert to lowercase for string comparison
                    aValue = String(aValue).toLowerCase();
                    bValue = String(bValue).toLowerCase();
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return filteredUsers;
    }, [allUsers, search, sortConfig]);

    // Update filtered users when search or sort changes
    useEffect(() => {
        setUsers(getFilteredAndSortedUsers());
    }, [search, sortConfig, getFilteredAndSortedUsers]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsSubmitting(true);

        // Validate password strength if setting password
        if ((!editUser || formData.changePassword) && formData.password) {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
            if (!passwordRegex.test(formData.password)) {
                toast.error(
                    'Password must be at least 8 characters with lowercase and one uppercase or special character'
                );
                return;
            }
        }

        try {
            const timeNow = new Date().toISOString();
            let userData = {
                displayName: formData.displayName,
                email: formData.email,
                role: formData.role
            };

            if (editUser) {
                if (formData.changePassword) {
                    const salt = await fetch('/api/auth/crypto').then((r) => r.text());
                    const response = await fetch('/api/auth/crypto', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ password: formData.password, salt })
                    });
                    const { encryptedPassword } = await response.json();
                    userData = {
                        ...userData,
                        password: encryptedPassword,
                        salt
                    };
                }

                await update(editUser.id, userData, 'users');

                if (formData.sendEmail && formData.changePassword) {
                    // Send password change notification email
                    await fetch('/api/email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'user_updated',
                            email: formData.email,
                            name: formData.displayName,
                            changes: {
                                password: '********' // Don't send actual password in email
                            }
                        })
                    });
                }

                // Update local state
                setAllUsers((prev) => prev.map((user) => (user.id === editUser.id ? { ...user, ...userData } : user)));
                setUsers((prev) => prev.map((user) => (user.id === editUser.id ? { ...user, ...userData } : user)));

                toast.success('User updated successfully');
            } else {
                // New user creation
                const salt = await fetch('/auth/api/crypto').then((r) => r.text());
                const response = await fetch('/auth/api/crypto', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: formData.password, salt })
                });
                const { encryptedPassword } = await response.json();

                userData = {
                    ...userData,
                    uid: uuidv6(),
                    password: encryptedPassword,
                    salt,
                    createdAt: timeNow
                };

                // Check if web3 is active and create wallet
                try {
                    const web3Response = await fetch('/api/auth/web3/create');
                    const web3Data = await web3Response.json();

                    if (web3Data.success) {
                        const web3Salt = await fetch('/api/auth/crypto').then((r) => r.text());
                        const web3EncryptResponse = await fetch('/api/auth/crypto', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                password: web3Data.privateKey,
                                salt: web3Salt
                            })
                        });
                        const { encryptedPassword: encryptedPrivateKey } = await web3EncryptResponse.json();

                        userData.web3 = {
                            salt: web3Salt,
                            public_key: web3Data.address,
                            private_key: encryptedPrivateKey
                        };
                    }
                } catch (web3Error) {
                    console.error('Web3 setup error:', web3Error);
                }

                const newUser = await create(userData, 'users');

                if (formData.sendEmail) {
                    // Send welcome email with login details
                    await fetch('/api/email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'user_created',
                            email: formData.email,
                            name: formData.displayName,
                            password: formData.password
                        })
                    });
                }

                // Update local state
                setAllUsers((prev) => [...prev, newUser]);
                setUsers((prev) => [...prev, newUser]);
                toast.success('User created successfully');
            }

            setIsOpen(false);
            setEditUser(null);
            setFormData(initialFormData);
        } catch (error) {
            toast.error(error.message || 'Operation failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (user) => {
        setEditUser(user);
        setFormData({
            displayName: user.displayName,
            email: user.email,
            role: user.role
        });
        setIsOpen(true);
    };

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setDeleteConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!userToDelete) return;
        setIsDeleting(true);
        try {
            await remove(userToDelete.id, 'users');
            toast.success('User deleted successfully');
            setAllUsers((prev) => prev.filter((user) => user.id !== userToDelete.id));
            setUsers((prev) => prev.filter((user) => user.id !== userToDelete.id));
            setDeleteConfirmOpen(false);
            setUserToDelete(null);
        } catch (error) {
            toast.error(error.message || 'Failed to delete user');
        } finally {
            setIsDeleting(false);
        }
    };

    const openCreateDialog = () => {
        setEditUser(null);
        setFormData(initialFormData);
        setIsOpen(true);
    };

    const handleView = (user) => {
        setViewUser(user);
        setIsViewOpen(true);
    };

    // If auth is still loading, don't render anything
    if (status === 'loading') {
        return null;
    }

    return (
         
            <div className="space-y-4">
                 <AdminHeader
                    title="Users"
                    description="Manage user accounts and permissions."
                >
                        <Button onClick={openCreateDialog} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Create User
                        </Button>
                </AdminHeader>    

                {/* Search bar */}
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex w-full flex-1 gap-4 sm:w-auto">
                        <div className="relative flex-1">
                            <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex h-full w-full flex-col">
                    {loading ? (
                        <TableSkeleton />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead
                                        className="cursor-pointer hover:bg-accent/50"
                                        onClick={() => handleSort('displayName')}>
                                        <div className="flex items-center justify-center">
                                            Name
                                            <ArrowUpDown className="ml-2 h-3 w-3" />
                                        </div>
                                    </TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-accent/50"
                                        onClick={() => handleSort('role')}>
                                        <div className="flex items-center justify-center">
                                            Role
                                            <ArrowUpDown className="ml-2 h-3 w-3" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-accent/50"
                                        onClick={() => handleSort('createdAt')}>
                                        <div className="flex items-center justify-center">
                                            Created At
                                            <ArrowUpDown className="ml-2 h-3 w-3" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center">
                                            No users found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell data-label="Name" className="capitalize">
                                                {user.displayName} {user.email === currentUser?.email ?? '(You)'}
                                            </TableCell>
                                            <TableCell data-label="Email">{user.email}</TableCell>
                                            <TableCell data-label="Role">
                                                <span className="rounded-full bg-slate-100 px-2 py-1 text-black text-xs capitalize">
                                                    {user.role}
                                                </span>
                                            </TableCell>
                                            <TableCell data-label="Created at">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={user.email === currentUser?.email || isDeleting}>
                                                            {isDeleting && userToDelete?.id === user.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleView(user)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleEdit(user)}
                                                            disabled={user.email === currentUser?.email}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Edit User
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteClick(user)}
                                                            className={
                                                                user.email === currentUser?.email
                                                                    ? 'cursor-not-allowed text-muted-foreground'
                                                                    : 'text-destructive'
                                                            }
                                                            disabled={user.email === currentUser?.email}>
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            {user.email === currentUser?.email
                                                                ? 'Cannot Delete'
                                                                : 'Delete User'}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* Pagination */}
                {!loading && users.length > 0 && (
                    <AdminPagination
                        currentPage={currentPage}
                        totalItems={allUsers.length}
                        itemsPerPage={10}
                        onPageChange={(page) => {
                            setCurrentPage(page);
                            fetchUsers();
                        }}
                        loading={loading}
                        itemLabel="users"
                    />
                )}

                {/* Create / Edit User Dialog */}
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>{editUser ? 'Edit User' : 'Create User'}</DialogTitle>
                                <DialogDescription>
                                    {editUser
                                        ? 'Update the user profile and optionally change their password.'
                                        : 'Create a new user account. A welcome email can be sent to the user.'}
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleSubmit} className="grid gap-4 py-2">
                                <div>
                                    <label className="text-sm text-muted-foreground">Display name</label>
                                    <Input
                                        required
                                        value={formData.displayName}
                                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-muted-foreground">Email</label>
                                    <Input
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-muted-foreground">Role</label>
                                    <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((r) => (
                                                <SelectItem key={r} value={r}>
                                                    {r}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Password controls */}
                                {!editUser && (
                                    <div>
                                        <label className="text-sm text-muted-foreground">Password</label>
                                        <Input
                                            required
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                )}

                                {editUser && (
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={!!formData.changePassword}
                                            onCheckedChange={(v) => setFormData({ ...formData, changePassword: !!v })}
                                        />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium">Change Password</div>
                                            <div className="text-sm text-muted-foreground">Enable to set a new password</div>
                                        </div>
                                    </div>
                                )}

                                {( !editUser || formData.changePassword ) && (
                                    <div>
                                        <label className="text-sm text-muted-foreground">New password</label>
                                        <Input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                )}

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={!!formData.sendEmail}
                                            onCheckedChange={(v) => setFormData({ ...formData, sendEmail: !!v })}
                                        />
                                        <div className="text-sm">Send email</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => {
                                            setIsOpen(false);
                                            setEditUser(null);
                                            setFormData(initialFormData);
                                        }}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? 'Saving...' : editUser ? 'Save changes' : 'Create user'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <ConfirmationDialog
                    open={deleteConfirmOpen}
                    onOpenChange={setDeleteConfirmOpen}
                    onConfirm={handleDelete}
                    title="Delete User"
                    description={`Are you sure you want to delete ${userToDelete?.displayName || 'this user'}? This action cannot be undone.`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    requireConfirmText="delete"
                />

                <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>User Profile</DialogTitle>
                            <DialogDescription>Detailed information about the user.</DialogDescription>
                        </DialogHeader>

                        {viewUser && (
                            <div className="grid gap-4 py-4">
                                <Card>
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="rounded-full bg-accent p-2">
                                                <User2 className="h-8 w-8" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold capitalize">{viewUser.displayName}</h3>
                                                <p className="text-muted-foreground text-sm">{viewUser.email}</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-muted-foreground">Role</p>
                                                <p className="font-medium capitalize">{viewUser.role}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Created</p>
                                                <p className="font-medium">
                                                    {new Date(viewUser.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            {viewUser.web3 && (
                                                <div className="col-span-2">
                                                    <p className="text-muted-foreground">Web3 Address</p>
                                                    <p className="break-all font-medium">{viewUser.web3.public_key}</p>
                                                </div>
                                            )}
                                            <div className="col-span-2">
                                                <p className="text-muted-foreground">Last Updated</p>
                                                <p className="font-medium">
                                                    {viewUser.updatedAt
                                                        ? new Date(viewUser.updatedAt).toLocaleString()
                                                        : 'Never'}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div> 
    );
}
