// app/dashboard/hooks/useDashboardData.js
import { useState, useEffect } from 'react';

// Mock data - replace with actual API calls
const mockData = {
    stats: {
        totalUsers: 1248,
        totalOrders: 892,
        totalRevenue: 15420,
        totalProducts: 156
    },
    recentOrders: [
        { id: '001', customer: 'John Doe', product: 'Cool Tag', amount: '$9.99', status: 'active', date: '2025-01-15' },
        { id: '002', customer: 'Jane Smith', product: 'Collar + Tag', amount: '$14.99', status: 'pending', date: '2025-01-14' },
        { id: '003', customer: 'Mike Johnson', product: 'Crystal Set', amount: '$45.00', status: 'active', date: '2025-01-13' }
    ],
    recentUsers: [
        { id: '001', name: 'Alice Wilson', email: 'alice@example.com', role: 'Customer', status: 'active', joined: '2025-01-10' },
        { id: '002', name: 'Bob Brown', email: 'bob@example.com', role: 'Customer', status: 'inactive', joined: '2025-01-09' }
    ],
    products: [
        { id: '001', name: 'Cool Tag', category: 'Product', price: '$9.99', stock: 150, status: 'active' },
        { id: '002', name: 'Collar + Tag', category: 'Product', price: '$14.99', stock: 75, status: 'active' },
        { id: '003', name: 'Tarot Reading', category: 'Service', price: '$15.00', stock: 'N/A', status: 'active' }
    ]
};

export const useDashboardData = () => {
    const [data, setData] = useState(mockData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Simulate API call
    const fetchData = async () => {
        setLoading(true);
        try {
            // Replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            setData(mockData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return { data, loading, error, refetch: fetchData };
};

// app/dashboard/hooks/useStatsCalculation.js
export const useStatsCalculation = (currentData) => {
    const calculateTrend = (current, previous) => {
        if (!previous) return { value: 0, direction: 'neutral' };
        const change = ((current - previous) / previous) * 100;
        return {
            value: Math.abs(change).toFixed(1),
            direction: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'
        };
    };

    const statsCards = [
        {
            title: 'Total Users',
            value: currentData.stats.totalUsers.toLocaleString(),
            icon: '👥',
            trend: calculateTrend(currentData.stats.totalUsers, 1150)
        },
        {
            title: 'Total Orders',
            value: currentData.stats.totalOrders.toLocaleString(),
            icon: '🛒',
            trend: calculateTrend(currentData.stats.totalOrders, 820)
        },
        {
            title: 'Revenue',
            value: `${currentData.stats.totalRevenue.toLocaleString()}`,
            icon: '💰',
            trend: calculateTrend(currentData.stats.totalRevenue, 14200)
        },
        {
            title: 'Products',
            value: currentData.stats.totalProducts.toLocaleString(),
            icon: '📦',
            trend: calculateTrend(currentData.stats.totalProducts, 142)
        }
    ];

    return { statsCards };
};
