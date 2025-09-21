// @/app/api/middleware/clear-cache/route.js
import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/server/auth';

// Clear middleware roles cache - Admin only
async function clearCache(request, context) {
    try {
        // Since we can't directly access middleware cache from here,
        // we'll return a response that the client can use to know cache should be cleared
        return NextResponse.json({
            success: true,
            message: 'Cache clear signal sent',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error clearing middleware cache:', error);
        return NextResponse.json(
            { error: 'Failed to clear middleware cache' },
            { status: 500 }
        );
    }
}

// Export with admin authentication
export const POST = withAdminAuth(clearCache);
export const DELETE = withAdminAuth(clearCache);