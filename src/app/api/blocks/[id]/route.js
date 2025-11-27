import { NextResponse } from 'next/server';
import { getBlockById } from '@/lib/server/admin';

export async function GET(request, { params }) {
    try {
        const blockId = params.id;
        
        if (!blockId) {
            return NextResponse.json(
                { success: false, error: 'Block ID is required' },
                { status: 400 }
            );
        }

        const result = await getBlockById(blockId);
        
        if (result.success) {
            // Only return active blocks to frontend
            if (!result.data?.isActive) {
                return NextResponse.json(
                    { success: false, error: 'Block not found or inactive' },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                data: result.data
            });
        } else {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 404 }
            );
        }
    } catch (error) {
        console.error('Error in blocks API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}