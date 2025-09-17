// app/auth/api/reset/route.js
import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';
import { decryptHash, encryptPassword, generateSalt } from '@/lib/server/crypt.js';

const passwordValid = (pwd) => {
    return (
        pwd.length >= 8 &&
        pwd.length <= 32 &&
        /[a-z]/.test(pwd) &&
        /[A-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)
    );
};

export async function POST(request) {

    try {
        const { email, newPassword, confirmPassword, code, token } = await request.json();

        // Verify Token
        if (!code || !token) {
            return NextResponse.json(
                { error: 'Token invalid. Please, refresh your browser and try again later.' }
            );
        } else if (code !== decryptHash(token)) {
            return NextResponse.json(
                { error: 'Token mismatch. Please, refresh your browser and try again later.' }
            );
        }

        // Validation
        if (!email || !newPassword || !confirmPassword) {
            return NextResponse.json(
                { error: 'Email and passwords are required.' }
            );
        }

        if (newPassword !== confirmPassword) {
            return NextResponse.json(
                { error: 'Passwords must match.' }
            );
        }

        if (!passwordValid(newPassword)) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters with lowercase and one uppercase or number.' }
            );
        }

        const address = email.toLowerCase();
        const user = await DBService.readBy("email", address, "users");

        if (!user) {
            return NextResponse.json(
                { error: 'User not found.' }
            );
        }

        // TO DO - Check if code has expired (15 minutes from creation)

        // Get the user's key to update the record
        const userKey = await DBService.getItemKey("email", address, "users");
        if (!userKey) {
            return NextResponse.json(
                { error: 'Unable to update password.' }
            );
        }

        // Generate new salt and encrypt password (consistent with your auth system)
        const newSalt = generateSalt();
        const encryptedPassword = await encryptPassword(newPassword, newSalt);

        // Update user with new password and remove reset code
        const { resetCode, ...userWithoutResetCode } = user;
        const updatedUser = {
            ...userWithoutResetCode,
            password: encryptedPassword,
            salt: newSalt,
            // Optionally track when password was last changed
            passwordChangedAt: new Date().toISOString()
        };

        await DBService.update(userKey, updatedUser, "users");

        console.log(`Password reset successful for user: ${address}`);

        return NextResponse.json({
            success: true,
            message: 'Password updated successfully. You can now log in with your new password.'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { error: 'Failed to update password.' },
            { status: 500 }
        );
    }
}
