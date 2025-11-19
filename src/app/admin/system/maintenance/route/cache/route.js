// app/admin/system/maintenance/route/cache/route.js

import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/server/auth.js';
import { clearSettingsCache } from '@/lib/server/admin.js';

async function handlePost(request) {
    try {
        const { action, paths, tags } = await request.json();

        const results = {
            cleared: [],
            errors: []
        };

        switch (action) {
            case 'revalidate-path':
                if (paths && Array.isArray(paths)) {
                    for (const pathToRevalidate of paths) {
                        try {
                            revalidatePath(pathToRevalidate);
                            results.cleared.push(`Path: ${pathToRevalidate}`);
                        } catch (error) {
                            results.errors.push(`Path ${pathToRevalidate}: ${error.message}`);
                        }
                    }
                } else {
                    // Revalidate common paths
                    const commonPaths = ['/', '/admin', '/admin/dashboard', '/shop'];
                    for (const pathToRevalidate of commonPaths) {
                        try {
                            revalidatePath(pathToRevalidate);
                            results.cleared.push(`Path: ${pathToRevalidate}`);
                        } catch (error) {
                            results.errors.push(`Path ${pathToRevalidate}: ${error.message}`);
                        }
                    }
                }
                break;

            case 'revalidate-tag':
                if (tags && Array.isArray(tags)) {
                    for (const tag of tags) {
                        try {
                            revalidateTag(tag);
                            results.cleared.push(`Tag: ${tag}`);
                        } catch (error) {
                            results.errors.push(`Tag ${tag}: ${error.message}`);
                        }
                    }
                } else {
                    // Revalidate common tags
                    const commonTags = ['products', 'categories', 'settings', 'users'];
                    for (const tag of commonTags) {
                        try {
                            revalidateTag(tag);
                            results.cleared.push(`Tag: ${tag}`);
                        } catch (error) {
                            results.errors.push(`Tag ${tag}: ${error.message}`);
                        }
                    }
                }
                break;

            case 'clear-settings-cache':
                try {
                    await clearSettingsCache();
                    results.cleared.push('Settings cache cleared (site_settings and store_settings)');
                } catch (error) {
                    results.errors.push(`Settings cache: ${error.message}`);
                }
                break;

            default:
                return NextResponse.json(
                    {
                        error: 'Invalid action. Supported actions: revalidate-path, revalidate-tag, clear-settings-cache'
                    },
                    { status: 400 }
                );
        }

        return NextResponse.json({
            success: true,
            data: results,
            message: `Cache clearing completed. ${results.cleared.length} operations successful, ${results.errors.length} errors.`
        });
    } catch (error) {
        console.error('Cache clear error:', error);
        return NextResponse.json(
            {
                error: 'Failed to clear cache.',
                message: error.message
            },
            { status: 500 }
        );
    }
}

export const POST = withAdminAuth(handlePost);
