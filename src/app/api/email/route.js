// app/api/email/route.js

import { NextResponse } from 'next/server';
import EmailService from '@/lib/server/email';
import UserCreatedTemplate from '@/emails/UserCreatedTemplate';
import UserUpdatedTemplate from '@/emails/UserUpdatedTemplate';

export async function POST(request) {
    try {
        const body = await request.json();
        const { type, email, name, password, changes } = body;

        switch (type) {
            case 'user_created':
                await EmailService.sendEmail(
                    email,
                    'Welcome to Your Account',
                    UserCreatedTemplate,
                    {
                        userDisplayName: name,
                        email,
                        password,
                        loginUrl: `${process.env.NEXTAUTH_URL}/auth/login`
                    }
                );
                break;

            case 'user_updated':
                await EmailService.sendEmail(
                    email,
                    'Your Account Has Been Updated',
                    UserUpdatedTemplate,
                    {
                        userDisplayName: name,
                        changes,
                        loginUrl: `${process.env.NEXTAUTH_URL}/auth/login`
                    }
                );
                break;

            case 'order_status_update':
                // Handle order status update email
                const { email: customerEmail, customerName, orderId, orderDate, status, items, subtotal, shippingCost, total, shippingAddress } = body;
                
                await EmailService.sendOrderUpdateEmail(
                    customerEmail,
                    {
                        customerName,
                        orderId,
                        orderDate,
                        status,
                        items,
                        total,
                        subtotal,
                        shippingCost,
                        shippingAddress
                    }
                );
                break;

            default:
                throw new Error('Invalid email type');
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Email sending error:', error);
        return NextResponse.json(
            { error: 'Failed to send email' },
            { status: 500 }
        );
    }
}