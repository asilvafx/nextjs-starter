// @/app/shop/cart/page.jsx

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Lock, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useCart } from 'react-use-cart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import FreeShippingProgressBar from '../components/FreeShippingProgressBar';

const Cart = () => {
    const t = useTranslations('Cart');
    const { cartTotal, items, totalItems, updateItemQuantity, removeItem, emptyCart } = useCart();

    const [storeSettings, setStoreSettings] = useState(null);
    const [_vatBreakdown, _setVatBreakdown] = useState({ subtotal: 0, vatAmount: 0, total: 0 });
    const [isLoading, setIsLoading] = useState(true);

    // Fetch store settings for consistent pricing and shipping
    useEffect(() => {
        const fetchStoreSettings = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/query/public/store_settings');
                const result = await response.json();
                if (result.success && result.data?.[0]) {
                    setStoreSettings(result.data[0]);
                }
            } catch (error) {
                console.error('Failed to fetch store settings:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStoreSettings();
    }, []);

    const FREE_SHIPPING_THRESHOLD = storeSettings?.freeShippingThreshold || 50;
    const isEligibleForFreeShipping = storeSettings?.freeShippingEnabled && cartTotal >= FREE_SHIPPING_THRESHOLD;

    // Calculate VAT breakdown
    const calculateVatBreakdown = () => {
        if (!storeSettings) return { subtotal: cartTotal, vatAmount: 0, total: cartTotal };

        const vatRate = storeSettings.vatPercentage / 100;

        if (storeSettings.vatIncludedInPrice) {
            // VAT is already included in item prices
            const subtotalExclVat = cartTotal / (1 + vatRate);
            const vatAmount = cartTotal - subtotalExclVat;
            return {
                subtotal: subtotalExclVat,
                vatAmount: vatAmount,
                total: cartTotal
            };
        } else {
            // VAT needs to be added
            const vatAmount = storeSettings.applyVatAtCheckout ? cartTotal * vatRate : 0;
            return {
                subtotal: cartTotal,
                vatAmount: vatAmount,
                total: cartTotal + vatAmount
            };
        }
    };

    const vatInfo = calculateVatBreakdown();
    const totalPrice = vatInfo.total.toFixed(2);

    const handleQuantityIncrease = (id, currentQuantity) => {
        updateItemQuantity(id, currentQuantity + 1);
    };

    const handleQuantityDecrease = (id, currentQuantity) => {
        if (currentQuantity > 1) {
            updateItemQuantity(id, currentQuantity - 1);
        }
    };

    const handleRemoveItem = (id) => {
        removeItem(id);
    };

    const handleEmptyCart = () => {
        if (window.confirm(t('confirmEmptyCart'))) {
            emptyCart();
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                {totalItems > 0 && (
                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h1 className="font-bold text-4xl">{t('title')}</h1>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleEmptyCart}
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('emptyCart')}
                        </Button>
                    </div>
                )}

                {totalItems === 0 ? (
                    // Empty Cart State
                    <Card className="mx-auto max-w-md">
                        <CardContent className="py-16 text-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}>
                                <ShoppingCart className="mx-auto mb-8 h-24 w-24 text-muted-foreground" />
                                <CardTitle className="mb-4 text-3xl">{t('emptyCartTitle')}</CardTitle>
                                <CardDescription className="mx-auto mb-8 max-w-md text-lg">
                                    {t('emptyCartMessage')}
                                </CardDescription>
                                <Button asChild size="lg">
                                    <Link href="/shop">
                                        <ShoppingCart className="mr-2 h-5 w-5" />
                                        {t('goToShop')}
                                    </Link>
                                </Button>
                            </motion.div>
                        </CardContent>
                    </Card>
                ) : isLoading ? (
                    // Loading Skeleton
                    <div className="grid gap-8 lg:grid-cols-3">
                        {/* Cart Items Skeleton */}
                        <div className="lg:col-span-2">
                            <Card className="mb-6">
                                <CardHeader>
                                    <Skeleton className="h-6 w-48" />
                                </CardHeader>
                                <CardContent>
                                    {[...Array(3)].map((_, index) => (
                                        <div key={index} className="border-b py-6 last:border-b-0">
                                            <div className="flex flex-wrap items-center gap-4">
                                                <Skeleton className="h-20 w-20 rounded-lg" />
                                                <div className="min-w-0 flex-1 space-y-2">
                                                    <Skeleton className="h-5 w-48" />
                                                    <Skeleton className="h-4 w-24" />
                                                </div>
                                                <Skeleton className="h-10 w-32" />
                                                <Skeleton className="h-6 w-16" />
                                                <Skeleton className="h-8 w-8 rounded" />
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                            <Skeleton className="h-20 w-full" />
                        </div>

                        {/* Order Summary Skeleton */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-4 h-fit rounded-lg border border-border bg-card p-4 backdrop-blur-sm">
                                <Skeleton className="mb-6 h-6 w-32" />
                                <div className="mb-6 space-y-3">
                                    {[...Array(4)].map((_, index) => (
                                        <div key={index} className="flex justify-between">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-4 w-16" />
                                        </div>
                                    ))}
                                </div>
                                <Skeleton className="mb-3 h-12 w-full" />
                                <Skeleton className="mb-6 h-12 w-full" />
                                <Skeleton className="h-16 w-full" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-8 lg:grid-cols-3">
                        {/* Cart Items */}
                        <div className="lg:col-span-2">
                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ShoppingCart className="h-5 w-5" />
                                        {t('items', { count: totalItems })}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <AnimatePresence>
                                        {items.map((item, index) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -100 }}
                                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                                className="border-b py-6 last:border-b-0">
                                                <div className="flex flex-wrap items-center gap-4">
                                                    {/* Product Image */}
                                                    {item.image && (
                                                        <div className="flex-shrink-0">
                                                            <Image
                                                                width={80}
                                                                height={80}
                                                                src={item.image}
                                                                alt={item.name}
                                                                className="h-20 w-20 rounded-lg border object-cover"
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Product Info */}
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="truncate font-semibold text-lg">{item.name}</h3>
                                                        <div className="mt-1 space-y-1">
                                                            <Badge variant="outline">
                                                                {t('unitPrice', {
                                                                    price: `${storeSettings?.currency === 'USD' ? '$' : '€'}${item.price.toFixed(2)}`
                                                                })}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center rounded-lg border bg-muted/30">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleQuantityDecrease(item.id, item.quantity)
                                                            }
                                                            disabled={item.quantity <= 1}
                                                            className="h-10 w-10 p-0">
                                                            <Minus className="h-4 w-4" />
                                                        </Button>
                                                        <span className="min-w-[50px] px-4 py-2 text-center font-semibold">
                                                            {item.quantity}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleQuantityIncrease(item.id, item.quantity)
                                                            }
                                                            className="h-10 w-10 p-0">
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>

                                                    {/* Price & Remove */}
                                                    <div className="flex items-center gap-4">
                                                        <span className="font-bold text-lg">
                                                            {storeSettings?.currency === 'USD' ? '$' : '€'}
                                                            {(item.price * item.quantity).toFixed(2)}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleRemoveItem(item.id)}
                                                            className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </CardContent>
                            </Card>

                            {storeSettings?.freeShippingEnabled && (
                                <FreeShippingProgressBar cartTotal={cartTotal} storeSettings={storeSettings} />
                            )}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                                className="sticky top-4 h-fit rounded-lg border border-border bg-card p-4 backdrop-blur-sm">
                                <h2 className="mb-6 font-semibold text-xl">{t('orderSummary')}</h2>

                                {/* Price Breakdown */}
                                <div className="mb-6 space-y-3">
                                    <div className="flex justify-between text-gray-600">
                                        <span>
                                            {totalItems} {totalItems === 1 ? t('article') : t('articles')}
                                        </span>
                                        <span>
                                            {storeSettings?.currency === 'USD' ? '$' : '€'}
                                            {cartTotal.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span className="flex items-center">{t('shipping')}</span>
                                        <span>
                                            {isEligibleForFreeShipping ? (
                                                <span className="font-semibold text-green-600">Gratuit</span>
                                            ) : (
                                                'Calculé au checkout'
                                            )}
                                        </span>
                                    </div>
                                    {storeSettings?.vatEnabled && (
                                        <div className="flex justify-between text-gray-600">
                                            <span>TVA ({storeSettings?.vatPercentage || 20}%)</span>
                                            <span className="font-semibold text-green-600">
                                                {storeSettings?.vatIncludedInPrice ? 'Inclus' : 'Exclu'}
                                            </span>
                                        </div>
                                    )}
                                    <div className="border-gray-200 border-t pt-3">
                                        <div className="flex justify-between font-bold text-xl">
                                            <span>{t('subtotal')}</span>
                                            <span>
                                                {storeSettings?.currency === 'USD' ? '$' : '€'}
                                                {totalPrice}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Savings indicator (to do) */}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col space-y-3">
                                    <Link href="/shop/checkout" className="w-full">
                                        <Button className="w-full">{t('proceedToCheckout')}</Button>
                                    </Link>
                                    <Link href="/shop" className="w-full">
                                        <Button className="w-full" variant="secondary">
                                            {t('continueShopping')}
                                        </Button>
                                    </Link>
                                </div>

                                {/* Security Notice */}
                                <div className="mt-6 rounded-lg border border-border bg-accent/50 p-3">
                                    <div className="flex items-center space-x-2 text-muted-foreground text-xs">
                                        <Lock className="h-4 w-4" />
                                        <span>{t('securePayment')}</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
                <div className="mt-8 flex w-full justify-center">
                    <Button variant="ghost" asChild>
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            {t('backToHome')}
                        </Link>
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

export default Cart;
