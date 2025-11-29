'use client';

import { Image as ImageIcon, Loader2, Plus, Shuffle, Star, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { getAllAttributes } from '@/lib/server/admin';

const ITEM_TYPES = [
    { value: 'physical', label: 'Physical Product' },
    { value: 'digital', label: 'Digital Product' },
    { value: 'service', label: 'Service' }
];

const generateSlug = (name) => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/(^-|-$)/g, ''); // Remove leading/trailing hyphens
};

const generateSKU = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `SKU-${timestamp}-${random}`;
};

export function CatalogItemForm({
    formData,
    setFormData,
    categories,
    collections,
    availableLanguages = ['en'],
    defaultLanguage = 'en',
    onSubmit,
    onImageUpload,
    editItem,
    isSubmitting = false,
    uploadingImages = false,
    uploadProgress = 0
}) {
    const [customAttributes, setCustomAttributes] = useState(() => {
        // Initialize custom attributes with multi-language support
        const attrs = formData.customAttributes || [{ name: '', nameML: {}, value: '', valueML: {} }];
        return attrs.map(attr => ({
            name: attr.name || '',
            nameML: attr.nameML || {},
            value: attr.value || '',
            valueML: attr.valueML || {}
        }));
    });
    const [availableAttributes, setAvailableAttributes] = useState([]);
    const [unlimitedStock, setUnlimitedStock] = useState(formData.stock === -1);
    const [currentLanguage, setCurrentLanguage] = useState(defaultLanguage);

    useEffect(() => {
        const fetchAttributes = async () => {
            try {
                const response = await getAllAttributes();
                if (response.success) {
                    setAvailableAttributes(response.data.filter((attr) => attr.isActive));
                }
            } catch (error) {
                console.error('Failed to fetch attributes:', error);
            }
        };
        fetchAttributes();
    }, []);

    // Sync customAttributes when formData changes (for edit mode) - only on mount
    useEffect(() => {
        if (editItem && formData.customAttributes) {
            setCustomAttributes(formData.customAttributes.map(attr => ({
                name: attr.name || '',
                nameML: attr.nameML || {},
                value: attr.value || '',
                valueML: attr.valueML || {}
            })));
        }
    }, [editItem]);

    const addAttribute = () => {
        const newAttributes = [
            ...customAttributes, 
            { 
                name: '', 
                nameML: {}, 
                value: '',
                valueML: {}
            }
        ];
        setCustomAttributes(newAttributes);
        setFormData({
            ...formData,
            customAttributes: newAttributes
        });
    };

    const removeAttribute = (index) => {
        const newAttributes = customAttributes.filter((_, i) => i !== index);
        setCustomAttributes(newAttributes);
        setFormData({
            ...formData,
            customAttributes: newAttributes
        });
    };

    const updateAttribute = (index, field, value) => {
        const newAttributes = [...customAttributes];
        newAttributes[index][field] = value;
        setCustomAttributes(newAttributes);
        setFormData({
            ...formData,
            customAttributes: newAttributes.filter((attr) => attr.name && attr.value)
        });
    };

    // Multi-language helper functions for attributes
    const updateAttributeMultiLanguageField = (attrIndex, fieldName, langCode, value) => {
        const newAttributes = [...customAttributes];
        const mlField = `${fieldName}ML`;
        
        if (!newAttributes[attrIndex][mlField]) {
            newAttributes[attrIndex][mlField] = {};
        }
        
        newAttributes[attrIndex][mlField][langCode] = value;
        
        // Update the main field with default language value for backwards compatibility
        if (langCode === defaultLanguage) {
            newAttributes[attrIndex][fieldName] = value;
        }
        
        setCustomAttributes(newAttributes);
        setFormData({
            ...formData,
            customAttributes: newAttributes.filter((attr) => attr.name && attr.value)
        });
    };

    const getAttributeMultiLanguageValue = (attrIndex, fieldName, langCode) => {
        if (!customAttributes[attrIndex]) return '';
        const mlField = `${fieldName}ML`;
        return customAttributes[attrIndex][mlField]?.[langCode] || 
               (langCode === defaultLanguage ? customAttributes[attrIndex][fieldName] : '') || '';
    };

    const handleImageUploadLocal = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        try {
            if (onImageUpload) {
                await onImageUpload(files);
                // Success message is now handled in the parent component
                // Reset the input value to allow re-uploading the same file
                event.target.value = '';
            }
        } catch (error) {
            console.error('Image upload error:', error);
            toast.error('Failed to upload images');
        }
    };

    const handleCoverImageChange = (index) => {
        setFormData({ ...formData, coverImageIndex: index });
    };

    const removeImage = (index) => {
        const newImages = formData.images.filter((_, i) => i !== index);
        const newCoverIndex = formData.coverImageIndex >= newImages.length ? 0 : formData.coverImageIndex;
        setFormData({
            ...formData,
            images: newImages,
            coverImageIndex: newCoverIndex
        });
    };

    // Multi-language helper functions
    const updateMultiLanguageField = (fieldName, langCode, value) => {
        const mlField = `${fieldName}ML`;
        setFormData({
            ...formData,
            [mlField]: {
                ...formData[mlField],
                [langCode]: value
            },
            // Update the main field with default language value for backwards compatibility
            [fieldName]: langCode === defaultLanguage ? value : formData[fieldName]
        });
    };

    const getMultiLanguageValue = (fieldName, langCode) => {
        const mlField = `${fieldName}ML`;
        return formData[mlField]?.[langCode] || (langCode === defaultLanguage ? formData[fieldName] : '') || '';
    };

    const updateSEOMultiLanguageField = (fieldName, langCode, value) => {
        const mlField = `${fieldName}ML`;
        setFormData({
            ...formData,
            seo: {
                ...formData.seo,
                [mlField]: {
                    ...formData.seo[mlField],
                    [langCode]: value
                },
                // Update the main field with default language value for backwards compatibility
                [fieldName]: langCode === defaultLanguage ? value : formData.seo[fieldName]
            }
        });
    };

    const getSEOMultiLanguageValue = (fieldName, langCode) => {
        const mlField = `${fieldName}ML`;
        return formData.seo[mlField]?.[langCode] || (langCode === defaultLanguage ? formData.seo[fieldName] : '') || '';
    };

    const handleCollectionChange = (collectionId) => {
        const currentCollections = formData.collections || [];
        const isSelected = currentCollections.includes(collectionId);

        const newCollections = isSelected
            ? currentCollections.filter((id) => id !== collectionId)
            : [...currentCollections, collectionId];

        setFormData({ ...formData, collections: newCollections });
    };

    return (
        <ScrollArea className="h-[80vh]">
            <form onSubmit={onSubmit} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="images">Images</TabsTrigger>
                        <TabsTrigger value="attributes">Attributes</TabsTrigger>
                        <TabsTrigger value="seo">SEO</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="mt-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="type">Item Type *</Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(value) => setFormData({ ...formData, type: value })}
                                            required>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select item type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ITEM_TYPES.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <Label htmlFor="name">Name *</Label>
                                            <div className="flex gap-1">
                                                {availableLanguages.map((lang) => (
                                                    <Button
                                                        key={lang}
                                                        type="button"
                                                        variant={currentLanguage === lang ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => setCurrentLanguage(lang)}
                                                        className="h-6 px-2 text-xs">
                                                        {lang.toUpperCase()}
                                                        {lang === defaultLanguage && (
                                                            <span className="ml-1 text-xs">★</span>
                                                        )}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                        <Input
                                            id="name"
                                            value={getMultiLanguageValue('name', currentLanguage)}
                                            onChange={(e) => {
                                                const name = e.target.value;
                                                updateMultiLanguageField('name', currentLanguage, name);
                                                // Auto-generate slug only for default language
                                                if (currentLanguage === defaultLanguage) {
                                                    const currentSlug = formData.slug;
                                                    const generatedSlug = generateSlug(
                                                        formData.nameML?.[defaultLanguage] || formData.name || ''
                                                    );
                                                    if (!currentSlug || currentSlug === generatedSlug) {
                                                        setFormData((prev) => ({ ...prev, slug: generateSlug(name) }));
                                                    }
                                                }
                                            }}
                                            placeholder={`Enter item name (${currentLanguage.toUpperCase()})`}
                                            required={currentLanguage === defaultLanguage}
                                        />
                                        {currentLanguage !== defaultLanguage && (
                                            <p className="mt-1 text-muted-foreground text-xs">
                                                Translation for {currentLanguage.toUpperCase()}. Leave empty to use
                                                default language.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="slug">Slug</Label>
                                    <Input
                                        id="slug"
                                        value={formData.slug || ''}
                                        onChange={(e) => {
                                            const slug = generateSlug(e.target.value);
                                            setFormData({ ...formData, slug });
                                        }}
                                        placeholder="item-slug"
                                    />
                                    <p className="mt-1 text-muted-foreground text-xs">
                                        URL-friendly version of the name. Auto-generated from name but can be edited.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div>
                                        <Label htmlFor="sku">SKU</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="sku"
                                                value={formData.sku}
                                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                                placeholder="Enter SKU"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setFormData({ ...formData, sku: generateSKU() })}
                                                title="Generate SKU">
                                                <Shuffle className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <p className="mt-1 text-muted-foreground text-xs">
                                            Stock Keeping Unit. Click the button to auto-generate.
                                        </p>
                                    </div>
                                    <div>
                                        <Label htmlFor="price">Price *</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.price}
                                            onChange={(e) =>
                                                setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                                            }
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="comparePrice">Compare at Price</Label>
                                        <Input
                                            id="comparePrice"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.compareAtPrice}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    compareAtPrice: parseFloat(e.target.value) || 0
                                                })
                                            }
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <Label htmlFor="description">Description</Label>
                                        <div className="flex gap-1">
                                            {availableLanguages.map((lang) => (
                                                <Button
                                                    key={lang}
                                                    type="button"
                                                    variant={currentLanguage === lang ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setCurrentLanguage(lang)}
                                                    className="h-6 px-2 text-xs">
                                                    {lang.toUpperCase()}
                                                    {lang === defaultLanguage && (
                                                        <span className="ml-1 text-xs">★</span>
                                                    )}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                    <Textarea
                                        id="description"
                                        value={getMultiLanguageValue('description', currentLanguage)}
                                        onChange={(e) =>
                                            updateMultiLanguageField('description', currentLanguage, e.target.value)
                                        }
                                        placeholder={`Enter item description (${currentLanguage.toUpperCase()})`}
                                        className="h-24"
                                    />
                                    {currentLanguage !== defaultLanguage && (
                                        <p className="mt-1 text-muted-foreground text-xs">
                                            Translation for {currentLanguage.toUpperCase()}. Leave empty to use default
                                            language.
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <Label>Category</Label>
                                        <Select
                                            value={formData.categoryId || 'none'}
                                            onValueChange={(value) =>
                                                setFormData({ ...formData, categoryId: value === 'none' ? '' : value })
                                            }>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No Category</SelectItem>
                                                {categories
                                                    .filter((category) => category.id && category.name)
                                                    .map((category) => (
                                                        <SelectItem key={category.id} value={category.id}>
                                                            {category.name}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Collections</Label>
                                        <div className="mt-2 space-y-2">
                                            <div className="flex flex-wrap gap-2">
                                                {(formData.collections || []).map((collectionId) => {
                                                    const collection = collections.find((c) => c.id === collectionId);
                                                    return collection ? (
                                                        <Badge key={collectionId} variant="secondary" className="gap-1">
                                                            {collection.name}
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleCollectionChange(collectionId)}
                                                                className="h-auto p-0 hover:bg-transparent">
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </Badge>
                                                    ) : null;
                                                })}
                                            </div>
                                            <Select onValueChange={handleCollectionChange}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Add to collections" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {collections
                                                        .filter(
                                                            (collection) =>
                                                                collection.id &&
                                                                collection.name &&
                                                                !formData.collections?.includes(collection.id)
                                                        )
                                                        .map((collection) => (
                                                            <SelectItem key={collection.id} value={collection.id}>
                                                                {collection.name}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={formData.isActive}
                                            onCheckedChange={(checked) =>
                                                setFormData({ ...formData, isActive: checked })
                                            }
                                        />
                                        <Label>Active Item</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={formData.featured || false}
                                            onCheckedChange={(checked) =>
                                                setFormData({ ...formData, featured: checked })
                                            }
                                        />
                                        <Label>Featured Item</Label>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="details" className="mt-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Type-Specific Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {formData.type === 'physical' && (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div>
                                            <Label htmlFor="weight">Weight (kg)</Label>
                                            <Input
                                                id="weight"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={formData.weight}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        weight: parseFloat(e.target.value) || 0
                                                    })
                                                }
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="stock">Stock Quantity</Label>
                                            <div className="space-y-2">
                                                <Input
                                                    id="stock"
                                                    type="number"
                                                    min="0"
                                                    value={unlimitedStock ? '' : formData.stock}
                                                    onChange={(e) => {
                                                        const value = parseInt(e.target.value, 10) || 0;
                                                        setFormData({
                                                            ...formData,
                                                            stock: value
                                                        });
                                                    }}
                                                    placeholder="0"
                                                    disabled={unlimitedStock}
                                                />
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="unlimited-stock"
                                                        checked={unlimitedStock}
                                                        onCheckedChange={(checked) => {
                                                            setUnlimitedStock(checked);
                                                            setFormData({
                                                                ...formData,
                                                                stock: checked ? -1 : 0
                                                            });
                                                        }}
                                                    />
                                                    <Label htmlFor="unlimited-stock" className="text-sm">
                                                        Unlimited stock
                                                    </Label>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="lowStock">Low Stock Alert</Label>
                                            <Input
                                                id="lowStock"
                                                type="number"
                                                min="0"
                                                value={formData.lowStockAlert}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        lowStockAlert: parseInt(e.target.value, 10) || 0
                                                    })
                                                }
                                                placeholder="5"
                                            />
                                        </div>
                                    </div>
                                )}

                                {formData.type === 'digital' && (
                                    <>
                                        <div>
                                            <Label htmlFor="downloadLink">Download Link</Label>
                                            <Input
                                                id="downloadLink"
                                                value={formData.downloadLink}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        downloadLink: e.target.value
                                                    })
                                                }
                                                placeholder="https://example.com/download"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="downloadNotes">Download Notes</Label>
                                            <Textarea
                                                id="downloadNotes"
                                                value={formData.downloadNotes}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        downloadNotes: e.target.value
                                                    })
                                                }
                                                placeholder="Instructions for customers"
                                                className="h-24"
                                            />
                                        </div>
                                    </>
                                )}

                                {formData.type === 'service' && (
                                    <>
                                        {/* Service Type */}
                                        <div>
                                            <Label htmlFor="serviceType">Service Type</Label>
                                            <Select
                                                value={formData.serviceType || 'standard'}
                                                onValueChange={(value) =>
                                                    setFormData({
                                                        ...formData,
                                                        serviceType: value
                                                    })
                                                }>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select service type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="standard">Standard Service</SelectItem>
                                                    <SelectItem value="consultation">Consultation</SelectItem>
                                                    <SelectItem value="workshop">Workshop/Training</SelectItem>
                                                    <SelectItem value="maintenance">Maintenance</SelectItem>
                                                    <SelectItem value="custom">Custom Service</SelectItem>
                                                    <SelectItem value="subscription">Subscription</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Duration - now optional */}
                                        <div>
                                            <Label htmlFor="duration">Duration</Label>
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="hasDuration"
                                                        checked={formData.hasDuration !== false}
                                                        onCheckedChange={(checked) =>
                                                            setFormData({
                                                                ...formData,
                                                                hasDuration: checked,
                                                                duration: checked ? formData.duration || 60 : null
                                                            })
                                                        }
                                                    />
                                                    <Label htmlFor="hasDuration" className="text-sm">
                                                        Service has fixed duration
                                                    </Label>
                                                </div>

                                                {formData.hasDuration !== false && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Input
                                                                id="duration"
                                                                type="number"
                                                                min="0"
                                                                value={formData.duration || ''}
                                                                onChange={(e) =>
                                                                    setFormData({
                                                                        ...formData,
                                                                        duration: parseInt(e.target.value, 10) || 0
                                                                    })
                                                                }
                                                                placeholder="60"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Select
                                                                value={formData.durationUnit || 'minutes'}
                                                                onValueChange={(value) =>
                                                                    setFormData({
                                                                        ...formData,
                                                                        durationUnit: value
                                                                    })
                                                                }>
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="minutes">Minutes</SelectItem>
                                                                    <SelectItem value="hours">Hours</SelectItem>
                                                                    <SelectItem value="days">Days</SelectItem>
                                                                    <SelectItem value="weeks">Weeks</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                )}

                                                {formData.hasDuration === false && (
                                                    <p className="text-muted-foreground text-sm">
                                                        Duration will be determined based on requirements
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Service Delivery Method */}
                                        <div>
                                            <Label htmlFor="deliveryMethod">Delivery Method</Label>
                                            <Select
                                                value={formData.deliveryMethod || 'in-person'}
                                                onValueChange={(value) =>
                                                    setFormData({
                                                        ...formData,
                                                        deliveryMethod: value
                                                    })
                                                }>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select delivery method" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="in-person">In-Person</SelectItem>
                                                    <SelectItem value="remote">Remote/Online</SelectItem>
                                                    <SelectItem value="hybrid">Hybrid</SelectItem>
                                                    <SelectItem value="on-site">On-Site (Customer Location)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Location/Platform Details */}
                                        {(formData.deliveryMethod === 'remote' ||
                                            formData.deliveryMethod === 'hybrid') && (
                                            <div>
                                                <Label htmlFor="platform">Platform/Tool</Label>
                                                <Input
                                                    id="platform"
                                                    value={formData.platform || ''}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            platform: e.target.value
                                                        })
                                                    }
                                                    placeholder="e.g., Zoom, Google Meet, Microsoft Teams"
                                                />
                                            </div>
                                        )}

                                        {/* Service Capacity */}
                                        <div>
                                            <Label htmlFor="maxParticipants">Maximum Participants</Label>
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="hasCapacityLimit"
                                                        checked={formData.hasCapacityLimit !== false}
                                                        onCheckedChange={(checked) =>
                                                            setFormData({
                                                                ...formData,
                                                                hasCapacityLimit: checked,
                                                                maxParticipants: checked
                                                                    ? formData.maxParticipants || 1
                                                                    : null
                                                            })
                                                        }
                                                    />
                                                    <Label htmlFor="hasCapacityLimit" className="text-sm">
                                                        Limit number of participants
                                                    </Label>
                                                </div>

                                                {formData.hasCapacityLimit !== false && (
                                                    <Input
                                                        id="maxParticipants"
                                                        type="number"
                                                        min="1"
                                                        value={formData.maxParticipants || ''}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                maxParticipants: parseInt(e.target.value, 10) || 1
                                                            })
                                                        }
                                                        placeholder="1"
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        {/* Prerequisites */}
                                        <div>
                                            <Label htmlFor="prerequisites">Prerequisites</Label>
                                            <Textarea
                                                id="prerequisites"
                                                value={formData.prerequisites || ''}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        prerequisites: e.target.value
                                                    })
                                                }
                                                placeholder="Any requirements or preparations needed before the service"
                                                className="h-20"
                                            />
                                        </div>

                                        {/* Service Includes */}
                                        <div>
                                            <Label htmlFor="serviceIncludes">What's Included</Label>
                                            <Textarea
                                                id="serviceIncludes"
                                                value={formData.serviceIncludes || ''}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        serviceIncludes: e.target.value
                                                    })
                                                }
                                                placeholder="List what's included in this service (materials, tools, follow-up, etc.)"
                                                className="h-20"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="serviceNotes">Additional Notes</Label>
                                            <Textarea
                                                id="serviceNotes"
                                                value={formData.serviceNotes || ''}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        serviceNotes: e.target.value
                                                    })
                                                }
                                                placeholder="Additional service information, terms, or special instructions"
                                                className="h-24"
                                            />
                                        </div>

                                        {/* Appointment Booking Options */}
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="requiresAppointment"
                                                checked={formData.requiresAppointment || false}
                                                onCheckedChange={(checked) =>
                                                    setFormData({
                                                        ...formData,
                                                        requiresAppointment: checked
                                                    })
                                                }
                                            />
                                            <Label htmlFor="requiresAppointment">Requires Appointment Booking</Label>
                                        </div>

                                        {formData.requiresAppointment && (
                                            <Card className="border-blue-200 bg-blue-50 p-4">
                                                <h4 className="mb-3 font-medium text-blue-900">Appointment Settings</h4>
                                                <div className="space-y-4">
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id="allowOnlineBooking"
                                                            checked={
                                                                formData.appointmentSettings?.allowOnlineBooking !==
                                                                false
                                                            }
                                                            onCheckedChange={(checked) =>
                                                                setFormData({
                                                                    ...formData,
                                                                    appointmentSettings: {
                                                                        ...formData.appointmentSettings,
                                                                        allowOnlineBooking: checked
                                                                    }
                                                                })
                                                            }
                                                        />
                                                        <Label htmlFor="allowOnlineBooking">Allow Online Booking</Label>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label htmlFor="bufferTime">Buffer Time (minutes)</Label>
                                                            <Input
                                                                id="bufferTime"
                                                                type="number"
                                                                min="0"
                                                                value={formData.appointmentSettings?.bufferTime || 15}
                                                                onChange={(e) =>
                                                                    setFormData({
                                                                        ...formData,
                                                                        appointmentSettings: {
                                                                            ...formData.appointmentSettings,
                                                                            bufferTime:
                                                                                parseInt(e.target.value, 10) || 15
                                                                        }
                                                                    })
                                                                }
                                                                placeholder="15"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="advanceBookingDays">
                                                                Advance Booking (days)
                                                            </Label>
                                                            <Input
                                                                id="advanceBookingDays"
                                                                type="number"
                                                                min="1"
                                                                value={
                                                                    formData.appointmentSettings?.advanceBookingDays ||
                                                                    30
                                                                }
                                                                onChange={(e) =>
                                                                    setFormData({
                                                                        ...formData,
                                                                        appointmentSettings: {
                                                                            ...formData.appointmentSettings,
                                                                            advanceBookingDays:
                                                                                parseInt(e.target.value, 10) || 30
                                                                        }
                                                                    })
                                                                }
                                                                placeholder="30"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <Label className="mb-2 block font-medium text-sm">
                                                            Working Hours
                                                        </Label>
                                                        <div className="space-y-2 text-sm">
                                                            {[
                                                                'monday',
                                                                'tuesday',
                                                                'wednesday',
                                                                'thursday',
                                                                'friday',
                                                                'saturday',
                                                                'sunday'
                                                            ].map((day) => {
                                                                const daySettings = formData.appointmentSettings
                                                                    ?.workingHours?.[day] || {
                                                                    enabled: [
                                                                        'monday',
                                                                        'tuesday',
                                                                        'wednesday',
                                                                        'thursday',
                                                                        'friday'
                                                                    ].includes(day),
                                                                    start: '09:00',
                                                                    end: '17:00'
                                                                };

                                                                return (
                                                                    <div
                                                                        key={day}
                                                                        className="flex items-center gap-4 rounded border bg-white p-2">
                                                                        <div className="flex w-24 items-center space-x-2">
                                                                            <Checkbox
                                                                                id={`${day}-enabled`}
                                                                                checked={daySettings.enabled}
                                                                                onCheckedChange={(checked) =>
                                                                                    setFormData({
                                                                                        ...formData,
                                                                                        appointmentSettings: {
                                                                                            ...formData.appointmentSettings,
                                                                                            workingHours: {
                                                                                                ...formData
                                                                                                    .appointmentSettings
                                                                                                    ?.workingHours,
                                                                                                [day]: {
                                                                                                    ...daySettings,
                                                                                                    enabled: checked
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    })
                                                                                }
                                                                            />
                                                                            <Label
                                                                                htmlFor={`${day}-enabled`}
                                                                                className="text-xs capitalize">
                                                                                {day.slice(0, 3)}
                                                                            </Label>
                                                                        </div>
                                                                        {daySettings.enabled && (
                                                                            <>
                                                                                <Input
                                                                                    type="time"
                                                                                    value={daySettings.start}
                                                                                    onChange={(e) =>
                                                                                        setFormData({
                                                                                            ...formData,
                                                                                            appointmentSettings: {
                                                                                                ...formData.appointmentSettings,
                                                                                                workingHours: {
                                                                                                    ...formData
                                                                                                        .appointmentSettings
                                                                                                        ?.workingHours,
                                                                                                    [day]: {
                                                                                                        ...daySettings,
                                                                                                        start: e.target
                                                                                                            .value
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        })
                                                                                    }
                                                                                    className="w-20 text-xs"
                                                                                />
                                                                                <span className="text-gray-500 text-xs">
                                                                                    to
                                                                                </span>
                                                                                <Input
                                                                                    type="time"
                                                                                    value={daySettings.end}
                                                                                    onChange={(e) =>
                                                                                        setFormData({
                                                                                            ...formData,
                                                                                            appointmentSettings: {
                                                                                                ...formData.appointmentSettings,
                                                                                                workingHours: {
                                                                                                    ...formData
                                                                                                        .appointmentSettings
                                                                                                        ?.workingHours,
                                                                                                    [day]: {
                                                                                                        ...daySettings,
                                                                                                        end: e.target
                                                                                                            .value
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        })
                                                                                    }
                                                                                    className="w-20 text-xs"
                                                                                />
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="images" className="mt-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Images</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Image Upload Area */}
                                <div
                                    className={`rounded-lg border-2 border-dashed p-6 transition-colors ${
                                        uploadingImages
                                            ? 'pointer-events-none border-primary bg-primary/10'
                                            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5'
                                    }`}>
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        {uploadingImages ? (
                                            <>
                                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                <p className="font-medium text-primary text-sm">Uploading images...</p>
                                                <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                                                        style={{ width: `${uploadProgress}%` }}
                                                    />
                                                </div>
                                                <p className="text-muted-foreground text-xs">
                                                    {Math.round(uploadProgress)}%
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-8 w-8 text-muted-foreground" />
                                                <div className="text-center">
                                                    <Label
                                                        htmlFor="image-upload"
                                                        className="cursor-pointer font-medium text-sm">
                                                        Click to upload images
                                                    </Label>
                                                    <p className="mt-1 text-muted-foreground text-xs">
                                                        PNG, JPG, WEBP up to 10MB each
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                        <Input
                                            id="image-upload"
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageUploadLocal}
                                            disabled={uploadingImages}
                                            className="hidden"
                                        />
                                    </div>
                                </div>

                                {/* Uploaded Images */}
                                {formData.images && formData.images.length > 0 && (
                                    <div>
                                        <Label>Uploaded Images</Label>
                                        <div className="mt-2 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                                            {formData.images.map((image, index) => (
                                                <div key={index} className="group relative">
                                                    <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
                                                        <img
                                                            src={image.url}
                                                            alt={image.alt || `Image ${index + 1}`}
                                                            className="h-full w-full cursor-pointer object-cover transition-transform hover:scale-105"
                                                            onClick={() => {
                                                                // Preview functionality can be added here
                                                                console.log('Image preview clicked:', image);
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Cover Image Badge */}
                                                    {formData.coverImageIndex === index && (
                                                        <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
                                                            <Star className="mr-1 h-3 w-3" />
                                                            Cover
                                                        </Badge>
                                                    )}

                                                    {/* Action Buttons */}
                                                    <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                                                        <div className="flex space-x-1">
                                                            {formData.coverImageIndex !== index && (
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="secondary"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleCoverImageChange(index);
                                                                        toast.success('Cover image updated');
                                                                    }}
                                                                    className="h-8 w-8 bg-white/90 p-0 hover:bg-white"
                                                                    title="Set as cover image">
                                                                    <Star className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeImage(index);
                                                                    toast.success('Image removed');
                                                                }}
                                                                className="h-8 w-8 bg-white/90 p-0 hover:bg-destructive"
                                                                title="Remove image">
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Image info */}
                                                    <div className="absolute right-0 bottom-0 left-0 bg-black/50 p-2 text-white text-xs opacity-0 transition-opacity group-hover:opacity-100">
                                                        <p className="truncate">{image.alt || `Image ${index + 1}`}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {formData.images && formData.images.length === 0 && (
                                    <div className="py-8 text-center">
                                        <ImageIcon className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                                        <p className="text-muted-foreground text-sm">No images uploaded yet</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="attributes" className="mt-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Product Variants & Attributes</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Variant Toggle */}
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={formData.hasVariants}
                                        onCheckedChange={(checked) => {
                                            setFormData({
                                                ...formData,
                                                hasVariants: checked,
                                                variants: checked ? formData.variants : []
                                            });
                                        }}
                                    />
                                    <Label>This product has variants (different colors, sizes, etc.)</Label>
                                </div>

                                {formData.hasVariants ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="font-medium text-base">Product Variants</Label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const newVariant = {
                                                        id: Date.now(),
                                                        attributes: {},
                                                        stock: 0,
                                                        price: formData.price || 0,
                                                        sku: '',
                                                        coverImage: null,
                                                        unlimitedStock: false
                                                    };
                                                    setFormData({
                                                        ...formData,
                                                        variants: [...formData.variants, newVariant]
                                                    });
                                                }}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Variant
                                            </Button>
                                        </div>

                                        {formData.variants && formData.variants.length > 0 ? (
                                            <div className="space-y-4">
                                                {formData.variants.map((variant, variantIndex) => (
                                                    <Card key={variant.id || variantIndex} className="p-4">
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <Label className="font-medium">
                                                                    Variant {variantIndex + 1}
                                                                </Label>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const newVariants = formData.variants.filter(
                                                                            (_, i) => i !== variantIndex
                                                                        );
                                                                        setFormData({
                                                                            ...formData,
                                                                            variants: newVariants
                                                                        });
                                                                    }}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>

                                                            {/* Variant Attributes */}
                                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                                {availableAttributes
                                                                    .filter((attr) => attr.isActive)
                                                                    .map((attr) => (
                                                                        <div key={attr.id} className="space-y-2">
                                                                            <Label className="text-sm">
                                                                                {attr.name}
                                                                            </Label>
                                                                            {attr.type === 'select' ? (
                                                                                <Select
                                                                                    value={
                                                                                        variant.attributes[attr.name] ||
                                                                                        ''
                                                                                    }
                                                                                    onValueChange={(value) => {
                                                                                        const newVariants = [
                                                                                            ...formData.variants
                                                                                        ];
                                                                                        newVariants[
                                                                                            variantIndex
                                                                                        ].attributes[attr.name] = value;
                                                                                        setFormData({
                                                                                            ...formData,
                                                                                            variants: newVariants
                                                                                        });
                                                                                    }}>
                                                                                    <SelectTrigger>
                                                                                        <SelectValue
                                                                                            placeholder={`Select ${attr.name.toLowerCase()}`}
                                                                                        />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        {attr.options?.map((option) => (
                                                                                            <SelectItem
                                                                                                key={option}
                                                                                                value={option}>
                                                                                                {option}
                                                                                            </SelectItem>
                                                                                        ))}
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            ) : attr.type === 'color' ? (
                                                                                <div className="flex gap-2">
                                                                                    <Input
                                                                                        type="color"
                                                                                        value={
                                                                                            variant.attributes[
                                                                                                attr.name
                                                                                            ] || '#000000'
                                                                                        }
                                                                                        onChange={(e) => {
                                                                                            const newVariants = [
                                                                                                ...formData.variants
                                                                                            ];
                                                                                            newVariants[
                                                                                                variantIndex
                                                                                            ].attributes[attr.name] =
                                                                                                e.target.value;
                                                                                            setFormData({
                                                                                                ...formData,
                                                                                                variants: newVariants
                                                                                            });
                                                                                        }}
                                                                                        className="h-10 w-16 rounded p-1"
                                                                                    />
                                                                                    <Input
                                                                                        type="text"
                                                                                        value={
                                                                                            variant.attributes[
                                                                                                attr.name
                                                                                            ] || ''
                                                                                        }
                                                                                        onChange={(e) => {
                                                                                            const newVariants = [
                                                                                                ...formData.variants
                                                                                            ];
                                                                                            newVariants[
                                                                                                variantIndex
                                                                                            ].attributes[attr.name] =
                                                                                                e.target.value;
                                                                                            setFormData({
                                                                                                ...formData,
                                                                                                variants: newVariants
                                                                                            });
                                                                                        }}
                                                                                        placeholder="Color name"
                                                                                    />
                                                                                </div>
                                                                            ) : (
                                                                                <Input
                                                                                    type={
                                                                                        attr.type === 'number'
                                                                                            ? 'number'
                                                                                            : 'text'
                                                                                    }
                                                                                    value={
                                                                                        variant.attributes[attr.name] ||
                                                                                        ''
                                                                                    }
                                                                                    onChange={(e) => {
                                                                                        const newVariants = [
                                                                                            ...formData.variants
                                                                                        ];
                                                                                        newVariants[
                                                                                            variantIndex
                                                                                        ].attributes[attr.name] =
                                                                                            e.target.value;
                                                                                        setFormData({
                                                                                            ...formData,
                                                                                            variants: newVariants
                                                                                        });
                                                                                    }}
                                                                                    placeholder={`Enter ${attr.name.toLowerCase()}`}
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                            </div>

                                                            {/* Variant Details */}
                                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                                <div className="space-y-2">
                                                                    <Label className="text-sm">Variant SKU</Label>
                                                                    <Input
                                                                        value={variant.sku || ''}
                                                                        onChange={(e) => {
                                                                            const newVariants = [...formData.variants];
                                                                            newVariants[variantIndex].sku =
                                                                                e.target.value;
                                                                            setFormData({
                                                                                ...formData,
                                                                                variants: newVariants
                                                                            });
                                                                        }}
                                                                        placeholder="Variant SKU"
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label className="text-sm">Price Adjustment</Label>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={variant.price || 0}
                                                                        onChange={(e) => {
                                                                            const newVariants = [...formData.variants];
                                                                            newVariants[variantIndex].price =
                                                                                parseFloat(e.target.value) || 0;
                                                                            setFormData({
                                                                                ...formData,
                                                                                variants: newVariants
                                                                            });
                                                                        }}
                                                                        placeholder="0.00"
                                                                    />
                                                                    <p className="text-muted-foreground text-xs">
                                                                        Additional cost for this variant
                                                                    </p>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label className="text-sm">Stock Quantity</Label>
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        value={
                                                                            variant.unlimitedStock
                                                                                ? ''
                                                                                : variant.stock || 0
                                                                        }
                                                                        onChange={(e) => {
                                                                            const newVariants = [...formData.variants];
                                                                            newVariants[variantIndex].stock =
                                                                                parseInt(e.target.value, 10) || 0;
                                                                            setFormData({
                                                                                ...formData,
                                                                                variants: newVariants
                                                                            });
                                                                        }}
                                                                        placeholder="0"
                                                                        disabled={variant.unlimitedStock}
                                                                    />
                                                                    <div className="flex items-center space-x-2">
                                                                        <Checkbox
                                                                            checked={variant.unlimitedStock}
                                                                            onCheckedChange={(checked) => {
                                                                                const newVariants = [
                                                                                    ...formData.variants
                                                                                ];
                                                                                newVariants[
                                                                                    variantIndex
                                                                                ].unlimitedStock = checked;
                                                                                if (checked)
                                                                                    newVariants[variantIndex].stock =
                                                                                        -1;
                                                                                setFormData({
                                                                                    ...formData,
                                                                                    variants: newVariants
                                                                                });
                                                                            }}
                                                                        />
                                                                        <Label className="text-xs">
                                                                            Unlimited stock
                                                                        </Label>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Variant Cover Image */}
                                                            <div className="space-y-2">
                                                                <Label className="text-sm">Variant Cover Image</Label>
                                                                <div className="flex items-center gap-4">
                                                                    {variant.coverImage ? (
                                                                        <div className="relative">
                                                                            <img
                                                                                src={variant.coverImage}
                                                                                alt="Variant cover"
                                                                                className="h-16 w-16 rounded border object-cover"
                                                                            />
                                                                            <Button
                                                                                type="button"
                                                                                variant="destructive"
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    const newVariants = [
                                                                                        ...formData.variants
                                                                                    ];
                                                                                    newVariants[
                                                                                        variantIndex
                                                                                    ].coverImage = null;
                                                                                    setFormData({
                                                                                        ...formData,
                                                                                        variants: newVariants
                                                                                    });
                                                                                }}
                                                                                className="-top-2 -right-2 absolute h-6 w-6 p-0">
                                                                                <X className="h-3 w-3" />
                                                                            </Button>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex h-16 w-16 items-center justify-center rounded border-2 border-gray-300 border-dashed">
                                                                            <ImageIcon className="h-6 w-6 text-gray-400" />
                                                                        </div>
                                                                    )}
                                                                    <Input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        onChange={async (e) => {
                                                                            const file = e.target.files?.[0];
                                                                            if (file) {
                                                                                const uploadFormData = new FormData();
                                                                                uploadFormData.append('files', file);
                                                                                try {
                                                                                    const response = await fetch(
                                                                                        '/api/upload',
                                                                                        {
                                                                                            method: 'POST',
                                                                                            body: uploadFormData
                                                                                        }
                                                                                    );
                                                                                    const data = await response.json();
                                                                                    if (
                                                                                        data.success &&
                                                                                        data.data?.[0]?.url
                                                                                    ) {
                                                                                        const newVariants = [
                                                                                            ...formData.variants
                                                                                        ];
                                                                                        newVariants[
                                                                                            variantIndex
                                                                                        ].coverImage = data.data[0].url;
                                                                                        setFormData({
                                                                                            ...formData,
                                                                                            variants: newVariants
                                                                                        });
                                                                                        toast.success(
                                                                                            'Variant image uploaded successfully'
                                                                                        );
                                                                                    } else {
                                                                                        throw new Error(
                                                                                            data.error ||
                                                                                                'Upload failed'
                                                                                        );
                                                                                    }
                                                                                } catch (_error) {
                                                                                    toast.error(
                                                                                        'Failed to upload image'
                                                                                    );
                                                                                }
                                                                            }
                                                                        }}
                                                                        className="flex-1"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="rounded-lg border-2 border-gray-300 border-dashed py-8 text-center">
                                                <p className="mb-4 text-muted-foreground text-sm">
                                                    No variants added yet
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => {
                                                        const newVariant = {
                                                            id: Date.now(),
                                                            attributes: {},
                                                            stock: 0,
                                                            price: 0,
                                                            sku: '',
                                                            coverImage: null,
                                                            unlimitedStock: false
                                                        };
                                                        setFormData({
                                                            ...formData,
                                                            variants: [newVariant]
                                                        });
                                                    }}>
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Add First Variant
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Standard Attributes (Non-Variant Mode) */
                                    <div className="space-y-4">
                                        {/* Predefined Attributes */}
                                        {availableAttributes.length > 0 && (
                                            <div>
                                                <Label className="font-medium text-sm">Available Attributes</Label>
                                                <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                                                    {availableAttributes.map((attr) => {
                                                        const existingAttr = customAttributes.find(
                                                            (ca) => ca.name === attr.name
                                                        );
                                                        return (
                                                            <div key={attr.id} className="space-y-2">
                                                                <Label className="text-sm">
                                                                    {attr.nameML?.[defaultLanguage] || attr.name}
                                                                </Label>
                                                                {attr.type === 'select' ? (
                                                                    <Select
                                                                        value={existingAttr?.value || ''}
                                                                        onValueChange={(value) => {
                                                                            const index = customAttributes.findIndex(
                                                                                (ca) => ca.name === attr.name
                                                                            );
                                                                            if (index >= 0) {
                                                                                updateAttribute(index, 'value', value);
                                                                            } else {
                                                                                const newAttrs = [
                                                                                    ...customAttributes,
                                                                                    { name: attr.name, value }
                                                                                ];
                                                                                setCustomAttributes(newAttrs);
                                                                                setFormData({
                                                                                    ...formData,
                                                                                    customAttributes: newAttrs.filter(
                                                                                        (a) => a.name && a.value
                                                                                    )
                                                                                });
                                                                            }
                                                                        }}>
                                                                        <SelectTrigger>
                                                                            <SelectValue
                                                                                placeholder={`Select ${attr.name.toLowerCase()}`}
                                                                            />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {attr.options?.map((option) => (
                                                                                <SelectItem key={option} value={option}>
                                                                                    {option}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                ) : attr.type === 'boolean' ? (
                                                                    <div className="flex items-center space-x-2">
                                                                        <Checkbox
                                                                            checked={existingAttr?.value === 'true'}
                                                                            onCheckedChange={(checked) => {
                                                                                const index =
                                                                                    customAttributes.findIndex(
                                                                                        (ca) => ca.name === attr.name
                                                                                    );
                                                                                if (index >= 0) {
                                                                                    updateAttribute(
                                                                                        index,
                                                                                        'value',
                                                                                        checked ? 'true' : 'false'
                                                                                    );
                                                                                } else {
                                                                                    const newAttrs = [
                                                                                        ...customAttributes,
                                                                                        {
                                                                                            name: attr.name,
                                                                                            value: checked
                                                                                                ? 'true'
                                                                                                : 'false'
                                                                                        }
                                                                                    ];
                                                                                    setCustomAttributes(newAttrs);
                                                                                    setFormData({
                                                                                        ...formData,
                                                                                        customAttributes:
                                                                                            newAttrs.filter(
                                                                                                (a) => a.name && a.value
                                                                                            )
                                                                                    });
                                                                                }
                                                                            }}
                                                                        />
                                                                        <Label className="text-sm">
                                                                            {attr.description || 'Yes'}
                                                                        </Label>
                                                                    </div>
                                                                ) : (
                                                                    <Input
                                                                        type={
                                                                            attr.type === 'number'
                                                                                ? 'number'
                                                                                : attr.type === 'color'
                                                                                  ? 'color'
                                                                                  : 'text'
                                                                        }
                                                                        value={existingAttr?.value || ''}
                                                                        onChange={(e) => {
                                                                            const index = customAttributes.findIndex(
                                                                                (ca) => ca.name === attr.name
                                                                            );
                                                                            if (index >= 0) {
                                                                                updateAttribute(
                                                                                    index,
                                                                                    'value',
                                                                                    e.target.value
                                                                                );
                                                                            } else {
                                                                                const newAttrs = [
                                                                                    ...customAttributes,
                                                                                    {
                                                                                        name: attr.name,
                                                                                        value: e.target.value
                                                                                    }
                                                                                ];
                                                                                setCustomAttributes(newAttrs);
                                                                                setFormData({
                                                                                    ...formData,
                                                                                    customAttributes: newAttrs.filter(
                                                                                        (a) => a.name && a.value
                                                                                    )
                                                                                });
                                                                            }
                                                                        }}
                                                                        placeholder={`Enter ${attr.name.toLowerCase()}`}
                                                                    />
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Custom Attributes */}
                                        <div>
                                            <Label className="font-medium text-sm">Custom Attributes</Label>
                                            
                                            {/* Language Selector for Attributes */}
                                            <div className="mt-2 mb-4 flex items-center justify-between">
                                                <Label className="text-sm text-muted-foreground">Attribute Language</Label>
                                                <div className="flex gap-1">
                                                    {availableLanguages.map((lang) => (
                                                        <Button
                                                            key={lang}
                                                            type="button"
                                                            variant={currentLanguage === lang ? 'default' : 'outline'}
                                                            size="sm"
                                                            onClick={() => setCurrentLanguage(lang)}
                                                            className="h-7 px-2 text-xs">
                                                            {lang.toUpperCase()}
                                                            {lang === defaultLanguage && <span className="ml-1">★</span>}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            {customAttributes.filter(
                                                (attr) => !availableAttributes.some((aa) => aa.name === attr.name)
                                            ).length > 0 && (
                                                <div className="mt-2 space-y-3">
                                                    {customAttributes
                                                        .filter(
                                                            (attr) =>
                                                                !availableAttributes.some((aa) => aa.name === attr.name)
                                                        )
                                                        .map((attr, _index) => {
                                                            const actualIndex = customAttributes.indexOf(attr);
                                                            return (
                                                                <div
                                                                    key={actualIndex}
                                                                    className="space-y-2 rounded-lg border p-3">
                                                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                                                        <div className="space-y-1">
                                                                            <Label className="text-xs text-muted-foreground">
                                                                                Attribute name ({currentLanguage.toUpperCase()})
                                                                            </Label>
                                                                            <Input
                                                                                value={getAttributeMultiLanguageValue(
                                                                                    actualIndex, 
                                                                                    'name', 
                                                                                    currentLanguage
                                                                                )}
                                                                                onChange={(e) =>
                                                                                    updateAttributeMultiLanguageField(
                                                                                        actualIndex,
                                                                                        'name',
                                                                                        currentLanguage,
                                                                                        e.target.value
                                                                                    )
                                                                                }
                                                                                placeholder={`Enter attribute name (${currentLanguage.toUpperCase()})`}
                                                                                required={currentLanguage === defaultLanguage}
                                                                            />
                                                                            {currentLanguage !== defaultLanguage && (
                                                                                <p className="text-muted-foreground text-xs">
                                                                                    Translation for {currentLanguage.toUpperCase()}. Leave empty to use default language.
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                            <div className="flex-1 space-y-1">
                                                                                <Label className="text-xs text-muted-foreground">
                                                                                    Attribute value ({currentLanguage.toUpperCase()})
                                                                                </Label>
                                                                                <Input
                                                                                    value={getAttributeMultiLanguageValue(
                                                                                        actualIndex, 
                                                                                        'value', 
                                                                                        currentLanguage
                                                                                    )}
                                                                                    onChange={(e) =>
                                                                                        updateAttributeMultiLanguageField(
                                                                                            actualIndex,
                                                                                            'value',
                                                                                            currentLanguage,
                                                                                            e.target.value
                                                                                        )
                                                                                    }
                                                                                    placeholder={`Enter attribute value (${currentLanguage.toUpperCase()})`}
                                                                                    required={currentLanguage === defaultLanguage}
                                                                                />
                                                                                {currentLanguage !== defaultLanguage && (
                                                                                    <p className="text-muted-foreground text-xs">
                                                                                        Translation for {currentLanguage.toUpperCase()}. Leave empty to use default language.
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-end">
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="outline"
                                                                                    size="icon"
                                                                                    onClick={() =>
                                                                                        removeAttribute(actualIndex)
                                                                                    }>
                                                                                    <X className="h-4 w-4" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            )}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={addAttribute}
                                                className="mt-2">
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Custom Attribute
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="seo" className="mt-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>SEO & Meta Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Language Selector */}
                                <div className="mb-4 flex items-center justify-between">
                                    <Label className="font-medium text-base">SEO Language</Label>
                                    <div className="flex gap-1">
                                        {availableLanguages.map((lang) => (
                                            <Button
                                                key={lang}
                                                type="button"
                                                variant={currentLanguage === lang ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setCurrentLanguage(lang)}
                                                className="h-8 px-3 text-sm">
                                                {lang.toUpperCase()}
                                                {lang === defaultLanguage && <span className="ml-1">★</span>}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Basic Meta Tags */}
                                <div className="space-y-4">
                                    <Label className="font-medium text-base">
                                        Basic Meta Tags ({currentLanguage.toUpperCase()})
                                    </Label>
                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="metaTitle">Meta Title</Label>
                                            <Input
                                                id="metaTitle"
                                                value={getSEOMultiLanguageValue('metaTitle', currentLanguage)}
                                                onChange={(e) =>
                                                    updateSEOMultiLanguageField(
                                                        'metaTitle',
                                                        currentLanguage,
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={`SEO optimized title (50-60 characters) - ${currentLanguage.toUpperCase()}`}
                                                maxLength={60}
                                            />
                                            <p className="text-muted-foreground text-xs">
                                                {getSEOMultiLanguageValue('metaTitle', currentLanguage).length}/60
                                                characters
                                                {currentLanguage !== defaultLanguage &&
                                                    ` - Translation for ${currentLanguage.toUpperCase()}`}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="metaDescription">Meta Description</Label>
                                            <Textarea
                                                id="metaDescription"
                                                value={getSEOMultiLanguageValue('metaDescription', currentLanguage)}
                                                onChange={(e) =>
                                                    updateSEOMultiLanguageField(
                                                        'metaDescription',
                                                        currentLanguage,
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={`Brief description for search results (150-160 characters) - ${currentLanguage.toUpperCase()}`}
                                                maxLength={160}
                                                className="h-20"
                                            />
                                            <p className="text-muted-foreground text-xs">
                                                {getSEOMultiLanguageValue('metaDescription', currentLanguage).length}
                                                /160 characters
                                                {currentLanguage !== defaultLanguage &&
                                                    ` - Translation for ${currentLanguage.toUpperCase()}`}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="metaKeywords">Meta Keywords</Label>
                                            <Input
                                                id="metaKeywords"
                                                value={getSEOMultiLanguageValue('metaKeywords', currentLanguage)}
                                                onChange={(e) =>
                                                    updateSEOMultiLanguageField(
                                                        'metaKeywords',
                                                        currentLanguage,
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={`keyword1, keyword2, keyword3 - ${currentLanguage.toUpperCase()}`}
                                            />
                                            <p className="text-muted-foreground text-xs">
                                                Separate keywords with commas
                                                {currentLanguage !== defaultLanguage &&
                                                    ` - Translation for ${currentLanguage.toUpperCase()}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Open Graph Tags */}
                                <div className="space-y-4">
                                    <Label className="font-medium text-base">
                                        Open Graph (Facebook) - {currentLanguage.toUpperCase()}
                                    </Label>
                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="ogTitle">OG Title</Label>
                                            <Input
                                                id="ogTitle"
                                                value={getSEOMultiLanguageValue('ogTitle', currentLanguage)}
                                                onChange={(e) =>
                                                    updateSEOMultiLanguageField(
                                                        'ogTitle',
                                                        currentLanguage,
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={`Title for social media sharing - ${currentLanguage.toUpperCase()}`}
                                            />
                                            {currentLanguage !== defaultLanguage && (
                                                <p className="text-muted-foreground text-xs">
                                                    Translation for {currentLanguage.toUpperCase()}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="ogDescription">OG Description</Label>
                                            <Textarea
                                                id="ogDescription"
                                                value={getSEOMultiLanguageValue('ogDescription', currentLanguage)}
                                                onChange={(e) =>
                                                    updateSEOMultiLanguageField(
                                                        'ogDescription',
                                                        currentLanguage,
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={`Description for social media sharing - ${currentLanguage.toUpperCase()}`}
                                                className="h-20"
                                            />
                                            {currentLanguage !== defaultLanguage && (
                                                <p className="text-muted-foreground text-xs">
                                                    Translation for {currentLanguage.toUpperCase()}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="ogImage">OG Image URL</Label>
                                            <Input
                                                id="ogImage"
                                                type="url"
                                                value={formData.seo?.ogImage || ''}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        seo: { ...formData.seo, ogImage: e.target.value }
                                                    })
                                                }
                                                placeholder="https://example.com/image.jpg"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Twitter Card Tags */}
                                <div className="space-y-4">
                                    <Label className="font-medium text-base">
                                        Twitter Card - {currentLanguage.toUpperCase()}
                                    </Label>
                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="twitterTitle">Twitter Title</Label>
                                            <Input
                                                id="twitterTitle"
                                                value={getSEOMultiLanguageValue('twitterTitle', currentLanguage)}
                                                onChange={(e) =>
                                                    updateSEOMultiLanguageField(
                                                        'twitterTitle',
                                                        currentLanguage,
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={`Title for Twitter sharing - ${currentLanguage.toUpperCase()}`}
                                            />
                                            {currentLanguage !== defaultLanguage && (
                                                <p className="text-muted-foreground text-xs">
                                                    Translation for {currentLanguage.toUpperCase()}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="twitterDescription">Twitter Description</Label>
                                            <Textarea
                                                id="twitterDescription"
                                                value={getSEOMultiLanguageValue('twitterDescription', currentLanguage)}
                                                onChange={(e) =>
                                                    updateSEOMultiLanguageField(
                                                        'twitterDescription',
                                                        currentLanguage,
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={`Description for Twitter sharing - ${currentLanguage.toUpperCase()}`}
                                                className="h-20"
                                            />
                                            {currentLanguage !== defaultLanguage && (
                                                <p className="text-muted-foreground text-xs">
                                                    Translation for {currentLanguage.toUpperCase()}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="twitterImage">Twitter Image URL</Label>
                                            <Input
                                                id="twitterImage"
                                                type="url"
                                                value={formData.seo?.twitterImage || ''}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        seo: { ...formData.seo, twitterImage: e.target.value }
                                                    })
                                                }
                                                placeholder="https://example.com/image.jpg"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* SEO Preview */}
                                <div className="space-y-4">
                                    <Label className="font-medium text-base">
                                        Search Result Preview - {currentLanguage.toUpperCase()}
                                    </Label>
                                    <div className="rounded-lg border bg-gray-50 p-4">
                                        <div className="space-y-1">
                                            <div className="line-clamp-1 font-medium text-blue-600 text-lg">
                                                {getSEOMultiLanguageValue('metaTitle', currentLanguage) ||
                                                    getMultiLanguageValue('name', currentLanguage) ||
                                                    'Your Product Title'}
                                            </div>
                                            <div className="text-green-700 text-sm">
                                                yoursite.com/
                                                {currentLanguage !== defaultLanguage ? `${currentLanguage}/` : ''}
                                                products/{formData.slug || 'product-slug'}
                                            </div>
                                            <div className="line-clamp-2 text-gray-600 text-sm">
                                                {getSEOMultiLanguageValue('metaDescription', currentLanguage) ||
                                                    getMultiLanguageValue('description', currentLanguage) ||
                                                    'Your product description will appear here in search results...'}
                                            </div>
                                        </div>
                                        {currentLanguage !== defaultLanguage && (
                                            <p className="mt-2 border-t pt-2 text-muted-foreground text-xs">
                                                Preview for {currentLanguage.toUpperCase()} language version
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-4 border-t pt-6">
                    <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {editItem ? 'Updating...' : 'Creating...'}
                            </>
                        ) : editItem ? (
                            'Update Item'
                        ) : (
                            'Create Item'
                        )}
                    </Button>
                </div>
            </form>
        </ScrollArea>
    );
}
