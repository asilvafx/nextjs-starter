// Order management utility for status updates with badge refresh
// /lib/client/orderUtils.js

'use client';

import { refreshNotificationBadge } from '@/app/admin/components/nav-badge';

/**
 * Update order status and refresh notification badges
 * @param {string} orderId - Order ID to update
 * @param {string} newStatus - New order status
 * @param {string} userId - User making the change
 * @param {string} customerEmail - Customer email (optional)
 * @returns {Promise<Object>} Update result
 */
export async function updateOrderStatus(orderId, newStatus, userId, customerEmail = null) {
    try {
        const response = await fetch('/api/orders/status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderId,
                newStatus,
                userId,
                customerEmail
            })
        });

        const result = await response.json();

        if (result.success && result.data.notificationsCleared) {
            // Refresh store and order badges since notifications were cleared
            setTimeout(() => {
                refreshNotificationBadge('store');
                refreshNotificationBadge('storeOrders');
            }, 1000);
        }

        return result;
    } catch (error) {
        console.error('Error updating order status:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Create a new order notification (for online orders)
 * @param {Object} orderData - Order data
 * @returns {Promise<Object>} Creation result
 */
export async function createOrderNotificationClient(orderData) {
    try {
        const response = await fetch('/api/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'order',
                data: {
                    orderData,
                    orderType: 'online'
                }
            })
        });

        const result = await response.json();

        if (result.success) {
            // Refresh badges to show new notification
            setTimeout(() => {
                refreshNotificationBadge('store');
                refreshNotificationBadge('storeOrders');
            }, 1000);
        }

        return result;
    } catch (error) {
        console.error('Error creating order notification:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Example usage in a store orders page:
 * 
 * import { updateOrderStatus } from '@/lib/client/orderUtils';
 * import { useAuth } from '@/hooks/useAuth';
 * 
 * const { user } = useAuth();
 * 
 * const handleStatusChange = async (orderId, newStatus) => {
 *     const result = await updateOrderStatus(
 *         orderId, 
 *         newStatus, 
 *         user?.email,
 *         order.customerEmail
 *     );
 *     
 *     if (result.success) {
 *         // Status updated successfully, badges will auto-refresh
 *         toast.success('Order status updated');
 *     } else {
 *         toast.error('Failed to update status');
 *     }
 * };
 */