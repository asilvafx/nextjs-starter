"use client"
import { X, AlertTriangle, TrendingUp } from 'lucide-react';
import { StatusBadge } from '../common/Common';

// Modal wrapper component
export const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: "max-w-md",
        md: "max-w-2xl",
        lg: "max-w-4xl",
        xl: "max-w-6xl"
    };

    return (
        <div className="dashboard-modal-overlay">
            <div className={`dashboard-modal-content ${sizeClasses[size]}`}> 
                    <div className="modal-header">
                        <h3 className="text-lg">{title}</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="dashboard-modal-body">
                        {children}
                    </div>
            </div>
        </div>
    );
};

// Order Preview Modal Component
export const OrderPreview = ({ order }) => {
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

    const items = parseJSON(order.items, []);
    const address = parseJSON(order.shipping_address, {});

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-gray-900">Informations de commande</h4>
                        <div className="mt-2 space-y-1 text-sm">
                            <p><span className="font-medium">ID:</span> {order.uid}</p>
                            <p><span className="font-medium">Date:</span> {formatDate(order.created_at)}</p>
                            <p><span className="font-medium">Statut:</span> <StatusBadge status={order.status} /></p>
                            <p><span className="font-medium">Méthode:</span> {order.method}</p>
                            <p><span className="font-medium">Transaction:</span> {order.tx}</p>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-gray-900">Client</h4>
                        <div className="mt-2 space-y-1 text-sm">
                            <p><span className="font-medium">Nom:</span> {order.cst_name}</p>
                            <p><span className="font-medium">Email:</span> {order.cst_email}</p>
                            {address.phone && <p><span className="font-medium">Téléphone:</span> {address.phone}</p>}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-gray-900">Livraison</h4>
                        <div className="mt-2 space-y-1 text-sm">
                            {address.street && <p>{address.street}</p>}
                            {address.apartment && <p>{address.apartment}</p>}
                            {(address.city || address.zip) && <p>{address.zip} {address.city}</p>}
                            {address.state && <p>{address.state}</p>}
                            {address.country && <p>{address.country}</p>}
                            {order.tracking && <p><span className="font-medium">Suivi:</span> {order.tracking}</p>}
                            {order.delivery_notes && <p><span className="font-medium">Notes:</span> {order.delivery_notes}</p>}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-gray-900">Articles</h4>
                        <div className="mt-2 space-y-2">
                            {items.map((item, index) => (
                                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-sm text-gray-600">Quantité: {item.quantity}</p>
                                        {item.sku && <p className="text-xs text-gray-500">SKU: {item.sku}</p>}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                                        <p className="text-sm text-gray-600">{formatCurrency(item.price)} × {item.quantity}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="font-semibold text-gray-900">Récapitulatif</h4>
                        <div className="mt-2 space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span>Sous-total:</span>
                                <span>{formatCurrency(parseFloat(order.subtotal || 0))}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Livraison:</span>
                                <span>{formatCurrency(order.shipping || 0)}</span>
                            </div>
                            <div className="flex justify-between font-semibold border-t pt-2">
                                <span>Total:</span>
                                <span>{formatCurrency(order.amount)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Order Edit Modal Component
export const OrderEdit = ({ order, form, setForm, onSave, onCancel, actionLoading, error }) => (
    <div className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-gray-700">Statut de la commande</label>
            <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                disabled={actionLoading}
            >
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmée</option>
                <option value="processing">En cours</option>
                <option value="shipped">Expédiée</option>
                <option value="delivered">Livrée</option>
                <option value="cancelled">Annulée</option>
                <option value="refunded">Remboursée</option>
            </select>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700">Numéro de suivi</label>
            <input
                type="text"
                value={form.tracking}
                onChange={(e) => setForm({ ...form, tracking: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Ex: FR123456789"
                disabled={actionLoading}
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700">Notes de livraison</label>
            <textarea
                value={form.delivery_notes}
                onChange={(e) => setForm({ ...form, delivery_notes: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Instructions spéciales pour la livraison..."
                disabled={actionLoading}
            />
        </div>

        {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
            </div>
        )}

        <div className="flex justify-end space-x-3">
            <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                disabled={actionLoading}
            >
                Annuler
            </button>
            <button
                onClick={onSave}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                disabled={actionLoading}
            >
                {actionLoading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Enregistrement...</span>
                    </>
                ) : (
                    <span>Enregistrer</span>
                )}
            </button>
        </div>
    </div>
);

// Delete Confirmation Modal Component
export const DeleteConfirmation = ({ order, deleteConfirmation, setDeleteConfirmation, onConfirm, onCancel, actionLoading, error }) => (
    <div className="space-y-4">
        <div className="flex items-center space-x-3">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div>
                <p className="text-sm text-gray-900">
                    Vous êtes sur le point de supprimer définitivement la commande{' '}
                    <span className="font-mono font-medium">{order?.uid}</span>.
                </p>
                <p className="text-sm text-gray-600">Cette action est irréversible.</p>
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Tapez <span className="font-mono bg-gray-100 px-1 rounded">delete</span> pour confirmer:
            </label>
            <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                placeholder="delete"
                disabled={actionLoading}
            />
        </div>

        {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
            </div>
        )}

        <div className="flex justify-end space-x-3">
            <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                disabled={actionLoading}
            >
                Annuler
            </button>
            <button
                onClick={onConfirm}
                disabled={deleteConfirmation !== 'delete' || actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
                {actionLoading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Suppression...</span>
                    </>
                ) : (
                    <span>Supprimer définitivement</span>
                )}
            </button>
        </div>
    </div>
);

// Invoice Viewer Modal Component
export const InvoiceViewer = ({ order, onGeneratePDF }) => {
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

    return (
        <div className="space-y-6">
            <div className="bg-white p-8 rounded-lg border" style={{ fontFamily: 'Arial, sans-serif' }}>
                <div className="border-b pb-4 mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold">LOST-FOREVER</h1>
                            <p className="text-gray-600">www.lost-forever.com</p>
                            <p className="text-gray-600">Boutique de vêtements</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold">FACTURE</h2>
                            <p>N° {order.uid}</p>
                            <p>{formatDate(order.created_at)}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-6">
                    <div>
                        <h3 className="font-semibold mb-2">INFORMATIONS CLIENT</h3>
                        <p>{order.cst_name}</p>
                        <p>{order.cst_email}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">ADRESSE DE LIVRAISON</h3>
                        {(() => {
                            const address = parseJSON(order.shipping_address, {});
                            return (
                                <>
                                    <p>{address.name || order.cst_name}</p>
                                    {address.street && <p>{address.street}</p>}
                                    {(address.zip || address.city) && <p>{address.zip} {address.city}</p>}
                                    {address.country && <p>{address.country}</p>}
                                </>
                            );
                        })()}
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="font-semibold mb-4">DÉTAIL DE LA COMMANDE</h3>
                    <table className="w-full">
                        <thead>
                        <tr className="border-b">
                            <th className="text-left py-2">Article</th>
                            <th className="text-center py-2">Qté</th>
                            <th className="text-right py-2">Prix U.</th>
                            <th className="text-right py-2">Total</th>
                        </tr>
                        </thead>
                        <tbody>
                        {parseJSON(order.items, []).map((item, index) => (
                            <tr key={index} className="border-b">
                                <td className="py-2">{item.name}</td>
                                <td className="text-center py-2">{item.quantity}</td>
                                <td className="text-right py-2">{formatCurrency(item.price)}</td>
                                <td className="text-right py-2">{formatCurrency(item.price * item.quantity)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end">
                    <div className="w-64">
                        <div className="flex justify-between py-1">
                            <span>Sous-total:</span>
                            <span>{formatCurrency(parseFloat(order.subtotal || 0))}</span>
                        </div>
                        <div className="flex justify-between py-1">
                            <span>Frais de port:</span>
                            <span>{formatCurrency(order.shipping || 0)}</span>
                        </div>
                        <div className="flex justify-between py-1">
                            <span>TVA (20%):</span>
                            <span>Incluse</span>
                        </div>
                        <div className="flex justify-between py-2 border-t font-semibold">
                            <span>TOTAL:</span>
                            <span>{formatCurrency(order.amount)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-center space-x-4">
                <button
                    onClick={() => window.print()}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                    Imprimer
                </button>
                <button
                    onClick={() => onGeneratePDF(order)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                    Télécharger PDF
                </button>
            </div>
        </div>
    );
};
