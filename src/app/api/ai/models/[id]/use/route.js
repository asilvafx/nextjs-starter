import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import DBService from '@/data/rest.db.js';

/**
 * POST /api/ai/models/[id]/use
 * Body: { prompt: string, modelSettings?: object }
 * Finds the model by id, merges default config with provided settings, calls Replicate and returns the result.
 */
export async function POST(req, { params }) {
    try {
        const { id } = params;
        const body = await req.json();

        const prompt = body?.prompt;
        const modelSettings = body?.modelSettings || {};

        if (!prompt && Object.keys(modelSettings).length === 0) {
            return NextResponse.json({ success: false, error: 'Missing prompt or modelSettings in request body' }, { status: 400 });
        }

        // Load model record from DB
        const modelRecord = await DBService.read(id, 'ai_models');
        if (!modelRecord) {
            return NextResponse.json({ success: false, error: 'Model not found' }, { status: 404 });
        }

        if (!modelRecord.enabled) {
            return NextResponse.json({ success: false, error: 'Model is disabled' }, { status: 403 });
        }

        const modelId = modelRecord.modelId || modelRecord.id || modelRecord.model || null;
        if (!modelId) {
            return NextResponse.json({ success: false, error: 'Model record missing modelId' }, { status: 500 });
        }

        // Resolve Replicate API token: prefer ai_settings.replicateApiKey, fallback to env
        let apiToken = process.env.REPLICATE_API_TOKEN || null;
        try {
            const aiSettingsAll = await DBService.readAll('ai_settings');
            let aiSettings = null;
            if (Array.isArray(aiSettingsAll) && aiSettingsAll.length) aiSettings = aiSettingsAll[0];
            else if (aiSettingsAll && typeof aiSettingsAll === 'object') aiSettings = Object.values(aiSettingsAll)[0];
        if (aiSettings?.replicateApiKey) apiToken = aiSettings.replicateApiKey;
        } catch (err) {
            // ignore - we'll rely on env token if present
            console.warn('Failed to read ai_settings for replicate token', err?.message || err);
        }

        if (!apiToken) {
            return NextResponse.json({ success: false, error: 'Replicate API token not configured' }, { status: 500 });
        }

        const client = new Replicate({ auth: apiToken });

        // Merge model defaults with provided settings. Prompt is added to input.
        const input = {
            ...(modelRecord.config || {}),
            ...modelSettings,
            prompt
        };

        // Run the model
        const output = await client.run(modelId, { input });

        return NextResponse.json({ success: true, data: output });
    } catch (error) {
        console.error('POST /api/ai/models/[id]/use error', error);
        return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
    }
}
