"use client";

import { Edit, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AdminHeader from '@/app/admin/components/AdminHeader';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from '@/components/ui/pagination';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/skeleton';
import { 
  getAllCustomers, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer 
} from '@/lib/server/admin';

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  notes: ''
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const result = await getAllCustomers({
        page: currentPage,
        limit: itemsPerPage,
        search: search
      });
      if (result?.success) {
        setCustomers(result.data || []);
        setTotalPages(result.pagination.totalPages);
        setTotalItems(result.pagination.totalItems);
      } else {
        setCustomers([]);
        console.error('Failed to fetch customers:', result?.error);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      toast.error('Failed to load customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, search]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await createCustomer(formData);
      if (result.success) {
        toast.success('Customer created');
        fetchCustomers(); // Refresh the customer list
        setIsOpen(false);
        setFormData(initialForm);
      } else {
        toast.error(result.error || 'Failed to create customer');
      }
    } catch (err) {
      console.error('Error creating customer:', err);
      toast.error('Failed to create customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({ ...initialForm, ...customer });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setIsSubmitting(true);
    try {
      const result = await updateCustomer(selectedCustomer.id, formData);
      if (result.success) {
        toast.success('Customer updated');
        fetchCustomers(); // Refresh the customer list
        setIsEditOpen(false);
        setSelectedCustomer(null);
        setFormData(initialForm);
      } else {
        toast.error(result.error || 'Failed to update customer');
      }
    } catch (err) {
      console.error('Error updating customer:', err);
      toast.error('Failed to update customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (customer) => {
    setSelectedCustomer(customer);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedCustomer) return;
    setIsDeleting(true);
    try {
      const result = await deleteCustomer(selectedCustomer.id);
      if (result.success) {
        toast.success('Customer deleted');
        fetchCustomers(); // Refresh the customer list
        setIsDeleteOpen(false);
        setSelectedCustomer(null);
      } else {
        toast.error(result.error || 'Failed to delete customer');
      }
    } catch (err) {
      console.error('Error deleting customer:', err);
      toast.error('Failed to delete customer');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (c.firstName || '').toLowerCase().includes(s) ||
      (c.lastName || '').toLowerCase().includes(s) ||
      (c.email || '').toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-4">
      <AdminHeader title="Customers" description="Manage your customers" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input 
            placeholder="Search customers..." 
            value={search} 
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1); // Reset to first page when searching
            }} 
            className="max-w-xs" 
          />
          {totalItems > 0 && (
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} customers
            </p>
          )}
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Customer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <ScrollArea className="h-[calc(100vh-300px)]">
          {loading ? (
            <TableSkeleton columns={4} rows={5} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((customer) => (
                  <TableRow key={customer.id || customer.email}>
                    <TableCell>{`${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'N/A'}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>
                      {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="outline" size="icon" onClick={() => { setSelectedCustomer(customer); setFormData(customer); setIsEditOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDelete(customer)} className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) {
                      setCurrentPage(currentPage - 1);
                    }
                  }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(page);
                    }}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) {
                      setCurrentPage(currentPage + 1);
                    }
                  }}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => setIsEditOpen(open)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" name="firstName" value={formData.firstName || ''} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" name="lastName" value={formData.lastName || ''} onChange={handleInputChange} required />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email || ''} onChange={handleInputChange} required />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => setIsDeleteOpen(open)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4 text-muted-foreground text-sm">Are you sure you want to delete this customer? This action cannot be undone.</p>
            {selectedCustomer && (
              <div className="mb-4 rounded-lg bg-accent p-3">
                <p className="font-medium">{`${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim() || 'N/A'}</p>
                <p className="text-muted-foreground text-sm">{selectedCustomer.email}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>Cancel</Button>
            <Button onClick={confirmDelete} variant="destructive" disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
