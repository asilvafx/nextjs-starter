// app/api/upload/route.js
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/auth.js';
import DBService from '@/data/rest.db.js';

// Check if API is enabled (same function as in public query routes)
async function checkApiAccess(request) {
    try {
        // Get API settings from database
        const apiSettingsResponse = await DBService.readAll('api_settings');
        const apiSettings = Object.values(apiSettingsResponse || {})[0];
        
        // If no settings exist, allow access (fail open)
        if (!apiSettings) {
            return { allowed: true };
        }
        
        // Check if API is disabled
        if (!apiSettings.apiEnabled) {
            return { 
                allowed: false, 
                error: 'API access is currently disabled',
                status: 503 
            };
        }
        
        // Check allowed origins if configured
        const origin = request.headers.get('origin');
        const allowedOrigins = apiSettings.allowedOrigins || ['*'];
        
        if (!allowedOrigins.includes('*') && origin && !allowedOrigins.includes(origin)) {
            return { 
                allowed: false, 
                error: 'Origin not allowed',
                status: 403 
            };
        }
        
        return { allowed: true, settings: apiSettings };
        
    } catch (error) {
        console.error('Error checking API access:', error);
        // Fail open - allow access if we can't check settings
        return { allowed: true };
    }
}

// POST handler for file uploads with inline authentication
export async function POST(request) {
    try {
        // Check if API access is allowed
        const accessCheck = await checkApiAccess(request);
        if (!accessCheck.allowed) {
            return NextResponse.json(
                { error: accessCheck.error || 'API access denied' },
                { status: accessCheck.status || 403 }
            );
        }

        // Authentication check
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const files = formData.getAll('files');

        if (!files || files.length === 0) {
            return NextResponse.json(
                { error: 'No files provided' },
                { status: 400 }
            );
        }

        const uploadedFiles = [];
        const maxFileSize = 10 * 1024 * 1024; // 10MB limit
        const blockedExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar', '.sh'];
        const suspiciousMimeTypes = ['application/x-executable', 'application/x-msdownload', 'application/x-msdos-program'];

        for (const file of files) {
            // Validation
            if (!file.name) {
                continue; // Skip empty files
            }

            if (file.size > maxFileSize) {
                return NextResponse.json(
                    { error: `File ${file.name} is too large. Maximum size is 10MB.` },
                    { status: 400 }
                );
            }

            // Security checks
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
            if (blockedExtensions.includes(fileExtension)) {
                return NextResponse.json(
                    { error: `File type ${fileExtension} is not allowed for security reasons.` },
                    { status: 400 }
                );
            }

            if (suspiciousMimeTypes.includes(file.type)) {
                return NextResponse.json(
                    { error: `File type ${file.type} is not allowed for security reasons.` },
                    { status: 400 }
                );
            }

            try {
                // Generate unique filename with original extension
                const fileExtension = file.name.split('.').pop();
                const uniqueFilename = `${uuidv4()}.${fileExtension}`;
                const uploadPath = `uploads/${uniqueFilename}`;

                // Convert file to buffer for dbService.upload
                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);

                // Create a File-like object for dbService.upload
                const fileForUpload = {
                    buffer: buffer,
                    originalname: file.name,
                    mimetype: file.type,
                    size: file.size,
                    filename: uniqueFilename
                };

                // Upload using dbService
                const uploadResult = await DBService.upload(fileForUpload, uploadPath);

                if (!uploadResult) {
                    throw new Error(`Failed to upload ${file.name}`);
                }

                // Create response object with uploaded file info
                uploadedFiles.push({
                    id: uuidv4(),
                    filename: uniqueFilename,
                    originalName: file.name,
                    url: uploadResult.url || uploadResult.publicUrl || `/uploads/${uniqueFilename}`,
                    size: file.size,
                    type: file.type,
                    uploadedAt: new Date().toISOString(),
                    uploadPath: uploadPath,
                    uploadedBy: session.user.id,
                    ...uploadResult // Include any additional data from dbService
                });

            } catch (fileError) {
                console.error(`Error uploading file ${file.name}:`, fileError);
                return NextResponse.json(
                    { error: `Failed to upload ${file.name}: ${fileError.message}` },
                    { status: 500 }
                );
            }
        }

        // Log successful upload
        console.log(`Successfully uploaded ${uploadedFiles.length} file(s) for user:`, session.user?.email || 'Unknown');

        return NextResponse.json({
            success: true,
            data: uploadedFiles,
            message: `${uploadedFiles.length} file(s) uploaded successfully`
        });

    } catch (error) {
        console.error('Upload handler error:', error);
        return NextResponse.json(
            {
                error: 'Failed to upload files',
                details: error.message
            },
            { status: 500 }
        );
    }
}
