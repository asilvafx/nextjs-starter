// app/api/sms/route.js

import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/server/admin';
import { withAuth } from '@/lib/server/auth';

// Initialize Twilio client
let twilioClient = null;

const initializeTwilioClient = async () => {
    if (twilioClient) return twilioClient;

    try {
        const siteSettings = await getSiteSettings();
        
        if (!siteSettings.success || !siteSettings.data.smsEnabled) {
            throw new Error('SMS service is not enabled');
        }

        const { twilioAccountSid, twilioAuthToken } = siteSettings.data;
        
        if (!twilioAccountSid || !twilioAuthToken) {
            throw new Error('Twilio credentials are not configured');
        }

        // Dynamically import Twilio
        const twilio = await import('twilio');
        twilioClient = twilio.default(twilioAccountSid, twilioAuthToken);
        
        return twilioClient;
    } catch (error) {
        console.error('Failed to initialize Twilio client:', error);
        throw error;
    }
};

async function handlePost(request) {
    try {
        const body = await request.json();
        const { type } = body;

        // Initialize Twilio client
        const client = await initializeTwilioClient();
        
        // Get site settings for SMS configuration
        const siteSettingsResult = await getSiteSettings();
        if (!siteSettingsResult.success) {
            throw new Error('Failed to load site settings');
        }

        const siteSettings = siteSettingsResult.data;
        if (!siteSettings.smsEnabled) {
            return NextResponse.json(
                { success: false, error: 'SMS service is disabled' },
                { status: 400 }
            );
        }

        const twilioPhoneNumber = siteSettings.twilioPhoneNumber;
        if (!twilioPhoneNumber) {
            throw new Error('Twilio phone number is not configured');
        }

        switch (type) {
            case 'sms_campaign': {
                // Handle SMS campaign bulk sending
                const { campaign, subscribers, manualRecipients } = body;

                if (!campaign) {
                    throw new Error('Campaign is required');
                }

                // Combine subscribers and manual recipients
                const allRecipients = [
                    ...(subscribers || []),
                    ...(manualRecipients || []).map((r) => ({
                        id: `manual_${Date.now()}_${Math.random()}`,
                        phone: r.phone,
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

                // Send SMS to each recipient
                for (const recipient of allRecipients) {
                    try {
                        if (!recipient.phone) {
                            throw new Error('Phone number is required');
                        }

                        // Format phone number (ensure it starts with +)
                        let phoneNumber = recipient.phone.replace(/\D/g, '');
                        if (!phoneNumber.startsWith('+')) {
                            phoneNumber = `+${phoneNumber}`;
                        }

                        // Personalize message
                        let message = campaign.content || campaign.message || '';
                        if (recipient.name) {
                            message = message.replace(/\{name\}/g, recipient.name);
                            message = message.replace(/\{firstName\}/g, recipient.name.split(' ')[0]);
                        }

                        await client.messages.create({
                            body: message,
                            from: twilioPhoneNumber,
                            to: phoneNumber
                        });

                        successCount++;

                        // Small delay to avoid overwhelming Twilio API
                        await new Promise((resolve) => setTimeout(resolve, 200));
                    } catch (error) {
                        console.error(`Failed to send SMS to ${recipient.phone}:`, error);
                        failureCount++;
                        errors.push({
                            recipient: recipient.phone,
                            error: error.message
                        });
                    }
                }

                console.log(`SMS campaign sent: ${successCount} successful, ${failureCount} failed`);

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

            case 'sms_test': {
                // Handle SMS test sending (single recipient)
                const { campaign: testCampaign, testPhone, testName } = body;

                if (!testCampaign || !testPhone) {
                    throw new Error('Campaign and test phone number are required');
                }

                // Format phone number
                let phoneNumber = testPhone.replace(/\D/g, '');
                if (!phoneNumber.startsWith('+')) {
                    phoneNumber = `+${phoneNumber}`;
                }

                // Personalize test message
                let message = testCampaign.content || testCampaign.message || '';
                message = `[TEST] ${message}`;
                if (testName) {
                    message = message.replace(/\{name\}/g, testName);
                    message = message.replace(/\{firstName\}/g, testName.split(' ')[0]);
                }

                await client.messages.create({
                    body: message,
                    from: twilioPhoneNumber,
                    to: phoneNumber
                });

                return NextResponse.json({
                    success: true,
                    data: {
                        message: 'Test SMS sent successfully',
                        to: phoneNumber
                    }
                });
            }

            case 'verify_phone': {
                // Handle phone number verification
                const { phoneNumber } = body;

                if (!phoneNumber) {
                    throw new Error('Phone number is required');
                }

                // Format phone number
                let formattedPhone = phoneNumber.replace(/\D/g, '');
                if (!formattedPhone.startsWith('+')) {
                    formattedPhone = `+${formattedPhone}`;
                }

                // Send verification code
                const verificationCode = Math.floor(100000 + Math.random() * 900000);
                const message = `Your verification code is: ${verificationCode}. Do not share this code with anyone.`;

                await client.messages.create({
                    body: message,
                    from: twilioPhoneNumber,
                    to: formattedPhone
                });

                return NextResponse.json({
                    success: true,
                    data: {
                        message: 'Verification code sent',
                        code: verificationCode, // In production, store this securely
                        phone: formattedPhone
                    }
                });
            }

            default:
                return NextResponse.json(
                    { success: false, error: 'Invalid SMS type' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('SMS sending error:', error);
        
        // Handle specific Twilio errors
        if (error.code) {
            const errorMessage = error.message || 'Twilio API error';
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
                error: error.message || 'Failed to send SMS'
            },
            { status: 500 }
        );
    }
}

// Export the route handler with authentication
export const POST = withAuth(handlePost);