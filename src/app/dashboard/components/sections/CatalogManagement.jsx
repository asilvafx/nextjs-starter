// app/dashboard/components/sections/CatalogManagement.jsx
"use client"
import { useState, useEffect, useRef, useCallback } from 'react';
import {getAll, create, update, remove} from '@/lib/client/query.js';
import ProductModal from '../modals/ProductModal';
import { DataTable, StatusBadge, ActionButtons, EmptyState } from '../common/Common';
import {toast} from 'sonner';
import { Box } from 'lucide-react';
import SkeletonItems from '../skeletons/SkeletonItems';
import SkeletonSearch from '../skeletons/SkeletonSearch';

const CatalogManagement = () => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productList, setProductList] = useState([]);
    const [categories, setCategories] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [error, setError] = useState(null);

    // Separate loading states
    const [loadingItems, setLoadingItems] = useState(true);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [isSearching, setIsSearching] = useState(false);

    // Refs to prevent double API calls
    const itemsLoadedRef = useRef(false);
    const categoriesLoadedRef = useRef(false);
    const searchTimeoutRef = useRef(null);
    const mountedRef = useRef(true);


    // Fixed loadItems function - removed productList.length dependency
    const loadItems = useCallback(async (isInitialLoad = false) => {


        // Prevent double calls on initial load
        if (isInitialLoad && itemsLoadedRef.current) return;
        if (isInitialLoad) itemsLoadedRef.current = true;

        // Don't proceed if component is unmounted
        if (!mountedRef.current) return;

        try {
            setLoadingItems(true);

            const params = {
                page: currentPage,
                limit: 10,
                ...(searchTerm && { search: searchTerm }),
                ...(filterCategory && { category: filterCategory })
            };

            const response = await getAll('catalog', params);

            // Check if component is still mounted before updating state
            if (!mountedRef.current) return;

            if (response && response.success) {
                setProductList(response.data);
                setTotalPages(response.pagination.totalPages);
            }
        } catch (err) {
            if (!mountedRef.current) return;
            console.error('Error loading items:', err);
            toast.error('Failed to load items');
            // Reset ref on error so user can retry
            if (isInitialLoad) itemsLoadedRef.current = false;
        } finally {
            if (mountedRef.current) {
                setLoadingItems(false);
            }
        }
    }, [currentPage, searchTerm, filterCategory, getAll]);

    // Fixed loadCategories function
    const loadCategories = useCallback(async () => {

        // Prevent double calls
        if (categoriesLoadedRef.current) return;
        categoriesLoadedRef.current = true;

        // Don't proceed if component is unmounted
        if (!mountedRef.current) return;

        try {
            setLoadingCategories(true);

            const response = await getAll('categories');

            // Check if component is still mounted before updating state
            if (!mountedRef.current) return;

            if (response && response.success) {
                setCategories(response.data);
            }
        } catch (err) {
            if (!mountedRef.current) return;
            console.error('Error loading categories:', err);
            toast.error('Failed to load categories');
            // Reset ref on error so user can retry
            categoriesLoadedRef.current = false;
        } finally {
            if (mountedRef.current) {
                setLoadingCategories(false);
            }
        }
    }, [getAll]);

    // Initial load effect - only runs once
    useEffect(() => {
        mountedRef.current = true;

        loadItems(true); // Initial load
        loadCategories();

        // Cleanup function
        return () => {
            mountedRef.current = false;
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []); // Empty dependency array - only run once

    // Effect for pagination and filtering changes - removed loadItems dependency
    useEffect(() => {
        // Only trigger if we've had an initial load and the component is mounted
        if (itemsLoadedRef.current && mountedRef.current) {
            loadItems(false); // Not initial load
        }
    }, [currentPage, searchTerm, filterCategory]); // Removed loadItems from dependencies

    // Retry functions
    const retryLoadItems = useCallback(() => {
        itemsLoadedRef.current = false;
        loadItems(true);
    }, [loadItems]);

    const retryLoadCategories = useCallback(() => {
        categoriesLoadedRef.current = false;
        loadCategories();
    }, [loadCategories]);

    const handleAddProduct = async (productData) => {
        try {
            const response = await create(productData, 'catalog');
            if (response && response.success) {
                setShowAddModal(false);
                await loadItems(); // Refresh the list
            }
        } catch (err) {
            console.error('Error creating product:', err);
            // Error toast is already handled in ProductModal via toast.promise
        }
    };

    const handleEditProduct = async (productId) => {
        const product = productList.find(p => p.id === productId);
        if (product) {
            setSelectedProduct(product);
            setShowEditModal(true);
        }
    };

    const handleUpdateProduct = async (productData) => {
        try {
            const response = await update(selectedProduct.id, productData, 'catalog');
            if (response && response.success) {
                setShowEditModal(false);
                setSelectedProduct(null);
                await loadItems(); // Refresh the list
            }
        } catch (err) {
            console.error('Error updating product:', err);
            // Error toast is already handled in ProductModal via toast.promise
        }
    };

    const handleViewProduct = (productId) => {
        const product = productList.find(p => p.id === productId);
        if (product) {
            // Create a more detailed view toast
            toast.custom((t) => (
                <div className={`bg-gray-800 text-white p-4 rounded-xl shadow-lg border border-gray-700 max-w-md ${
                    t.visible ? 'animate-in' : 'animate-out'
                }`}>
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="text-gray-400 hover:text-white"
                        >
                            ×
                        </button>
                    </div>
                    <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Price:</span> ${product.price}</p>
                        <p><span className="font-medium">Category:</span> {product.category}</p>
                        <p><span className="font-medium">Type:</span> {product.item_type}</p>
                        {product.description && (
                            <p><span className="font-medium">Description:</span> {product.description}</p>
                        )}
                    </div>
                </div>
            ), {
                duration: 5000,
                position: 'top-center'
            });
        }
    };

    const handleDeleteProduct = async (productId) => {
        const product = productList.find(p => p.id === productId);
        if (!product) return;

        // Custom confirmation toast
        toast.custom((t) => (
            <div className={`bg-gray-800 text-white p-4 rounded-xl shadow-lg border border-red-500 max-w-md ${
                t.visible ? 'animate-in' : 'animate-out'
            }`}>
                <div className="mb-3">
                    <h3 className="font-semibold text-lg text-red-400">Confirm Deletion</h3>
                    <p className="text-sm mt-1">
                        Are you sure you want to delete "{product.name}"? This action cannot be undone.
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

                            const deletePromise = new Promise(async (resolve, reject) => {
                                try {
                                    const response = await remove(productId, "catalog");
                                    if (response && response.success) {
                                        await loadItems();
                                        resolve();
                                    } else {
                                        reject(new Error('Failed to delete item'));
                                    }
                                } catch (error) {
                                    reject(error);
                                }
                            });

                            toast.promise(deletePromise, {
                                loading: 'Deleting item...',
                                success: 'Item deleted successfully!',
                                error: 'Failed to delete item'
                            });
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

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1); // Reset to first page when searching
        setIsSearching(true);

        // Add a small delay to show searching state
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
                setIsSearching(false);
            }
        }, 500);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const formatPrice = (price) => {
        return typeof price === 'number' ? `$${price.toFixed(2)}` : price;
    };

    const formatStock = (stock, itemType) => {
        if (itemType === 'service') return 'N/A';
        return stock || 0;
    };

    const isLoading = loadingItems || loadingCategories;

    return (
        <>
            <div className="fade-in">
                <div className="dashboard-card-header">
                    <div>
                        <h1 className="dashboard-card-title">Store Management</h1>
                        <p className="dashboard-card-subtitle">Manage your products and services catalog</p>
                    </div>
                    <button
                        className="button primary"
                        onClick={() => setShowAddModal(true)}
                        disabled={isLoading}
                    >
                        Add Item
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <div className="flex items-center justify-between">
                            <span>Error: {error}</span>
                            <div className="space-x-2">
                                <button
                                    onClick={retryLoadItems}
                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                                    disabled={loadingItems}
                                >
                                    {loadingItems ? 'Retrying Items...' : 'Retry Items'}
                                </button>
                                <button
                                    onClick={retryLoadCategories}
                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                                    disabled={loadingCategories}
                                >
                                    {loadingCategories ? 'Retrying Categories...' : 'Retry Categories'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search and Filters */}
                {loadingCategories ? (
                        <SkeletonSearch />
                ) : (
                    <div className="dashboard-card mb-4">
                        <form onSubmit={handleSearch} className="w-full flex flex-col lg:flex-row flex-nowrap items-center gap-4">
                            <div className="w-full lg:w-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium mb-2">Search Items</label>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search by name or description..."
                                        className="input"
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium mb-2">Category</label>
                                    <select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        className="input"
                                        disabled={isLoading}
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map((category) => (
                                            <option key={category.id || category.name} value={category.name}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="w-full lg:w-auto flex items-center gap-4 ms-auto">
                                <div>
                                    <button
                                        type="submit"
                                        className="button secondary w-full lg:w-auto"
                                        disabled={isLoading || isSearching}
                                    >
                                        {isSearching ? 'Searching...' : (loadingItems ? 'Loading...' : 'Search')}
                                    </button>
                                </div>
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchTerm('');
                                            setFilterCategory('');
                                            setCurrentPage(1);
                                        }}
                                        className="button outline w-full lg:w-auto"
                                        disabled={isLoading}
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                        </form>
                    </div>
                )}

                {loadingItems ? (
                    <SkeletonItems />
                ) : productList.length === 0 ? (
                    <EmptyState
                        icon={<Box className="w-16 h-16 text-gray-400" />}
                        title="No Items Found"
                        description="Start by adding your first product or service to the catalog."
                        actionButton={
                            <button
                                className="button primary"
                                onClick={() => setShowAddModal(true)}
                            >
                                Add Your First Item
                            </button>
                        }
                    />
                ) : (
                    <>
                        <DataTable headers={['Item', 'Type', 'Category', 'Price', 'Stock', 'Status', 'Actions']}>
                            {productList.map((product) => (
                                <tr key={product.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            {/* Product Image */}
                                            {product.images?.length > 0 || product.image ? (
                                                <img
                                                    src={product.images?.[0]?.url || product.image}
                                                    alt={product.name}
                                                    className="w-12 h-12 rounded-lg object-cover border border-gray-300"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                                    <span className="text-gray-400 text-xs">No Image</span>
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-medium">{product.name}</div>
                                                {product.description && (
                                                    <div className="text-sm text-gray-600 truncate max-w-xs">
                                                        {product.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            product.item_type === 'service'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-green-100 text-green-800'
                                        }`}>
                                            {product.item_type === 'service' ? 'Service' : 'Product'}
                                        </span>
                                    </td>
                                    <td>{product.category}</td>
                                    <td>{formatPrice(product.price)}</td>
                                    <td>{formatStock(product.stock, product.item_type)}</td>
                                    <td>
                                        <StatusBadge status={product.isActive ? 'active' : 'inactive'} />
                                    </td>
                                    <td>
                                        <ActionButtons
                                            onEdit={() => handleEditProduct(product.id)}
                                            onView={() => handleViewProduct(product.id)}
                                            onDelete={() => handleDeleteProduct(product.id)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </DataTable>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-between items-center mt-4 pt-4 border-t">
                                <div className="text-sm text-gray-600">
                                    Page {currentPage} of {totalPages}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1 || loadingItems}
                                        className="button outline small"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages || loadingItems}
                                        className="button outline small"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Add Item Modal */}
                <ProductModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onSave={handleAddProduct}
                    categories={categories}
                    mode="create"
                />

                {/* Edit Item Modal */}
                <ProductModal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedProduct(null);
                    }}
                    onSave={handleUpdateProduct}
                    categories={categories}
                    mode="edit"
                    initialData={selectedProduct}
                />

            </div>
        </>
    );
};

export default CatalogManagement;
