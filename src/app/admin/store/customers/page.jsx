"use client";

import { useEffect, useState, useCallback } from "react";
import { getAll, create } from "@/lib/client/query";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Eye, Plus, Edit, Trash2 } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { CountryDropdown } from "@/components/ui/country-dropdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { update, remove } from "@/lib/client/query";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const initialFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  streetAddress: "",
  apartmentUnit: "",
  city: "",
  state: "",
  zipCode: "",
  country: "France",
  countryIso: "FR",
  // Business Information
  isBusinessCustomer: false,
  businessName: "",
  legalBusinessName: "",
  tvaNumber: "",
  businessType: "",
  businessAddress: "",
  businessPhone: "",
  businessEmail: "",
  notes: "",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const itemsPerPage = 10;

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await getAll("customers");
      
      if (response.success) { 
        setCustomers(response.data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getFilteredAndSortedCustomers = useCallback(() => {
    let filtered = [...customers];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (customer) => {
          const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.name || '';
          return fullName.toLowerCase().includes(searchLower) ||
                 customer.email?.toLowerCase().includes(searchLower) ||
                 customer.phone?.includes(search);
        }
      );
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'lastOrder') {
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
  }, [customers, search, sortConfig]);

  const getPaginatedCustomers = () => {
    const filtered = getFilteredAndSortedCustomers();
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = Math.ceil(getFilteredAndSortedCustomers().length / itemsPerPage);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handlePhoneChange = (value) => {
    setFormData(prev => ({ ...prev, phone: value }));
  };

  const handleCountryChange = (value) => {
    setFormData(prev => ({ ...prev, country: value, countryIso: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      // Add default values for new customers with no orders
      const customerData = {
        ...formData,
        orders: 0,
        totalSpent: 0,
        lastOrder: null,
        createdAt: new Date().toISOString(),
      };
      
      const newCustomer = await create(customerData, "customers");
      
      if (newCustomer) {
        toast.success("Customer created successfully");
        setCustomers(prev => [...prev, newCustomer]);
        setIsOpen(false);
        setFormData(initialFormData);
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error("Failed to create customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      ...customer,
      phone: customer.phone || "",
      country: customer.country || "France",
      countryIso: customer.countryIso || "FR",
      isBusinessCustomer: customer.isBusinessCustomer || false,
      businessName: customer.businessName || "",
      legalBusinessName: customer.legalBusinessName || "",
      tvaNumber: customer.tvaNumber || "",
      businessType: customer.businessType || "",
      businessAddress: customer.businessAddress || "",
      businessPhone: customer.businessPhone || "",
      businessEmail: customer.businessEmail || "",
      notes: customer.notes || "",
    });
    setEditMode(true);
    setIsEditOpen(true);
  };

  const handleView = (customer) => {
    setSelectedCustomer(customer);
    setIsViewOpen(true);
  };

  const handleDelete = (customer) => {
    setSelectedCustomer(customer);
    setDeleteConfirmText("");
    setIsDeleteOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updatedCustomer = await update(selectedCustomer.id, formData, "customers");
      if (updatedCustomer) {
        toast.success('Customer updated successfully!');
        setFormData(initialFormData);
        setIsEditOpen(false);
        setEditMode(false);
        setSelectedCustomer(null);
        await fetchCustomers();
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Error updating customer');
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
      const result = await remove(selectedCustomer.id, "customers");
      if (result) {
        toast.success('Customer deleted successfully!');
        setIsDeleteOpen(false);
        setSelectedCustomer(null);
        setDeleteConfirmText("");
        await fetchCustomers();
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Error deleting customer');
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
    setSelectedCustomer(null);
    setEditMode(false);
    setDeleteConfirmText("");
  };



  return (
    <div className="space-y-4">
   
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Customers</h2>
              <p className="text-muted-foreground">Manage your customers</p>
            </div>
          </div>
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <Input
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs"
              />
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Customer
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Customer</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="grid gap-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Phone</Label>
                        <PhoneInput
                          value={formData.phone}
                          onChange={handlePhoneChange}
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="streetAddress">Street Address</Label>
                        <Input
                          id="streetAddress"
                          name="streetAddress"
                          value={formData.streetAddress}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="apartmentUnit">Apartment/Unit</Label>
                        <Input
                          id="apartmentUnit"
                          name="apartmentUnit"
                          value={formData.apartmentUnit}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="grid gap-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="grid gap-2">
                          <Label htmlFor="zipCode">ZIP Code</Label>
                          <Input
                            id="zipCode"
                            name="zipCode"
                            value={formData.zipCode}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="country">Country</Label>
                          <CountryDropdown
                            value={formData.country}
                            onChange={handleCountryChange}
                            className="w-full"
                          />
                        </div>
                      </div>
                      
                      {/* Business Information */}
                      <div className="grid gap-2 pt-4 border-t">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="isBusinessCustomer"
                            name="isBusinessCustomer"
                            checked={formData.isBusinessCustomer}
                            onCheckedChange={(checked) => 
                              setFormData(prev => ({ ...prev, isBusinessCustomer: checked }))
                            }
                          />
                          <Label htmlFor="isBusinessCustomer">Business Customer</Label>
                        </div>
                      </div>

                      {formData.isBusinessCustomer && (
                        <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                          <div className="grid gap-2">
                            <Label htmlFor="businessName">Business Name</Label>
                            <Input
                              id="businessName"
                              name="businessName"
                              value={formData.businessName}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="legalBusinessName">Legal Business Name</Label>
                            <Input
                              id="legalBusinessName"
                              name="legalBusinessName"
                              value={formData.legalBusinessName}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="grid gap-2">
                              <Label htmlFor="tvaNumber">TVA Number</Label>
                              <Input
                                id="tvaNumber"
                                name="tvaNumber"
                                value={formData.tvaNumber}
                                onChange={handleInputChange}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="businessType">Business Type</Label>
                              <Input
                                id="businessType"
                                name="businessType"
                                value={formData.businessType}
                                onChange={handleInputChange}
                                placeholder="e.g., LLC, Corporation, etc."
                              />
                            </div>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="businessAddress">Business Address</Label>
                            <Textarea
                              id="businessAddress"
                              name="businessAddress"
                              value={formData.businessAddress}
                              onChange={handleInputChange}
                              rows={2}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="grid gap-2">
                              <Label htmlFor="businessPhone">Business Phone</Label>
                              <PhoneInput
                                value={formData.businessPhone}
                                onChange={(value) => 
                                  setFormData(prev => ({ ...prev, businessPhone: value }))
                                }
                                placeholder="Business phone number"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="businessEmail">Business Email</Label>
                              <Input
                                id="businessEmail"
                                name="businessEmail"
                                type="email"
                                value={formData.businessEmail}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid gap-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          rows={3}
                          placeholder="Additional notes about the customer..."
                        />
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
                        {isSubmitting ? "Creating..." : "Create"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <ScrollArea className="h-[calc(100vh-250px)]">
                   {loading ? (
                <TableSkeleton columns={6} rows={5} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead onClick={() => handleSort("name")} className="cursor-pointer">
                      Name {sortConfig.key === "name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead onClick={() => handleSort("email")} className="cursor-pointer">
                      Email {sortConfig.key === "email" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead onClick={() => handleSort("orders")} className="cursor-pointer">
                      Orders {sortConfig.key === "orders" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead onClick={() => handleSort("totalSpent")} className="cursor-pointer">
                      Total Spent {sortConfig.key === "totalSpent" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead onClick={() => handleSort("lastOrder")} className="cursor-pointer">
                      Last Order {sortConfig.key === "lastOrder" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getPaginatedCustomers().map((customer) => {
                    const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.name || 'N/A';
                    const orderCount = customer.orders || 0;
                    const totalSpent = customer.totalSpent || 0;
                    const lastOrderDate = customer.lastOrder;
                    
                    return (
                      <TableRow key={customer.id || customer.email}>
                        <TableCell>{fullName}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{orderCount}</TableCell>
                        <TableCell>{formatCurrency(totalSpent)}</TableCell>
                        <TableCell>{lastOrderDate ? formatDate(lastOrderDate) : 'No orders'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleView(customer)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(customer)}
                              title="Edit Customer"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDelete(customer)}
                              title="Delete Customer"
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

        {/* Edit Customer Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <PhoneInput
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="streetAddress">Street Address</Label>
                  <Input
                    id="streetAddress"
                    name="streetAddress"
                    value={formData.streetAddress}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="apartmentUnit">Apartment/Unit</Label>
                  <Input
                    id="apartmentUnit"
                    name="apartmentUnit"
                    value={formData.apartmentUnit}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="country">Country</Label>
                    <CountryDropdown
                      value={formData.country}
                      onChange={handleCountryChange}
                      className="w-full"
                    />
                  </div>
                </div>
                
                {/* Business Information */}
                <div className="grid gap-2 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isBusinessCustomer"
                      name="isBusinessCustomer"
                      checked={formData.isBusinessCustomer}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, isBusinessCustomer: checked }))
                      }
                    />
                    <Label htmlFor="isBusinessCustomer">Business Customer</Label>
                  </div>
                </div>

                {formData.isBusinessCustomer && (
                  <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                    <div className="grid gap-2">
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="legalBusinessName">Legal Business Name</Label>
                      <Input
                        id="legalBusinessName"
                        name="legalBusinessName"
                        value={formData.legalBusinessName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="grid gap-2">
                        <Label htmlFor="tvaNumber">TVA Number</Label>
                        <Input
                          id="tvaNumber"
                          name="tvaNumber"
                          value={formData.tvaNumber}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="businessType">Business Type</Label>
                        <Input
                          id="businessType"
                          name="businessType"
                          value={formData.businessType}
                          onChange={handleInputChange}
                          placeholder="e.g., LLC, Corporation, etc."
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="businessAddress">Business Address</Label>
                      <Textarea
                        id="businessAddress"
                        name="businessAddress"
                        value={formData.businessAddress}
                        onChange={handleInputChange}
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="grid gap-2">
                        <Label htmlFor="businessPhone">Business Phone</Label>
                        <PhoneInput
                          value={formData.businessPhone}
                          onChange={(value) => 
                            setFormData(prev => ({ ...prev, businessPhone: value }))
                          }
                          placeholder="Business phone number"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="businessEmail">Business Email</Label>
                        <Input
                          id="businessEmail"
                          name="businessEmail"
                          type="email"
                          value={formData.businessEmail}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Additional notes about the customer..."
                  />
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
                  {isSubmitting ? "Updating..." : "Update"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Customer Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
            </DialogHeader>
            {selectedCustomer && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">First Name</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedCustomer.firstName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Name</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedCustomer.lastName || 'N/A'}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedCustomer.email}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedCustomer.phone || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Address</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {[
                      selectedCustomer.streetAddress,
                      selectedCustomer.apartmentUnit,
                      selectedCustomer.city,
                      selectedCustomer.state,
                      selectedCustomer.zipCode,
                      selectedCustomer.country
                    ].filter(Boolean).join(', ') || 'No address provided'}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Orders</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedCustomer.orders || 0}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total Spent</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatCurrency(selectedCustomer.totalSpent || 0)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Order</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedCustomer.lastOrder ? formatDate(selectedCustomer.lastOrder) : 'No orders'}
                    </p>
                  </div>
                </div>
                
                {selectedCustomer.isBusinessCustomer && (
                  <div className="pt-4 border-t">
                    <Label className="text-sm font-medium">Business Information</Label>
                    <div className="grid gap-2 mt-2">
                      {selectedCustomer.businessName && (
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Business Name</Label>
                          <p className="text-sm">{selectedCustomer.businessName}</p>
                        </div>
                      )}
                      {selectedCustomer.legalBusinessName && (
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Legal Business Name</Label>
                          <p className="text-sm">{selectedCustomer.legalBusinessName}</p>
                        </div>
                      )}
                      {selectedCustomer.tvaNumber && (
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">TVA Number</Label>
                          <p className="text-sm">{selectedCustomer.tvaNumber}</p>
                        </div>
                      )}
                      {selectedCustomer.businessType && (
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Business Type</Label>
                          <p className="text-sm">{selectedCustomer.businessType}</p>
                        </div>
                      )}
                      {selectedCustomer.businessAddress && (
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Business Address</Label>
                          <p className="text-sm">{selectedCustomer.businessAddress}</p>
                        </div>
                      )}
                      {selectedCustomer.businessPhone && (
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Business Phone</Label>
                          <p className="text-sm">{selectedCustomer.businessPhone}</p>
                        </div>
                      )}
                      {selectedCustomer.businessEmail && (
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Business Email</Label>
                          <p className="text-sm">{selectedCustomer.businessEmail}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {selectedCustomer.notes && (
                  <div>
                    <Label className="text-sm font-medium">Notes</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedCustomer.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={handleCloseDialogs}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Customer Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Customer</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Are you sure you want to delete this customer? This action cannot be undone.
              </p>
              {selectedCustomer && (
                <div className="bg-accent p-3 rounded-lg mb-4">
                  <p className="font-medium">
                    {`${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim() || 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCustomer.orders || 0} orders • {formatCurrency(selectedCustomer.totalSpent || 0)} spent
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
                {isDeleting ? "Deleting..." : "Delete Customer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}
