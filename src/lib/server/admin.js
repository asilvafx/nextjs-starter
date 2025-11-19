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
 * Get all categories
 * Server-side function to fetch all categories
 * @returns {Promise<Object>} Categories data
 */
export async function getAllCategories() {
    try {
        const categories = await DBService.readAll('categories');
        const categoriesArray = Array.isArray(categories) ? categories : Object.values(categories || {});

        return {
            success: true,
            data: categoriesArray
        };
    } catch (error) {
        console.error('Error fetching categories:', error);
        return {
            success: false,
            error: 'Failed to fetch categories',
            message: error.message,
            data: []
        };
    }
}

/**
 * Get all collections
 * Server-side function to fetch all collections
 * @returns {Promise<Object>} Collections data
 */
export async function getAllCollections() {
    try {
        const collections = await DBService.readAll('collections');
        const collectionsArray = Array.isArray(collections) ? collections : Object.values(collections || {});

        return {
            success: true,
            data: collectionsArray
        };
    } catch (error) {
        console.error('Error fetching collections:', error);
        return {
            success: false,
            error: 'Failed to fetch collections',
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

// USER MANAGEMENT UTILITY FUNCTIONS (NOT SERVER ACTIONS)
// These functions can be imported directly into client components

/**
 * Get all users utility function
 * @param {Object} params - Query parameters (page, limit, etc.)
 * @returns {Promise<Object>} Users data
 */
export async function getAllUsers(params = {}) {
    try {
        const users = await DBService.readAll('users');
        const usersArray = Array.isArray(users) ? users : Object.values(users || {});

        // Apply pagination if specified
        let filteredUsers = usersArray;
        if (params.page && params.limit) {
            const page = parseInt(params.page, 10);
            const limit = parseInt(params.limit, 10);
            const offset = (page - 1) * limit;
            filteredUsers = usersArray.slice(offset, offset + limit);
        }

        return {
            success: true,
            data: filteredUsers,
            total: usersArray.length
        };
    } catch (error) {
        console.error('Error fetching users:', error);
        return {
            success: false,
            error: 'Failed to fetch users',
            message: error.message,
            data: []
        };
    }
}

/**
 * Get all roles utility function
 * @returns {Promise<Object>} Roles data
 */
export async function getAllRoles() {
    try {
        const roles = await DBService.readAll('roles');
        const rolesArray = Array.isArray(roles) ? roles : Object.values(roles || {});

        return {
            success: true,
            data: rolesArray
        };
    } catch (error) {
        console.error('Error fetching roles:', error);
        return {
            success: false,
            error: 'Failed to fetch roles',
            message: error.message,
            data: []
        };
    }
}

/**
 * Create a new user utility function
 * @param {Object} userData - User data to create
 * @returns {Promise<Object>} Created user data
 */
export async function createUser(userData) {
    try {
        const timeNow = new Date().toISOString();
        const newUser = {
            ...userData,
            id: userData.id || Date.now().toString(),
            createdAt: timeNow,
            updatedAt: timeNow
        };

        const result = await DBService.create(newUser, 'users');

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error creating user:', error);
        return {
            success: false,
            error: 'Failed to create user',
            message: error.message
        };
    }
}

/**
 * Update a user utility function
 * @param {string} userIdentifier - Email of the user to update
 * @param {Object} userData - User data to update
 * @returns {Promise<Object>} Updated user data
 */
export async function updateUser(userIdentifier, userData) {
    try {
        // First, find the user key using getItemKey function with email
        const userKey = await DBService.getItemKey('email', userIdentifier, 'users');
        if (!userKey) {
            return {
                success: false,
                error: 'User not found',
                message: `User with email '${userIdentifier}' does not exist`
            };
        }

        const updateData = {
            ...userData,
            updatedAt: new Date().toISOString()
        };

        console.log('Updating user with key:', userKey, 'data:', updateData);
        const result = await DBService.update(userKey, updateData, 'users');
        console.log('Update result:', result);

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error updating user:', error);
        return {
            success: false,
            error: 'Failed to update user',
            message: error.message
        };
    }
}

/**
 * Delete a user utility function
 * @param {string} userIdentifier - Email of the user to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteUser(userIdentifier) {
    try {
        // First, find the user key using getItemKey function with email
        const userKey = await DBService.getItemKey('email', userIdentifier, 'users');
        if (!userKey) {
            return {
                success: false,
                error: 'User not found',
                message: `User with email '${userIdentifier}' does not exist`
            };
        }

        console.log('Deleting user with key:', userKey);
        const result = await DBService.delete(userKey, 'users');
        console.log('Delete result:', result);

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error deleting user:', error);
        return {
            success: false,
            error: 'Failed to delete user',
            message: error.message
        };
    }
}

// ROLE MANAGEMENT UTILITY FUNCTIONS (NOT SERVER ACTIONS)
// These functions can be imported directly into client components

/**
 * Create a new role utility function
 * @param {Object} roleData - Role data to create
 * @returns {Promise<Object>} Created role data
 */
export async function createRole(roleData) {
    try {
        const timeNow = new Date().toISOString();
        const newRole = {
            ...roleData,
            id: roleData.id || Date.now().toString(),
            createdAt: timeNow,
            updatedAt: timeNow
        };

        const result = await DBService.create(newRole, 'roles');

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error creating role:', error);
        return {
            success: false,
            error: 'Failed to create role',
            message: error.message
        };
    }
}

/**
 * Update a role utility function
 * @param {string} roleId - Id of the role to update
 * @param {Object} roleData - Role data to update
 * @returns {Promise<Object>} Updated role data
 */
export async function updateRole(roleId, roleData) {
    try {
        // First, find the role key using getItemKey function
        const roleKey = await DBService.getItemKey('id', roleId, 'roles');
        if (!roleKey) {
            return {
                success: false,
                error: 'Role not found',
                message: `Role with id '${roleId}' does not exist`
            };
        }

        const updateData = {
            ...roleData,
            updatedAt: new Date().toISOString()
        };

        console.log('Updating role with key:', roleKey, 'data:', updateData);
        const result = await DBService.update(roleKey, updateData, 'roles');
        console.log('Role update result:', result);

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error updating role:', error);
        return {
            success: false,
            error: 'Failed to update role',
            message: error.message
        };
    }
}

/**
 * Delete a role utility function
 * @param {string} roleId - ID of the role to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteRole(roleId) {
    try {
        // First, find the role key using getItemKey function
        const roleKey = await DBService.getItemKey('id', roleId, 'roles');
        if (!roleKey) {
            return {
                success: false,
                error: 'Role not found',
                message: `Role with id '${roleId}' does not exist`
            };
        }

        console.log('Deleting role with key:', roleKey);
        const result = await DBService.delete(roleKey, 'roles');
        console.log('Role delete result:', result);

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error deleting role:', error);
        return {
            success: false,
            error: 'Failed to delete role',
            message: error.message
        };
    }
}

/**
 * Get user role utility function
 * @param {string} userId - ID of the user to get role for
 * @returns {Promise<Object>} User role data
 */
export async function getUserRole(userId) {
    try {
        const user = await DBService.read(userId, 'users');
        if (!user) {
            return {
                success: false,
                error: 'User not found',
                data: null
            };
        }

        const userRole = user.role || 'user'; // Default to 'user' role
        
        // Get the full role details
        const roles = await DBService.readAll('roles');
        const rolesArray = Array.isArray(roles) ? roles : Object.values(roles || {});
        const roleDetails = rolesArray.find(role => role.title?.toLowerCase() === userRole.toLowerCase());

        return {
            success: true,
            data: {
                role: userRole,
                routes: roleDetails?.routes || [],
                roleDetails: roleDetails
            }
        };
    } catch (error) {
        console.error('Error fetching user role:', error);
        return {
            success: false,
            error: 'Failed to fetch user role',
            message: error.message,
            data: null
        };
    }
}

// CUSTOMER MANAGEMENT UTILITY FUNCTIONS (NOT SERVER ACTIONS)
// These functions can be imported directly into client components

/**
 * Create a new customer utility function
 * @param {Object} customerData - Customer data to create
 * @returns {Promise<Object>} Created customer data
 */
export async function createCustomer(customerData) {
    try {
        const timeNow = new Date().toISOString();
        const newCustomer = {
            ...customerData,
            id: customerData.id || Date.now().toString(),
            createdAt: timeNow,
            updatedAt: timeNow
        };

        const result = await DBService.create(newCustomer, 'customers');

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error creating customer:', error);
        return {
            success: false,
            error: 'Failed to create customer',
            message: error.message
        };
    }
}

/**
 * Update a customer utility function
 * @param {string} customerId - ID of the customer to update
 * @param {Object} customerData - Customer data to update
 * @returns {Promise<Object>} Updated customer data
 */
export async function updateCustomer(customerId, customerData) {
    try {
        // First, find the customer key using getItemKey function
        const customerKey = await DBService.getItemKey('id', customerId, 'customers');
        if (!customerKey) {
            return {
                success: false,
                error: 'Customer not found',
                message: `Customer with id '${customerId}' does not exist`
            };
        }

        const updateData = {
            ...customerData,
            updatedAt: new Date().toISOString()
        };

        console.log('Updating customer with key:', customerKey, 'data:', updateData);
        const result = await DBService.update(customerKey, updateData, 'customers');
        console.log('Customer update result:', result);

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error updating customer:', error);
        return {
            success: false,
            error: 'Failed to update customer',
            message: error.message
        };
    }
}

// ORDER MANAGEMENT UTILITY FUNCTIONS (NOT SERVER ACTIONS)
// These functions can be imported directly into client components

/**
 * Create a new order utility function
 * @param {Object} orderData - Order data to create
 * @returns {Promise<Object>} Created order data
 */
export async function createOrder(orderData) {
    try {
        const timeNow = new Date().toISOString();
        const newOrder = {
            ...orderData,
            id: orderData.id || Date.now().toString(),
            createdAt: timeNow,
            updatedAt: timeNow
        };

        const result = await DBService.create(newOrder, 'orders');

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error creating order:', error);
        return {
            success: false,
            error: 'Failed to create order',
            message: error.message
        };
    }
}

/**
 * Update an order utility function
 * @param {string} orderId - ID of the order to update
 * @param {Object} orderData - Order data to update
 * @returns {Promise<Object>} Updated order data
 */
export async function updateOrder(orderId, orderData) {
    try {
        // First, find the order key using getItemKey function
        const orderKey = await DBService.getItemKey('id', orderId, 'orders');
        if (!orderKey) {
            return {
                success: false,
                error: 'Order not found',
                message: `Order with id '${orderId}' does not exist`
            };
        }

        const updateData = {
            ...orderData,
            updatedAt: new Date().toISOString()
        };

        console.log('Updating order with key:', orderKey, 'data:', updateData);
        const result = await DBService.update(orderKey, updateData, 'orders');
        console.log('Order update result:', result);

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error updating order:', error);
        return {
            success: false,
            error: 'Failed to update order',
            message: error.message
        };
    }
}

/**
 * Delete an order utility function
 * @param {string} orderId - ID of the order to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteOrder(orderId) {
    try {
        // First, find the order key using getItemKey function
        const orderKey = await DBService.getItemKey('id', orderId, 'orders');
        if (!orderKey) {
            return {
                success: false,
                error: 'Order not found',
                message: `Order with id '${orderId}' does not exist`
            };
        }

        console.log('Deleting order with key:', orderKey);
        const result = await DBService.delete(orderKey, 'orders');
        console.log('Order delete result:', result);

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error deleting order:', error);
        return {
            success: false,
            error: 'Failed to delete order',
            message: error.message
        };
    }
}

/**
 * Get order by ID utility function
 * @param {string} orderId - ID of the order to get
 * @returns {Promise<Object>} Order data
 */
export async function getOrderById(orderId) {
    try {
        const order = await DBService.getItemByKey('id', orderId, 'orders');
        if (!order) {
            return {
                success: false,
                error: 'Order not found',
                data: null
            };
        }

        return {
            success: true,
            data: order
        };
    } catch (error) {
        console.error('Error fetching order:', error);
        return {
            success: false,
            error: 'Failed to fetch order',
            message: error.message,
            data: null
        };
    }
}

// SETTINGS MANAGEMENT WITH CACHING
// In-memory cache for settings to avoid repeated database queries
let settingsCache = {
    site_settings: null,
    store_settings: null,
    site_settings_timestamp: null,
    store_settings_timestamp: null
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Clear settings cache (for maintenance/admin use)
 */
export async function clearSettingsCache() {
    settingsCache = {
        site_settings: null,
        store_settings: null,
        site_settings_timestamp: null,
        store_settings_timestamp: null
    };
    console.log('Settings cache cleared');
    return { success: true, message: 'Settings cache cleared successfully' };
}

/**
 * Check if cache is valid for a given type
 */
function isCacheValid(type) {
    const timestamp = settingsCache[`${type}_timestamp`];
    if (!timestamp) return false;
    return (Date.now() - timestamp) < CACHE_DURATION;
}

/**
 * Get site settings with caching
 * @returns {Promise<Object>} Site settings data
 */
export async function getSiteSettings() {
    try {
        // Check cache first
        if (isCacheValid('site_settings') && settingsCache.site_settings) {
            console.log('Returning cached site settings');
            return {
                success: true,
                data: settingsCache.site_settings,
                cached: true
            };
        }

        console.log('Fetching fresh site settings from database');
        const settings = await DBService.readAll('site_settings');
        const settingsArray = Array.isArray(settings) ? settings : Object.values(settings || {});

        // Find main site settings or use first entry
        const siteSettings = settingsArray.find((s) => s.key === 'main' || s.type === 'main') || settingsArray[0] || {};

        // Update cache
        settingsCache.site_settings = siteSettings;
        settingsCache.site_settings_timestamp = Date.now();

        return {
            success: true,
            data: siteSettings
        };
    } catch (error) {
        console.error('Error fetching site settings:', error);
        return {
            success: false,
            error: 'Failed to fetch site settings',
            message: error.message,
            data: {}
        };
    }
}

/**
 * Get store settings with caching
 * @returns {Promise<Object>} Store settings data
 */
export async function getCachedStoreSettings() {
    try {
        // Check cache first
        if (isCacheValid('store_settings') && settingsCache.store_settings) {
            console.log('Returning cached store settings');
            return {
                success: true,
                data: settingsCache.store_settings,
                cached: true
            };
        }

        console.log('Fetching fresh store settings from database');
        const settings = await DBService.readAll('store_settings');
        const settingsArray = Array.isArray(settings) ? settings : Object.values(settings || {});

        // Find main store settings or use first entry
        const storeSettings = settingsArray.find((s) => s.key === 'store' || s.type === 'store') || settingsArray[0] || {};

        // Update cache
        settingsCache.store_settings = storeSettings;
        settingsCache.store_settings_timestamp = Date.now();

        return {
            success: true,
            data: storeSettings
        };
    } catch (error) {
        console.error('Error fetching store settings:', error);
        return {
            success: false,
            error: 'Failed to fetch store settings',
            message: error.message,
            data: {}
        };
    }
}

/**
 * Get both site and store settings in one call
 * @returns {Promise<Object>} Combined settings data
 */
export async function getAllSettings() {
    try {
        const [siteResult, storeResult] = await Promise.all([
            getSiteSettings(),
            getCachedStoreSettings()
        ]);

        return {
            success: true,
            data: {
                site: siteResult.success ? siteResult.data : {},
                store: storeResult.success ? storeResult.data : {}
            }
        };
    } catch (error) {
        console.error('Error fetching all settings:', error);
        return {
            success: false,
            error: 'Failed to fetch settings',
            message: error.message,
            data: {
                site: {},
                store: {}
            }
        };
    }
}
