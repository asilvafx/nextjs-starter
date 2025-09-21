// @/app/admin/access/roles/page.jsx

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {create, getAll, update, remove} from "@/lib/client/query";
import { 
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash,
  Eye,
  Shield,
  Route,
  FileText,
  Users,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Default roles to be created if roles collection is empty
const defaultRoles = [
  {
    title: "Admin",
    description: "Full system access with all permissions",
    routes: ["/admin", "/admin/*", "/dashboard", "/dashboard/*", "/account", "/account/*"]
  },
  {
    title: "Editor",
    description: "Content management and editing permissions",
    routes: ["/admin/dashboard", "/admin/store", "/admin/store/*", "/account", "/account/*"]
  },
  {
    title: "Moderator", 
    description: "User and content moderation permissions",
    routes: ["/admin/access", "/admin/access/users", "/admin/dashboard", "/account", "/account/*"]
  },
  {
    title: "User",
    description: "Basic user access with limited permissions",
    routes: ["/account", "/account/*", "/dashboard"]
  }
];

const initialFormData = {
  title: "",
  description: "",
  routes: []
};

const commonRoutes = [
  { path: "/admin", label: "Admin Dashboard" },
  { path: "/admin/dashboard", label: "Dashboard Analytics" },
  { path: "/admin/store", label: "Store Management" },
  { path: "/admin/store/products", label: "Products" },
  { path: "/admin/store/orders", label: "Orders" },
  { path: "/admin/store/customers", label: "Customers" },
  { path: "/admin/access", label: "Access Control" },
  { path: "/admin/access/users", label: "Users Management" },
  { path: "/admin/access/roles", label: "Roles Management" },
  { path: "/admin/system", label: "System Settings" },
  { path: "/account", label: "Account Settings" },
  { path: "/dashboard", label: "User Dashboard" }
];

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const { user: currentUser, status } = useAuth();
  const [editRole, setEditRole] = useState(null);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [formData, setFormData] = useState(initialFormData);
  const [allRoles, setAllRoles] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewRole, setViewRole] = useState(null);
  const [newRoute, setNewRoute] = useState("");
  const [showRouteSelector, setShowRouteSelector] = useState(false);

  // Use refs to prevent multiple API calls
  const hasFetchedRoles = useRef(false);
  const isCreatingDefaultRoles = useRef(false);

  const fetchRoles = async () => {
    // Prevent multiple simultaneous fetch requests
    if (hasFetchedRoles.current) {
      return;
    }

    try {
      hasFetchedRoles.current = true;
      setLoading(true);
      const res = await getAll('roles');
      
      // Ensure data is an array
      const rolesArray = Array.isArray(res.data) ? res.data : [];
 
      // If no roles exist, create default roles
      if (rolesArray.length === 0) { 
        await createDefaultRoles();
      } else {
        setRoles(rolesArray);
        setAllRoles(rolesArray);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to fetch roles');
      // Reset the ref on error so user can retry
      hasFetchedRoles.current = false;
    } finally {
      setLoading(false);
    }
  };

  const createDefaultRoles = async () => {
    // Prevent multiple simultaneous role creation
    if (isCreatingDefaultRoles.current) {
      return;
    }

    try {
      isCreatingDefaultRoles.current = true;
      const createdRoles = [];
      for (const roleData of defaultRoles) {
        const role = await create({
          ...roleData,
          created_at: new Date().toISOString(),
          created_by: currentUser?.id || 'system'
        }, 'roles');
        createdRoles.push(role);
      }
      
      setRoles(createdRoles);
      setAllRoles(createdRoles); 
    } catch (error) {
      console.error('Error creating default roles:', error);
      toast.error('Failed to create default roles');
      // Reset the ref on error so user can retry
      isCreatingDefaultRoles.current = false;
    } finally {
      isCreatingDefaultRoles.current = false;
    }
  };

  useEffect(() => {
    if (status !== "loading" && currentUser?.id && !hasFetchedRoles.current) {
      fetchRoles();
    }
  }, [currentUser?.id, status]);

  // Sorting function
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Filter and sort roles
  const getFilteredAndSortedRoles = useCallback(() => {
    // Ensure allRoles is always an array
    const rolesArray = Array.isArray(allRoles) ? allRoles : [];
    let filteredRoles = rolesArray;

    // Apply search filter
    if (search.trim() !== "") {
      const searchLower = search.toLowerCase();
      filteredRoles = rolesArray.filter(role =>
        role.title?.toLowerCase().includes(searchLower) ||
        role.description?.toLowerCase().includes(searchLower) ||
        role.routes?.some(route => route.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filteredRoles.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle special cases
        if (sortConfig.key === 'routes') {
          aValue = aValue?.length || 0;
          bValue = bValue?.length || 0;
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

    return filteredRoles;
  }, [allRoles, search, sortConfig]);

  // Update filtered roles when search or sort changes
  useEffect(() => {
    setRoles(getFilteredAndSortedRoles());
  }, [search, sortConfig, getFilteredAndSortedRoles]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("Role title is required");
      return;
    }

    if (formData.routes.length === 0) {
      toast.error("At least one route is required");
      return;
    }

    setIsSubmitting(true);

    try {
      let result;
      
      if (editRole) {
        // Update existing role
        result = await update(editRole.id, {
          title: formData.title.trim(),
          description: formData.description.trim(),
          routes: formData.routes,
          updated_at: new Date().toISOString(),
          updated_by: currentUser?.id
        }, 'roles');

        // Update the role in both states
        const rolesArray = Array.isArray(allRoles) ? allRoles : [];
        const updatedRoles = rolesArray.map(role => 
          role.id === editRole.id 
            ? { ...role, ...result, id: editRole.id }
            : role
        );
        
        setRoles(updatedRoles);
        setAllRoles(updatedRoles);
        
        toast.success("Role updated successfully");
      } else {
        // Create new role
        result = await create({
          title: formData.title.trim(),
          description: formData.description.trim(),
          routes: formData.routes,
          created_at: new Date().toISOString(),
          created_by: currentUser?.id
        }, 'roles');

        // Add the new role to both states
        const rolesArray = Array.isArray(allRoles) ? allRoles : [];
        const newRoles = [...rolesArray, result];
        setRoles(newRoles);
        setAllRoles(newRoles);
        
        toast.success("Role created successfully");
      }

      // Reset form and close dialog
      setFormData(initialFormData);
      setEditRole(null);
      setIsOpen(false);
      
    } catch (error) {
      console.error("Error saving role:", error);
      toast.error(editRole ? "Failed to update role" : "Failed to create role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (role) => {
    setFormData({
      title: role.title || "",
      description: role.description || "",
      routes: role.routes || []
    });
    setEditRole(role);
    setIsOpen(true);
  };

  const handleDeleteClick = (role) => {
    setRoleToDelete(role);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!roleToDelete) return;

    try {
      await remove(roleToDelete.id, 'roles');
      
      // Remove the role from both states
      const rolesArray = Array.isArray(allRoles) ? allRoles : [];
      const filteredRoles = rolesArray.filter(role => role.id !== roleToDelete.id);
      setRoles(filteredRoles);
      setAllRoles(filteredRoles);
      
      toast.success("Role deleted successfully");
      setDeleteConfirmOpen(false);
      setRoleToDelete(null);
    } catch (error) {
      console.error("Error deleting role:", error);
      toast.error("Failed to delete role");
    }
  };

  const openCreateDialog = () => {
    setFormData(initialFormData);
    setEditRole(null);
    setIsOpen(true);
  };

  const handleView = (role) => {
    setViewRole(role);
    setIsViewOpen(true);
  };

  const addRoute = (route) => {
    if (route && !formData.routes.includes(route)) {
      setFormData({
        ...formData,
        routes: [...formData.routes, route]
      });
    }
  };

  const removeRoute = (index) => {
    const newRoutes = formData.routes.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      routes: newRoutes
    });
  };

  const addCustomRoute = () => {
    if (newRoute.trim() && !formData.routes.includes(newRoute.trim())) {
      setFormData({
        ...formData,
        routes: [...formData.routes, newRoute.trim()]
      });
      setNewRoute("");
    }
  };

  // If auth is still loading, don't render anything
  if (status === "loading") {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold"> 
            Roles Management
          </h1>
          <p className="text-muted-foreground">
            Manage user roles and their route permissions
          </p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Role
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search roles by title, description, or routes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Roles ({roles.length})
          </CardTitle>
          <CardDescription>
            Manage system roles and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[300px]" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : roles.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No roles found</h3>
              <p className="text-muted-foreground mb-4">
                {search ? "Try adjusting your search criteria" : "Get started by creating your first role"}
              </p>
              {!search && (
                <Button onClick={openCreateDialog}>
                  Create First Role
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('title')}
                    >
                      <div className="flex items-center gap-2">
                        Role Title
                        {sortConfig.key === 'title' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('routes')}
                    >
                      <div className="flex items-center gap-2">
                        Routes
                        {sortConfig.key === 'routes' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </TableHead> 
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(roles) && roles.map((role) => (
                    <TableRow key={role.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-primary" />
                          {role.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={role.description}>
                          {role.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {role.routes?.slice(0, 2).map((route, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {route}
                            </Badge>
                          ))}
                          {role.routes?.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.routes.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell> 
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(role)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(role)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Role
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(role)}
                              className="text-destructive"
                            >
                              <Trash className="w-4 h-4 mr-2" />
                              Delete Role
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Role Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {editRole ? "Edit Role" : "Create New Role"}
            </DialogTitle>
            <DialogDescription>
              {editRole ? "Update the role information and permissions" : "Create a new role with specific route permissions"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Role Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter role title (e.g., Admin, Editor)"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this role can do..."
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Routes & Permissions *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRouteSelector(!showRouteSelector)}
                  >
                    <Route className="w-4 h-4 mr-2" />
                    {showRouteSelector ? "Hide" : "Show"} Route Selector
                  </Button>
                </div>

                {showRouteSelector && (
                  <Card className="p-4">
                    <h4 className="font-medium mb-3">Common Routes</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                      {commonRoutes.map((route) => (
                        <Button
                          key={route.path}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addRoute(route.path)}
                          disabled={formData.routes.includes(route.path)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          {route.label}
                        </Button>
                      ))}
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="flex gap-2">
                      <Input
                        placeholder="Custom route (e.g., /admin/custom)"
                        value={newRoute}
                        onChange={(e) => setNewRoute(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomRoute())}
                      />
                      <Button type="button" onClick={addCustomRoute}>
                        Add
                      </Button>
                    </div>
                  </Card>
                )}

                <div className="space-y-2">
                  <Label>Selected Routes ({formData.routes.length})</Label>
                  {formData.routes.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/20">
                      No routes selected. Use the route selector above or add custom routes.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/20">
                      {formData.routes.map((route, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {route}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 ml-1"
                            onClick={() => removeRoute(index)}
                          >
                            ×
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editRole ? "Update Role" : "Create Role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Role Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Role Details
            </DialogTitle>
          </DialogHeader>

          {viewRole && (
            <div className="space-y-6">
              <div className="grid gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Role Title</Label>
                  <p className="text-lg font-semibold">{viewRole.title}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="text-sm">{viewRole.description || "No description provided"}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Routes & Permissions ({viewRole.routes?.length || 0})
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {viewRole.routes?.map((route, index) => (
                      <Badge key={index} variant="secondary">
                        {route}
                      </Badge>
                    )) || <p className="text-sm text-muted-foreground">No routes assigned</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                    <p>{viewRole.created_at ? new Date(viewRole.created_at).toLocaleString() : 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Updated</Label>
                    <p>{viewRole.updated_at ? new Date(viewRole.updated_at).toLocaleString() : 'Never'}</p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => { setIsViewOpen(false); handleEdit(viewRole); }}>
                  Edit Role
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash className="w-5 h-5" />
              Delete Role
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the role "{roleToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

