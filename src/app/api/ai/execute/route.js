// @/app/api/ai/execute/route.js
import { NextResponse } from 'next/server';
import { executeAIModel } from '@/lib/server/admin';

/**
 * POST /api/ai/execute
 * Execute an AI model with custom parameters
 * Body: { modelId: string, params: object }
 */
export async function POST(req) {
    try {
        const { modelId, params = {} } = await req.json();
        
        if (!modelId) {
            return NextResponse.json(
                { success: false, error: 'Model ID is required' }, 
                { status: 400 }
            );
        }

        const result = await executeAIModel(modelId, params);
        
        if (result.success) {
            return NextResponse.json(result);
        } else {
            return NextResponse.json(
                result, 
                { status: 400 }
            );
        }

    } catch (error) {
        console.error('AI execution error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to execute AI model' }, 
            { status: 500 }
        );
    }
}