// app/dashboard/components/sections/CollectionsManagement.jsx
"use client"
import { useState, useEffect } from 'react';
import { create, getAll } from '@/lib/client/query.js';
import { DataTable, StatusBadge, ActionButtons, EmptyState } from '../common/Common';
import { toast } from 'sonner';
import {
    Star,
    Plus,
    Edit3,
    Trash2,
    Package,
    Search,
    X,
    Calendar,
    Eye,
    ShoppingBag
} from 'lucide-react';

const CollectionsManagement = () => {
    const [collections, setCollections] = useState([]);
    const [allItems, setAllItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Load all data on component mount
    useEffect(() => {
        const loadData = async () => {
            await loadCollections();
            await loadAllItems();
        };
        loadData();
    }, []);

    const loadCollections = async () => {
        setLoading(true);
        try {
            const storedCollections = await getAll('collections');

            if (storedCollections && storedCollections.success && storedCollections.data) {
                // Extract collections from nested structure
                const collectionsData = storedCollections.data;

                // Convert the object to an array, adding the ID from the key to each item
                const itemsArray = Object.entries(collectionsData).map(([id, item]) => ({
                    id, // Add the key as the id property
                    ...item // Spread the item properties
                }));
                setCollections(itemsArray);
            } else {
                setCollections([]);
            }
        } catch (err) {
            console.error('Error loading collections:', err);
            setCollections([]);
        }
    };

    const loadAllItems = async () => {
        setLoading(true);
        try {
            // Load items from catalog
            const response = await getAll('catalog');

            if (response && response.success && response.data) {
                // For catalog, the data structure is a flat object where keys are item IDs
                // and values are the item objects directly
                const itemsData = response.data;

                // Convert the object to an array, adding the ID from the key to each item
                const itemsArray = Object.entries(itemsData).map(([id, item]) => ({
                    id, // Add the key as the id property
                    ...item // Spread the item properties
                }));

                setAllItems(itemsArray);
            } else {
                setAllItems([]);
            }
        } catch (err) {
            console.error('Error loading items:', err);
            toast.error('Failed to load items');
            setAllItems([]);
        } finally {
            setLoading(false);
        }
    };

    const saveCollections = async (updatedCollections) => {
        try {
            // Send the collections array directly
            const response = await create(updatedCollections, 'collections');
            console.log(response);
            setCollections(response.data);
        } catch (err) {
            console.error('Error saving collections:', err);
            throw err;
        }
    };

    const handleAddCollection = async (collectionData) => {
        try {
            const newCollection = {
                id: Date.now().toString(),
                ...collectionData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await create(newCollection, 'collections');

            const updatedCollections = Array.isArray(collections)
                ? [...collections, newCollection]
                : [newCollection];

            setCollections(updatedCollections);
            setShowAddModal(false);
            toast.success('Collection created successfully!');
        } catch (err) {
            console.error('Error creating collection:', err);
            toast.error('Failed to create collection');
        }
    };

    const handleEditCollection = (collectionId) => {
        const collection = Array.isArray(collections) ? collections.find(c => c.id === collectionId) : null;
        if (collection) {
            setSelectedCollection(collection);
            setShowEditModal(true);
        }
    };

    const handleUpdateCollection = async (collectionData) => {
        try {
            const updatedCollections = Array.isArray(collections)
                ? collections.map(collection =>
                    collection.id === selectedCollection.id
                        ? { ...collection, ...collectionData, updatedAt: new Date().toISOString() }
                        : collection
                )
                : [];

            await saveCollections(updatedCollections);

            setShowEditModal(false);
            setSelectedCollection(null);
            toast.success('Collection updated successfully!');
        } catch (err) {
            console.error('Error updating collection:', err);
            toast.error('Failed to update collection');
        }
    };

    const handleDeleteCollection = async (collectionId) => {
        const collection = Array.isArray(collections) ? collections.find(c => c.id === collectionId) : null;
        if (!collection) return;

        toast.custom((t) => (
            <div className={`bg-gray-800 text-white p-4 rounded-xl shadow-lg border border-red-500 max-w-md ${
                t.visible ? 'animate-in' : 'animate-out'
            }`}>
                <div className="mb-3">
                    <h3 className="font-semibold text-lg text-red-400">Confirm Deletion</h3>
                    <p className="text-sm mt-1">
                        Are you sure you want to delete "{collection.name}"?
                        This action cannot be undone.
                    </p>
                </div>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                const updatedCollections = Array.isArray(collections)
                                    ? collections.filter(c => c.id !== collectionId)
                                    : [];
                                await saveCollections(updatedCollections);
                                toast.success('Collection deleted successfully!');
                            } catch (err) {
                                console.error('Error deleting collection:', err);
                                toast.error('Failed to delete collection');
                            }
                        }}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        ), {
            duration: Infinity,
            position: 'top-center'
        });
    };

    const handleViewCollection = (collectionId) => {
        const collection = Array.isArray(collections) ? collections.find(c => c.id === collectionId) : null;
        if (collection) {
            toast.custom((t) => (
                <div className={`bg-gray-800 text-white p-4 rounded-xl shadow-lg border border-gray-700 max-w-md ${
                    t.visible ? 'animate-in' : 'animate-out'
                }`}>
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-lg">{collection.name}</h3>
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="text-gray-400 hover:text-white"
                        >
                            ×
                        </button>
                    </div>
                    <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Type:</span> {collection.type}</p>
                        <p><span className="font-medium">Items:</span> {collection.itemIds?.length || 0}</p>
                        <p><span className="font-medium">Status:</span>
                            <span className={`ml-1 ${collection.isActive ? 'text-green-400' : 'text-red-400'}`}>
                                {collection.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </p>
                        {collection.description && (
                            <p><span className="font-medium">Description:</span> {collection.description}</p>
                        )}
                        {collection.eventDate && (
                            <p><span className="font-medium">Event Date:</span> {new Date(collection.eventDate).toLocaleDateString()}</p>
                        )}
                    </div>
                </div>
            ), {
                duration: 5000,
                position: 'top-center'
            });
        }
    };

    const filteredCollections = Array.isArray(collections) ? collections.filter(collection =>
        collection?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        collection?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        collection?.type?.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    const getCollectionIcon = (type) => {
        switch (type) {
            case 'seasonal': return '🌟';
            case 'event': return '🎉';
            case 'featured': return '⭐';
            case 'sale': return '🏷️';
            case 'bundle': return '📦';
            default: return '⭐';
        }
    };

    return (
        <>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#1f2937',
                        color: '#f9fafb',
                        border: '1px solid #374151',
                        borderRadius: '12px'
                    }
                }}
            />

            <div className="fade-in">
                <div className="dashboard-card-header">
                    <div>
                        <h1 className="dashboard-card-title">Collections Management</h1>
                        <p className="dashboard-card-subtitle">Create curated collections for special events and promotions</p>
                    </div>
                    <button
                        className="button primary"
                        onClick={() => setShowAddModal(true)}
                        disabled={loading}
                    >
                        <Plus size={16} className="mr-2" />
                        Create Collection
                    </button>
                </div>

                {/* Search */}
                <div className="dashboard-card mb-4">
                    <div className="flex gap-4 items-center">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search collections..."
                                className="input pl-10"
                            />
                        </div>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="button outline"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="section">
                    {loading ? (
                        <div className="dashboard-card">
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            <p className="mt-2">Loading collections...</p>
                        </div>
                        </div>
                    ) : filteredCollections.length === 0 ? (
                        <div className="dashboard-card">
                        <EmptyState
                            icon={<Star className="w-16 h-16 text-gray-400" />}
                            title="No Collections Found"
                            description="Create your first collection to showcase featured products for special events or promotions."
                            actionButton={
                                <button
                                    className="button primary"
                                    onClick={() => setShowAddModal(true)}
                                >
                                    <Plus size={16} className="mr-2" />
                                    Create Your First Collection
                                </button>
                            }
                        />
                        </div>
                    ) : (
                        <>
                            <DataTable headers={['Collection', 'Type', 'Items', 'Status', 'Created', 'Actions']}>
                                {filteredCollections.map((collection) => (
                                    <tr key={collection.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center text-xl">
                                                    {getCollectionIcon(collection.type)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{collection.name}</div>
                                                    <div className="text-sm text-gray-500 truncate max-w-xs">
                                                        {collection.description || 'No description'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td data-label="Type">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                collection.type === 'featured' ? 'bg-yellow-100 text-yellow-800' :
                                                    collection.type === 'seasonal' ? 'bg-green-100 text-green-800' :
                                                        collection.type === 'event' ? 'bg-purple-100 text-purple-800' :
                                                            collection.type === 'sale' ? 'bg-red-100 text-red-800' :
                                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                                {collection.type}
                                            </span>
                                        </td>
                                        <td data-label="Catalog">
                                            <div className="flex items-center justify-end md:justify-center gap-2">
                                                <ShoppingBag className="w-4 h-4 text-gray-500" />
                                                <span>{collection.itemIds?.length || 0} items</span>
                                            </div>
                                        </td>
                                        <td data-label="Status">
                                            <StatusBadge status={collection.isActive ? 'active' : 'inactive'} />
                                        </td>
                                        <td data-label="Created at">
                                            <div className="text-sm text-gray-600">
                                                {new Date(collection.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td>
                                            <ActionButtons
                                                onEdit={() => handleEditCollection(collection.id)}
                                                onView={() => handleViewCollection(collection.id)}
                                                onDelete={() => handleDeleteCollection(collection.id)}
                                                editTitle="Edit Collection"
                                                viewTitle="View Collection"
                                                deleteTitle="Delete Collection"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </DataTable>

                            {/* Summary */}
                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <div className="text-sm text-gray-600">
                                    Total Collections: {filteredCollections.length}
                                    {searchTerm && ` (filtered from ${Array.isArray(collections) ? collections.length : 0})`}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Add Collection Modal */}
                <CollectionModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onSave={handleAddCollection}
                    allItems={allItems}
                    mode="create"
                />

                {/* Edit Collection Modal */}
                <CollectionModal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedCollection(null);
                    }}
                    onSave={handleUpdateCollection}
                    allItems={allItems}
                    mode="edit"
                    initialData={selectedCollection}
                />
            </div>
        </>
    );
};

// Collection Modal Component
const CollectionModal = ({
                             isOpen,
                             onClose,
                             onSave,
                             allItems = [],
                             mode = 'create',
                             initialData = null
                         }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'featured',
        itemIds: [],
        isActive: true,
        eventDate: '',
        displayOrder: 0
    });

    const [errors, setErrors] = useState({});
    const [itemSearch, setItemSearch] = useState('');

    const collectionTypes = [
        { value: 'featured', label: 'Featured Collection', description: 'Highlight special products' },
        { value: 'seasonal', label: 'Seasonal Collection', description: 'Season-specific items' },
        { value: 'event', label: 'Event Collection', description: 'For special events' },
        { value: 'sale', label: 'Sale Collection', description: 'Promotional items' },
        { value: 'bundle', label: 'Bundle Collection', description: 'Product bundles' }
    ];

    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setFormData({
                name: initialData.name || '',
                description: initialData.description || '',
                type: initialData.type || 'featured',
                itemIds: initialData.itemIds || [],
                isActive: initialData.isActive !== undefined ? initialData.isActive : true,
                eventDate: initialData.eventDate || '',
                displayOrder: initialData.displayOrder || 0
            });
        } else if (mode === 'create') {
            setFormData({
                name: '',
                description: '',
                type: 'featured',
                itemIds: [],
                isActive: true,
                eventDate: '',
                displayOrder: 0
            });
        }
        setErrors({});
        setItemSearch('');
    }, [mode, initialData, isOpen]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Collection name is required';
        }

        if (formData.itemIds.length === 0) {
            newErrors.items = 'Please select at least one item for the collection';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the form errors');
            return;
        }

        const submitData = {
            ...formData,
            name: formData.name.trim(),
            description: formData.description.trim()
        };

        onSave(submitData);
    };

    const toggleItemSelection = (itemId) => {
        setFormData(prev => ({
            ...prev,
            itemIds: prev.itemIds.includes(itemId)
                ? prev.itemIds.filter(id => id !== itemId)
                : [...prev.itemIds, itemId]
        }));
    };

    const filteredItems = Array.isArray(allItems) ? allItems.filter(item =>
        item?.name?.toLowerCase().includes(itemSearch.toLowerCase()) ||
        item?.category?.toLowerCase().includes(itemSearch.toLowerCase())
    ) : [];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Star className="w-6 h-6 text-white" />
                        <h2 className="text-xl font-bold text-white">
                            {mode === 'create' ? 'Create Collection' : 'Edit Collection'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1 transition-all duration-200"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div className="bg-gray-50 rounded-2xl p-6 space-y-6">
                            <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Collection Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                                            errors.name
                                                ? 'border-red-500 focus:ring-red-500'
                                                : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                                        }`}
                                        placeholder="e.g., Summer Sale 2024"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Collection Type
                                    </label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    >
                                        {collectionTypes.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    rows="3"
                                    placeholder="Describe this collection..."
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Event Date (Optional)
                                    </label>
                                    <input
                                        type="date"
                                        name="eventDate"
                                        value={formData.eventDate}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Display Order
                                    </label>
                                    <input
                                        type="number"
                                        name="displayOrder"
                                        value={formData.displayOrder}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        min="0"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <label className="ml-3 text-gray-700 font-medium">
                                    Active (visible to customers)
                                </label>
                            </div>
                        </div>

                        {/* Item Selection */}
                        <div className="bg-gray-50 rounded-2xl p-6 space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-800">Select Items</h3>
                                <div className="text-sm text-gray-600">
                                    {formData.itemIds.length} selected
                                </div>
                            </div>

                            {errors.items && (
                                <p className="text-sm text-red-600">{errors.items}</p>
                            )}

                            {/* Search Items */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    value={itemSearch}
                                    onChange={(e) => setItemSearch(e.target.value)}
                                    placeholder="Search items to add..."
                                    className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                            </div>

                            {/* Item List */}
                            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl">
                                {filteredItems.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">
                                        No items found
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-200">
                                        {filteredItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                                                    formData.itemIds.includes(item.id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                                }`}
                                                onClick={() => toggleItemSelection(item.id)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        {item.image ? (
                                                            <img
                                                                src={item.image}
                                                                alt={item.name}
                                                                className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                                                <Package className="w-5 h-5 text-gray-400" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-medium text-gray-900">{item.name}</div>
                                                            <div className="text-sm text-gray-500">
                                                                {item.category} • ${item.price}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.itemIds.includes(item.id)}
                                                        onChange={() => toggleItemSelection(item.id)}
                                                        className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-6 border-t border-gray-200">
                            <button
                                type="submit"
                                className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all duration-200 font-semibold text-lg shadow-lg"
                            >
                                {mode === 'create' ? 'Create Collection' : 'Update Collection'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-200 font-semibold text-lg"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CollectionsManagement;
