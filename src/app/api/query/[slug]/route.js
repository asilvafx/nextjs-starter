// app/api/query/[slug]/route.js
import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';
import { withAdminAuth, withAuth } from '@/lib/server/auth.js';

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

// GET all items or single item - accessible to all authenticated users
async function handleGet(request, { params }) {
    try {
        const { slug } = await params;
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        const key = url.searchParams.get('key');
        const value = url.searchParams.get('value');
        const page = parseInt(url.searchParams.get('page'), 10) || 1;
        const limit = Math.min(parseInt(url.searchParams.get('limit'), 10) || 10, 100); // Max 100 items
        const search = url.searchParams.get('search');

        if (!slug) {
            return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
        }

        let result;

        // Get single item by ID
        if (id) {
            result = await DBService.read(id, slug);
            if (!result) {
                result = await DBService.getItemsByKeyValue('id', id, slug);
                if (!result) {
                    return NextResponse.json({
                        success: false,
                        error: 'Record not found'
                    });
                }
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
                return NextResponse.json({ error: 'No records found' }, { status: 404 });
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
            items = items.filter((item) => {
                if (!item) return false;

                const searchableFields = [
                    item.name,
                    item.title,
                    item.description,
                    item.category,
                    item.email,
                    item.displayName
                ];

                return searchableFields.some(
                    (field) => field && typeof field === 'string' && field.toLowerCase().includes(searchTerm)
                );
            });
        }

        // Sort by created date (newest first) - only if items exist
        if (items.length > 0) {
            items.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                return dateB - dateA;
            });
        }

        // Pagination
        let paginatedItems = items;
        let startIndex = 1;
        let endIndex = startIndex;
        if (limit > 0) {
            startIndex = (page - 1) * limit;
            endIndex = startIndex + limit;
            paginatedItems = items.slice(startIndex, endIndex);
        }

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
        console.error('Get data error:', error);
        return NextResponse.json(
            {
                error: 'Failed to retrieve data.',
                message: error.message
            },
            { status: 500 }
        );
    }
}

// POST create new item - accessible to all authenticated users
async function handlePost(request, { params }) {
    try {
        const { slug } = await params;
        const data = await getRequestBody(request);

        if (!slug) {
            return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
        }

        if (!data) {
            return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
        }

        // Add metadata
        const createData = {
            ...data,
            createdAt: new Date().toISOString(),
            createdBy: request.user?.id || 'unknown',
            updatedAt: new Date().toISOString(),
            updatedBy: request.user?.id || 'unknown'
        };

        const newItem = await DBService.create(createData, slug);

        if (!newItem) {
            return NextResponse.json({ error: 'Failed to create record.' }, { status: 500 });
        }

        return NextResponse.json(
            {
                success: true,
                data: {
                    id: newItem.id || newItem.key || Date.now().toString(),
                    ...createData
                },
                message: 'Record created successfully!'
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Create data error:', error);
        return NextResponse.json(
            {
                error: 'Failed to create record.',
                message: error.message
            },
            { status: 500 }
        );
    }
}

// PUT update item
async function handlePut(request, { params }) {
    try {
        const { slug } = await params;
        const data = await getRequestBody(request);

        if (!slug) {
            return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
        }

        if (!data || !data.id) {
            return NextResponse.json({ error: 'Request body with id is required' }, { status: 400 });
        }

        // Check if item exists
        let tryId = data.id;
        const existingItem = await DBService.read(tryId, slug);
        if (!existingItem) {
            tryId = await DBService.getItemKey('id', tryId, slug);
            if (!tryId) {
                return NextResponse.json({ error: 'Record not found' }, { status: 404 });
            }
        }

        // Prepare update data (exclude id from update data)
        const { id, ...updateFields } = data;
        const updateData = {
            ...existingItem,
            ...updateFields,
            updatedAt: new Date().toISOString(),
            updatedBy: request.user?.id || 'unknown'
        };

        const updatedItem = await DBService.update(tryId, updateData, slug);

        if (!updatedItem) {
            return NextResponse.json({ error: 'Failed to update record.' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: { id, ...updateData },
            message: 'Record updated successfully!'
        });
    } catch (error) {
        console.error('Update data error:', error);
        return NextResponse.json(
            {
                error: 'Failed to update record.',
                message: error.message
            },
            { status: 500 }
        );
    }
}

// DELETE item - admin only
async function handleDelete(request, { params }) {
    try {
        const { slug } = await params;
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!slug) {
            return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
        }

        if (!id) {
            return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
        }

        // Check if item exists

        let tryId = id;
        const existingItem = await DBService.read(tryId, slug);
        if (!existingItem) {
            tryId = await DBService.getItemKey('id', tryId, slug);
            if (!tryId) {
                return NextResponse.json({ error: 'Record not found' }, { status: 404 });
            }
        }

        const deleted = await DBService.delete(tryId, slug);

        if (!deleted) {
            return NextResponse.json({ error: 'Failed to delete record.' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Record deleted successfully!',
            data: { id }
        });
    } catch (error) {
        console.error('Delete record error:', error);
        return NextResponse.json(
            {
                error: 'Failed to delete record.',
                message: error.message
            },
            { status: 500 }
        );
    }
}

// Export handlers with appropriate middleware
export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
export const PUT = withAuth(handlePut);
export const DELETE = withAdminAuth(handleDelete);
