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

/**
 * Get all orders
 * Server-side function to fetch all orders
 * @returns {Promise<Object>} Orders data
 */
export async function getAllOrders() {
    try {
        const orders = await DBService.readAll('orders');
        const ordersArray = Array.isArray(orders) ? orders : Object.values(orders || {});

        return {
            success: true,
            data: ordersArray
        };
    } catch (error) {
        console.error('Error fetching orders:', error);
        return {
            success: false,
            error: 'Failed to fetch orders',
            message: error.message,
            data: []
        };
    }
}

/**
 * Get all customers
 * Server-side function to fetch all customers
 * @returns {Promise<Object>} Customers data
 */
export async function getAllCustomers() {
    try {
        const customers = await DBService.readAll('customers');
        const customersArray = Array.isArray(customers) ? customers : Object.values(customers || {});

        return {
            success: true,
            data: customersArray
        };
    } catch (error) {
        console.error('Error fetching customers:', error);
        return {
            success: false,
            error: 'Failed to fetch customers',
            message: error.message,
            data: []
        };
    }
}

/**
 * Get all catalog items
 * Server-side function to fetch all catalog products
 * @returns {Promise<Object>} Catalog data
 */
export async function getAllCatalog() {
    try {
        const catalog = await DBService.readAll('catalog');
        const catalogArray = Array.isArray(catalog) ? catalog : Object.values(catalog || {});

        return {
            success: true,
            data: catalogArray
        };
    } catch (error) {
        console.error('Error fetching catalog:', error);
        return {
            success: false,
            error: 'Failed to fetch catalog',
            message: error.message,
            data: []
        };
    }
}

/**
 * Get store settings (public)
 * Server-side function to fetch store settings
 * @returns {Promise<Object>} Store settings data
 */
export async function getStoreSettings() {
    try {
        const settings = await DBService.readAll('site_settings');
        const settingsArray = Array.isArray(settings) ? settings : Object.values(settings || {});

        // Find store settings or return default
        const storeSetting = settingsArray.find((s) => s.key === 'store' || s.type === 'store');

        return {
            success: true,
            data: storeSetting || null
        };
    } catch (error) {
        console.error('Error fetching store settings:', error);
        return {
            success: false,
            error: 'Failed to fetch store settings',
            message: error.message,
            data: null
        };
    }
}

/**
 * Get all store settings
 * Server-side function to fetch all store settings from site_settings collection
 * @returns {Promise<Object>} All store settings data
 */
export async function getAllStoreSettings() {
    try {
        const settings = await DBService.readAll('store_settings');
        const settingsArray = Array.isArray(settings) ? settings : Object.values(settings || {});

        return {
            success: true,
            data: settingsArray
        };
    } catch (error) {
        console.error('Error fetching all store settings:', error);
        return {
            success: false,
            error: 'Failed to fetch all store settings',
            message: error.message,
            data: []
        };
    }
}

/**
 * Update or create store settings
 * Server-side function to save store settings
 * @param {Object} settingsData - The settings data to save
 * @returns {Promise<Object>} Save result
 */
export async function updateStoreSettings(settingsData) {
    try {
        let result;
        
        if (settingsData.id) {
            // Update existing settings
            result = await DBService.update(settingsData.id, settingsData, 'store_settings');
        } else {
            // Create new settings
            const newSettings = {
                ...settingsData,
                id: Date.now().toString(),
                key: 'store',
                type: 'store',
                updatedAt: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };
            result = await DBService.create(newSettings, 'store_settings');
        }

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error updating store settings:', error);
        return {
            success: false,
            error: 'Failed to update store settings',
            message: error.message
        };
    }
}
