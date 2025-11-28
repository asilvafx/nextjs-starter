// src/app/api/payments/eupago/status/route.js
import { NextResponse } from 'next/server';
import { checkEuPagoPaymentStatus } from '@/lib/server/admin.js';
import { withPublicAccess } from '@/lib/server/auth.js';

export const GET = withPublicAccess(async (req) => {
    try {
        const { searchParams } = new URL(req.url);
        const reference = searchParams.get('reference');
        const entity = searchParams.get('entity');

        if (!reference) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Payment reference required'
                },
                { status: 400 }
            );
        }

        const result = await checkEuPagoPaymentStatus(reference, entity);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error checking EuPago payment status:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to check payment status'
            },
            { status: 500 }
        );
    }
});

export const POST = withPublicAccess(async (req) => {
    try {
        const body = await req.json();
        const { reference, entity } = body;

        if (!reference) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Payment reference required'
                },
                { status: 400 }
            );
        }

        const result = await checkEuPagoPaymentStatus(reference, entity);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error checking EuPago payment status:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to check payment status'
            },
            { status: 500 }
        );
    }
});
