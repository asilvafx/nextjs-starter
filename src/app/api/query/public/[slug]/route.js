// app/api/query/public/[slug]/route.js
import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';
import { withPublicAccess } from '@/lib/server/auth.js';

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

// Check if API is enabled
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

// Track API usage if API key is provided
async function trackApiUsage(request) {
    try {
        const url = new URL(request.url);
        const authHeader = request.headers.get('authorization');
        const apiKeyFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
        const apiKeyFromQuery = url.searchParams.get('api_key');
        const apiKey = apiKeyFromHeader || apiKeyFromQuery;
        
        if (apiKey) {
            // Log API usage for analytics (could be stored in a separate analytics collection)
            console.log(`API Key used: ${apiKey.substring(0, 8)}... for ${request.method} ${url.pathname}`);
            
            // Optional: Store usage statistics in a separate analytics collection
            try {
                await DBService.create({
                    apiKey: apiKey.substring(0, 8) + '...',
                    method: request.method,
                    endpoint: url.pathname,
                    timestamp: new Date().toISOString(),
                    userAgent: request.headers.get('user-agent') || 'unknown'
                }, 'api_usage_logs');
            } catch (logError) {
                // Ignore logging errors to not affect the main request
                console.error('Failed to log API usage:', logError);
            }
        }
    } catch (error) {
        console.error('Error tracking API usage:', error);
        // Don't fail the request if tracking fails
    }
}

// GET all items or single item - public access with CSRF protection
async function handlePublicGet(request, { params }) {
    try {
        // Check if API access is allowed
        const accessCheck = await checkApiAccess(request);
        if (!accessCheck.allowed) {
            return NextResponse.json(
                { error: accessCheck.error || 'API access denied' },
                { status: accessCheck.status || 403 }
            );
        }
        
        // Track API usage if API key provided
        await trackApiUsage(request);
        
        const { slug } = await params;
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        const key = url.searchParams.get('key');
        const value = url.searchParams.get('value');
        const page = parseInt(url.searchParams.get('page')) || 1;
        const limit = Math.min(parseInt(url.searchParams.get('limit')) || 10, 100); // Max 100 items
        const search = url.searchParams.get('search');

        if (!slug) {
            return NextResponse.json(
                { error: 'Collection name is required' },
                { status: 400 }
            );
        }

        let result;

        // Get single item by ID
        if (id) {
            result = await DBService.read(id, slug);
            if (!result) {
                return NextResponse.json(
                    { error: 'Record not found' },
                    { status: 404 }
                );
            }
            return NextResponse.json({
                success: true,
                data: result
            });
        }
        // Get items by key-value pair
        else if (key && value) {
            result = await DBService.getItemsByKeyValue(key, value, slug);
            if (!result || Object.keys(result).length === 0) {
                return NextResponse.json(
                    { error: 'No records found' },
                    { status: 404 }
                );
            }
        }
        // Get all items
        else {
            result = await DBService.readAll(slug);
            if (!result) {
                return NextResponse.json({
                    success: true,
                    data: [],
                    pagination: {
                        currentPage: page,
                        totalItems: 0,
                        totalPages: 0,
                        hasNext: false,
                        hasPrev: false
                    }
                });
            }
        }

        // Convert result to array format for pagination and search
        let items = [];
        if (Array.isArray(result)) {
            items = result;
        } else if (typeof result === 'object' && result !== null) {
            // Handle object format where keys are IDs and values are items
            items = Object.entries(result).map(([id, item]) => ({
                id,
                ...item
            }));
        }

        // Search functionality
        if (search && items.length > 0) {
            const searchTerm = search.toLowerCase();
            items = items.filter(item => {
                if (!item) return false;

                const searchableFields = [
                    item.name, item.title, item.description,
                    item.category, item.email, item.displayName
                ];

                return searchableFields.some(field =>
                    field && typeof field === 'string' &&
                    field.toLowerCase().includes(searchTerm)
                );
            });
        }

        // Sort by created date (newest first)
        if (items.length > 0) {
            items.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                return dateB - dateA;
            });
        }

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedItems = items.slice(startIndex, endIndex);

        return NextResponse.json({
            success: true,
            data: paginatedItems,
            pagination: {
                currentPage: page,
                totalItems: items.length,
                totalPages: Math.ceil(items.length / limit),
                hasNext: endIndex < items.length,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Public get data error:', error);
        return NextResponse.json(
            {
                error: 'Failed to retrieve data.',
                message: error.message
            },
            { status: 500 }
        );
    }
}

// POST create new item - public access with CSRF protection
async function handlePublicPost(request, { params }) {
    try {
        // Check if API access is allowed
        const accessCheck = await checkApiAccess(request);
        if (!accessCheck.allowed) {
            return NextResponse.json(
                { error: accessCheck.error || 'API access denied' },
                { status: accessCheck.status || 403 }
            );
        }
        
        // Track API usage if API key provided
        await trackApiUsage(request);
        
        const { slug } = await params;
        const data = await getRequestBody(request);

        if (!slug) {
            return NextResponse.json(
                { error: 'Collection name is required' },
                { status: 400 }
            );
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Request body is required' },
                { status: 400 }
            );
        }

        // Add metadata - use user info if available (from optional auth)
        const createData = {
            ...data,
            createdAt: new Date().toISOString(),
            createdBy: request.user?.id || 'anonymous',
            updatedAt: new Date().toISOString(),
            updatedBy: request.user?.id || 'anonymous'
        };

        const newItem = await DBService.create(createData, slug);

        if (!newItem) {
            return NextResponse.json(
                { error: 'Failed to create record.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                id: newItem.id || newItem.key || Date.now().toString(),
                ...createData
            },
            message: 'Record created successfully!'
        }, { status: 201 });

    } catch (error) {
        console.error('Public create data error:', error);
        return NextResponse.json(
            {
                error: 'Failed to create record.',
                message: error.message
            },
            { status: 500 }
        );
    }
}

// PUT update item - public access with CSRF protection
async function handlePublicPut(request, { params }) {
    try {
        // Check if API access is allowed
        const accessCheck = await checkApiAccess(request);
        if (!accessCheck.allowed) {
            return NextResponse.json(
                { error: accessCheck.error || 'API access denied' },
                { status: accessCheck.status || 403 }
            );
        }
        
        // Track API usage if API key provided
        await trackApiUsage(request);
        
        const { slug } = await params;
        const data = await getRequestBody(request);

        if (!slug) {
            return NextResponse.json(
                { error: 'Collection name is required' },
                { status: 400 }
            );
        }

        if (!data || !data.id) {
            return NextResponse.json(
                { error: 'Request body with id is required' },
                { status: 400 }
            );
        }

        // Check if item exists
        const existingItem = await DBService.read(data.id, slug);
        if (!existingItem) {
            return NextResponse.json(
                { error: 'Record not found' },
                { status: 404 }
            );
        }

        // Prepare update data
        const { id, ...updateFields } = data;
        const updateData = {
            ...existingItem,
            ...updateFields,
            updatedAt: new Date().toISOString(),
            updatedBy: request.user?.id || 'anonymous'
        };

        const updatedItem = await DBService.update(id, updateData, slug);

        if (!updatedItem) {
            return NextResponse.json(
                { error: 'Failed to update record.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: { id, ...updateData },
            message: 'Record updated successfully!'
        });

    } catch (error) {
        console.error('Public update data error:', error);
        return NextResponse.json(
            {
                error: 'Failed to update record.',
                message: error.message
            },
            { status: 500 }
        );
    }
}

// DELETE item - public access with CSRF protection
async function handlePublicDelete(request, { params }) {
    try {
        // Check if API access is allowed
        const accessCheck = await checkApiAccess(request);
        if (!accessCheck.allowed) {
            return NextResponse.json(
                { error: accessCheck.error || 'API access denied' },
                { status: accessCheck.status || 403 }
            );
        }
        
        // Track API usage if API key provided
        await trackApiUsage(request);
        
        const { slug } = await params;
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!slug) {
            return NextResponse.json(
                { error: 'Collection name is required' },
                { status: 400 }
            );
        }

        if (!id) {
            return NextResponse.json(
                { error: 'Record ID is required' },
                { status: 400 }
            );
        }

        // Check if item exists
        const existingItem = await DBService.read(id, slug);
        if (!existingItem) {
            return NextResponse.json(
                { error: 'Record not found' },
                { status: 404 }
            );
        }

        const deleted = await DBService.delete(id, slug);

        if (!deleted) {
            return NextResponse.json(
                { error: 'Failed to delete record.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Record deleted successfully!',
            data: { id }
        });

    } catch (error) {
        console.error('Public delete record error:', error);
        return NextResponse.json(
            {
                error: 'Failed to delete record.',
                message: error.message
            },
            { status: 500 }
        );
    }
}

// Export handlers with secure public access middleware (API key tracking integrated)
export const GET = withPublicAccess(handlePublicGet, {
    requireApiKey: false,
    requireIpWhitelist: false,
    skipCsrfForApiKey: true,
    requiredPermission: null,
    logAccess: true
});

export const POST = withPublicAccess(handlePublicPost, {
    requireApiKey: false,
    requireIpWhitelist: false,
    skipCsrfForApiKey: true,
    requiredPermission: null,
    logAccess: true
});

export const PUT = withPublicAccess(handlePublicPut, {
    requireApiKey: false,
    requireIpWhitelist: false,
    skipCsrfForApiKey: true,
    requiredPermission: null,
    logAccess: true
});

export const DELETE = withPublicAccess(handlePublicDelete, {
    requireApiKey: false,
    requireIpWhitelist: false,
    skipCsrfForApiKey: true,
    requiredPermission: null,
    logAccess: true
});
