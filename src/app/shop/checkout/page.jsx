// @/app/shop/checkout/page.jsx
"use client"

import { useEffect, useState } from 'react';
import { useCart } from 'react-use-cart';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Lock, ArrowLeft } from 'lucide-react';
import PaymentForm from './PaymentForm.jsx';

// Use environment variables
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PK);

const Checkout = () => {
    const t = useTranslations('Checkout');
    const { cartTotal, items, totalItems } = useCart();
    const [stripeOptions, setStripeOptions] = useState(null);
    const [shippingCost, setShippingCost] = useState(5.99);
    const [selectedShippingMethod, setSelectedShippingMethod] = useState(null);
    const [storeSettings, setStoreSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [discountAmount, setDiscountAmount] = useState(0);

    // Use store settings for free shipping threshold
    const FREE_SHIPPING_THRESHOLD = storeSettings?.freeShippingThreshold || 50;
    const isEligibleForFreeShipping = storeSettings?.freeShippingEnabled && cartTotal >= FREE_SHIPPING_THRESHOLD;

    // Calculate shipping cost based on free shipping eligibility
    const calculateShippingCost = () => {
        if (selectedShippingMethod) {
            // If free shipping is selected and eligible, cost is 0
            if (selectedShippingMethod.id === 3 && isEligibleForFreeShipping) {
                return 0;
            }
            return selectedShippingMethod.fixed_rate;
        }
        // Default shipping cost
        return isEligibleForFreeShipping && 0;
    };

    const subTotal = cartTotal.toFixed(2);
    const finalShippingCost = calculateShippingCost();
    const totalPrice = Math.max(0, cartTotal + finalShippingCost - discountAmount).toFixed(2);

    // Handler for shipping cost updates from PaymentForm
    const handleShippingUpdate = (newShippingCost, shippingMethod, discountAmount = 0) => {
        setSelectedShippingMethod(shippingMethod);

        // Override shipping cost if free shipping is eligible and method supports it
        if (shippingMethod && shippingMethod.id === 3 && isEligibleForFreeShipping) {
            setShippingCost(0);
        } else if (typeof newShippingCost === 'number') {
            setShippingCost(newShippingCost);
        }
        
        // Handle discount amount if provided
        if (discountAmount !== undefined) {
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
            const response = await fetch('/api/store/settings');
            const result = await response.json();
            if (result.success) {
                setStoreSettings(result.data);
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
        if (cartTotal > 0 && storeSettings) {
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
                        borderRadius: '0.6rem',
                    },
                },
                payment_method_types: ['card'],
            });
        }
    }, [cartTotal, totalPrice, storeSettings]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="space-y-6">
                    <Skeleton className="h-10 w-64" />
                    <div className="grid lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <Skeleton className="h-48 w-full" />
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="container mx-auto px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center gap-2 mb-8">
                        <ShoppingCart className="h-8 w-8" />
                        <h1 className="text-4xl font-bold">{t('checkoutTitle')}</h1>
                    </div>

                    {totalItems === 0 ? (
                        <Card className="max-w-md mx-auto">
                            <CardContent className="text-center py-12">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <ShoppingCart className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
                                    <CardTitle className="text-2xl mb-2">
                                        {t('emptyCartTitle')}
                                    </CardTitle>
                                    <CardDescription className="mb-6">
                                        {t('emptyCartMessage')}
                                    </CardDescription>
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
                            className="grid lg:grid-cols-2 gap-8"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            {/* Left: Payment Form */}
                            <motion.div
                                className="order-2 lg:order-1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('checkoutInformation')}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {stripeOptions && (
                                            <Elements stripe={stripePromise} options={stripeOptions}>
                                                <PaymentForm
                                                    cartTotal={totalPrice}
                                                    subTotal={subTotal}
                                                    shippingCost={finalShippingCost}
                                                    onShippingUpdate={handleShippingUpdate}
                                                    selectedShippingMethod={selectedShippingMethod}
                                                    isEligibleForFreeShipping={isEligibleForFreeShipping}
                                                    storeSettings={storeSettings}
                                                />
                                            </Elements>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Right: Order Summary */}
                            <motion.div
                                className="order-1 lg:order-2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card className="lg:sticky lg:top-24">
                                    <CardHeader>
                                        <CardTitle>{t('orderSummary')}</CardTitle>
                                    </CardHeader>
                                    <CardContent>

                                        {/* Items */}
                                        <div className="space-y-4 mb-6">
                                            {items.map(item => (
                                                <motion.div
                                                    key={item.id}
                                                    className="flex items-center space-x-4 p-3 border rounded-lg bg-muted/30"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                >
                                                    {item.image && (
                                                        <Image
                                                            width={64}
                                                            height={64}
                                                            src={item.image}
                                                            alt={item.name}
                                                            className="w-16 h-16 object-cover rounded-md border"
                                                        />
                                                    )}
                                                    <div className="flex-1">
                                                        <h3 className="font-medium">{item.name}</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="outline">{t('quantity')}: {item.quantity}</Badge>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold">{storeSettings?.currency === 'USD' ? '$' : '€'}{(item.price * item.quantity).toFixed(2)}</p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>

                                        <Separator className="my-4" />
                                        
                                        {/* Price Breakdown */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>{t('subtotal')}</span>
                                                <span>{storeSettings?.currency === 'USD' ? '$' : '€'}{cartTotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-muted-foreground">
                                                <span className="flex items-center">
                                                    {t('shipping')}
                                                </span>
                                                <span>
                                                    {finalShippingCost === 0 && isEligibleForFreeShipping ? (
                                                        <Badge variant="secondary" className="text-green-600">Gratuit</Badge>
                                                    ) : (
                                                        selectedShippingMethod ? (
                                                            <>{storeSettings?.currency === 'USD' ? '$' : '€'}{finalShippingCost.toFixed(2)}</>
                                                        ) : (
                                                            <>-</>
                                                        )
                                                    )}
                                                </span>
                                            </div>
                                            {selectedShippingMethod && (
                                                <div className="flex justify-between text-sm text-muted-foreground">
                                                    <span>via {selectedShippingMethod.carrier_name}</span>
                                                    <span>{selectedShippingMethod.delivery_time}</span>
                                                </div>
                                            )}

                                            {discountAmount > 0 && (
                                                <div className="flex justify-between text-green-600">
                                                    <span>Discount</span>
                                                    <span>-{storeSettings?.currency === 'USD' ? '$' : '€'}{discountAmount.toFixed(2)}</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between text-muted-foreground">
                                                <span>TVA ({storeSettings?.vatPercentage || 20}%)</span>
                                                <Badge variant="outline" className="text-green-600">
                                                    {storeSettings?.vatIncludedInPrice ? 'Inclus' : 'Exclu'}
                                                </Badge>
                                            </div>

                                            <Separator />
                                            
                                            <div className="flex justify-between text-lg font-bold">
                                                <span>{t('total')}</span>
                                                <span>{storeSettings?.currency === 'USD' ? '$' : '€'}{totalPrice}</span>
                                            </div>
                                        </div>

                                        {/* Security Notice */}
                                        <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                            <div className="flex items-center space-x-2 text-sm text-blue-700 dark:text-blue-300">
                                                <Lock className="w-4 h-4" />
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
                        transition={{ delay: 0.3 }}
                    >
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
        </>
    );
};

export default Checkout;
