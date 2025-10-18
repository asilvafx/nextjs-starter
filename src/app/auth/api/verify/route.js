// app/auth/api/verify/route.js
import { NextResponse } from 'next/server';
import { decryptHash } from '@/lib/server/crypt.js';

export async function POST(request) {
    try {
        const { code, encryptedCode } = await request.json();

        // Validation
        if (!code || !encryptedCode) {
            return NextResponse.json({ error: 'Code is required.' }, { status: 400 });
        }

        // Verify the code matches the encrypted version
        const decryptedCode = decryptHash(encryptedCode);

        if (code !== decryptedCode.code) {
            return NextResponse.json({ error: 'Invalid verification code.' }, { status: 400 });
        }

        // Check if code has expired (15 minutes)
        const now = new Date();
        const expiresAt = new Date(decryptedCode.expiresAt);

        if (now > expiresAt) {
            return NextResponse.json(
                { error: 'Verification code has expired. Please request a new code.' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Code verified successfully. You can now reset your password.'
        });
    } catch (error) {
        console.error('Verify code error:', error);
        return NextResponse.json({ error: 'Error verifying code.' }, { status: 500 });
    }
}
