// app/api/shop/collections/route.js
import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';
import { withAuth, withAdminAuth } from '@/lib/auth.js';

// GET all collections
async function getCollectionsHandler(request) {
    try {
        const response = await DBService.readAll("collections");
 
        return NextResponse.json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error('Get collections error:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve collections.' },
            { status: 500 }
        );
    }
}

// POST/PUT collections (save entire collections array)
async function saveCollectionsHandler(request) {
    try {
        const collections = await request.json();

        // Validate that it's an array
        if (!Array.isArray(collections)) {
            console.log('Expected an array of collections');
            return NextResponse.json(
                { error: 'Expected an array of collections' },
                { status: 400 }
            );
        }

        // Save collections
        await DBService.create(collections, "collections");

        return NextResponse.json({
            success: true,
            data: collections,
            message: 'Collections saved successfully'
        });

    } catch (error) {
        console.error('Save collections error:', error);
        return NextResponse.json(
            { error: 'Failed to save collections.' },
            { status: 500 }
        );
    }
}

// Export handlers with appropriate middleware
export const GET = withAuth(getCollectionsHandler);
export const POST = withAdminAuth(saveCollectionsHandler);
export const PUT = withAdminAuth(saveCollectionsHandler);
