"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Plus, Eye, Edit, Trash2, Copy, Percent, Euro, Users, Globe, Calendar, Infinity } from "lucide-react";
import { getAll, create, update, remove } from "@/lib/client/query.js";

const couponTypes = [
  { value: 'percentage', label: 'Percentage Discount', icon: Percent },
  { value: 'fixed', label: 'Fixed Amount (€)', icon: Euro },
];

const usageTypes = [
  { value: 'unlimited', label: 'Unlimited Uses', icon: Infinity },
  { value: 'limited', label: 'Limited Uses', icon: Users },
  { value: 'single', label: 'Single Use Only', icon: Users },
];

const targetTypes = [
  { value: 'public', label: 'Public (Anyone)', icon: Globe },
  { value: 'specific', label: 'Specific Customer', icon: Users },
];

const initialFormData = {
  code: "",
  name: "",
  description: "",
  type: "percentage", // percentage or fixed
  value: 0,
  minAmount: 0,
  maxAmount: 0,
  usageType: "unlimited", // unlimited, limited, single
  usageLimit: 1,
  usedCount: 0,
  targetType: "public", // public or specific
  targetEmail: "",
  expiresAt: "",
  isActive: true,
  isUnlimited: false,
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const itemsPerPage = 10;

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await getAll("coupons");
      
      if (response.success && Array.isArray(response.data)) { 
        setCoupons(response.data);
      } else {
        setCoupons([]);
        if (response.error) {
          toast.error(response.error);
        }
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      setCoupons([]);
      toast.error("Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getFilteredAndSortedCoupons = useCallback(() => {
    if (!Array.isArray(coupons)) {
      return [];
    }
    
    let filtered = [...coupons];

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (coupon) => {
          return coupon.code?.toLowerCase().includes(searchLower) ||
                 coupon.name?.toLowerCase().includes(searchLower) ||
                 coupon.description?.toLowerCase().includes(searchLower) ||
                 coupon.targetEmail?.toLowerCase().includes(searchLower);
        }
      );
    }

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(coupon => coupon.type === filterType);
    }

    // Filter by status
    if (filterStatus !== "all") {
      const now = new Date();
      filtered = filtered.filter(coupon => {
        if (filterStatus === "active") {
          return coupon.isActive && (!coupon.expiresAt || new Date(coupon.expiresAt) > now);
        } else if (filterStatus === "expired") {
          return coupon.expiresAt && new Date(coupon.expiresAt) <= now;
        } else if (filterStatus === "inactive") {
          return !coupon.isActive;
        }
        return true;
      });
    }

    // Sort
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'createdAt' || sortConfig.key === 'updatedAt' || sortConfig.key === 'expiresAt') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
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

    return filtered;
  }, [coupons, search, filterType, filterStatus, sortConfig]);

  const getPaginatedCoupons = () => {
    const filtered = getFilteredAndSortedCoupons();
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = Math.ceil(getFilteredAndSortedCoupons().length / itemsPerPage);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code: result }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      const couponData = {
        ...formData,
        code: formData.code.toUpperCase(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const response = await create(couponData, "coupons");
      
      if (response.success) {
        toast.success("Coupon created successfully");
        setCoupons(prev => [...prev, response.data]);
        setIsOpen(false);
        setFormData(initialFormData);
      }
    } catch (error) {
      console.error('Error creating coupon:', error);
      toast.error("Failed to create coupon");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (coupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      ...coupon,
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : "",
    });
    setIsEditOpen(true);
  };

  const handleView = (coupon) => {
    setSelectedCoupon(coupon);
    setIsViewOpen(true);
  };

  const handleDelete = (coupon) => {
    setSelectedCoupon(coupon);
    setDeleteConfirmText("");
    setIsDeleteOpen(true);
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("Coupon code copied to clipboard!");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updatedData = {
        ...formData,
        code: formData.code.toUpperCase(),
        updatedAt: new Date().toISOString(),
      };
      
      const response = await update(selectedCoupon.id, updatedData, "coupons");
      if (response.success) {
        toast.success('Coupon updated successfully!');
        setFormData(initialFormData);
        setIsEditOpen(false);
        setSelectedCoupon(null);
        await fetchCoupons();
      } else {
        toast.error(response.error || 'Failed to update coupon');
      }
    } catch (error) {
      console.error('Error updating coupon:', error);
      toast.error('Error updating coupon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmText !== 'delete') {
      toast.error('Please type "delete" to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await remove(selectedCoupon.id, "coupons");
      if (response.success) {
        toast.success('Coupon deleted successfully!');
        setIsDeleteOpen(false);
        setSelectedCoupon(null);
        setDeleteConfirmText("");
        await fetchCoupons();
      } else {
        toast.error(response.error || 'Failed to delete coupon');
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Error deleting coupon');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDialogs = () => {
    setIsOpen(false);
    setIsEditOpen(false);
    setIsViewOpen(false);
    setIsDeleteOpen(false);
    setFormData(initialFormData);
    setSelectedCoupon(null);
    setDeleteConfirmText("");
  };

  const getCouponStatus = (coupon) => {
    const now = new Date();
    if (!coupon.isActive) return { label: 'Inactive', variant: 'secondary' };
    if (coupon.expiresAt && new Date(coupon.expiresAt) <= now) return { label: 'Expired', variant: 'destructive' };
    if (coupon.usageType !== 'unlimited' && coupon.usedCount >= coupon.usageLimit) return { label: 'Used Up', variant: 'destructive' };
    return { label: 'Active', variant: 'default' };
  };

  const formatCouponValue = (coupon) => {
    if (coupon.type === 'percentage') {
      return `${coupon.value}%`;
    } else {
      return `€${coupon.value}`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Coupons & Promo Codes</h2>
            <p className="text-muted-foreground">Create and manage discount coupons for your store</p>
          </div>
        </div>
        
        <div className="flex flex-col space-y-4">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-4 items-center flex-wrap">
              <Input
                placeholder="Search coupons..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs"
              />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Coupon
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Coupon</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="code">Coupon Code</Label>
                        <div className="flex gap-2">
                          <Input
                            id="code"
                            name="code"
                            value={formData.code}
                            onChange={handleInputChange}
                            placeholder="SAVE20"
                            className="uppercase"
                            required
                          />
                          <Button type="button" onClick={generateCouponCode} variant="outline">
                            Generate
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="name">Coupon Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Summer Sale"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Description of this coupon..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="type">Discount Type</Label>
                        <Select name="type" value={formData.type} onValueChange={(value) => 
                          setFormData(prev => ({ ...prev, type: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {couponTypes.map(type => {
                              const Icon = type.icon;
                              return (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="w-4 h-4" />
                                    {type.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="value">
                          Discount Value {formData.type === 'percentage' ? '(%)' : '(€)'}
                        </Label>
                        <Input
                          id="value"
                          name="value"
                          type="number"
                          min="0"
                          max={formData.type === 'percentage' ? "100" : undefined}
                          step={formData.type === 'percentage' ? "1" : "0.01"}
                          value={formData.value}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="minAmount">Minimum Order Amount (€)</Label>
                        <Input
                          id="minAmount"
                          name="minAmount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.minAmount}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="maxAmount">Maximum Order Amount (€)</Label>
                        <Input
                          id="maxAmount"
                          name="maxAmount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.maxAmount}
                          onChange={handleInputChange}
                          placeholder="0 = No limit"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="usageType">Usage Type</Label>
                        <Select name="usageType" value={formData.usageType} onValueChange={(value) => 
                          setFormData(prev => ({ ...prev, usageType: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {usageTypes.map(type => {
                              const Icon = type.icon;
                              return (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="w-4 h-4" />
                                    {type.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      {formData.usageType === 'limited' && (
                        <div className="grid gap-2">
                          <Label htmlFor="usageLimit">Usage Limit</Label>
                          <Input
                            id="usageLimit"
                            name="usageLimit"
                            type="number"
                            min="1"
                            value={formData.usageLimit}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="targetType">Target Type</Label>
                        <Select name="targetType" value={formData.targetType} onValueChange={(value) => 
                          setFormData(prev => ({ ...prev, targetType: value, targetEmail: value === 'public' ? '' : prev.targetEmail }))
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {targetTypes.map(type => {
                              const Icon = type.icon;
                              return (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="w-4 h-4" />
                                    {type.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      {formData.targetType === 'specific' && (
                        <div className="grid gap-2">
                          <Label htmlFor="targetEmail">Customer Email</Label>
                          <Input
                            id="targetEmail"
                            name="targetEmail"
                            type="email"
                            value={formData.targetEmail}
                            onChange={handleInputChange}
                            placeholder="customer@example.com"
                            required
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="expiresAt">Expiration Date</Label>
                      <Input
                        id="expiresAt"
                        name="expiresAt"
                        type="date"
                        value={formData.expiresAt}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <p className="text-sm text-muted-foreground">Leave empty for no expiration</p>
                    </div>

                    <div className="grid gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isActive"
                          name="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => 
                            setFormData(prev => ({ ...prev, isActive: checked }))
                          }
                        />
                        <Label htmlFor="isActive">Active</Label>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Coupon"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <ScrollArea className="h-[calc(100vh-300px)]">
            {loading ? (
              <TableSkeleton columns={7} rows={5} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead onClick={() => handleSort("code")} className="cursor-pointer">
                      Code {sortConfig.key === "code" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead onClick={() => handleSort("expiresAt")} className="cursor-pointer">
                      Expires {sortConfig.key === "expiresAt" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getPaginatedCoupons().map((coupon) => {
                    const status = getCouponStatus(coupon);
                    
                    return (
                      <TableRow key={coupon.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                              {coupon.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyCode(coupon.code)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{coupon.name}</div>
                            {coupon.targetType === 'specific' && (
                              <div className="text-sm text-muted-foreground">
                                For: {coupon.targetEmail}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {coupon.type === 'percentage' ? <Percent className="w-4 h-4" /> : <Euro className="w-4 h-4" />}
                            {coupon.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{formatCouponValue(coupon)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {coupon.usageType === 'unlimited' ? (
                              <span className="text-green-600">Unlimited</span>
                            ) : (
                              <span>{coupon.usedCount}/{coupon.usageLimit}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {coupon.expiresAt ? (
                            formatDate(coupon.expiresAt)
                          ) : (
                            <span className="text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleView(coupon)}
                              title="View Coupon"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(coupon)}
                              title="Edit Coupon"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDelete(coupon)}
                              title="Delete Coupon"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </ScrollArea> 
          
          {!loading && totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )} 
        </div>
      </div>

      {/* Edit Coupon Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="code">Coupon Code</Label>
                  <Input
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className="uppercase"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Coupon Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Discount Type</Label>
                  <Select name="type" value={formData.type} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {couponTypes.map(type => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="value">
                    Discount Value {formData.type === 'percentage' ? '(%)' : '(€)'}
                  </Label>
                  <Input
                    id="value"
                    name="value"
                    type="number"
                    min="0"
                    max={formData.type === 'percentage' ? "100" : undefined}
                    step={formData.type === 'percentage' ? "1" : "0.01"}
                    value={formData.value}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="minAmount">Minimum Order Amount (€)</Label>
                  <Input
                    id="minAmount"
                    name="minAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minAmount}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxAmount">Maximum Order Amount (€)</Label>
                  <Input
                    id="maxAmount"
                    name="maxAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.maxAmount}
                    onChange={handleInputChange}
                    placeholder="0 = No limit"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="usageType">Usage Type</Label>
                  <Select name="usageType" value={formData.usageType} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, usageType: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {usageTypes.map(type => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {formData.usageType === 'limited' && (
                  <div className="grid gap-2">
                    <Label htmlFor="usageLimit">Usage Limit</Label>
                    <Input
                      id="usageLimit"
                      name="usageLimit"
                      type="number"
                      min="1"
                      value={formData.usageLimit}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="targetType">Target Type</Label>
                  <Select name="targetType" value={formData.targetType} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, targetType: value, targetEmail: value === 'public' ? '' : prev.targetEmail }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {targetTypes.map(type => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {formData.targetType === 'specific' && (
                  <div className="grid gap-2">
                    <Label htmlFor="targetEmail">Customer Email</Label>
                    <Input
                      id="targetEmail"
                      name="targetEmail"
                      type="email"
                      value={formData.targetEmail}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="expiresAt">Expiration Date</Label>
                <Input
                  id="expiresAt"
                  name="expiresAt"
                  type="date"
                  value={formData.expiresAt}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-sm text-muted-foreground">Leave empty for no expiration</p>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, isActive: checked }))
                    }
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialogs}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Coupon"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Coupon Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Coupon Details</DialogTitle>
          </DialogHeader>
          {selectedCoupon && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Code</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                      {selectedCoupon.code}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyCode(selectedCoupon.code)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedCoupon.name}
                  </p>
                </div>
              </div>
              
              {selectedCoupon.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedCoupon.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Discount</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatCouponValue(selectedCoupon)} {selectedCoupon.type === 'percentage' ? 'off' : 'discount'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    {(() => {
                      const status = getCouponStatus(selectedCoupon);
                      return <Badge variant={status.variant}>{status.label}</Badge>;
                    })()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Min Amount</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedCoupon.minAmount > 0 ? `€${selectedCoupon.minAmount}` : 'No minimum'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Max Amount</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedCoupon.maxAmount > 0 ? `€${selectedCoupon.maxAmount}` : 'No maximum'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Usage</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedCoupon.usageType === 'unlimited' ? 'Unlimited' : `${selectedCoupon.usedCount}/${selectedCoupon.usageLimit} used`}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Target</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedCoupon.targetType === 'public' ? 'Public' : selectedCoupon.targetEmail}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-muted-foreground mt-1">
                    {selectedCoupon.createdAt ? formatDate(selectedCoupon.createdAt) : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Expires</Label>
                  <p className="text-muted-foreground mt-1">
                    {selectedCoupon.expiresAt ? formatDate(selectedCoupon.expiresAt) : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={handleCloseDialogs}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Coupon Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete this coupon? This action cannot be undone.
            </p>
            {selectedCoupon && (
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="font-medium">{selectedCoupon.name}</p>
                <p className="text-sm text-muted-foreground">
                  Code: {selectedCoupon.code} • {formatCouponValue(selectedCoupon)}
                </p>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="deleteConfirm">Type "delete" to confirm</Label>
              <Input
                id="deleteConfirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDialogs}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={deleteConfirmText !== 'delete' || isDeleting}
              variant="destructive"
            >
              {isDeleting ? "Deleting..." : "Delete Coupon"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}