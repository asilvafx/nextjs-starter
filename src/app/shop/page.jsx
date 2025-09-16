"use client"

import { useCart } from 'react-use-cart';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from "sonner";
import { motion } from 'framer-motion';
import { FaSpinner } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { getAllPublic } from '@/lib/query.js';

function Shop() {
    const t = useTranslations('Shop');
    const { addItem, cartTotal, totalItems } = useCart();

    // State management
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');

    // Fetch products on component mount
    useEffect(() => {
        loadProducts();
    }, []);

    // Filter items when filter or items change
    useEffect(() => {
        filterItems();
    }, [filter, items]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await getAllPublic('catalog');

            if (response && response.success) {
                // Transform the data to match component expectations
                const transformedData = response.data.map(item => ({
                    ...item,
                    // Add inStock property based on stock number
                    inStock: item.stock !== 0,
                    // Ensure we have the right image URL
                    image: item.image || (item.images?.[0]?.url) || '/placeholder-image.jpg',
                    // Transform item_type to category for filtering
                    displayCategory: item.item_type,
                }));

                setItems(transformedData);
            } else {
                setError(response.message);
                toast.error(response.message || "Request failed, please try again later.");
            }
        } catch (err) {
            const errorMessage = 'Failed to load products';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const filterItems = () => {
        if (filter === 'all') {
            setFilteredItems(items);
        } else {
            const filtered = items.filter(item => {
                // Check both item_type and category fields
                return item.item_type === filter || item.category === filter || item.displayCategory === filter;
            });
            setFilteredItems(filtered);
        }
    };

    const addToCart = (product) => {
        // Ensure the product has required fields for cart
        const cartItem = {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            description: product.description,
            // Add any other fields your cart needs
        };

        addItem(cartItem);
        toast.success(t('addedToCart', { productName: product.name }));
    };

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
    };

    // Loading state
    if (loading) {
        return (
            <div className="section">
                <div className="flex items-center justify-center min-h-64">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="text-4xl text-blue-600"
                    >
                        <FaSpinner />
                    </motion.div>
                </div>
            </div>
        );
    }

    // Error state
    if (error && items.length === 0) {
        return (
            <div className="section">
                <div className="text-center">
                    <div className="text-red-600 mb-4">
                        <h2 className="text-2xl font-bold mb-2">Error Loading Products</h2>
                        <p>{error}</p>
                    </div>
                    <button
                        onClick={loadProducts}
                        className="button"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="section">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-4xl font-bold">{t('shopTitle')}</h1>
                </div>

                {/* Products Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredItems.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            className="card relative"
                        >
                            {/* Category Badge */}
                            <div className="absolute top-2 right-2 z-10">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                    item.item_type === 'service' || item.category === 'service'
                                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                }`}>
                                    {item.item_type === 'service' || item.category === 'service' ? 'Service' : 'Product'}
                                </span>
                            </div>

                            {/* Featured Badge - you might need to add a featured field to your API */}
                            {item.featured && (
                                <div className="absolute top-2 left-2 z-10">
                                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                        Featured
                                    </span>
                                </div>
                            )}

                            {/* Stock Badge */}
                            {item.stock === 0 && (
                                <div className="absolute top-2 left-2 z-10">
                                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                        Out of Stock
                                    </span>
                                </div>
                            )}

                            <div className="w-full h-56 overflow-hidden">
                                <Image
                                    width={300}
                                    height={300}
                                    src={item.image}
                                    alt={item.name}
                                    priority={true}
                                    className="w-full h-full object-cover rounded-xl"
                                    onError={(e) => {
                                        e.target.src = '/placeholder-image.jpg'; // Fallback image
                                    }}
                                />
                            </div>
                            <div className="p-2 flex flex-col flex-grow">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                    {item.name}
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 flex-grow">
                                    {item.description}
                                </p>

                                {/* Stock info */}
                                <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                                    Stock: {item.stock} {item.unit_type || 'pieces'}
                                </p>

                                <div className="flex items-center justify-between">
                                    <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                                        €{item.price.toFixed(2)}
                                    </p>
                                    <motion.button
                                        onClick={() => addToCart(item)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        disabled={!item.inStock}
                                        className={`button ${
                                            !item.inStock
                                                ? 'opacity-50 cursor-not-allowed'
                                                : ''
                                        }`}
                                    >
                                        {item.inStock ? t('addToCart') : 'Out of Stock'}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* No items message */}
                {filteredItems.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400 text-lg">
                            No items found for the selected filter.
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            Total items loaded: {items.length}
                        </p>
                    </div>
                )}

                {/* Back link */}
                <div className="mt-10 text-center">
                    <Link
                        href="/"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        ← {t('backToHome')}
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}

export default Shop;
