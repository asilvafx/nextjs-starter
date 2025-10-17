// @/app/shop/checkout/success/page.jsx

"use client"

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useCart } from 'react-use-cart';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { generatePDF } from '@/utils/generatePDF.js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Home, ShoppingBag, Download, ArrowLeft } from 'lucide-react';

const PaymentSuccess = () => {
    const t = useTranslations('Checkout');
    const router = useRouter();
    const searchParams = useSearchParams();
    const { emptyCart } = useCart();
    const [orderDetails, setOrderDetails] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    // Use ref to track if we've already processed the order
    const hasProcessedOrder = useRef(false);

    // Get order details from URL parameters
    const orderId = searchParams.get('tx') || searchParams.get('order_id');
    const paymentMethod = searchParams.get('payment_method');

    useEffect(() => {
        // Prevent multiple executions
        if (hasProcessedOrder.current) {
            return;
        }

        const fetchOrder = async () => {
            try {
                if (!orderId) {
                    setError(t('orderNotFound'));
                    setLoading(false);
                    return;
                }

                let actualOrderId = orderId;
                let orderData = null;

                // Always try to get order data from localStorage first
                const storedOrderData = localStorage.getItem('orderData');
                if (storedOrderData) {
                    try {
                        orderData = JSON.parse(storedOrderData);
                        
                        // For Stripe payments, decode base64 order ID
                        if (paymentMethod === 'card') {
                            try {
                                actualOrderId = atob(orderId);
                            } catch (e) {
                                actualOrderId = orderId;
                            }
                        }

                        // Verify the order ID matches (for Stripe payments) or just use the data (for other methods)
                        if (paymentMethod === 'card' && orderData.id !== actualOrderId) {
                            console.warn('Order ID mismatch in localStorage for card payment');
                            orderData = null;
                        }
                    } catch (e) {
                        console.error('Failed to parse order data from localStorage:', e);
                        orderData = null;
                    }
                }

                if (!orderData) {
                    console.error('Order data not found in localStorage for ID:', actualOrderId);
                    setError(t('orderDataNotFound'));
                    setLoading(false);
                    return;
                }

                const orderDetailsData = {
                    orderId: orderData.id || actualOrderId,
                    paymentIntentId: orderData.tx,
                    paymentMethod: paymentMethod || orderData.paymentMethod || orderData.method,
                    email: orderData.customer?.email || orderData.cst_email,
                    customerName: orderData.customer?.firstName ? 
                        `${orderData.customer.firstName} ${orderData.customer.lastName}` : 
                        orderData.cst_name,
                    items: typeof orderData.items === 'string' ? JSON.parse(orderData.items) : orderData.items,
                    total: orderData.total || orderData.amount,
                    subtotal: orderData.subtotal,
                    shipping: orderData.shippingCost || orderData.shipping,
                    totalItems: orderData.totalItems,
                    shippingAddress: orderData.customer?.streetAddress ? {
                        streetAddress: orderData.customer.streetAddress,
                        apartmentUnit: orderData.customer.apartmentUnit,
                        city: orderData.customer.city,
                        state: orderData.customer.state,
                        zipCode: orderData.customer.zipCode,
                        country: orderData.customer.country,
                        countryIso: orderData.customer.countryIso
                    } : (typeof orderData.shipping_address === 'string'
                        ? JSON.parse(orderData.shipping_address)
                        : orderData.shipping_address),
                    orderDate: orderData.createdAt ? 
                        new Date(orderData.createdAt).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }) :
                        new Date().toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })
                };

                // Mark as processed BEFORE setting state to prevent race conditions
                hasProcessedOrder.current = true;

                setOrderDetails(orderDetailsData);

                // Clear cart and stored order data AFTER everything is processed
                emptyCart();
                localStorage.removeItem('orderData');
            } catch (e) {
                console.error('Error fetching order:', e);
                setError(t('orderRetrievalError'));
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId, emptyCart]); // Keep dependencies but use ref to prevent re-execution

    const handleContinue = () => {
        router.push('/');
    };

    const handleViewOrders = () => {
        router.push('/account/orders'); // Adjust path as needed
    };

    const downloadReceipt = () => {
        if (!orderDetails) return;

        // Create order object compatible with generatePDF function
        const orderForPDF = {
            uid: orderDetails.orderId,
            created_at: orderDetails.orderDate,
            cst_name: orderDetails.customerName,
            cst_email: orderDetails.email,
            shipping_address: JSON.stringify(orderDetails.shippingAddress),
            items: JSON.stringify(orderDetails.items),
            amount: parseFloat(orderDetails.total).toFixed(2),
            currency: 'eur',
            method: 'Carte bancaire',
            status: 'Confirmé'
        };

        generatePDF(orderForPDF);
    };


    if (loading) {
        return (
            <div className="w-full max-w-3xl mx-auto mt-36 p-8 flex justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-4xl mx-auto"
            >
                {/* Success Icon */}
                <div className="text-center mb-8">
                    {error ? (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            className="mx-auto w-20 h-20 rounded-full bg-red-500 flex items-center justify-center text-white mb-6"
                        >
                            <XCircle className="w-10 h-10" />
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="mx-auto w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-white mb-6"
                        >
                            <CheckCircle className="w-10 h-10" />
                        </motion.div>
                    )}
                    
                    <h1 className="text-4xl font-bold mb-4">
                        {error ? (
                            <span>{error}</span>
                        ) : (
                            <span>{t('paymentSuccessTitle')}</span>
                        )}
                    </h1>
                    
                    {!error && (
                        <>
                            <p className="text-xl text-muted-foreground mb-4">
                                {t('paymentSuccessMessage')}
                            </p>
                            {paymentMethod === 'bank_transfer' && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                    <p className="text-blue-800 text-sm">
                                        <strong>{t('bankTransfer')}:</strong> {t('bankTransferPayment')}
                                    </p>
                                </div>
                            )}
                            {paymentMethod === 'pay_on_delivery' && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                    <p className="text-green-800 text-sm">
                                        <strong>{t('payOnDelivery')}:</strong> {t('payOnDeliveryPayment')}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>



                {error ? (
                    <Card className="border-destructive/50 bg-destructive/10">
                        <CardContent className="pt-6 text-center">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-4"
                            >
                                <Button onClick={handleContinue} size="lg">
                                    <Home className="mr-2 h-5 w-5" />
                                    {t('backToHome')}
                                </Button>
                            </motion.div>
                        </CardContent>
                    </Card>
                ) : orderDetails && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card/95 backdrop-blur-sm rounded-lg shadow-sm border border-border p-8 text-left mb-8"
                    >
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-semibold mb-2">{t('orderDetailsTitle')}</h2>
                            <p className="text-gray-600">
                                {t('orderNumber')}: <span className="font-mono font-medium">{orderDetails.orderId}</span>
                            </p>
                            <p className="text-gray-600">
                                {t('orderDate')}: {orderDetails.orderDate}
                            </p>
                        </div>

                        {/* Customer Information */}
                        <div className="mb-8 p-4 bg-muted/50 rounded-lg">
                            <h3 className="font-semibold mb-3">{t('customerInformation')}</h3>
                            <p><strong>{t('name')}:</strong> {orderDetails.customerName}</p>
                            <p><strong>{t('email')}:</strong> {orderDetails.email}</p>
                            {orderDetails.paymentMethod && (
                                <p><strong>{t('paymentMethod')}:</strong> {
                                    orderDetails.paymentMethod === 'card' ? `💳 ${t('cardPayment')}` :
                                    orderDetails.paymentMethod === 'bank_transfer' ? `🏦 ${t('bankTransfer')}` :
                                    orderDetails.paymentMethod === 'pay_on_delivery' ? `📦 ${t('payOnDelivery')}` :
                                    orderDetails.paymentMethod
                                }</p>
                            )}
                        </div>

                        {/* Order Items */}
                        <div className="mb-8">
                            <h3 className="font-semibold mb-4">{t('orderedItems')}</h3>
                            <div className="space-y-4">
                                {orderDetails.items.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                        <div className="flex items-center space-x-4">
                                            {item.image && (
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-12 h-12 object-cover rounded-md"
                                                />
                                            )}
                                            <div>
                                                <p className="font-medium">{item.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {t('quantity')}: {item.quantity}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="font-semibold">€{(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="border-t border-border pt-6">
                            <div className="space-y-3">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>{t('subtotal')}</span>
                                    <span>€{orderDetails.subtotal}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>{t('shipping')}</span>
                                    <span>€{orderDetails.shipping}</span>
                                </div>
                                <div className="flex justify-between text-xl font-bold border-t border-border pt-3">
                                    <span>{t('total')}</span>
                                    <span>€{parseFloat(orderDetails.total).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Action Buttons */}
                {!error && orderDetails && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                    >
                        <Button variant="outline" size="lg" onClick={handleContinue}>
                            <ShoppingBag className="mr-2 h-5 w-5" />
                            {t('continueShopping')}
                        </Button>
                        <Button size="lg" onClick={downloadReceipt}>
                            <Download className="mr-2 h-5 w-5" />
                            {t('downloadReceipt')}
                        </Button>
                    </motion.div>
                )}

                {/* Resend Email Button */}
                {!error && orderDetails && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-6 text-center"
                    >
                    </motion.div>
                )}

                {/* Back to Shop Link */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-8 text-center"
                >
                    <Button variant="ghost" asChild>
                        <Link href="/shop">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            {t('backToShop')}
                        </Link>
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default PaymentSuccess;
