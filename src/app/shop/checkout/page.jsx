// @/app/shop/checkout/page.jsx
'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useCart } from 'react-use-cart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import PaymentForm from './PaymentForm.jsx';

// Stripe promise will be initialized dynamically from store settings
let stripePromise = null;

const Checkout = () => {
    const t = useTranslations('Checkout');
    const { cartTotal, items, totalItems } = useCart();
    const [stripeOptions, setStripeOptions] = useState(null);
    const [_shippingCost, setShippingCost] = useState(0);
    const [selectedShippingMethod, setSelectedShippingMethod] = useState(null);
    const [storeSettings, setStoreSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [_vatBreakdown, _setVatBreakdown] = useState({ subtotal: 0, vatAmount: 0, total: 0 });
    const [stripeReady, setStripeReady] = useState(false);

    // Use store settings for free shipping threshold
    const FREE_SHIPPING_THRESHOLD = storeSettings?.freeShippingThreshold || 50;
    const isEligibleForFreeShipping = storeSettings?.freeShippingEnabled && cartTotal >= FREE_SHIPPING_THRESHOLD;

    // Calculate shipping cost based on free shipping eligibility
    const calculateShippingCost = () => {
        if (selectedShippingMethod) {
            // If free shipping is eligible and this is the free shipping method, return 0
            if (isEligibleForFreeShipping && selectedShippingMethod.id === 'free_shipping') {
                return 0;
            }
            // Return the selected method's cost
            return (
                selectedShippingMethod.fixed_rate ||
                selectedShippingMethod.base_price ||
                selectedShippingMethod.basePrice ||
                0
            );
        }

        // If no method selected, return 0 (user needs to select a method)
        return 0;
    };

    // Calculate VAT breakdown
    const calculateVatBreakdown = () => {
        if (!storeSettings || !storeSettings.vatEnabled) {
            return { subtotal: cartTotal, vatAmount: 0, total: cartTotal };
        }

        const vatRate = storeSettings.vatPercentage / 100;

        if (storeSettings.vatIncludedInPrice) {
            // VAT is already included in item prices
            const subtotalExclVat = cartTotal / (1 + vatRate);
            const vatAmount = cartTotal - subtotalExclVat;
            return {
                subtotal: cartTotal, // Show actual item prices as subtotal
                vatAmount: vatAmount,
                total: cartTotal
            };
        } else {
            // VAT needs to be added at checkout if configured
            const vatAmount = storeSettings.applyVatAtCheckout ? cartTotal * vatRate : 0;
            return {
                subtotal: cartTotal, // Show actual item prices as subtotal
                vatAmount: vatAmount,
                total: cartTotal + vatAmount
            };
        }
    };

    const vatInfo = calculateVatBreakdown();
    const subTotal = cartTotal.toFixed(2); // Simple sum of all item prices
    const finalShippingCost = calculateShippingCost();
    const totalPrice = Math.max(0, vatInfo.total + finalShippingCost - discountAmount).toFixed(2);

    // Handler for shipping cost updates from PaymentForm
    const handleShippingUpdate = (_newShippingCost, shippingMethod, discountAmount = 0) => {
        setSelectedShippingMethod(shippingMethod);

        // Set shipping cost based on method selection
        if (shippingMethod) {
            const methodCost = shippingMethod.fixed_rate || shippingMethod.base_price || shippingMethod.basePrice || 0;
            // If free shipping is eligible and this is the free shipping method, cost is 0
            if (isEligibleForFreeShipping && shippingMethod.id === 'free_shipping') {
                setShippingCost(0);
            } else {
                setShippingCost(methodCost);
            }
        } else {
            setShippingCost(0);
        }

        if (typeof discountAmount === 'number') {
            setDiscountAmount(discountAmount);
        }
    };

    // Update shipping cost when cart total changes and affects free shipping eligibility
    useEffect(() => {
        const newShippingCost = calculateShippingCost();
        setShippingCost(newShippingCost);
    }, [cartTotal, isEligibleForFreeShipping, selectedShippingMethod]);

    // Fetch store settings
    const fetchStoreSettings = async () => {
        try {
            const response = await fetch('/api/query/public/store_settings');
            const result = await response.json();
            if (result.success && result.data?.[0]) {
                const settings = result.data[0];
                setStoreSettings(settings);

                // Initialize Stripe if card payments are enabled and keys are available
                if (settings.paymentMethods?.cardPayments && settings.paymentMethods?.stripePublicKey) {
                    try {
                        stripePromise = loadStripe(settings.paymentMethods.stripePublicKey);
                        setStripeReady(true);
                    } catch (error) {
                        console.error('Failed to initialize Stripe:', error);
                        setStripeReady(false);
                    }
                } else {
                    setStripeReady(false);
                }

                // Set initial shipping cost based on settings
                const defaultCost = settings.defaultShippingCost || 5.99;
                setShippingCost(defaultCost);
            }
        } catch (error) {
            console.error('Failed to fetch store settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStoreSettings();
    }, []);

    useEffect(() => {
        // Set up Stripe options when cart total or shipping changes
        if (cartTotal > 0 && storeSettings && stripeReady && storeSettings.paymentMethods?.cardPayments) {
            setStripeOptions({
                mode: 'payment',
                amount: Math.round(totalPrice * 100), // Convert to cents
                currency: (storeSettings?.currency || 'EUR').toLowerCase(),
                appearance: {
                    theme: 'stripe',
                    variables: {
                        colorPrimary: '#6772e5',
                        colorBackground: '#fff',
                        colorText: '#000',
                        colorDanger: '#df1b41',
                        fontFamily: 'Roboto, Open Sans, Segoe UI, sans-serif',
                        borderRadius: '0.6rem'
                    }
                },
                payment_method_types: ['card']
            });
        } else {
            setStripeOptions(null);
        }
    }, [cartTotal, totalPrice, storeSettings, stripeReady]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}>
                    {/* Header Skeleton */}
                    <div className="mb-8">
                        <Skeleton className="h-10 w-80" />
                    </div>

                    {/* Main Content Skeleton */}
                    <div className="grid gap-8 lg:grid-cols-2">
                        {/* Left: Payment Form Skeleton */}
                        <div className="order-2 lg:order-1">
                            <Card>
                                <CardHeader>
                                    <Skeleton className="h-6 w-48" />
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Contact Information */}
                                    <div className="space-y-4">
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>

                                    {/* Shipping Information */}
                                    <div className="space-y-4">
                                        <Skeleton className="h-5 w-36" />
                                        <div className="grid grid-cols-2 gap-4">
                                            <Skeleton className="h-10 w-full" />
                                            <Skeleton className="h-10 w-full" />
                                        </div>
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-10 w-full" />
                                        <div className="grid grid-cols-3 gap-4">
                                            <Skeleton className="h-10 w-full" />
                                            <Skeleton className="h-10 w-full" />
                                            <Skeleton className="h-10 w-full" />
                                        </div>
                                    </div>

                                    {/* Shipping Methods */}
                                    <div className="space-y-4">
                                        <Skeleton className="h-5 w-32" />
                                        <div className="space-y-2">
                                            {[...Array(3)].map((_, index) => (
                                                <Skeleton key={index} className="h-16 w-full" />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Payment Method */}
                                    <div className="space-y-4">
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-12 w-full" />
                                        <Skeleton className="h-32 w-full" />
                                    </div>

                                    {/* Submit Button */}
                                    <Skeleton className="h-12 w-full" />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right: Order Summary Skeleton */}
                        <div className="order-1 lg:order-2">
                            <Card className="lg:sticky lg:top-24">
                                <CardHeader>
                                    <Skeleton className="h-6 w-32" />
                                </CardHeader>
                                <CardContent>
                                    {/* Items Skeleton */}
                                    <div className="mb-6 space-y-4">
                                        {[...Array(3)].map((_, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center space-x-4 rounded-lg border bg-muted/30 p-3">
                                                <Skeleton className="h-16 w-16 rounded-md" />
                                                <div className="flex-1 space-y-2">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-24" />
                                                </div>
                                                <Skeleton className="h-4 w-16" />
                                            </div>
                                        ))}
                                    </div>

                                    <Separator className="my-4" />

                                    {/* Price Breakdown Skeleton */}
                                    <div className="space-y-3">
                                        {[...Array(5)].map((_, index) => (
                                            <div key={index} className="flex justify-between">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-4 w-16" />
                                            </div>
                                        ))}
                                        <Separator />
                                        <div className="flex justify-between">
                                            <Skeleton className="h-5 w-16" />
                                            <Skeleton className="h-5 w-20" />
                                        </div>
                                    </div>

                                    {/* Security Notice Skeleton */}
                                    <div className="mt-6">
                                        <Skeleton className="h-12 w-full rounded-lg" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Navigation Links Skeleton */}
                    <div className="mt-8 flex justify-center gap-4">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-28" />
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="mb-8 flex items-center gap-2">
                    <h1 className="font-bold text-4xl">{t('checkoutTitle')}</h1>
                </div>

                {totalItems === 0 ? (
                    <Card className="mx-auto max-w-md">
                        <CardContent className="py-12 text-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}>
                                <ShoppingCart className="mx-auto mb-6 h-24 w-24 text-muted-foreground" />
                                <CardTitle className="mb-2 text-2xl">{t('emptyCartTitle')}</CardTitle>
                                <CardDescription className="mb-6">{t('emptyCartMessage')}</CardDescription>
                                <Button asChild>
                                    <Link href="/shop">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        {t('continueShopping')}
                                    </Link>
                                </Button>
                            </motion.div>
                        </CardContent>
                    </Card>
                ) : (
                    <motion.div
                        className="grid gap-8 lg:grid-cols-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}>
                        {/* Left: Payment Form */}
                        <motion.div
                            className="order-2 lg:order-1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('checkoutInformation')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {stripeOptions && stripePromise && stripeReady ? (
                                        <Elements stripe={stripePromise} options={stripeOptions}>
                                            <PaymentForm
                                                cartTotal={totalPrice}
                                                subTotal={subTotal}
                                                shippingCost={finalShippingCost}
                                                onShippingUpdate={handleShippingUpdate}
                                                selectedShippingMethod={selectedShippingMethod}
                                                isEligibleForFreeShipping={isEligibleForFreeShipping}
                                                storeSettings={storeSettings}
                                                hasStripe={true}
                                            />
                                        </Elements>
                                    ) : (
                                        <PaymentForm
                                            cartTotal={totalPrice}
                                            subTotal={subTotal}
                                            shippingCost={finalShippingCost}
                                            onShippingUpdate={handleShippingUpdate}
                                            selectedShippingMethod={selectedShippingMethod}
                                            isEligibleForFreeShipping={isEligibleForFreeShipping}
                                            storeSettings={storeSettings}
                                            hasStripe={false}
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Right: Order Summary */}
                        <motion.div
                            className="order-1 lg:order-2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}>
                            <Card className="lg:sticky lg:top-24">
                                <CardHeader>
                                    <CardTitle>{t('orderSummary')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {/* Items */}
                                    <div className="mb-6 space-y-4">
                                        {items.map((item) => (
                                            <motion.div
                                                key={item.id}
                                                className="flex items-center space-x-4 rounded-lg border bg-muted/30 p-3"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}>
                                                {item.image && (
                                                    <Image
                                                        width={64}
                                                        height={64}
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="h-16 w-16 rounded-md border object-cover"
                                                    />
                                                )}
                                                <div className="flex-1">
                                                    <h3 className="font-medium">{item.name}</h3>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <Badge variant="outline">
                                                            {t('quantity')}: {item.quantity}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold">
                                                        {storeSettings?.currency === 'USD' ? '$' : '€'}
                                                        {(item.price * item.quantity).toFixed(2)}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    <Separator className="my-4" />

                                    {/* Price Breakdown */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>{t('subtotal')}</span>
                                            <span>
                                                {storeSettings?.currency === 'USD' ? '$' : '€'}
                                                {cartTotal.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span className="flex items-center">{t('shipping')}</span>
                                            <span>
                                                {selectedShippingMethod ? (
                                                    finalShippingCost === 0 ? (
                                                        <Badge variant="secondary" className="text-green-600">
                                                            Gratuit
                                                        </Badge>
                                                    ) : (
                                                        <>
                                                            {storeSettings?.currency === 'USD' ? '$' : '€'}
                                                            {finalShippingCost.toFixed(2)}
                                                        </>
                                                    )
                                                ) : (
                                                    <>-</>
                                                )}
                                            </span>
                                        </div>
                                        {selectedShippingMethod && (
                                            <div className="flex justify-between text-muted-foreground text-sm">
                                                <span>via {selectedShippingMethod.carrier_name}</span>
                                                <span>{selectedShippingMethod.delivery_time}</span>
                                            </div>
                                        )}

                                        {discountAmount > 0 && (
                                            <div className="flex justify-between text-green-600">
                                                <span>Discount</span>
                                                <span>
                                                    -{storeSettings?.currency === 'USD' ? '$' : '€'}
                                                    {discountAmount.toFixed(2)}
                                                </span>
                                            </div>
                                        )}

                                        {storeSettings?.vatEnabled && (
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>TVA ({storeSettings.vatPercentage}%)</span>
                                                {storeSettings.vatIncludedInPrice ? (
                                                    <Badge variant="outline" className="text-green-600">
                                                        Inclus
                                                    </Badge>
                                                ) : (
                                                    <span>
                                                        {storeSettings?.currency === 'USD' ? '$' : '€'}
                                                        {vatInfo.vatAmount.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        <Separator />

                                        <div className="flex justify-between font-bold text-lg">
                                            <span>{t('total')}</span>
                                            <span>
                                                {storeSettings?.currency === 'USD' ? '$' : '€'}
                                                {totalPrice}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Security Notice */}
                                    <div className="mt-6 rounded-lg border border-border bg-accent/50 p-3">
                                        <div className="flex items-center space-x-2 text-muted-foreground text-sm">
                                            <Lock className="h-4 w-4" />
                                            <span>{t('securePayment')}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}

                {/* Navigation Links */}
                <motion.div
                    className="mt-8 flex justify-center gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}>
                    <Button variant="ghost" asChild>
                        <Link href="/shop">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            {t('continueShopping')}
                        </Link>
                    </Button>
                    {totalItems > 0 && (
                        <Button variant="outline" asChild>
                            <Link href="/shop/cart">
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                {t('modifyCart')}
                            </Link>
                        </Button>
                    )}
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Checkout;
