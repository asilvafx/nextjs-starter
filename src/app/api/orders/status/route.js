// Order status update API with automatic notification clearing
// /api/orders/status/route.js

import { NextRequest, NextResponse } from 'next/server';
import { 
    updateOrder,
    getOrderById,
    clearOrderNotifications 
} from '@/lib/server/admin.js';
import { triggerOrderStatusChangeNotification } from '@/lib/server/notificationTriggers.js';
import { withAuth } from '@/lib/server/auth.js';

async function handlePost(request) {
    try {
        const { orderId, newStatus, userId, customerEmail } = await request.json();

        if (!orderId || !newStatus) {
            return NextResponse.json(
                { success: false, error: 'Order ID and new status are required' },
                { status: 400 }
            );
        }

        // Get current order to check old status
        const currentOrder = await getOrderById(orderId);
        if (!currentOrder.success) {
            return NextResponse.json(
                { success: false, error: 'Order not found' },
                { status: 404 }
            );
        }

        const oldStatus = currentOrder.data.status;

        // Update the order status
        const updateResult = await updateOrder(orderId, { 
            status: newStatus,
            updatedAt: new Date().toISOString(),
            statusChangedBy: userId
        });

        if (!updateResult.success) {
            return NextResponse.json(updateResult, { status: 500 });
        }

        // Clear order notifications if status changed from pending/unconfirmed
        if (oldStatus !== newStatus) {
            await clearOrderNotifications(orderId, newStatus, userId);

            // Trigger order status change notification for customer
            await triggerOrderStatusChangeNotification({
                orderId,
                oldStatus,
                newStatus,
                userId,
                customerEmail
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                order: updateResult.data,
                statusChanged: oldStatus !== newStatus,
                notificationsCleared: oldStatus !== newStatus && newStatus !== 'pending' && newStatus !== 'unconfirmed'
            }
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// Export the route handlers with authentication
export const POST = withAuth(handlePost);