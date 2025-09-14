import { NextResponse } from 'next/server';
import EmailService from '@/lib/email';
import DBService from '@/data/rest.db.js';

export async function POST(request) {

    try {
        const body = await request.json();

        // Extract orderData and emailPayload from the request body
        const { orderData, emailPayload } = body;

        if (!orderData || !emailPayload) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Both orderData and emailPayload are required'
                },
                { status: 400 }
            );
        }

        // 1. First, save the complete orderData to the database
        try {
            await DBService.create(orderData, "orders");
        } catch (dbError) {
            console.error('Failed to save order to database:', dbError);
            // Continue with email sending even if DB save fails
            // You might want to handle this differently based on your requirements
        }

        // 2. Validate required fields for email sending
        const requiredEmailFields = ['email', 'customerName', 'orderId', 'items', 'total'];
        const missingEmailFields = requiredEmailFields.filter(field => !emailPayload[field]);

        if (missingEmailFields.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Missing required email fields: ${missingEmailFields.join(', ')}`
                },
                { status: 400 }
            );
        }

        const {
            email,
            customerName,
            orderId,
            orderDate,
            items,
            subtotal,
            shippingCost,
            total,
            shippingAddress,
        } = emailPayload;

        // Validate items array
        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Items must be a non-empty array'
                },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid email format'
                },
                { status: 400 }
            );
        }

        // Format order date if not provided
        const formattedOrderDate = orderDate || new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Parse shipping address if it's a string
        let parsedShippingAddress = shippingAddress;
        if (typeof shippingAddress === 'string') {
            try {
                parsedShippingAddress = JSON.parse(shippingAddress);
            } catch (e) {
                console.warn('Failed to parse shipping address:', e);
                parsedShippingAddress = {};
            }
        }

        // Parse items if it's a string
        let parsedItems = items;
        if (typeof items === 'string') {
            try {
                parsedItems = JSON.parse(items);
            } catch (e) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Invalid items format'
                    },
                    { status: 400 }
                );
            }
        }

        // Validate parsed items
        if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid items data after parsing'
                },
                { status: 400 }
            );
        }

        // Ensure each item has required fields
        const itemValidation = parsedItems.every(item =>
            item.name &&
            typeof item.price === 'number' &&
            typeof item.quantity === 'number'
        );

        if (!itemValidation) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Each item must have name, price, and quantity'
                },
                { status: 400 }
            );
        }

        console.log('Sending order confirmation email to:', email, 'for order:', orderId);

        const emailResponse = await EmailService.sendOrderConfirmationEmail(
            email,
            {
                customerName,
                orderId,
                orderDate: formattedOrderDate,
                items: parsedItems,
                subtotal: subtotal || '0.00',
                shippingCost: shippingCost || '0.00',
                total: parseFloat(total).toFixed(2),
                shippingAddress: parsedShippingAddress || {}, 
            }
        );

        console.log('Order confirmation email sent successfully:', emailResponse);

        return NextResponse.json({
            success: true,
            message: 'Order saved to database and confirmation email sent successfully',
            emailId: emailResponse?.id || emailResponse?.messageId,
            orderId: orderData.uid || orderData.orderId,
        });

    } catch (error) {
        console.error('Failed to process order:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to process order',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}
