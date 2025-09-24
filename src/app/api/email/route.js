// app/api/email/route.js

import { NextResponse } from 'next/server';
import EmailService from '@/lib/server/email';
import UserCreatedTemplate from '@/emails/UserCreatedTemplate';
import UserUpdatedTemplate from '@/emails/UserUpdatedTemplate';
import NewsletterTemplate from '@/emails/NewsletterTemplate';

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

            case 'newsletter':
                // Handle newsletter bulk sending
                const { campaign, subscribers } = body;
                
                if (!campaign || !subscribers || subscribers.length === 0) {
                    throw new Error('Campaign and subscribers are required');
                }

                const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                let successCount = 0;
                let failureCount = 0;

                // Send newsletter to each subscriber
                for (const subscriber of subscribers) {
                    try {
                        const unsubscribeUrl = `${baseUrl}/newsletter/unsubscribe?email=${encodeURIComponent(subscriber.email)}&id=${subscriber.id}`;
                        const webVersionUrl = `${baseUrl}/newsletter/campaign/${campaign.id}`;

                        await EmailService.sendEmail(
                            subscriber.email,
                            campaign.subject,
                            NewsletterTemplate,
                            {
                                subject: campaign.subject,
                                content: campaign.content || campaign.previewText || 'Thank you for subscribing to our newsletter.',
                                previewText: campaign.previewText || '',
                                subscriberName: subscriber.name || null,
                                companyName: await EmailService.getEmailName ? await EmailService.getEmailName() : 'Your App Name',
                                unsubscribeUrl,
                                webVersionUrl
                            }
                        );
                        successCount++;
                        
                        // Small delay to avoid overwhelming the email service
                        await new Promise(resolve => setTimeout(resolve, 100));
                    } catch (error) {
                        console.error(`Failed to send newsletter to ${subscriber.email}:`, error);
                        failureCount++;
                    }
                }

                console.log(`Newsletter campaign sent: ${successCount} successful, ${failureCount} failed`);
                
                return NextResponse.json({ 
                    success: true, 
                    data: {
                        sent: successCount,
                        failed: failureCount,
                        total: subscribers.length
                    }
                });

            case 'newsletter_test':
                // Handle newsletter test sending (single recipient)
                const { campaign: testCampaign, testEmail, testName } = body;
                
                if (!testCampaign || !testEmail) {
                    throw new Error('Campaign and test email are required');
                }

                const baseUrl2 = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                
                await EmailService.sendEmail(
                    testEmail,
                    `[TEST] ${testCampaign.subject}`,
                    NewsletterTemplate,
                    {
                        subject: testCampaign.subject,
                        content: testCampaign.content || testCampaign.previewText || 'Thank you for subscribing to our newsletter.',
                        previewText: testCampaign.previewText || '',
                        subscriberName: testName || 'Test User',
                        companyName: await EmailService.getEmailName ? await EmailService.getEmailName() : 'Your App Name',
                        unsubscribeUrl: `${baseUrl2}/newsletter/unsubscribe`,
                        webVersionUrl: `${baseUrl2}/newsletter/campaign/${testCampaign.id}`
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