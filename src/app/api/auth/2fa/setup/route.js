// app/api/auth/2fa/setup/route.js
import { NextResponse } from 'next/server';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import DBService from '@/data/rest.db.js';
import { withAuth } from '@/lib/server/auth';

async function handleTwoFactorSetup(request, context) {
  try {
    const user = request.user;

    // Generate a secret for the user
    const secret = authenticator.generateSecret();
    
    // Create the service name and account name for the QR code
    const serviceName = process.env.NEXT_PUBLIC_APP_NAME || 'Your App';
    const accountName = user.email;
    
    // Generate the otpauth URL
    const otpauthUrl = authenticator.keyuri(accountName, serviceName, secret);
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    
    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 8; i++) {
      backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }

    // Store the temporary secret and backup codes in the user's record
    // Don't enable 2FA yet - wait for verification
    const userData = await DBService.read(user.id, 'users');
    const updateData = {
      ...userData,
      twoFactorSecret: secret, // Temporary storage
      twoFactorBackupCodes: backupCodes,
      twoFactorEnabled: false // Not enabled until verified
    };

    await DBService.update(user.id, updateData, 'users');

    return NextResponse.json({
      success: true,
      qrCode: qrCodeDataUrl,
      backupCodes: backupCodes,
      message: '2FA setup initiated. Please scan the QR code and verify.'
    });

  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to setup 2FA' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handleTwoFactorSetup);