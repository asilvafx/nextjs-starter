// API route for notification triggers and automation
// /api/notifications/route.js

import { NextRequest, NextResponse } from 'next/server';
import { 
    createNotification, 
    createOrderNotification, 
    createSystemNotification,
    autoMarkOrderNotificationsRead,
    cleanupExpiredNotifications 
} from '@/lib/server/admin.js';
import { withAuth } from '@/lib/server/auth.js';

async function POST(request) {
    try {
        const { type, data } = await request.json();

        switch (type) {
            case 'order':
                // Create order notification
                const orderResult = await createOrderNotification(data.orderData, data.orderType || 'online');
                return NextResponse.json(orderResult);

            case 'order_status_change':
                // Auto-mark order notifications when status changes
                const statusResult = await autoMarkOrderNotificationsRead(
                    data.orderId, 
                    data.newStatus, 
                    data.userId
                );
                return NextResponse.json(statusResult);

            case 'system':
                // Create system notification
                const systemResult = await createSystemNotification(data);
                return NextResponse.json(systemResult);

            case 'security_alert':
                // Create security notification
                const securityNotification = {
                    type: 'security',
                    title: data.title || 'Security Alert',
                    message: data.message || 'A security event has been detected',
                    priority: data.priority || 'high',
                    requiresAction: data.requiresAction !== false,
                    actionLink: data.actionLink,
                    actionText: data.actionText || 'Review Security',
                    metadata: {
                        securityEvent: data.event,
                        sourceIP: data.sourceIP,
                        userAgent: data.userAgent,
                        ...data.metadata
                    }
                };
                const securityResult = await createNotification(securityNotification);
                return NextResponse.json(securityResult);

            case 'backup_reminder':
                // Create backup reminder notification
                const backupNotification = {
                    type: 'maintenance',
                    title: 'Backup Reminder',
                    message: data.message || 'It\'s time to create a system backup to ensure your data is safe.',
                    priority: 'medium',
                    requiresAction: true,
                    actionLink: '/admin/system/maintenance',
                    actionText: 'Create Backup',
                    autoMarkRead: false, // Only cleared after backup is completed
                    metadata: {
                        reminderType: 'backup',
                        lastBackupDate: data.lastBackupDate
                    }
                };
                const backupResult = await createNotification(backupNotification);
                return NextResponse.json(backupResult);

            case 'monthly_report':
                // Create monthly report notification
                const reportNotification = {
                    type: 'report',
                    title: `Monthly Report - ${new Date().toLocaleDateString('en', { month: 'long', year: 'numeric' })}`,
                    message: `Your monthly business report is ready. Review key metrics, orders, and performance data.`,
                    priority: 'medium',
                    requiresAction: false,
                    actionLink: '/admin/analytics',
                    actionText: 'View Report',
                    autoMarkRead: true, // Auto-mark when clicked
                    metadata: {
                        reportType: 'monthly',
                        reportMonth: new Date().getMonth(),
                        reportYear: new Date().getFullYear(),
                        ...data.reportData
                    }
                };
                const reportResult = await createNotification(reportNotification);
                return NextResponse.json(reportResult);

            case 'cleanup':
                // Clean up expired notifications
                const cleanupResult = await cleanupExpiredNotifications();
                return NextResponse.json(cleanupResult);

            default:
                return NextResponse.json(
                    { success: false, error: 'Unknown notification type' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error in notifications API:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// Export the route handlers with authentication
export { withAuth(POST) as POST };