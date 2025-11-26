// Notification trigger utilities
// /lib/server/notificationTriggers.js

'use server';

import { 
    createNotification, 
    createOrderNotification, 
    createSystemNotification,
    autoMarkOrderNotificationsRead 
} from './admin.js';

/**
 * Trigger notification for new user registration
 * Call this when a new user registers on the platform
 */
export async function triggerNewUserNotification(userData) {
    return await createNotification({
        title: 'New User Registration',
        message: `A new user ${userData.name || userData.email} has registered on your platform.`,
        type: 'info',
        priority: 'low',
        requiresAction: false,
        actionLink: '/admin/access/users',
        actionText: 'View Users',
        autoMarkRead: true,
        relatedId: userData.id || userData.email,
        relatedType: 'user',
        metadata: {
            userEmail: userData.email,
            userName: userData.name,
            registrationDate: new Date().toISOString()
        }
    });
}

/**
 * Trigger notification for failed login attempts
 * Call this when suspicious login activity is detected
 */
export async function triggerSecurityAlert(alertData) {
    const { type, email, ipAddress, attempts, userAgent } = alertData;
    
    let title, message, priority;
    
    switch (type) {
        case 'failed_login':
            title = 'Security Alert: Failed Login Attempts';
            message = `${attempts} failed login attempts detected for ${email} from IP ${ipAddress}.`;
            priority = attempts > 5 ? 'high' : 'medium';
            break;
        case 'suspicious_activity':
            title = 'Security Alert: Suspicious Activity';
            message = `Suspicious activity detected from IP ${ipAddress}. Review security logs.`;
            priority = 'high';
            break;
        case 'password_reset':
            title = 'Security Alert: Password Reset';
            message = `Password reset requested for ${email} from IP ${ipAddress}.`;
            priority = 'medium';
            break;
        default:
            title = 'Security Alert';
            message = 'A security event has been detected.';
            priority = 'medium';
    }
    
    return await createNotification({
        title,
        message,
        type: 'security',
        priority,
        requiresAction: true,
        actionLink: '/admin/system/security',
        actionText: 'Review Security',
        autoMarkRead: false, // Requires manual review
        metadata: {
            alertType: type,
            email,
            ipAddress,
            userAgent,
            attempts,
            timestamp: new Date().toISOString()
        }
    });
}

/**
 * Trigger notification for system maintenance
 * Call this for system updates, maintenance windows, etc.
 */
export async function triggerMaintenanceNotification(maintenanceData) {
    const { type, title, message, scheduledDate, estimatedDuration } = maintenanceData;
    
    return await createNotification({
        title: title || 'System Maintenance Scheduled',
        message: message || 'System maintenance has been scheduled. Check for details and estimated downtime.',
        type: 'maintenance',
        priority: 'medium',
        requiresAction: false,
        actionLink: '/admin/system/maintenance',
        actionText: 'View Details',
        autoMarkRead: true,
        metadata: {
            maintenanceType: type,
            scheduledDate,
            estimatedDuration,
            notificationCreated: new Date().toISOString()
        }
    });
}

/**
 * Trigger notification for low inventory
 * Call this when product inventory falls below threshold
 */
export async function triggerLowInventoryNotification(productData) {
    const { id, name, currentStock, threshold } = productData;
    
    return await createNotification({
        title: 'Low Inventory Alert',
        message: `Product "${name}" is running low. Current stock: ${currentStock}, Threshold: ${threshold}.`,
        type: 'warning',
        priority: currentStock === 0 ? 'high' : 'medium',
        requiresAction: true,
        actionLink: `/admin/store/catalog?productId=${id}`,
        actionText: 'Update Inventory',
        autoMarkRead: false, // Requires action to restock
        relatedId: id,
        relatedType: 'product',
        metadata: {
            productId: id,
            productName: name,
            currentStock,
            threshold,
            alertDate: new Date().toISOString()
        }
    });
}

/**
 * Trigger notification for payment failures
 * Call this when payment processing fails
 */
export async function triggerPaymentFailureNotification(paymentData) {
    const { orderId, customerEmail, amount, reason } = paymentData;
    
    return await createNotification({
        title: 'Payment Failure Alert',
        message: `Payment of $${amount} failed for order #${orderId}. Customer: ${customerEmail}. Reason: ${reason}`,
        type: 'error',
        priority: 'high',
        requiresAction: true,
        actionLink: `/admin/store/orders?orderId=${orderId}`,
        actionText: 'Review Order',
        autoMarkRead: false, // Requires manual intervention
        relatedId: orderId,
        relatedType: 'order',
        metadata: {
            orderId,
            customerEmail,
            amount,
            failureReason: reason,
            paymentDate: new Date().toISOString()
        }
    });
}

/**
 * Trigger notification for successful backups
 * Call this when automated backups complete successfully
 */
export async function triggerBackupSuccessNotification(backupData) {
    const { backupSize, duration, location } = backupData;
    
    return await createNotification({
        title: 'Backup Completed Successfully',
        message: `System backup completed successfully. Size: ${backupSize}, Duration: ${duration}, Location: ${location}`,
        type: 'maintenance',
        priority: 'low',
        requiresAction: false,
        autoMarkRead: true,
        metadata: {
            backupSize,
            duration,
            location,
            backupDate: new Date().toISOString()
        }
    });
}

/**
 * Trigger notification for backup failures
 * Call this when automated backups fail
 */
export async function triggerBackupFailureNotification(errorData) {
    const { error, attemptedDate } = errorData;
    
    return await createNotification({
        title: 'Backup Failed',
        message: `System backup failed on ${attemptedDate}. Error: ${error}. Manual backup recommended.`,
        type: 'error',
        priority: 'high',
        requiresAction: true,
        actionLink: '/admin/system/maintenance',
        actionText: 'Create Manual Backup',
        autoMarkRead: false, // Only cleared after successful backup
        metadata: {
            error,
            attemptedDate,
            failureDate: new Date().toISOString()
        }
    });
}

/**
 * Trigger monthly business report notification
 * Call this on the first day of each month
 */
export async function triggerMonthlyReportNotification(reportData) {
    const currentDate = new Date();
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
    const monthName = lastMonth.toLocaleDateString('en', { month: 'long', year: 'numeric' });
    
    const { 
        totalOrders = 0, 
        totalRevenue = 0, 
        newCustomers = 0, 
        topProducts = [] 
    } = reportData;
    
    return await createNotification({
        title: `Monthly Business Report - ${monthName}`,
        message: `Your ${monthName} report is ready! ${totalOrders} orders, $${totalRevenue.toLocaleString()} revenue, ${newCustomers} new customers.`,
        type: 'report',
        priority: 'medium',
        requiresAction: false,
        actionLink: '/admin/analytics',
        actionText: 'View Full Report',
        autoMarkRead: true,
        metadata: {
            reportMonth: lastMonth.getMonth(),
            reportYear: lastMonth.getFullYear(),
            totalOrders,
            totalRevenue,
            newCustomers,
            topProducts,
            reportGenerated: new Date().toISOString()
        }
    });
}

/**
 * Trigger notification when order status changes
 * This also handles auto-marking order notifications as read
 */
export async function triggerOrderStatusChangeNotification(orderData) {
    const { orderId, oldStatus, newStatus, userId, customerEmail } = orderData;
    
    // Auto-mark existing order notifications as read if status changed from pending/unconfirmed
    if (oldStatus === 'pending' || oldStatus === 'unconfirmed') {
        await autoMarkOrderNotificationsRead(orderId, newStatus, userId);
    }
    
    // Create status change notification for customer (if email available)
    if (customerEmail && newStatus !== 'pending' && newStatus !== 'unconfirmed') {
        return await createNotification({
            title: `Order Status Update`,
            message: `Order #${orderId} status has been updated to "${newStatus}".`,
            type: 'info',
            priority: 'low',
            requiresAction: false,
            actionLink: `/admin/store/orders?orderId=${orderId}`,
            actionText: 'View Order',
            autoMarkRead: true,
            relatedId: orderId,
            relatedType: 'order',
            metadata: {
                orderId,
                oldStatus,
                newStatus,
                customerEmail,
                statusChangedBy: userId,
                statusChangeDate: new Date().toISOString()
            }
        });
    }
    
    return { success: true, data: null, message: 'No notification created for this status change' };
}

/**
 * Trigger notification for disk space warnings
 * Call this when disk space is running low
 */
export async function triggerDiskSpaceWarning(spaceData) {
    const { availableSpace, totalSpace, percentageUsed } = spaceData;
    
    return await createNotification({
        title: 'Disk Space Warning',
        message: `Disk space is running low. ${availableSpace} available of ${totalSpace} total (${percentageUsed}% used).`,
        type: 'warning',
        priority: percentageUsed > 90 ? 'high' : 'medium',
        requiresAction: true,
        actionLink: '/admin/system/maintenance',
        actionText: 'Manage Storage',
        autoMarkRead: false, // Requires action to free space
        metadata: {
            availableSpace,
            totalSpace,
            percentageUsed,
            warningDate: new Date().toISOString()
        }
    });
}

/**
 * Schedule recurring notifications
 * Call this function to set up automated notification triggers
 */
export async function scheduleRecurringNotifications() {
    const now = new Date();
    
    // Monthly reports (first day of month)
    if (now.getDate() === 1) {
        // This would typically be called by a cron job or scheduled task
        console.log('Scheduling monthly report notification');
    }
    
    // Weekly backup reminders (every Sunday)
    if (now.getDay() === 0) {
        await createNotification({
            title: 'Weekly Backup Reminder',
            message: 'Weekly system backup is recommended. Ensure your data is protected.',
            type: 'maintenance',
            priority: 'medium',
            requiresAction: true,
            actionLink: '/admin/system/maintenance',
            actionText: 'Create Backup',
            autoMarkRead: false
        });
    }
    
    return { success: true, message: 'Recurring notifications scheduled' };
}

// Export all trigger functions
export {
    triggerNewUserNotification,
    triggerSecurityAlert,
    triggerMaintenanceNotification,
    triggerLowInventoryNotification,
    triggerPaymentFailureNotification,
    triggerBackupSuccessNotification,
    triggerBackupFailureNotification,
    triggerMonthlyReportNotification,
    triggerOrderStatusChangeNotification,
    triggerDiskSpaceWarning,
    scheduleRecurringNotifications
};