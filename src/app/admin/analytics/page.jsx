"use client";

import { useEffect, useState } from "react";
import { getAll } from "@/lib/client/query";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  Package,
} from "lucide-react";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const StatCard = ({ title, value, icon: Icon, trend }) => (
  <Card className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
        {trend && (
          <p className={`text-sm ${trend > 0 ? "text-green-500" : "text-red-500"}`}>
            {trend > 0 ? "+" : ""}
            {trend}% from last month
          </p>
        )}
      </div>
      <div className="p-4 bg-primary/10 rounded-full">
        <Icon className="w-6 h-6 text-primary" />
      </div>
    </div>
  </Card>
);

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    revenueGrowth: 0,
    orderGrowth: 0,
    userGrowth: 0,
  });
  const [revenueData, setRevenueData] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [userActivityData, setUserActivityData] = useState([]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [orders, products, users] = await Promise.all([
        getAll("orders"),
        getAll("products"),
        getAll("users"),
      ]);

      // Process orders data
      const ordersData = orders.data || [];
      const currentDate = new Date();
      const lastMonthDate = new Date();
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);

      // Calculate revenue and growth
      const totalRevenue = ordersData.reduce((sum, order) => sum + order.total, 0);
      const lastMonthRevenue = ordersData
        .filter(
          (order) =>
            new Date(order.createdAt) >= lastMonthDate &&
            new Date(order.createdAt) <= currentDate
        )
        .reduce((sum, order) => sum + order.total, 0);

      // Group orders by status
      const ordersByStatus = ordersData.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      // Process revenue by date
      const revenueByDate = ordersData.reduce((acc, order) => {
        const date = new Date(order.createdAt).toLocaleDateString();
        acc[date] = (acc[date] || 0) + order.total;
        return acc;
      }, {});

      // Format revenue data for chart
      const revenueChartData = Object.entries(revenueByDate).map(
        ([date, amount]) => ({
          date,
          amount,
        })
      );

      // Get top selling products
      const productSales = {};
      ordersData.forEach((order) => {
        order.items.forEach((item) => {
          productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
        });
      });

      const topProductsData = (products.data || [])
        .map((product) => ({
          name: product.name,
          sales: productSales[product.id] || 0,
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

      // Calculate user activity
      const userActivity = (users.data || []).reduce((acc, user) => {
        const month = new Date(user.createdAt).toLocaleString('default', { month: 'long' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});

      const userActivityChartData = Object.entries(userActivity).map(
        ([month, count]) => ({
          month,
          users: count,
        })
      );

      setStats({
        totalRevenue,
        totalOrders: ordersData.length,
        totalProducts: (products.data || []).length,
        totalUsers: (users.data || []).length,
        revenueGrowth: lastMonthRevenue ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0,
        orderGrowth: 0, // Calculate based on your requirements
        userGrowth: 0, // Calculate based on your requirements
      });

      setRevenueData(revenueChartData);
      setOrderStatusData(
        Object.entries(ordersByStatus).map(([status, count]) => ({
          status,
          count,
        }))
      );
      setTopProducts(topProductsData);
      setUserActivityData(userActivityChartData);
    } catch (error) {
      toast.error("Failed to fetch analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-80px)]">
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your business performance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={DollarSign}
            trend={stats.revenueGrowth}
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={ShoppingBag}
            trend={stats.orderGrowth}
          />
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon={Package}
          />
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            trend={stats.userGrowth}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#8884d8"
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Order Status Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Orders by Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Top Products Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#82ca9d" name="Sales" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* User Activity Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">User Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#ff7300"
                  name="New Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
}