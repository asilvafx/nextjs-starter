// app/api/dashboard/stats/route.js
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth.js';
import { getDashboardStats } from '@/lib/server/dashboard.js';

// GET dashboard statistics - wrapper for server function
// Kept for backward compatibility if needed elsewhere
async function handleGetStats(_request) {
    try {
        const result = await getDashboardStats();

        if (result.success) {
            return NextResponse.json(result);
        } else {
            return NextResponse.json(result, { status: 500 });
        }
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch dashboard statistics',
                message: error.message
            },
            { status: 500 }
        );
    }
}

// Export with authentication
export const GET = withAuth(handleGetStats);
