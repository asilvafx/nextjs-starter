"use client"

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAll, get, update, remove, create } from '@/lib/client/query.js';
import { AlertTriangle, X } from 'lucide-react';

// Import the new components
import OrdersQuickStats from '../components/sections/OrdersQuickStats';
import OrdersFilterTabs from '../components/sections/OrdersFilterTabs';
import OrdersTable from '../components/sections/OrdersTable';
import CreateOrderForm from '../components/sections/CreateOrderForm';
import {
    Modal,
    OrderPreview,
    OrderEdit,
    DeleteConfirmation,
    InvoiceViewer
} from '../components/modals/OrdersModal';

// Enhanced PDF Generator
const generatePDF = (order) => {
    const mockPDFContent = `Invoice for Order ${order.uid}\nCustomer: ${order.cst_name}\nAmount: €${order.amount}`;
    const blob = new Blob([mockPDFContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${order.uid}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const DashboardOrders = () => {
    // State management
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Filter state
    const [activeFilter, setActiveFilter] = useState('pending');

    // Modal states
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form states
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [editForm, setEditForm] = useState({});
    const [createForm, setCreateForm] = useState({
        cst_name: '',
        cst_email: '',
        items: [{ name: '', price: 0, quantity: 1, sku: '', image: '' }],
        shipping: 5.99,
        currency: 'eur',
        method: 'card',
        status: 'pending',
        shipping_address: {
            name: '',
            street: '',
            apartment: '',
            city: '',
            state: '',
            zip: '',
            country: 'FR',
            phone: ''
        },
        tracking: '',
        delivery_notes: '',
        ref: ''
    });

    // Fetch orders from API
    const fetchOrders = useCallback(async () => {
        setError(null);
        setLoading(true);
        try {
            const response = await getAll('orders');
            if (response && response.success) {
                setOrders(response.data || []);
            } else {
                setOrders([]);
                setError('Failed to load orders');
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError(`Failed to load orders: ${err.message}`);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load orders on component mount
    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Filter orders based on active filter
    const filteredOrders = useMemo(() => {
        if (activeFilter === 'all') {
            return orders;
        }
        return orders.filter(order => order.status === activeFilter);
    }, [orders, activeFilter]);

    // Enhanced preview handler - fetch fresh data
    const handlePreview = async (order) => {
        try {
            setActionLoading(true);
            const freshOrderData = await get('orders', order.id);
            setSelectedOrder(freshOrderData || order);
            setIsPreviewOpen(true);
        } catch (error) {
            console.error('Error fetching order details:', error);
            setSelectedOrder(order);
            setIsPreviewOpen(true);
        } finally {
            setActionLoading(false);
        }
    };

    // Enhanced edit handler
    const handleEdit = async (order) => {
        try {
            setActionLoading(true);
            const freshOrderData = await get('orders', order.id);
            const orderToEdit = freshOrderData || order;

            setSelectedOrder(orderToEdit);
            setEditForm({
                status: orderToEdit.status || 'pending',
                tracking: orderToEdit.tracking || '',
                delivery_notes: orderToEdit.delivery_notes || ''
            });
            setIsEditOpen(true);
        } catch (error) {
            console.error('Error fetching order for edit:', error);
            setSelectedOrder(order);
            setEditForm({
                status: order.status || 'pending',
                tracking: order.tracking || '',
                delivery_notes: order.delivery_notes || ''
            });
            setIsEditOpen(true);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = (order) => {
        setSelectedOrder(order);
        setDeleteConfirmation('');
        setIsDeleteOpen(true);
    };

    const handleInvoice = (order) => {
        setSelectedOrder(order);
        setIsInvoiceOpen(true);
    };

    const handleCreateOrder = () => {
        setCreateForm({
            cst_name: '',
            cst_email: '',
            items: [{ name: '', price: 0, quantity: 1, sku: '', image: '' }],
            shipping: 5.99,
            currency: 'eur',
            method: 'card',
            status: 'pending',
            shipping_address: {
                name: '',
                street: '',
                apartment: '',
                city: '',
                state: '',
                zip: '',
                country: 'FR',
                phone: ''
            },
            tracking: '',
            delivery_notes: '',
            ref: ''
        });
        setIsCreateOpen(true);
    };

    // Enhanced delete function
    const confirmDelete = async () => {
        if (deleteConfirmation !== 'delete') {
            return;
        }

        try {
            setActionLoading(true);
            await remove(selectedOrder.id, 'orders');

            setOrders(prevOrders =>
                prevOrders.filter(order => order.id !== selectedOrder.id)
            );

            setIsDeleteOpen(false);
            setSelectedOrder(null);
            setDeleteConfirmation('');

        } catch (error) {
            console.error('Error deleting order:', error);
            setError(`Failed to delete order: ${error.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    // Enhanced save edit function
    const saveEdit = async () => {
        if (!selectedOrder) return;

        try {
            setActionLoading(true);

            const updatedOrder = await update(selectedOrder.id, editForm, 'orders');

            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order.id === selectedOrder.id
                        ? { ...order, ...updatedOrder }
                        : order
                )
            );

            setIsEditOpen(false);
            setSelectedOrder(null);
            setEditForm({});

        } catch (error) {
            console.error('Error updating order:', error);
            setError(`Failed to update order: ${error.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    // Create new order function
    const createOrder = async () => {
        try {
            setActionLoading(true);

            const timestamp = Math.floor(Date.now() / 1000);
            const randomNum = Math.floor(Math.random() * 1000);
            const uid = `ORD-${timestamp}-${randomNum}`;
            const tx = `manual_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

            const subtotal = createForm.items.reduce((sum, item) =>
                sum + (parseFloat(item.price) * parseInt(item.quantity)), 0
            );

            const orderData = {
                uid,
                tx,
                cst_email: createForm.cst_email,
                cst_name: createForm.cst_name,
                items: JSON.stringify(createForm.items.map(item => ({
                    id: Math.floor(Math.random() * 10000),
                    name: item.name,
                    price: parseFloat(item.price),
                    quantity: parseInt(item.quantity),
                    sku: item.sku || null,
                    image: item.image || "https://placehold.co/300x300"
                }))),
                amount: subtotal + parseFloat(createForm.shipping),
                subtotal: subtotal.toString(),
                shipping: parseFloat(createForm.shipping),
                shipping_address: JSON.stringify({
                    name: createForm.shipping_address.name || createForm.cst_name,
                    street: createForm.shipping_address.street,
                    apartment: createForm.shipping_address.apartment,
                    city: createForm.shipping_address.city,
                    state: createForm.shipping_address.state,
                    zip: createForm.shipping_address.zip,
                    country: createForm.shipping_address.country,
                    phone: createForm.shipping_address.phone
                }),
                currency: createForm.currency,
                method: createForm.method,
                status: createForm.status,
                created_at: timestamp,
                tracking: createForm.tracking,
                delivery_notes: createForm.delivery_notes,
                ref: createForm.ref
            };

            const newOrder = await create(orderData, 'orders');

            setOrders(prevOrders => [newOrder, ...prevOrders]);

            closeModal('create');
        } catch (error) {
            console.error('Error creating order:', error);
            setError(`Failed to create order: ${error.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    // Close modals and reset state
    const closeModal = (modalType) => {
        switch (modalType) {
            case 'preview':
                setIsPreviewOpen(false);
                break;
            case 'edit':
                setIsEditOpen(false);
                setEditForm({});
                break;
            case 'create':
                setIsCreateOpen(false);
                setCreateForm({
                    cst_name: '',
                    cst_email: '',
                    items: [{ name: '', price: 0, quantity: 1, sku: '', image: '' }],
                    shipping: 5.99,
                    currency: 'eur',
                    method: 'card',
                    status: 'pending',
                    shipping_address: {
                        name: '',
                        street: '',
                        apartment: '',
                        city: '',
                        state: '',
                        zip: '',
                        country: 'FR',
                        phone: ''
                    },
                    tracking: '',
                    delivery_notes: '',
                    ref: ''
                });
                break;
            case 'delete':
                setIsDeleteOpen(false);
                setDeleteConfirmation('');
                break;
            case 'invoice':
                setIsInvoiceOpen(false);
                break;
        }
        setSelectedOrder(null);
    };

    return (
        <div className="fade-in">
            <div className="dashboard-card-header">
                <div>
                    <h1 className="dashboard-card-title">Gestion des Commandes</h1>
                    <p className="dashboard-card-subtitle">Gérez vos commandes clients et leur statut</p>
                </div>
                <button
                    className="button primary"
                    onClick={handleCreateOrder}
                >
                    Nouvelle Commande
                </button>
            </div>

            {/* Quick Stats */}
            <OrdersQuickStats orders={orders} />

            <div className="section">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                            <button
                                onClick={() => setError(null)}
                                className="text-red-500 hover:text-red-700"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Filter Tabs */}
                    <OrdersFilterTabs
                        orders={orders}
                        activeFilter={activeFilter}
                        onFilterChange={setActiveFilter}
                    />

                    {/* Orders Table */}
                    <OrdersTable
                        orders={filteredOrders}
                        loading={loading}
                        actionLoading={actionLoading}
                        onPreview={handlePreview}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onInvoice={handleInvoice}
                    />

                    {/* Refresh button if no orders */}
                    {!loading && orders.length === 0 && (
                        <div className="text-center mt-4">
                            <button
                                onClick={fetchOrders}
                                className="text-sm text-blue-600 hover:text-blue-800 underline"
                                disabled={loading}
                            >
                                {loading ? 'Chargement...' : 'Actualiser'}
                            </button>
                        </div>
                    )}
            </div>

            {/* Create Order Modal */}
            <Modal
                isOpen={isCreateOpen}
                onClose={() => closeModal('create')}
                title="Créer une nouvelle commande"
                size="xl"
            >
                <CreateOrderForm
                    form={createForm}
                    setForm={setCreateForm}
                    onCreate={createOrder}
                    onCancel={() => closeModal('create')}
                    actionLoading={actionLoading}
                    error={error}
                />
            </Modal>

            {/* Preview Modal */}
            <Modal
                isOpen={isPreviewOpen}
                onClose={() => closeModal('preview')}
                title={`Détails de la commande ${selectedOrder?.uid}`}
                size="lg"
            >
                {selectedOrder && <OrderPreview order={selectedOrder} />}
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditOpen}
                onClose={() => closeModal('edit')}
                title={`Modifier la commande ${selectedOrder?.uid}`}
            >
                {selectedOrder && (
                    <OrderEdit
                        order={selectedOrder}
                        form={editForm}
                        setForm={setEditForm}
                        onSave={saveEdit}
                        onCancel={() => closeModal('edit')}
                        actionLoading={actionLoading}
                        error={error}
                    />
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteOpen}
                onClose={() => closeModal('delete')}
                title="Confirmer la suppression"
            >
                {selectedOrder && (
                    <DeleteConfirmation
                        order={selectedOrder}
                        deleteConfirmation={deleteConfirmation}
                        setDeleteConfirmation={setDeleteConfirmation}
                        onConfirm={confirmDelete}
                        onCancel={() => closeModal('delete')}
                        actionLoading={actionLoading}
                        error={error}
                    />
                )}
            </Modal>

            {/* Invoice Modal */}
            <Modal
                isOpen={isInvoiceOpen}
                onClose={() => closeModal('invoice')}
                title={`Facture ${selectedOrder?.uid}`}
                size="xl"
            >
                {selectedOrder && (
                    <InvoiceViewer
                        order={selectedOrder}
                        onGeneratePDF={generatePDF}
                    />
                )}
            </Modal>
        </div>
    );
};

export default DashboardOrders;
