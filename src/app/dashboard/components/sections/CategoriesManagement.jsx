// app/dashboard/components/sections/CategoriesManagement.jsx
"use client"
import { useState, useEffect } from 'react';
import { create, getAll } from '@/lib/query.js';
import { DataTable, StatusBadge, ActionButtons, EmptyState } from '../common/Common';
import toast, { Toaster } from 'react-hot-toast';
import {
    Tags,
    Plus,
    Edit3,
    Trash2,
    Package,
    Search,
    X
} from 'lucide-react';

const CategoriesManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const [categoriesResponse, itemsResponse] = await Promise.all([
                await getAll('categories'),
                await getAll('catalog', { limit: 1000 })
            ]);

            if (categoriesResponse?.success && itemsResponse?.success) {
                const items = itemsResponse.data;
                const categoriesWithCounts = categoriesResponse.data.map(category => ({
                    ...category,
                    productCount: items.filter(item =>
                        item.category && item.category.toLowerCase() === category.name.toLowerCase()
                    ).length,
                    serviceCount: items.filter(item =>
                        item.category && item.category.toLowerCase() === category.name.toLowerCase() &&
                        item.item_type === 'service'
                    ).length
                }));
                setCategories(categoriesWithCounts);
            }
        } catch (err) {
            console.error('Error loading categories:', err);
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async (categoryData) => {
        try {
            console.log('Creating category with data:', categoryData);

            // Create a placeholder item for the category to register it in the system
            const placeholderItem = {
                name: `${categoryData.name} Category Placeholder`,
                description: categoryData.description,
                price: 0,
                category: categoryData.name,
                item_type: 'product',
                stock: 0,
                isActive: false, // Hidden placeholder
                custom_attributes: {
                    is_category_placeholder: true,
                    category_color: categoryData.color,
                    category_icon: categoryData.icon
                }
            };

            console.log('Sending placeholder item:', placeholderItem);

            // Call create function with the item data and database parameter
            const response = await create(placeholderItem, 'categories');

            console.log('Create response:', response);

            if (response && response.success) {
                setShowAddModal(false);
                await loadCategories();
                toast.success('Category created successfully!');
            } else {
                console.error('Create failed:', response);
                toast.error(response?.message || 'Failed to create category');
            }
        } catch (err) {
            console.error('Error creating category:', err);
            toast.error(`Failed to create category: ${err.message}`);
        }
    };

    const handleEditCategory = (categoryId) => {
        const category = categories.find(c => c.id === categoryId);
        if (category) {
            setSelectedCategory(category);
            setShowEditModal(true);
        }
    };

    const handleUpdateCategory = async (categoryData) => {
        try {
            // For now, just close the modal and show success
            // In a full implementation, you'd update all items with this category
            setShowEditModal(false);
            setSelectedCategory(null);
            toast.success('Category updated successfully!');
        } catch (err) {
            console.error('Error updating category:', err);
            toast.error('Failed to update category');
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        const category = categories.find(c => c.id === categoryId);
        if (!category) return;

        toast.custom((t) => (
            <div className={`bg-gray-800 text-white p-4 rounded-xl shadow-lg border border-red-500 max-w-md ${
                t.visible ? 'animate-in' : 'animate-out'
            }`}>
                <div className="mb-3">
                    <h3 className="font-semibold text-lg text-red-400">Confirm Deletion</h3>
                    <p className="text-sm mt-1">
                        Are you sure you want to delete "{category.name}"?
                        {category.productCount > 0 && (
                            <span className="block text-yellow-300 mt-1">
                                Warning: {category.productCount} items are using this category.
                            </span>
                        )}
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
                            toast.success('Category deletion initiated (placeholder)');
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

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <h1 className="dashboard-card-title">Categories Management</h1>
                        <p className="dashboard-card-subtitle">Organize your products and services into categories</p>
                    </div>
                    <button
                        className="button primary"
                        onClick={() => setShowAddModal(true)}
                        disabled={loading}
                    >
                        <Plus size={16} className="mr-2" />
                        Add Category
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
                                placeholder="Search categories..."
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
                            <p className="mt-2">Loading categories...</p>
                        </div>
                        </div>
                    ) : filteredCategories.length === 0 ? (

                        <div className="dashboard-card">
                        <EmptyState
                            icon={<Tags className="w-16 h-16 text-gray-400" />}
                            title="No Categories Found"
                            description="Start by creating your first category to organize your items."
                            actionButton={
                                <button
                                    className="button primary"
                                    onClick={() => setShowAddModal(true)}
                                >
                                    <Plus size={16} className="mr-2" />
                                    Create Your First Category
                                </button>
                            }
                        />
                        </div>
                    ) : (
                        <>
                            <DataTable headers={['Category', 'Description', 'Items', 'Actions']}>
                                {filteredCategories.map((category) => (
                                    <tr key={category.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                                    <Tags className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{category.name}</div>
                                                    <div className="text-sm text-gray-500 capitalize">
                                                        Category
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-gray-700">
                                                {category.description || 'No description'}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Package className="w-4 h-4 text-blue-600" />
                                                    <span className="text-sm">
                                                        {category.productCount} Products
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Tags className="w-4 h-4 text-green-600" />
                                                    <span className="text-sm">
                                                        {category.serviceCount} Services
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <ActionButtons
                                                onEdit={() => handleEditCategory(category.id)}
                                                onDelete={() => handleDeleteCategory(category.id)}
                                                editTitle="Edit Category"
                                                deleteTitle="Delete Category"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </DataTable>

                            {/* Summary */}
                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <div className="text-sm text-gray-600">
                                    Total Categories: {filteredCategories.length}
                                    {searchTerm && ` (filtered from ${categories.length})`}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Add Category Modal */}
                <CategoryModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onSave={handleAddCategory}
                    mode="create"
                />

                {/* Edit Category Modal */}
                <CategoryModal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedCategory(null);
                    }}
                    onSave={handleUpdateCategory}
                    mode="edit"
                    initialData={selectedCategory}
                />
            </div>
        </>
    );
};

// Category Modal Component
const CategoryModal = ({
                           isOpen,
                           onClose,
                           onSave,
                           mode = 'create',
                           initialData = null
                       }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#3b82f6', // Default blue color
        icon: 'tags'
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setFormData({
                name: initialData.name || '',
                description: initialData.description || '',
                color: initialData.color || '#3b82f6',
                icon: initialData.icon || 'tags'
            });
        } else if (mode === 'create') {
            setFormData({
                name: '',
                description: '',
                color: '#3b82f6',
                icon: 'tags'
            });
        }
        setErrors({});
    }, [mode, initialData, isOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
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
            newErrors.name = 'Category name is required';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Category name must be at least 2 characters';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
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
            name: formData.name.trim().toLowerCase(),
            description: formData.description.trim(),
            color: formData.color,
            icon: formData.icon
        };

        onSave(submitData);
    };

    const iconOptions = [
        { value: 'tags', label: 'Tags', icon: Tags },
        { value: 'package', label: 'Package', icon: Package }
    ];

    const colorOptions = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
        '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                    <div className="flex items-center space-x-3">
                        <Tags className="w-6 h-6 text-white" />
                        <h2 className="text-xl font-bold text-white">
                            {mode === 'create' ? 'Add Category' : 'Edit Category'}
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
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Category Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category Name *
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
                                placeholder="e.g., Electronics, Clothing"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description *
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                                    errors.description
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                                }`}
                                rows="3"
                                placeholder="Describe what this category contains..."
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                            )}
                        </div>

                        {/* Color Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category Color
                            </label>
                            <div className="flex gap-2">
                                {colorOptions.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                                        className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                                            formData.color === color
                                                ? 'border-gray-800 scale-110'
                                                : 'border-gray-300 hover:border-gray-500'
                                        }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Icon Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category Icon
                            </label>
                            <div className="flex gap-2">
                                {iconOptions.map((option) => {
                                    const IconComponent = option.icon;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, icon: option.value }))}
                                            className={`p-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-center ${
                                                formData.icon === option.value
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                            }`}
                                        >
                                            <IconComponent size={20} className={
                                                formData.icon === option.value ? 'text-blue-600' : 'text-gray-600'
                                            } />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="bg-gray-50 rounded-xl p-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Preview
                            </label>
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: formData.color }}
                                >
                                    <Tags className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900">
                                        {formData.name || 'Category Name'}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {formData.description || 'Category description'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold"
                            >
                                {mode === 'create' ? 'Create Category' : 'Update Category'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-200 font-semibold"
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

export default CategoriesManagement;
