'use client';

import { 
    Bell, 
    ShoppingCart, 
    Shield, 
    FileText, 
    Settings, 
    AlertTriangle, 
    Info, 
    CheckCircle,
    Clock,
    ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'order' | 'security' | 'report' | 'maintenance' | 'info' | 'warning' | 'error';
    priority: 'low' | 'medium' | 'high' | 'critical';
    userId: string | null;
    isRead: boolean;
    requiresAction: boolean;
    actionLink: string | null;
    actionText: string | null;
    autoMarkRead: boolean;
    relatedId: string | null;
    relatedType: string | null;
    metadata: Record<string, any>;
    createdAt: string;
    readAt?: string;
    readBy?: string | null;
}

// Helper functions to interact with notification APIs
const notificationAPI = {
    async getAll(options: { userId?: string | null; limit?: number } = {}) {
        try {
            const params = new URLSearchParams();
            if (options.limit) params.append('limit', options.limit.toString());
            
            const response = await fetch(`/api/query/notifications?${params.toString()}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) throw new Error('Failed to fetch notifications');
            return await response.json();
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return { success: false, error: (error as Error).message || 'Unknown error', data: [] };
        }
    },
    
    async markAsRead(notificationId: string, userId?: string | null) {
        try {
            const response = await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'mark_as_read',
                    data: { notificationId, userId }
                })
            });
            
            if (!response.ok) throw new Error('Failed to mark notification as read');
            return await response.json();
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return { success: false, error: (error as Error).message || 'Unknown error' };
        }
    },
    
    async markMultipleAsRead(notificationIds: string[], userId?: string | null) {
        try {
            const response = await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'mark_multiple_as_read',
                    data: { notificationIds, userId }
                })
            });
            
            if (!response.ok) throw new Error('Failed to mark notifications as read');
            return await response.json();
        } catch (error) {
            console.error('Error marking notifications as read:', error);
            return { success: false, error: (error as Error).message || 'Unknown error' };
        }
    },
    
    async getUnreadCount(userId?: string | null) {
        try {
            const response = await fetch(`/api/query/notifications?unread_count=true`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) throw new Error('Failed to fetch unread count');
            const result = await response.json();
            return { 
                success: true, 
                data: { 
                    count: result.data?.filter((n: any) => !n.isRead).length || 0 
                } 
            };
        } catch (error) {
            console.error('Error fetching unread count:', error);
            return { success: false, error: (error as Error).message || 'Unknown error', data: { count: 0 } };
        }
    }
};

export function NotificationsPopover() {
    const { user } = useAuth();
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [isOpen, setIsOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(true);

    // Load notifications when component mounts or popover opens
    const loadNotifications = React.useCallback(async () => {
        try {
            setLoading(true);
            
            // Get recent notifications (last 20)
            const result = await notificationAPI.getAll({ 
                userId: user?.email || null, 
                limit: 20 
            });
            
            if (result.success) {
                setNotifications(result.data || []);
                
                // Count unread notifications
                const unreadResult = await notificationAPI.getUnreadCount(user?.email || null);
                if (unreadResult.success) {
                    setUnreadCount(unreadResult.data.count);
                }
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.email]);

    // Load notifications on mount and when popover opens
    React.useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    // Reload when popover opens
    React.useEffect(() => {
        if (isOpen) {
            loadNotifications();
        }
    }, [isOpen, loadNotifications]);

    // Mark single notification as read
    const markAsRead = async (notificationId: string) => {
        try {
            const result = await notificationAPI.markAsRead(notificationId, user?.email || null);
            
            if (result.success) {
                // Update local state
                setNotifications(prev => 
                    prev.map(notification =>
                        notification.id === notificationId 
                            ? { ...notification, isRead: true, readAt: new Date().toISOString(), readBy: user?.email || null } as Notification
                            : notification
                    )
                );
                
                // Update unread count
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            const unreadNotificationIds = notifications
                .filter(n => !n.isRead)
                .map(n => n.id);
            
            if (unreadNotificationIds.length === 0) return;
            
            const result = await notificationAPI.markMultipleAsRead(unreadNotificationIds, user?.email || null);
            
            if (result.success) {
                // Update local state
                setNotifications(prev => 
                    prev.map(notification => ({
                        ...notification,
                        isRead: true,
                        readAt: new Date().toISOString(),
                        readBy: user?.email || null
                    } as Notification))
                );
                
                // Reset unread count
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    // Get notification icon based on type
    const getNotificationIcon = (type: string, priority: string) => {
        const iconProps = { 
            className: cn(
                'h-5 w-5',
                type === 'order' && 'text-blue-600',
                type === 'security' && 'text-red-600', 
                type === 'report' && 'text-green-600',
                type === 'maintenance' && 'text-yellow-600',
                type === 'info' && 'text-blue-500',
                type === 'warning' && 'text-yellow-500',
                type === 'error' && 'text-red-500',
                priority === 'critical' && 'text-red-700'
            )
        };

        switch (type) {
            case 'order': return <ShoppingCart {...iconProps} />;
            case 'security': return <Shield {...iconProps} />;
            case 'report': return <FileText {...iconProps} />;
            case 'maintenance': return <Settings {...iconProps} />;
            case 'warning': return <AlertTriangle {...iconProps} />;
            case 'error': return <AlertTriangle {...iconProps} />;
            default: return <Info {...iconProps} />;
        }
    };

    // Format timestamp relative to now
    const formatTimeAgo = (timestamp: string) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        
        return new Intl.DateTimeFormat('en', { 
            month: 'short', 
            day: 'numeric',
            ...(time.getFullYear() !== now.getFullYear() && { year: 'numeric' })
        }).format(time);
    };

    // Handle notification click
    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read if not already read and auto-mark is enabled
        if (!notification.isRead && (notification.autoMarkRead || !notification.requiresAction)) {
            await markAsRead(notification.id);
        }
        
        // Navigate to action link if available
        if (notification.actionLink && notification.requiresAction) {
            // Close popover
            setIsOpen(false);
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="-top-1 -right-1 absolute flex h-4 w-4 items-center justify-center rounded-full bg-red-500 font-medium text-[10px] text-white">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" side="bottom" align="end" sideOffset={5}>
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h4 className="font-semibold text-lg">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                            Mark all as read
                        </Button>
                    )}
                </div>

                {/* Content */}
                <ScrollArea className="h-[calc(100vh-20rem)] max-h-96">
                    {loading ? (
                        <div className="flex items-center justify-center p-8">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                <span>Loading notifications...</span>
                            </div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                            <CheckCircle className="mb-4 h-12 w-12 text-muted-foreground" />
                            <h3 className="mb-2 font-medium">All caught up!</h3>
                            <p className="text-muted-foreground text-sm">No new notifications at this time</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        'flex cursor-pointer gap-3 p-4 transition-colors hover:bg-accent',
                                        !notification.isRead && 'bg-accent/30 border-l-2 border-l-primary',
                                        notification.priority === 'critical' && 'border-l-red-500'
                                    )}
                                    onClick={() => handleNotificationClick(notification)}>
                                    
                                    {/* Icon */}
                                    <div className="flex-shrink-0 mt-1">
                                        {getNotificationIcon(notification.type, notification.priority)}
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h5 className={cn(
                                                'text-sm font-medium line-clamp-1',
                                                !notification.isRead && 'font-semibold'
                                            )}>
                                                {notification.title}
                                            </h5>
                                            <div className="flex items-center gap-1 text-muted-foreground text-xs flex-shrink-0">
                                                <Clock className="h-3 w-3" />
                                                {formatTimeAgo(notification.createdAt)}
                                            </div>
                                        </div>
                                        
                                        <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
                                            {notification.message}
                                        </p>
                                        
                                        {/* Action button */}
                                        {notification.requiresAction && notification.actionLink && (
                                            <Link href={notification.actionLink} className="inline-block">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    className="h-7 px-2 text-xs"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsOpen(false);
                                                    }}>
                                                    {notification.actionText || 'View'}
                                                    <ExternalLink className="ml-1 h-3 w-3" />
                                                </Button>
                                            </Link>
                                        )}
                                        
                                        {/* Unread indicator dot */}
                                        {!notification.isRead && (
                                            <div className="absolute right-4 top-6">
                                                <div className={cn(
                                                    'h-2 w-2 rounded-full',
                                                    notification.priority === 'critical' ? 'bg-red-500' :
                                                    notification.priority === 'high' ? 'bg-orange-500' :
                                                    'bg-blue-500'
                                                )} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                <div className="border-t p-3">
                    <Link href="/admin/account/notifications">
                        <Button 
                            variant="outline" 
                            className="w-full" 
                            onClick={() => setIsOpen(false)}>
                            View all notifications
                        </Button>
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    );
}
