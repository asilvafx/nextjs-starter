// app/api/shop/items/[id]/route.js
import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';
import { withAuth, withAdminAuth } from '@/lib/auth.js';

// GET single item - accessible to all authenticated users
async function getItemHandler(request, { params }) {
    try {
        const { id } = await params; // Await params before destructuring

        if (!id) {
            return NextResponse.json(
                { error: 'Item ID is required' },
                { status: 400 }
            );
        }

        const item = await DBService.read(id, "catalog");

        if (!item) {
            return NextResponse.json(
                { error: 'Item not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: item
        });

    } catch (error) {
        console.error('Get item error:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve item.' },
            { status: 500 }
        );
    }
}

// PUT update item - admin only
async function updateItemHandler(request, { params }) {
    try {
        const { id } = await params; // Await params before destructuring
        const data = await request.json();

        if (!id) {
            return NextResponse.json(
                { error: 'Item ID is required' },
                { status: 400 }
            );
        }

        // Check if item exists
        const existingItem = await DBService.read(id, "catalog");
        if (!existingItem) {
            return NextResponse.json(
                { error: 'Item not found' },
                { status: 404 }
            );
        }

        // Validation
        if (data.name && !data.name.trim()) {
            return NextResponse.json(
                { error: 'Name cannot be empty' },
                { status: 400 }
            );
        }

        if (data.price !== undefined && (isNaN(data.price) || data.price < 0)) {
            return NextResponse.json(
                { error: 'Price must be a valid positive number.' },
                { status: 400 }
            );
        }

        if (data.item_type && !['product', 'service'].includes(data.item_type)) {
            return NextResponse.json(
                { error: 'Item type must be either "product" or "service"' },
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

        // Prepare update data
        const updateData = {
            ...existingItem, // Keep existing data
            ...data, // Override with new data
            updatedAt: new Date().toISOString(),
            updatedBy: request.user.id
        };

        // Handle type-specific field cleanup
        if (updateData.item_type === 'service') {
            // Clear product-specific fields for services
            updateData.stock = 0;
            updateData.unit_type = null;
            updateData.colors = null;
            updateData.sizes = null;
            updateData.is_digital = null;
            updateData.download_url = null;
            updateData.download_instructions = null;
        } else if (updateData.item_type === 'product') {
            // Clear service-specific fields for products
            updateData.duration = null;
            updateData.duration_type = null;
            updateData.location_type = null;
            updateData.booking_required = null;
            updateData.max_bookings_per_day = null;
            updateData.service_area = null;
            updateData.requirements = null;

            // Ensure stock is set for products
            updateData.stock = parseInt(updateData.stock) || 0;
        }

        // Convert numeric fields
        if (updateData.price !== undefined) {
            updateData.price = parseFloat(updateData.price);
        }
        if (updateData.stock !== undefined && updateData.item_type === 'product') {
            updateData.stock = parseInt(updateData.stock) || 0;
        }
        if (updateData.duration !== undefined && updateData.item_type === 'service') {
            updateData.duration = parseInt(updateData.duration) || null;
        }
        if (updateData.max_bookings_per_day !== undefined && updateData.item_type === 'service') {
            updateData.max_bookings_per_day = parseInt(updateData.max_bookings_per_day) || null;
        }

        // Update in database
        const updatedItem = await DBService.update(id, updateData, "catalog");

        if (!updatedItem) {
            return NextResponse.json(
                { error: 'Failed to update item.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: updatedItem,
            message: `${updateData.item_type === 'service' ? 'Service' : 'Product'} updated successfully!`
        });

    } catch (error) {
        console.error('Update item error:', error);
        return NextResponse.json(
            { error: 'Failed to update item.' },
            { status: 500 }
        );
    }
}

// DELETE item - admin only
async function deleteItemHandler(request, { params }) {
    try {
        const { id } = await params; // Await params before destructuring

        if (!id) {
            return NextResponse.json(
                { error: 'Item ID is required' },
                { status: 400 }
            );
        }

        // Check if item exists
        const existingItem = await DBService.read(id, "catalog");
        if (!existingItem) {
            return NextResponse.json(
                { error: 'Item not found' },
                { status: 404 }
            );
        }

        // Delete from database
        const deleted = await DBService.delete(id, "catalog");

        if (!deleted) {
            return NextResponse.json(
                { error: 'Failed to delete item.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `${existingItem.item_type === 'service' ? 'Service' : 'Product'} deleted successfully!`,
            data: { id: id }
        });

    } catch (error) {
        console.error('Delete item error:', error);
        return NextResponse.json(
            { error: 'Failed to delete item.' },
            { status: 500 }
        );
    }
}

// Export handlers with appropriate middleware
export const GET = withAuth(getItemHandler);
export const PUT = withAdminAuth(updateItemHandler);
export const DELETE = withAdminAuth(deleteItemHandler);
