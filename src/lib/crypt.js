// lib/crypt.js
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util'; 
import CryptoJS from 'crypto-js';
 
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
    return CryptoJS.AES.encrypt(JSON.stringify(password), process.env.NEXT_SECRET || 'your-super-secret-key', {
        format: CryptoJSAesJson
    }).toString();
};

export const decryptHash = (encryptedPassword) => {
    try {
        const decrypted = CryptoJS.AES.decrypt(encryptedPassword, process.env.NEXT_SECRET || 'your-super-secret-key', {
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
const scryptAsync = promisify(scrypt); 
 

// Encrypt password with salt
export async function encryptPassword(password, salt=null) {
    if (!salt) {
        salt = process.env.NEXT_SECRET;
    }
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
