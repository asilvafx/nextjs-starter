// app/api/auth/2fa/setup/route.js
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth.js';

async function handleTwoFactorSetup(_request, _context) {
    try {
        return NextResponse.json(
            {
                success: false,
                message: '2FA setup is temporarily disabled during build'
            },
            { status: 503 }
        );
    } catch (error) {
        console.error('2FA setup error:', error);
        return NextResponse.json({ success: false, message: 'Failed to setup 2FA' }, { status: 500 });
    }
}

export const POST = withAuth(handleTwoFactorSetup);
