// app/api/email/route.js

import { NextResponse } from 'next/server';
import NewsletterTemplate from '@/emails/NewsletterTemplate';
import OrderConfirmationTemplate from '@/emails/OrderConfirmationTemplate';
import UserCreatedTemplate from '@/emails/UserCreatedTemplate';
import UserUpdatedTemplate from '@/emails/UserUpdatedTemplate';
import EmailService from '@/lib/server/email';
import { getSiteSettings } from '@/lib/server/admin';

export async function POST(request) {
    try {
        const body = await request.json();
        const { type, email, name, password, changes } = body;

        // Load site settings for email configuration
        const siteSettingsResult = await getSiteSettings();
        let siteSettings = {};
        
        if (siteSettingsResult.success) {
            siteSettings = siteSettingsResult.data;
        } else {
            console.warn('Failed to load site settings, using defaults');
        }

        // Check if email service is enabled
        if (siteSettings.emailEnabled === false) {
            return NextResponse.json(
                { success: false, error: 'Email service is disabled' },
                { status: 400 }
            );
        }

        // Get email configuration from site settings with fallbacks
        const emailConfig = {
            senderName: siteSettings.emailSenderName || 'Your App Name',
            senderEmail: siteSettings.emailSenderEmail || process.env.SMTP_USER || 'noreply@yourdomain.com',
            supportEmail: siteSettings.emailSupportEmail || process.env.SUPPORT_EMAIL || 'support@yourdomain.com',
            companyName: siteSettings.siteName || siteSettings.emailSenderName || 'Your Company',
            baseUrl: siteSettings.siteUrl || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        };

        switch (type) {
            case 'user_created':
                await EmailService.sendEmail(email, 'Welcome to Your Account', UserCreatedTemplate, {
                    userDisplayName: name,
                    email,
                    password,
                    loginUrl: `${emailConfig.baseUrl}/auth/login`,
                    companyName: emailConfig.companyName,
                    supportEmail: emailConfig.supportEmail
                }, {
                    from: emailConfig.senderEmail,
                    replyTo: emailConfig.supportEmail,
                    senderName: emailConfig.senderName
                });
                break;

            case 'user_updated':
                await EmailService.sendEmail(email, 'Your Account Has Been Updated', UserUpdatedTemplate, {
                    userDisplayName: name,
                    changes,
                    loginUrl: `${emailConfig.baseUrl}/auth/login`,
                    companyName: emailConfig.companyName,
                    supportEmail: emailConfig.supportEmail
                }, {
                    from: emailConfig.senderEmail,
                    replyTo: emailConfig.supportEmail,
                    senderName: emailConfig.senderName
                });
                break;

            case 'order_status_update': {
                // Handle order status update email
                const {
                    email: customerEmail,
                    customerName,
                    orderId,
                    orderDate,
                    status,
                    items,
                    subtotal,
                    shippingCost,
                    total,
                    shippingAddress,
                    trackingNumber,
                    trackingUrl
                } = body;

                await EmailService.sendOrderUpdateEmail(customerEmail, {
                    customerName,
                    orderId,
                    orderDate,
                    status,
                    items,
                    total,
                    subtotal,
                    shippingCost,
                    shippingAddress,
                    trackingNumber: trackingNumber || null,
                    trackingUrl: trackingUrl || null
                });
                break;
            }

            case 'newsletter': {
                // Handle newsletter bulk sending
                const { campaign, subscribers, manualRecipients, senderName, senderEmail } = body;

                if (!campaign) {
                    throw new Error('Campaign is required');
                }

                // Combine subscribers and manual recipients
                const allRecipients = [
                    ...(subscribers || []),
                    ...(manualRecipients || []).map((r) => ({
                        id: `manual_${Date.now()}_${Math.random()}`,
                        email: r.email,
                        name: r.name || null,
                        status: 'active'
                    }))
                ];

                if (allRecipients.length === 0) {
                    throw new Error('At least one recipient is required');
                }

                let successCount = 0;
                let failureCount = 0;
                const errors = [];

                // Use configured sender information with fallbacks
                const finalSenderName = senderName || emailConfig.senderName;
                const finalSenderEmail = senderEmail || emailConfig.senderEmail;

                // Send newsletter to each recipient
                for (const recipient of allRecipients) {
                    try {
                        const unsubscribeUrl = `${emailConfig.baseUrl}/newsletter/unsubscribe?email=${encodeURIComponent(recipient.email)}&id=${recipient.id}`;
                        const webVersionUrl = `${emailConfig.baseUrl}/newsletter/campaign/${campaign.id}`;

                        await EmailService.sendEmail(
                            recipient.email,
                            campaign.subject,
                            NewsletterTemplate,
                            {
                                subject: campaign.subject,
                                content: campaign.content || campaign.previewText || 'Thank you for subscribing to our newsletter.',
                                previewText: campaign.previewText || campaign.subject || '',
                                subscriberName: recipient.name || null,
                                companyName: emailConfig.companyName,
                                senderName: finalSenderName,
                                senderEmail: finalSenderEmail,
                                unsubscribeUrl,
                                webVersionUrl,
                                supportEmail: emailConfig.supportEmail
                            },
                            {
                                from: finalSenderEmail,
                                replyTo: emailConfig.supportEmail,
                                senderName: finalSenderName
                            }
                        );
                        successCount++;

                        // Small delay to avoid overwhelming the email service
                        await new Promise((resolve) => setTimeout(resolve, 100));
                    } catch (error) {
                        console.error(`Failed to send newsletter to ${recipient.email}:`, error);
                        failureCount++;
                        errors.push({
                            recipient: recipient.email,
                            error: error.message
                        });
                    }
                }

                console.log(`Newsletter campaign sent: ${successCount} successful, ${failureCount} failed`);

                return NextResponse.json({
                    success: true,
                    data: {
                        sent: successCount,
                        failed: failureCount,
                        total: allRecipients.length,
                        errors: errors.slice(0, 5) // Limit errors in response
                    }
                });
            }

            case 'newsletter_test': {
                // Handle newsletter test sending (single recipient)
                const { campaign: testCampaign, testEmail, testName, senderName: testSenderName, senderEmail: testSenderEmail } = body;

                if (!testCampaign || !testEmail) {
                    throw new Error('Campaign and test email are required');
                }

                // Use configured sender information with fallbacks
                const testFinalSenderName = testSenderName || emailConfig.senderName;
                const testFinalSenderEmail = testSenderEmail || emailConfig.senderEmail;

                await EmailService.sendEmail(
                    testEmail,
                    `[TEST] ${testCampaign.subject}`,
                    NewsletterTemplate,
                    {
                        subject: testCampaign.subject,
                        content: testCampaign.content || testCampaign.previewText || 'Thank you for subscribing to our newsletter.',
                        previewText: testCampaign.previewText || testCampaign.subject || '',
                        subscriberName: testName || 'Test User',
                        companyName: emailConfig.companyName,
                        senderName: testFinalSenderName,
                        senderEmail: testFinalSenderEmail,
                        unsubscribeUrl: `${emailConfig.baseUrl}/newsletter/unsubscribe`,
                        webVersionUrl: `${emailConfig.baseUrl}/newsletter/campaign/${testCampaign.id}`,
                        supportEmail: emailConfig.supportEmail
                    },
                    {
                        from: testFinalSenderEmail,
                        replyTo: emailConfig.supportEmail,
                        senderName: testFinalSenderName
                    }
                );
                break;
            }

            case 'order_confirmation': {
                // Handle order confirmation email
                const {
                    email: orderEmail,
                    customerName: orderCustomerName,
                    orderId: orderOrderId,
                    orderDate: orderOrderDate,
                    items: orderItems,
                    subtotal: orderSubtotal,
                    shippingCost: orderShippingCost,
                    total: orderTotal,
                    shippingAddress: orderShippingAddress
                } = body;

                // Format the order date
                const formattedOrderDate = new Date(orderOrderDate).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                // Transform products to the template format
                const formattedProducts = orderItems.map((item) => ({
                    name: item.name,
                    size: item.size || 'Standard',
                    quantity: item.quantity
                }));

                // Create formatted delivery address
                const deliveryAddress = {
                    name: orderCustomerName,
                    address: `${orderShippingAddress.street}${orderShippingAddress.unit ? `, ${orderShippingAddress.unit}` : ''}, ${orderShippingAddress.city}, ${orderShippingAddress.state} ${orderShippingAddress.zip}, ${orderShippingAddress.country}`
                };

                await EmailService.sendEmail(orderEmail, 'Confirmation de votre commande', OrderConfirmationTemplate, {
                    userDisplayName: orderCustomerName,
                    orderId: `#${orderOrderId}`,
                    orderDate: formattedOrderDate,
                    products: formattedProducts,
                    deliveryAddress: deliveryAddress,
                    orderSummaryUrl: `${emailConfig.baseUrl}/orders/${orderOrderId}`,
                    companyName: emailConfig.companyName,
                    supportEmail: emailConfig.supportEmail
                }, {
                    from: emailConfig.senderEmail,
                    replyTo: emailConfig.supportEmail,
                    senderName: emailConfig.senderName
                });
                break;
            }

            default:
                throw new Error('Invalid email type');
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Email sending error:', error);
        
        // Handle specific email provider errors
        if (error.code) {
            const errorMessage = error.message || 'Email service error';
            return NextResponse.json(
                { 
                    success: false, 
                    error: errorMessage,
                    code: error.code
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { 
                success: false, 
                error: error.message || 'Failed to send email'
            },
            { status: 500 }
        );
    }
}
