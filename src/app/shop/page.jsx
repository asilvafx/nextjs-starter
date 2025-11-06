// @/app/shop/page.jsx

'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useCart } from 'react-use-cart';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllPublic } from '@/lib/client/query.js';

function Shop() {
    const t = useTranslations('Shop');
    const { addItem, cartTotal, totalItems } = useCart();

    // State management
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [collections, setCollections] = useState([]);
    const [storeSettings, setStoreSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [collectionFilter, setCollectionFilter] = useState('all');

    // VAT calculation helpers
    const _calculateDisplayPrice = (basePrice) => {
        if (!storeSettings) return basePrice;

        const vatRate = storeSettings.vatPercentage / 100;

        if (storeSettings.vatIncludedInPrice) {
            // If VAT is included in price, show the base price as-is
            return basePrice;
        } else {
            // If VAT is not included, add it for display if configured to show VAT-inclusive prices
            return basePrice * (1 + vatRate);
        }
    };

    const _getVatInfo = (basePrice) => {
        if (!storeSettings) return null;

        const vatRate = storeSettings.vatPercentage / 100;
        const vatAmount = storeSettings.vatIncludedInPrice
            ? (basePrice * vatRate) / (1 + vatRate)
            : basePrice * vatRate;

        return {
            rate: storeSettings.vatPercentage,
            amount: vatAmount,
            included: storeSettings.vatIncludedInPrice
        };
    };

    // Fetch all data on component mount
    useEffect(() => {
        loadAllData();
    }, []);

    // Filter items when any filter or items change
    useEffect(() => {
        filterItems();
    }, [filter, categoryFilter, collectionFilter, items]);

    const loadAllData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load all data in parallel
            const [catalogResponse, categoriesResponse, collectionsResponse, storeResponse] = await Promise.all([
                getAllPublic('catalog'),
                getAllPublic('categories'),
                getAllPublic('collections'),
                getAllPublic('store_settings')
            ]);

            // Set store settings
            if (storeResponse?.success) {
                setStoreSettings(storeResponse.data);
            }

            // Set categories
            if (categoriesResponse?.success) {
                setCategories(categoriesResponse.data);
            }

            // Set collections
            if (collectionsResponse?.success) {
                setCollections(collectionsResponse.data);
            }

            // Set catalog items
            if (catalogResponse?.success) {
                // Transform the data to match component expectations
                const transformedData = catalogResponse.data.map((item) => ({
                    ...item,
                    // Add inStock property based on stock number - treat -1 as unlimited stock
                    inStock: item.stock > 0 || item.stock === -1,
                    // Use cover image from images array or fallback
                    image:
                        item.images?.[item.coverImageIndex >= 0 ? item.coverImageIndex : 0]?.url ||
                        item.images?.[0]?.url ||
                        '/placeholder-image.jpg',
                    // Ensure collections is always an array
                    collections: item.collections || [],
                    // Keep original category and type structure
                    displayCategory: item.categoryId,
                    displayType: item.type
                }));

                setItems(transformedData);
            } else {
                setError(catalogResponse?.message || 'Failed to load catalog');
                toast.error(catalogResponse?.message || 'Request failed, please try again later.');
            }
        } catch (_err) {
            const errorMessage = 'Failed to load shop data';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const filterItems = () => {
        let filtered = items;

        // Filter by type (physical/digital/service)
        if (filter !== 'all') {
            filtered = filtered.filter((item) => item.type === filter);
        }

        // Filter by category
        if (categoryFilter !== 'all') {
            filtered = filtered.filter((item) => item.categoryId === categoryFilter);
        }

        // Filter by collection
        if (collectionFilter !== 'all') {
            filtered = filtered.filter((item) => item.collections?.includes(collectionFilter));
        }

        // Only show active items
        filtered = filtered.filter((item) => item.isActive !== false);

    // Exclude services that require an appointment from the shop listing
    filtered = filtered.filter((item) => !(item.type === 'service' && item.requiresAppointment));

        setFilteredItems(filtered);
    };

    const addToCart = (product) => {
        // Ensure the product has required fields for cart
        const cartItem = {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image, // This is already transformed in loadAllData
            description: product.description,
            sku: product.sku,
            type: product.type
            // Add any other fields your cart needs
        };

        addItem(cartItem);
        toast.success(t('addedToCart', { productName: product.name }));
    };

    const _handleFilterChange = (newFilter) => {
        setFilter(newFilter);
    };

    // Loading state
    if (loading) {
        return (
            <div className="container mx-auto py-8">
                <div className="space-y-8">
                    <Skeleton className="h-12 w-64" />
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="h-8 w-24" />
                            ))}
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Skeleton className="h-10" />
                            <Skeleton className="h-10" />
                        </div>
                    </div>
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {[...Array(6)].map((_, i) => (
                            <Card key={i}>
                                <Skeleton className="h-56 w-full" />
                                <CardContent className="p-4">
                                    <Skeleton className="mb-2 h-6 w-3/4" />
                                    <Skeleton className="mb-2 h-4 w-full" />
                                    <Skeleton className="mb-4 h-4 w-2/3" />
                                    <div className="flex items-center justify-between">
                                        <Skeleton className="h-6 w-16" />
                                        <Skeleton className="h-9 w-24" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error && items.length === 0) {
        return (
            <div className="container mx-auto py-8">
                <Card className="mx-auto max-w-md">
                    <CardContent className="pt-6 text-center">
                        <div className="mb-4 text-destructive">
                            <h2 className="mb-2 font-bold text-2xl">Error Loading Products</h2>
                            <p className="text-muted-foreground">{error}</p>
                        </div>
                        <Button onClick={loadAllData} variant="outline">
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <h1 className="font-bold text-4xl tracking-tight">{t('shopTitle')}</h1>
                </div>

                {/* Filters */}
                <div className="mb-8 space-y-4">
                    {/* Type Filter */}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            onClick={() => setFilter('all')}
                            variant={filter === 'all' ? 'default' : 'outline'}
                            size="sm"
                            className="rounded-full">
                            All Products
                        </Button>
                        <Button
                            onClick={() => setFilter('physical')}
                            variant={filter === 'physical' ? 'default' : 'outline'}
                            size="sm"
                            className="rounded-full">
                            Physical Products
                        </Button>
                        <Button
                            onClick={() => setFilter('digital')}
                            variant={filter === 'digital' ? 'default' : 'outline'}
                            size="sm"
                            className="rounded-full">
                            Digital Products
                        </Button>
                        <Button
                            onClick={() => setFilter('service')}
                            variant={filter === 'service' ? 'default' : 'outline'}
                            size="sm"
                            className="rounded-full">
                            Services
                        </Button>
                    </div>

                    {/* Categories and Collections Filters */}
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Categories Filter */}
                        {categories.length > 0 && (
                            <div>
                                <label className="mb-2 block font-medium text-sm">Categories</label>
                                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {categories.map((category) => (
                                            <SelectItem key={category.id} value={category.id}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Collections Filter */}
                        {collections.length > 0 && (
                            <div>
                                <label className="mb-2 block font-medium text-sm">Collections</label>
                                <Select value={collectionFilter} onValueChange={setCollectionFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Collections" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Collections</SelectItem>
                                        {collections.map((collection) => (
                                            <SelectItem key={collection.id} value={collection.id}>
                                                {collection.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    {/* Active Filters Display */}
                    {(filter !== 'all' || categoryFilter !== 'all' || collectionFilter !== 'all') && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-muted-foreground text-sm">Active filters:</span>
                            {filter !== 'all' && (
                                <Badge variant="secondary" className="gap-1">
                                    Type: {filter}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setFilter('all')}
                                        className="h-auto p-0 text-xs hover:bg-transparent">
                                        ×
                                    </Button>
                                </Badge>
                            )}
                            {categoryFilter !== 'all' && (
                                <Badge variant="secondary" className="gap-1">
                                    Category: {categories.find((c) => c.id === categoryFilter)?.name}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setCategoryFilter('all')}
                                        className="h-auto p-0 text-xs hover:bg-transparent">
                                        ×
                                    </Button>
                                </Badge>
                            )}
                            {collectionFilter !== 'all' && (
                                <Badge variant="secondary" className="gap-1">
                                    Collection: {collections.find((c) => c.id === collectionFilter)?.name}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setCollectionFilter('all')}
                                        className="h-auto p-0 text-xs hover:bg-transparent">
                                        ×
                                    </Button>
                                </Badge>
                            )}
                            <Button
                                variant="link"
                                size="sm"
                                onClick={() => {
                                    setFilter('all');
                                    setCategoryFilter('all');
                                    setCollectionFilter('all');
                                }}
                                className="h-auto p-0 text-xs">
                                Clear all
                            </Button>
                        </div>
                    )}
                </div>

                {/* Products Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredItems.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}>
                            <Card className="relative flex h-full flex-col overflow-hidden">
                                {/* Type Badge */}
                                <div className="absolute top-2 right-2 z-10">
                                    <Badge
                                        variant={
                                            item.type === 'service'
                                                ? 'default'
                                                : item.type === 'digital'
                                                  ? 'secondary'
                                                  : 'outline'
                                        }>
                                        {item.type === 'service'
                                            ? 'Service'
                                            : item.type === 'digital'
                                              ? 'Digital'
                                              : 'Physical'}
                                    </Badge>
                                </div>

                                {/* Stock Badge */}
                                {!item.inStock && (
                                    <div className="absolute top-2 left-2 z-10">
                                        <Badge variant="destructive">Out of Stock</Badge>
                                    </div>
                                )}

                                {/* Low Stock Badge */}
                                {item.inStock && item.stock !== -1 && item.stock <= (item.lowStockAlert || 5) && (
                                    <div className="absolute top-2 left-2 z-10">
                                        <Badge
                                            variant="secondary"
                                            className="bg-orange-100 text-orange-800 hover:bg-orange-200">
                                            Low Stock
                                        </Badge>
                                    </div>
                                )}

                                <div className="h-56 w-full overflow-hidden">
                                    <Image
                                        width={300}
                                        height={300}
                                        src={item.image}
                                        alt={item.name}
                                        priority={true}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            e.target.src = '/placeholder-image.jpg'; // Fallback image
                                        }}
                                    />
                                </div>
                                <CardContent className="flex flex-grow flex-col">
                                    <h2 className="mb-2 font-semibold text-lg">{item.name}</h2>
                                    <p className="mb-3 flex-grow text-muted-foreground text-sm">{item.description}</p>

                                    {/* Category and Stock info */}
                                    <div className="mb-2 space-y-1 text-muted-foreground text-xs">
                                        {item.categoryId && categories.find((c) => c.id === item.categoryId) && (
                                            <p>Category: {categories.find((c) => c.id === item.categoryId)?.name}</p>
                                        )}
                                        {item.type === 'physical' && (
                                            <p>Stock: {item.stock === -1 ? 'Unlimited' : `${item.stock} available`}</p>
                                        )}
                                        {item.sku && <p>SKU: {item.sku}</p>}
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <p className="font-bold text-lg">
                                            {storeSettings?.currency === 'USD' ? '$' : '€'}
                                            {item.price.toFixed(2)}
                                        </p>
                                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <Button
                                                onClick={() => addToCart(item)}
                                                disabled={!item.inStock}
                                                variant={!item.inStock ? 'outline' : 'default'}
                                                size="sm">
                                                {item.inStock ? t('addToCart') : 'Out of Stock'}
                                            </Button>
                                        </motion.div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* No items message */}
                {filteredItems.length === 0 && !loading && (
                    <Card className="py-12">
                        <CardContent className="text-center">
                            <p className="text-lg text-muted-foreground">No items found for the selected filter.</p>
                            <p className="mt-2 text-muted-foreground text-sm">Total items loaded: {items.length}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Back link */}
                <div className="mt-10 text-center">
                    <Button variant="link" asChild>
                        <Link href="/">← {t('backToHome')}</Link>
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}

export default Shop;
