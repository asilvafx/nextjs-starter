"use client"

const CreateOrderForm = ({
                             form,
                             setForm,
                             onCreate,
                             onCancel,
                             actionLoading,
                             error
                         }) => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    const addItem = () => {
        setForm({
            ...form,
            items: [...form.items, { name: '', price: 0, quantity: 1, sku: '', image: '' }]
        });
    };

    const removeItem = (index) => {
        if (form.items.length > 1) {
            setForm({
                ...form,
                items: form.items.filter((_, i) => i !== index)
            });
        }
    };

    const updateItem = (index, field, value) => {
        const updatedItems = [...form.items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        setForm({ ...form, items: updatedItems });
    };

    const updateShippingAddress = (field, value) => {
        setForm({
            ...form,
            shipping_address: {
                ...form.shipping_address,
                [field]: value
            }
        });
    };

    const calculateTotal = () => {
        const subtotal = form.items.reduce((sum, item) =>
            sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 1)), 0
        );
        return subtotal + parseFloat(form.shipping || 0);
    };

    const isFormValid = () => {
        return form.cst_name &&
            form.cst_email &&
            form.shipping_address.street &&
            form.shipping_address.city &&
            form.shipping_address.zip &&
            form.items.every(item => item.name && item.price);
    };

    return (
        <div className="space-y-6 max-h-[80vh]">
            {/* Customer Information */}
            <div className="space-y-4">
                <h4 className="font-semibold  text-gray-300 border-b pb-2">Informations Client</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400">
                            Nom complet <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.cst_name}
                            onChange={(e) => setForm({ ...form, cst_name: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="Nom du destinataire"
                            disabled={actionLoading}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            value={form.cst_email}
                            onChange={(e) => setForm({ ...form, cst_email: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="email@example.com"
                            disabled={actionLoading}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Téléphone</label>
                        <input
                            type="tel"
                            value={form.shipping_address.phone}
                            onChange={(e) => updateShippingAddress('phone', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="+33 1 23 45 67 89"
                            disabled={actionLoading}
                        />
                    </div>
                </div>
            </div>

            {/* Shipping Address */}
            <div className="space-y-4">
                <h4 className="font-semibold  text-gray-300 border-b pb-2">Adresse de Livraison</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-400">
                            Adresse <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.shipping_address.street}
                            onChange={(e) => updateShippingAddress('street', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="123 Rue de la Paix"
                            disabled={actionLoading}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Appartement/Étage</label>
                        <input
                            type="text"
                            value={form.shipping_address.apartment}
                            onChange={(e) => updateShippingAddress('apartment', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="Apt 4B, 3ème étage"
                            disabled={actionLoading}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">
                            Ville <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.shipping_address.city}
                            onChange={(e) => updateShippingAddress('city', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="Paris"
                            disabled={actionLoading}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">État/Région</label>
                        <input
                            type="text"
                            value={form.shipping_address.state}
                            onChange={(e) => updateShippingAddress('state', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="Île-de-France"
                            disabled={actionLoading}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">
                            Code postal <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.shipping_address.zip}
                            onChange={(e) => updateShippingAddress('zip', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="75001"
                            disabled={actionLoading}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Pays</label>
                        <select
                            value={form.shipping_address.country}
                            onChange={(e) => updateShippingAddress('country', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            disabled={actionLoading}
                        >
                            <option value="FR">France</option>
                            <option value="DE">Allemagne</option>
                            <option value="ES">Espagne</option>
                            <option value="IT">Italie</option>
                            <option value="BE">Belgique</option>
                            <option value="NL">Pays-Bas</option>
                            <option value="CH">Suisse</option>
                            <option value="LU">Luxembourg</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Items */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-semibold  text-gray-300">
                        Articles <span className="text-red-500">*</span>
                    </h4>
                    <button
                        onClick={addItem}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        disabled={actionLoading}
                    >
                        + Ajouter un article
                    </button>
                </div>
                <div className="space-y-3">
                    {form.items.map((item, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400">
                                        Nom <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={item.name}
                                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="Nom du produit"
                                        disabled={actionLoading}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400">
                                        Prix <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={item.price}
                                        onChange={(e) => updateItem(index, 'price', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="0.00"
                                        disabled={actionLoading}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400">
                                        Quantité <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        disabled={actionLoading}
                                        required
                                    />
                                </div>
                                <div className="flex items-end">
                                    {form.items.length > 1 && (
                                        <button
                                            onClick={() => removeItem(index)}
                                            className="w-full px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                                            disabled={actionLoading}
                                        >
                                            Supprimer
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400">SKU</label>
                                    <input
                                        type="text"
                                        value={item.sku}
                                        onChange={(e) => updateItem(index, 'sku', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="SKU-123"
                                        disabled={actionLoading}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400">URL Image</label>
                                    <input
                                        type="url"
                                        value={item.image}
                                        onChange={(e) => updateItem(index, 'image', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="https://example.com/image.jpg"
                                        disabled={actionLoading}
                                    />
                                </div>
                            </div>
                            <div className="mt-2 text-right text-sm font-medium  text-gray-300">
                                Total: {formatCurrency((parseFloat(item.price || 0) * parseInt(item.quantity || 1)))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Order Details */}
            <div className="space-y-4">
                <h4 className="font-semibold  text-gray-300 border-b pb-2">Détails de la Commande</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Frais de port</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.shipping}
                            onChange={(e) => setForm({ ...form, shipping: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            disabled={actionLoading}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Devise</label>
                        <select
                            value={form.currency}
                            onChange={(e) => setForm({ ...form, currency: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            disabled={actionLoading}
                        >
                            <option value="eur">EUR (€)</option>
                            <option value="usd">USD ($)</option>
                            <option value="gbp">GBP (£)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Méthode de paiement</label>
                        <select
                            value={form.method}
                            onChange={(e) => setForm({ ...form, method: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            disabled={actionLoading}
                        >
                            <option value="card">Carte bancaire</option>
                            <option value="paypal">PayPal</option>
                            <option value="bank_transfer">Virement</option>
                            <option value="cash">Espèces</option>
                            <option value="check">Chèque</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Statut</label>
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
                        <label className="block text-sm font-medium text-gray-400">Numéro de suivi</label>
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
                        <label className="block text-sm font-medium text-gray-400">Référence</label>
                        <input
                            type="text"
                            value={form.ref}
                            onChange={(e) => setForm({ ...form, ref: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="REF-123"
                            disabled={actionLoading}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400">Notes de livraison</label>
                    <textarea
                        value={form.delivery_notes}
                        onChange={(e) => setForm({ ...form, delivery_notes: e.target.value })}
                        rows={2}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="Instructions spéciales pour la livraison..."
                        disabled={actionLoading}
                    />
                </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold  text-gray-300 mb-3">Récapitulatif</h4>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span>Sous-total:</span>
                        <span>{formatCurrency(form.items.reduce((sum, item) =>
                            sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 1)), 0
                        ))}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Frais de port:</span>
                        <span>{formatCurrency(parseFloat(form.shipping || 0))}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Total:</span>
                        <span>{formatCurrency(calculateTotal())}</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-md hover:bg-gray-200"
                    disabled={actionLoading}
                >
                    Annuler
                </button>
                <button
                    onClick={onCreate}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    disabled={actionLoading || !isFormValid()}
                >
                    {actionLoading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Création...</span>
                        </>
                    ) : (
                        <span>Créer la commande</span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default CreateOrderForm;
