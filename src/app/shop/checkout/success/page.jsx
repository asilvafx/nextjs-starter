// @/app/shop/checkout/success/page.jsx

'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Download, Home, ShoppingBag, XCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { useCart } from 'react-use-cart';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { generatePDF } from '@/utils/generatePDF.js';
import { getOrderById } from '@/lib/server/admin.js';

const PaymentSuccess = () => {
    const t = useTranslations('Checkout');
    const router = useRouter();
    const searchParams = useSearchParams();
    const { emptyCart } = useCart();
    const [orderDetails, setOrderDetails] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [paymentExpired, setPaymentExpired] = useState(false);
    const [paymentVerified, setPaymentVerified] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const [orderCancelled, setOrderCancelled] = useState(false);
    const pollingIntervalRef = useRef(null);

    // Use ref to track if we've already processed the order
    const hasProcessedOrder = useRef(false);

    // Get order details from URL parameters
    const orderId = searchParams.get('tx') || searchParams.get('order_id');
    const paymentMethod = searchParams.get('payment_method');
    
    // EuPago specific parameters
    const eupagoMethod = searchParams.get('eupago_method'); // 'mb' or 'mbway'
    const eupagoReference = searchParams.get('reference');
    const eupagoEntity = searchParams.get('entity');
    const eupagoAmount = searchParams.get('amount');

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

                // For Stripe payments, decode base64 order ID
                // For EuPago and other methods, use orderId as-is
                if (paymentMethod === 'card') {
                    try {
                        actualOrderId = atob(orderId);
                    } catch (_e) {
                        actualOrderId = orderId;
                    }
                } else if (paymentMethod === 'eupago') {
                    // EuPago passes the order ID in base64, decode it
                    try {
                        actualOrderId = atob(orderId);
                    } catch (_e) {
                        actualOrderId = orderId;
                    }
                } 

                // Fetch order directly from database using admin.js
                const orderResult = await getOrderById(actualOrderId);
                
                if (!orderResult.success || !orderResult.data) {
                    console.error('Order not found in database:', actualOrderId);
                    setError(t('orderDataNotFound'));
                    setLoading(false);
                    return;
                }

                const orderData = orderResult.data; 

                // Parse items and customer data if they are stored as strings
                const rawItems = typeof orderData.items === 'string' ? JSON.parse(orderData.items) : orderData.items || [];
                const customerData = typeof orderData.customer === 'string' ? JSON.parse(orderData.customer) : orderData.customer || {};
                const shippingAddress = typeof orderData.shippingAddress === 'string' ? JSON.parse(orderData.shippingAddress) : orderData.shippingAddress || {};

                // Normalize items for display
                const items = rawItems.map((item) => {
                    const appointmentFromFields = item.appointment ||
                        (item.appointmentDate || item.appointmentTime ? {
                            date: item.appointmentDate || item.appointment?.date || item.startDate || '',
                            time: item.appointmentTime || item.appointment?.time || item.startTime || ''
                        } : null);

                    const deliveryMethod = item.deliveryMethod || orderData.deliveryMethod || item.shippingMethod || item.method || null;

                    return {
                        ...item,
                        appointment: appointmentFromFields,
                        deliveryMethod
                    };
                });

                // Use actual order data values from database (no recalculation)
                const orderDetailsData = {
                    orderId: orderData.id || actualOrderId,
                    paymentIntentId: orderData.paymentIntentId || orderData.tx,
                    paymentMethod: orderData.paymentMethod || paymentMethod,
                    email: customerData.email || orderData.cst_email,
                    customerName: customerData.firstName 
                        ? `${customerData.firstName} ${customerData.lastName}`
                        : orderData.cst_name,
                    items,
                    // Use exact values from database order record
                    total: parseFloat(orderData.total || 0),
                    subtotal: parseFloat(orderData.subtotal || 0),
                    shipping: parseFloat(orderData.shippingCost || orderData.shipping || 0),
                    vatAmount: parseFloat(orderData.vatAmount || 0),
                    vatPercentage: orderData.vatPercentage || 0,
                    vatIncluded: orderData.vatIncluded || false,
                    vatEnabled: orderData.vatEnabled || false,
                    discountAmount: parseFloat(orderData.discountAmount || 0),
                    totalItems: orderData.totalItems,
                    currency: orderData.currency || 'EUR',
                    shippingAddress: shippingAddress,
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

                // For MB WAY payments, initialize countdown timer
                if (paymentMethod === 'eupago' && eupagoMethod === 'mbway' && orderData.mbwayExpiryTime) {
                    const expiryTime = new Date(orderData.mbwayExpiryTime).getTime();
                    const now = Date.now();
                    const remaining = Math.max(0, expiryTime - now);
                    
                    if (remaining > 0) {
                        setTimeRemaining(Math.floor(remaining / 1000));
                    } else {
                        setPaymentExpired(true);
                    }
                }

                // Clear cart and any stored order data
                emptyCart();
                localStorage.removeItem('orderData');
            } catch (e) {
                console.error('Error fetching order from database:', e);
                setError(t('orderRetrievalError'));
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId, emptyCart]); // Keep dependencies but use ref to prevent re-execution

    // Countdown timer for MB WAY payments
    useEffect(() => {
        if (timeRemaining === null || timeRemaining <= 0) return;

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    setPaymentExpired(true);
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining]);

    // Poll order status for MB WAY payments
    useEffect(() => {
        // Only poll for eupago_mbway payments that haven't been verified or expired
        if (paymentMethod !== 'eupago' || eupagoMethod !== 'mbway') return;
        if (paymentVerified || paymentExpired || orderCancelled || !orderDetails) return;
        if (isPolling) return;

        setIsPolling(true);

        // Poll every 5 seconds
        const pollOrderStatus = async () => {
            try {
                let actualOrderId = orderId;
                try {
                    actualOrderId = atob(orderId);
                } catch (_e) {
                    actualOrderId = orderId;
                }

                const orderResult = await getOrderById(actualOrderId);
                
                if (orderResult.success && orderResult.data) {
                    const order = orderResult.data;
                    
                    // Check if payment has been confirmed
                    if (order.status === 'paid' || order.status === 'confirmed' || order.paymentStatus === 'paid') {
                        setPaymentVerified(true);
                        if (pollingIntervalRef.current) {
                            clearInterval(pollingIntervalRef.current);
                            pollingIntervalRef.current = null;
                        }
                        return;
                    }
                }
            } catch (e) {
                console.error('Error polling order status:', e);
            }
        };

        // Start polling
        pollingIntervalRef.current = setInterval(pollOrderStatus, 5000);

        // Initial poll
        pollOrderStatus();

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [paymentMethod, eupagoMethod, paymentVerified, paymentExpired, orderCancelled, orderDetails, orderId]);

    // Format countdown time (MM:SS)
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleContinue = () => {
        router.push('/shop');
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

        // Use actual order data from database (no recalculation)
        const orderForPDF = {
            uid: orderDetails.orderId,
            created_at: new Date().toISOString(),
            cst_name: orderDetails.customerName,
            cst_email: orderDetails.email,
            shipping_address: JSON.stringify(orderDetails.shippingAddress || {}),
            items: JSON.stringify(orderDetails.items || []),
            // Use exact values from the database order record
            amount: orderDetails.total.toFixed(2),
            subtotal: orderDetails.subtotal.toFixed(2),
            shipping: orderDetails.shipping.toFixed(2),
            vatAmount: orderDetails.vatAmount.toFixed(2),
            vatPercentage: orderDetails.vatPercentage,
            vatIncluded: orderDetails.vatIncluded,
            discountAmount: orderDetails.discountAmount.toFixed(2),
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
                    {error || orderCancelled ? (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500 text-white">
                            <XCircle className="h-10 w-10" />
                        </motion.div>
                    ) : paymentMethod === 'eupago' && eupagoMethod === 'mbway' && paymentExpired && !paymentVerified ? (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500 text-white">
                            <XCircle className="h-10 w-10" />
                        </motion.div>
                    ) : paymentMethod === 'eupago' && eupagoMethod === 'mbway' && !paymentVerified ? (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-500">
                            <div className="h-10 w-10 animate-spin rounded-full border-white border-b-2"></div>
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
                        {error ? (
                            <span>{error}</span>
                        ) : orderCancelled ? (
                            <span>Order Cancelled</span>
                        ) : paymentMethod === 'eupago' && eupagoMethod === 'mbway' && paymentExpired && !paymentVerified ? (
                            <span>Payment Expired</span>
                        ) : paymentMethod === 'eupago' && eupagoMethod === 'mbway' && !paymentVerified ? (
                            <span>Payment Pending</span>
                        ) : (
                            <span>{t('paymentSuccessTitle')}</span>
                        )}
                    </h1>

                    {!error && !orderCancelled && (
                        <>
                            <p className="mb-4 text-muted-foreground text-xl">
                                {paymentMethod === 'eupago' && eupagoMethod === 'mbway' && paymentExpired && !paymentVerified 
                                    ? 'Your MB WAY payment window has expired. This order will be automatically cancelled by our system.'
                                    : paymentMethod === 'eupago' && eupagoMethod === 'mbway' && !paymentVerified 
                                    ? 'Please confirm your payment in the MB WAY app to complete your order.'
                                    : t('paymentSuccessMessage')
                                }
                            </p>
                            {paymentMethod === 'bank_transfer' && (
                                <div className="mb-4 rounded-lg p-4">
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
                            {paymentMethod === 'eupago' && eupagoMethod === 'mbway' && paymentVerified && (
                                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
                                    <div className="text-green-800">
                                        <h3 className="font-semibold mb-3">✅ Payment Confirmed</h3>
                                        <p className="text-sm">Your MB WAY payment has been successfully confirmed. Thank you for your purchase!</p>
                                    </div>
                                </div>
                            )}
                            {paymentMethod === 'eupago' && eupagoMethod && !paymentVerified && (
                                <div className="mb-4 rounded-lg border p-4">
                                    {eupagoMethod === 'mbway' ? (
                                        <div>
                                            <h3 className="font-semibold mb-3">📱 MB WAY Payment</h3>
                                            
                                            {orderCancelled ? (
                                                <div className="mb-3 p-3 bg-red-100 border border-red-300 rounded text-red-800">
                                                    <p className="font-semibold">❌ Order Cancelled</p>
                                                    <p className="text-sm mt-1">Your order has been automatically cancelled due to payment timeout. The MB WAY payment was not confirmed within the 5-minute window.</p>
                                                    <p className="text-sm mt-2 font-semibold">Please place a new order if you wish to continue with your purchase.</p>
                                                </div>
                                            ) : paymentExpired ? (
                                                <div className="mb-3 p-3 bg-red-100 border border-red-300 rounded text-red-800">
                                                    <p className="font-semibold">⏰ Payment Time Expired</p>
                                                    <p className="text-sm mt-1">Your MB WAY payment window has expired. This order will be automatically cancelled by our system.</p>
                                                </div>
                                            ) : timeRemaining !== null ? (
                                                <div className="mb-3 p-3 border rounded">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold">Time Remaining:</span>
                                                        <span className="text-2xl font-mono font-bold">{formatTime(timeRemaining)}</span>
                                                    </div>
                                                    <p className="text-blue-700 text-xs mt-1">⚠️ Approve the payment in your MB WAY app before time runs out</p>
                                                </div>
                                            ) : null}
                                            
                                            <p className="text-sm mb-3">
                                                A payment request has been sent to your MB WAY app. Please open your MB WAY app and approve the payment.
                                            </p>
                                            <div className="space-y-2 text-sm">
                                                <p><strong>Reference:</strong> <span className="font-mono bg-white text-gray-800 px-2 py-1 rounded">{eupagoReference}</span></p>
                                                <p><strong>Amount:</strong> €{eupagoAmount}</p>
                                            </div>
                                            <div className="mt-3 p-3 rounded text-xs space-y-1">
                                                <p className="font-semibold">How to complete payment:</p>
                                                <p>1. Open your MB WAY app on your phone</p>
                                                <p>2. Check for the payment notification</p>
                                                <p>3. Verify the amount and merchant details</p>
                                                <p>4. Confirm the payment with your PIN</p>
                                            </div>
                                        </div>
                                    ) : eupagoMethod === 'mb' ? (
                                        <div className="text-orange-800">
                                            <h3 className="font-semibold mb-3">🏧 Multibanco Payment Instructions</h3>
                                            <div className="space-y-2 text-sm">
                                                <p><strong>Entity:</strong> <span className="font-mono bg-white px-2 py-1 rounded">{eupagoEntity}</span></p>
                                                <p><strong>Reference:</strong> <span className="font-mono bg-white px-2 py-1 rounded">{eupagoReference}</span></p>
                                                <p><strong>Amount:</strong> €{eupagoAmount}</p>
                                            </div>
                                            <div className="mt-3 text-xs space-y-1">
                                                <p>1. Go to any Multibanco ATM</p>
                                                <p>2. Select "Payments and Other Services"</p>
                                                <p>3. Select "Payment of Services"</p>
                                                <p>4. Enter the Entity and Reference numbers above</p>
                                                <p>5. Confirm the amount and complete the payment</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-orange-800">
                                            <p className="text-sm">
                                                <strong>EuPago Payment:</strong> Please complete your payment using the provided instructions.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {error || orderCancelled ? (
                    <Card className="border-destructive/50 bg-destructive/10">
                        <CardContent className="pt-6 text-center">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                <Button onClick={handleContinue} size="lg">
                                    <Home className="mr-2 h-5 w-5" />
                                    {orderCancelled ? 'Return to Shop' : t('backToHome')}
                                </Button>
                            </motion.div>
                        </CardContent>
                    </Card>
                ) : (
                    orderDetails && (paymentMethod !== 'eupago' || eupagoMethod !== 'mbway' || paymentVerified) && (
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
                                                : orderDetails.paymentMethod === 'eupago'
                                                  ? `🏧 ${eupagoMethod === 'mbway' ? 'MB WAY' : 'Multibanco'} (EuPago)`
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
                                                    <Image
                                                        src={item.image}
                                                        alt={item.name}
                                                        width={48}
                                                        height={48}
                                                        unoptimized={true}
                                                        className="h-12 w-12 rounded-md object-cover"
                                                    />
                                                )}
                                                <div>
                                                    <p className="font-medium">{item.name}</p>
                                                    <p className="text-gray-500 text-sm">
                                                        {t('quantity')}: {item.quantity}
                                                    </p>
                                                    {/* Service-specific details */}
                                                    {item.type === 'service' && item.appointment && (
                                                        <div className="text-sm text-muted-foreground mt-1">
                                                            <div>
                                                                <strong>Appointment:</strong>{' '}
                                                                {item.appointment.date || item.appointment.startDate || ''}{' '}
                                                                {item.appointment.time || item.appointment.startTime || ''}
                                                            </div>
                                                            {item.deliveryMethod && (
                                                                <div>
                                                                    <strong>Delivery:</strong> {item.deliveryMethod}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
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
                                    {orderDetails.discountAmount && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Discount</span>
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
                {!error && !orderCancelled && orderDetails && (paymentMethod !== 'eupago' || eupagoMethod !== 'mbway' || paymentVerified) && (
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

                {/* Payment Verification Message */}
                {!error && !orderCancelled && orderDetails && paymentMethod === 'eupago' && eupagoMethod === 'mbway' && !paymentVerified && !paymentExpired && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mt-8 text-center">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex flex-col items-center space-y-3">
                                    <p className="font-semibold">Waiting for Payment Confirmation...</p>
                                    <p className="text-blue-700 text-sm">Please approve the payment in your MB WAY app. Your order details will appear once payment is confirmed.</p>
                                </div>
                            </CardContent>
                        </Card>
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
