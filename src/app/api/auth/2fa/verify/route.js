// app/api/auth/2fa/verify/route.js
import { NextResponse } from 'next/server';
import { authenticator } from 'otplib';
import DBService from '@/data/rest.db.js';
import { withAuth } from '@/lib/server/auth';

async function handleTwoFactorVerify(request, context) {
  try {
    const user = request.user;
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Verification code is required' },
        { status: 400 }
      );
    }

    // Get user data from database
    const userData = await DBService.read(user.id, 'users');
    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    if (!userData.twoFactorSecret) {
      return NextResponse.json(
        { success: false, message: '2FA setup not initiated' },
        { status: 400 }
      );
    }

    // Verify the TOTP code
    const isValid = authenticator.verify({
      token: code,
      secret: userData.twoFactorSecret
    });

    if (!isValid) {
      // Check if it's a backup code
      const backupCodes = userData.twoFactorBackupCodes || [];
      const backupCodeIndex = backupCodes.indexOf(code.toUpperCase());
      
      if (backupCodeIndex === -1) {
        return NextResponse.json(
          { success: false, message: 'Invalid verification code' },
          { status: 400 }
        );
      }

      // Remove used backup code
      backupCodes.splice(backupCodeIndex, 1);
      userData.twoFactorBackupCodes = backupCodes;
    }

    // Enable 2FA for the user
    const updateData = {
      ...userData,
      twoFactorEnabled: true,
      twoFactorEnabledAt: new Date().toISOString()
    };

    const result = await DBService.update(user.id, updateData, 'users');

    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Failed to enable 2FA' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '2FA enabled successfully'
    });

  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to verify 2FA' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handleTwoFactorVerify);