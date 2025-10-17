// @/app/shop/cart/page.jsx

"use client"

import { useCart } from 'react-use-cart';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, ArrowRight, Lock } from 'lucide-react';
import FreeShippingProgressBar from '../components/FreeShippingProgressBar';

const Cart = () => {
    const t = useTranslations('Cart');
    const {
        cartTotal,
        items,
        totalItems,
        updateItemQuantity,
        removeItem,
        emptyCart
    } = useCart();

    const [storeSettings, setStoreSettings] = useState(null);
    const [vatBreakdown, setVatBreakdown] = useState({ subtotal: 0, vatAmount: 0, total: 0 });

    // Fetch store settings for consistent pricing and shipping
    useEffect(() => {
        const fetchStoreSettings = async () => {
            try {
                const response = await fetch('/api/query/public/store_settings');
                const result = await response.json();
                if (result.success && result.data?.[0]) {
                    setStoreSettings(result.data[0]);
                }
            } catch (error) {
                console.error('Failed to fetch store settings:', error);
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
        <>
            <div className="container mx-auto px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {totalItems > 0 && (
                        <>
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <ShoppingCart className="h-8 w-8" />
                                    <h1 className="text-4xl font-bold">{t('title')}</h1> 
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleEmptyCart}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {t('emptyCart')}
                                </Button>
                            </div>
                        </>
                    )}

                    {totalItems === 0 ? (
                        // Empty Cart State
                        <Card className="max-w-md mx-auto">
                            <CardContent className="text-center py-16">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <ShoppingCart className="mx-auto h-24 w-24 text-muted-foreground mb-8" />
                                    <CardTitle className="text-3xl mb-4">
                                        {t('emptyCartTitle')}
                                    </CardTitle>
                                    <CardDescription className="text-lg mb-8 max-w-md mx-auto">
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
                    ) : (
                        <>
                        <div className="grid lg:grid-cols-3 gap-8">
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
                                                    className="py-6 border-b last:border-b-0"
                                                >
                                                    <div className="flex items-center flex-wrap gap-4">
                                                        {/* Product Image */}
                                                        {item.image && (
                                                            <div className="flex-shrink-0">
                                                                <Image
                                                                    width={80}
                                                                    height={80}
                                                                    src={item.image}
                                                                    alt={item.name}
                                                                    className="w-20 h-20 object-cover rounded-lg border"
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Product Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-lg font-semibold truncate">
                                                                {item.name}
                                                            </h3>
                                                            <div className="mt-1 space-y-1">
                                                                <Badge variant="outline">
                                                                    {t('unitPrice', { price: `${storeSettings?.currency === 'USD' ? '$' : '€'}${item.price.toFixed(2)}` })}
                                                                </Badge>
                                                            </div>
                                                        </div>

                                                        {/* Quantity Controls */}
                                                        <div className="flex items-center border rounded-lg bg-muted/30">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleQuantityDecrease(item.id, item.quantity)}
                                                                disabled={item.quantity <= 1}
                                                                className="h-10 w-10 p-0"
                                                            >
                                                                <Minus className="h-4 w-4" />
                                                            </Button>
                                                            <span className="px-4 py-2 font-semibold min-w-[50px] text-center">
                                                                {item.quantity}
                                                            </span>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleQuantityIncrease(item.id, item.quantity)}
                                                                className="h-10 w-10 p-0"
                                                            >
                                                                <Plus className="h-4 w-4" />
                                                            </Button>
                                                        </div>

                                                        {/* Price & Remove */}
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-lg font-bold">
                                                                {storeSettings?.currency === 'USD' ? '$' : '€'}{(item.price * item.quantity).toFixed(2)}
                                                            </span>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleRemoveItem(item.id)}
                                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </CardContent>
                                </Card>

                                {storeSettings && storeSettings.freeShippingEnabled && (
                                    <FreeShippingProgressBar
                                        cartTotal={cartTotal}
                                        storeSettings={storeSettings}
                                    />
                                )}
                            </div>


                            {/* Order Summary */}
                            <div className="lg:col-span-1">
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: 0.2 }}
                                    className="border border-border rounded-lg p-4 bg-card backdrop-blur-sm h-fit sticky top-4"
                                >
                                    <h2 className="text-xl font-semibold mb-6">{t('orderSummary')}</h2>

                                    {/* Price Breakdown */}
                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between text-gray-600">
                                            <span>{totalItems} {t('articles')}</span>
                                            <span>{storeSettings?.currency === 'USD' ? '$' : '€'}{cartTotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span className="flex items-center">
                                                {t('shipping')}
                                            </span>
                                            <span>
                                                {isEligibleForFreeShipping ? (
                                                    <>
                                                        <span className="text-green-600 font-semibold">Gratuit</span>
                                                    </>
                                                ) : (
                                                    'Calculé au checkout'
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>TVA ({storeSettings?.vatPercentage || 20}%)</span>
                                            <span className="text-green-600 font-semibold">
                                                {storeSettings?.vatIncludedInPrice ? 'Inclus' : 'Exclu'}
                                            </span>
                                        </div>
                                        <div className="border-t border-gray-200 pt-3">
                                            <div className="flex justify-between text-xl font-bold">
                                                <span>{t('subtotal')}</span>
                                                <span>{storeSettings?.currency === 'USD' ? '$' : '€'}{totalPrice}</span>
                                            </div>
                                        </div>

                                        {/* Savings indicator (to do) */}

                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-3 flex flex-col">
                                  
                                        <Link
                                            href="/shop/checkout"
                                            className="w-full"
                                        >
                                            <Button className="w-full">
                                            {t('proceedToCheckout')}
                                            </Button> 
                                        </Link>
                                        <Link
                                            href="/shop"
                                            className="w-full"
                                        >
                                            <Button className="w-full" variant="secondary">
                                            {t('continueShopping')}
                                            </Button> 
                                        </Link>
                                    </div>

                                    {/* Security Notice */}
                                    <div className="mt-6 p-3 bg-accent/50 rounded-lg border border-border">
                                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                            <Lock className="w-4 h-4" />
                                            <span>{t('securePayment')}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                        </>
                )}
                    <div className="w-full flex justify-center mt-8">
                        <Button variant="ghost" asChild>
                            <Link href="/">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                {t('backToHome')}
                            </Link>
                        </Button>
                    </div>
                </motion.div>
            </div>
        </>
    );
};

export default Cart;
