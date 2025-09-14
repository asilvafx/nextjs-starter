// app/dashboard/components/modals/ProductModal.jsx
"use client"
import { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { X, Upload, Image as ImageIcon, Star, Trash2, Plus } from 'lucide-react';

const ProductModal = ({
                          isOpen,
                          onClose,
                          onSave,
                          categories = [],
                          mode = 'create',
                          initialData = null
                      }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        item_type: 'product',
        stock: -1,
        isActive: true,
        images: [], // Changed from single image to array
        coverImageId: null, // ID of the cover image
        featured: false,

        // Product specific
        unit_type: 'piece',
        colors: [],
        sizes: [],
        is_digital: false,
        download_url: '',
        download_instructions: '',

        // Service specific
        duration: '',
        duration_type: 'fixed',
        location_type: 'remote',
        booking_required: false,
        max_bookings_per_day: null,
        service_area: '',
        requirements: '',

        // Custom attributes
        custom_attributes: {}
    });

    const [uploading, setUploading] = useState(false);
    const [colorInput, setColorInput] = useState('');
    const [sizeInput, setSizeInput] = useState('');
    const [customAttrKey, setCustomAttrKey] = useState('');
    const [customAttrValue, setCustomAttrValue] = useState('');
    const fileInputRef = useRef(null);

    // React-Select options
    const categoryOptions = categories.map(cat => ({
        value: cat.name,
        label: cat.name
    }));

    const unitTypeOptions = [
        { value: 'piece', label: 'Piece' },
        { value: 'kg', label: 'Kilogram' },
        { value: 'liter', label: 'Liter' },
        { value: 'meter', label: 'Meter' },
        { value: 'box', label: 'Box' },
        { value: 'pack', label: 'Pack' }
    ];

    const durationTypeOptions = [
        { value: 'fixed', label: 'Fixed Duration' },
        { value: 'hourly', label: 'Per Hour' },
        { value: 'daily', label: 'Per Day' },
        { value: 'custom', label: 'Custom' }
    ];

    const locationTypeOptions = [
        { value: 'remote', label: 'Remote' },
        { value: 'on-site', label: 'On-site' },
        { value: 'both', label: 'Both' }
    ];

    const itemTypeOptions = [
        { value: 'product', label: 'Product' },
        { value: 'service', label: 'Service' }
    ];

    // Custom Select Styles
    const selectStyles = {
        control: (base, state) => ({
            ...base,
            backgroundColor: '#1f2937',
            borderColor: state.isFocused ? '#3b82f6' : '#374151',
            borderRadius: '0.75rem',
            minHeight: '2.75rem',
            boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
            '&:hover': {
                borderColor: '#3b82f6'
            }
        }),
        menu: (base) => ({
            ...base,
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '0.75rem',
            zIndex: 9999
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? '#374151' : 'transparent',
            color: '#f9fafb',
            '&:hover': {
                backgroundColor: '#374151'
            }
        }),
        singleValue: (base) => ({
            ...base,
            color: '#f9fafb'
        }),
        placeholder: (base) => ({
            ...base,
            color: '#9ca3af'
        }),
        input: (base) => ({
            ...base,
            color: '#f9fafb'
        }),
        multiValue: (base) => ({
            ...base,
            backgroundColor: '#374151'
        }),
        multiValueLabel: (base) => ({
            ...base,
            color: '#f9fafb'
        }),
        multiValueRemove: (base) => ({
            ...base,
            color: '#f9fafb',
            '&:hover': {
                backgroundColor: '#ef4444',
                color: '#ffffff'
            }
        })
    };

    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setFormData({
                ...initialData,
                colors: initialData.colors || [],
                sizes: initialData.sizes || [],
                custom_attributes: initialData.custom_attributes || {},
                images: initialData.images || (initialData.image ? [{ id: 'legacy', url: initialData.image }] : []),
                coverImageId: initialData.coverImageId || (initialData.images?.[0]?.id) || null
            });
        } else if (mode === 'create') {
            // Reset form for create mode
            setFormData({
                name: '',
                description: '',
                price: '',
                category: '',
                item_type: 'product',
                stock: 0,
                isActive: true,
                featured: false,
                images: [],
                coverImageId: null,
                unit_type: 'piece',
                colors: [],
                sizes: [],
                is_digital: false,
                download_url: '',
                download_instructions: '',
                duration: '',
                duration_type: 'fixed',
                location_type: 'remote',
                booking_required: false,
                max_bookings_per_day: null,
                service_area: '',
                requirements: '',
                custom_attributes: {}
            });
        }
    }, [mode, initialData, isOpen]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSelectChange = (selectedOption, actionMeta) => {
        setFormData(prev => ({
            ...prev,
            [actionMeta.name]: selectedOption ? selectedOption.value : ''
        }));
    };

    const handleImageUpload = async (files) => {
        if (!files || files.length === 0) return;

        // Validate files before upload
        const maxFileSize = 10 * 1024 * 1024; // 10MB

        for (const file of Array.from(files)) {
            if (file.size > maxFileSize) {
                toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
                return;
            }
        }

        setUploading(true);

        const uploadPromise = new Promise(async (resolve, reject) => {
            try {
                // Create FormData
                const formDataUpload = new FormData();
                Array.from(files).forEach(file => {
                    formDataUpload.append('files', file);
                });

                // Get auth token from cookies (assuming it's stored in httpOnly cookie)
                // or from wherever your app stores it
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formDataUpload,
                    credentials: 'include', // Important for httpOnly cookies
                    headers: {
                        // Don't set Content-Type header - let browser set it with boundary for multipart
                    }
                });

                if (!response.ok) {
                    let errorMessage = 'Upload failed';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.error || errorData.message || errorMessage;
                    } catch (parseError) {
                        // If response isn't JSON, use status text
                        errorMessage = response.statusText || errorMessage;
                    }
                    throw new Error(errorMessage);
                }

                const result = await response.json();

                // Validate response structure
                if (!result.success || !result.data || !Array.isArray(result.data)) {
                    throw new Error('Invalid response format from upload endpoint');
                }

                // Update form data with new images
                setFormData(prev => {
                    const newImages = [...prev.images, ...result.data];
                    return {
                        ...prev,
                        images: newImages,
                        // Set first uploaded image as cover if no cover is set
                        coverImageId: prev.coverImageId || result.data[0]?.id || null
                    };
                });

                resolve(result);

            } catch (error) {
                console.error('Upload error:', error);
                reject(error);
            } finally {
                setUploading(false);
            }
        });

        // Show toast notifications
        toast.promise(uploadPromise, {
            loading: `Uploading ${files.length} image(s)...`,
            success: (data) => {
                const count = data.data?.length || files.length;
                return `${count} image(s) uploaded successfully!`;
            },
            error: (error) => {
                const message = error.message || 'Upload failed';
                console.error('Upload failed:', error);
                return message;
            }
        });

        return uploadPromise;
    };

    const handleFileInputChange = (e) => {
        const files = e.target.files;
        if (files) {
            handleImageUpload(files);
        }
    };

    const removeImage = (imageId) => {
        setFormData(prev => {
            const newImages = prev.images.filter(img => img.id !== imageId);
            return {
                ...prev,
                images: newImages,
                coverImageId: prev.coverImageId === imageId ? (newImages[0]?.id || null) : prev.coverImageId
            };
        });
        toast.success('Image removed');
    };

    const setCoverImage = (imageId) => {
        setFormData(prev => ({
            ...prev,
            coverImageId: imageId
        }));
        toast.success('Cover image updated');
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.name.trim() || !formData.price) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (formData.item_type === 'product' && formData.is_digital && !formData.download_url.trim()) {
            toast.error('Digital products require a download URL');
            return;
        }

        // Prepare data for submission
        const submitData = {
            ...formData,
            price: parseFloat(formData.price),
            stock: formData.item_type === 'service' ? 0 : parseInt(formData.stock) || 0,
            max_bookings_per_day: formData.max_bookings_per_day ? parseInt(formData.max_bookings_per_day) : null,
            duration: formData.duration ? parseInt(formData.duration) : null,
            // Keep backward compatibility by setting main image field
            image: formData.images.find(img => img.id === formData.coverImageId)?.url || formData.images[0]?.url || ''
        };

        const savePromise = new Promise(async (resolve, reject) => {
            try {
                await onSave(submitData);
                resolve();
            } catch (error) {
                reject(error);
            }
        });

        toast.promise(savePromise, {
            loading: mode === 'create' ? 'Creating item...' : 'Updating item...',
            success: mode === 'create' ? 'Item created successfully!' : 'Item updated successfully!',
            error: (error) => error.message || 'Failed to save item'
        });
    };

    const addColor = () => {
        if (colorInput.trim() && !formData.colors.includes(colorInput.trim())) {
            setFormData(prev => ({
                ...prev,
                colors: [...prev.colors, colorInput.trim()]
            }));
            setColorInput('');
            toast.success('Color added');
        }
    };

    const removeColor = (colorToRemove) => {
        setFormData(prev => ({
            ...prev,
            colors: prev.colors.filter(color => color !== colorToRemove)
        }));
        toast.success('Color removed');
    };

    const addSize = () => {
        if (sizeInput.trim() && !formData.sizes.includes(sizeInput.trim())) {
            setFormData(prev => ({
                ...prev,
                sizes: [...prev.sizes, sizeInput.trim()]
            }));
            setSizeInput('');
            toast.success('Size added');
        }
    };

    const removeSize = (sizeToRemove) => {
        setFormData(prev => ({
            ...prev,
            sizes: prev.sizes.filter(size => size !== sizeToRemove)
        }));
        toast.success('Size removed');
    };

    const addCustomAttribute = () => {
        if (customAttrKey.trim() && customAttrValue.trim()) {
            setFormData(prev => ({
                ...prev,
                custom_attributes: {
                    ...prev.custom_attributes,
                    [customAttrKey.trim()]: customAttrValue.trim()
                }
            }));
            setCustomAttrKey('');
            setCustomAttrValue('');
            toast.success('Custom attribute added');
        }
    };

    const removeCustomAttribute = (keyToRemove) => {
        setFormData(prev => {
            const newCustomAttributes = { ...prev.custom_attributes };
            delete newCustomAttributes[keyToRemove];
            return {
                ...prev,
                custom_attributes: newCustomAttributes
            };
        });
        toast.success('Custom attribute removed');
    };

    if (!isOpen) return null;

    return (
        <div className="dashboard-modal-overlay">
            <div className="dashboard-modal-content">
                {/* Header */}
                <div className="dashboard-modal-header">
                    <div>
                        <h2 className="text-3xl font-bold text-white">
                            {mode === 'create' ? 'Add New Item' : 'Edit Item'}
                        </h2>
                        <p className="text-blue-100 mt-1">
                            {mode === 'create' ? 'Create a new product or service' : 'Update item details'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="dashboard-modal-close"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="w-full mt-4">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Basic Information */}
                        <div className="rounded-2xl p-4 lg:p-6 space-y-4 lg:space-y-6">
                            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                                <div className="w-2 h-6 bg-blue-500 rounded-full mr-3"></div>
                                Basic Information
                            </h3>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Item Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        placeholder="Enter item name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Item Type *
                                    </label>
                                    <Select
                                        name="item_type"
                                        value={itemTypeOptions.find(option => option.value === formData.item_type)}
                                        onChange={handleSelectChange}
                                        options={itemTypeOptions}
                                        styles={selectStyles}
                                        placeholder="Select item type"
                                        isSearchable={false}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Price * ($)
                                    </label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Category
                                    </label>
                                    <Select
                                        name="category"
                                        value={categoryOptions.find(option => option.value === formData.category) || null}
                                        onChange={handleSelectChange}
                                        options={categoryOptions}
                                        styles={selectStyles}
                                        placeholder="Select category"
                                        isClearable
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    rows="4"
                                    placeholder="Describe your item..."
                                />
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                    className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <label className="ml-3 text-gray-300 font-medium">
                                    Active (visible to customers)
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="featured"
                                    checked={formData.featured}
                                    onChange={handleInputChange}
                                    className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <label className="ml-3 text-gray-300 font-medium">
                                    Featured (Display on Homepage)
                                </label>
                            </div>
                        </div>

                        {/* Image Upload Section */}
                        <div className="rounded-2xl p-4 lg:p-6 space-y-4 lg:space-y-6">
                            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                                <div className="w-2 h-6 bg-green-500 rounded-full mr-3"></div>
                                Images
                            </h3>

                            {/* Upload Area */}
                            <div className="mb-6">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-gray-700/50 transition-all duration-200"
                                >
                                    {uploading ? (
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                    ) : (
                                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    )}
                                    <p className="text-gray-300 font-medium mb-2">
                                        {uploading ? 'Uploading...' : 'Click to upload images or drag and drop'}
                                    </p>
                                    <p className="text-gray-500 text-sm">
                                        PNG, JPG, WebP up to 5MB each
                                    </p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileInputChange}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </div>

                            {/* Image Gallery */}
                            {formData.images.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {formData.images.map((image) => (
                                        <div key={image.id} className="relative group">
                                            <div className="aspect-square bg-gray-700 rounded-xl overflow-hidden">
                                                <img
                                                    src={image.url}
                                                    alt="Product"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            {/* Image Actions */}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex items-center justify-center space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setCoverImage(image.id)}
                                                    className={`p-2 rounded-full transition-all duration-200 ${
                                                        formData.coverImageId === image.id
                                                            ? 'bg-yellow-500 text-white'
                                                            : 'bg-white/20 text-white hover:bg-yellow-500'
                                                    }`}
                                                    title="Set as cover"
                                                >
                                                    <Star size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(image.id)}
                                                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200"
                                                    title="Remove image"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            {/* Cover Badge */}
                                            {formData.coverImageId === image.id && (
                                                <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                                    Cover
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Specific Fields */}
                        {formData.item_type === 'product' && (
                            <div className="rounded-2xl p-4 lg:p-6 space-y-4 lg:space-y-6">
                                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                                    <div className="w-2 h-6 bg-purple-500 rounded-full mr-3"></div>
                                    Product Details
                                </h3>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Stock Quantity
                                        </label>
                                        <input
                                            type="number"
                                            name="stock"
                                            value={formData.stock}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                            min="-1"
                                            placeholder="0"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Unit Type
                                        </label>
                                        <Select
                                            name="unit_type"
                                            value={unitTypeOptions.find(option => option.value === formData.unit_type)}
                                            onChange={handleSelectChange}
                                            options={unitTypeOptions}
                                            styles={selectStyles}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="is_digital"
                                        checked={formData.is_digital}
                                        onChange={handleInputChange}
                                        className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                                    />
                                    <label className="ml-3 text-gray-300 font-medium">
                                        Digital Download Product
                                    </label>
                                </div>

                                {formData.is_digital && (
                                    <div className="space-y-4 bg-gray-700/50 rounded-xl p-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Download URL *
                                            </label>
                                            <input
                                                type="url"
                                                name="download_url"
                                                value={formData.download_url}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                placeholder="https://example.com/download"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Download Instructions
                                            </label>
                                            <textarea
                                                name="download_instructions"
                                                value={formData.download_instructions}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                rows="3"
                                                placeholder="Instructions for downloading..."
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Colors */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-3">
                                        Available Colors
                                    </label>
                                    <div className="flex gap-3 mb-4">
                                        <input
                                            type="text"
                                            value={colorInput}
                                            onChange={(e) => setColorInput(e.target.value)}
                                            placeholder="Add color..."
                                            className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                                        />
                                        <button
                                            type="button"
                                            onClick={addColor}
                                            className="px-6 py-3 bg-neutral-100 text-black rounded-xl transition-all duration-200 flex items-center gap-2"
                                        >
                                            <Plus color="black" size={16} />
                                            Add
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.colors.map((color) => (
                                            <span
                                                key={color}
                                                className="bg-neutral-900 text-white px-2 py-1 rounded-full text-sm flex items-center gap-2 hover:bg-neutral-900/70 transition-all duration-200"
                                            >
                                                {color}
                                                <button
                                                    type="button"
                                                    onClick={() => removeColor(color)}
                                                    className="border-0"
                                                >
                                                    <X color="white" size={14} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Sizes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-3">
                                        Available Sizes
                                    </label>
                                    <div className="flex gap-3 mb-4">
                                        <input
                                            type="text"
                                            value={sizeInput}
                                            onChange={(e) => setSizeInput(e.target.value)}
                                            placeholder="Add size..."
                                            className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                                        />
                                        <button
                                            type="button"
                                            onClick={addSize}
                                            className="px-6 py-3 bg-neutral-100 text-black rounded-xl transition-all duration-200 flex items-center gap-2"
                                        >
                                            <Plus color="black" size={16} />
                                            Add
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.sizes.map((size) => (
                                            <span
                                                key={size}
                                                className="bg-neutral-900 text-white px-2 py-1 rounded-full text-sm flex items-center gap-2 hover:bg-neutral-900/70 transition-all duration-200"
                                            >
                                                {size}
                                                <button
                                                    type="button"
                                                    onClick={() => removeSize(size)}
                                                    className="border-0"
                                                >
                                                    <X color="white" size={14} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Service Specific Fields */}
                        {formData.item_type === 'service' && (
                            <div className="rounded-2xl p-4 lg:p-6 space-y-4 lg:space-y-6">
                                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                                    <div className="w-2 h-6 bg-cyan-500 rounded-full mr-3"></div>
                                    Service Details
                                </h3>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Duration (minutes)
                                        </label>
                                        <input
                                            type="number"
                                            name="duration"
                                            value={formData.duration}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                            min="0"
                                            placeholder="60"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Duration Type
                                        </label>
                                        <Select
                                            name="duration_type"
                                            value={durationTypeOptions.find(option => option.value === formData.duration_type)}
                                            onChange={handleSelectChange}
                                            options={durationTypeOptions}
                                            styles={selectStyles}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Location Type
                                        </label>
                                        <Select
                                            name="location_type"
                                            value={locationTypeOptions.find(option => option.value === formData.location_type)}
                                            onChange={handleSelectChange}
                                            options={locationTypeOptions}
                                            styles={selectStyles}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Max Bookings Per Day
                                        </label>
                                        <input
                                            type="number"
                                            name="max_bookings_per_day"
                                            value={formData.max_bookings_per_day || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                            min="1"
                                            placeholder="5"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="booking_required"
                                        checked={formData.booking_required}
                                        onChange={handleInputChange}
                                        className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                                    />
                                    <label className="ml-3 text-gray-300 font-medium">
                                        Advance Booking Required
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Service Area
                                    </label>
                                    <input
                                        type="text"
                                        name="service_area"
                                        value={formData.service_area}
                                        onChange={handleInputChange}
                                        placeholder="e.g., City-wide, 50km radius, etc."
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Requirements/Prerequisites
                                    </label>
                                    <textarea
                                        name="requirements"
                                        value={formData.requirements}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        rows="4"
                                        placeholder="List any requirements or prerequisites for this service..."
                                    />
                                </div>
                            </div>
                        )}

                        {/* Custom Attributes */}
                        <div className="rounded-2xl p-4 lg:p-6 space-y-4 lg:space-y-6">
                            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                                <div className="w-2 h-6 bg-orange-500 rounded-full mr-3"></div>
                                Custom Attributes
                            </h3>

                            <div className="flex gap-3 mb-4">
                                <input
                                    type="text"
                                    value={customAttrKey}
                                    onChange={(e) => setCustomAttrKey(e.target.value)}
                                    placeholder="Attribute name..."
                                    className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                                <input
                                    type="text"
                                    value={customAttrValue}
                                    onChange={(e) => setCustomAttrValue(e.target.value)}
                                    placeholder="Attribute value..."
                                    className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAttribute())}
                                />
                                <button
                                    type="button"
                                    onClick={addCustomAttribute}
                                    className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all duration-200 flex items-center gap-2"
                                >
                                    <Plus size={16} />
                                    Add
                                </button>
                            </div>

                            <div className="space-y-3">
                                {Object.entries(formData.custom_attributes).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                                        <span className="text-gray-300">
                                            <strong className="text-white">{key}:</strong> {value}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeCustomAttribute(key)}
                                            className="text-red-400 hover:text-red-300 p-1 hover:bg-red-500/10 rounded transition-all duration-200"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="dashboard-modal-footer">
                            <button
                                type="submit"
                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold text-lg shadow-lg"
                            >
                                {mode === 'create' ? 'Create Item' : 'Update Item'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-8 py-4 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 hover:text-white transition-all duration-200 font-semibold text-lg"
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

export default ProductModal;
