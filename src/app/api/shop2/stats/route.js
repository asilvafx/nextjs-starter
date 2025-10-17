// app/api/shop/stats/route.js
import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';
import { withAdminAuth } from '@/lib/server/auth.js';

// GET shop statistics - admin only
async function getStatsHandler(request) {
    try {
        // Get all items
        const items = await DBService.readAll("shop_items") || [];

        // Calculate basic statistics
        const totalItems = items.length;
        const activeItems = items.filter(item => item.isActive !== false).length;
        const inactiveItems = totalItems - activeItems;

        // Calculate total inventory value
        const totalValue = items.reduce((sum, item) => {
            return sum + (item.price * (item.stock || 0));
        }, 0);

        // Calculate average price
        const averagePrice = totalItems > 0
            ? items.reduce((sum, item) => sum + item.price, 0) / totalItems
            : 0;

        // Get category breakdown
        const categoryStats = {};
        items.forEach(item => {
            const category = item.category || 'uncategorized';
            if (!categoryStats[category]) {
                categoryStats[category] = {
                    count: 0,
                    totalValue: 0,
                    totalStock: 0
                };
            }
            categoryStats[category].count++;
            categoryStats[category].totalValue += item.price * (item.stock || 0);
            categoryStats[category].totalStock += item.stock || 0;
        });

        // Get low stock items (stock < 10)
        const lowStockItems = items.filter(item => (item.stock || 0) < 10);

        // Get out of stock items
        const outOfStockItems = items.filter(item => (item.stock || 0) === 0);

        // Get top 5 most expensive items
        const topExpensiveItems = items
            .sort((a, b) => b.price - a.price)
            .slice(0, 5)
            .map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                category: item.category
            }));

        const stats = {
            overview: {
                totalItems,
                activeItems,
                inactiveItems,
                totalCategories: Object.keys(categoryStats).length,
                totalInventoryValue: Math.round(totalValue * 100) / 100,
                averagePrice: Math.round(averagePrice * 100) / 100
            },
            inventory: {
                totalStock: items.reduce((sum, item) => sum + (item.stock || 0), 0),
                lowStockCount: lowStockItems.length,
                outOfStockCount: outOfStockItems.length,
                lowStockItems: lowStockItems.slice(0, 10), // Limit to 10 items
                outOfStockItems: outOfStockItems.slice(0, 10)
            },
            categories: Object.entries(categoryStats).map(([name, stats]) => ({
                name,
                ...stats,
                averagePrice: stats.count > 0 ? Math.round((stats.totalValue / stats.totalStock) * 100) / 100 : 0
            })),
            topItems: topExpensiveItems
        };

        return NextResponse.json({
            success: true,
            data: stats,
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Get shop stats error:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve shop statistics.' },
            { status: 500 }
        );
    }
}

export const GET = withAdminAuth(getStatsHandler);
