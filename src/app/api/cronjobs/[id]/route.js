import DBService from '@/data/rest.db.js';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
    try {
        const id = params.id;
        const body = await req.json();
        const updated = await DBService.update(id, body, 'cronjobs');
        return NextResponse.json({ success: true, data: updated });
    } catch (err) {
        console.error('PUT /api/cronjobs/[id] error', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const id = params.id;
        const result = await DBService.delete(id, 'cronjobs');
        return NextResponse.json({ success: true, data: result });
    } catch (err) {
        console.error('DELETE /api/cronjobs/[id] error', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
