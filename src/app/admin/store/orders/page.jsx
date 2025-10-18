// @/app/admin/store/orders/page.jsx

'use client';

import {
    ArrowUpDown,
    CreditCard,
    Download,
    Eye,
    FileDown,
    FileText,
    Info,
    MoreVertical,
    Pencil,
    Plus,
    Printer,
    Search,
    Send,
    Trash2,
    Truck,
    User
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CountryDropdown } from '@/components/ui/country-dropdown';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { create, getAll, remove, update } from '@/lib/client/query';
import { generatePDF } from '@/utils/generatePDF';

const ORDER_STATUS = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
];

const initialFormData = {
    customer: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        streetAddress: '',
        apartmentUnit: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'FR',
        countryIso: 'FR'
    },
    items: [],
    subtotal: 0,
    shippingCost: 0,
    discountType: 'fixed', // "fixed" or "percentage"
    discountValue: 0,
    discountAmount: 0,
    taxEnabled: false,
    taxRate: 0, // Tax rate as percentage (e.g., 20 for 20%)
    taxAmount: 0,
    taxIncluded: false, // Whether tax is included in the item prices or added on top
    total: 0,
    status: 'pending',
    paymentStatus: 'pending',
    paymentMethod: '',
    deliveryNotes: '',
    shippingNotes: '', // Admin-only shipping notes
    sendEmail: true,
    appointmentId: null,
    isServiceAppointment: false
};

const PAYMENT_METHODS = [
    { value: 'none', label: 'None/Pending' },
    { value: 'card', label: 'Credit/Debit Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'pay_on_delivery', label: 'Pay On Delivery' },
    { value: 'cash', label: 'Cash' },
    { value: 'crypto', label: 'Cryptocurrency' }
];

const PAYMENT_STATUS = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'paid', label: 'Paid' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'cancelled', label: 'Cancelled' }
];

export default function OrdersPage() {
    const [_orders, setOrders] = useState([]);
    const [allOrders, setAllOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isNewCustomer, setIsNewCustomer] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [sortConfig, setSortConfig] = useState({
        key: 'createdAt',
        direction: 'desc'
    });
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [_isUpdateOpen, _setIsUpdateOpen] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [_currentPage, _setCurrentPage] = useState(1);
    const [storeSettings, setStoreSettings] = useState(null);
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const [statusChangeData, setStatusChangeData] = useState(null);
    const [sendEmailNotification, setSendEmailNotification] = useState(true);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
    const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const [editStatusData, setEditStatusData] = useState({
        status: '',
        tracking: '',
        sendEmail: true
    });
    const [isEditingPayment, setIsEditingPayment] = useState(false);
    const [editPaymentData, setEditPaymentData] = useState({
        paymentStatus: '',
        paymentMethod: ''
    });
    const [isEditingShippingNotes, setIsEditingShippingNotes] = useState(false);
    const [tempShippingNotes, setTempShippingNotes] = useState('');
    const [isSavingShippingNotes, setIsSavingShippingNotes] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isConfirmingStatusChange, setIsConfirmingStatusChange] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchStoreSettings = async () => {
        try {
            const response = await getAll('store_settings');
            if (response?.success && response.data?.length > 0) {
                const settings = response.data[0];
                setStoreSettings(settings);

                // Update initial form data with VAT settings if they exist
                if (settings.vatPercentage !== undefined) {
                    setFormData((prev) => ({
                        ...prev,
                        taxEnabled: true,
                        taxRate: settings.vatPercentage,
                        taxIncluded: settings.vatIncludedInPrice
                    }));
                }
            }
        } catch (error) {
            console.error('Failed to fetch store settings:', error);
        }
    };

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await getAll('orders', { limit: 0 });
            if (response.success) {
                setOrders(response.data);
                setAllOrders(response.data);
            }
        } catch (_error) {
            toast.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await getAll('customers', { limit: 0 });
            if (response.success) {
                setCustomers(response.data);
            }
        } catch (_error) {
            toast.error('Failed to fetch customers');
        }
    };

    const fetchCatalog = async () => {
        try {
            const response = await getAll('catalog', { limit: 0 });
            if (response.success) {
                setCatalog(response.data);
            }
        } catch (_error) {
            toast.error('Failed to fetch catalog items');
        }
    };

    // Helper function to update order in state without full reload
    const updateOrderInState = (orderId, updateData) => {
        // Update allOrders
        setAllOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, ...updateData } : order)));

        // Update filtered orders
        setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, ...updateData } : order)));

        // Update selectedOrder if it matches
        if (selectedOrder && selectedOrder.id === orderId) {
            setSelectedOrder((prev) => ({ ...prev, ...updateData }));
        }
    };

    // Helper function to add new order to state
    const addOrderToState = (newOrder) => {
        setAllOrders((prev) => [newOrder, ...prev]);
        setOrders((prev) => [newOrder, ...prev]);
    };

    useEffect(() => {
        fetchStoreSettings();
        fetchOrders();
        fetchCustomers();
        fetchCatalog();
    }, []);

    // Filter and sort orders
    const getFilteredAndSortedOrders = useCallback(() => {
        let filtered = [...allOrders];

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(
                (order) =>
                    order.id.toLowerCase().includes(searchLower) ||
                    order.customer.name.toLowerCase().includes(searchLower) ||
                    order.customer.email.toLowerCase().includes(searchLower)
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter((order) => order.status === statusFilter);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue = sortConfig.key.includes('.') ? a.customer.name : a[sortConfig.key];
            let bValue = sortConfig.key.includes('.') ? b.customer.name : b[sortConfig.key];

            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [allOrders, search, statusFilter, sortConfig]);

    // Get filtered and sorted orders
    const filteredOrders = getFilteredAndSortedOrders();

    // Update orders when filters change
    useEffect(() => {
        setOrders(getFilteredAndSortedOrders());
    }, [search, statusFilter, sortConfig, getFilteredAndSortedOrders]);

    const handleSort = (key) => {
        setSortConfig((current) => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleCreateOrder = async () => {
        try {
            setIsSubmitting(true);

            // Validate form data
            if (!isNewCustomer && !selectedCustomerId) {
                throw new Error('Please select a customer or choose to create a new one');
            }

            if (formData.items.length === 0) {
                throw new Error('Please add at least one item to the order');
            }

            // Validate customer data for new customers
            if (isNewCustomer) {
                if (!formData.customer.firstName || !formData.customer.lastName || !formData.customer.email) {
                    throw new Error('Customer first name, last name, and email are required');
                }
            }

            // Calculate totals
            const subtotal = formData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

            // Calculate discount amount
            let discountAmount = 0;
            if (formData.discountValue > 0) {
                if (formData.discountType === 'percentage') {
                    discountAmount = (subtotal * formData.discountValue) / 100;
                } else {
                    discountAmount = formData.discountValue;
                }
            }

            // Calculate tax amount
            let taxAmount = 0;
            let _taxableAmount = subtotal;

            if (formData.taxEnabled && formData.taxRate > 0) {
                if (formData.taxIncluded) {
                    // Tax is included in prices - extract tax amount
                    taxAmount = (subtotal * formData.taxRate) / (100 + formData.taxRate);
                    _taxableAmount = subtotal - taxAmount;
                } else {
                    // Tax is added on top
                    taxAmount = (subtotal * formData.taxRate) / 100;
                }
            }

            const total = formData.taxIncluded
                ? subtotal + (formData.shippingCost || 0) - discountAmount
                : subtotal + (formData.shippingCost || 0) + taxAmount - discountAmount;

            const orderData = {
                ...formData,
                subtotal,
                discountAmount,
                taxAmount,
                total: Math.max(0, total), // Ensure total is not negative
                createdAt: new Date().toISOString(),
                id: `${Math.floor(Date.now() / 1000)}_${Math.floor(Math.random() * (9999 - 1000 + 1))}${1000}`
            };

            // Create customer if new or update existing customer
            if (isNewCustomer) {
                // Check if customer with this email already exists
                const existingCustomer = customers.find((c) => c.email === orderData.customer.email);

                if (existingCustomer) {
                    // Update existing customer with new information
                    const updatedCustomerData = {
                        firstName: orderData.customer.firstName,
                        lastName: orderData.customer.lastName,
                        email: orderData.customer.email,
                        phone: orderData.customer.phone,
                        streetAddress: orderData.customer.streetAddress,
                        apartmentUnit: orderData.customer.apartmentUnit,
                        city: orderData.customer.city,
                        state: orderData.customer.state,
                        zipCode: orderData.customer.zipCode,
                        country: orderData.customer.country,
                        countryIso: orderData.customer.countryIso,
                        // Preserve existing customer data
                        isBusinessCustomer: existingCustomer.isBusinessCustomer || false,
                        businessName: existingCustomer.businessName || '',
                        legalBusinessName: existingCustomer.legalBusinessName || '',
                        tvaNumber: existingCustomer.tvaNumber || '',
                        businessType: existingCustomer.businessType || '',
                        businessAddress: existingCustomer.businessAddress || '',
                        businessPhone: existingCustomer.businessPhone || '',
                        businessEmail: existingCustomer.businessEmail || '',
                        notes: existingCustomer.notes || '',
                        orders: existingCustomer.orders || 0,
                        totalSpent: existingCustomer.totalSpent || 0,
                        lastOrder: existingCustomer.lastOrder,
                        createdAt: existingCustomer.createdAt
                    };

                    const _customerResponse = await update(existingCustomer.id, updatedCustomerData, 'customers');
                    orderData.email = existingCustomer.email;
                } else {
                    // Create new customer
                    const customerData = {
                        firstName: orderData.customer.firstName,
                        lastName: orderData.customer.lastName,
                        email: orderData.customer.email,
                        phone: orderData.customer.phone,
                        streetAddress: orderData.customer.streetAddress,
                        apartmentUnit: orderData.customer.apartmentUnit,
                        city: orderData.customer.city,
                        state: orderData.customer.state,
                        zipCode: orderData.customer.zipCode,
                        country: orderData.customer.country,
                        countryIso: orderData.customer.countryIso,
                        // Add default values for new customers
                        isBusinessCustomer: false,
                        businessName: '',
                        legalBusinessName: '',
                        tvaNumber: '',
                        businessType: '',
                        businessAddress: '',
                        businessPhone: '',
                        businessEmail: '',
                        notes: '',
                        orders: 0,
                        totalSpent: 0,
                        lastOrder: null,
                        createdAt: new Date().toISOString()
                    };

                    const customerResponse = await create(customerData, 'customers');

                    if (!customerResponse.id) {
                        throw new Error('Failed to create customer');
                    }

                    orderData.email = orderData.customer.email;
                }
            } else {
                // Validate that the selected customer exists
                const existingCustomer = customers.find((c) => c.id === selectedCustomerId);
                if (!existingCustomer) {
                    throw new Error('Selected customer not found. Please select a valid customer or create a new one.');
                }
                orderData.email = existingCustomer.email;
            }

            // Create order in database
            const response = await create(orderData, 'orders');

            if (!response.id) {
                throw new Error('Failed to create order');
            }

            // If email notification is enabled, send confirmation
            if (formData.sendEmail) {
                const emailPayload = {
                    type: 'order_confirmation',
                    email: orderData.customer.email,
                    customerName: `${orderData.customer.firstName} ${orderData.customer.lastName}`.trim(),
                    orderId: orderData.id,
                    orderDate: orderData.createdAt,
                    items: orderData.items,
                    subtotal: orderData.subtotal,
                    shippingCost: orderData.shippingCost,
                    discountAmount: orderData.discountAmount,
                    taxEnabled: orderData.taxEnabled,
                    taxRate: orderData.taxRate,
                    taxAmount: orderData.taxAmount,
                    taxIncluded: orderData.taxIncluded,
                    total: orderData.total,
                    shippingAddress: {
                        street: orderData.customer.streetAddress,
                        unit: orderData.customer.apartmentUnit,
                        city: orderData.customer.city,
                        state: orderData.customer.state,
                        zip: orderData.customer.zipCode,
                        country: orderData.customer.country
                    }
                };

                await fetch('/api/email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(emailPayload)
                });
            }

            toast.success('Order created successfully');
            setIsCreateOpen(false);
            setFormData(initialFormData);
            setIsNewCustomer(false);
            setSelectedCustomerId('');

            // Add new order to state instead of full reload
            addOrderToState(response);
        } catch (error) {
            toast.error(error.message || 'Failed to create order');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusChangeRequest = (orderId, newStatus) => {
        const order = allOrders.find((o) => o.id === orderId);
        if (!order) {
            toast.error('Order not found');
            return;
        }

        setStatusChangeData({ orderId, newStatus, order });
        setTrackingNumber(order.tracking || ''); // Pre-fill existing tracking number
        setIsStatusDialogOpen(true);
    };

    const confirmStatusChange = async () => {
        if (!statusChangeData) return;

        try {
            setIsConfirmingStatusChange(true);

            const { orderId, newStatus, order } = statusChangeData;

            // Prepare update data with tracking number if provided
            const updateData = { status: newStatus };
            if (trackingNumber.trim()) {
                updateData.tracking = trackingNumber.trim();
            }

            // Update order status and tracking
            const updateResponse = await update(orderId, updateData, 'orders');

            if (!updateResponse.id) {
                throw new Error('Failed to update order status in database');
            }

            // Send email notification if requested
            if (sendEmailNotification) {
                try {
                    const emailPayload = {
                        type: 'order_status_update',
                        email: order.customer.email,
                        customerName: `${order.customer.firstName} ${order.customer.lastName}`.trim(),
                        orderId: order.id,
                        orderDate: order.createdAt,
                        items: order.items,
                        subtotal: order.subtotal,
                        shippingCost: order.shippingCost,
                        discountAmount: order.discountAmount,
                        taxEnabled: order.taxEnabled,
                        taxRate: order.taxRate,
                        taxAmount: order.taxAmount,
                        taxIncluded: order.taxIncluded,
                        total: order.total,
                        shippingAddress: {
                            street: order.customer.streetAddress,
                            unit: order.customer.apartmentUnit,
                            city: order.customer.city,
                            state: order.customer.state,
                            zip: order.customer.zipCode,
                            country: order.customer.country
                        },
                        status: newStatus === 'shipped' ? 'in_transit' : newStatus,
                        trackingNumber: trackingNumber.trim() || undefined,
                        trackingUrl: trackingNumber.trim() ? generateTrackingUrl(trackingNumber.trim()) : undefined
                    };

                    const emailResponse = await fetch('/api/email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(emailPayload)
                    });

                    if (!emailResponse.ok) {
                        toast.warning('Order updated but email notification failed');
                    } else {
                        toast.success('Order status updated and customer notified');
                    }
                } catch (emailError) {
                    console.log('Email notification error:', emailError);
                    toast.warning('Order updated but email notification failed');
                }
            } else {
                toast.success('Order status updated successfully');
            }

            // Update orders in state and close dialog instead of full reload
            updateOrderInState(statusChangeData.orderId, updateData);
            setIsStatusDialogOpen(false);
            setStatusChangeData(null);
            setTrackingNumber('');
        } catch (error) {
            console.log('Error updating order status:', error);
            toast.error('Failed to update order status');
        } finally {
            setIsConfirmingStatusChange(false);
        }
    };

    const handleGenerateInvoice = async (order) => {
        setIsGeneratingPDF(true);
        try {
            await generatePDF(order, storeSettings);
            toast.success('Invoice PDF generated successfully');
        } catch (error) {
            console.log('Error generating PDF:', error);
            toast.error('Failed to generate invoice');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const openInvoiceDialog = (order) => {
        setSelectedOrderForInvoice(order);
        setIsInvoiceDialogOpen(true);
    };

    const generateTrackingUrl = (trackingNumber) => {
        const tracking = trackingNumber.toUpperCase();

        // Default: Generic tracking search
        return `https://parcelsapp.com/tracking/${encodeURIComponent(tracking)}`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const formatPrice = (amount) => {
        const currency = storeSettings?.currency || 'EUR';
        const locale = currency === 'EUR' ? 'fr-FR' : currency === 'USD' ? 'en-US' : 'en-GB';

        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    const handleDeleteOrder = (order) => {
        setOrderToDelete(order);
        setDeleteConfirmText('');
        setIsDeleteDialogOpen(true);
    };

    const confirmDeleteOrder = async () => {
        if (!orderToDelete || deleteConfirmText !== 'delete') {
            return;
        }

        try {
            setIsDeleting(true);
            const response = await remove(orderToDelete.id, 'orders');

            if (response?.success) {
                toast.success('Order deleted successfully');
                setOrders((prev) => prev.filter((order) => order.id !== orderToDelete.id));
                setAllOrders((prev) => prev.filter((order) => order.id !== orderToDelete.id));
                setIsDeleteDialogOpen(false);
                setOrderToDelete(null);
                setDeleteConfirmText('');
            } else {
                throw new Error('Failed to delete order');
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            toast.error('Failed to delete order');
        } finally {
            setIsDeleting(false);
        }
    };

    const exportToCSV = () => {
        const headers = [
            'Order ID',
            'Customer',
            'Email',
            'Subtotal',
            'Discount',
            'Shipping',
            'Total',
            'Status',
            'Payment',
            'Date'
        ];
        const csvData = filteredOrders.map((order) => [
            order.id,
            `${order.customer.firstName} ${order.customer.lastName}`.trim(),
            order.customer.email,
            order.subtotal || 0,
            order.discountAmount || 0,
            order.shippingCost || 0,
            order.total,
            order.status,
            order.paymentStatus,
            order.createdAt
        ]);

        const csv = [headers, ...csvData].map((row) => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-${new Date().toISOString()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-semibold text-2xl">Orders</h2>
                    <p className="text-muted-foreground">Manage and track your orders</p>
                </div>
            </div>

            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex w-full flex-1 gap-4 sm:w-auto">
                    <div className="relative flex-1">
                        <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search orders..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            {ORDER_STATUS.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={exportToCSV}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Order
                    </Button>
                </div>
            </div>

            {loading ? (
                <TableSkeleton columns={7} rows={5} />
            ) : (
                <ScrollArea className="h-[calc(100vh-250px)]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="cursor-pointer" onClick={() => handleSort('id')}>
                                    <div className="flex items-center">
                                        Order ID
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="hidden cursor-pointer sm:table-cell"
                                    onClick={() => handleSort('customer.name')}>
                                    <div className="flex items-center">
                                        Customer
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </div>
                                </TableHead>
                                <TableHead className="cursor-pointer" onClick={() => handleSort('total')}>
                                    <div className="flex items-center">
                                        Total
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </div>
                                </TableHead>
                                <TableHead className="hidden md:table-cell">Status</TableHead>
                                <TableHead className="hidden lg:table-cell">Payment</TableHead>
                                <TableHead
                                    className="hidden cursor-pointer xl:table-cell"
                                    onClick={() => handleSort('createdAt')}>
                                    <div className="flex items-center">
                                        Created At
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center">
                                        No orders found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span className="truncate font-semibold">{order.id}</span>
                                                <div className="text-muted-foreground text-xs sm:hidden">
                                                    {`${order.customer.firstName} ${order.customer.lastName}`.trim()}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <div>
                                                <div className="truncate font-medium">
                                                    {`${order.customer.firstName} ${order.customer.lastName}`.trim()}
                                                </div>
                                                <div className="truncate text-muted-foreground text-sm">
                                                    {order.customer.email}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-semibold">{formatPrice(order.total)}</span>
                                                <div className="md:hidden">
                                                    <Badge
                                                        variant={
                                                            order.status === 'delivered'
                                                                ? 'default'
                                                                : order.status === 'cancelled'
                                                                  ? 'destructive'
                                                                  : order.status === 'shipped'
                                                                    ? 'secondary'
                                                                    : order.status === 'processing'
                                                                      ? 'outline'
                                                                      : 'outline'
                                                        }>
                                                        {ORDER_STATUS.find((s) => s.value === order.status)?.label}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <Select
                                                value={order.status}
                                                onValueChange={(value) => handleStatusChangeRequest(order.id, value)}>
                                                <SelectTrigger
                                                    className={`h-8 ${
                                                        order.status === 'delivered'
                                                            ? 'bg-green-100 text-green-800'
                                                            : order.status === 'cancelled'
                                                              ? 'bg-red-100 text-red-800'
                                                              : order.status === 'shipped'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : order.status === 'processing'
                                                                  ? 'bg-yellow-100 text-yellow-800'
                                                                  : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    <SelectValue>
                                                        {ORDER_STATUS.find((s) => s.value === order.status)?.label}
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ORDER_STATUS.map((status) => (
                                                        <SelectItem key={status.value} value={status.value}>
                                                            {status.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            <Badge
                                                variant={
                                                    order.paymentStatus === 'paid'
                                                        ? 'default'
                                                        : order.paymentStatus === 'failed'
                                                          ? 'destructive'
                                                          : order.paymentStatus === 'refunded'
                                                            ? 'secondary'
                                                            : 'outline'
                                                }>
                                                {order.paymentStatus.charAt(0).toUpperCase() +
                                                    order.paymentStatus.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden text-muted-foreground text-sm xl:table-cell">
                                            {formatDate(order.createdAt)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {/* Desktop Actions */}
                                            <div className="hidden justify-end gap-1 md:flex">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => openInvoiceDialog(order)}>
                                                    <FileText className="h-4 w-4" />
                                                </Button>
                                                <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => {
                                                                setSelectedOrder(order);
                                                                setIsDetailsOpen(true);
                                                            }}>
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                                                        <DialogHeader>
                                                            <DialogTitle className="font-bold text-xl">
                                                                Order Details #{selectedOrder?.id}
                                                            </DialogTitle>
                                                        </DialogHeader>
                                                        {selectedOrder && (
                                                            <Tabs defaultValue="customer" className="w-full">
                                                                <TabsList className="grid w-full grid-cols-4">
                                                                    <TabsTrigger
                                                                        value="customer"
                                                                        className="flex items-center gap-2">
                                                                        <User className="h-4 w-4" />
                                                                        Customer
                                                                    </TabsTrigger>
                                                                    <TabsTrigger
                                                                        value="shipping"
                                                                        className="flex items-center gap-2">
                                                                        <Truck className="h-4 w-4" />
                                                                        Shipping
                                                                    </TabsTrigger>
                                                                    <TabsTrigger
                                                                        value="payment"
                                                                        className="flex items-center gap-2">
                                                                        <CreditCard className="h-4 w-4" />
                                                                        Payment
                                                                    </TabsTrigger>
                                                                    <TabsTrigger
                                                                        value="status"
                                                                        className="flex items-center gap-2">
                                                                        <Info className="h-4 w-4" />
                                                                        Status
                                                                    </TabsTrigger>
                                                                </TabsList>

                                                                <TabsContent
                                                                    value="customer"
                                                                    className="mt-4 space-y-4">
                                                                    <Card>
                                                                        <CardHeader>
                                                                            <h3 className="font-semibold">
                                                                                Customer Information
                                                                            </h3>
                                                                        </CardHeader>
                                                                        <CardContent className="grid gap-3">
                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                <div>
                                                                                    <label className="font-medium text-gray-500 text-sm">
                                                                                        Name
                                                                                    </label>
                                                                                    <p className="text-sm">
                                                                                        {`${selectedOrder.customer.firstName} ${selectedOrder.customer.lastName}`.trim()}
                                                                                    </p>
                                                                                </div>
                                                                                <div>
                                                                                    <label className="font-medium text-gray-500 text-sm">
                                                                                        Email
                                                                                    </label>
                                                                                    <p className="text-sm">
                                                                                        {selectedOrder.customer.email}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                            {selectedOrder.customer.phone && (
                                                                                <div>
                                                                                    <label className="font-medium text-gray-500 text-sm">
                                                                                        Phone
                                                                                    </label>
                                                                                    <p className="text-sm">
                                                                                        {selectedOrder.customer.phone}
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                        </CardContent>
                                                                    </Card>
                                                                </TabsContent>

                                                                <TabsContent
                                                                    value="shipping"
                                                                    className="mt-4 space-y-4">
                                                                    <Card>
                                                                        <CardHeader>
                                                                            <h3 className="font-semibold">
                                                                                Shipping Address
                                                                            </h3>
                                                                        </CardHeader>
                                                                        <CardContent className="space-y-2">
                                                                            <p className="text-sm">
                                                                                {selectedOrder.customer.streetAddress}
                                                                            </p>
                                                                            {selectedOrder.customer.apartmentUnit && (
                                                                                <p className="text-sm">
                                                                                    {
                                                                                        selectedOrder.customer
                                                                                            .apartmentUnit
                                                                                    }
                                                                                </p>
                                                                            )}
                                                                            <p className="text-sm">
                                                                                {selectedOrder.customer.city},{' '}
                                                                                {selectedOrder.customer.state}{' '}
                                                                                {selectedOrder.customer.zipCode}
                                                                            </p>
                                                                            <p className="font-medium text-sm">
                                                                                {selectedOrder.customer.country}
                                                                            </p>
                                                                            {selectedOrder.deliveryNotes && (
                                                                                <div className="mt-3 border-t pt-3">
                                                                                    <label className="font-medium text-gray-500 text-sm">
                                                                                        Delivery Notes
                                                                                    </label>
                                                                                    <p className="text-sm">
                                                                                        {selectedOrder.deliveryNotes}
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                        </CardContent>
                                                                    </Card>

                                                                    <Card>
                                                                        <CardHeader className="flex flex-row items-center justify-between">
                                                                            <h3 className="font-semibold">
                                                                                Admin Shipping Notes
                                                                            </h3>
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    if (isEditingShippingNotes) {
                                                                                        setIsEditingShippingNotes(
                                                                                            false
                                                                                        );
                                                                                        setTempShippingNotes('');
                                                                                    } else {
                                                                                        setIsEditingShippingNotes(true);
                                                                                        setTempShippingNotes(
                                                                                            selectedOrder.shippingNotes ||
                                                                                                ''
                                                                                        );
                                                                                    }
                                                                                }}>
                                                                                {isEditingShippingNotes
                                                                                    ? 'Cancel'
                                                                                    : 'Edit Notes'}
                                                                            </Button>
                                                                        </CardHeader>
                                                                        <CardContent>
                                                                            {!isEditingShippingNotes ? (
                                                                                <div className="text-sm">
                                                                                    {selectedOrder.shippingNotes ? (
                                                                                        <p>
                                                                                            {
                                                                                                selectedOrder.shippingNotes
                                                                                            }
                                                                                        </p>
                                                                                    ) : (
                                                                                        <p className="text-gray-500 italic">
                                                                                            No shipping notes added
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            ) : (
                                                                                <div className="space-y-3">
                                                                                    <textarea
                                                                                        className="w-full resize-none rounded-md border p-3"
                                                                                        rows={4}
                                                                                        placeholder="Add internal shipping notes (visible only to admins)..."
                                                                                        value={tempShippingNotes}
                                                                                        onChange={(e) =>
                                                                                            setTempShippingNotes(
                                                                                                e.target.value
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                    <div className="flex gap-2">
                                                                                        <Button
                                                                                            size="sm"
                                                                                            disabled={
                                                                                                isSavingShippingNotes
                                                                                            }
                                                                                            onClick={async () => {
                                                                                                try {
                                                                                                    setIsSavingShippingNotes(
                                                                                                        true
                                                                                                    );
                                                                                                    const updateData = {
                                                                                                        shippingNotes:
                                                                                                            tempShippingNotes
                                                                                                    };

                                                                                                    const response =
                                                                                                        await update(
                                                                                                            selectedOrder.id,
                                                                                                            updateData,
                                                                                                            'orders'
                                                                                                        );

                                                                                                    if (
                                                                                                        response.success ||
                                                                                                        response
                                                                                                    ) {
                                                                                                        toast.success(
                                                                                                            'Shipping notes updated successfully'
                                                                                                        );

                                                                                                        // Update orders in state instead of full reload
                                                                                                        updateOrderInState(
                                                                                                            selectedOrder.id,
                                                                                                            updateData
                                                                                                        );

                                                                                                        // Exit edit mode
                                                                                                        setIsEditingShippingNotes(
                                                                                                            false
                                                                                                        );
                                                                                                        setTempShippingNotes(
                                                                                                            ''
                                                                                                        );
                                                                                                    } else {
                                                                                                        console.log(
                                                                                                            response
                                                                                                        );
                                                                                                        toast.error(
                                                                                                            'Failed to update shipping notes'
                                                                                                        );
                                                                                                    }
                                                                                                } catch (error) {
                                                                                                    console.error(
                                                                                                        'Error updating shipping notes:',
                                                                                                        error
                                                                                                    );
                                                                                                    toast.error(
                                                                                                        'Failed to update shipping notes'
                                                                                                    );
                                                                                                } finally {
                                                                                                    setIsSavingShippingNotes(
                                                                                                        false
                                                                                                    );
                                                                                                }
                                                                                            }}>
                                                                                            {isSavingShippingNotes ? (
                                                                                                <>
                                                                                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-white border-b-2" />
                                                                                                    Saving...
                                                                                                </>
                                                                                            ) : (
                                                                                                'Save Notes'
                                                                                            )}
                                                                                        </Button>
                                                                                        <Button
                                                                                            variant="outline"
                                                                                            size="sm"
                                                                                            onClick={() => {
                                                                                                setIsEditingShippingNotes(
                                                                                                    false
                                                                                                );
                                                                                                setTempShippingNotes(
                                                                                                    ''
                                                                                                );
                                                                                            }}>
                                                                                            Cancel
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </CardContent>
                                                                    </Card>
                                                                </TabsContent>

                                                                <TabsContent value="payment" className="mt-4 space-y-4">
                                                                    <Card>
                                                                        <CardHeader className="flex flex-row items-center justify-between">
                                                                            <h3 className="font-semibold">
                                                                                Payment Details
                                                                            </h3>
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    if (isEditingPayment) {
                                                                                        setIsEditingPayment(false);
                                                                                        setEditPaymentData({
                                                                                            paymentStatus: '',
                                                                                            paymentMethod: ''
                                                                                        });
                                                                                    } else {
                                                                                        setIsEditingPayment(true);
                                                                                        setEditPaymentData({
                                                                                            paymentStatus:
                                                                                                selectedOrder.paymentStatus ||
                                                                                                'pending',
                                                                                            paymentMethod:
                                                                                                selectedOrder.paymentMethod ||
                                                                                                selectedOrder.method ||
                                                                                                'credit_card'
                                                                                        });
                                                                                    }
                                                                                }}>
                                                                                {isEditingPayment
                                                                                    ? 'Cancel'
                                                                                    : 'Edit Payment'}
                                                                            </Button>
                                                                        </CardHeader>
                                                                        <CardContent className="space-y-4">
                                                                            {!isEditingPayment ? (
                                                                                <div className="grid grid-cols-2 gap-4">
                                                                                    <div>
                                                                                        <label className="font-medium text-gray-500 text-sm">
                                                                                            Payment Method
                                                                                        </label>
                                                                                        <p className="text-sm">
                                                                                            {selectedOrder.paymentMethod ||
                                                                                                selectedOrder.method ||
                                                                                                'Card'}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <label className="font-medium text-gray-500 text-sm">
                                                                                            Payment Status
                                                                                        </label>
                                                                                        <Badge
                                                                                            variant={
                                                                                                selectedOrder.paymentStatus ===
                                                                                                'paid'
                                                                                                    ? 'default'
                                                                                                    : 'outline'
                                                                                            }>
                                                                                            {
                                                                                                selectedOrder.paymentStatus
                                                                                            }
                                                                                        </Badge>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                // Edit Mode
                                                                                <div className="space-y-4">
                                                                                    <div className="grid grid-cols-2 gap-4">
                                                                                        <div>
                                                                                            <Label htmlFor="payment-method">
                                                                                                Payment Method
                                                                                            </Label>
                                                                                            <Select
                                                                                                value={
                                                                                                    editPaymentData.paymentMethod
                                                                                                }
                                                                                                onValueChange={(
                                                                                                    value
                                                                                                ) =>
                                                                                                    setEditPaymentData({
                                                                                                        ...editPaymentData,
                                                                                                        paymentMethod:
                                                                                                            value
                                                                                                    })
                                                                                                }>
                                                                                                <SelectTrigger>
                                                                                                    <SelectValue />
                                                                                                </SelectTrigger>
                                                                                                <SelectContent>
                                                                                                    {PAYMENT_METHODS.map(
                                                                                                        (method) => (
                                                                                                            <SelectItem
                                                                                                                key={
                                                                                                                    method.value
                                                                                                                }
                                                                                                                value={
                                                                                                                    method.value
                                                                                                                }>
                                                                                                                {
                                                                                                                    method.label
                                                                                                                }
                                                                                                            </SelectItem>
                                                                                                        )
                                                                                                    )}
                                                                                                </SelectContent>
                                                                                            </Select>
                                                                                        </div>
                                                                                        <div>
                                                                                            <Label htmlFor="payment-status">
                                                                                                Payment Status
                                                                                            </Label>
                                                                                            <Select
                                                                                                value={
                                                                                                    editPaymentData.paymentStatus
                                                                                                }
                                                                                                onValueChange={(
                                                                                                    value
                                                                                                ) =>
                                                                                                    setEditPaymentData({
                                                                                                        ...editPaymentData,
                                                                                                        paymentStatus:
                                                                                                            value
                                                                                                    })
                                                                                                }>
                                                                                                <SelectTrigger>
                                                                                                    <SelectValue />
                                                                                                </SelectTrigger>
                                                                                                <SelectContent>
                                                                                                    {PAYMENT_STATUS.map(
                                                                                                        (status) => (
                                                                                                            <SelectItem
                                                                                                                key={
                                                                                                                    status.value
                                                                                                                }
                                                                                                                value={
                                                                                                                    status.value
                                                                                                                }>
                                                                                                                {
                                                                                                                    status.label
                                                                                                                }
                                                                                                            </SelectItem>
                                                                                                        )
                                                                                                    )}
                                                                                                </SelectContent>
                                                                                            </Select>
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="flex gap-2 pt-2">
                                                                                        <Button
                                                                                            onClick={async () => {
                                                                                                try {
                                                                                                    setIsSubmitting(
                                                                                                        true
                                                                                                    );

                                                                                                    const updateData = {
                                                                                                        paymentStatus:
                                                                                                            editPaymentData.paymentStatus,
                                                                                                        paymentMethod:
                                                                                                            editPaymentData.paymentMethod
                                                                                                    };

                                                                                                    const updateResponse =
                                                                                                        await update(
                                                                                                            selectedOrder.id,
                                                                                                            updateData,
                                                                                                            'orders'
                                                                                                        );

                                                                                                    if (
                                                                                                        updateResponse
                                                                                                    ) {
                                                                                                        toast.success(
                                                                                                            'Payment details updated successfully'
                                                                                                        );

                                                                                                        // Update orders in state instead of full reload
                                                                                                        updateOrderInState(
                                                                                                            selectedOrder.id,
                                                                                                            updateData
                                                                                                        );

                                                                                                        // Exit edit mode
                                                                                                        setIsEditingPayment(
                                                                                                            false
                                                                                                        );
                                                                                                        setEditPaymentData(
                                                                                                            {
                                                                                                                paymentStatus:
                                                                                                                    '',
                                                                                                                paymentMethod:
                                                                                                                    ''
                                                                                                            }
                                                                                                        );
                                                                                                    } else {
                                                                                                        toast.error(
                                                                                                            'Failed to update payment details'
                                                                                                        );
                                                                                                    }
                                                                                                } catch (error) {
                                                                                                    console.error(
                                                                                                        'Error updating payment:',
                                                                                                        error
                                                                                                    );
                                                                                                    toast.error(
                                                                                                        'Failed to update payment details'
                                                                                                    );
                                                                                                } finally {
                                                                                                    setIsSubmitting(
                                                                                                        false
                                                                                                    );
                                                                                                }
                                                                                            }}
                                                                                            disabled={isSubmitting}>
                                                                                            {isSubmitting ? (
                                                                                                <>
                                                                                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-white border-b-2" />
                                                                                                    Updating...
                                                                                                </>
                                                                                            ) : (
                                                                                                'Update Payment'
                                                                                            )}
                                                                                        </Button>
                                                                                        <Button
                                                                                            variant="outline"
                                                                                            onClick={() => {
                                                                                                setIsEditingPayment(
                                                                                                    false
                                                                                                );
                                                                                                setEditPaymentData({
                                                                                                    paymentStatus: '',
                                                                                                    paymentMethod: ''
                                                                                                });
                                                                                            }}>
                                                                                            Cancel
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {/* Coupon Information */}
                                                                            {selectedOrder.coupon && (
                                                                                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                                                                    <h4 className="mb-2 font-medium text-green-700">
                                                                                        Applied Coupon
                                                                                    </h4>
                                                                                    <div className="grid grid-cols-2 gap-4">
                                                                                        <div>
                                                                                            <label className="font-medium text-gray-500 text-sm">
                                                                                                Code
                                                                                            </label>
                                                                                            <p className="rounded border bg-white px-2 py-1 font-mono text-sm">
                                                                                                {
                                                                                                    selectedOrder.coupon
                                                                                                        .code
                                                                                                }
                                                                                            </p>
                                                                                        </div>
                                                                                        <div>
                                                                                            <label className="font-medium text-gray-500 text-sm">
                                                                                                Discount
                                                                                            </label>
                                                                                            <p className="font-semibold text-green-600 text-sm">
                                                                                                {selectedOrder.coupon
                                                                                                    .type ===
                                                                                                'percentage'
                                                                                                    ? `${selectedOrder.coupon.value}%`
                                                                                                    : `€${selectedOrder.coupon.value}`}{' '}
                                                                                                (€
                                                                                                {selectedOrder.discountAmount?.toFixed(
                                                                                                    2
                                                                                                )}{' '}
                                                                                                saved)
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                    {selectedOrder.coupon.name && (
                                                                                        <div className="mt-2">
                                                                                            <label className="font-medium text-gray-500 text-sm">
                                                                                                Description
                                                                                            </label>
                                                                                            <p className="text-sm">
                                                                                                {
                                                                                                    selectedOrder.coupon
                                                                                                        .name
                                                                                                }
                                                                                            </p>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}

                                                                            {/* Service Appointment Information */}
                                                                            {selectedOrder.isServiceAppointment && (
                                                                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                                                                    <h4 className="mb-2 font-medium text-blue-700">
                                                                                        Service Appointment
                                                                                    </h4>
                                                                                    <div className="grid grid-cols-2 gap-4">
                                                                                        <div>
                                                                                            <label className="font-medium text-gray-500 text-sm">
                                                                                                Appointment ID
                                                                                            </label>
                                                                                            <p className="rounded border bg-white px-2 py-1 font-mono text-sm">
                                                                                                {
                                                                                                    selectedOrder.appointmentId
                                                                                                }
                                                                                            </p>
                                                                                        </div>
                                                                                        <div>
                                                                                            <label className="font-medium text-gray-500 text-sm">
                                                                                                Status
                                                                                            </label>
                                                                                            <Badge
                                                                                                variant={
                                                                                                    selectedOrder.status ===
                                                                                                    'completed'
                                                                                                        ? 'default'
                                                                                                        : 'outline'
                                                                                                }>
                                                                                                {selectedOrder.status}
                                                                                            </Badge>
                                                                                        </div>
                                                                                    </div>
                                                                                    {selectedOrder.items.some(
                                                                                        (item) => item.appointmentDate
                                                                                    ) && (
                                                                                        <div className="mt-2">
                                                                                            <label className="font-medium text-gray-500 text-sm">
                                                                                                Appointment Details
                                                                                            </label>
                                                                                            {selectedOrder.items
                                                                                                .filter(
                                                                                                    (item) =>
                                                                                                        item.appointmentDate
                                                                                                )
                                                                                                .map((item, index) => (
                                                                                                    <div
                                                                                                        key={index}
                                                                                                        className="mt-1 rounded border bg-white p-2 text-sm">
                                                                                                        <p>
                                                                                                            <strong>
                                                                                                                {
                                                                                                                    item.name
                                                                                                                }
                                                                                                            </strong>
                                                                                                        </p>
                                                                                                        <p>
                                                                                                            📅{' '}
                                                                                                            {
                                                                                                                item.appointmentDate
                                                                                                            }{' '}
                                                                                                            at{' '}
                                                                                                            {
                                                                                                                item.appointmentTime
                                                                                                            }
                                                                                                        </p>
                                                                                                    </div>
                                                                                                ))}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}

                                                                            {/* Order Items */}
                                                                            <div className="mt-6">
                                                                                <h4 className="mb-3 font-medium">
                                                                                    Order Items
                                                                                </h4>
                                                                                <Table>
                                                                                    <TableHeader>
                                                                                        <TableRow>
                                                                                            <TableHead>
                                                                                                Product
                                                                                            </TableHead>
                                                                                            <TableHead>Qty</TableHead>
                                                                                            <TableHead>Price</TableHead>
                                                                                            <TableHead className="text-right">
                                                                                                Total
                                                                                            </TableHead>
                                                                                        </TableRow>
                                                                                    </TableHeader>
                                                                                    <TableBody>
                                                                                        {selectedOrder.items.map(
                                                                                            (item, index) => (
                                                                                                <TableRow key={index}>
                                                                                                    <TableCell className="font-medium">
                                                                                                        {item.name}
                                                                                                    </TableCell>
                                                                                                    <TableCell>
                                                                                                        {item.quantity}
                                                                                                    </TableCell>
                                                                                                    <TableCell>
                                                                                                        {formatPrice(
                                                                                                            item.price
                                                                                                        )}
                                                                                                    </TableCell>
                                                                                                    <TableCell className="text-right">
                                                                                                        {formatPrice(
                                                                                                            item.price *
                                                                                                                item.quantity
                                                                                                        )}
                                                                                                    </TableCell>
                                                                                                </TableRow>
                                                                                            )
                                                                                        )}
                                                                                        <TableRow className="border-t-2">
                                                                                            <TableCell
                                                                                                colSpan={2}></TableCell>
                                                                                            <TableCell className="font-semibold">
                                                                                                Subtotal:
                                                                                            </TableCell>
                                                                                            <TableCell className="text-right font-semibold">
                                                                                                {formatPrice(
                                                                                                    selectedOrder.subtotal
                                                                                                )}
                                                                                            </TableCell>
                                                                                        </TableRow>
                                                                                        <TableRow>
                                                                                            <TableCell
                                                                                                colSpan={2}></TableCell>
                                                                                            <TableCell className="font-semibold">
                                                                                                Shipping:
                                                                                            </TableCell>
                                                                                            <TableCell className="text-right font-semibold">
                                                                                                {formatPrice(
                                                                                                    selectedOrder.shippingCost ||
                                                                                                        0
                                                                                                )}
                                                                                            </TableCell>
                                                                                        </TableRow>
                                                                                        {selectedOrder.taxEnabled &&
                                                                                        selectedOrder.taxAmount &&
                                                                                        selectedOrder.taxAmount > 0 ? (
                                                                                            <TableRow>
                                                                                                <TableCell
                                                                                                    colSpan={
                                                                                                        2
                                                                                                    }></TableCell>
                                                                                                <TableCell className="font-semibold">
                                                                                                    Tax (
                                                                                                    {
                                                                                                        selectedOrder.taxRate
                                                                                                    }
                                                                                                    %):
                                                                                                </TableCell>
                                                                                                <TableCell className="text-right font-semibold">
                                                                                                    {formatPrice(
                                                                                                        selectedOrder.taxAmount
                                                                                                    )}
                                                                                                </TableCell>
                                                                                            </TableRow>
                                                                                        ) : null}
                                                                                        {selectedOrder.discountAmount &&
                                                                                        selectedOrder.discountAmount >
                                                                                            0 ? (
                                                                                            <TableRow>
                                                                                                <TableCell
                                                                                                    colSpan={
                                                                                                        2
                                                                                                    }></TableCell>
                                                                                                <TableCell className="font-semibold text-green-600">
                                                                                                    Discount
                                                                                                    {selectedOrder.coupon
                                                                                                        ? ` (${selectedOrder.coupon.code})`
                                                                                                        : ''}
                                                                                                    :
                                                                                                </TableCell>
                                                                                                <TableCell className="text-right font-semibold text-green-600">
                                                                                                    -
                                                                                                    {formatPrice(
                                                                                                        selectedOrder.discountAmount
                                                                                                    )}
                                                                                                </TableCell>
                                                                                            </TableRow>
                                                                                        ) : null}
                                                                                        <TableRow className="border-t">
                                                                                            <TableCell
                                                                                                colSpan={2}></TableCell>
                                                                                            <TableCell className="font-bold">
                                                                                                Total:
                                                                                            </TableCell>
                                                                                            <TableCell className="text-right font-bold text-lg">
                                                                                                {formatPrice(
                                                                                                    selectedOrder.total
                                                                                                )}
                                                                                            </TableCell>
                                                                                        </TableRow>
                                                                                    </TableBody>
                                                                                </Table>
                                                                            </div>
                                                                        </CardContent>
                                                                    </Card>
                                                                </TabsContent>

                                                                <TabsContent value="status" className="mt-4 space-y-4">
                                                                    <Card>
                                                                        <CardHeader className="flex flex-row items-center justify-between">
                                                                            <h3 className="font-semibold">
                                                                                Order Status & Timeline
                                                                            </h3>
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    if (isEditingStatus) {
                                                                                        setIsEditingStatus(false);
                                                                                        setEditStatusData({
                                                                                            status: '',
                                                                                            tracking: '',
                                                                                            sendEmail: true
                                                                                        });
                                                                                    } else {
                                                                                        setIsEditingStatus(true);
                                                                                        setEditStatusData({
                                                                                            status: selectedOrder.status,
                                                                                            tracking:
                                                                                                selectedOrder.tracking ||
                                                                                                '',
                                                                                            sendEmail: true
                                                                                        });
                                                                                    }
                                                                                }}>
                                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                                {isEditingStatus
                                                                                    ? 'Cancel'
                                                                                    : 'Edit Status'}
                                                                            </Button>
                                                                        </CardHeader>
                                                                        <CardContent className="space-y-4">
                                                                            {!isEditingStatus ? (
                                                                                // View Mode
                                                                                <>
                                                                                    <div className="grid grid-cols-2 gap-4">
                                                                                        <div>
                                                                                            <label className="font-medium text-gray-500 text-sm">
                                                                                                Current Status
                                                                                            </label>
                                                                                            <div className="mt-1">
                                                                                                <Badge
                                                                                                    variant={
                                                                                                        selectedOrder.status ===
                                                                                                        'delivered'
                                                                                                            ? 'default'
                                                                                                            : 'outline'
                                                                                                    }>
                                                                                                    {
                                                                                                        ORDER_STATUS.find(
                                                                                                            (s) =>
                                                                                                                s.value ===
                                                                                                                selectedOrder.status
                                                                                                        )?.label
                                                                                                    }
                                                                                                </Badge>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div>
                                                                                            <label className="font-medium text-gray-500 text-sm">
                                                                                                Order Date
                                                                                            </label>
                                                                                            <p className="mt-1 text-sm">
                                                                                                {formatDate(
                                                                                                    selectedOrder.createdAt
                                                                                                )}
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                    {selectedOrder.tracking && (
                                                                                        <div>
                                                                                            <label className="font-medium text-gray-500 text-sm">
                                                                                                Tracking Number
                                                                                            </label>
                                                                                            <div className="mt-1 flex items-center gap-2">
                                                                                                <p className="rounded bg-gray-100 px-2 py-1 font-mono text-sm">
                                                                                                    {
                                                                                                        selectedOrder.tracking
                                                                                                    }
                                                                                                </p>
                                                                                                <Button
                                                                                                    variant="outline"
                                                                                                    size="sm"
                                                                                                    onClick={() => {
                                                                                                        const trackingUrl =
                                                                                                            generateTrackingUrl(
                                                                                                                selectedOrder.tracking
                                                                                                            );
                                                                                                        window.open(
                                                                                                            trackingUrl,
                                                                                                            '_blank'
                                                                                                        );
                                                                                                    }}>
                                                                                                    Track Package
                                                                                                </Button>
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </>
                                                                            ) : (
                                                                                // Edit Mode
                                                                                <div className="space-y-4">
                                                                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                                                        <div>
                                                                                            <label className="font-medium text-gray-700 text-sm">
                                                                                                Order Status
                                                                                            </label>
                                                                                            <Select
                                                                                                value={
                                                                                                    editStatusData.status
                                                                                                }
                                                                                                onValueChange={(
                                                                                                    value
                                                                                                ) =>
                                                                                                    setEditStatusData({
                                                                                                        ...editStatusData,
                                                                                                        status: value
                                                                                                    })
                                                                                                }>
                                                                                                <SelectTrigger className="mt-1">
                                                                                                    <SelectValue placeholder="Select status" />
                                                                                                </SelectTrigger>
                                                                                                <SelectContent>
                                                                                                    {ORDER_STATUS.map(
                                                                                                        (status) => (
                                                                                                            <SelectItem
                                                                                                                key={
                                                                                                                    status.value
                                                                                                                }
                                                                                                                value={
                                                                                                                    status.value
                                                                                                                }>
                                                                                                                {
                                                                                                                    status.label
                                                                                                                }
                                                                                                            </SelectItem>
                                                                                                        )
                                                                                                    )}
                                                                                                </SelectContent>
                                                                                            </Select>
                                                                                        </div>
                                                                                        <div>
                                                                                            <label className="font-medium text-gray-700 text-sm">
                                                                                                Tracking Number
                                                                                            </label>
                                                                                            <Input
                                                                                                placeholder="Enter tracking number (optional)"
                                                                                                value={
                                                                                                    editStatusData.tracking
                                                                                                }
                                                                                                onChange={(e) =>
                                                                                                    setEditStatusData({
                                                                                                        ...editStatusData,
                                                                                                        tracking:
                                                                                                            e.target
                                                                                                                .value
                                                                                                    })
                                                                                                }
                                                                                                className="mt-1"
                                                                                            />
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="flex items-center space-x-2">
                                                                                        <Checkbox
                                                                                            id="sendEmailUpdate"
                                                                                            checked={
                                                                                                editStatusData.sendEmail
                                                                                            }
                                                                                            onCheckedChange={(
                                                                                                checked
                                                                                            ) =>
                                                                                                setEditStatusData({
                                                                                                    ...editStatusData,
                                                                                                    sendEmail: checked
                                                                                                })
                                                                                            }
                                                                                        />
                                                                                        <label
                                                                                            htmlFor="sendEmailUpdate"
                                                                                            className="font-medium text-sm">
                                                                                            Send email notification to
                                                                                            customer
                                                                                            {editStatusData.tracking &&
                                                                                                editStatusData.sendEmail && (
                                                                                                    <span className="block text-gray-500 text-xs">
                                                                                                        (will include
                                                                                                        tracking
                                                                                                        information)
                                                                                                    </span>
                                                                                                )}
                                                                                        </label>
                                                                                    </div>

                                                                                    <div className="flex gap-2 pt-2">
                                                                                        <Button
                                                                                            onClick={async () => {
                                                                                                try {
                                                                                                    setIsUpdatingStatus(
                                                                                                        true
                                                                                                    );

                                                                                                    // Update order with new status and tracking
                                                                                                    const updateData = {
                                                                                                        status: editStatusData.status
                                                                                                    };
                                                                                                    if (
                                                                                                        editStatusData.tracking.trim()
                                                                                                    ) {
                                                                                                        updateData.tracking =
                                                                                                            editStatusData.tracking.trim();
                                                                                                    }

                                                                                                    const updateResponse =
                                                                                                        await update(
                                                                                                            selectedOrder.id,
                                                                                                            updateData,
                                                                                                            'orders'
                                                                                                        );

                                                                                                    if (
                                                                                                        updateResponse
                                                                                                    ) {
                                                                                                        // Send email notification if requested
                                                                                                        if (
                                                                                                            editStatusData.sendEmail
                                                                                                        ) {
                                                                                                            const emailPayload =
                                                                                                                {
                                                                                                                    type: 'order_status_update',
                                                                                                                    email: selectedOrder
                                                                                                                        .customer
                                                                                                                        .email,
                                                                                                                    customerName:
                                                                                                                        `${selectedOrder.customer.firstName} ${selectedOrder.customer.lastName}`.trim(),
                                                                                                                    orderId:
                                                                                                                        selectedOrder.id,
                                                                                                                    orderDate:
                                                                                                                        selectedOrder.createdAt,
                                                                                                                    items: selectedOrder.items,
                                                                                                                    subtotal:
                                                                                                                        selectedOrder.subtotal,
                                                                                                                    shippingCost:
                                                                                                                        selectedOrder.shippingCost,
                                                                                                                    total: selectedOrder.total,
                                                                                                                    shippingAddress:
                                                                                                                        {
                                                                                                                            street: selectedOrder
                                                                                                                                .customer
                                                                                                                                .streetAddress,
                                                                                                                            unit: selectedOrder
                                                                                                                                .customer
                                                                                                                                .apartmentUnit,
                                                                                                                            city: selectedOrder
                                                                                                                                .customer
                                                                                                                                .city,
                                                                                                                            state: selectedOrder
                                                                                                                                .customer
                                                                                                                                .state,
                                                                                                                            zip: selectedOrder
                                                                                                                                .customer
                                                                                                                                .zipCode,
                                                                                                                            country:
                                                                                                                                selectedOrder
                                                                                                                                    .customer
                                                                                                                                    .country
                                                                                                                        },
                                                                                                                    status:
                                                                                                                        editStatusData.status ===
                                                                                                                        'shipped'
                                                                                                                            ? 'in_transit'
                                                                                                                            : editStatusData.status,
                                                                                                                    trackingNumber:
                                                                                                                        editStatusData.tracking.trim() ||
                                                                                                                        undefined,
                                                                                                                    trackingUrl:
                                                                                                                        editStatusData.tracking.trim()
                                                                                                                            ? generateTrackingUrl(
                                                                                                                                  editStatusData.tracking.trim()
                                                                                                                              )
                                                                                                                            : undefined
                                                                                                                };

                                                                                                            await fetch(
                                                                                                                '/api/email',
                                                                                                                {
                                                                                                                    method: 'POST',
                                                                                                                    headers:
                                                                                                                        {
                                                                                                                            'Content-Type':
                                                                                                                                'application/json'
                                                                                                                        },
                                                                                                                    body: JSON.stringify(
                                                                                                                        emailPayload
                                                                                                                    )
                                                                                                                }
                                                                                                            );

                                                                                                            toast.success(
                                                                                                                'Order status updated and customer notified'
                                                                                                            );
                                                                                                        } else {
                                                                                                            toast.success(
                                                                                                                'Order status updated successfully'
                                                                                                            );
                                                                                                        }

                                                                                                        // Update orders in state instead of full reload
                                                                                                        updateOrderInState(
                                                                                                            selectedOrder.id,
                                                                                                            updateData
                                                                                                        );

                                                                                                        // Exit edit mode
                                                                                                        setIsEditingStatus(
                                                                                                            false
                                                                                                        );
                                                                                                        setEditStatusData(
                                                                                                            {
                                                                                                                status: '',
                                                                                                                tracking:
                                                                                                                    '',
                                                                                                                sendEmail: true
                                                                                                            }
                                                                                                        );
                                                                                                    } else {
                                                                                                        toast.error(
                                                                                                            'Failed to update order status'
                                                                                                        );
                                                                                                    }
                                                                                                } catch (error) {
                                                                                                    console.error(
                                                                                                        'Error updating status:',
                                                                                                        error
                                                                                                    );
                                                                                                    toast.error(
                                                                                                        'Failed to update order status'
                                                                                                    );
                                                                                                } finally {
                                                                                                    setIsUpdatingStatus(
                                                                                                        false
                                                                                                    );
                                                                                                }
                                                                                            }}
                                                                                            disabled={
                                                                                                !editStatusData.status ||
                                                                                                isUpdatingStatus
                                                                                            }>
                                                                                            {isUpdatingStatus ? (
                                                                                                <>
                                                                                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-white border-b-2" />
                                                                                                    Updating...
                                                                                                </>
                                                                                            ) : (
                                                                                                'Update Status'
                                                                                            )}
                                                                                        </Button>
                                                                                        <Button
                                                                                            variant="outline"
                                                                                            onClick={() => {
                                                                                                setIsEditingStatus(
                                                                                                    false
                                                                                                );
                                                                                                setEditStatusData({
                                                                                                    status: '',
                                                                                                    tracking: '',
                                                                                                    sendEmail: true
                                                                                                });
                                                                                            }}>
                                                                                            Cancel
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </CardContent>
                                                                    </Card>
                                                                </TabsContent>
                                                            </Tabs>
                                                        )}
                                                    </DialogContent>
                                                </Dialog>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => handleDeleteOrder(order)}
                                                    className="text-red-600 hover:bg-red-50 hover:text-red-700">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            {/* Mobile Actions Dropdown */}
                                            <div className="md:hidden">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openInvoiceDialog(order)}>
                                                            <FileText className="mr-2 h-4 w-4" />
                                                            Invoice
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedOrder(order);
                                                                setIsDetailsOpen(true);
                                                            }}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Order
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteOrder(order)}
                                                            className="text-red-600 focus:text-red-600">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete Order
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            )}

            {/* Create Order Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create New Order</DialogTitle>
                        <DialogDescription>
                            Create a new order manually and optionally send an email notification to the customer.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                            <Select
                                value={isNewCustomer ? 'new' : selectedCustomerId}
                                onValueChange={(value) => {
                                    if (value === 'new') {
                                        setIsNewCustomer(true);
                                        setSelectedCustomerId('');
                                        setFormData({ ...initialFormData });
                                    } else {
                                        setIsNewCustomer(false);
                                        setSelectedCustomerId(value);
                                        const customer = customers.find((c) => c.id === value);
                                        if (customer) {
                                            setFormData({
                                                ...formData,
                                                customer: {
                                                    firstName: customer.firstName || '',
                                                    lastName: customer.lastName || '',
                                                    email: customer.email || '',
                                                    phone: customer.phone || '',
                                                    streetAddress: customer.streetAddress || '',
                                                    apartmentUnit: customer.apartmentUnit || '',
                                                    city: customer.city || '',
                                                    state: customer.state || '',
                                                    zipCode: customer.zipCode || '',
                                                    country: customer.country || 'FR',
                                                    countryIso: customer.countryIso || 'FR'
                                                }
                                            });
                                        } else {
                                            console.warn('Customer not found:', value);
                                            toast.error('Selected customer not found. Please try again.');
                                        }
                                    }
                                }}>
                                <SelectTrigger className="w-full md:w-[350px]">
                                    <SelectValue placeholder="Select existing customer or create new" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="new">Create New Customer</SelectItem>
                                    {customers.map((customer) => {
                                        const name =
                                            `${customer.firstName || ''} ${customer.lastName || ''}`.trim() ||
                                            customer.name ||
                                            'Unnamed Customer';
                                        return (
                                            <SelectItem key={customer.id} value={customer.id}>
                                                {name} - {customer.email}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <h3 className="mb-4 font-semibold text-sm">Customer Information</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <label htmlFor="firstName">First Name</label>
                                            <Input
                                                id="firstName"
                                                value={formData.customer.firstName}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        customer: {
                                                            ...formData.customer,
                                                            firstName: e.target.value
                                                        }
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="lastName">Last Name</label>
                                            <Input
                                                id="lastName"
                                                value={formData.customer.lastName}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        customer: {
                                                            ...formData.customer,
                                                            lastName: e.target.value
                                                        }
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="email">Email</label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.customer.email}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    customer: {
                                                        ...formData.customer,
                                                        email: e.target.value
                                                    }
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="phone">Phone</label>
                                        <PhoneInput
                                            id="phone"
                                            value={formData.customer.phone}
                                            onChange={(value) =>
                                                setFormData({
                                                    ...formData,
                                                    customer: {
                                                        ...formData.customer,
                                                        phone: value || ''
                                                    }
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="mb-4 font-semibold text-sm">Shipping Address</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label htmlFor="street">Street Address</label>
                                        <Input
                                            id="street"
                                            value={formData.customer.streetAddress}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    customer: {
                                                        ...formData.customer,
                                                        streetAddress: e.target.value
                                                    }
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="apartment">Apartment/Unit</label>
                                        <Input
                                            id="apartment"
                                            value={formData.customer.apartmentUnit}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    customer: {
                                                        ...formData.customer,
                                                        apartmentUnit: e.target.value
                                                    }
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <label htmlFor="city">City</label>
                                            <Input
                                                id="city"
                                                value={formData.customer.city}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        customer: {
                                                            ...formData.customer,
                                                            city: e.target.value
                                                        }
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="state">State</label>
                                            <Input
                                                id="state"
                                                value={formData.customer.state}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        customer: {
                                                            ...formData.customer,
                                                            state: e.target.value
                                                        }
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <label htmlFor="zipCode">ZIP Code</label>
                                            <Input
                                                id="zipCode"
                                                value={formData.customer.zipCode}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        customer: {
                                                            ...formData.customer,
                                                            zipCode: e.target.value
                                                        }
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="country">Country</label>
                                            <CountryDropdown
                                                id="country"
                                                defaultValue={formData.customer.countryIso || 'FR'}
                                                onChange={(country) =>
                                                    setFormData({
                                                        ...formData,
                                                        customer: {
                                                            ...formData.customer,
                                                            country: country.name,
                                                            countryIso: country.alpha2
                                                        }
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-4 font-semibold text-sm">Order Details</h3>
                            <div className="mb-4">
                                <Select
                                    onValueChange={(value) => {
                                        if (value === 'custom') return;
                                        const item = catalog.find((i) => i.id === value);
                                        if (item) {
                                            setFormData({
                                                ...formData,
                                                items: [
                                                    ...formData.items,
                                                    {
                                                        id: item.id,
                                                        name: item.name,
                                                        quantity: 1,
                                                        price: item.price,
                                                        type: 'catalog'
                                                    }
                                                ]
                                            });
                                        }
                                    }}>
                                    <SelectTrigger className="w-full md:w-[350px]">
                                        <SelectValue placeholder="Add item from catalog" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="custom">Add Custom Item</SelectItem>
                                        {catalog.map((item) => (
                                            <SelectItem key={item.id} value={item.id}>
                                                {item.name} - {formatPrice(item.price)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {formData.items.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                {item.type === 'catalog' ? (
                                                    <div className="font-medium">{item.name}</div>
                                                ) : (
                                                    <Input
                                                        value={item.name}
                                                        onChange={(e) => {
                                                            const newItems = [...formData.items];
                                                            newItems[index] = {
                                                                ...newItems[index],
                                                                name: e.target.value
                                                            };
                                                            setFormData({ ...formData, items: newItems });
                                                        }}
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const newItems = [...formData.items];
                                                        newItems[index] = {
                                                            ...newItems[index],
                                                            quantity: parseInt(e.target.value, 10)
                                                        };
                                                        setFormData({ ...formData, items: newItems });
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.price}
                                                    disabled={item.type === 'catalog'}
                                                    onChange={(e) => {
                                                        const newItems = [...formData.items];
                                                        newItems[index] = {
                                                            ...newItems[index],
                                                            price: parseFloat(e.target.value)
                                                        };
                                                        setFormData({ ...formData, items: newItems });
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>{formatPrice(item.price * item.quantity)}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        const newItems = formData.items.filter((_, i) => i !== index);
                                                        setFormData({ ...formData, items: newItems });
                                                    }}>
                                                    Remove
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Button
                                variant="outline"
                                className="mt-2"
                                onClick={() => {
                                    setFormData({
                                        ...formData,
                                        items: [...formData.items, { name: '', quantity: 1, price: 0, type: 'custom' }]
                                    });
                                }}>
                                Add Custom Item
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <div className="space-y-4">
                                <div>
                                    <label className="font-medium text-sm">Order Status</label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) => setFormData({ ...formData, status: value })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ORDER_STATUS.map((status) => (
                                                <SelectItem key={status.value} value={status.value}>
                                                    {status.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="font-medium text-sm">Payment Method</label>
                                    <Select
                                        value={formData.paymentMethod}
                                        onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select payment method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PAYMENT_METHODS.map((method) => (
                                                <SelectItem key={method.value} value={method.value}>
                                                    {method.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="font-medium text-sm">Shipping Cost</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.shippingCost}
                                        onChange={(e) =>
                                            setFormData({ ...formData, shippingCost: parseFloat(e.target.value) })
                                        }
                                    />
                                </div>

                                <div>
                                    <label className="font-medium text-sm">Discount</label>
                                    <div className="flex gap-2">
                                        <Select
                                            value={formData.discountType}
                                            onValueChange={(value) =>
                                                setFormData({ ...formData, discountType: value })
                                            }>
                                            <SelectTrigger className="w-[120px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="fixed">Fixed</SelectItem>
                                                <SelectItem value="percentage">%</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            type="number"
                                            min="0"
                                            step={formData.discountType === 'percentage' ? '1' : '0.01'}
                                            max={formData.discountType === 'percentage' ? '100' : undefined}
                                            value={formData.discountValue}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    discountValue: parseFloat(e.target.value) || 0
                                                })
                                            }
                                            placeholder={formData.discountType === 'percentage' ? '0-100' : '0.00'}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-3 flex items-center space-x-2">
                                        <Checkbox
                                            id="taxEnabled"
                                            checked={formData.taxEnabled}
                                            onCheckedChange={(checked) =>
                                                setFormData({ ...formData, taxEnabled: checked })
                                            }
                                        />
                                        <label htmlFor="taxEnabled" className="font-medium text-sm">
                                            Apply Tax
                                        </label>
                                    </div>

                                    {formData.taxEnabled && (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="font-medium text-sm">Tax Rate (%)</label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    value={formData.taxRate}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            taxRate: parseFloat(e.target.value) || 0
                                                        })
                                                    }
                                                    placeholder="20.00"
                                                />
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="taxIncluded"
                                                    checked={formData.taxIncluded}
                                                    onCheckedChange={(checked) =>
                                                        setFormData({ ...formData, taxIncluded: checked })
                                                    }
                                                />
                                                <label htmlFor="taxIncluded" className="text-sm">
                                                    Tax included in item prices
                                                </label>
                                            </div>

                                            <div className="text-muted-foreground text-xs">
                                                {formData.taxIncluded
                                                    ? 'Tax amount will be extracted from item prices'
                                                    : 'Tax will be added on top of subtotal'}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-6">
                                    {(() => {
                                        const subtotal = formData.items.reduce(
                                            (sum, item) => sum + item.price * item.quantity,
                                            0
                                        );

                                        // Calculate discount
                                        let discountAmount = 0;
                                        if (formData.discountValue > 0) {
                                            if (formData.discountType === 'percentage') {
                                                discountAmount = (subtotal * formData.discountValue) / 100;
                                            } else {
                                                discountAmount = formData.discountValue;
                                            }
                                        }

                                        // Calculate tax
                                        let taxAmount = 0;
                                        let displaySubtotal = subtotal;

                                        if (formData.taxEnabled && formData.taxRate > 0) {
                                            if (formData.taxIncluded) {
                                                // Tax is included - extract tax amount
                                                taxAmount = (subtotal * formData.taxRate) / (100 + formData.taxRate);
                                                displaySubtotal = subtotal - taxAmount;
                                            } else {
                                                // Tax is added on top
                                                taxAmount = (subtotal * formData.taxRate) / 100;
                                            }
                                        }

                                        const total = formData.taxIncluded
                                            ? subtotal + (formData.shippingCost || 0) - discountAmount
                                            : subtotal + (formData.shippingCost || 0) + taxAmount - discountAmount;

                                        return (
                                            <>
                                                <div className="flex justify-between text-sm">
                                                    <span>
                                                        {formData.taxEnabled && formData.taxIncluded
                                                            ? 'Subtotal (excl. tax):'
                                                            : 'Subtotal:'}
                                                    </span>
                                                    <span>
                                                        {formatPrice(
                                                            formData.taxEnabled && formData.taxIncluded
                                                                ? displaySubtotal
                                                                : subtotal
                                                        )}
                                                    </span>
                                                </div>

                                                {formData.taxEnabled && taxAmount > 0 && (
                                                    <div className="flex justify-between text-sm">
                                                        <span>Tax ({formData.taxRate}%):</span>
                                                        <span>{formatPrice(taxAmount)}</span>
                                                    </div>
                                                )}

                                                <div className="flex justify-between text-sm">
                                                    <span>Shipping:</span>
                                                    <span>{formatPrice(formData.shippingCost || 0)}</span>
                                                </div>

                                                {discountAmount > 0 && (
                                                    <div className="flex justify-between text-green-600 text-sm">
                                                        <span>
                                                            Discount (
                                                            {formData.discountType === 'percentage'
                                                                ? `${formData.discountValue}%`
                                                                : 'Fixed'}
                                                            ):
                                                        </span>
                                                        <span>-{formatPrice(discountAmount)}</span>
                                                    </div>
                                                )}

                                                <div className="mt-2 flex justify-between border-t pt-2 font-bold">
                                                    <span>Total:</span>
                                                    <span>{formatPrice(Math.max(0, total))}</span>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="sendEmail"
                                checked={formData.sendEmail}
                                onCheckedChange={(checked) => setFormData({ ...formData, sendEmail: checked })}
                            />
                            <label
                                htmlFor="sendEmail"
                                className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Send order confirmation email to customer
                            </label>
                        </div>

                        <div className="flex flex-col justify-end gap-3 sm:flex-row">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsCreateOpen(false);
                                    setFormData(initialFormData);
                                    setIsNewCustomer(false);
                                    setSelectedCustomerId('');
                                }}
                                disabled={isSubmitting}
                                className="w-full sm:w-auto">
                                Cancel
                            </Button>
                            <Button onClick={handleCreateOrder} disabled={isSubmitting} className="w-full sm:w-auto">
                                {isSubmitting ? (
                                    <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-white border-b-2" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Order'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Status Change Confirmation Dialog */}
            <Dialog
                open={isStatusDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsStatusDialogOpen(false);
                        setStatusChangeData(null);
                        setTrackingNumber('');
                    }
                }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirm Status Change</DialogTitle>
                        <DialogDescription>
                            {statusChangeData
                                ? `Are you sure you want to change order ${statusChangeData.orderId} status to "${ORDER_STATUS.find((s) => s.value === statusChangeData.newStatus)?.label}"?`
                                : ''}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Tracking Number Input */}
                        <div className="space-y-2">
                            <label htmlFor="trackingNumber" className="font-medium text-sm">
                                Tracking Number <span className="text-gray-400">(optional)</span>
                            </label>
                            <Input
                                id="trackingNumber"
                                placeholder="Enter tracking number..."
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                className="w-full"
                            />
                            {statusChangeData?.newStatus === 'shipped' && (
                                <p className="text-gray-500 text-xs">
                                    💡 Adding a tracking number is recommended when marking orders as shipped
                                </p>
                            )}
                        </div>

                        {/* Email Notification Checkbox */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="sendEmailStatus"
                                checked={sendEmailNotification}
                                onCheckedChange={setSendEmailNotification}
                            />
                            <label htmlFor="sendEmailStatus" className="font-medium text-sm">
                                Send email notification to customer
                                {trackingNumber.trim() && sendEmailNotification && (
                                    <span className="block text-gray-500 text-xs">(will include tracking number)</span>
                                )}
                            </label>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsStatusDialogOpen(false);
                                    setStatusChangeData(null);
                                    setTrackingNumber('');
                                }}
                                disabled={isConfirmingStatusChange}>
                                Cancel
                            </Button>
                            <Button onClick={confirmStatusChange} disabled={isConfirmingStatusChange}>
                                {isConfirmingStatusChange ? (
                                    <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-white border-b-2" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Status'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Invoice Preview Dialog */}
            <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Invoice Preview - Order #{selectedOrderForInvoice?.id}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedOrderForInvoice && (
                        <div className="space-y-6">
                            {/* Invoice Preview Area */}
                            <div className="rounded-lg border bg-white p-8 shadow-sm">
                                {/* Invoice Header */}
                                <div className="mb-8 flex items-start justify-between">
                                    <div>
                                        <h1 className="font-bold text-3xl text-gray-900">INVOICE</h1>
                                        <p className="mt-1 text-gray-600 text-sm">
                                            Order #{selectedOrderForInvoice.id}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        {storeSettings && (
                                            <div>
                                                <h2 className="font-semibold text-lg">
                                                    {storeSettings.businessName || 'Your Business'}
                                                </h2>
                                                {storeSettings.businessAddress && (
                                                    <p className="text-gray-600 text-sm">
                                                        {storeSettings.businessAddress}
                                                    </p>
                                                )}
                                                {storeSettings.businessEmail && (
                                                    <p className="text-gray-600 text-sm">
                                                        {storeSettings.businessEmail}
                                                    </p>
                                                )}
                                                {storeSettings.businessPhone && (
                                                    <p className="text-gray-600 text-sm">
                                                        {storeSettings.businessPhone}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Invoice Details */}
                                <div className="mb-8 grid grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="mb-2 font-semibold text-gray-900">Bill To:</h3>
                                        <div className="text-gray-600 text-sm">
                                            <p className="font-medium">
                                                {`${selectedOrderForInvoice.customer.firstName} ${selectedOrderForInvoice.customer.lastName}`.trim()}
                                            </p>
                                            <p>{selectedOrderForInvoice.customer.email}</p>
                                            {selectedOrderForInvoice.customer.phone && (
                                                <p>{selectedOrderForInvoice.customer.phone}</p>
                                            )}
                                            <div className="mt-2">
                                                <p>{selectedOrderForInvoice.customer.streetAddress}</p>
                                                {selectedOrderForInvoice.customer.apartmentUnit && (
                                                    <p>{selectedOrderForInvoice.customer.apartmentUnit}</p>
                                                )}
                                                <p>
                                                    {selectedOrderForInvoice.customer.city},{' '}
                                                    {selectedOrderForInvoice.customer.state}{' '}
                                                    {selectedOrderForInvoice.customer.zipCode}
                                                </p>
                                                <p>{selectedOrderForInvoice.customer.country}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="mb-2 font-semibold text-gray-900">Invoice Details:</h3>
                                        <div className="space-y-1 text-gray-600 text-sm">
                                            <div className="flex justify-between">
                                                <span>Invoice Date:</span>
                                                <span>
                                                    {new Date(selectedOrderForInvoice.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Payment Method:</span>
                                                <span>{selectedOrderForInvoice.paymentMethod || 'Card'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Status:</span>
                                                <Badge
                                                    variant={
                                                        selectedOrderForInvoice.status === 'delivered'
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    className="ml-2">
                                                    {
                                                        ORDER_STATUS.find(
                                                            (s) => s.value === selectedOrderForInvoice.status
                                                        )?.label
                                                    }
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Invoice Items Table */}
                                <div className="mb-8">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-gray-200 border-b">
                                                <th className="py-2 text-left font-semibold text-gray-900">
                                                    Description
                                                </th>
                                                <th className="py-2 text-center font-semibold text-gray-900">Qty</th>
                                                <th className="py-2 text-right font-semibold text-gray-900">Price</th>
                                                <th className="py-2 text-right font-semibold text-gray-900">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrderForInvoice.items.map((item, index) => (
                                                <tr key={index} className="border-gray-100 border-b">
                                                    <td className="py-3 text-gray-900">{item.name}</td>
                                                    <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                                                    <td className="py-3 text-right text-gray-600">
                                                        {formatPrice(item.price)}
                                                    </td>
                                                    <td className="py-3 text-right font-medium text-gray-900">
                                                        {formatPrice(item.price * item.quantity)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-gray-200 border-t">
                                                <td colSpan="3" className="py-2 text-right font-semibold text-gray-900">
                                                    Subtotal:
                                                </td>
                                                <td className="py-2 text-right font-semibold text-gray-900">
                                                    {formatPrice(selectedOrderForInvoice.subtotal)}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colSpan="3" className="py-2 text-right font-semibold text-gray-900">
                                                    Shipping:
                                                </td>
                                                <td className="py-2 text-right font-semibold text-gray-900">
                                                    {formatPrice(selectedOrderForInvoice.shippingCost || 0)}
                                                </td>
                                            </tr>
                                            {selectedOrderForInvoice.taxEnabled &&
                                            selectedOrderForInvoice.taxAmount &&
                                            selectedOrderForInvoice.taxAmount > 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan="3"
                                                        className="py-2 text-right font-semibold text-gray-900">
                                                        Tax ({selectedOrderForInvoice.taxRate}%):
                                                    </td>
                                                    <td className="py-2 text-right font-semibold text-gray-900">
                                                        {formatPrice(selectedOrderForInvoice.taxAmount)}
                                                    </td>
                                                </tr>
                                            ) : null}
                                            {selectedOrderForInvoice.discountAmount &&
                                            selectedOrderForInvoice.discountAmount > 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan="3"
                                                        className="py-2 text-right font-semibold text-green-600">
                                                        Discount
                                                        {selectedOrderForInvoice.coupon
                                                            ? ` (${selectedOrderForInvoice.coupon.code})`
                                                            : ''}
                                                        :
                                                    </td>
                                                    <td className="py-2 text-right font-semibold text-green-600">
                                                        -{formatPrice(selectedOrderForInvoice.discountAmount)}
                                                    </td>
                                                </tr>
                                            ) : null}
                                            <tr className="border-gray-900 border-t">
                                                <td
                                                    colSpan="3"
                                                    className="py-3 text-right font-bold text-gray-900 text-lg">
                                                    Total:
                                                </td>
                                                <td className="py-3 text-right font-bold text-gray-900 text-lg">
                                                    {formatPrice(selectedOrderForInvoice.total)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* Footer */}
                                <div className="mt-8 border-t pt-4 text-center text-gray-500 text-sm">
                                    <p>Thank you for your business!</p>
                                    {storeSettings?.businessWebsite && (
                                        <p className="mt-1">{storeSettings.businessWebsite}</p>
                                    )}
                                </div>
                            </div>

                            {/* Invoice Actions */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <Button
                                    variant="outline"
                                    onClick={() => handleGenerateInvoice(selectedOrderForInvoice)}
                                    disabled={isGeneratingPDF}
                                    className="w-full">
                                    <Download className="mr-2 h-4 w-4" />
                                    {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        handleGenerateInvoice(selectedOrderForInvoice);
                                        // Print logic would go here - opens PDF and triggers print dialog
                                    }}
                                    disabled={isGeneratingPDF}
                                    className="w-full">
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print Invoice
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={async () => {
                                        try {
                                            const subject = `Invoice for Order #${selectedOrderForInvoice.id}`;
                                            const body = `Dear ${selectedOrderForInvoice.customer.firstName},\n\nPlease find attached your invoice for order #${selectedOrderForInvoice.id}.\n\nThank you for your business!`;

                                            // Generate PDF first, then handle email
                                            await handleGenerateInvoice(selectedOrderForInvoice);

                                            // Create mailto link
                                            const mailtoLink = `mailto:${selectedOrderForInvoice.customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                                            window.open(mailtoLink);

                                            toast.success('Email client opened with invoice details');
                                        } catch (_error) {
                                            toast.error('Failed to prepare email');
                                        }
                                    }}
                                    disabled={isGeneratingPDF}
                                    className="w-full">
                                    <Send className="mr-2 h-4 w-4" />
                                    Email Invoice
                                </Button>
                            </div>

                            {/* Invoice Details Summary */}
                            <div className="border-t pt-4">
                                <h4 className="mb-3 font-medium">Invoice Details</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Customer:</span>
                                        <p className="font-medium">
                                            {`${selectedOrderForInvoice.customer.firstName} ${selectedOrderForInvoice.customer.lastName}`.trim()}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Total Amount:</span>
                                        <p className="font-medium">{formatPrice(selectedOrderForInvoice.total)}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Order Date:</span>
                                        <p className="font-medium">{formatDate(selectedOrderForInvoice.createdAt)}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Status:</span>
                                        <Badge
                                            variant={
                                                selectedOrderForInvoice.status === 'delivered' ? 'default' : 'outline'
                                            }>
                                            {
                                                ORDER_STATUS.find((s) => s.value === selectedOrderForInvoice.status)
                                                    ?.label
                                            }
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Order Confirmation Dialog */}
            <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsDeleteDialogOpen(false);
                        setOrderToDelete(null);
                        setDeleteConfirmText('');
                    }
                }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Order</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete order #{orderToDelete?.id}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="deleteConfirm" className="font-medium text-sm">
                                Type "delete" to confirm deletion:
                            </label>
                            <Input
                                id="deleteConfirm"
                                placeholder="Type 'delete' to confirm"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                disabled={isDeleting}
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsDeleteDialogOpen(false);
                                    setOrderToDelete(null);
                                    setDeleteConfirmText('');
                                }}
                                disabled={isDeleting}>
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={confirmDeleteOrder}
                                disabled={deleteConfirmText !== 'delete' || isDeleting}>
                                {isDeleting ? (
                                    <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-white border-b-2" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete Order'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
