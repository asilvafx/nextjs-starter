// app/api/auth/2fa/verify/route.js
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth.js';

async function handleTwoFactorVerify(_request, _context) {
    try {
        return NextResponse.json(
            {
                success: false,
                message: '2FA verification is temporarily disabled during build'
            },
            { status: 503 }
        );
    } catch (error) {
        console.error('2FA verification error:', error);
        return NextResponse.json({ success: false, message: 'Failed to verify 2FA' }, { status: 500 });
    }
}

export const POST = withAuth(handleTwoFactorVerify);
