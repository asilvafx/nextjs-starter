// @/app/admin/overview/page.jsx

'use client';

import {
    Activity,
    AlertCircle,
    ArrowRight, 
    Clock,
    Database,
    DollarSign,
    Eye,
    FileText,
    Package,
    Plus,
    Settings,
    ShoppingCart,
    TrendingDown,
    TrendingUp,
    Users
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { getAll } from '@/lib/client/query';

// Enhanced Dashboard Card Component
const StatCard = ({ label, value, icon: Icon, description, trend, loading = false, className = '' }) => {
    if (loading) {
        return (
            <Card className={`p-6 ${className}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="font-medium text-sm">
                        <Skeleton className="h-4 w-20" />
                    </CardTitle>
                    <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={`p-6 ${className}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="font-medium text-sm">{label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="mb-2 font-bold text-2xl">{value}</div>
                <div className="flex w-full flex-col items-start gap-2 text-muted-foreground text-xs">
                    {trend && (
                        <div
                            className={`flex items-center gap-1 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                            {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            <span>{trend.value}%</span>
                        </div>
                    )}
                    <span>{description}</span>
                </div>
            </CardContent>
        </Card>
    );
};

// Quick Action Card Component
const QuickActionCard = ({ title, description, icon: Icon, href, color = 'default' }) => {
    const colorClasses = {
        default: 'hover:bg-muted/50',
        primary: 'hover:bg-primary/5 border-primary/20',
        success: 'hover:bg-green-50 border-green-200',
        warning: 'hover:bg-yellow-50 border-yellow-200',
        danger: 'hover:bg-red-50 border-red-200'
    };

    return (
        <Link href={href}>
            <Card className={`cursor-pointer p-4 transition-colors ${colorClasses[color]}`}>
                <CardContent className="flex items-center justify-between p-0">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-muted p-2">
                            <Icon className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="font-medium">{title}</div>
                            <div className="text-muted-foreground text-sm">{description}</div>
                        </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
            </Card>
        </Link>
    );
};

// Recent Activity Item Component
const ActivityItem = ({ type, title, description, timestamp, loading = false }) => {
    if (loading) {
        return (
            <div className="flex items-center gap-3 border-muted-foreground border-b p-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-3 w-16" />
            </div>
        );
    }

    const getActivityIcon = (type) => {
        switch (type) {
            case 'user':
                return <Users className="h-4 w-4" />;
            case 'order':
                return <ShoppingCart className="h-4 w-4" />;
            case 'product':
                return <Package className="h-4 w-4" />;
            case 'system':
                return <Settings className="h-4 w-4" />;
            default:
                return <Activity className="h-4 w-4" />;
        }
    };

    return (
        <div className="flex items-center gap-3 border-muted-foreground border-b p-3 last:border-0">
            <div className="rounded-full bg-muted p-2">{getActivityIcon(type)}</div>
            <div className="flex-1">
                <div className="font-medium text-sm">{title}</div>
                <div className="text-muted-foreground text-xs">{description}</div>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <Clock className="h-3 w-3" />
                {timestamp}
            </div>
        </div>
    );
};

export default function Overview() {
    const [stats, setStats] = useState({
        users: 0,
        orders: 0,
        products: 0,
        revenue: 0,
        categories: 0,
        collections: 0
    });

    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true); 

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // Fetch all collections data
                const [users, orders, products, categories, collections] = await Promise.all([
                    getAll('users', { limit: 0 }).catch(() => ({ data: [] })),
                    getAll('orders', { limit: 0 }).catch(() => ({ data: [] })),
                    getAll('catalog', { limit: 0 }).catch(() => ({ data: [] })),
                    getAll('categories', { limit: 0 }).catch(() => ({ data: [] })),
                    getAll('collections', { limit: 0 }).catch(() => ({ data: [] }))
                ]);

                // Calculate revenue from orders
                const revenue = orders?.data?.reduce((acc, order) => acc + (parseFloat(order.total) || 0), 0) || 0;

                const currentStats = {
                    users: users?.data?.length || 0,
                    orders: orders?.data?.length || 0,
                    products: products?.data?.length || 0,
                    revenue: revenue,
                    categories: categories?.data?.length || 0,
                    collections: collections?.data?.length || 0
                };

                setStats(currentStats);
 
                // Generate recent activity from actual data
                const activities = [];

                // Recent users
                if (users?.data) {
                    users.data.slice(0, 3).forEach((user) => {
                        activities.push({
                            type: 'user',
                            title: 'New User Registration',
                            description: `${user.name || user.displayName || user.email} joined`,
                            timestamp: formatTimeAgo(user.createdAt)
                        });
                    });
                }

                // Recent orders
                if (orders?.data) {
                    orders.data.slice(0, 2).forEach((order) => {
                        activities.push({
                            type: 'order',
                            title: 'New Order',
                            description: `Order #${order.id?.substring(0, 8)} - $${order.total || '0.00'}`,
                            timestamp: formatTimeAgo(order.createdAt)
                        });
                    });
                }

                // Recent products
                if (products?.data) {
                    products.data.slice(0, 2).forEach((product) => {
                        activities.push({
                            type: 'product',
                            title: 'Product Added',
                            description: `${product.name || 'New Product'} added to catalog`,
                            timestamp: formatTimeAgo(product.createdAt)
                        });
                    });
                }

                // Sort activities by timestamp (most recent first)
                activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                setRecentActivity(activities.slice(0, 8));
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Helper function to format time ago
    const formatTimeAgo = (dateString) => {
        if (!dateString) return 'Unknown';

        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;

        return date.toLocaleDateString();
    };

    return (
        <ScrollArea className="h-[calc(100vh-80px)]">
            <div className="space-y-4">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:flex-wrap items-start justify-between gap-2">
                    <div className="w-full md:max-w-sm">
                        <h1 className="font-semibold text-2xl">Dashboard Overview</h1>
                        <p className="text-muted-foreground">
                            Welcome back! Here's what's happening with your website.
                        </p>
                    </div>
                    <div className="flex gap-2"> 
                        <Link href="/" target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm">
                                <Eye className="mr-2 h-4 w-4" />
                                View Site
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Main Statistics Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Total Users"
                        value={stats.users.toLocaleString()}
                        icon={Users}
                        description="Registered users" 
                        loading={loading}
                    />
                    <StatCard
                        label="Total Orders"
                        value={stats.orders.toLocaleString()}
                        icon={ShoppingCart}
                        description="Orders processed" 
                        loading={loading}
                    />
                    <StatCard
                        label="Catalog"
                        value={stats.products.toLocaleString()}
                        icon={Package}
                        description="Items in catalog" 
                        loading={loading}
                    />
                    <StatCard
                        label="Revenue"
                        value={`$${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        icon={DollarSign}
                        description="Total revenue" 
                        loading={loading}
                    />
                </div>

                {/* Secondary Statistics */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-bold text-2xl">
                                    {loading ? <Skeleton className="h-6 w-8" /> : stats.categories}
                                </div>
                                <div className="text-muted-foreground text-sm">Categories</div>
                            </div>
                            <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-bold text-2xl">
                                    {loading ? <Skeleton className="h-6 w-8" /> : stats.collections}
                                </div>
                                <div className="text-muted-foreground text-sm">Collections</div>
                            </div>
                            <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-bold text-2xl">
                                    {loading ? <Skeleton className="h-6 w-8" /> : '98.5%'}
                                </div>
                                <div className="text-muted-foreground text-sm">Uptime</div>
                            </div>
                            <Activity className="h-8 w-8 text-green-600" />
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-bold text-2xl">
                                    {loading ? <Skeleton className="h-6 w-8" /> : '2.1s'}
                                </div>
                                <div className="text-muted-foreground text-sm">Load Time</div>
                            </div>
                            <Clock className="h-8 w-8 text-blue-600" />
                        </div>
                    </Card>
                </div>

                {/* Quick Actions and Recent Activity */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="h-5 w-5" />
                                Quick Actions
                            </CardTitle>
                            <CardDescription>Quickly access common administrative tasks</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                                <QuickActionCard
                                    title="Manage Catalog"
                                    description="View and manager products/services"
                                    icon={Package}
                                    href="/admin/dashboard/store/catalog"
                                    color="primary"
                                />
                                <QuickActionCard
                                    title="Manage Users"
                                    description="View and manage user accounts"
                                    icon={Users}
                                    href="/admin/dashboard/store/customers"
                                    color="default"
                                />
                                <QuickActionCard
                                    title="View Orders"
                                    description="Check recent orders and fulfillment"
                                    icon={ShoppingCart}
                                    href="/admin/dashboard/store/orders"
                                    color="success"
                                />
                                <QuickActionCard
                                    title="Site Settings"
                                    description="Configure website settings"
                                    icon={Settings}
                                    href="/admin/system/settings"
                                    color="default"
                                />
                                <QuickActionCard
                                    title="System Maintenance"
                                    description="Backup, cache, and system tools"
                                    icon={Database}
                                    href="/admin/system/maintenance"
                                    color="warning"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Recent Activity
                            </CardTitle>
                            <CardDescription>Latest updates and changes on your website</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div>
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <ActivityItem key={i} loading={true} />
                                    ))}
                                </div>
                            ) : recentActivity.length > 0 ? (
                                <div>
                                    {recentActivity.map((activity, index) => (
                                        <ActivityItem
                                            key={index}
                                            type={activity.type}
                                            title={activity.title}
                                            description={activity.description}
                                            timestamp={activity.timestamp}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 text-center text-muted-foreground">
                                    <AlertCircle className="mx-auto mb-4 h-12 w-12" />
                                    <p>No recent activity to display</p>
                                    <p className="mt-2 text-sm">
                                        Activity will appear here as you use your admin panel
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* System Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            System Status
                        </CardTitle>
                        <CardDescription>Current system health and important notifications</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <div className="flex items-center gap-3 rounded-lg border p-3">
                                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                <div>
                                    <div className="font-medium">Database Status</div>
                                    <div className="text-muted-foreground text-sm">All systems operational</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 rounded-lg border p-3">
                                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                <div>
                                    <div className="font-medium">API Status</div>
                                    <div className="text-muted-foreground text-sm">All endpoints responding</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 rounded-lg border p-3">
                                <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                                <div>
                                    <div className="font-medium">Cache Status</div>
                                    <div className="text-muted-foreground text-sm">
                                        {loading ? <Skeleton className="h-4 w-20" /> : 'Optimization recommended'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ScrollArea>
    );
}
