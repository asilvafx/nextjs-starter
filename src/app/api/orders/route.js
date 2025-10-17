// @/app/api/orders/route.js

import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';
import EmailService from '@/lib/server/email';

export async function GET(request) {
    try {
        // Get order ID from URL path - this will be handled by [id]/route.js
        // This endpoint can be used to get all orders if needed
        const orders = await DBService.readAll('orders');
        
        return NextResponse.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Failed to fetch orders:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch orders'
            },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const orderData = await request.json();

        // Validate required fields
        if (!orderData.customer || !orderData.items || !orderData.total) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required order data'
                },
                { status: 400 }
            );
        }

        // Generate unique order ID if not provided
        if (!orderData.id) {
            orderData.id = `ORD-${Date.now()}`;
        }

        // Add database-specific fields
        const finalOrderData = {
            ...orderData,
            uid: orderData.id,
            cst_email: orderData.customer.email,
            cst_name: `${orderData.customer.firstName} ${orderData.customer.lastName}`,
            amount: orderData.total,
            subtotal: orderData.subtotal,
            shipping_address: {
                streetAddress: orderData.customer.streetAddress,
                apartmentUnit: orderData.customer.apartmentUnit || '',
                city: orderData.customer.city,
                state: orderData.customer.state,
                zipCode: orderData.customer.zipCode,
                country: orderData.customer.country,
                countryIso: orderData.customer.countryIso
            },
            phone: orderData.customer.phone,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Save order to database
        await DBService.create(finalOrderData, "orders");

        // Check if customer exists, create if not
        try {
            const existingCustomer = await DBService.getItemByKey('email', orderData.customer.email, 'customers');
            if (!existingCustomer) {
                await DBService.create({
                    name: `${orderData.customer.firstName} ${orderData.customer.lastName}`,
                    email: orderData.customer.email,
                    phone: orderData.customer.phone,
                    address: finalOrderData.shipping_address,
                    createdAt: new Date().toISOString()
                }, 'customers');
            }
        } catch (customerError) {
            console.warn('Failed to create customer record:', customerError);
            // Continue with order processing even if customer creation fails
        }

        // Send order confirmation email if enabled
        if (orderData.sendEmail !== false) {
            try {
                // Fetch store settings for email formatting
                let storeSettings = null;
                try {
                    const settingsData = await DBService.readAll('store_settings');
                    storeSettings = settingsData?.[0];
                } catch (error) {
                    console.warn('Failed to fetch store settings for email:', error);
                }

                // Use VAT data from order (already calculated correctly in PaymentForm)
                const vatAmount = orderData.vatAmount || 0;
                const vatPercentage = orderData.vatPercentage || storeSettings?.vatPercentage || 20;
                const finalTotal = orderData.total;

                const emailPayload = {
                    customerName: `${orderData.customer.firstName} ${orderData.customer.lastName}`,
                    orderId: orderData.id,
                    orderDate: new Date().toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    items: orderData.items,
                    subtotal: (orderData.vatIncludedInPrice ? orderData.subtotal : orderData.subtotalInclVat || orderData.subtotal)?.toFixed(2) || '0.00',
                    shippingCost: orderData.shippingCost?.toFixed(2) || '0.00',
                    total: finalTotal.toFixed(2),
                    vatEnabled: orderData.vatEnabled || false,
                    vatAmount: vatAmount.toFixed(2),
                    vatPercentage: vatPercentage,
                    vatIncluded: orderData.vatIncludedInPrice || false,
                    currency: storeSettings?.currency || 'EUR',
                    shippingAddress: finalOrderData.shipping_address,
                    paymentMethod: orderData.paymentMethod,
                    bankTransferDetails: orderData.paymentMethod === 'bank_transfer' && storeSettings?.paymentMethods?.bankTransferDetails 
                        ? storeSettings.paymentMethods.bankTransferDetails 
                        : null,
                };

                await EmailService.sendOrderConfirmationEmail(
                    orderData.customer.email,
                    emailPayload
                );

                console.log('Order confirmation email sent to:', orderData.customer.email);
            } catch (emailError) {
                console.error('Failed to send order confirmation email:', emailError);
                // Don't fail the order creation if email fails
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Order created successfully',
            orderId: orderData.id,
            data: finalOrderData
        });

    } catch (error) {
        console.error('Failed to create order:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to create order',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}