// app/api/auth/2fa/disable/route.js
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth.js';

async function handleTwoFactorDisable(_request, _context) {
    try {
        return NextResponse.json(
            {
                success: false,
                message: '2FA disable is temporarily disabled during build'
            },
            { status: 503 }
        );
    } catch (error) {
        console.error('2FA disable error:', error);
        return NextResponse.json({ success: false, message: 'Failed to disable 2FA' }, { status: 500 });
    }
}

export const POST = withAuth(handleTwoFactorDisable);
