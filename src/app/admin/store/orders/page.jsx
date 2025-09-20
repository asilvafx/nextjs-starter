"use client";

import { useEffect, useState, useCallback } from "react";
import { getAll, create, update } from "@/lib/client/query";
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
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  ArrowUpDown,
  Search,
  FileDown,
  Eye,
  Plus,
  Pencil,
  Printer,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {TableSkeleton} from "@/components/ui/skeleton"; 


const ORDER_STATUS = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" }
];

const initialFormData = {
  customer: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    streetAddress: "",
    apartmentUnit: "",
    city: "",
    state: "",
    zipCode: "",
    country: "FR",
    countryIso: "FR",
  },
  items: [],
  subtotal: 0,
  shippingCost: 0,
  total: 0,
  status: "pending",
  paymentStatus: "pending",
  paymentMethod: "",
  deliveryNotes: "",
  sendEmail: true,
};

const PAYMENT_METHODS = [
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "crypto", label: "Cryptocurrency" }
];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getAll("orders");
      if (response.success) {
        setOrders(response.data);
        setAllOrders(response.data);
      }
    } catch (error) {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await getAll("customers");
      if (response.success) {
        setCustomers(response.data);
      }
    } catch (error) {
      toast.error("Failed to fetch customers");
    }
  };

  const fetchCatalog = async () => {
    try {
      const response = await getAll("catalog");
      if (response.success) {
        setCatalog(response.data);
      }
    } catch (error) {
      toast.error("Failed to fetch catalog items");
    }
  };

  useEffect(() => {
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
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = sortConfig.key.includes(".")
        ? a.customer.name
        : a[sortConfig.key];
      let bValue = sortConfig.key.includes(".")
        ? b.customer.name
        : b[sortConfig.key];

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
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
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleCreateOrder = async () => {
    try {
      setIsSubmitting(true);

      // Calculate totals
      const subtotal = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const orderData = {
        ...formData,
        subtotal,
        total: subtotal + (formData.shippingCost || 0),
        createdAt: new Date().toISOString(),
      };

      // Create customer if new
      if (isNewCustomer) {
        const customerResponse = await create({
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
        }, "customers");

        if (!customerResponse.success) { 
          throw new Error('Failed to create customer');
        }

        orderData.customerId = customerResponse.data.id;
      } else {
        orderData.customerId = selectedCustomerId;
      }

      // Create order in database
      const response = await create(orderData, "orders");
      
      if (!response.id) { 
        throw new Error('Failed to create order');
      }

      // If email notification is enabled, send confirmation
      if (formData.sendEmail) {
        const emailPayload = {
          email: orderData.customer.email,
          customerName: `${orderData.customer.firstName} ${orderData.customer.lastName}`.trim(),
          orderId: response.data.id,
          orderDate: orderData.createdAt,
          items: orderData.items,
          subtotal: orderData.subtotal,
          shippingCost: orderData.shippingCost,
          total: orderData.total,
          shippingAddress: {
            street: orderData.customer.streetAddress,
            unit: orderData.customer.apartmentUnit,
            city: orderData.customer.city,
            state: orderData.customer.state,
            zip: orderData.customer.zipCode,
            country: orderData.customer.country,
          }
        };

        await fetch('/api/email/order-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailPayload),
        });
      }

      toast.success("Order created successfully");
      setIsCreateOpen(false);
      setFormData(initialFormData);
      fetchOrders();
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error("Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const order = allOrders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Update order status
      await update(orderId, { status: newStatus }, "orders");

      // Prepare email data if status changed
      const emailPayload = {
        email: order.customer.email,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`.trim(),
        orderId: order.id,
        orderDate: order.createdAt,
        items: order.items,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        total: order.total,
        shippingAddress: {
          street: order.customer.streetAddress,
          unit: order.customer.apartmentUnit,
          city: order.customer.city,
          state: order.customer.state,
          zip: order.customer.zipCode,
          country: order.customer.country,
        },
        status: newStatus
      };

      // Send status update email
      await fetch('/api/email/order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload),
      });

      toast.success("Order status updated successfully");
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error("Failed to update order status");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const exportToCSV = () => {
    const headers = [
      "Order ID",
      "Customer",
      "Email",
      "Total",
      "Status",
      "Payment",
      "Date",
    ];
    const csvData = filteredOrders.map((order) => [
      order.id,
      `${order.customer.firstName} ${order.customer.lastName}`.trim(),
      order.customer.email,
      order.total,
      order.status,
      order.paymentStatus,
      order.createdAt,
    ]);

    const csv = [headers, ...csvData]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Manage and track your orders</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-1 w-full sm:w-auto gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
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
            <FileDown className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-250px)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("id")}
              >
                <div className="flex items-center">
                  Order ID
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("customer.name")}
              >
                <div className="flex items-center">
                  Customer
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("total")}
              >
                <div className="flex items-center">
                  Total
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("createdAt")}
              >
                <div className="flex items-center">
                  Date
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>
                    <div>
                      <div>{`${order.customer.firstName} ${order.customer.lastName}`.trim()}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.customer.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatPrice(order.total)}</TableCell>
                  <TableCell>
                    <Select 
                      value={order.status}
                      onValueChange={(value) => handleStatusChange(order.id, value)}
                    >
                      <SelectTrigger 
                        className={`h-8 ${
                          order.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : order.status === "shipped"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "processing"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <SelectValue>
                          {ORDER_STATUS.find(s => s.value === order.status)?.label}
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
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        order.paymentStatus === "paid"
                          ? "bg-green-100 text-green-800"
                          : order.paymentStatus === "failed"
                          ? "bg-red-100 text-red-800"
                          : order.paymentStatus === "refunded"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {order.paymentStatus.charAt(0).toUpperCase() +
                        order.paymentStatus.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsDetailsOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Order Details</DialogTitle>
                        </DialogHeader>
                        {selectedOrder && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h3 className="font-semibold">Customer Details</h3>
                                <p>{selectedOrder.customer.name}</p>
                                <p>{selectedOrder.customer.email}</p>
                              </div>
                              <div>
                                <h3 className="font-semibold">Order Info</h3>
                                <p>Order ID: {selectedOrder.id}</p>
                                <p>Date: {formatDate(selectedOrder.createdAt)}</p>
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold mb-2">Items</h3>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Total</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {selectedOrder.items.map((item, index) => (
                                    <TableRow key={index}>
                                      <TableCell>{item.name}</TableCell>
                                      <TableCell>{item.quantity}</TableCell>
                                      <TableCell>
                                        {formatPrice(item.price)}
                                      </TableCell>
                                      <TableCell>
                                        {formatPrice(item.price * item.quantity)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                  <TableRow>
                                    <TableCell
                                      colSpan={3}
                                      className="text-right font-semibold"
                                    >
                                      Total:
                                    </TableCell>
                                    <TableCell className="font-semibold">
                                      {formatPrice(selectedOrder.total)}
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Create Order Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
            <DialogDescription>
              Create a new order manually and optionally send an email notification to the customer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="flex gap-4 items-center">
              <Select 
                value={isNewCustomer ? "new" : selectedCustomerId}
                onValueChange={(value) => {
                  if (value === "new") {
                    setIsNewCustomer(true);
                    setSelectedCustomerId("");
                    setFormData({ ...initialFormData });
                  } else {
                    setIsNewCustomer(false);
                    setSelectedCustomerId(value);
                    const customer = customers.find(c => c.id === value);
                    if (customer) {
                      setFormData({
                        ...formData,
                        customer: {
                          firstName: customer.firstName,
                          lastName: customer.lastName,
                          email: customer.email,
                          phone: customer.phone,
                          streetAddress: customer.streetAddress,
                          apartmentUnit: customer.apartmentUnit,
                          city: customer.city,
                          state: customer.state,
                          zipCode: customer.zipCode,
                          country: customer.country,
                          countryIso: customer.countryIso,
                        }
                      });
                    }
                  }
                }}
              >
                <SelectTrigger className="w-[350px]">
                  <SelectValue placeholder="Select existing customer or create new" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Create New Customer</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.firstName} {customer.lastName} - {customer.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold mb-4">Customer Information</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
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
                              firstName: e.target.value,
                            },
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
                              lastName: e.target.value,
                            },
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
                            email: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="phone">Phone</label>
                    <Input
                      id="phone"
                      value={formData.customer.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customer: {
                            ...formData.customer,
                            phone: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-4">Shipping Address</h3>
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
                            streetAddress: e.target.value,
                          },
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
                            apartmentUnit: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
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
                              city: e.target.value,
                            },
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
                              state: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
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
                              zipCode: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="country">Country</label>
                      <Input
                        id="country"
                        value={formData.customer.country}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customer: {
                              ...formData.customer,
                              country: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-4">Order Details</h3>
              <div className="mb-4">
                <Select
                  onValueChange={(value) => {
                    if (value === "custom") return;
                    const item = catalog.find(i => i.id === value);
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
                            type: "catalog"
                          }
                        ]
                      });
                    }
                  }}
                >
                  <SelectTrigger className="w-[350px]">
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
                        {item.type === "catalog" ? (
                          <div className="font-medium">{item.name}</div>
                        ) : (
                          <Input
                            value={item.name}
                            onChange={(e) => {
                              const newItems = [...formData.items];
                              newItems[index] = { ...newItems[index], name: e.target.value };
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
                            newItems[index] = { ...newItems[index], quantity: parseInt(e.target.value, 10) };
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
                          disabled={item.type === "catalog"}
                          onChange={(e) => {
                            const newItems = [...formData.items];
                            newItems[index] = { ...newItems[index], price: parseFloat(e.target.value) };
                            setFormData({ ...formData, items: newItems });
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {formatPrice(item.price * item.quantity)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newItems = formData.items.filter((_, i) => i !== index);
                            setFormData({ ...formData, items: newItems });
                          }}
                        >
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
                    items: [
                      ...formData.items,
                      { name: "", quantity: 1, price: 0, type: "custom" },
                    ],
                  });
                }}
              >
                Add Custom Item
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Order Status</label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
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
                  <label className="text-sm font-medium">Payment Method</label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                  >
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
                  <label className="text-sm font-medium">Shipping Cost</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.shippingCost}
                    onChange={(e) => setFormData({ ...formData, shippingCost: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="pt-6">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatPrice(formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping:</span>
                    <span>{formatPrice(formData.shippingCost || 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                    <span>Total:</span>
                    <span>{formatPrice(
                      formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 
                      (formData.shippingCost || 0)
                    )}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="sendEmail"
                checked={formData.sendEmail}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, sendEmail: checked })
                }
              />
              <label
                htmlFor="sendEmail"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Send order confirmation email to customer
              </label>
            </div>

            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrder} disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Order"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}