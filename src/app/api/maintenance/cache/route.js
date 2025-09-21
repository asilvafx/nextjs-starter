// app/api/maintenance/cache/route.js
import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/server/auth.js';
import { revalidatePath, revalidateTag } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';

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

            case 'clear-temp':
                // Clear temporary files
                try {
                    const tempDir = path.join(process.cwd(), 'tmp');
                    try {
                        const files = await fs.readdir(tempDir);
                        let clearedFiles = 0;
                        
                        for (const file of files) {
                            const filePath = path.join(tempDir, file);
                            const stats = await fs.stat(filePath);
                            
                            // Only delete files older than 1 hour
                            const oneHourAgo = Date.now() - (60 * 60 * 1000);
                            if (stats.mtime.getTime() < oneHourAgo) {
                                await fs.unlink(filePath);
                                clearedFiles++;
                            }
                        }
                        
                        results.cleared.push(`Temporary files: ${clearedFiles} files removed`);
                    } catch (error) {
                        if (error.code !== 'ENOENT') {
                            results.errors.push(`Temp directory: ${error.message}`);
                        }
                    }
                } catch (error) {
                    results.errors.push(`Temp cleanup: ${error.message}`);
                }
                break;

            case 'clear-logs':
                // Clear old log files (if you have any)
                try {
                    const logsDir = path.join(process.cwd(), 'logs');
                    try {
                        const files = await fs.readdir(logsDir);
                        let clearedLogs = 0;
                        
                        for (const file of files) {
                            if (file.endsWith('.log')) {
                                const filePath = path.join(logsDir, file);
                                const stats = await fs.stat(filePath);
                                
                                // Only delete log files older than 7 days
                                const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
                                if (stats.mtime.getTime() < sevenDaysAgo) {
                                    await fs.unlink(filePath);
                                    clearedLogs++;
                                }
                            }
                        }
                        
                        results.cleared.push(`Log files: ${clearedLogs} files removed`);
                    } catch (error) {
                        if (error.code !== 'ENOENT') {
                            results.errors.push(`Logs directory: ${error.message}`);
                        }
                    }
                } catch (error) {
                    results.errors.push(`Log cleanup: ${error.message}`);
                }
                break;

            case 'clear-all':
                // Clear everything
                const allActions = ['revalidate-path', 'revalidate-tag', 'clear-temp', 'clear-logs'];
                for (const subAction of allActions) {
                    const subResponse = await handlePost({
                        json: () => Promise.resolve({ action: subAction })
                    });
                    
                    if (subResponse.ok) {
                        const subData = await subResponse.json();
                        if (subData.data) {
                            results.cleared.push(...subData.data.cleared);
                            results.errors.push(...subData.data.errors);
                        }
                    }
                }
                break;

            default:
                return NextResponse.json(
                    { error: 'Invalid action. Supported actions: revalidate-path, revalidate-tag, clear-temp, clear-logs, clear-all' },
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