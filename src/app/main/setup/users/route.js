// app/main/setup/users/route.js
import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';

export async function GET() {
    try {
        // Check if users table exists and has data
        const users = await DBService.readAll('users');
        const userArray = Array.isArray(users) ? users : Object.values(users || {});
        const hasUsers = userArray.length > 0;

        return NextResponse.json({
            success: true,
            hasUsers,
            userCount: userArray.length,
            needsFirstUser: !hasUsers,
            message: hasUsers 
                ? `Found ${userArray.length} user(s) in database`
                : 'No users found. First admin user needs to be created.'
        });
    } catch (error) {
        console.error('Error checking users:', error);
        
        // If error is because table doesn't exist, that means no users
        if (error.message?.includes('does not exist') || error.message?.includes('not found')) {
            return NextResponse.json({
                success: true,
                hasUsers: false,
                userCount: 0,
                needsFirstUser: true,
                message: 'Users table is empty. First admin user needs to be created.'
            });
        }

        return NextResponse.json({
            success: false,
            error: 'Failed to check users table',
            message: error.message
        }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const userData = await request.json();
        
        // Validate required fields
        if (!userData.email || !userData.displayName || !userData.password) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields: email, displayName, password'
            }, { status: 400 });
        }

        // Check if users already exist
        try {
            const users = await DBService.readAll('users');
            const userArray = Array.isArray(users) ? users : Object.values(users || {});
            
            if (userArray.length > 0) {
                return NextResponse.json({
                    success: false,
                    error: 'Users already exist. Cannot create first user.'
                }, { status: 400 });
            }
        } catch (error) {
            // Table doesn't exist, proceed with user creation
            console.log('Users table will be created with first user');
        }

        // Create first admin user
        const newUser = {
            id: `user_${Date.now()}`,
            displayName: userData.displayName,
            email: userData.email,
            password: userData.password, // Should be hashed by the client
            phone: userData.phone || '',
            country: userData.country || '',
            role: 'admin',
            isAdmin: true,
            emailVerified: true,
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLogin: null
        };

        const result = await DBService.create(newUser, 'users');

        return NextResponse.json({
            success: true,
            data: {
                id: newUser.id,
                displayName: newUser.displayName,
                email: newUser.email,
                role: newUser.role,
                isAdmin: newUser.isAdmin
            },
            message: 'First admin user created successfully'
        });
    } catch (error) {
        console.error('Error creating first user:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to create first user',
            message: error.message
        }, { status: 500 });
    }
}