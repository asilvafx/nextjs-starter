// app/api/auth/change-password/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import DBService from '@/data/rest.db.js';
import { withAuth } from '@/lib/server/auth';

async function handlePasswordChange(request, context) {
  try {
    const user = request.user;
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Get user from database
    const userData = await DBService.read(user.id, 'users');
    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, userData.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    const updateData = {
      ...userData,
      password: hashedNewPassword,
      passwordUpdatedAt: new Date().toISOString()
    };

    const result = await DBService.update(user.id, updateData, 'users');

    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Failed to update password' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handlePasswordChange);