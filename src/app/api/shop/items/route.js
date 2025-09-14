// app/api/shop/items/route.js
import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';
import { withAuth, withAdminAuth } from '@/lib/auth.js';

// GET all items - accessible to all authenticated users
async function getAllItemsHandler(request) {
    try {
        const { searchParams } = new URL(request.url);

        // Optional query parameters
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const item_type = searchParams.get('item_type'); // filter by product/service

        // Get all items from database
        const response = await DBService.readAll("catalog");

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

        // Filter by item type if provided
        if (item_type && items.length > 0) {
            items = items.filter(item =>
                item && item.item_type && item.item_type.toLowerCase() === item_type.toLowerCase()
            );
        }

        // Filter by category if provided
        if (category && items.length > 0) {
            items = items.filter(item =>
                item && item.category && item.category.toLowerCase() === category.toLowerCase()
            );
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
        console.error('Get all items error:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve items.' },
            { status: 500 }
        );
    }
}

// POST new item - admin only
async function addItemHandler(request) {
    try {
        const data = await request.json();

        // Validation
        const requiredFields = ['name', 'price', 'item_type'];
        const missingFields = requiredFields.filter(field => !data[field]);

        if (missingFields.length > 0) {
            return NextResponse.json(
                { error: `Missing required fields: ${missingFields.join(', ')}` },
                { status: 400 }
            );
        }

        // Validate item_type
        if (!['product', 'service'].includes(data.item_type)) {
            return NextResponse.json(
                { error: 'Item type must be either "product" or "service"' },
                { status: 400 }
            );
        }

        // Validate price is a positive number
        if (isNaN(data.price) || data.price < 0) {
            return NextResponse.json(
                { error: 'Price must be a valid positive number.' },
                { status: 400 }
            );
        }

        // Digital product validation
        if (data.item_type === 'product' && data.is_digital && !data.download_url) {
            return NextResponse.json(
                { error: 'Digital products require a download URL' },
                { status: 400 }
            );
        }

        // Service validation
        if (data.item_type === 'service') {
            if (data.duration && (isNaN(data.duration) || data.duration < 0)) {
                return NextResponse.json(
                    { error: 'Duration must be a valid positive number' },
                    { status: 400 }
                );
            }

            if (data.max_bookings_per_day && (isNaN(data.max_bookings_per_day) || data.max_bookings_per_day < 1)) {
                return NextResponse.json(
                    { error: 'Max bookings per day must be at least 1' },
                    { status: 400 }
                );
            }
        }

        // Prepare item data with all possible fields
        const itemData = {
            // Basic fields
            name: data.name.trim(),
            description: data.description?.trim() || '',
            price: parseFloat(data.price),
            category: data.category?.trim() || 'general',
            item_type: data.item_type,
            image: data.image?.trim() || '',
            stock: data.item_type === 'service' ? -1 : (parseInt(data.stock) || -1),
            isActive: data.isActive !== undefined ? data.isActive : true,
            featured: 0,

            // Product specific fields
            unit_type: data.item_type === 'product' ? (data.unit_type || 'piece') : null,
            colors: data.item_type === 'product' ? (data.colors || []) : null,
            sizes: data.item_type === 'product' ? (data.sizes || []) : null,
            is_digital: data.item_type === 'product' ? (data.is_digital || false) : null,
            download_url: data.item_type === 'product' && data.is_digital ? (data.download_url?.trim() || '') : null,
            download_instructions: data.item_type === 'product' && data.is_digital ? (data.download_instructions?.trim() || '') : null,

            // Service specific fields
            duration: data.item_type === 'service' ? (parseInt(data.duration) || null) : null,
            duration_type: data.item_type === 'service' ? (data.duration_type || 'fixed') : null,
            location_type: data.item_type === 'service' ? (data.location_type || 'remote') : null,
            booking_required: data.item_type === 'service' ? (data.booking_required || false) : null,
            max_bookings_per_day: data.item_type === 'service' ? (parseInt(data.max_bookings_per_day) || null) : null,
            service_area: data.item_type === 'service' ? (data.service_area?.trim() || '') : null,
            requirements: data.item_type === 'service' ? (data.requirements?.trim() || '') : null,

            // Custom attributes (for both products and services)
            custom_attributes: data.custom_attributes || {},

            // Metadata
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: request.user.id
        };

        // Save to database
        const newItem = await DBService.create(itemData, "catalog");

        if (!newItem) {
            return NextResponse.json(
                { error: 'Failed to create item.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: newItem,
            message: `${data.item_type === 'service' ? 'Service' : 'Product'} created successfully!`
        }, { status: 201 });

    } catch (error) {
        console.error('Add item error:', error);
        return NextResponse.json(
            { error: 'Failed to create item.' },
            { status: 500 }
        );
    }
}

// Export handlers with appropriate middleware
export const GET = withAuth(getAllItemsHandler);
export const POST = withAdminAuth(addItemHandler);
