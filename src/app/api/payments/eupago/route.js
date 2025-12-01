// src/app/api/payments/eupago/route.js
// This route is deprecated - use /api/eupago directly
// Keeping for backward compatibility only
import { NextResponse } from 'next/server';
import {
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

export async function POST(req) {
    try {
        const { action, orderData } = await req.json();

        if (action === 'process_payment') {
            if (!orderData) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Order data is required'
                    },
                    { 
                        status: 400,
                        headers: { 'Access-Control-Allow-Origin': '*' }
                    }
                );
            }

            const processResult = await processEuPagoPayment(orderData);
            return NextResponse.json(processResult, {
                headers: { 'Access-Control-Allow-Origin': '*' }
            });
        }

        return NextResponse.json(
            {
                success: false,
                error: 'Invalid action'
            },
            { 
                status: 400,
                headers: { 'Access-Control-Allow-Origin': '*' }
            }
        );
    } catch (error) {
        console.error('EuPago payment error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Payment processing failed'
            },
            {
                status: 500,
                headers: { 'Access-Control-Allow-Origin': '*' }
            }
        );
    }
}
