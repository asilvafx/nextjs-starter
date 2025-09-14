"use client"
import { useState, useEffect } from 'react';
import { StatsCard } from '../common/Common';
import { TrendingUp, TrendingDown, Package, CheckCircle, CreditCard, Calendar } from 'lucide-react';

const OrdersQuickStats = ({ orders }) => {
    const [stats, setStats] = useState({
        totalOrders: 0,
        completedOrders: 0,
        currentYearRevenue: 0,
        lastYearRevenue: 0,
        revenueGrowth: 0,
        completionRate: 0,
        currentYearOrders: 0,
        lastYearOrders: 0,
        ordersGrowth: 0
    });

    useEffect(() => {
        if (!orders || orders.length === 0) return;

        const currentYear = new Date().getFullYear();
        const lastYear = currentYear - 1;

        // Filter orders by year
        const currentYearOrders = orders.filter(order => {
            const orderYear = new Date(order.created_at * 1000).getFullYear();
            return orderYear === currentYear;
        });

        const lastYearOrders = orders.filter(order => {
            const orderYear = new Date(order.created_at * 1000).getFullYear();
            return orderYear === lastYear;
        });

        // Calculate completed orders (delivered status)
        const completedOrders = orders.filter(order =>
            order.status === 'delivered' || order.status === 'completed'
        );

        // Calculate current year revenue
        const currentYearRevenue = currentYearOrders.reduce((sum, order) =>
            sum + parseFloat(order.amount || 0), 0
        );

        // Calculate last year revenue
        const lastYearRevenue = lastYearOrders.reduce((sum, order) =>
            sum + parseFloat(order.amount || 0), 0
        );

        // Calculate growth percentages
        const revenueGrowth = lastYearRevenue > 0
            ? ((currentYearRevenue - lastYearRevenue) / lastYearRevenue) * 100
            : currentYearRevenue > 0 ? 100 : 0;

        const ordersGrowth = lastYearOrders.length > 0
            ? ((currentYearOrders.length - lastYearOrders.length) / lastYearOrders.length) * 100
            : currentYearOrders.length > 0 ? 100 : 0;

        // Calculate completion rate
        const completionRate = orders.length > 0
            ? (completedOrders.length / orders.length) * 100
            : 0;

        setStats({
            totalOrders: orders.length,
            completedOrders: completedOrders.length,
            currentYearRevenue,
            lastYearRevenue,
            revenueGrowth,
            completionRate,
            currentYearOrders: currentYearOrders.length,
            lastYearOrders: lastYearOrders.length,
            ordersGrowth
        });
    }, [orders]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    const formatPercentage = (value) => {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(1)}%`;
    };

    return (
        <div className="stats-grid">
            <StatsCard
                title="Total orders"
                value={stats.currentYearOrders.toLocaleString()}
                icon={<Package/>}
            />

            <StatsCard
                title="Completed"
                value={stats.completedOrders.toLocaleString()}
                icon={<CheckCircle />}
            />

            <StatsCard
                title="Total returns"
                value={formatCurrency(stats.currentYearRevenue)}
                icon={<CreditCard />}
            />

            <StatsCard
                title="Year change"
                value={formatPercentage(stats.lastYearRevenue)}
                icon={<Calendar />}
            />
        </div>
    );
};

export default OrdersQuickStats;
