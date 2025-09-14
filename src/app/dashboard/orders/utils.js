// Utility functions for orders management

export const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = typeof timestamp === 'number'
        ? new Date(timestamp > 1000000000000 ? timestamp : timestamp * 1000)
        : new Date(timestamp);
    return date.toLocaleDateString('fr-FR');
};

export const formatCurrency = (amount, currency = 'eur') => {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency.toUpperCase()
    }).format(amount);
};

export const parseJSON = (jsonString, fallback = {}) => {
    try {
        return typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString || fallback;
    } catch {
        return fallback;
    }
};

export const generateOrderUID = () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const randomNum = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${randomNum}`;
};

export const generateTransactionID = () => {
    const timestamp = Math.floor(Date.now() / 1000);
    return `manual_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
};

export const getOrderStatusColor = (status) => {
    const statusColors = {
        'pending': 'yellow',
        'confirmed': 'blue',
        'processing': 'indigo',
        'shipped': 'purple',
        'delivered': 'green',
        'cancelled': 'red',
        'refunded': 'orange'
    };
    return statusColors[status] || 'gray';
};

export const getOrderStatusLabel = (status) => {
    const statusLabels = {
        'pending': 'En attente',
        'confirmed': 'Confirmée',
        'processing': 'En cours',
        'shipped': 'Expédiée',
        'delivered': 'Livrée',
        'cancelled': 'Annulée',
        'refunded': 'Remboursée'
    };
    return statusLabels[status] || status;
};

export const calculateOrderTotal = (items, shipping = 0) => {
    const subtotal = items.reduce((sum, item) =>
        sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 1)), 0
    );
    return subtotal + parseFloat(shipping);
};

export const validateOrderForm = (form) => {
    const errors = [];

    if (!form.cst_name?.trim()) {
        errors.push('Le nom du client est requis');
    }

    if (!form.cst_email?.trim()) {
        errors.push('L\'email du client est requis');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.cst_email)) {
        errors.push('L\'email du client n\'est pas valide');
    }

    if (!form.shipping_address?.street?.trim()) {
        errors.push('L\'adresse de livraison est requise');
    }

    if (!form.shipping_address?.city?.trim()) {
        errors.push('La ville est requise');
    }

    if (!form.shipping_address?.zip?.trim()) {
        errors.push('Le code postal est requis');
    }

    if (!form.items || form.items.length === 0) {
        errors.push('Au moins un article est requis');
    } else {
        form.items.forEach((item, index) => {
            if (!item.name?.trim()) {
                errors.push(`Le nom de l'article ${index + 1} est requis`);
            }
            if (!item.price || parseFloat(item.price) <= 0) {
                errors.push(`Le prix de l'article ${index + 1} doit être supérieur à 0`);
            }
            if (!item.quantity || parseInt(item.quantity) <= 0) {
                errors.push(`La quantité de l'article ${index + 1} doit être supérieure à 0`);
            }
        });
    }

    return errors;
};

export const getPaymentMethodLabel = (method) => {
    const methodLabels = {
        'card': 'Carte bancaire',
        'paypal': 'PayPal',
        'bank_transfer': 'Virement bancaire',
        'cash': 'Espèces',
        'check': 'Chèque'
    };
    return methodLabels[method] || method;
};

export const filterOrdersByDateRange = (orders, startDate, endDate) => {
    return orders.filter(order => {
        const orderDate = new Date(order.created_at * 1000);
        return orderDate >= startDate && orderDate <= endDate;
    });
};

export const groupOrdersByStatus = (orders) => {
    return orders.reduce((acc, order) => {
        const status = order.status || 'unknown';
        if (!acc[status]) {
            acc[status] = [];
        }
        acc[status].push(order);
        return acc;
    }, {});
};

export const calculateOrdersStatistics = (orders) => {
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    const currentYearOrders = orders.filter(order => {
        const orderYear = new Date(order.created_at * 1000).getFullYear();
        return orderYear === currentYear;
    });

    const lastYearOrders = orders.filter(order => {
        const orderYear = new Date(order.created_at * 1000).getFullYear();
        return orderYear === lastYear;
    });

    const completedOrders = orders.filter(order =>
        order.status === 'delivered' || order.status === 'completed'
    );

    const currentYearRevenue = currentYearOrders.reduce((sum, order) =>
        sum + parseFloat(order.amount || 0), 0
    );

    const lastYearRevenue = lastYearOrders.reduce((sum, order) =>
        sum + parseFloat(order.amount || 0), 0
    );

    const revenueGrowth = lastYearRevenue > 0
        ? ((currentYearRevenue - lastYearRevenue) / lastYearRevenue) * 100
        : currentYearRevenue > 0 ? 100 : 0;

    const ordersGrowth = lastYearOrders.length > 0
        ? ((currentYearOrders.length - lastYearOrders.length) / lastYearOrders.length) * 100
        : currentYearOrders.length > 0 ? 100 : 0;

    const completionRate = orders.length > 0
        ? (completedOrders.length / orders.length) * 100
        : 0;

    return {
        totalOrders: orders.length,
        completedOrders: completedOrders.length,
        currentYearRevenue,
        lastYearRevenue,
        revenueGrowth,
        completionRate,
        currentYearOrders: currentYearOrders.length,
        lastYearOrders: lastYearOrders.length,
        ordersGrowth
    };
};

export const exportOrdersToCSV = (orders) => {
    const headers = [
        'ID Commande',
        'Date',
        'Client',
        'Email',
        'Statut',
        'Montant',
        'Devise',
        'Méthode de paiement',
        'Suivi',
        'Articles'
    ];

    const csvContent = [
        headers.join(','),
        ...orders.map(order => {
            const items = parseJSON(order.items, []);
            const itemsNames = items.map(item => item.name).join('; ');

            return [
                order.uid,
                formatDate(order.created_at),
                `"${order.cst_name}"`,
                order.cst_email,
                getOrderStatusLabel(order.status),
                order.amount,
                order.currency?.toUpperCase(),
                getPaymentMethodLabel(order.method),
                order.tracking || '',
                `"${itemsNames}"`
            ].join(',');
        })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const searchOrders = (orders, searchTerm) => {
    if (!searchTerm.trim()) return orders;

    const term = searchTerm.toLowerCase();

    return orders.filter(order => {
        const items = parseJSON(order.items, []);
        const itemsText = items.map(item => item.name).join(' ').toLowerCase();

        return (
            order.uid?.toLowerCase().includes(term) ||
            order.cst_name?.toLowerCase().includes(term) ||
            order.cst_email?.toLowerCase().includes(term) ||
            order.status?.toLowerCase().includes(term) ||
            order.tx?.toLowerCase().includes(term) ||
            itemsText.includes(term)
        );
    });
};
