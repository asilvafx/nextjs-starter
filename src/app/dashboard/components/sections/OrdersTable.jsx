"use client"
import { Eye, Edit3, Trash2, FileText } from 'lucide-react';
import { DataTable, StatusBadge } from '../common/Common';
import SkeletonRow from '../skeletons/SkeletonRow';

const OrdersTable = ({
                         orders,
                         loading,
                         actionLoading,
                         onPreview,
                         onEdit,
                         onDelete,
                         onInvoice
                     }) => {
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = typeof timestamp === 'number'
            ? new Date(timestamp > 1000000000000 ? timestamp : timestamp * 1000)
            : new Date(timestamp);
        return date.toLocaleDateString('fr-FR');
    };

    const formatCurrency = (amount, currency = 'eur') => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency.toUpperCase()
        }).format(amount);
    };

    const parseJSON = (jsonString, fallback = {}) => {
        try {
            return typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString || fallback;
        } catch {
            return fallback;
        }
    };

    if (loading) {
        return (
            <DataTable headers={['Commande', 'Client', 'Produit', 'Montant', 'Date', 'Statut', 'Actions']}>
                {Array.from({ length: 8 }).map((_, index) => (
                    <SkeletonRow key={index} />
                ))}
            </DataTable>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg mb-2">Aucune commande trouvée</p>
                <p className="text-gray-400 text-sm">
                    Aucune commande ne correspond aux critères de filtrage actuels.
                </p>
            </div>
        );
    }

    return (
        <DataTable headers={['Commande', 'Client', 'Produit', 'Montant', 'Date', 'Statut', 'Actions']}>
            {orders.map((order, index) => (
                <tr key={order.id || index} className="hover:bg-gray-50">
                    <td data-label="Ref" className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                        #{order.uid}
                    </td>
                    <td data-label="Customer" className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.cst_name}</div>
                        <div className="text-sm text-gray-500">{order.cst_email}</div>
                    </td>
                    <td data-label="Items" className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(() => {
                            const items = parseJSON(order.items, []);
                            const firstItem = items[0]?.name || 'N/A';
                            const itemCount = items.length;

                            if (itemCount === 1) {
                                return firstItem;
                            } else if (itemCount > 1) {
                                return `${firstItem} +${itemCount - 1} autre${itemCount > 2 ? 's' : ''}`;
                            }

                            return 'N/A';
                        })()}
                    </td>
                    <td data-label="Amount" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(order.amount, order.currency)}
                    </td>
                    <td data-label="Create At" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.created_at)}
                    </td>
                    <td data-label="Status" className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                            <button
                                onClick={() => onPreview(order)}
                                className="text-blue-600 hover:text-blue-900 disabled:opacity-50 p-1 rounded hover:bg-blue-50 transition-colors"
                                title="Voir les détails"
                                disabled={actionLoading}
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onEdit(order)}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50 p-1 rounded hover:bg-green-50 transition-colors"
                                title="Modifier"
                                disabled={actionLoading}
                            >
                                <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onInvoice(order)}
                                className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50 transition-colors"
                                title="Facture"
                            >
                                <FileText className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onDelete(order)}
                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                                title="Supprimer"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </td>
                </tr>
            ))}
        </DataTable>
    );
};

export default OrdersTable;
