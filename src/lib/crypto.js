// lib/crypto.js
import CryptoJS from 'crypto-js';

const publicKey = process.env.NEXT_PUBLIC_KEY || 'your-default-public-key';

const CryptoJSAesJson = {
    stringify: function (cipherParams) {
        try {
            const j = {ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64)};
            if (cipherParams.iv) j.iv = cipherParams.iv.toString();
            if (cipherParams.salt) j.s = cipherParams.salt.toString();
            return JSON.stringify(j);
        } catch (error) {
            return null;
        }
    },
    parse: function (jsonStr) {
        try {
            if (!isValidJson(jsonStr)) return null;
            const j = JSON.parse(jsonStr);
            const cipherParams = CryptoJS.lib.CipherParams.create({
                ciphertext: CryptoJS.enc.Base64.parse(j.ct)
            });
            if (j.iv) cipherParams.iv = CryptoJS.enc.Hex.parse(j.iv);
            if (j.s) cipherParams.salt = CryptoJS.enc.Hex.parse(j.s);
            return cipherParams;
        } catch (error) {
            return null;
        }
    }
};

function isValidJson(str) {
    if (typeof str !== "string") return false;
    try {
        JSON.parse(str);
        return true;
    } catch {
        return false;
    }
}

export const encryptHash = (password) => {
    return CryptoJS.AES.encrypt(JSON.stringify(password), publicKey, {
        format: CryptoJSAesJson
    }).toString();
};

export const decryptHash = (encryptedPassword) => {
    try {
        const decrypted = CryptoJS.AES.decrypt(encryptedPassword, publicKey, {
            format: CryptoJSAesJson
        }).toString(CryptoJS.enc.Utf8);

        if (!decrypted) {
            throw new Error('Decryption failed');
        }

        return JSON.parse(decrypted);
    } catch (error) {
        throw new Error('Decryption error: ' + error);
    }
};

// Helper function to convert string to Uint8Array
function stringToUint8Array(str) {
    return new TextEncoder().encode(str);
}

// Helper function to convert Uint8Array to hex string
function uint8ArrayToHex(arr) {
    return Array.from(arr, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Helper function to convert hex string to Uint8Array
function hexToUint8Array(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
}

// Web Crypto API compatible scrypt implementation using PBKDF2 as fallback
export async function encryptPassword(password, salt) {
    try {
        // Use Web Crypto API PBKDF2 as it's available in Edge Runtime
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password.normalize());
        const saltBuffer = encoder.encode(salt);

        // Import the password as a key
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            { name: 'PBKDF2' },
            false,
            ['deriveBits']
        );

        // Derive 64 bytes (512 bits) using PBKDF2
        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: saltBuffer,
                iterations: 100000, // Higher iterations for security
                hash: 'SHA-256'
            },
            keyMaterial,
            512 // 64 bytes * 8 bits
        );

        const hashArray = new Uint8Array(derivedBits);
        return uint8ArrayToHex(hashArray).normalize();
    } catch (error) {
        throw new Error('Password encryption failed: ' + error.message);
    }
}

export async function validatePassword(password, salt, hashedPassword) {
    try {
        const inputHashedPassword = await encryptPassword(password, salt);

        // Timing-safe comparison
        return timingSafeEqual(inputHashedPassword, hashedPassword);
    } catch (error) {
        throw new Error('Password validation failed: ' + error.message);
    }
}

// Timing-safe comparison function
function timingSafeEqual(a, b) {
    if (a.length !== b.length) {
        return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
}

export function generateSalt() {
    // Use Web Crypto API for random bytes generation
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    return uint8ArrayToHex(randomBytes).normalize();
}
