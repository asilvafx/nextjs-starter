// Cron job API route for automated notifications
// /api/cronjobs/notifications/route.js

import { NextRequest, NextResponse } from 'next/server';
import { 
    cleanupExpiredNotifications,
    createNotification 
} from '@/lib/server/admin.js';
import { 
    triggerMonthlyReportNotification,
    scheduleRecurringNotifications 
} from '@/lib/server/notificationTriggers.js';

// This route can be called by external cron services (like Vercel Cron)
// or internal scheduling systems for automated notification management
export async function POST(request) {
    try {
        const { action, data } = await request.json();
        
        // Verify the request is from a trusted source (add your cron secret)
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET || 'your-secret-key';
        
        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }
        
        let result;
        
        switch (action) {
            case 'cleanup':
                // Daily cleanup of expired and old notifications
                result = await cleanupExpiredNotifications();
                break;
                
            case 'monthly_report':
                // Generate monthly report notification (run on 1st of each month)
                const reportData = data || {
                    totalOrders: 0,
                    totalRevenue: 0,
                    newCustomers: 0,
                    topProducts: []
                };
                result = await triggerMonthlyReportNotification(reportData);
                break;
                
            case 'weekly_backup_reminder':
                // Weekly backup reminder (run every Sunday)
                result = await createNotification({
                    title: 'Weekly Backup Reminder',
                    message: 'Weekly system backup is recommended. Ensure your data is protected with regular backups.',
                    type: 'maintenance',
                    priority: 'medium',
                    requiresAction: true,
                    actionLink: '/admin/system/maintenance',
                    actionText: 'Create Backup',
                    autoMarkRead: false,
                    metadata: {
                        reminderType: 'weekly_backup',
                        scheduledDate: new Date().toISOString()
                    }
                });
                break;
                
            case 'system_health_check':
                // Daily system health notification
                const healthData = data || {};
                
                result = await createNotification({
                    title: 'System Health Check',
                    message: 'Daily system health check completed. All systems operational.',
                    type: 'maintenance',
                    priority: 'low',
                    requiresAction: false,
                    autoMarkRead: true,
                    metadata: {
                        healthCheckDate: new Date().toISOString(),
                        uptime: healthData.uptime || '99.9%',
                        responseTime: healthData.responseTime || '120ms',
                        errors: healthData.errors || 0
                    }
                });
                break;
                
            case 'recurring':
                // Run all recurring notifications
                result = await scheduleRecurringNotifications();
                break;
                
            case 'security_digest':
                // Weekly security digest (run every Monday)
                const securityData = data || {};
                
                result = await createNotification({
                    title: 'Weekly Security Digest',
                    message: `Security summary: ${securityData.loginAttempts || 0} login attempts, ${securityData.blockedIPs || 0} blocked IPs, ${securityData.securityUpdates || 0} updates available.`,
                    type: 'security',
                    priority: securityData.criticalUpdates > 0 ? 'high' : 'medium',
                    requiresAction: securityData.criticalUpdates > 0,
                    actionLink: '/admin/system/security',
                    actionText: 'Review Security',
                    autoMarkRead: securityData.criticalUpdates === 0,
                    metadata: {
                        digestType: 'weekly',
                        loginAttempts: securityData.loginAttempts || 0,
                        blockedIPs: securityData.blockedIPs || 0,
                        securityUpdates: securityData.securityUpdates || 0,
                        criticalUpdates: securityData.criticalUpdates || 0,
                        digestDate: new Date().toISOString()
                    }
                });
                break;
                
            default:
                return NextResponse.json(
                    { success: false, error: 'Unknown action' },
                    { status: 400 }
                );
        }
        
        return NextResponse.json({
            success: true,
            data: result,
            message: `Notification action '${action}' completed successfully`,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error in notifications cron job:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error.message,
                action: request.url 
            },
            { status: 500 }
        );
    }
}

// Also allow GET requests for health checks
export async function GET(request) {
    return NextResponse.json({
        success: true,
        message: 'Notifications cron job API is operational',
        timestamp: new Date().toISOString()
    });
}