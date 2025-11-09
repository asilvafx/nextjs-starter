// src/lib/server/admin.js
'use server';

import DBService from '@/data/rest.db.js';

/**
 * Get all dashboard statistics
 * Server-side function to fetch aggregated dashboard data
 * @returns {Promise<Object>} Dashboard statistics
 */
export async function getDashboardStats() {
    try {
        // Fetch all collections in parallel
        const [users, orders, products, categories, collections] = await Promise.all([
            DBService.readAll('users').catch(() => ({})),
            DBService.readAll('orders').catch(() => ({})),
            DBService.readAll('catalog').catch(() => ({})),
            DBService.readAll('categories').catch(() => ({})),
            DBService.readAll('collections').catch(() => ({}))
        ]);

        // Convert to arrays if needed
        const usersArray = Array.isArray(users) ? users : Object.values(users || {});
        const ordersArray = Array.isArray(orders) ? orders : Object.values(orders || {});
        const productsArray = Array.isArray(products) ? products : Object.values(products || {});
        const categoriesArray = Array.isArray(categories) ? categories : Object.values(categories || {});
        const collectionsArray = Array.isArray(collections) ? collections : Object.values(collections || {});

        // Calculate revenue from orders
        const revenue = ordersArray.reduce((acc, order) => {
            return acc + (parseFloat(order.total) || 0);
        }, 0);

        // Sort by created date (newest first)
        const sortByDate = (arr) => {
            return arr.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                return dateB - dateA;
            });
        };

        // Prepare response data
        return {
            success: true,
            data: {
                counts: {
                    users: usersArray.length,
                    orders: ordersArray.length,
                    products: productsArray.length,
                    categories: categoriesArray.length,
                    collections: collectionsArray.length
                },
                revenue: revenue,
                recentActivity: {
                    users: sortByDate([...usersArray])
                        .slice(0, 3)
                        .map((user) => ({
                            id: user.id,
                            name: user.name || user.displayName || user.email,
                            email: user.email,
                            createdAt: user.createdAt
                        })),
                    orders: sortByDate([...ordersArray])
                        .slice(0, 2)
                        .map((order) => ({
                            id: order.id,
                            total: order.total,
                            status: order.status,
                            createdAt: order.createdAt
                        })),
                    products: sortByDate([...productsArray])
                        .slice(0, 2)
                        .map((product) => ({
                            id: product.id,
                            name: product.name,
                            createdAt: product.createdAt
                        }))
                }
            }
        };
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return {
            success: false,
            error: 'Failed to fetch dashboard statistics',
            message: error.message
        };
    }
}
