// Sample notification creation script for testing
// /scripts/createSampleNotifications.js

import { 
    createOrderNotification, 
    createSystemNotification, 
    createNotification 
} from '../src/lib/server/admin.js';

/**
 * Create sample notifications for testing purposes
 * Run this script to populate the notifications database with sample data
 */
export async function createSampleNotifications() {
    console.log('Creating sample notifications...');
    
    const notifications = [];
    
    // 1. Order notifications
    notifications.push(
        await createOrderNotification({
            id: 'order_123',
            orderNumber: '2024-001',
            customerName: 'John Smith',
            email: 'john.smith@example.com',
            total: '149.99',
            status: 'pending'
        }, 'online')
    );
    
    notifications.push(
        await createOrderNotification({
            id: 'order_124',
            orderNumber: '2024-002',
            customerName: 'Jane Doe',
            email: 'jane.doe@example.com',
            total: '89.50',
            status: 'pending'
        }, 'online')
    );
    
    // 2. Security notifications
    notifications.push(
        await createNotification({
            title: 'Security Alert: Multiple Failed Login Attempts',
            message: '5 failed login attempts detected for admin@example.com from IP 192.168.1.100 in the last 10 minutes.',
            type: 'security',
            priority: 'high',
            requiresAction: true,
            actionLink: '/admin/system/security',
            actionText: 'Review Security Logs',
            autoMarkRead: false,
            metadata: {
                alertType: 'failed_login',
                email: 'admin@example.com',
                ipAddress: '192.168.1.100',
                attempts: 5
            }
        })
    );
    
    // 3. System maintenance notification
    notifications.push(
        await createNotification({
            title: 'System Maintenance Scheduled',
            message: 'Routine system maintenance is scheduled for tonight at 2:00 AM EST. Expected downtime: 30 minutes.',
            type: 'maintenance',
            priority: 'medium',
            requiresAction: false,
            actionLink: '/admin/system/maintenance',
            actionText: 'View Schedule',
            autoMarkRead: true,
            metadata: {
                maintenanceType: 'routine',
                scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                estimatedDuration: '30 minutes'
            }
        })
    );
    
    // 4. Backup reminder
    notifications.push(
        await createNotification({
            title: 'Backup Reminder',
            message: 'It has been 7 days since your last system backup. Create a backup to ensure your data is safe.',
            type: 'maintenance',
            priority: 'medium',
            requiresAction: true,
            actionLink: '/admin/system/maintenance',
            actionText: 'Create Backup',
            autoMarkRead: false,
            metadata: {
                reminderType: 'backup',
                daysSinceLastBackup: 7
            }
        })
    );
    
    // 5. Monthly report notification
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const monthName = lastMonth.toLocaleDateString('en', { month: 'long', year: 'numeric' });
    
    notifications.push(
        await createNotification({
            title: `Monthly Report - ${monthName}`,
            message: `Your ${monthName} business report is ready! 47 orders, $3,420 revenue, 12 new customers.`,
            type: 'report',
            priority: 'medium',
            requiresAction: false,
            actionLink: '/admin/analytics',
            actionText: 'View Report',
            autoMarkRead: true,
            metadata: {
                reportMonth: lastMonth.getMonth(),
                reportYear: lastMonth.getFullYear(),
                totalOrders: 47,
                totalRevenue: 3420,
                newCustomers: 12
            }
        })
    );
    
    // 6. Low inventory warning
    notifications.push(
        await createNotification({
            title: 'Low Inventory Alert',
            message: 'Product "Premium Headphones" is running low. Current stock: 3, Threshold: 5.',
            type: 'warning',
            priority: 'medium',
            requiresAction: true,
            actionLink: '/admin/store/catalog',
            actionText: 'Update Inventory',
            autoMarkRead: false,
            relatedId: 'product_456',
            relatedType: 'product',
            metadata: {
                productName: 'Premium Headphones',
                currentStock: 3,
                threshold: 5
            }
        })
    );
    
    // 7. Payment failure notification
    notifications.push(
        await createNotification({
            title: 'Payment Failure Alert',
            message: 'Payment of $299.99 failed for order #2024-003. Customer: mike@example.com. Reason: Card declined.',
            type: 'error',
            priority: 'high',
            requiresAction: true,
            actionLink: '/admin/store/orders',
            actionText: 'Review Order',
            autoMarkRead: false,
            relatedId: 'order_125',
            relatedType: 'order',
            metadata: {
                orderId: 'order_125',
                customerEmail: 'mike@example.com',
                amount: 299.99,
                failureReason: 'Card declined'
            }
        })
    );
    
    // 8. New user registration
    notifications.push(
        await createNotification({
            title: 'New User Registration',
            message: 'A new user Sarah Wilson has registered on your platform.',
            type: 'info',
            priority: 'low',
            requiresAction: false,
            actionLink: '/admin/access/users',
            actionText: 'View Users',
            autoMarkRead: true,
            relatedId: 'user_789',
            relatedType: 'user',
            metadata: {
                userEmail: 'sarah.wilson@example.com',
                userName: 'Sarah Wilson',
                registrationDate: new Date().toISOString()
            }
        })
    );
    
    // 9. Disk space warning
    notifications.push(
        await createNotification({
            title: 'Disk Space Warning',
            message: 'Disk space is running low. 2.1 GB available of 20 GB total (89% used).',
            type: 'warning',
            priority: 'high',
            requiresAction: true,
            actionLink: '/admin/system/maintenance',
            actionText: 'Manage Storage',
            autoMarkRead: false,
            metadata: {
                availableSpace: '2.1 GB',
                totalSpace: '20 GB',
                percentageUsed: 89
            }
        })
    );
    
    // 10. Backup success notification (this one marked as read)
    const backupNotification = await createNotification({
        title: 'Backup Completed Successfully',
        message: 'System backup completed successfully. Size: 1.2 GB, Duration: 15 minutes.',
        type: 'maintenance',
        priority: 'low',
        requiresAction: false,
        autoMarkRead: true,
        metadata: {
            backupSize: '1.2 GB',
            duration: '15 minutes',
            location: 'cloud-storage-bucket'
        }
    });
    
    // Mark the backup notification as read to show an example
    if (backupNotification.success) {
        const { markNotificationAsRead } = await import('../src/lib/server/admin.js');
        await markNotificationAsRead(backupNotification.data.id, 'admin@example.com');
    }
    
    notifications.push(backupNotification);
    
    console.log(`Created ${notifications.filter(n => n.success).length} sample notifications`);
    
    return notifications;
}

// If running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
    createSampleNotifications()
        .then(() => {
            console.log('Sample notifications created successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Error creating sample notifications:', error);
            process.exit(1);
        });
}