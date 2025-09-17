"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getAll } from "@/lib/client/query";
import { 
  Users,
  ShoppingCart,
  Package,
  DollarSign
} from "lucide-react";

const DashboardCard = ({ label, value, icon: Icon, description }) => (
  <Card className="p-4 border-none shadow-lg">
    <div className="flex items-center gap-4">
      <div className="p-4 rounded-full bg-slate-900 text-white">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  </Card>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    orders: 0,
    products: 0,
    revenue: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, orders, products] = await Promise.all([
          getAll("users", { count: true }),
          getAll("orders", { count: true }),
          getAll("products", { count: true }),
        ]);

        const revenue = orders?.data?.reduce((acc, order) => 
          acc + (order.total || 0), 0) || 0;

        setStats({
          users: users?.data?.length || 0,
          orders: orders?.data?.length || 0,
          products: products?.data?.length || 0,
          revenue: revenue,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your admin dashboard</p>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          label="Total Users"
          value={stats.users}
          icon={Users}
          description="Total registered users"
        />
        <DashboardCard
          label="Total Orders"
          value={stats.orders}
          icon={ShoppingCart}
          description="Orders processed"
        />
        <DashboardCard
          label="Products"
          value={stats.products}
          icon={Package}
          description="Products in catalog"
        />
        <DashboardCard
          label="Revenue"
          value={`$${stats.revenue.toFixed(2)}`}
          icon={DollarSign}
          description="Total revenue"
        />
      </div>
    </div>
  );
}