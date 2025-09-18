// app/auth/api/forgot/route.js
import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db';
import { encryptHash } from '@/lib/server/crypt';
import EmailService from '@/lib/server/email';
import { time } from 'console';

// Use API route for sending emails instead of direct import to avoid issues
async function sendPasswordResetEmailAsync(email, code, name) {
    try {
        if (!email || !code || !name) {
            return NextResponse.json(
                { error: 'Email, code, and name are required.' },
                { status: 400 }
            );
        }

        // Send password reset email
        await EmailService.sendPasswordResetEmail(email, code, name);

        return NextResponse.json({
            success: true,
            message: 'Reset email sent successfully'
        });
    } catch (error) {
        console.error('Reset email API call failed:', error);
        return NextResponse.json(
            { error: 'Failed to send reset email' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const { email } = await request.json();

        // Validation
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { error: 'Enter a valid email.' },
                { status: 400 }
            );
        }

        const address = email.toLowerCase();
        const user = await DBService.readBy("email", address, "users");

        if (!user) {
            // Don't reveal that email doesn't exist for security
            return NextResponse.json({
                success: true,
                message: `If ${address} exists in our system, you will receive a reset code shortly.`,
                // Remove in production - only for demo
                demoCode: null,
                encryptedCode: null
            });
        }

        
        // Generate 6-digit code
        const randomCode = Math.floor(100000 + Math.random() * 900000).toString(); 

        const codeData = { 
            email: address,
            code: randomCode,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() 
        };

        const codeDataEncrypted = encryptHash(codeData); 

        // Send password reset email
        try {
            await sendPasswordResetEmailAsync(
                address,
                randomCode,
                user.displayName
            );

            console.log(`Reset code sent to ${address}: ${randomCode}`);
        } catch (emailError) {
            console.error('Email service error:', emailError);
            return NextResponse.json(
                { error: 'Failed to send reset email. Please try again.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Code sent to ${address}. Please check your email inbox and spam folders.`,
            // Remove this in production - only for demo
            demoCode: process.env.NODE_ENV === 'development' ? randomCode : undefined,
            encryptedCode: codeDataEncrypted
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { error: 'Error sending code.' },
            { status: 500 }
        );
    }
}
