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
    ExternalLink,
    Filter,
    Trash2,
    Check,
    Eye,
    EyeOff,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Fragment, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    DropdownMenu, 
    DropdownMenuCheckboxItem, 
    DropdownMenuContent, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminHeader from '@/app/admin/components/AdminHeader';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { 
    getAllNotifications, 
    markNotificationAsRead, 
    markMultipleNotificationsAsRead,
    deleteNotification,
    cleanupExpiredNotifications 
} from '@/lib/server/admin.js';

const NOTIFICATION_TYPES = [
    { value: 'order', label: 'Orders', icon: ShoppingCart, color: 'blue' },
    { value: 'security', label: 'Security', icon: Shield, color: 'red' },
    { value: 'report', label: 'Reports', icon: FileText, color: 'green' },
    { value: 'maintenance', label: 'Maintenance', icon: Settings, color: 'yellow' },
    { value: 'info', label: 'Information', icon: Info, color: 'blue' },
    { value: 'warning', label: 'Warnings', icon: AlertTriangle, color: 'yellow' },
    { value: 'error', label: 'Errors', icon: AlertCircle, color: 'red' }
];

export default function NotificationsPage() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    
    const [notifications, setNotifications] = useState([]);
    const [filteredNotifications, setFilteredNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedNotifications, setSelectedNotifications] = useState([]);
    
    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [typeFilters, setTypeFilters] = useState([]);
    const [priorityFilters, setPriorityFilters] = useState([]);

    // Load all notifications
    const loadNotifications = async () => {
        try {
            setLoading(true);
            
            const result = await getAllNotifications({ 
                userId: user?.email || null 
            });
            
            if (result.success) {
                setNotifications(result.data);
                setFilteredNotifications(result.data);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter notifications based on current filters
    const applyFilters = () => {
        let filtered = notifications;

        // Tab filter
        if (activeTab === 'unread') {
            filtered = filtered.filter(n => !n.isRead);
        } else if (activeTab === 'read') {
            filtered = filtered.filter(n => n.isRead);
        }

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(n => 
                n.title.toLowerCase().includes(query) ||
                n.message.toLowerCase().includes(query) ||
                n.type.toLowerCase().includes(query)
            );
        }

        // Type filter
        if (typeFilters.length > 0) {
            filtered = filtered.filter(n => typeFilters.includes(n.type));
        }

        // Priority filter
        if (priorityFilters.length > 0) {
            filtered = filtered.filter(n => priorityFilters.includes(n.priority));
        }

        setFilteredNotifications(filtered);
    };

    // Apply filters when dependencies change
    useEffect(() => {
        applyFilters();
    }, [notifications, activeTab, searchQuery, typeFilters, priorityFilters]);

    // Load notifications on mount
    useEffect(() => {
        loadNotifications();
        
        // Check for specific notification from URL params
        const notificationId = searchParams.get('notificationId');
        if (notificationId) {
            // You could highlight or scroll to specific notification here
        }
    }, [user?.email, searchParams]);

    // Mark notification as read
    const handleMarkAsRead = async (notificationId) => {
        try {
            const result = await markNotificationAsRead(notificationId, user?.email || null);
            
            if (result.success) {
                setNotifications(prev => 
                    prev.map(n => 
                        n.id === notificationId 
                            ? { ...n, isRead: true, readAt: new Date().toISOString(), readBy: user?.email }
                            : n
                    )
                );
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Mark multiple notifications as read
    const handleMarkSelectedAsRead = async () => {
        if (selectedNotifications.length === 0) return;
        
        try {
            const result = await markMultipleNotificationsAsRead(selectedNotifications, user?.email || null);
            
            if (result.success) {
                setNotifications(prev => 
                    prev.map(n => 
                        selectedNotifications.includes(n.id)
                            ? { ...n, isRead: true, readAt: new Date().toISOString(), readBy: user?.email }
                            : n
                    )
                );
                setSelectedNotifications([]);
            }
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    // Delete notification
    const handleDeleteNotification = async (notificationId) => {
        try {
            const result = await deleteNotification(notificationId);
            
            if (result.success) {
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
                setSelectedNotifications(prev => prev.filter(id => id !== notificationId));
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    // Clean up old notifications
    const handleCleanup = async () => {
        try {
            const result = await cleanupExpiredNotifications();
            if (result.success) {
                await loadNotifications(); // Reload to see changes
            }
        } catch (error) {
            console.error('Error cleaning up notifications:', error);
        }
    };

    // Get notification icon
    const getNotificationIcon = (type, priority) => {
        const typeConfig = NOTIFICATION_TYPES.find(t => t.value === type);
        const IconComponent = typeConfig?.icon || Info;
        
        return (
            <IconComponent className={cn(
                'h-5 w-5',
                `text-${typeConfig?.color || 'blue'}-600`,
                priority === 'critical' && 'text-red-700'
            )} />
        );
    };

    // Format time ago
    const formatTimeAgo = (timestamp) => {
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
            hour: '2-digit',
            minute: '2-digit',
            ...(time.getFullYear() !== now.getFullYear() && { year: 'numeric' })
        }).format(time);
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;
    const totalCount = notifications.length;

    return (
        <div className="space-y-6">
            <AdminHeader
                title="Notifications"
                description={`Manage your notifications and alerts. ${unreadCount} unread of ${totalCount} total.`}>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCleanup}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clean Up
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadNotifications}>
                        <Bell className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                </div>
            </AdminHeader>

            {/* Filters and Controls */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        {/* Search */}
                        <div className="flex-1 max-w-sm">
                            <Input
                                placeholder="Search notifications..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2">
                            {/* Type Filter */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Filter className="mr-2 h-4 w-4" />
                                        Type {typeFilters.length > 0 && `(${typeFilters.length})`}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    {NOTIFICATION_TYPES.map((type) => (
                                        <DropdownMenuCheckboxItem
                                            key={type.value}
                                            checked={typeFilters.includes(type.value)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setTypeFilters([...typeFilters, type.value]);
                                                } else {
                                                    setTypeFilters(typeFilters.filter(t => t !== type.value));
                                                }
                                            }}>
                                            <type.icon className={`mr-2 h-4 w-4 text-${type.color}-600`} />
                                            {type.label}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Priority Filter */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <AlertTriangle className="mr-2 h-4 w-4" />
                                        Priority {priorityFilters.length > 0 && `(${priorityFilters.length})`}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-32">
                                    {['critical', 'high', 'medium', 'low'].map((priority) => (
                                        <DropdownMenuCheckboxItem
                                            key={priority}
                                            checked={priorityFilters.includes(priority)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setPriorityFilters([...priorityFilters, priority]);
                                                } else {
                                                    setPriorityFilters(priorityFilters.filter(p => p !== priority));
                                                }
                                            }}>
                                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    {selectedNotifications.length > 0 && (
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                            <span className="text-sm text-muted-foreground">
                                {selectedNotifications.length} selected
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleMarkSelectedAsRead}>
                                <Check className="mr-2 h-4 w-4" />
                                Mark as Read
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedNotifications([])}>
                                Clear Selection
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Notification Tabs and List */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">
                        All ({totalCount})
                    </TabsTrigger>
                    <TabsTrigger value="unread">
                        Unread ({unreadCount})
                    </TabsTrigger>
                    <TabsTrigger value="read">
                        Read ({totalCount - unreadCount})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <Card key={i}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            <Skeleton className="h-10 w-10 rounded-lg" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-5 w-3/4" />
                                                <Skeleton className="h-4 w-full" />
                                                <Skeleton className="h-4 w-1/2" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                                <CheckCircle className="mb-4 h-12 w-12 text-muted-foreground" />
                                <CardTitle className="mb-2">No Notifications Found</CardTitle>
                                <CardDescription>
                                    {searchQuery || typeFilters.length > 0 || priorityFilters.length > 0
                                        ? 'Try adjusting your filters to see more notifications.'
                                        : activeTab === 'unread' 
                                            ? "You're all caught up! No unread notifications."
                                            : 'No notifications available at this time.'
                                    }
                                </CardDescription>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {filteredNotifications.map((notification) => (
                                <Card 
                                    key={notification.id} 
                                    className={cn(
                                        'transition-all hover:shadow-md',
                                        !notification.isRead && 'border-l-4 border-l-primary bg-accent/20',
                                        notification.priority === 'critical' && 'border-l-red-500',
                                        selectedNotifications.includes(notification.id) && 'ring-2 ring-primary'
                                    )}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            {/* Checkbox */}
                                            <input
                                                type="checkbox"
                                                checked={selectedNotifications.includes(notification.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedNotifications([...selectedNotifications, notification.id]);
                                                    } else {
                                                        setSelectedNotifications(selectedNotifications.filter(id => id !== notification.id));
                                                    }
                                                }}
                                                className="mt-1 rounded border-gray-300"
                                            />

                                            {/* Icon */}
                                            <div className="flex-shrink-0">
                                                <div className={cn(
                                                    'flex h-10 w-10 items-center justify-center rounded-lg',
                                                    notification.type === 'order' && 'bg-blue-50',
                                                    notification.type === 'security' && 'bg-red-50',
                                                    notification.type === 'report' && 'bg-green-50',
                                                    notification.type === 'maintenance' && 'bg-yellow-50',
                                                    notification.type === 'info' && 'bg-blue-50',
                                                    notification.type === 'warning' && 'bg-yellow-50',
                                                    notification.type === 'error' && 'bg-red-50'
                                                )}>
                                                    {getNotificationIcon(notification.type, notification.priority)}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4 mb-2">
                                                    <h3 className={cn(
                                                        'text-lg font-medium',
                                                        !notification.isRead && 'font-semibold'
                                                    )}>
                                                        {notification.title}
                                                    </h3>
                                                    
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <Badge variant={
                                                            notification.priority === 'critical' ? 'destructive' :
                                                            notification.priority === 'high' ? 'default' :
                                                            'secondary'
                                                        }>
                                                            {notification.priority}
                                                        </Badge>
                                                        
                                                        <Badge variant="outline" className="capitalize">
                                                            {notification.type}
                                                        </Badge>
                                                        
                                                        <span className="text-muted-foreground text-sm">
                                                            {formatTimeAgo(notification.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <p className="text-muted-foreground mb-4">
                                                    {notification.message}
                                                </p>

                                                {/* Actions */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {notification.requiresAction && notification.actionLink && (
                                                            <Link href={notification.actionLink}>
                                                                <Button size="sm">
                                                                    {notification.actionText || 'View'}
                                                                    <ExternalLink className="ml-2 h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {!notification.isRead && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleMarkAsRead(notification.id)}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                Mark as Read
                                                            </Button>
                                                        )}
                                                        
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteNotification(notification.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Read status */}
                                                {notification.isRead && notification.readAt && (
                                                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                                                        Read {formatTimeAgo(notification.readAt)}
                                                        {notification.readBy && ` by ${notification.readBy}`}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}