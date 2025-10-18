// @/app/api/revalidate/route.js

import { revalidatePath, revalidateTag } from 'next/cache';
import { withAuth } from '@/lib/server/auth.js';

async function handler(request) {
    try {
        const { path, tag } = await request.json();

        if (!path && !tag) {
            return Response.json(
                { success: false, error: 'Path or tag is required' },
                { status: 400 }
            );
        }

        // Revalidate by path or tag
        if (path) {
            revalidatePath(path);
        }
        
        if (tag) {
            revalidateTag(tag);
        }

        return Response.json({
            success: true,
            message: `Revalidated ${path ? `path: ${path}` : ''}${path && tag ? ' and ' : ''}${tag ? `tag: ${tag}` : ''}`,
            revalidatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Revalidation error:', error);
        return Response.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// Only allow authenticated users to revalidate
export const POST = withAuth(handler);