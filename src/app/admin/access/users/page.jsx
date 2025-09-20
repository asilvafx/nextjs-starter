"use client";

import { useEffect, useState, useCallback } from "react";
import { getAll, create, update, remove } from "@/lib/client/query";
import { useAuth } from "@/hooks/useAuth";
import { v6 as uuidv6 } from 'uuid';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, ArrowUpDown, Eye, User2 } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardContent } from "@/components/ui/card"; 

const ROLES = ["user", "admin", "editor", "moderator"];

const initialFormData = {
  displayName: "",
  email: "",
  role: "user",
  password: "", 
  sendEmail: true,
  changePassword: false,
};

import { TableSkeleton } from "@/components/ui/skeleton";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const { user: currentUser, status } = useAuth();
  const [editUser, setEditUser] = useState(null);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [formData, setFormData] = useState(initialFormData);
  const [allUsers, setAllUsers] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); 
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewUser, setViewUser] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getAll("users", { 
        page: currentPage,
        limit: 10 
      });
      if (response.success) {
        setUsers(response.data);
        setAllUsers(prev => {
          const newUsers = [...prev];
          response.data.forEach(user => {
            const index = newUsers.findIndex(u => u.id === user.id);
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
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  // Sorting function
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Filter and sort users
  const getFilteredAndSortedUsers = useCallback(() => {
    let filteredUsers = [...allUsers];
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
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
        if (sortConfig.key === "createdAt") {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        } else {
          // Convert to lowercase for string comparison
          aValue = String(aValue).toLowerCase();
          bValue = String(bValue).toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
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
        toast.error("Password must be at least 8 characters with lowercase and one uppercase or special character");
        return;
      }
    }

    try {
      const timeNow = new Date().toISOString();
      let userData = {
        displayName: formData.displayName,
        email: formData.email,
        role: formData.role,
      };

      if (editUser) {
          if (formData.changePassword) {
          const salt = await fetch('/api/auth/crypto').then(r => r.text());
          const response = await fetch('/api/auth/crypto', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: formData.password, salt })
          });
          const { encryptedPassword } = await response.json();          userData = {
            ...userData,
            password: encryptedPassword,
            salt
          };
        }

        await update(editUser.id, userData, "users");
        
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
        setAllUsers(prev => prev.map(user => 
          user.id === editUser.id ? { ...user, ...userData } : user
        ));
        setUsers(prev => prev.map(user => 
          user.id === editUser.id ? { ...user, ...userData } : user
        ));

        toast.success("User updated successfully");
      } else {
        // New user creation
        const salt = await fetch('/auth/api/crypto').then(r => r.text());
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
            const web3Salt = await fetch('/api/auth/crypto').then(r => r.text());
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

        const newUser = await create(userData, "users");

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
        setAllUsers(prev => [...prev, newUser]);
        setUsers(prev => [...prev, newUser]);
        toast.success("User created successfully");
      }

      setIsOpen(false);
      setEditUser(null);
      setFormData(initialFormData);
    } catch (error) {
      toast.error(error.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setFormData({
      displayName: user.displayName,
      email: user.email,
      role: user.role,
    });
    setIsOpen(true);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    
    try {
      await remove(userToDelete.id, "users");
      toast.success("User deleted successfully");
      setAllUsers(prev => prev.filter(user => user.id !== userToDelete.id));
      setUsers(prev => prev.filter(user => user.id !== userToDelete.id));
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    } catch (error) {
      toast.error(error.message || "Failed to delete user");
    }
  };

  const openCreateDialog = () => {
    setEditUser(null);
    setFormData(initialFormData);
    setIsOpen(true);
  }

  const handleView = (user) => {
    setViewUser(user);
    setIsViewOpen(true);
  };


  // If auth is still loading, don't render anything
  if (status === "loading") {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-muted-foreground">Manage your users and their roles</p>
        </div>
        <Dialog 
            open={isOpen} 
            onOpenChange={(open) => {
              setIsOpen(open);
              if (!open) {
                setEditUser(false);
                setFormData(initialFormData);
              }
            }}
          > 
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editUser ? "Edit User" : "Add New User"}</DialogTitle>
              <DialogDescription>
                {editUser 
                  ? "Update the user's information using the form below."
                  : "Fill in the user's details to create a new account."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  placeholder="Name"
                  value={formData.displayName || ""}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Select 
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!editUser || formData.changePassword ? (
                <>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Password"
                        value={formData.password || ""}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!editUser || formData.changePassword}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const password = Math.random().toString(36).slice(-3) + 
                            Math.random().toString(36).slice(-3).toUpperCase() + 
                            Math.random().toString(36).slice(-2) + 
                            "!@#$%^&*"[Math.floor(Math.random() * 8)];
                          setFormData(prev => ({
                            ...prev,
                            password
                          }));
                        }}
                      >
                        Generate
                      </Button>
                    </div> 
                  </div>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setFormData(prev => ({ ...prev, changePassword: true }))}
                >
                  Change Password
                </Button>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendEmail"
                  checked={formData.sendEmail}
                  onCheckedChange={(checked) => setFormData({ ...formData, sendEmail: checked })}
                />
                <label
                  htmlFor="sendEmail"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground"
                >
                  {editUser 
                    ? "Send email notification about account changes" 
                    : "Send welcome email with login credentials"}
                </label>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {editUser ? "Updating..." : "Creating..."}
                  </div>
                ) : (
                  editUser ? "Update User" : "Create User"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-1 w-full sm:w-auto gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div> 
        </div>
        <Button 
          onClick={openCreateDialog} 
          disabled={status === "loading" || loading}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create User
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        {loading ? (
          <TableSkeleton />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => handleSort("displayName")}
                >
                  <div className="flex items-center justify-center">
                    Name
                    <ArrowUpDown className="ml-2 h-3 w-3" /> 
                  </div>
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => handleSort("role")}
                >
                  <div className="flex items-center justify-center">
                    Role 
                    <ArrowUpDown className="ml-2 h-3 w-3" /> 
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => handleSort("createdAt")}
                >
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
                  <TableCell data-label="Name" className="capitalize">{user.displayName}</TableCell>
                  <TableCell data-label="Email">{user.email}</TableCell>
                  <TableCell data-label="Role">
                    <span className="px-2 py-1 rounded-full text-xs bg-slate-100 text-black capitalize">
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell data-label="Created at">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2 flex gap-1"> 
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleView(user)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button  
                        disabled={user.email === currentUser?.email}
                        className="w-1/5 sm:w-auto px-2"
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(user)}
                      >
                        <Pencil className="w-4 h-4" />
                        <span className="sm:hidden">Edit</span>
                      </Button>
                      <Button
                        disabled={user.email === currentUser?.email}
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteClick(user)}
                      >
                        <Trash2 color="red" className="w-4 h-4" />
                      </Button> 
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        )}
      </ScrollArea>

      {/* Pagination */}
      {!loading && users.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="flex-1 text-sm text-muted-foreground">
            {allUsers.length} users total
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {currentPage} of {Math.ceil(allUsers.length / 10)}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentPage(prev => Math.max(prev - 1, 1));
                  fetchUsers();
                }}
                disabled={currentPage === 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentPage(prev => prev + 1);
                  fetchUsers();
                }}
                disabled={currentPage >= Math.ceil(allUsers.length / 10) || loading}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDelete}
        title="Delete User"
        description={`Are you sure you want to delete ${userToDelete?.displayName || 'this user'}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>
              Detailed information about the user.
            </DialogDescription>
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
                      <p className="text-sm text-muted-foreground">{viewUser.email}</p>
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
                        <p className="font-medium break-all">{viewUser.web3.public_key}</p>
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