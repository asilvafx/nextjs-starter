// app/shop/checkout/page.jsx
"use client"

import { useEffect, useState } from 'react';
import { useCart } from 'react-use-cart';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useTranslations } from 'next-intl';
import PaymentForm from './PaymentForm.jsx';

// Use environment variables
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PK);

const Checkout = () => {
    const t = useTranslations('Checkout');
    const { cartTotal, items, totalItems } = useCart();
    const [stripeOptions, setStripeOptions] = useState(null);
    const [shippingCost, setShippingCost] = useState(5.99);
    const [selectedShippingMethod, setSelectedShippingMethod] = useState(null);

    const FREE_SHIPPING_THRESHOLD = 50;
    const isEligibleForFreeShipping = cartTotal >= FREE_SHIPPING_THRESHOLD;

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
    const totalPrice = (cartTotal + finalShippingCost).toFixed(2);

    // Handler for shipping cost updates from PaymentForm
    const handleShippingUpdate = (newShippingCost, shippingMethod) => {
        setSelectedShippingMethod(shippingMethod);

        // Override shipping cost if free shipping is eligible and method supports it
        if (shippingMethod && shippingMethod.id === 3 && isEligibleForFreeShipping) {
            setShippingCost(0);
        } else {
            setShippingCost(newShippingCost);
        }
    };

    // Update shipping cost when cart total changes and affects free shipping eligibility
    useEffect(() => {
        const newShippingCost = calculateShippingCost();
        setShippingCost(newShippingCost);
    }, [cartTotal, isEligibleForFreeShipping, selectedShippingMethod]);

    useEffect(() => {
        // Set up Stripe options when cart total or shipping changes
        if (cartTotal > 0) {
            setStripeOptions({
                mode: 'payment',
                amount: Math.round(totalPrice * 100), // Convert to cents
                currency: 'eur',
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
    }, [cartTotal, totalPrice]);

    return (
        <>
            <div className="section">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-4xl font-bold mb-8 text-start">{t('checkoutTitle')}</h1>

                    {totalItems === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12"
                        >
                            <div className="mb-6">
                                <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-medium text-gray-900 mb-2">
                                {t('emptyCartTitle')}
                            </h3>
                            <p className="text-gray-500 mb-8">
                                {t('emptyCartMessage')}
                            </p>
                            <Link
                                href="/shop"
                                className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200"
                            >
                                {t('continueShopping')}
                            </Link>
                        </motion.div>
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
                                <div className="bg-gray-50 border rounded-sm p-4">
                                    <h2 className="text-xl font-semibold mb-6">{t('checkoutInformation')}</h2>
                                    {stripeOptions && (
                                        <Elements stripe={stripePromise} options={stripeOptions}>
                                            <PaymentForm
                                                cartTotal={totalPrice}
                                                subTotal={subTotal}
                                                shippingCost={finalShippingCost}
                                                onShippingUpdate={handleShippingUpdate}
                                                selectedShippingMethod={selectedShippingMethod}
                                                isEligibleForFreeShipping={isEligibleForFreeShipping}
                                            />
                                        </Elements>
                                    )}
                                </div>
                            </motion.div>

                            {/* Right: Order Summary */}
                            <motion.div
                                className="order-1 lg:order-2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="bg-gray-50 border rounded-sm p-4 lg:sticky lg:top-24">
                                    <h2 className="text-xl font-semibold mb-6">{t('orderSummary')}</h2>

                                    {/* Items */}
                                    <div className="space-y-4 mb-6">
                                        {items.map(item => (
                                            <motion.div
                                                key={item.id}
                                                className="flex items-center space-x-4 p-3 border bg-white rounded-lg"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                            >
                                                {item.image && (
                                                    <Image
                                                        width={16}
                                                        height={16}
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-16 h-16 object-cover rounded-md"
                                                    />
                                                )}
                                                <div className="flex-1">
                                                    <h3 className="font-medium">{item.name}</h3>
                                                    <p className="text-sm text-gray-500">
                                                        {t('quantity')}: {item.quantity}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold">€{(item.price * item.quantity).toFixed(2)}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Price Breakdown */}
                                    <div className="border-t border-gray-200 pt-4 space-y-3">
                                        <div className="flex justify-between text-gray-600">
                                            <span>{t('subtotal')}</span>
                                            <span>€{cartTotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span className="flex items-center">
                                                {t('shipping')}
                                            </span>
                                            <span
                                                className={finalShippingCost === 0 && isEligibleForFreeShipping ? 'text-gray-400' : ''}>
                                                {finalShippingCost === 0 && isEligibleForFreeShipping ? (
                                                    <>
                                                        <span className="text-green-600 font-semibold">Gratuit</span>
                                                    </>
                                                ) : (
                                                    selectedShippingMethod ? (
                                                        <>€{finalShippingCost.toFixed(2)}</>
                                                    ) : (
                                                        <>-</>
                                                    )
                                                )}
                                            </span>
                                        </div>
                                        {selectedShippingMethod && (
                                            <div className="flex justify-between text-sm text-gray-500">
                                                <span>via {selectedShippingMethod.carrier_name}</span>
                                                <span>{selectedShippingMethod.delivery_time}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between text-gray-600">
                                            <span>TVA (23%)</span>
                                            <span className="text-green-600 font-semibold">Inclus</span>
                                        </div>

                                        <div
                                            className="flex justify-between text-lg font-bold border-t border-gray-200 pt-3">
                                            <span>{t('total')}</span>
                                            <span>€{totalPrice}</span>
                                        </div>

                                        {/* Savings indicator (to do) */}

                                    </div>

                                    {/* Security Notice */}
                                    <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                                        <div className="flex items-center space-x-2 text-sm text-blue-700">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2-2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                            </svg>
                                            <span>{t('securePayment')}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Navigation Links */}
                    <motion.div
                        className="mt-8 text-center space-x-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Link
                            href="/shop"
                            className="text-gray-600 hover:text-primary transition-colors duration-200"
                        >
                            ← {t('continueShopping')}
                        </Link>
                        {totalItems > 0 && (
                            <>
                                <span className="text-gray-300">|</span>
                                <Link
                                    href="/shop/cart"
                                    className="text-gray-600 hover:text-primary transition-colors duration-200"
                                >
                                    {t('modifyCart')}
                                </Link>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            </div>
        </>
    );
};

export default Checkout;
