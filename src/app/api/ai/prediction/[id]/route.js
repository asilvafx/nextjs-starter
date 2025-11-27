// @/app/api/ai/prediction/[id]/route.js
import { NextResponse } from 'next/server';
import { getAISettings } from '@/lib/server/admin';

/**
 * GET /api/ai/prediction/[id]
 * Get the status of a Replicate prediction
 */
export async function GET(req, { params }) {
    try {
        const { id } = params;
        
        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Prediction ID is required' }, 
                { status: 400 }
            );
        }

        // Get AI settings to get API key
        const settingsResult = await getAISettings();
        if (!settingsResult.success || !settingsResult.data?.enabled) {
            return NextResponse.json(
                { success: false, error: 'AI agent is not enabled' }, 
                { status: 400 }
            );
        }

        const apiKey = settingsResult.data.replicateApiKey;
        if (!apiKey) {
            return NextResponse.json(
                { success: false, error: 'Replicate API key not configured' }, 
                { status: 400 }
            );
        }

        // Get prediction status from Replicate
        const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
            headers: {
                'Authorization': `Token ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                { success: false, error: `Replicate API error: ${response.status} ${errorText}` }, 
                { status: response.status }
            );
        }

        const prediction = await response.json();
        return NextResponse.json({
            success: true,
            data: prediction
        });

    } catch (error) {
        console.error('Prediction status error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to get prediction status' }, 
            { status: 500 }
        );
    }
}