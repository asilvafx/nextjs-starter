// app/api/auth/2fa/disable/route.js
import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';
import { withAuth } from '@/lib/server/auth';

async function handleTwoFactorDisable(request, context) {
  try {
    const user = request.user;

    // Get user data from database
    const userData = await DBService.read(user.id, 'users');
    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    if (!userData.twoFactorEnabled) {
      return NextResponse.json(
        { success: false, message: '2FA is not enabled' },
        { status: 400 }
      );
    }

    // Disable 2FA for the user
    const updateData = {
      ...userData,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
      twoFactorDisabledAt: new Date().toISOString()
    };

    const result = await DBService.update(user.id, updateData, 'users');

    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Failed to disable 2FA' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '2FA disabled successfully'
    });

  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to disable 2FA' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handleTwoFactorDisable);