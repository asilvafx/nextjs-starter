import DBService from '@/data/rest.db.js';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const all = await DBService.readAll('cronjobs');
        return NextResponse.json({ success: true, data: all || [] });
    } catch (err) {
        console.error('GET /api/cronjobs error', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const payload = {
            name: body.name || 'Untitled Cronjob',
            enabled: !!body.enabled,
            type: body.type || 'http',
            config: body.config || {},
            intervalMinutes: Number(body.intervalMinutes) || 60,
            lastRun: body.lastRun || null,
            createdAt: new Date().toISOString()
        };

        const created = await DBService.create(payload, 'cronjobs');
        return NextResponse.json({ success: true, data: created });
    } catch (err) {
        console.error('POST /api/cronjobs error', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
