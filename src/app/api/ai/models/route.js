import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';

/**
 * GET /api/ai/models
 * POST /api/ai/models
 */
export async function GET() {
    try {
        const all = await DBService.readAll('ai_models');
        if (!all) return NextResponse.json({ success: true, data: [] });

        let records = [];
        if (Array.isArray(all)) records = all;
        else if (typeof all === 'object') records = Object.values(all || {});

        return NextResponse.json({ success: true, data: records });
    } catch (error) {
        console.error('GET /api/ai/models error', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const payload = {
            name: body.name || 'Unnamed model',
            modelId: body.modelId || '',
            description: body.description || '',
            enabled: !!body.enabled,
            config: body.config || {}
        };

        const created = await DBService.create(payload, 'ai_models');
        return NextResponse.json({ success: true, data: created });
    } catch (error) {
        console.error('POST /api/ai/models error', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
