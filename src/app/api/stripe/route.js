// @/app/api/stripe/route.js

import Stripe from 'stripe';
import DBService from '@/data/rest.db.js';

// Function to get Stripe instance with settings-based key
async function getStripeInstance() {
    try {
        const storeSettingsResponse = await DBService.readAll('store_settings');
        const storeSettings = storeSettingsResponse?.[0];

        if (!storeSettings?.paymentMethods?.stripeSecretKey) {
            throw new Error('Stripe secret key not configured in store settings');
        }

        return new Stripe(storeSettings.paymentMethods.stripeSecretKey);
    } catch (error) {
        console.error('Failed to initialize Stripe:', error);
        throw error;
    }
}

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
        const { amount, currency = 'eur', email = '', automatic_payment_methods, metadata = {} } = await req.json();

        if (!amount || amount <= 0) {
            return new Response(JSON.stringify({ error: 'Invalid amount' }), {
                status: 400,
                headers: { 'Access-Control-Allow-Origin': '*' }
            });
        }

        if (!email) {
            return new Response(JSON.stringify({ error: 'Email is required' }), {
                status: 400,
                headers: { 'Access-Control-Allow-Origin': '*' }
            });
        }

        // Get Stripe instance with store settings
        const stripe = await getStripeInstance();

        const customer = await stripe.customers.create({
            email,
            description: `Customer for ${email}`
        });

        const paymentIntentParams = {
            amount: parseInt(amount, 10),
            currency,
            customer: customer.id,
            // merge client-provided metadata (order_id, service_id, etc.) with a customer_email fallback
            metadata: Object.assign({ customer_email: email }, metadata)
        };

        if (automatic_payment_methods) {
            paymentIntentParams.automatic_payment_methods = { enabled: true };
        } else {
            paymentIntentParams.payment_method_types = ['card'];
        }

        const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

        return new Response(
            JSON.stringify({
                client_secret: paymentIntent.client_secret,
                customer_id: customer.id,
                payment_intent_id: paymentIntent.id
            }),
            {
                status: 200,
                headers: { 'Access-Control-Allow-Origin': '*' }
            }
        );
    } catch (err) {
        console.error('Stripe Error:', err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: err.statusCode || 500,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    }
}
