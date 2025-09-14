// app/api/protected/route.js
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth.js';

async function protectedHandler(request) {
    try {
        // Access user data from the JWT token
        const { user } = request;

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            },
            message: 'Protected route accessed successfully!'
        });
    } catch (error) {
        console.error('Protected route error:', error);
        return NextResponse.json(
            { error: 'Internal server error.' },
            { status: 500 }
        );
    }
}

export const GET = withAuth(protectedHandler);
export const POST = withAuth(protectedHandler);
