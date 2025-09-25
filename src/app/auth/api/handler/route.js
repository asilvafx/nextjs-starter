// app/auth/api/handler/route.js
import { NextResponse } from 'next/server';

import DBService from '@/data/rest.db.js';
import { encryptPassword, generateSalt, validatePassword } from '@/lib/server/crypt';
import EmailService from '@/lib/server/email';
import { createWallet, loadWeb3Config, clearWeb3ConfigCache } from '@/lib/server/web3';
import { v6 as uuidv6 } from 'uuid';

// Force Node.js runtime
export const runtime = 'nodejs';

export async function POST(request) {
    try {
        const { email, password, client, action, name } = await request.json();

        if (action === 'register') {
            return await handleRegistration(email, password, { name, client });
        } else {
            return await handleLogin(email, password, { client });
        }
    } catch (error) {
        console.error('Auth handler error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

async function handleLogin(email, passwordHash, { client }) {
    try {
        const user = await DBService.readBy("email", email, "users");

        if (!user) {
            throw new Error('Invalid credentials.');
        }

        const cryptoResult = await validatePassword(passwordHash, user.salt, user.password);

        if (!cryptoResult) {
            throw new Error('Invalid credentials.');
        }

        let userLoginData = { ...user, client };

        try {
            const web3load = await loadWeb3Config;
            if (web3load?.WEB3_ACTIVE > 0) {
                const web3user = user.web3_pk || user.web3 || null;
                if (!web3user) {
                    // Generate salt for web3
                    const salt = await generateSalt();

                    const web3create = await createWallet();
                    if (web3create?.address && web3create?.privateKey) {
                        // Encrypt web3 private key

                        const encryptResult = await encryptPassword(web3create.privateKey, salt);

                        const web3data = {
                            salt: salt,
                            public_key: web3create.address,
                            private_key: encryptResult
                        };
                        userLoginData = { ...userLoginData, web3: web3data };
                        const userId = await DBService.getItemKey('email', user.email, 'users');
                        await DBService.update(userId, {web3: web3data}, 'users');
                    }
                }
            }
        } catch (web3Error) {
            console.error('Web3 setup error:', web3Error);
        }

        const { salt: _salt, password: _password, ...userWithoutPassword } = userLoginData;

        const userData = {
            id: userWithoutPassword.id || userWithoutPassword.email,
            email: userWithoutPassword.email,
            displayName: userWithoutPassword.displayName,
            role: userWithoutPassword.role || 'user',
            client: client,
            web3: userWithoutPassword.web3,
            created_at: userWithoutPassword.created_at
        };

        return NextResponse.json(userData);
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

async function handleRegistration(email, passwordHash, { name, client }) {
    try {
        if (!name) {
            throw new Error('Name is required for registration.');
        }

        const passwordValid = (pwd) => {
            return (
                pwd.length >= 8 &&
                pwd.length <= 32 &&
                /[a-z]/.test(pwd) &&
                /[A-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)
            );
        };

        if (!passwordValid(passwordHash)) {
            throw new Error('Password must be at least 8 characters with lowercase and one uppercase or number.');
        }

        const existingUser = await DBService.readBy("email", email, "users");

        if (existingUser) {
            return NextResponse.json(
                { error: 'Email already registered.' },
                { status: 400 }
            );
            //throw new Error('Email already registered.');
        }

        // Generate salt via crypto API
        const salt = await generateSalt();

        // Encrypt password via crypto API
        const encryptedPassword = await encryptPassword(passwordHash, salt);

        const timeNow = new Date().toISOString();

        const uid = uuidv6();

        let userRegisterData = { 
            uid: uid,
            displayName: name,
            email: email,
            password: encryptedPassword,
            salt: salt,
            role: 'user',
            created_at: timeNow
        };

        try {
            const web3load = await loadWeb3Config();
            if (web3load?.WEB3_ACTIVE) {
                // Generate salt for web3
                const web3Salt = await generateSalt();

                const web3create = await createWallet();
                if (web3create?.address && web3create?.privateKey) {
                    // Encrypt web3 private key
                    const web3EncryptResult = await encryptPassword(web3create.privateKey, web3Salt);

                    const web3data = {
                        salt: web3Salt,
                        public_key: web3create.address,
                        private_key: web3EncryptResult
                    };
                    userRegisterData = { ...userRegisterData, web3: web3data };
                }
            }
        } catch (web3Error) {
            console.error('Web3 setup error:', web3Error);
        }

        await DBService.create(userRegisterData, "users");

        // Send welcome email
        try {
            await EmailService.sendWelcomeEmail(email, name);

        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
        }

        const { salt: _salt, password: _password, ...userWithoutPassword } = userRegisterData;

        const userData = {
            uid: userWithoutPassword.uid,
            email: userWithoutPassword.email,
            displayName: userWithoutPassword.displayName,
            role: userWithoutPassword.role || 'user',
            client: client,
            web3: userWithoutPassword.web3,
            created_at: userWithoutPassword.created_at
        };

        return NextResponse.json(userData);
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}
