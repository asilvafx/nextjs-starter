import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';

/**
 * GET /api/ai/settings
 * Returns the AI agent settings record (if any)
 */
export async function GET() {
    try {
        const all = await DBService.readAll('ai_settings');
        if (!all) return NextResponse.json({ success: true, data: null });

        let record = null;
        if (Array.isArray(all)) {
            record = all.length ? all[0] : null;
        } else if (typeof all === 'object') {
            const firstKey = Object.keys(all)[0];
            record = firstKey ? all[firstKey] : null;
        }

        return NextResponse.json({ success: true, data: record || null });
    } catch (error) {
        console.error('GET /api/ai/settings error', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/ai/settings
 * Create or update AI settings
 */
export async function POST(req) {
    try {
        const body = await req.json();
        const payload = {
            enabled: !!body.enabled,
            replicateApiKey: body.replicateApiKey || ''
        };

        // Check for existing record
        const all = await DBService.readAll('ai_settings');
        let existingKey = null;
        if (Array.isArray(all) && all.length) {
            const first = all[0];
            existingKey = first.id || first.key || null;
        } else if (all && typeof all === 'object') {
            const firstKey = Object.keys(all)[0];
            if (firstKey) existingKey = firstKey;
        }

        if (existingKey) {
            const result = await DBService.update(existingKey, payload, 'ai_settings');
            return NextResponse.json({ success: true, data: result });
        }

        const created = await DBService.create(payload, 'ai_settings');
        return NextResponse.json({ success: true, data: created });
    } catch (error) {
        console.error('POST /api/ai/settings error', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
