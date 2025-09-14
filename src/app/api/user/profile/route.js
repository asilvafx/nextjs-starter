// app/api/user/profile/route.js - Example protected route
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import DBService from '@/data/rest.db.js'

export async function GET() {
    try {
        const session = await auth()

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const user = await DBService.readBy("email", session.user.email, "users")

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Remove sensitive data
        const { salt, password, ...userWithoutPassword } = user

        return NextResponse.json({
            success: true,
            user: userWithoutPassword
        })
    } catch (error) {
        console.error('Profile fetch error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch profile' },
            { status: 500 }
        )
    }
}

export async function PUT(request) {
    try {
        const session = await auth()

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { displayName } = await request.json()

        const userId = await DBService.getItemKey('email', session.user.email, 'users')
        await DBService.update(userId, { displayName }, 'users')

        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully'
        })
    } catch (error) {
        console.error('Profile update error:', error)
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        )
    }
}
