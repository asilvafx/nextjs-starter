// @/app/shop/checkout/success/page.jsx

'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Download, Home, ShoppingBag, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { useCart } from 'react-use-cart';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { generatePDF } from '@/utils/generatePDF.js';

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
                            } catch (_e) {
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
                    customerName: orderData.customer?.firstName
                        ? `${orderData.customer.firstName} ${orderData.customer.lastName}`
                        : orderData.cst_name,
                    items: typeof orderData.items === 'string' ? JSON.parse(orderData.items) : orderData.items,
                    // Fix totals calculation - use actual order totals, not recalculated ones
                    total: orderData.total || orderData.amount,
                    subtotal: orderData.subtotal || orderData.cartTotal,
                    shipping: orderData.shippingCost || orderData.shipping || 0,
                    vatAmount: orderData.vatAmount || 0,
                    vatPercentage: orderData.vatPercentage || 0,
                    vatIncluded: orderData.vatIncluded || false,
                    vatEnabled: orderData.vatEnabled || false,
                    discountAmount: orderData.discountAmount || 0,
                    totalItems: orderData.totalItems,
                    currency: orderData.currency || 'EUR',
                    shippingAddress: orderData.customer?.streetAddress
                        ? {
                              streetAddress: orderData.customer.streetAddress,
                              apartmentUnit: orderData.customer.apartmentUnit,
                              city: orderData.customer.city,
                              state: orderData.customer.state,
                              zipCode: orderData.customer.zipCode,
                              country: orderData.customer.country,
                              countryIso: orderData.customer.countryIso
                          }
                        : typeof orderData.shipping_address === 'string'
                          ? JSON.parse(orderData.shipping_address)
                          : orderData.shipping_address,
                    orderDate: orderData.createdAt
                        ? new Date(orderData.createdAt).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                          })
                        : new Date().toLocaleDateString('fr-FR', {
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

    const _handleViewOrders = () => {
        router.push('/account/orders'); // Adjust path as needed
    };

    const downloadReceipt = () => {
        if (!orderDetails) return;

        // Format payment method correctly
        const formatPaymentMethod = (method) => {
            switch (method) {
                case 'card':
                    return 'Carte bancaire';
                case 'bank_transfer':
                    return 'Virement bancaire';
                case 'pay_on_delivery':
                    return 'Paiement à la livraison';
                default:
                    return 'Carte bancaire';
            }
        };

        // Create order object compatible with generatePDF function
        const orderForPDF = {
            uid: orderDetails.orderId,
            created_at: new Date().toISOString(),
            cst_name: orderDetails.customerName,
            cst_email: orderDetails.email,
            shipping_address: JSON.stringify(orderDetails.shippingAddress || {}),
            items: JSON.stringify(orderDetails.items || []),
            amount: parseFloat(orderDetails.total || 0).toFixed(2),
            subtotal: parseFloat(orderDetails.subtotal || 0).toFixed(2),
            shipping: parseFloat(orderDetails.shipping || 0).toFixed(2),
            vatAmount: parseFloat(orderDetails.vatAmount || 0).toFixed(2),
            vatPercentage: orderDetails.vatPercentage || 0,
            vatIncluded: orderDetails.vatIncluded || false,
            discountAmount: parseFloat(orderDetails.discountAmount || 0).toFixed(2),
            currency: orderDetails.currency?.toLowerCase() || 'eur',
            method: formatPaymentMethod(orderDetails.paymentMethod),
            status: 'Confirmé'
        };

        generatePDF(orderForPDF);
    };

    if (loading) {
        return (
            <div className="mx-auto mt-36 flex w-full max-w-3xl justify-center p-8">
                <div className="h-32 w-32 animate-spin rounded-full border-primary border-b-2"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mx-auto max-w-4xl">
                {/* Success Icon */}
                <div className="mb-8 text-center">
                    {error ? (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500 text-white">
                            <XCircle className="h-10 w-10" />
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500 text-white">
                            <CheckCircle className="h-10 w-10" />
                        </motion.div>
                    )}

                    <h1 className="mb-4 font-bold text-4xl">
                        {error ? <span>{error}</span> : <span>{t('paymentSuccessTitle')}</span>}
                    </h1>

                    {!error && (
                        <>
                            <p className="mb-4 text-muted-foreground text-xl">{t('paymentSuccessMessage')}</p>
                            {paymentMethod === 'bank_transfer' && (
                                <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                                    <p className="text-blue-800 text-sm">
                                        <strong>{t('bankTransfer')}:</strong> {t('bankTransferPayment')}
                                    </p>
                                </div>
                            )}
                            {paymentMethod === 'pay_on_delivery' && (
                                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
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
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                <Button onClick={handleContinue} size="lg">
                                    <Home className="mr-2 h-5 w-5" />
                                    {t('backToHome')}
                                </Button>
                            </motion.div>
                        </CardContent>
                    </Card>
                ) : (
                    orderDetails && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="mb-8 rounded-lg border border-border bg-card/95 p-8 text-left shadow-sm backdrop-blur-sm">
                            <div className="mb-8 text-center">
                                <h2 className="mb-2 font-semibold text-2xl">{t('orderDetailsTitle')}</h2>
                                <p className="text-gray-600">
                                    {t('orderNumber')}:{' '}
                                    <span className="font-medium font-mono">{orderDetails.orderId}</span>
                                </p>
                                <p className="text-gray-600">
                                    {t('orderDate')}: {orderDetails.orderDate}
                                </p>
                            </div>

                            {/* Customer Information */}
                            <div className="mb-8 rounded-lg bg-muted/50 p-4">
                                <h3 className="mb-3 font-semibold">{t('customerInformation')}</h3>
                                <p>
                                    <strong>{t('name')}:</strong> {orderDetails.customerName}
                                </p>
                                <p>
                                    <strong>{t('email')}:</strong> {orderDetails.email}
                                </p>
                                {orderDetails.paymentMethod && (
                                    <p>
                                        <strong>{t('paymentMethod')}:</strong>{' '}
                                        {orderDetails.paymentMethod === 'card'
                                            ? `💳 ${t('cardPayment')}`
                                            : orderDetails.paymentMethod === 'bank_transfer'
                                              ? `🏦 ${t('bankTransfer')}`
                                              : orderDetails.paymentMethod === 'pay_on_delivery'
                                                ? `📦 ${t('payOnDelivery')}`
                                                : orderDetails.paymentMethod}
                                    </p>
                                )}
                            </div>

                            {/* Order Items */}
                            <div className="mb-8">
                                <h3 className="mb-4 font-semibold">{t('orderedItems')}</h3>
                                <div className="space-y-4">
                                    {orderDetails.items.map((item, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                                            <div className="flex items-center space-x-4">
                                                {item.image && (
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="h-12 w-12 rounded-md object-cover"
                                                    />
                                                )}
                                                <div>
                                                    <p className="font-medium">{item.name}</p>
                                                    <p className="text-gray-500 text-sm">
                                                        {t('quantity')}: {item.quantity}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="font-semibold">
                                                {orderDetails.currency === 'USD' ? '$' : '€'}
                                                {(item.price * item.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="border-border border-t pt-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>{t('subtotal')}</span>
                                        <span>
                                            {orderDetails.currency === 'USD' ? '$' : '€'}
                                            {parseFloat(orderDetails.subtotal || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>{t('shipping')}</span>
                                        <span>
                                            {parseFloat(orderDetails.shipping || 0) === 0 ? (
                                                <span className="font-semibold text-green-600">Gratuit</span>
                                            ) : (
                                                <span>
                                                    {orderDetails.currency === 'USD' ? '$' : '€'}
                                                    {parseFloat(orderDetails.shipping || 0).toFixed(2)}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    {orderDetails.discountAmount && parseFloat(orderDetails.discountAmount) > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Réduction</span>
                                            <span>
                                                -{orderDetails.currency === 'USD' ? '$' : '€'}
                                                {parseFloat(orderDetails.discountAmount).toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                    {orderDetails.vatEnabled && (
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>TVA ({orderDetails.vatPercentage || 20}%)</span>
                                            <span>
                                                {orderDetails.vatIncluded ? (
                                                    <span className="font-semibold text-green-600">Inclus</span>
                                                ) : (
                                                    <span>
                                                        {orderDetails.currency === 'USD' ? '$' : '€'}
                                                        {parseFloat(orderDetails.vatAmount || 0).toFixed(2)}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between border-border border-t pt-3 font-bold text-xl">
                                        <span>{t('total')}</span>
                                        <span>
                                            {orderDetails.currency === 'USD' ? '$' : '€'}
                                            {parseFloat(orderDetails.total || 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )
                )}

                {/* Action Buttons */}
                {!error && orderDetails && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col items-center justify-center gap-4 sm:flex-row">
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
                        className="mt-6 text-center"></motion.div>
                )}

                {/* Back to Shop Link */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-8 text-center">
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
