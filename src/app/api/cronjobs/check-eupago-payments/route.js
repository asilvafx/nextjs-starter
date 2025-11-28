// src/app/api/cronjobs/check-eupago-payments/route.js
import { NextResponse } from 'next/server';
import { withPublicAccess } from '@/lib/server/auth.js';

export const GET = withPublicAccess(async (req) => {
    try {
        // Check if cron key is provided for security
        const { searchParams } = new URL(req.url);
        const cronKey = searchParams.get('key');
        const expectedKey = process.env.CRON_SECRET_KEY;

        // If CRON_SECRET_KEY is set, validate it
        if (expectedKey && cronKey !== expectedKey) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Unauthorized'
                },
                { status: 401 }
            );
        }

        // Call centralized EuPago API to check pending payments
        const baseUrl = req.headers.get('host');
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const apiUrl = `${protocol}://${baseUrl}/api/eupago?action=check_pending`;

        const response = await fetch(apiUrl);
        const result = await response.json();

        // Log the result
        console.log(`EuPago cron job completed: ${JSON.stringify(result)}`);

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            cron: true,
            ...result
        });
    } catch (error) {
        console.error('EuPago cron job error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
});

export const POST = withPublicAccess(async (req) => {
    try {
        const body = await req.json();
        const { key } = body;
        const expectedKey = process.env.CRON_SECRET_KEY;

        // If CRON_SECRET_KEY is set, validate it
        if (expectedKey && key !== expectedKey) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Unauthorized'
                },
                { status: 401 }
            );
        }

        // Call centralized EuPago API to check pending payments
        const baseUrl = req.headers.get('host');
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const apiUrl = `${protocol}://${baseUrl}/api/eupago`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'check_pending' })
        });

        const result = await response.json();

        // Log the result
        console.log(`EuPago cron job completed: ${JSON.stringify(result)}`);

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            cron: true,
            ...result
        });
    } catch (error) {
        console.error('EuPago cron job error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
});
