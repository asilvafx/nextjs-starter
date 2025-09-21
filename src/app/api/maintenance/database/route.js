// app/api/maintenance/database/route.js
import { NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/server/auth.js';
import DBService from '@/data/rest.db.js';
import fs from 'fs/promises';
import path from 'path';

// Helper function to get request body safely
async function getRequestBody(request) {
    try {
        const contentType = request.headers.get('content-type');
        if (contentType?.includes('multipart/form-data')) {
            return await request.formData();
        }
        return await request.json();
    } catch (error) {
        console.error('Error parsing request body:', error);
        return null;
    }
}

// GET - Create database backup
async function handleGet(request) {
    try {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');

        if (action === 'backup') {
            // Create backup of all collections
            const backupData = {};
            
            // Get all available collections from the database
            // This depends on your DBService implementation
            // For now, let's backup common collections
            const collections = [
                'users', 'site_settings', 'store_settings', 
                'products', 'orders', 'categories', 'pages'
            ];

            for (const collection of collections) {
                try {
                    const data = await DBService.readAll(collection);
                    if (data && Object.keys(data).length > 0) {
                        backupData[collection] = data;
                    }
                } catch (error) {
                    console.warn(`Could not backup collection ${collection}:`, error.message);
                    // Continue with other collections
                }
            }

            // Create backup filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFilename = `backup_${timestamp}.json`;

            // Prepare backup metadata
            const backup = {
                metadata: {
                    created: new Date().toISOString(),
                    version: '1.0',
                    collections: Object.keys(backupData),
                    totalRecords: Object.values(backupData).reduce((total, collection) => {
                        return total + (Array.isArray(collection) ? collection.length : Object.keys(collection).length);
                    }, 0)
                },
                data: backupData
            };

            // Save backup to backups directory
            const backupsDir = path.join(process.cwd(), 'backups');
            try {
                await fs.mkdir(backupsDir, { recursive: true });
                const backupPath = path.join(backupsDir, backupFilename);
                await fs.writeFile(backupPath, JSON.stringify(backup, null, 2));
            } catch (error) {
                console.warn('Could not save backup file:', error);
                // Continue anyway - we'll return the backup data
            }

            return NextResponse.json({
                success: true,
                data: {
                    filename: backupFilename,
                    metadata: backup.metadata,
                    backup: backup // Include full backup for download
                },
                message: 'Database backup created successfully'
            });

        } else if (action === 'list') {
            // List available backups
            const backupsDir = path.join(process.cwd(), 'backups');
            let backups = [];

            try {
                await fs.mkdir(backupsDir, { recursive: true });
                const files = await fs.readdir(backupsDir);
                
                for (const file of files) {
                    if (file.endsWith('.json')) {
                        const filePath = path.join(backupsDir, file);
                        const stats = await fs.stat(filePath);
                        
                        try {
                            const content = await fs.readFile(filePath, 'utf8');
                            const backup = JSON.parse(content);
                            
                            backups.push({
                                filename: file,
                                size: stats.size,
                                created: backup.metadata?.created || stats.mtime.toISOString(),
                                collections: backup.metadata?.collections || [],
                                totalRecords: backup.metadata?.totalRecords || 0
                            });
                        } catch (error) {
                            // Skip invalid backup files
                            console.warn(`Invalid backup file ${file}:`, error);
                        }
                    }
                }
                
                // Sort by creation date (newest first)
                backups.sort((a, b) => new Date(b.created) - new Date(a.created));

            } catch (error) {
                console.error('Error listing backups:', error);
            }

            return NextResponse.json({
                success: true,
                data: backups
            });
        }

        return NextResponse.json(
            { error: 'Invalid action. Use ?action=backup or ?action=list' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Database backup error:', error);
        return NextResponse.json(
            {
                error: 'Failed to create database backup.',
                message: error.message
            },
            { status: 500 }
        );
    }
}

// POST - Restore database from backup
async function handlePost(request) {
    try {
        const data = await getRequestBody(request);
        
        if (!data || !data.filename) {
            return NextResponse.json(
                { error: 'Backup filename is required' },
                { status: 400 }
            );
        }

        const { filename } = data;
        const backupsDir = path.join(process.cwd(), 'backups');
        const backupPath = path.join(backupsDir, filename);

        // Read backup file
        let backup;
        try {
            const content = await fs.readFile(backupPath, 'utf8');
            backup = JSON.parse(content);
        } catch (error) {
            return NextResponse.json(
                { error: 'Backup file not found or invalid' },
                { status: 404 }
            );
        }

        if (!backup.data) {
            return NextResponse.json(
                { error: 'Invalid backup format' },
                { status: 400 }
            );
        }

        // Restore each collection
        const restoredCollections = [];
        const errors = [];

        for (const [collection, collectionData] of Object.entries(backup.data)) {
            try {
                // Clear existing data first (optional - you might want to make this configurable)
                // await DBService.clearCollection(collection);

                // Restore data
                if (Array.isArray(collectionData)) {
                    // Handle array format
                    for (const item of collectionData) {
                        await DBService.create(item, collection);
                    }
                } else if (typeof collectionData === 'object') {
                    // Handle object format
                    for (const [id, item] of Object.entries(collectionData)) {
                        await DBService.update(id, item, collection);
                    }
                }

                restoredCollections.push(collection);
            } catch (error) {
                console.error(`Error restoring collection ${collection}:`, error);
                errors.push(`${collection}: ${error.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                restoredCollections,
                errors: errors.length > 0 ? errors : null,
                metadata: backup.metadata
            },
            message: `Database restored successfully. ${restoredCollections.length} collections restored.`
        });

    } catch (error) {
        console.error('Database restore error:', error);
        return NextResponse.json(
            {
                error: 'Failed to restore database.',
                message: error.message
            },
            { status: 500 }
        );
    }
}

export const GET = withAdminAuth(handleGet);
export const POST = withAdminAuth(handlePost);