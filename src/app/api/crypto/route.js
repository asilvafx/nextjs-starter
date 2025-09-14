// app/api/crypto/route.js
import { NextResponse } from 'next/server';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

// Force Node.js runtime
export const runtime = 'nodejs';

const scryptAsync = promisify(scrypt);

export async function POST(request) {
    try {
        const { action, password, salt, hashedPassword } = await request.json();

        switch (action) {
            case 'encrypt':
                if (!password || !salt) {
                    return NextResponse.json({ error: 'Password and salt required' }, { status: 400 });
                }
                const hash = await scryptAsync(password.normalize(), salt, 64);
                return NextResponse.json({ hash: hash.toString("hex").normalize() });

            case 'validate':
                if (!password || !salt || !hashedPassword) {
                    return NextResponse.json({ error: 'Password, salt, and hashedPassword required' }, { status: 400 });
                }
                const inputHash = await scryptAsync(password.normalize(), salt, 64);
                const inputHashHex = inputHash.toString("hex").normalize();
                const isValid = timingSafeEqual(
                    Buffer.from(inputHashHex, "hex"),
                    Buffer.from(hashedPassword, "hex")
                );
                return NextResponse.json({ isValid });

            case 'generateSalt':
                const newSalt = randomBytes(16).toString("hex").normalize();
                return NextResponse.json({ salt: newSalt });

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Crypto API error:', error);
        return NextResponse.json({ error: 'Crypto operation failed' }, { status: 500 });
    }
}
