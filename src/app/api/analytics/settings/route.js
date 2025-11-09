import { NextResponse } from 'next/server';

/**
 * GET /api/analytics/settings
 * Wrapper for server function - kept for backward compatibility
 */
export async function GET() {
    try {
        const { getAnalyticsSettings } = await import('@/lib/server/analytics.js');
        const result = await getAnalyticsSettings();

        if (result.success) {
            return NextResponse.json(result);
        } else {
            return NextResponse.json(result, { status: 500 });
        }
    } catch (error) {
        console.error('GET /api/analytics/settings error', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/analytics/settings
 * Wrapper for server function - kept for backward compatibility
 */
export async function POST(req) {
    try {
        const { saveAnalyticsSettings } = await import('@/lib/server/analytics.js');
        const body = await req.json();

        const result = await saveAnalyticsSettings({
            enabled: !!body.enabled,
            apiKey: body.apiKey || ''
        });

        if (result.success) {
            return NextResponse.json(result);
        } else {
            return NextResponse.json(result, { status: 500 });
        }
    } catch (error) {
        console.error('POST /api/analytics/settings error', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
