// app/api/query/route.js
import { NextResponse } from 'next/server';

// POST handler for file uploads
async function Query(request) {
    return NextResponse.json(
        { error: 'Invalid request!' },
        { status: 500 }
    );
}

// Export with authentication
export const POST = Query;
export const GET = Query;
export const PUT = Query;
export const DELETE = Query;
