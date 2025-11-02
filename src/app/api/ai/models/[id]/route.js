import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';

/**
 * PUT /api/ai/models/[id]
 * DELETE /api/ai/models/[id]
 */
export async function PUT(req, { params }) {
    try {
        const { id } = params;
        const body = await req.json();
        const payload = {
            name: body.name,
            modelId: body.modelId,
            description: body.description,
            enabled: !!body.enabled,
            config: body.config || {}
        };

        const result = await DBService.update(id, payload, 'ai_models');
        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error('PUT /api/ai/models/[id] error', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(_req, { params }) {
    try {
        const { id } = params;
        const result = await DBService.delete(id, 'ai_models');
        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error('DELETE /api/ai/models/[id] error', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
