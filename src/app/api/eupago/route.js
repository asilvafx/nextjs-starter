// @/app/api/eupago/route.js

import {
    checkEuPagoPaymentStatus,
    checkEuPagoPendingPayments,
    createEuPagoPaymentReference,
    getEuPagoPaymentInstructions,
    isEuPagoEnabled,
    processEuPagoPayment
} from '@/lib/server/admin.js';

export async function OPTIONS() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const action = url.searchParams.get('action');
        const reference = url.searchParams.get('reference');
        const entity = url.searchParams.get('entity');

        switch (action) {
            case 'status': {
                if (!reference) {
                    return new Response(JSON.stringify({ error: 'Reference is required' }), {
                        status: 400,
                        headers: { 'Access-Control-Allow-Origin': '*' }
                    });
                }

                const statusResult = await checkEuPagoPaymentStatus(reference, entity);
                return new Response(JSON.stringify(statusResult), {
                    status: 200,
                    headers: { 'Access-Control-Allow-Origin': '*' }
                });
            }

            case 'check_enabled': {
                const isEnabled = await isEuPagoEnabled();
                return new Response(JSON.stringify({ success: true, enabled: isEnabled }), {
                    status: 200,
                    headers: { 'Access-Control-Allow-Origin': '*' }
                });
            }

            case 'check_pending': {
                const pendingResult = await checkEuPagoPendingPayments();
                return new Response(JSON.stringify(pendingResult), {
                    status: 200,
                    headers: { 'Access-Control-Allow-Origin': '*' }
                });
            }

            default:
                return new Response(JSON.stringify({ error: 'Invalid action' }), {
                    status: 400,
                    headers: { 'Access-Control-Allow-Origin': '*' }
                });
        }
    } catch (error) {
        console.error('EuPago GET Error:', error.message);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            {
                status: error.statusCode || 500,
                headers: { 'Access-Control-Allow-Origin': '*' }
            }
        );
    }
}

export async function POST(req) {
    try {
        const { action, ...data } = await req.json();

        switch (action) {
            case 'create_payment': {
                const { orderId, amount, method = 'mb', mobile = null } = data;

                if (!orderId || !amount || amount <= 0) {
                    return new Response(
                        JSON.stringify({
                            success: false,
                            error: 'Invalid order data: orderId and amount are required'
                        }),
                        {
                            status: 400,
                            headers: { 'Access-Control-Allow-Origin': '*' }
                        }
                    );
                }

                if (method === 'mbway' && !mobile) {
                    return new Response(
                        JSON.stringify({
                            success: false,
                            error: 'Mobile number is required for MB WAY payments'
                        }),
                        {
                            status: 400,
                            headers: { 'Access-Control-Allow-Origin': '*' }
                        }
                    );
                }

                const referenceResult = await createEuPagoPaymentReference({
                    orderId,
                    amount,
                    method,
                    mobile
                });

                return new Response(JSON.stringify(referenceResult), {
                    status: 200,
                    headers: { 'Access-Control-Allow-Origin': '*' }
                });
            }

            case 'process_payment': {
                const { orderData } = data;
                 
                if (!orderData) {
                    return new Response(
                        JSON.stringify({
                            success: false,
                            error: 'Order data is required'
                        }),
                        {
                            status: 400,
                            headers: { 
                                'Access-Control-Allow-Origin': '*',
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                }

                const processResult = await processEuPagoPayment(orderData);
                 
                // Ensure we always return JSON
                if (!processResult) {
                    console.error('EuPago API - processEuPagoPayment returned null/undefined');
                    return new Response(
                        JSON.stringify({
                            success: false,
                            error: 'Payment processing failed'
                        }),
                        {
                            status: 500,
                            headers: { 
                                'Access-Control-Allow-Origin': '*',
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                }
                
                return new Response(JSON.stringify(processResult), {
                    status: processResult.success ? 200 : 400,
                    headers: { 
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    }
                });
            }

            case 'check_status': {
                const { reference, entity } = data;

                if (!reference) {
                    return new Response(
                        JSON.stringify({
                            success: false,
                            error: 'Reference is required'
                        }),
                        {
                            status: 400,
                            headers: { 'Access-Control-Allow-Origin': '*' }
                        }
                    );
                }

                const statusCheck = await checkEuPagoPaymentStatus(reference, entity);
                return new Response(JSON.stringify(statusCheck), {
                    status: 200,
                    headers: { 'Access-Control-Allow-Origin': '*' }
                });
            }

            case 'check_pending': {
                const pendingCheck = await checkEuPagoPendingPayments();
                return new Response(JSON.stringify(pendingCheck), {
                    status: 200,
                    headers: { 'Access-Control-Allow-Origin': '*' }
                });
            }

            case 'get_instructions': {
                const { paymentData } = data;

                if (!paymentData) {
                    return new Response(
                        JSON.stringify({
                            success: false,
                            error: 'Payment data is required'
                        }),
                        {
                            status: 400,
                            headers: { 'Access-Control-Allow-Origin': '*' }
                        }
                    );
                }

                const instructions = await getEuPagoPaymentInstructions(paymentData);
                return new Response(
                    JSON.stringify({
                        success: true,
                        instructions
                    }),
                    {
                        status: 200,
                        headers: { 'Access-Control-Allow-Origin': '*' }
                    }
                );
            }

            default:
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: 'Invalid action'
                    }),
                    {
                        status: 400,
                        headers: { 'Access-Control-Allow-Origin': '*' }
                    }
                );
        }
    } catch (error) {
        console.error('EuPago POST Error:', error.message);
        console.error('EuPago POST Error Stack:', error.stack);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Internal server error'
            }),
            {
                status: error.statusCode || 500,
                headers: { 
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                }
            }
        );
    }
}
