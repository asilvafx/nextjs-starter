// app/auth/api/handler/route.js
import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';
import EmailService from '@/lib/email';
import { createWallet, loadConfig } from '@/lib/web3';

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

        // Call crypto API for password validation
        const cryptoResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/crypto`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'validate',
                password: passwordHash,
                salt: user.salt,
                hashedPassword: user.password
            })
        });

        const cryptoResult = await cryptoResponse.json();
        if (!cryptoResult.isValid) {
            throw new Error('Invalid credentials.');
        }

        let userLoginData = { ...user, client };

        try {
            const web3load = await loadConfig;
            if (web3load?.WEB3_ACTIVE > 0) {
                const web3user = user.web3_pk || user.web3 || null;
                if (!web3user) {
                    // Generate salt for web3
                    const saltResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/crypto`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ action: 'generateSalt' })
                    });
                    const saltResult = await saltResponse.json();
                    const salt = saltResult.salt;

                    const web3create = await createWallet();
                    if (web3create?.web3?.address && web3create?.web3?.privateKey) {
                        // Encrypt web3 private key
                        const encryptResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/crypto`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                action: 'encrypt',
                                password: web3create.web3.privateKey,
                                salt: salt
                            })
                        });
                        const encryptResult = await encryptResponse.json();

                        const web3data = {
                            salt: salt,
                            public_key: web3create.web3.address,
                            private_key: encryptResult.hash
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
        const saltResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/crypto`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'generateSalt' })
        });
        const saltResult = await saltResponse.json();
        const salt = saltResult.salt;

        // Encrypt password via crypto API
        const encryptResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/crypto`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'encrypt',
                password: passwordHash,
                salt: salt
            })
        });
        const encryptResult = await encryptResponse.json();
        const encryptedPassword = encryptResult.hash;

        const timeNow = new Date().toISOString();

        let userRegisterData = {
            displayName: name,
            email: email,
            password: encryptedPassword,
            salt: salt,
            role: 'user',
            created_at: timeNow
        };

        try {
            const web3load = await loadConfig;
            if (web3load?.WEB3_ACTIVE > 0) {
                // Generate salt for web3
                const web3SaltResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/crypto`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ action: 'generateSalt' })
                });
                const web3SaltResult = await web3SaltResponse.json();
                const web3Salt = web3SaltResult.salt;

                const web3create = await createWallet();
                if (web3create?.web3?.address && web3create?.web3?.privateKey) {
                    // Encrypt web3 private key
                    const web3EncryptResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/crypto`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            action: 'encrypt',
                            password: web3create.web3.privateKey,
                            salt: web3Salt
                        })
                    });
                    const web3EncryptResult = await web3EncryptResponse.json();

                    const web3data = {
                        salt: web3Salt,
                        public_key: web3create.web3.address,
                        private_key: web3EncryptResult.hash
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
            id: userWithoutPassword.id || email,
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

