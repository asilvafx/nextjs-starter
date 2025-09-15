// lib/crypt.js
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Encrypt password with salt
export async function encryptPassword(password, salt) {
    const hash = await scryptAsync(password.normalize(), salt, 64);
    return hash.toString('hex').normalize();
}

// Validate password
export async function validatePassword(password, salt, hashedPassword) {
    const inputHash = await scryptAsync(password.normalize(), salt, 64);
    const inputHashHex = inputHash.toString('hex').normalize();

    // Secure compare
    return timingSafeEqual(
        Buffer.from(inputHashHex, 'hex'),
        Buffer.from(hashedPassword, 'hex')
    );
}

// Generate salt
export function generateSalt(length = 16) {
    return randomBytes(length).toString('hex').normalize();
}
