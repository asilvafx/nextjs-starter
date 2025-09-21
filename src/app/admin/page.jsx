"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getAll } from "@/lib/client/query";
import Link from "next/link";
import { 
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Eye,
  Settings,
  Database,
  FileText,
  Activity,
  Plus,
  ArrowRight,
  Clock,
  AlertCircle
} from "lucide-react";

// Enhanced Dashboard Card Component
const StatCard = ({ label, value, icon: Icon, description, trend, loading = false, className = "" }) => {
  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
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
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">{value}</div>
        <div className="w-full flex flex-col items-start gap-2 text-xs text-muted-foreground">
          {trend && (
            <div className={`flex items-center gap-1 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
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
const QuickActionCard = ({ title, description, icon: Icon, href, color = "default" }) => {
  const colorClasses = {
    default: "hover:bg-muted/50",
    primary: "hover:bg-primary/5 border-primary/20",
    success: "hover:bg-green-50 border-green-200",
    warning: "hover:bg-yellow-50 border-yellow-200",
    danger: "hover:bg-red-50 border-red-200"
  };

  return (
    <Link href={href}>
      <Card className={`p-4 cursor-pointer transition-colors ${colorClasses[color]}`}>
        <CardContent className="flex items-center justify-between p-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium">{title}</div>
              <div className="text-sm text-muted-foreground">{description}</div>
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
      <div className="flex items-center gap-3 p-3 border-b">
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
      case 'user': return <Users className="h-4 w-4" />;
      case 'order': return <ShoppingCart className="h-4 w-4" />;
      case 'product': return <Package className="h-4 w-4" />;
      case 'system': return <Settings className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 border-b last:border-0">
      <div className="p-2 rounded-full bg-muted">
        {getActivityIcon(type)}
      </div>
      <div className="flex-1">
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {timestamp}
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    orders: 0,
    products: 0,
    revenue: 0,
    categories: 0,
    collections: 0,
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState({});

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch all collections data
        const [users, orders, products, categories, collections] = await Promise.all([
          getAll("users", { limit: 100 }).catch(() => ({ data: [] })),
          getAll("orders", { limit: 100 }).catch(() => ({ data: [] })),
          getAll("catalog", { limit: 100 }).catch(() => ({ data: [] })),
          getAll("categories", { limit: 50 }).catch(() => ({ data: [] })),
          getAll("collections", { limit: 50 }).catch(() => ({ data: [] })),
        ]);

        // Calculate revenue from orders
        const revenue = orders?.data?.reduce((acc, order) => 
          acc + (parseFloat(order.total) || 0), 0) || 0;

        // Calculate trends (mock data - you can implement real trend calculation)
        const calculateTrend = (current, previous) => {
          if (!previous || previous === 0) return null;
          const change = ((current - previous) / previous) * 100;
          return {
            positive: change >= 0,
            value: Math.abs(change).toFixed(1)
          };
        };

        // Mock previous period data for trend calculation
        const previousStats = {
          users: Math.max(0, (users?.data?.length || 0) - Math.floor(Math.random() * 10)),
          orders: Math.max(0, (orders?.data?.length || 0) - Math.floor(Math.random() * 5)),
          products: Math.max(0, (products?.data?.length || 0) - Math.floor(Math.random() * 3)),
          revenue: Math.max(0, revenue - Math.floor(Math.random() * 500))
        };

        const currentStats = {
          users: users?.data?.length || 0,
          orders: orders?.data?.length || 0,
          products: products?.data?.length || 0,
          revenue: revenue,
          categories: categories?.data?.length || 0,
          collections: collections?.data?.length || 0,
        };

        setStats(currentStats);
        
        setTrends({
          users: calculateTrend(currentStats.users, previousStats.users),
          orders: calculateTrend(currentStats.orders, previousStats.orders),
          products: calculateTrend(currentStats.products, previousStats.products),
          revenue: calculateTrend(currentStats.revenue, previousStats.revenue),
        });

        // Generate recent activity from actual data
        const activities = [];
        
        // Recent users
        if (users?.data) {
          users.data.slice(0, 3).forEach(user => {
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
          orders.data.slice(0, 2).forEach(order => {
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
          products.data.slice(0, 2).forEach(product => {
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
        console.error("Error fetching dashboard data:", error);
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
      <div className="flex flex-wrap gap-2 justify-between items-start">
        <div className="w-full md:max-w-sm">
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening with your website.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Last 30 days
          </Button>
          <Link href="/" target="_blank" rel="noopener noreferrer">  
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View Site
          </Button>
          </Link>
        </div>
      </div>

      {/* Main Statistics Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={stats.users.toLocaleString()}
          icon={Users}
          description="Registered users"
          trend={trends.users}
          loading={loading}
        />
        <StatCard
          label="Total Orders"
          value={stats.orders.toLocaleString()}
          icon={ShoppingCart}
          description="Orders processed"
          trend={trends.orders}
          loading={loading}
        />
        <StatCard
          label="Catalog"
          value={stats.products.toLocaleString()}
          icon={Package}
          description="Items in catalog"
          trend={trends.products}
          loading={loading}
        />
        <StatCard
          label="Revenue"
          value={`$${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          description="Total revenue"
          trend={trends.revenue}
          loading={loading}
        />
      </div>

      {/* Secondary Statistics */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {loading ? <Skeleton className="h-6 w-8" /> : stats.categories}
              </div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {loading ? <Skeleton className="h-6 w-8" /> : stats.collections}
              </div>
              <div className="text-sm text-muted-foreground">Collections</div>
            </div>
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {loading ? <Skeleton className="h-6 w-8" /> : '98.5%'}
              </div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <Activity className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {loading ? <Skeleton className="h-6 w-8" /> : '2.1s'}
              </div>
              <div className="text-sm text-muted-foreground">Load Time</div>
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
            <CardDescription>
              Quickly access common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1">
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
            <CardDescription>
              Latest updates and changes on your website
            </CardDescription>
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
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                <p>No recent activity to display</p>
                <p className="text-sm mt-2">Activity will appear here as you use your admin panel</p>
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
          <CardDescription>
            Current system health and important notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="font-medium">Database Status</div>
                <div className="text-sm text-muted-foreground">All systems operational</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="font-medium">API Status</div>
                <div className="text-sm text-muted-foreground">All endpoints responding</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
              <div>
                <div className="font-medium">Cache Status</div>
                <div className="text-sm text-muted-foreground">
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