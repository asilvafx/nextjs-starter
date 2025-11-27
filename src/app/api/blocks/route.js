import { NextResponse } from 'next/server';
import { getAllBlocks } from '@/lib/server/admin';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'all';
        const limit = parseInt(searchParams.get('limit')) || 50;
        const page = parseInt(searchParams.get('page')) || 1;

        const result = await getAllBlocks({
            page,
            limit,
            type,
            status: 'active', // Only return active blocks to frontend
            sortBy: 'updatedAt',
            sortOrder: 'desc'
        });
        
        if (result.success) {
            // Filter to only active blocks (extra safety)
            const activeBlocks = result.data.filter(block => block.isActive);
            
            return NextResponse.json({
                success: true,
                data: activeBlocks,
                pagination: {
                    ...result.pagination,
                    total: activeBlocks.length
                }
            });
        } else {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
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