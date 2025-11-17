// @/app/admin/access/users/page.jsx

'use client';

import {
    ArrowUpDown,
    Eye,
    EyeOff,
    KeyRound,
    Loader2,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Trash2,
    User2
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { v6 as uuidv6 } from 'uuid';
import AdminHeader from '@/app/admin/components/AdminHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { CountryDropdown } from '@/components/ui/country-dropdown';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { getAllUsers, getAllRoles, createUser, updateUser, deleteUser } from '@/lib/server/admin';

const initialFormData = {
    displayName: '',
    email: '',
    phone: '',
    country: '',
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
    const [showPassword, setShowPassword] = useState(false);

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
            const response = await getAllRoles();

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
            const response = await getAllUsers(); // Remove pagination to get all users 
            if (response.success) {
                setUsers(response.data);
                setAllUsers(response.data); // Directly set all users since we're fetching all data
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to fetch users');
            hasFetchedUsers.current = false;
        } finally {
            setLoading(false);
        }
    };

    // Function to refresh users data from database
    const refreshUsers = async () => {
        try {
            const response = await getAllUsers();
            if (response.success) {
                setAllUsers(response.data);
                setUsers(response.data);
            }
        } catch (error) {
            console.error('Error refreshing users:', error);
        }
    };

    useEffect(() => {
        if (status !== 'loading' && currentUser?.id && !hasFetchedRoles.current) {
            fetchRoles();
        }
    }, [currentUser?.id, status]);

    useEffect(() => {
        if (!hasFetchedUsers.current) {
            fetchUsers();
        }
    }, []); // Remove currentPage dependency since we're fetching all users

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

    // Generate random 8-char password with numbers, upper/lower case, may have special char
    const generatePassword = () => {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const special = '!@#$%^&*';

        // Ensure at least: 2 lowercase, 2 uppercase, 2 numbers, and may have 0-2 special chars
        let password = '';

        // Add guaranteed characters (6 chars)
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];

        // Add 2 more random chars from all sets (may include special)
        const allChars = lowercase + uppercase + numbers + special;
        password += allChars[Math.floor(Math.random() * allChars.length)];
        password += allChars[Math.floor(Math.random() * allChars.length)];

        // Shuffle the password
        password = password
            .split('')
            .sort(() => Math.random() - 0.5)
            .join('');

        setFormData({ ...formData, password });
        toast.success('Password generated');
    };

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
                phone: formData.phone || '',
                country: formData.country || '',
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

                const userIdentifier = editUser.id || editUser.email;
                const result = await updateUser(userIdentifier, userData);
                
                if (!result.success) {
                    throw new Error(result.error || 'Failed to update user');
                }

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

                // Update local state - use email as fallback identifier
                const updatedUserData = { ...editUser, ...userData };
                setAllUsers((prev) => prev.map((user) => 
                    (user.id && user.id === (editUser.id || editUser.email)) || 
                    (user.email === editUser.email) 
                        ? updatedUserData 
                        : user
                ));
                setUsers((prev) => prev.map((user) => 
                    (user.id && user.id === (editUser.id || editUser.email)) || 
                    (user.email === editUser.email) 
                        ? updatedUserData 
                        : user
                ));

                toast.success('User updated successfully');
                // Also refresh data from database to ensure consistency
                await refreshUsers();
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

                const result = await createUser(userData);
                
                if (!result.success) {
                    throw new Error(result.error || 'Failed to create user');
                }
                
                const newUser = result.data;

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
                // Also refresh data from database to ensure consistency
                await refreshUsers();
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
            phone: user.phone || '',
            country: user.country || '',
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
            const userIdentifier = userToDelete.id || userToDelete.email;
            const result = await deleteUser(userIdentifier);
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to delete user');
            }
            
            toast.success('User deleted successfully');
            // Update state - use email as fallback identifier
            setAllUsers((prev) => prev.filter((user) => 
                !((user.id && user.id === userIdentifier) || user.email === userToDelete.email)
            ));
            setUsers((prev) => prev.filter((user) => 
                !((user.id && user.id === userIdentifier) || user.email === userToDelete.email)
            ));
            setDeleteConfirmOpen(false);
            setUserToDelete(null);
            // Also refresh data from database to ensure consistency
            await refreshUsers();
        } catch (error) {
            toast.error(error.message || 'Failed to delete user');
        } finally {
            setIsDeleting(false);
        }
    };

    const openCreateDialog = () => {
        setEditUser(null);
        setFormData(initialFormData);
        setShowPassword(false);
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
            <AdminHeader title="Users" description="Manage user accounts and permissions.">
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
                                users.map((user, index) => (
                                    <TableRow key={user.id || `user-${index}`}>
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
                            <label className="text-muted-foreground text-sm">Display name</label>
                            <Input
                                required
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="text-muted-foreground text-sm">Email</label>
                            <Input
                                required
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="text-muted-foreground text-sm">
                                Phone <span className="text-muted-foreground/60">(optional)</span>
                            </label>
                            <PhoneInput
                                value={formData.phone}
                                onChange={(value) => setFormData({ ...formData, phone: value || '' })}
                                defaultCountry="US"
                                international
                            />
                        </div>

                        <div>
                            <label className="text-muted-foreground text-sm">
                                Country <span className="text-muted-foreground/60">(optional)</span>
                            </label>
                            <CountryDropdown
                                defaultValue={formData.country}
                                onChange={(country) => setFormData({ ...formData, country: country.alpha2 })}
                                placeholder="Select country"
                            />
                        </div>

                        <div>
                            <label className="text-muted-foreground text-sm">Role</label>
                            <Select
                                value={formData.role}
                                onValueChange={(val) => setFormData({ ...formData, role: val })}>
                                <SelectTrigger className="w-full">
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
                                <label className="text-muted-foreground text-sm">Password</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            required
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="pr-10"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute top-0 right-0 h-full"
                                            title={showPassword ? 'Hide password' : 'Show password'}>
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={generatePassword}
                                        title="Generate password">
                                        <KeyRound className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {editUser && (
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    checked={!!formData.changePassword}
                                    onCheckedChange={(v) => {
                                        setFormData({ ...formData, changePassword: !!v });
                                        setShowPassword(false);
                                    }}
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-sm">Change Password</div>
                                    <div className="text-muted-foreground text-sm">Enable to set a new password</div>
                                </div>
                            </div>
                        )}

                        {editUser && formData.changePassword && (
                            <div>
                                <label className="text-muted-foreground text-sm">New password</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="pr-10"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute top-0 right-0 h-full"
                                            title={showPassword ? 'Hide password' : 'Show password'}>
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={generatePassword}
                                        title="Generate password">
                                        <KeyRound className="h-4 w-4" />
                                    </Button>
                                </div>
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
