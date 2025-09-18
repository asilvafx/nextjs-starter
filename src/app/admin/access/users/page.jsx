"use client";

import { useEffect, useState } from "react";
import { getAll, create, update, remove } from "@/lib/client/query";
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
import { Plus, Pencil, Trash2 } from "lucide-react";

const ROLES = ["user", "admin", "editor", "moderator"];

const initialFormData = {
  displayName: "",
  email: "",
  role: "user",
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getAll("users");
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        await update(editUser.id, formData, "users");
        toast.success("User updated successfully");
      } else {
        await create(formData, "users");
        toast.success("User created successfully");
      }
      setIsOpen(false);
      setEditUser(null);
      setFormData(initialFormData);
      fetchUsers();
    } catch (error) {
      toast.error(error.message || "Operation failed");
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

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await remove(id, "users");
        toast.success("User deleted successfully");
        fetchUsers();
      } catch (error) {
        toast.error(error.message || "Failed to delete user");
      }
    }
  };

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
                setEditUser(null);
                setFormData(initialFormData);
              }
            }}
          >
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
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
                <select
                  className="w-full p-2 border rounded-md"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full">
                {editUser ? "Update User" : "Create User"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
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
                  <TableCell className="text-right space-x-2">
                    <Button  
                      className="w-1/5"
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(user)}
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="sm:hidden">Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash2 color="red" className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}