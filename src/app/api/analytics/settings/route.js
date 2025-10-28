import DBService from '@/data/rest.db.js';
import { NextResponse } from 'next/server';

/**
 * GET /api/analytics/settings
 * Returns the analytics settings record (if any)
 */
export async function GET() {
    try {
        const all = await DBService.readAll('analytics_settings');

        // readAll may return an object mapping keys to records or an array.
        if (!all) return NextResponse.json({ success: true, data: null });

        // Normalize to first record
        let record = null;
        if (Array.isArray(all)) {
            record = all.length ? all[0] : null;
        } else if (typeof all === 'object') {
            const firstKey = Object.keys(all)[0];
            record = firstKey ? all[firstKey] : null;
        }

        return NextResponse.json({ success: true, data: record || null });
    } catch (error) {
        console.error('GET /api/analytics/settings error', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/analytics/settings
 * Create or update analytics settings
 */
export async function POST(req) {
    try {
        const body = await req.json();
        const payload = {
            enabled: !!body.enabled,
            apiKey: body.apiKey || ''
        };

        // Check for existing record
        const all = await DBService.readAll('analytics_settings');
        let existingKey = null;
        if (Array.isArray(all) && all.length) {
            // If array, assume first item has an id/key property
            const first = all[0];
            existingKey = first.id || first.key || null;
        } else if (all && typeof all === 'object') {
            const firstKey = Object.keys(all)[0];
            if (firstKey) existingKey = firstKey;
        }

        if (existingKey) {
            const result = await DBService.update(existingKey, payload, 'analytics_settings');
            return NextResponse.json({ success: true, data: result });
        }

        const created = await DBService.create(payload, 'analytics_settings');
        return NextResponse.json({ success: true, data: created });
    } catch (error) {
        console.error('POST /api/analytics/settings error', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
