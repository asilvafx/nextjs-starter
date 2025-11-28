// src/app/api/payments/eupago/webhook/route.js
import { NextResponse } from 'next/server';
import { checkEuPagoPaymentStatus } from '@/lib/server/admin.js';
import { withPublicAccess } from '@/lib/server/auth.js';

export const POST = withPublicAccess(async (req) => {
    try {
        const body = await req.json();

        // Validate webhook payload
        const { reference, entity, state } = body;

        if (!reference) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid webhook payload'
                },
                { status: 400 }
            );
        }

        // Check if payment is confirmed
        if (state === 'paga' || state === 'paid') {
            // Find and update the order
            const statusCheck = await checkEuPagoPaymentStatus(reference, entity);

            if (statusCheck.success && statusCheck.paid) {
                // The service will handle updating the order and sending emails
                console.log(`EuPago webhook: Payment confirmed for reference ${reference}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Webhook processed'
        });
    } catch (error) {
        console.error('EuPago webhook error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Webhook processing failed'
            },
            { status: 500 }
        );
    }
});
