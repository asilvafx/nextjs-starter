// app/api/query/[slug]/route.js
import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';
import { withAuth, withAdminAuth } from '@/lib/auth.js';

// Helper function to convert object data to array format
const convertToArray = (data, includeKey = true) => {
    if (!data || typeof data !== 'object') return [];

    return Object.entries(data).map(([key, item]) => ({
        ...item,
        // Add the key as a property if it doesn't exist
        key: key,
        // Use key as id if no id exists
        id: item.id || key
    }));
};

// Helper function to get request body safely
async function getRequestBody(request) {
    try {
        const contentType = request.headers.get('content-type');
        if (contentType?.includes('multipart/form-data')) {
            return await request.formData();
        }
        return await request.json();
    } catch (error) {
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
        const page = parseInt(url.searchParams.get('page')) || 1;
        const limit = parseInt(url.searchParams.get('limit')) || 10;
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
        }
        // Get items by key-value pair
        else if (key && value) {
            result = await DBService.getItemsByKeyValue(key, value, slug);
            if (!result) {
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
                return NextResponse.json(
                    { error: 'Data not found' },
                    { status: 404 }
                );
            }
        }


        const response = result;

        // Handle different response formats
        let items = [];
        if (Array.isArray(response)) {
            items = response;
        } else if (response && Array.isArray(response.data)) {
            items = response.data;
        } else if (response && response.success && Array.isArray(response.data)) {
            items = response.data;
        } else if (response && typeof response === 'object') {
            // Handle object format where keys are IDs and values are items
            items = Object.entries(response).map(([id, item]) => ({
                id,
                ...item
            }));
        } else if (response && response.data && typeof response.data === 'object') {
            // Handle wrapped object format
            items = Object.entries(response.data).map(([id, item]) => ({
                id,
                ...item
            }));
        }

        // Search functionality
        if (search && items.length > 0) {
            const searchTerm = search.toLowerCase();
            items = items.filter(item =>
                    item && (
                        (item.name && item.name.toLowerCase().includes(searchTerm)) ||
                        (item.description && item.description.toLowerCase().includes(searchTerm)) ||
                        (item.category && item.category.toLowerCase().includes(searchTerm))
                    )
            );
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
        console.error('Get data error:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve data.' },
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

        // Add metadata
        const createData = {
            ...data,
            createdAt: new Date().toISOString(),
            createdBy: request.user.id,
            updatedAt: new Date().toISOString(),
            updatedBy: request.user.id
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
            data: convertToArray(newItem),
            message: 'Record created successfully!'
        }, { status: 201 });

    } catch (error) {
        console.error('Create data error:', error);
        return NextResponse.json(
            { error: 'Failed to create record.' },
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
        const updateData = {
            ...existingItem,
            ...data,
            updatedAt: new Date().toISOString(),
            updatedBy: request.user.id
        };

        const updatedItem = await DBService.update(data.id, updateData, slug);

        if (!updatedItem) {
            return NextResponse.json(
                { error: 'Failed to update record.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: convertToArray(updatedItem),
            message: 'Record updated successfully!'
        });

    } catch (error) {
        console.error('Update data error:', error);
        return NextResponse.json(
            { error: 'Failed to update record.' },
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
        console.error('Delete record error:', error);
        return NextResponse.json(
            { error: 'Failed to delete record.' },
            { status: 500 }
        );
    }
}

// Export handlers with appropriate middleware
export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
export const PUT = withAuth(handlePut);
export const DELETE = withAdminAuth(handleDelete);
