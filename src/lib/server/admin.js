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
 * Server-side function to fetch all orders with pagination support
 * @param {Object} params - Query parameters (page, limit, search, statusFilter, etc.)
 * @returns {Promise<Object>} Orders data with pagination info
 */
export async function getAllOrders(params = {}) {
    try {
        const { page = 1, limit = 10, search = '', statusFilter = 'all' } = params;
        
        const allOrders = await DBService.readAll('orders');
        
        if (!allOrders || Object.keys(allOrders).length === 0) {
            return {
                success: true,
                data: [],
                pagination: {
                    totalItems: 0,
                    currentPage: 1,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false
                }
            };
        }

        // Convert object to array
        let ordersArray = Array.isArray(allOrders) ? allOrders : Object.entries(allOrders).map(([key, value]) => ({
            id: key,
            ...value
        }));

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            ordersArray = ordersArray.filter(order => 
                (order.customer?.email && order.customer.email.toLowerCase().includes(searchLower)) ||
                (order.customer?.firstName && order.customer.firstName.toLowerCase().includes(searchLower)) ||
                (order.customer?.lastName && order.customer.lastName.toLowerCase().includes(searchLower)) ||
                (order.id && order.id.toLowerCase().includes(searchLower))
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            ordersArray = ordersArray.filter(order => order.status === statusFilter);
        }

        // Sort by creation date (newest first)
        ordersArray.sort((a, b) => {
            const aDate = new Date(a.createdAt || a.id);
            const bDate = new Date(b.createdAt || b.id);
            return bDate - aDate;
        });

        // Calculate pagination
        const totalItems = ordersArray.length;
        const totalPages = Math.ceil(totalItems / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedOrders = ordersArray.slice(startIndex, endIndex);

        return {
            success: true,
            data: paginatedOrders,
            pagination: {
                totalItems,
                currentPage: page,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    } catch (error) {
        console.error('Error fetching orders:', error);
        return {
            success: false,
            error: 'Failed to fetch orders',
            message: error.message,
            data: [],
            pagination: {
                totalItems: 0,
                currentPage: 1,
                totalPages: 0,
                hasNext: false,
                hasPrev: false
            }
        };
    }
}

/**
 * Get all customers
 * Server-side function to fetch all customers with pagination support
 * @param {Object} params - Query parameters (page, limit, search, etc.)
 * @returns {Promise<Object>} Customers data with pagination info
 */
export async function getAllCustomers(params = {}) {
    try {
        const { page = 1, limit = 10, search = '' } = params;
        
        const allCustomers = await DBService.readAll('customers');
        
        if (!allCustomers || Object.keys(allCustomers).length === 0) {
            return {
                success: true,
                data: [],
                pagination: {
                    totalItems: 0,
                    currentPage: 1,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false
                }
            };
        }

        // Convert object to array
        let customersArray = Array.isArray(allCustomers) ? allCustomers : Object.entries(allCustomers).map(([key, value]) => ({
            id: key,
            ...value
        }));

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            customersArray = customersArray.filter(customer => 
                (customer.firstName && customer.firstName.toLowerCase().includes(searchLower)) ||
                (customer.lastName && customer.lastName.toLowerCase().includes(searchLower)) ||
                (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
                (customer.phone && customer.phone.toLowerCase().includes(searchLower))
            );
        }

        // Sort by creation date (newest first)
        customersArray.sort((a, b) => {
            const aDate = new Date(a.createdAt || a.id);
            const bDate = new Date(b.createdAt || b.id);
            return bDate - aDate;
        });

        // Calculate pagination
        const totalItems = customersArray.length;
        const totalPages = Math.ceil(totalItems / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedCustomers = customersArray.slice(startIndex, endIndex);

        return {
            success: true,
            data: paginatedCustomers,
            pagination: {
                totalItems,
                currentPage: page,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    } catch (error) {
        console.error('Error fetching customers:', error);
        return {
            success: false,
            error: 'Failed to fetch customers',
            message: error.message,
            data: [],
            pagination: {
                totalItems: 0,
                currentPage: 1,
                totalPages: 0,
                hasNext: false,
                hasPrev: false
            }
        };
    }
}

/**
 * Get all catalog items
 * Server-side function to fetch all catalog products with pagination support
 * @param {Object} params - Query parameters (page, limit, search, categoryId, etc.)
 * @returns {Promise<Object>} Catalog data with pagination info
 */
export async function getAllCatalog(params = {}) {
    try {
        const { page = 1, limit = 10, search = '', categoryId = '' } = params;
        
        const allCatalog = await DBService.readAll('catalog');
        
        if (!allCatalog || Object.keys(allCatalog).length === 0) {
            return {
                success: true,
                data: [],
                pagination: {
                    totalItems: 0,
                    currentPage: 1,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false
                }
            };
        }

        // Convert object to array
        let catalogArray = Array.isArray(allCatalog) ? allCatalog : Object.entries(allCatalog).map(([key, value]) => ({
            id: key,
            ...value
        }));

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            catalogArray = catalogArray.filter(item => 
                (item.name && item.name.toLowerCase().includes(searchLower)) ||
                (item.description && item.description.toLowerCase().includes(searchLower)) ||
                (item.sku && item.sku.toLowerCase().includes(searchLower))
            );
        }

        // Apply category filter
        if (categoryId) {
            catalogArray = catalogArray.filter(item => item.categoryId === categoryId);
        }

        // Sort by creation date (newest first)
        catalogArray.sort((a, b) => {
            const aDate = new Date(a.createdAt || a.id);
            const bDate = new Date(b.createdAt || b.id);
            return bDate - aDate;
        });

        // Calculate pagination
        const totalItems = catalogArray.length;
        const totalPages = Math.ceil(totalItems / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedCatalog = catalogArray.slice(startIndex, endIndex);

        return {
            success: true,
            data: paginatedCatalog,
            pagination: {
                totalItems,
                currentPage: page,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    } catch (error) {
        console.error('Error fetching catalog:', error);
        return {
            success: false,
            error: 'Failed to fetch catalog',
            message: error.message,
            data: [],
            pagination: {
                totalItems: 0,
                currentPage: 1,
                totalPages: 0,
                hasNext: false,
                hasPrev: false
            }
        };
    }
}

/**
 * Get all categories
 * Server-side function to fetch all categories with pagination support
 * @param {Object} params - Query parameters (page, limit, search, etc.)
 * @returns {Promise<Object>} Categories data with pagination info
 */
export async function getAllCategories(params = {}) {
    try {
        const { page = 1, limit = 10, search = '' } = params;
        
        const allCategories = await DBService.readAll('categories');
        
        if (!allCategories || Object.keys(allCategories).length === 0) {
            return {
                success: true,
                data: [],
                pagination: {
                    totalItems: 0,
                    currentPage: 1,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false
                }
            };
        }

        // Convert object to array
        let categoriesArray = Array.isArray(allCategories) ? allCategories : Object.entries(allCategories).map(([key, value]) => ({
            id: key,
            ...value
        }));

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            categoriesArray = categoriesArray.filter(category => 
                (category.name && category.name.toLowerCase().includes(searchLower)) ||
                (category.description && category.description.toLowerCase().includes(searchLower))
            );
        }

        // Sort by creation date (newest first)
        categoriesArray.sort((a, b) => {
            const aDate = new Date(a.createdAt || a.id);
            const bDate = new Date(b.createdAt || b.id);
            return bDate - aDate;
        });

        // Calculate pagination
        const totalItems = categoriesArray.length;
        const totalPages = Math.ceil(totalItems / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedCategories = categoriesArray.slice(startIndex, endIndex);

        return {
            success: true,
            data: paginatedCategories,
            pagination: {
                totalItems,
                currentPage: page,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    } catch (error) {
        console.error('Error fetching categories:', error);
        return {
            success: false,
            error: 'Failed to fetch categories',
            message: error.message,
            data: [],
            pagination: {
                totalItems: 0,
                currentPage: 1,
                totalPages: 0,
                hasNext: false,
                hasPrev: false
            }
        };
    }
}

/**
 * Get all collections
 * Server-side function to fetch all collections
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.search - Search query
 * @returns {Promise<Object>} Collections data with pagination
 */
export async function getAllCollections(params = {}) {
    try {
        const { page = 1, limit = 50, search = '' } = params;
        
        let collections = await DBService.readAll('collections');
        const collectionsArray = Array.isArray(collections) ? collections : Object.values(collections || {});

        // Apply search filter
        let filteredCollections = collectionsArray;
        if (search && search.trim()) {
            const searchLower = search.toLowerCase().trim();
            filteredCollections = collectionsArray.filter(collection => {
                // Search in name, slug, and description
                const nameMatch = collection.name?.toLowerCase().includes(searchLower) || false;
                const slugMatch = collection.slug?.toLowerCase().includes(searchLower) || false;
                const descMatch = collection.description?.toLowerCase().includes(searchLower) || false;
                
                // Search in multi-language fields
                const nameMLMatch = collection.nameML ? Object.values(collection.nameML).some(name => 
                    name?.toLowerCase().includes(searchLower)
                ) : false;
                const descMLMatch = collection.descriptionML ? Object.values(collection.descriptionML).some(desc => 
                    desc?.toLowerCase().includes(searchLower)
                ) : false;
                
                return nameMatch || slugMatch || descMatch || nameMLMatch || descMLMatch;
            });
        }

        // Sort by creation date (newest first)
        filteredCollections.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
        });

        // Calculate pagination
        const totalItems = filteredCollections.length;
        const totalPages = Math.ceil(totalItems / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedCollections = filteredCollections.slice(startIndex, endIndex);

        return {
            success: true,
            data: paginatedCollections,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };
    } catch (error) {
        console.error('Error fetching collections:', error);
        return {
            success: false,
            error: 'Failed to fetch collections',
            message: error.message,
            data: [],
            pagination: {
                currentPage: 1,
                totalPages: 0,
                totalItems: 0,
                itemsPerPage: limit || 50,
                hasNextPage: false,
                hasPrevPage: false
            }
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

/**
 * Delete a customer utility function
 * @param {string} customerId - ID of the customer to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteCustomer(customerId) {
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

        console.log('Deleting customer with key:', customerKey);
        const result = await DBService.delete(customerKey, 'customers');
        console.log('Customer delete result:', result);

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error deleting customer:', error);
        return {
            success: false,
            error: 'Failed to delete customer',
            message: error.message
        };
    }
}

/**
 * Create or update customer from order data
 * Checks if customer exists by email, creates new if not, updates if data is different
 * @param {Object} orderCustomerData - Customer data from order
 * @returns {Promise<Object>} Operation result
 */
export async function createOrUpdateCustomerFromOrder(orderCustomerData) {
    try {
        if (!orderCustomerData || !orderCustomerData.email) {
            return {
                success: false,
                error: 'Missing customer email',
                message: 'Customer email is required'
            };
        }

        // Check if customer exists by email
        const existingCustomer = await DBService.getItemByKey('email', orderCustomerData.email, 'customers');
        
        // Prepare customer data in the format expected by customers table
        const customerData = {
            firstName: orderCustomerData.firstName || '',
            lastName: orderCustomerData.lastName || '',
            email: orderCustomerData.email,
            phone: orderCustomerData.phone || '',
            streetAddress: orderCustomerData.streetAddress || '',
            apartmentUnit: orderCustomerData.apartmentUnit || '',
            city: orderCustomerData.city || '',
            state: orderCustomerData.state || '',
            zipCode: orderCustomerData.zipCode || '',
            country: orderCustomerData.country || '',
            countryIso: orderCustomerData.countryIso || ''
        };

        if (existingCustomer) {
            // Customer exists, check if we need to update any information
            let needsUpdate = false;
            const fieldsToCheck = ['firstName', 'lastName', 'phone', 'streetAddress', 'apartmentUnit', 'city', 'state', 'zipCode', 'country', 'countryIso'];
            
            for (const field of fieldsToCheck) {
                // Update if new data exists and is different from existing data
                if (customerData[field] && customerData[field] !== (existingCustomer[field] || '')) {
                    needsUpdate = true;
                    break;
                }
            }

            if (needsUpdate) {
                // Update existing customer with new information
                const updateResult = await updateCustomer(existingCustomer.id, {
                    ...existingCustomer,
                    ...customerData,
                    updatedAt: new Date().toISOString()
                });
                
                return {
                    success: true,
                    action: 'updated',
                    data: updateResult.data,
                    message: 'Customer information updated'
                };
            } else {
                // No update needed
                return {
                    success: true,
                    action: 'no_change',
                    data: existingCustomer,
                    message: 'Customer already exists with same information'
                };
            }
        } else {
            // Customer doesn't exist, create new one
            const createResult = await createCustomer({
                ...customerData,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            
            return {
                success: true,
                action: 'created',
                data: createResult.data,
                message: 'New customer created'
            };
        }
    } catch (error) {
        console.error('Error in createOrUpdateCustomerFromOrder:', error);
        return {
            success: false,
            error: 'Failed to create/update customer',
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

// APPOINTMENT MANAGEMENT UTILITY FUNCTIONS (NOT SERVER ACTIONS)
// These functions can be imported directly into client components

/**
 * Get all appointments utility function
 * @returns {Promise<Object>} Appointments data
 */
export async function getAllAppointments() {
    try {
        const appointments = await DBService.readAll('appointments');
        const appointmentsArray = Array.isArray(appointments) ? appointments : Object.values(appointments || {});

        return {
            success: true,
            data: appointmentsArray
        };
    } catch (error) {
        console.error('Error fetching appointments:', error);
        return {
            success: false,
            error: 'Failed to fetch appointments',
            message: error.message,
            data: []
        };
    }
}

/**
 * Create a new appointment utility function
 * @param {Object} appointmentData - Appointment data to create
 * @returns {Promise<Object>} Created appointment data
 */
export async function createAppointment(appointmentData) {
    try {
        const newAppointment = {
            ...appointmentData,
            id: appointmentData.id || `appointment-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await DBService.create(newAppointment, 'appointments');
        return {
            success: true,
            data: newAppointment
        };
    } catch (error) {
        console.error('Error creating appointment:', error);
        return {
            success: false,
            error: 'Failed to create appointment',
            message: error.message
        };
    }
}

/**
 * Update an appointment utility function
 * @param {string} appointmentId - ID of the appointment to update
 * @param {Object} appointmentData - Appointment data to update
 * @returns {Promise<Object>} Updated appointment data
 */
export async function updateAppointment(appointmentId, appointmentData) {
    try {
        const updatedData = {
            ...appointmentData,
            updatedAt: new Date().toISOString()
        };

        // Check if appointment exists
        const existingAppointment = await DBService.getItemByKey('id', appointmentId, 'appointments');
        if (!existingAppointment) {
            return {
                success: false,
                error: 'Appointment not found'
            };
        }

        await DBService.update(appointmentId, updatedData, 'appointments');
        
        return {
            success: true,
            data: { ...existingAppointment, ...updatedData }
        };
    } catch (error) {
        console.error('Error updating appointment:', error);
        return {
            success: false,
            error: 'Failed to update appointment',
            message: error.message
        };
    }
}

/**
 * Delete an appointment utility function
 * @param {string} appointmentId - ID of the appointment to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteAppointment(appointmentId) {
    try {
        await DBService.delete(appointmentId, 'appointments');
        
        return {
            success: true,
            message: 'Appointment deleted successfully'
        };
    } catch (error) {
        console.error('Error deleting appointment:', error);
        return {
            success: false,
            error: 'Failed to delete appointment',
            message: error.message
        };
    }
}

// CATALOG MANAGEMENT UTILITY FUNCTIONS (NOT SERVER ACTIONS)
// These functions can be imported directly into client components

/**
 * Create a new catalog item utility function
 * @param {Object} catalogData - Catalog item data to create
 * @returns {Promise<Object>} Created catalog item data
 */
export async function createCatalogItem(catalogData) {
    try {
        const newCatalogItem = {
            ...catalogData,
            id: catalogData.id || `catalog-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await DBService.create(newCatalogItem, 'catalog');
        return {
            success: true,
            data: newCatalogItem
        };
    } catch (error) {
        console.error('Error creating catalog item:', error);
        return {
            success: false,
            error: 'Failed to create catalog item',
            message: error.message
        };
    }
}

/**
 * Update a catalog item utility function
 * @param {string} catalogId - ID of the catalog item to update
 * @param {Object} catalogData - Catalog item data to update
 * @returns {Promise<Object>} Updated catalog item data
 */
export async function updateCatalogItem(catalogId, catalogData) {
    try {
        const updatedData = {
            ...catalogData,
            updatedAt: new Date().toISOString()
        };

        // Check if catalog item exists
        const existingItem = await DBService.getItemByKey('id', catalogId, 'catalog');
        if (!existingItem) {
            return {
                success: false,
                error: 'Catalog item not found'
            };
        }

        await DBService.update(catalogId, updatedData, 'catalog');
        
        return {
            success: true,
            data: { ...existingItem, ...updatedData }
        };
    } catch (error) {
        console.error('Error updating catalog item:', error);
        return {
            success: false,
            error: 'Failed to update catalog item',
            message: error.message
        };
    }
}

/**
 * Delete a catalog item utility function
 * @param {string} catalogId - ID of the catalog item to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteCatalogItem(catalogId) {
    try {
        await DBService.delete(catalogId, 'catalog');
        
        return {
            success: true,
            message: 'Catalog item deleted successfully'
        };
    } catch (error) {
        console.error('Error deleting catalog item:', error);
        return {
            success: false,
            error: 'Failed to delete catalog item',
            message: error.message
        };
    }
}

// ATTRIBUTES MANAGEMENT UTILITY FUNCTIONS (NOT SERVER ACTIONS)
// These functions can be imported directly into client components

/**
 * Get all attributes utility function with pagination support
 * @param {Object} params - Query parameters (page, limit, search, etc.)
 * @returns {Promise<Object>} Attributes data with pagination info
 */
export async function getAllAttributes(params = {}) {
    try {
        const { page = 1, limit = 10, search = '' } = params;
        
        const allAttributes = await DBService.readAll('attributes');
        
        if (!allAttributes || Object.keys(allAttributes).length === 0) {
            return {
                success: true,
                data: [],
                pagination: {
                    totalItems: 0,
                    currentPage: 1,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false
                }
            };
        }

        // Convert object to array
        let attributesArray = Array.isArray(allAttributes) ? allAttributes : Object.entries(allAttributes).map(([key, value]) => ({
            id: key,
            ...value
        }));

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            attributesArray = attributesArray.filter(attribute => 
                (attribute.name && attribute.name.toLowerCase().includes(searchLower)) ||
                (attribute.description && attribute.description.toLowerCase().includes(searchLower)) ||
                (attribute.type && attribute.type.toLowerCase().includes(searchLower))
            );
        }

        // Sort by creation date (newest first)
        attributesArray.sort((a, b) => {
            const aDate = new Date(a.createdAt || a.id);
            const bDate = new Date(b.createdAt || b.id);
            return bDate - aDate;
        });

        // Calculate pagination
        const totalItems = attributesArray.length;
        const totalPages = Math.ceil(totalItems / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedAttributes = attributesArray.slice(startIndex, endIndex);

        return {
            success: true,
            data: paginatedAttributes,
            pagination: {
                totalItems,
                currentPage: page,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    } catch (error) {
        console.error('Error fetching attributes:', error);
        return {
            success: false,
            error: 'Failed to fetch attributes',
            message: error.message,
            data: [],
            pagination: {
                totalItems: 0,
                currentPage: 1,
                totalPages: 0,
                hasNext: false,
                hasPrev: false
            }
        };
    }
}

/**
 * Create a new attribute utility function
 * @param {Object} attributeData - Attribute data to create
 * @returns {Promise<Object>} Created attribute data
 */
export async function createAttribute(attributeData) {
    try {
        const newAttribute = {
            ...attributeData,
            id: attributeData.id || `attribute-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await DBService.create(newAttribute, 'attributes');
        return {
            success: true,
            data: newAttribute
        };
    } catch (error) {
        console.error('Error creating attribute:', error);
        return {
            success: false,
            error: 'Failed to create attribute',
            message: error.message
        };
    }
}

/**
 * Update an attribute utility function
 * @param {string} attributeId - ID of the attribute to update
 * @param {Object} attributeData - Attribute data to update
 * @returns {Promise<Object>} Updated attribute data
 */
export async function updateAttribute(attributeId, attributeData) {
    try {
        const updatedData = {
            ...attributeData,
            updatedAt: new Date().toISOString()
        };

        // Check if attribute exists
        const existingAttribute = await DBService.getItemByKey('id', attributeId, 'attributes');
        if (!existingAttribute) {
            return {
                success: false,
                error: 'Attribute not found'
            };
        }

        await DBService.update(attributeId, updatedData, 'attributes');
        
        return {
            success: true,
            data: { ...existingAttribute, ...updatedData }
        };
    } catch (error) {
        console.error('Error updating attribute:', error);
        return {
            success: false,
            error: 'Failed to update attribute',
            message: error.message
        };
    }
}

/**
 * Delete an attribute utility function
 * @param {string} attributeId - ID of the attribute to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteAttribute(attributeId) {
    try {
        const result = await DBService.delete(attributeId, 'attributes');
        if (result?.success) {
            return { success: true, data: result };
        } else {
            return { success: false, error: 'Failed to delete attribute' };
        }
    } catch (error) {
        console.error('Error deleting attribute:', error);
        return { success: false, error: error.message || 'Unknown error occurred' };
    }
}

// CATEGORIES MANAGEMENT UTILITY FUNCTIONS (NOT SERVER ACTIONS)
// These functions can be imported directly into client components

/**
 * Create a new category utility function
 * @param {Object} categoryData - Category data to create
 * @returns {Promise<Object>} Created category data
 */
export async function createCategory(categoryData) {
    try {
        const result = await DBService.create(categoryData, 'categories');
        if (result?.success) {
            return { success: true, data: result.data };
        } else {
            return { success: false, error: 'Failed to create category' };
        }
    } catch (error) {
        console.error('Error creating category:', error);
        return { success: false, error: error.message || 'Unknown error occurred' };
    }
}

/**
 * Update a category utility function
 * @param {string} categoryId - ID of the category to update
 * @param {Object} categoryData - Category data to update
 * @returns {Promise<Object>} Updated category data
 */
export async function updateCategory(categoryId, categoryData) {
    try {
        const result = await DBService.update(categoryId, categoryData, 'categories');
        if (result?.success) {
            return { success: true, data: result.data };
        } else {
            return { success: false, error: 'Failed to update category' };
        }
    } catch (error) {
        console.error('Error updating category:', error);
        return { success: false, error: error.message || 'Unknown error occurred' };
    }
}

/**
 * Delete a category utility function
 * @param {string} categoryId - ID of the category to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteCategory(categoryId) {
    try {
        const result = await DBService.delete(categoryId, 'categories');
        if (result?.success) {
            return { success: true, data: result };
        } else {
            return { success: false, error: 'Failed to delete category' };
        }
    } catch (error) {
        console.error('Error deleting category:', error);
        return { success: false, error: error.message || 'Unknown error occurred' };
    }
}

// GALLERY MEDIA MANAGEMENT UTILITY FUNCTIONS (NOT SERVER ACTIONS)
// These functions can be imported directly into client components

/**
 * Get all gallery media utility function
 * @param {Object} params - Query parameters (page, limit, search, etc.)
 * @returns {Promise<Object>} Gallery media data
 */
export async function getAllGalleryMedia(params = {}) {
    try {
        const { page = 1, limit = 10, search = '' } = params;
        const allMedia = await DBService.readAll('gallery');
        
        if (!allMedia || Object.keys(allMedia).length === 0) {
            return {
                success: true,
                data: [],
                pagination: {
                    totalItems: 0,
                    currentPage: 1,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false
                }
            };
        }

        // Convert object to array and filter by search if provided
        let mediaArray = Object.entries(allMedia).map(([key, value]) => ({
            id: key,
            ...value
        }));

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            mediaArray = mediaArray.filter(item => 
                (item.alt && item.alt.toLowerCase().includes(searchLower)) ||
                (item.url && item.url.toLowerCase().includes(searchLower))
            );
        }

        // Sort by creation date or featured status
        mediaArray.sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            
            const aDate = new Date(a.createdAt || a.id);
            const bDate = new Date(b.createdAt || b.id);
            return bDate - aDate;
        });

        // Calculate pagination
        const totalItems = mediaArray.length;
        const totalPages = Math.ceil(totalItems / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedMedia = mediaArray.slice(startIndex, endIndex);

        return {
            success: true,
            data: paginatedMedia,
            pagination: {
                totalItems,
                currentPage: page,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    } catch (error) {
        console.error('Error fetching gallery media:', error);
        return { 
            success: false, 
            error: error.message,
            data: [],
            pagination: {
                totalItems: 0,
                currentPage: 1,
                totalPages: 0,
                hasNext: false,
                hasPrev: false
            }
        };
    }
}

/**
 * Create a new gallery media item utility function
 * @param {Object} mediaData - Gallery media data to create
 * @returns {Promise<Object>} Created gallery media data
 */
export async function createGalleryMedia(mediaData) {
    try {
        const mediaWithTimestamp = {
            ...mediaData,
            createdAt: new Date().toISOString(),
            featured: mediaData.featured || false
        };
        
        const result = await DBService.create(mediaWithTimestamp, 'gallery');
        return { success: true, data: result };
    } catch (error) {
        console.error('Error creating gallery media:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update a gallery media item utility function
 * @param {string} mediaId - ID of the media item to update
 * @param {Object} mediaData - Media data to update
 * @returns {Promise<Object>} Updated media data
 */
export async function updateGalleryMedia(mediaId, mediaData) {
    try {
        const updateData = {
            ...mediaData,
            updatedAt: new Date().toISOString()
        };
        
        const result = await DBService.update(mediaId, updateData, 'gallery');
        return { success: true, data: result };
    } catch (error) {
        console.error('Error updating gallery media:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete a gallery media item utility function
 * @param {string} mediaId - ID of the media item to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteGalleryMedia(mediaId) {
    try {
        const result = await DBService.delete(mediaId, 'gallery');
        return { success: true, data: result };
    } catch (error) {
        console.error('Error deleting gallery media:', error);
        return { success: false, error: error.message };
    }
}

// COLLECTIONS MANAGEMENT UTILITY FUNCTIONS (NOT SERVER ACTIONS)
// These functions can be imported directly into client components

/**
 * Create a new collection utility function
 * @param {Object} collectionData - Collection data to create
 * @returns {Promise<Object>} Created collection data
 */
export async function createCollection(collectionData) {
    try {
        const result = await DBService.create(collectionData, 'collections');
        if (result?.success) {
            return { success: true, data: result.data };
        } else {
            return { success: false, error: 'Failed to create collection' };
        }
    } catch (error) {
        console.error('Error creating collection:', error);
        return { success: false, error: error.message || 'Unknown error occurred' };
    }
}

/**
 * Update a collection utility function
 * @param {string} collectionId - ID of the collection to update
 * @param {Object} collectionData - Collection data to update
 * @returns {Promise<Object>} Updated collection data
 */
export async function updateCollection(collectionId, collectionData) {
    try {
        const result = await DBService.update(collectionId, collectionData, 'collections');
        if (result?.success) {
            return { success: true, data: result.data };
        } else {
            return { success: false, error: 'Failed to update collection' };
        }
    } catch (error) {
        console.error('Error updating collection:', error);
        return { success: false, error: error.message || 'Unknown error occurred' };
    }
}

/**
 * Delete a collection utility function
 * @param {string} collectionId - ID of the collection to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteCollection(collectionId) {
    try {
        const result = await DBService.delete(collectionId, 'collections');
        if (result?.success) {
            return { success: true, data: result };
        } else {
            return { success: false, error: 'Failed to delete collection' };
        }
    } catch (error) {
        console.error('Error deleting collection:', error);
        return { success: false, error: error.message || 'Unknown error occurred' };
    }
}

// NOTIFICATIONS MANAGEMENT UTILITY FUNCTIONS (NOT SERVER ACTIONS)
// These functions can be imported directly into client components

/**
 * Get all notifications utility function
 * @param {Object} params - Query parameters (userId, unreadOnly, type, etc.)
 * @returns {Promise<Object>} Notifications data
 */
export async function getAllNotifications(params = {}) {
    try {
        const { userId = null, unreadOnly = false, type = null, limit = null } = params;
        
        const allNotifications = await DBService.readAll('notifications');
        let notifications = Object.entries(allNotifications || {}).map(([id, notification]) => ({
            id,
            ...notification
        }));

        // Filter by user (null userId means global notifications)
        if (userId !== undefined) {
            notifications = notifications.filter(notification => 
                notification.userId === userId || notification.userId === null
            );
        }

        // Filter by read status
        if (unreadOnly) {
            notifications = notifications.filter(notification => !notification.isRead);
        }

        // Filter by type
        if (type) {
            notifications = notifications.filter(notification => notification.type === type);
        }

        // Sort by createdAt (newest first)
        notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Apply limit
        if (limit) {
            notifications = notifications.slice(0, limit);
        }

        return { success: true, data: notifications };
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Create a new notification utility function
 * @param {Object} notificationData - Notification data to create
 * @returns {Promise<Object>} Created notification data
 */
export async function createNotification(notificationData) {
    try {
        const notification = {
            id: `notification_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            title: notificationData.title || 'New Notification',
            message: notificationData.message || '',
            type: notificationData.type || 'info', // 'order', 'security', 'report', 'maintenance', 'info', 'warning', 'error'
            priority: notificationData.priority || 'medium', // 'low', 'medium', 'high', 'critical'
            userId: notificationData.userId || null, // null for global notifications
            isRead: false,
            requiresAction: notificationData.requiresAction || false,
            actionLink: notificationData.actionLink || null,
            actionText: notificationData.actionText || null,
            autoMarkRead: notificationData.autoMarkRead || false,
            relatedId: notificationData.relatedId || null, // Related order ID, user ID, etc.
            relatedType: notificationData.relatedType || null, // 'order', 'user', 'backup', etc.
            metadata: notificationData.metadata || {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            expiresAt: notificationData.expiresAt || null
        };

        const result = await DBService.create(notification, 'notifications');
        return { success: true, data: notification };
    } catch (error) {
        console.error('Error creating notification:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update a notification utility function
 * @param {string} notificationId - ID of the notification to update
 * @param {Object} updateData - Notification data to update
 * @returns {Promise<Object>} Updated notification data
 */
export async function updateNotification(notificationId, updateData) {
    try {
        const existingNotification = await DBService.read(notificationId, 'notifications');
        if (!existingNotification) {
            return { success: false, error: 'Notification not found' };
        }

        const updatedNotification = {
            ...existingNotification,
            ...updateData,
            updatedAt: new Date().toISOString()
        };

        const result = await DBService.update(notificationId, updatedNotification, 'notifications');
        return { success: true, data: updatedNotification };
    } catch (error) {
        console.error('Error updating notification:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Mark notification as read utility function
 * @param {string} notificationId - ID of the notification to mark as read
 * @param {string} userId - ID of the user marking as read (for audit)
 * @returns {Promise<Object>} Update result
 */
export async function markNotificationAsRead(notificationId, userId = null) {
    try {
        const existingNotification = await DBService.read(notificationId, 'notifications');
        if (!existingNotification) {
            return { success: false, error: 'Notification not found' };
        }

        const updatedNotification = {
            ...existingNotification,
            isRead: true,
            readAt: new Date().toISOString(),
            readBy: userId,
            updatedAt: new Date().toISOString()
        };

        const result = await DBService.update(notificationId, updatedNotification, 'notifications');
        return { success: true, data: updatedNotification };
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Mark multiple notifications as read utility function
 * @param {Array} notificationIds - Array of notification IDs to mark as read
 * @param {string} userId - ID of the user marking as read
 * @returns {Promise<Object>} Update result
 */
export async function markMultipleNotificationsAsRead(notificationIds, userId = null) {
    try {
        const results = [];
        
        for (const notificationId of notificationIds) {
            const result = await markNotificationAsRead(notificationId, userId);
            results.push({ notificationId, ...result });
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        return {
            success: failCount === 0,
            data: {
                total: notificationIds.length,
                success: successCount,
                failed: failCount,
                results
            }
        };
    } catch (error) {
        console.error('Error marking multiple notifications as read:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete a notification utility function
 * @param {string} notificationId - ID of the notification to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteNotification(notificationId) {
    try {
        const result = await DBService.delete(notificationId, 'notifications');
        return { success: true, data: result };
    } catch (error) {
        console.error('Error deleting notification:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get unread notifications count utility function
 * @param {string} userId - ID of the user (null for global notifications)
 * @returns {Promise<Object>} Unread count data
 */
export async function getUnreadNotificationsCount(userId = null) {
    try {
        const notificationsResult = await getAllNotifications({ 
            userId, 
            unreadOnly: true 
        });
        
        if (!notificationsResult.success) {
            return { success: false, error: notificationsResult.error };
        }

        const count = notificationsResult.data.length;
        return { success: true, data: { count } };
    } catch (error) {
        console.error('Error getting unread notifications count:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Create order notification utility function
 * @param {Object} orderData - Order data to create notification for
 * @param {string} orderType - 'online' or 'manual'
 * @returns {Promise<Object>} Created notification data
 */
export async function createOrderNotification(orderData, orderType = 'online') {
    try {
        // Only create notifications for online orders
        if (orderType !== 'online') {
            return { success: true, data: null, message: 'No notification created for manual order' };
        }

        const notification = {
            title: `New Online Order #${orderData.orderNumber || orderData.id}`,
            message: `A new order has been placed by ${orderData.customerName || orderData.email || 'customer'} for $${orderData.total || '0.00'}`,
            type: 'order',
            priority: 'high',
            userId: null, // Global notification for all admins
            requiresAction: true,
            actionLink: `/admin/store/orders?orderId=${orderData.id}`,
            actionText: 'View Order',
            autoMarkRead: true, // Will be marked as read when order status changes
            relatedId: orderData.id,
            relatedType: 'order',
            metadata: {
                orderNumber: orderData.orderNumber,
                customerEmail: orderData.email,
                orderTotal: orderData.total,
                orderStatus: orderData.status || 'pending',
                orderType: orderType, // Mark as online order
                createdAt: new Date().toISOString()
            }
        };

        return await createNotification(notification);
    } catch (error) {
        console.error('Error creating order notification:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Auto-mark order notifications as read when status changes
 * @param {string} orderId - ID of the order
 * @param {string} newStatus - New order status
 * @param {string} userId - ID of the user who changed the status
 * @returns {Promise<Object>} Update result
 */
export async function autoMarkOrderNotificationsRead(orderId, newStatus, userId) {
    try {
        // Get all notifications related to this order
        const allNotifications = await DBService.readAll('notifications');
        const orderNotifications = Object.entries(allNotifications || {})
            .filter(([id, notification]) => 
                notification.relatedId === orderId && 
                notification.type === 'order' && 
                !notification.isRead &&
                notification.autoMarkRead
            )
            .map(([id]) => id);

        if (orderNotifications.length === 0) {
            return { success: true, data: { marked: 0 } };
        }

        // Mark notifications as read if status is not 'pending' or 'unconfirmed'
        if (newStatus !== 'pending' && newStatus !== 'unconfirmed') {
            const result = await markMultipleNotificationsAsRead(orderNotifications, userId);
            return result;
        }

        return { success: true, data: { marked: 0, reason: 'Status still pending/unconfirmed' } };
    } catch (error) {
        console.error('Error auto-marking order notifications as read:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Create system notification utility function
 * @param {Object} systemData - System notification data
 * @returns {Promise<Object>} Created notification data
 */
export async function createSystemNotification(systemData) {
    try {
        const { type, title, message, priority = 'medium', requiresAction = false, actionLink = null, actionText = null } = systemData;

        const notification = {
            title: title || 'System Notification',
            message: message || '',
            type: type || 'maintenance',
            priority,
            userId: null, // Global notification
            requiresAction,
            actionLink,
            actionText,
            autoMarkRead: !requiresAction, // Auto-mark if no action required
            metadata: {
                systemType: type,
                ...systemData.metadata
            }
        };

        return await createNotification(notification);
    } catch (error) {
        console.error('Error creating system notification:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Clean up expired notifications utility function
 * @returns {Promise<Object>} Cleanup result
 */
export async function cleanupExpiredNotifications() {
    try {
        const allNotifications = await DBService.readAll('notifications');
        const now = new Date();
        let deletedCount = 0;

        for (const [id, notification] of Object.entries(allNotifications || {})) {
            // Delete notifications that have expired
            if (notification.expiresAt && new Date(notification.expiresAt) < now) {
                await DBService.delete(id, 'notifications');
                deletedCount++;
            }
            // Delete old read notifications (older than 30 days)
            else if (notification.isRead && notification.readAt) {
                const readDate = new Date(notification.readAt);
                const daysDiff = (now - readDate) / (1000 * 60 * 60 * 24);
                if (daysDiff > 30) {
                    await DBService.delete(id, 'notifications');
                    deletedCount++;
                }
            }
        }

        return { success: true, data: { deletedCount } };
    } catch (error) {
        console.error('Error cleaning up expired notifications:', error);
        return { success: false, error: error.message };
    }
}

// NAVIGATION NOTIFICATION BADGE FUNCTIONS (NOT SERVER ACTIONS)
// These functions provide notification counts for navigation badges

/**
 * Get notification count for Store Orders
 * Returns count of unread order notifications (online orders only)
 * @param {string} userId - ID of the user (null for global notifications)
 * @returns {Promise<Object>} Order notifications count
 */
export async function getStoreOrdersNotificationCount(userId = null) {
    try {
        const result = await getAllNotifications({ 
            userId, 
            unreadOnly: true,
            type: 'order'
        });
        
        if (!result.success) {
            return { success: false, error: result.error };
        }

        // Filter for online orders only (not manual orders)
        const onlineOrderNotifications = result.data.filter(notification => 
            notification.metadata?.orderType !== 'manual' &&
            notification.relatedType === 'order'
        );

        return { 
            success: true, 
            data: { 
                count: onlineOrderNotifications.length,
                notifications: onlineOrderNotifications
            } 
        };
    } catch (error) {
        console.error('Error getting store orders notification count:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get notification count for System (Settings & Maintenance)
 * Returns count of unread system, security, and maintenance notifications
 * @param {string} userId - ID of the user (null for global notifications)
 * @returns {Promise<Object>} System notifications count
 */
export async function getSystemNotificationCount(userId = null) {
    try {
        const result = await getAllNotifications({ 
            userId, 
            unreadOnly: true 
        });
        
        if (!result.success) {
            return { success: false, error: result.error };
        }

        // Filter for system-related notifications
        const systemNotifications = result.data.filter(notification => 
            ['security', 'maintenance', 'error', 'warning'].includes(notification.type)
        );

        return { 
            success: true, 
            data: { 
                count: systemNotifications.length,
                notifications: systemNotifications,
                breakdown: {
                    security: systemNotifications.filter(n => n.type === 'security').length,
                    maintenance: systemNotifications.filter(n => n.type === 'maintenance').length,
                    errors: systemNotifications.filter(n => n.type === 'error').length,
                    warnings: systemNotifications.filter(n => n.type === 'warning').length
                }
            } 
        };
    } catch (error) {
        console.error('Error getting system notification count:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get notification count for Marketing
 * Returns count of unread marketing and report notifications
 * @param {string} userId - ID of the user (null for global notifications)
 * @returns {Promise<Object>} Marketing notifications count
 */
export async function getMarketingNotificationCount(userId = null) {
    try {
        const result = await getAllNotifications({ 
            userId, 
            unreadOnly: true 
        });
        
        if (!result.success) {
            return { success: false, error: result.error };
        }

        // Filter for marketing-related notifications
        const marketingNotifications = result.data.filter(notification => 
            ['report', 'info'].includes(notification.type) &&
            (notification.metadata?.reportType || notification.metadata?.campaignType)
        );

        return { 
            success: true, 
            data: { 
                count: marketingNotifications.length,
                notifications: marketingNotifications
            } 
        };
    } catch (error) {
        console.error('Error getting marketing notification count:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all navigation notification counts
 * Returns counts for all navigation sections with badges
 * @param {string} userId - ID of the user (null for global notifications)
 * @returns {Promise<Object>} All navigation notification counts
 */
export async function getAllNavigationNotificationCounts(userId = null) {
    try {
        const [storeOrders, system, marketing] = await Promise.all([
            getStoreOrdersNotificationCount(userId),
            getSystemNotificationCount(userId),
            getMarketingNotificationCount(userId)
        ]);

        return {
            success: true,
            data: {
                storeOrders: storeOrders.success ? storeOrders.data.count : 0,
                system: system.success ? system.data.count : 0,
                marketing: marketing.success ? marketing.data.count : 0,
                total: (storeOrders.success ? storeOrders.data.count : 0) +
                       (system.success ? system.data.count : 0) +
                       (marketing.success ? marketing.data.count : 0)
            }
        };
    } catch (error) {
        console.error('Error getting all navigation notification counts:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Clear order notifications for specific order
 * Called when order status changes from pending/unconfirmed
 * @param {string} orderId - ID of the order
 * @param {string} newStatus - New order status
 * @param {string} userId - ID of the user who changed the status
 * @returns {Promise<Object>} Clear result
 */
export async function clearOrderNotifications(orderId, newStatus, userId) {
    try {
        // Only clear if status is not pending/unconfirmed
        if (newStatus === 'pending' || newStatus === 'unconfirmed') {
            return { success: true, data: { cleared: 0, reason: 'Status still pending/unconfirmed' } };
        }

        const result = await autoMarkOrderNotificationsRead(orderId, newStatus, userId);
        return result;
    } catch (error) {
        console.error('Error clearing order notifications:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get navigation notification counts for specific sections
 * Optimized function for real-time badge updates
 * @param {Array} sections - Array of section names to get counts for
 * @param {string} userId - ID of the user (null for global notifications)
 * @returns {Promise<Object>} Specific section notification counts
 */
export async function getNavigationSectionCounts(sections = [], userId = null) {
    try {
        const counts = {};
        
        for (const section of sections) {
            switch (section) {
                case 'store':
                case 'storeOrders':
                    const storeResult = await getStoreOrdersNotificationCount(userId);
                    counts.store = storeResult.success ? storeResult.data.count : 0;
                    counts.storeOrders = counts.store; // Same count for both
                    break;
                    
                case 'system':
                    const systemResult = await getSystemNotificationCount(userId);
                    counts.system = systemResult.success ? systemResult.data.count : 0;
                    break;
                    
                case 'marketing':
                    const marketingResult = await getMarketingNotificationCount(userId);
                    counts.marketing = marketingResult.success ? marketingResult.data.count : 0;
                    break;
            }
        }

        return { success: true, data: counts };
    } catch (error) {
        console.error('Error getting navigation section counts:', error);
        return { success: false, error: error.message };
    }
}

// COUPONS MANAGEMENT UTILITY FUNCTIONS (NOT SERVER ACTIONS)
// These functions can be imported directly into client components

/**
 * Get all coupons utility function with pagination support
 * @param {Object} params - Query parameters (page, limit, search, filterType, filterStatus, etc.)
 * @returns {Promise<Object>} Coupons data with pagination info
 */
export async function getAllCoupons(params = {}) {
    try {
        const { page = 1, limit = 10, search = '', filterType = 'all', filterStatus = 'all' } = params;
        
        const allCoupons = await DBService.readAll('coupons');
        
        if (!allCoupons || Object.keys(allCoupons).length === 0) {
            return {
                success: true,
                data: [],
                pagination: {
                    totalItems: 0,
                    currentPage: 1,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false
                }
            };
        }

        // Convert object to array
        let couponsArray = Array.isArray(allCoupons) ? allCoupons : Object.entries(allCoupons).map(([key, value]) => ({
            id: key,
            ...value
        }));

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            couponsArray = couponsArray.filter(coupon => 
                (coupon.code && coupon.code.toLowerCase().includes(searchLower)) ||
                (coupon.name && coupon.name.toLowerCase().includes(searchLower)) ||
                (coupon.description && coupon.description.toLowerCase().includes(searchLower))
            );
        }

        // Apply type filter
        if (filterType !== 'all') {
            couponsArray = couponsArray.filter(coupon => coupon.type === filterType);
        }

        // Apply status filter
        if (filterStatus !== 'all') {
            const now = new Date();
            couponsArray = couponsArray.filter(coupon => {
                const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < now;
                const isUsageLimitReached = coupon.usageType === 'limited' && coupon.usedCount >= coupon.usageLimit;
                
                switch (filterStatus) {
                    case 'active':
                        return coupon.isActive && !isExpired && !isUsageLimitReached;
                    case 'expired':
                        return isExpired;
                    case 'inactive':
                        return !coupon.isActive;
                    case 'used_up':
                        return isUsageLimitReached;
                    default:
                        return true;
                }
            });
        }

        // Sort by creation date (newest first)
        couponsArray.sort((a, b) => {
            const aDate = new Date(a.createdAt || a.id);
            const bDate = new Date(b.createdAt || b.id);
            return bDate - aDate;
        });

        // Calculate pagination
        const totalItems = couponsArray.length;
        const totalPages = Math.ceil(totalItems / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedCoupons = couponsArray.slice(startIndex, endIndex);

        return {
            success: true,
            data: paginatedCoupons,
            pagination: {
                totalItems,
                currentPage: page,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    } catch (error) {
        console.error('Error fetching coupons:', error);
        return {
            success: false,
            error: 'Failed to fetch coupons',
            message: error.message,
            data: [],
            pagination: {
                totalItems: 0,
                currentPage: 1,
                totalPages: 0,
                hasNext: false,
                hasPrev: false
            }
        };
    }
}

/**
 * Create a new coupon utility function
 * @param {Object} couponData - Coupon data to create
 * @returns {Promise<Object>} Created coupon data
 */
export async function createCoupon(couponData) {
    try {
        const couponWithTimestamp = {
            ...couponData,
            createdAt: new Date().toISOString(),
            usedCount: 0
        };
        
        const result = await DBService.create(couponWithTimestamp, 'coupons');
        return { success: true, data: result };
    } catch (error) {
        console.error('Error creating coupon:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update a coupon utility function
 * @param {string} couponId - ID of the coupon to update
 * @param {Object} couponData - Coupon data to update
 * @returns {Promise<Object>} Updated coupon data
 */
export async function updateCoupon(couponId, couponData) {
    try {
        const updateData = {
            ...couponData,
            updatedAt: new Date().toISOString()
        };
        
        const result = await DBService.update(couponId, updateData, 'coupons');
        return { success: true, data: result };
    } catch (error) {
        console.error('Error updating coupon:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete a coupon utility function
 * @param {string} couponId - ID of the coupon to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteCoupon(couponId) {
    try {
        const result = await DBService.delete(couponId, 'coupons');
        return { success: true, data: result };
    } catch (error) {
        console.error('Error deleting coupon:', error);
        return { success: false, error: error.message };
    }
}

// WORKSPACE MANAGEMENT UTILITY FUNCTIONS (NOT SERVER ACTIONS)
// These functions can be imported directly into client components

/**
 * Get all agenda items utility function
 * @returns {Promise<Object>} Agenda items data
 */
export async function getAllAgenda() {
    try {
        const agendaItems = await DBService.readAll('agenda');
        const agendaArray = Array.isArray(agendaItems) ? agendaItems : Object.values(agendaItems || {});

        // Sort by date and time
        agendaArray.sort((a, b) => {
            const dateCompare = new Date(a.date || 0) - new Date(b.date || 0);
            if (dateCompare === 0) {
                return (a.time || '00:00').localeCompare(b.time || '00:00');
            }
            return dateCompare;
        });

        return {
            success: true,
            data: agendaArray
        };
    } catch (error) {
        console.error('Error fetching agenda items:', error);
        return {
            success: false,
            error: 'Failed to fetch agenda items',
            message: error.message,
            data: []
        };
    }
}

/**
 * Create a new agenda item utility function
 * @param {Object} agendaData - Agenda item data to create
 * @returns {Promise<Object>} Created agenda item data
 */
export async function createAgendaItem(agendaData) {
    try {
        const agendaItem = {
            ...agendaData,
            id: `agenda_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await DBService.create(agendaItem, 'agenda');
        return {
            success: true,
            data: agendaItem,
            message: 'Agenda item created successfully'
        };
    } catch (error) {
        console.error('Error creating agenda item:', error);
        return {
            success: false,
            error: 'Failed to create agenda item',
            message: error.message
        };
    }
}

/**
 * Update an agenda item utility function
 * @param {string} agendaId - ID of the agenda item to update
 * @param {Object} agendaData - Agenda item data to update
 * @returns {Promise<Object>} Updated agenda item data
 */
export async function updateAgendaItem(agendaId, agendaData) {
    try {
        const updatedData = {
            ...agendaData,
            updatedAt: new Date().toISOString()
        };

        await DBService.update(agendaId, updatedData, 'agenda');
        return {
            success: true,
            data: { id: agendaId, ...updatedData },
            message: 'Agenda item updated successfully'
        };
    } catch (error) {
        console.error('Error updating agenda item:', error);
        return {
            success: false,
            error: 'Failed to update agenda item',
            message: error.message
        };
    }
}

/**
 * Delete an agenda item utility function
 * @param {string} agendaId - ID of the agenda item to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteAgendaItem(agendaId) {
    try {
        await DBService.delete(agendaId, 'agenda');
        return {
            success: true,
            message: 'Agenda item deleted successfully'
        };
    } catch (error) {
        console.error('Error deleting agenda item:', error);
        return {
            success: false,
            error: 'Failed to delete agenda item',
            message: error.message
        };
    }
}

/**
 * Get all schedule items utility function
 * @returns {Promise<Object>} Schedule items data
 */
export async function getAllScheduleItems() {
    try {
        const scheduleItems = await DBService.readAll('schedule');
        const scheduleArray = Array.isArray(scheduleItems) ? scheduleItems : Object.values(scheduleItems || {});

        // Sort by date and startTime
        scheduleArray.sort((a, b) => {
            const dateCompare = new Date(a.date || 0) - new Date(b.date || 0);
            if (dateCompare === 0) {
                return (a.startTime || '00:00').localeCompare(b.startTime || '00:00');
            }
            return dateCompare;
        });

        return {
            success: true,
            data: scheduleArray
        };
    } catch (error) {
        console.error('Error fetching schedule items:', error);
        return {
            success: false,
            error: 'Failed to fetch schedule items',
            message: error.message,
            data: []
        };
    }
}

/**
 * Create a new schedule item utility function
 * @param {Object} scheduleData - Schedule item data to create
 * @returns {Promise<Object>} Created schedule item data
 */
export async function createScheduleItem(scheduleData) {
    try {
        const scheduleItem = {
            ...scheduleData,
            id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await DBService.create(scheduleItem, 'schedule');
        return {
            success: true,
            data: scheduleItem,
            message: 'Schedule item created successfully'
        };
    } catch (error) {
        console.error('Error creating schedule item:', error);
        return {
            success: false,
            error: 'Failed to create schedule item',
            message: error.message
        };
    }
}

/**
 * Update a schedule item utility function
 * @param {string} scheduleId - ID of the schedule item to update
 * @param {Object} scheduleData - Schedule item data to update
 * @returns {Promise<Object>} Updated schedule item data
 */
export async function updateScheduleItem(scheduleId, scheduleData) {
    try {
        const updatedData = {
            ...scheduleData,
            updatedAt: new Date().toISOString()
        };

        await DBService.update(scheduleId, updatedData, 'schedule');
        return {
            success: true,
            data: { id: scheduleId, ...updatedData },
            message: 'Schedule item updated successfully'
        };
    } catch (error) {
        console.error('Error updating schedule item:', error);
        return {
            success: false,
            error: 'Failed to update schedule item',
            message: error.message
        };
    }
}

/**
 * Delete a schedule item utility function
 * @param {string} scheduleId - ID of the schedule item to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteScheduleItem(scheduleId) {
    try {
        await DBService.delete(scheduleId, 'schedule');
        return {
            success: true,
            message: 'Schedule item deleted successfully'
        };
    } catch (error) {
        console.error('Error deleting schedule item:', error);
        return {
            success: false,
            error: 'Failed to delete schedule item',
            message: error.message
        };
    }
}

/**
 * Get all tasks utility function
 * @returns {Promise<Object>} Tasks data
 */
export async function getAllTasks() {
    try {
        const tasks = await DBService.readAll('tasks');
        const tasksArray = Array.isArray(tasks) ? tasks : Object.values(tasks || {});

        // Sort by priority and due date
        tasksArray.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const priorityCompare = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
            
            if (priorityCompare === 0) {
                return new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31');
            }
            return priorityCompare;
        });

        return {
            success: true,
            data: tasksArray
        };
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return {
            success: false,
            error: 'Failed to fetch tasks',
            message: error.message,
            data: []
        };
    }
}

/**
 * Create a new task utility function
 * @param {Object} taskData - Task data to create
 * @returns {Promise<Object>} Created task data
 */
export async function createTask(taskData) {
    try {
        const task = {
            ...taskData,
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await DBService.create(task, 'tasks');
        return {
            success: true,
            data: task,
            message: 'Task created successfully'
        };
    } catch (error) {
        console.error('Error creating task:', error);
        return {
            success: false,
            error: 'Failed to create task',
            message: error.message
        };
    }
}

/**
 * Update a task utility function
 * @param {string} taskId - ID of the task to update
 * @param {Object} taskData - Task data to update
 * @returns {Promise<Object>} Updated task data
 */
export async function updateTask(taskId, taskData) {
    try {
        const updatedData = {
            ...taskData,
            updatedAt: new Date().toISOString()
        };

        await DBService.update(taskId, updatedData, 'tasks');
        return {
            success: true,
            data: { id: taskId, ...updatedData },
            message: 'Task updated successfully'
        };
    } catch (error) {
        console.error('Error updating task:', error);
        return {
            success: false,
            error: 'Failed to update task',
            message: error.message
        };
    }
}

/**
 * Delete a task utility function
 * @param {string} taskId - ID of the task to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteTask(taskId) {
    try {
        await DBService.delete(taskId, 'tasks');
        return {
            success: true,
            message: 'Task deleted successfully'
        };
    } catch (error) {
        console.error('Error deleting task:', error);
        return {
            success: false,
            error: 'Failed to delete task',
            message: error.message
        };
    }
}

/**
 * Create a task related to an order utility function
 * @param {string} orderId - ID of the order to associate with the task
 * @param {Object} taskData - Task data to create
 * @returns {Promise<Object>} Created task data
 */
export async function createOrderTask(orderId, taskData) {
    try {
        const task = {
            ...taskData,
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            orderId: orderId,
            type: 'order-related',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await DBService.create(task, 'tasks');
        return {
            success: true,
            data: task,
            message: 'Order task created successfully'
        };
    } catch (error) {
        console.error('Error creating order task:', error);
        return {
            success: false,
            error: 'Failed to create order task',
            message: error.message
        };
    }
}

// NEWSLETTER AND SMS CAMPAIGN MANAGEMENT UTILITY FUNCTIONS
// These functions handle campaigns, subscribers, templates for both email and SMS

/**
 * Get all campaigns utility function with pagination support
 * @param {Object} params - Query parameters (page, limit, search, type, etc.)
 * @returns {Promise<Object>} Campaigns data with pagination info
 */
export async function getAllCampaigns(params = {}) {
    try {
        const { page = 1, limit = 10, search = '', type = 'all', status = 'all' } = params;
        
        const result = await DBService.readAll('campaigns');
        if (!result) {
            return {
                success: true,
                data: [],
                pagination: {
                    currentPage: page,
                    totalItems: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false
                }
            };
        }

        let campaigns = [];
        if (Array.isArray(result)) {
            campaigns = result;
        } else if (typeof result === 'object') {
            campaigns = Object.entries(result).map(([id, campaign]) => ({
                id,
                ...campaign
            }));
        }

        // Filter campaigns
        let filteredCampaigns = campaigns.filter(campaign => {
            const matchesSearch = !search || 
                campaign.subject?.toLowerCase().includes(search.toLowerCase()) ||
                campaign.content?.toLowerCase().includes(search.toLowerCase());
            
            const matchesType = type === 'all' || campaign.type === type;
            const matchesStatus = status === 'all' || campaign.status === status;
            
            return matchesSearch && matchesType && matchesStatus;
        });

        // Sort by created date (newest first)
        filteredCampaigns.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
        });

        // Pagination
        const totalItems = filteredCampaigns.length;
        const totalPages = Math.ceil(totalItems / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedCampaigns = filteredCampaigns.slice(startIndex, endIndex);

        return {
            success: true,
            data: paginatedCampaigns,
            pagination: {
                currentPage: page,
                totalItems,
                totalPages,
                hasNext: endIndex < totalItems,
                hasPrev: page > 1
            }
        };
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        return {
            success: false,
            error: 'Failed to fetch campaigns',
            message: error.message
        };
    }
}

/**
 * Create a new campaign utility function
 * @param {Object} campaignData - Campaign data to create
 * @returns {Promise<Object>} Created campaign data
 */
export async function createCampaign(campaignData) {
    try {
        const campaign = {
            ...campaignData,
            id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: campaignData.status || 'draft',
            type: campaignData.type || 'email',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sentAt: null,
            openRate: 0,
            clickRate: 0,
            recipientCount: 0
        };

        const result = await DBService.create(campaign, 'campaigns');
        if (!result) {
            throw new Error('Failed to create campaign');
        }

        return {
            success: true,
            data: campaign,
            message: 'Campaign created successfully'
        };
    } catch (error) {
        console.error('Error creating campaign:', error);
        return {
            success: false,
            error: 'Failed to create campaign',
            message: error.message
        };
    }
}

/**
 * Update a campaign utility function
 * @param {string} campaignId - ID of the campaign to update
 * @param {Object} campaignData - Campaign data to update
 * @returns {Promise<Object>} Updated campaign data
 */
export async function updateCampaign(campaignId, campaignData) {
    try {
        const existingCampaign = await DBService.read(campaignId, 'campaigns');
        if (!existingCampaign) {
            throw new Error('Campaign not found');
        }

        const updatedCampaign = {
            ...existingCampaign,
            ...campaignData,
            updatedAt: new Date().toISOString()
        };

        const result = await DBService.update(campaignId, updatedCampaign, 'campaigns');
        if (!result) {
            throw new Error('Failed to update campaign');
        }

        return {
            success: true,
            data: updatedCampaign,
            message: 'Campaign updated successfully'
        };
    } catch (error) {
        console.error('Error updating campaign:', error);
        return {
            success: false,
            error: 'Failed to update campaign',
            message: error.message
        };
    }
}

/**
 * Delete a campaign utility function
 * @param {string} campaignId - ID of the campaign to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteCampaign(campaignId) {
    try {
        const result = await DBService.delete(campaignId, 'campaigns');
        if (!result) {
            throw new Error('Failed to delete campaign');
        }

        return {
            success: true,
            message: 'Campaign deleted successfully'
        };
    } catch (error) {
        console.error('Error deleting campaign:', error);
        return {
            success: false,
            error: 'Failed to delete campaign',
            message: error.message
        };
    }
}

/**
 * Get all subscribers utility function with pagination support
 * @param {Object} params - Query parameters (page, limit, search, status, etc.)
 * @returns {Promise<Object>} Subscribers data with pagination info
 */
export async function getAllSubscribers(params = {}) {
    try {
        const { page = 1, limit = 10, search = '', status = 'all' } = params;
        
        const result = await DBService.readAll('newsletter_subscribers');
        if (!result) {
            return {
                success: true,
                data: [],
                pagination: {
                    currentPage: page,
                    totalItems: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false
                }
            };
        }

        let subscribers = [];
        if (Array.isArray(result)) {
            subscribers = result;
        } else if (typeof result === 'object') {
            subscribers = Object.entries(result).map(([id, subscriber]) => ({
                id,
                ...subscriber
            }));
        }

        // Filter subscribers
        let filteredSubscribers = subscribers.filter(subscriber => {
            const matchesSearch = !search || 
                subscriber.email?.toLowerCase().includes(search.toLowerCase()) ||
                subscriber.name?.toLowerCase().includes(search.toLowerCase());
            
            const matchesStatus = status === 'all' || subscriber.status === status;
            
            return matchesSearch && matchesStatus;
        });

        // Sort by created date (newest first)
        filteredSubscribers.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
        });

        // Pagination
        const totalItems = filteredSubscribers.length;
        const totalPages = Math.ceil(totalItems / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedSubscribers = filteredSubscribers.slice(startIndex, endIndex);

        return {
            success: true,
            data: paginatedSubscribers,
            pagination: {
                currentPage: page,
                totalItems,
                totalPages,
                hasNext: endIndex < totalItems,
                hasPrev: page > 1
            }
        };
    } catch (error) {
        console.error('Error fetching subscribers:', error);
        return {
            success: false,
            error: 'Failed to fetch subscribers',
            message: error.message
        };
    }
}

/**
 * Get all templates utility function with pagination support
 * @param {Object} params - Query parameters (page, limit, search, type, etc.)
 * @returns {Promise<Object>} Templates data with pagination info
 */
export async function getAllTemplates(params = {}) {
    try {
        const { page = 1, limit = 10, search = '', type = 'all' } = params;
        
        const result = await DBService.readAll('campaign_templates');
        if (!result) {
            return {
                success: true,
                data: [],
                pagination: {
                    currentPage: page,
                    totalItems: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false
                }
            };
        }

        let templates = [];
        if (Array.isArray(result)) {
            templates = result;
        } else if (typeof result === 'object') {
            templates = Object.entries(result).map(([id, template]) => ({
                id,
                ...template
            }));
        }

        // Filter templates
        let filteredTemplates = templates.filter(template => {
            const matchesSearch = !search || 
                template.name?.toLowerCase().includes(search.toLowerCase()) ||
                template.description?.toLowerCase().includes(search.toLowerCase());
            
            const matchesType = type === 'all' || template.type === type;
            
            return matchesSearch && matchesType;
        });

        // Sort by created date (newest first)
        filteredTemplates.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
        });

        // Pagination
        const totalItems = filteredTemplates.length;
        const totalPages = Math.ceil(totalItems / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex);

        return {
            success: true,
            data: paginatedTemplates,
            pagination: {
                currentPage: page,
                totalItems,
                totalPages,
                hasNext: endIndex < totalItems,
                hasPrev: page > 1
            }
        };
    } catch (error) {
        console.error('Error fetching templates:', error);
        return {
            success: false,
            error: 'Failed to fetch templates',
            message: error.message
        };
    }
}

/**
 * Create a new template utility function
 * @param {Object} templateData - Template data to create
 * @returns {Promise<Object>} Created template data
 */
export async function createTemplate(templateData) {
    try {
        const template = {
            ...templateData,
            id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: templateData.type || 'email',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const result = await DBService.create(template, 'campaign_templates');
        if (!result) {
            throw new Error('Failed to create template');
        }

        return {
            success: true,
            data: template,
            message: 'Template created successfully'
        };
    } catch (error) {
        console.error('Error creating template:', error);
        return {
            success: false,
            error: 'Failed to create template',
            message: error.message
        };
    }
}

/**
 * Update a template utility function
 * @param {string} templateId - ID of the template to update
 * @param {Object} templateData - Template data to update
 * @returns {Promise<Object>} Updated template data
 */
export async function updateTemplate(templateId, templateData) {
    try {
        const existingTemplate = await DBService.read(templateId, 'campaign_templates');
        if (!existingTemplate) {
            throw new Error('Template not found');
        }

        const updatedTemplate = {
            ...existingTemplate,
            ...templateData,
            updatedAt: new Date().toISOString()
        };

        const result = await DBService.update(templateId, updatedTemplate, 'campaign_templates');
        if (!result) {
            throw new Error('Failed to update template');
        }

        return {
            success: true,
            data: updatedTemplate,
            message: 'Template updated successfully'
        };
    } catch (error) {
        console.error('Error updating template:', error);
        return {
            success: false,
            error: 'Failed to update template',
            message: error.message
        };
    }
}

/**
 * Delete a template utility function
 * @param {string} templateId - ID of the template to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteTemplate(templateId) {
    try {
        const result = await DBService.delete(templateId, 'campaign_templates');
        if (!result) {
            throw new Error('Failed to delete template');
        }

        return {
            success: true,
            message: 'Template deleted successfully'
        };
    } catch (error) {
        console.error('Error deleting template:', error);
        return {
            success: false,
            error: 'Failed to delete template',
            message: error.message
        };
    }
}

/**
 * Get campaign analytics utility function
 * @param {Object} params - Query parameters (campaignId, type, dateRange)
 * @returns {Promise<Object>} Analytics data
 */
export async function getCampaignAnalytics(params = {}) {
    try {
        const { type = 'all', dateRange = 30 } = params;
        
        const campaignsResult = await DBService.readAll('campaigns');
        let campaigns = [];
        
        if (Array.isArray(campaignsResult)) {
            campaigns = campaignsResult;
        } else if (typeof campaignsResult === 'object') {
            campaigns = Object.values(campaignsResult);
        }

        // Filter by type and date range
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - dateRange);

        const filteredCampaigns = campaigns.filter(campaign => {
            const matchesType = type === 'all' || campaign.type === type;
            const withinDateRange = new Date(campaign.createdAt || 0) >= cutoffDate;
            
            return matchesType && withinDateRange && campaign.status === 'sent';
        });

        const totalCampaigns = filteredCampaigns.length;
        const totalRecipients = filteredCampaigns.reduce((sum, c) => sum + (c.recipientCount || 0), 0);
        const avgOpenRate = totalCampaigns > 0 ? 
            (filteredCampaigns.reduce((sum, c) => sum + (c.openRate || 0), 0) / totalCampaigns).toFixed(1) : 0;
        const avgClickRate = totalCampaigns > 0 ? 
            (filteredCampaigns.reduce((sum, c) => sum + (c.clickRate || 0), 0) / totalCampaigns).toFixed(1) : 0;

        return {
            success: true,
            data: {
                totalCampaigns,
                totalRecipients,
                avgOpenRate: parseFloat(avgOpenRate),
                avgClickRate: parseFloat(avgClickRate),
                campaigns: filteredCampaigns
            }
        };
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return {
            success: false,
            error: 'Failed to fetch analytics',
            message: error.message
        };
    }
}

// SUBSCRIBERS MANAGEMENT UTILITY FUNCTIONS (NOT SERVER ACTIONS)
// These functions can be imported directly into client components

/**
 * Get all subscribers utility function with pagination support
 * @param {Object} params - Query parameters (page, limit, search, status, source, etc.)
 * @returns {Promise<Object>} Subscribers data with pagination info
 */
export async function getAllNewsletterSubscribers(params = {}) {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            status = '',
            source = '',
            sortBy = 'subscribedDate',
            sortOrder = 'desc'
        } = params;

        // Get all subscribers from database
        const result = await DBService.readAll('newsletter_subscribers');
        if (!result.success) {
            throw new Error(result.error || 'Failed to fetch subscribers');
        }

        let subscribers = result.data || [];

        // Apply filters
        if (search.trim()) {
            const searchLower = search.toLowerCase().trim();
            subscribers = subscribers.filter(subscriber => 
                subscriber.name?.toLowerCase().includes(searchLower) ||
                subscriber.email?.toLowerCase().includes(searchLower) ||
                subscriber.tags?.some(tag => tag.toLowerCase().includes(searchLower))
            );
        }

        if (status) {
            subscribers = subscribers.filter(subscriber => subscriber.status === status);
        }

        if (source) {
            subscribers = subscribers.filter(subscriber => subscriber.source === source);
        }

        // Sort subscribers
        subscribers.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            // Handle date sorting
            if (sortBy === 'subscribedDate' || sortBy === 'lastActivity') {
                aValue = new Date(aValue || 0);
                bValue = new Date(bValue || 0);
            }

            // Handle string sorting
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        // Calculate pagination
        const totalItems = subscribers.length;
        const totalPages = Math.ceil(totalItems / limit);
        const offset = (page - 1) * limit;
        const paginatedSubscribers = subscribers.slice(offset, offset + limit);

        return {
            success: true,
            data: paginatedSubscribers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalItems,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    } catch (error) {
        console.error('Error fetching subscribers:', error);
        return {
            success: false,
            error: 'Failed to fetch subscribers',
            message: error.message
        };
    }
}

/**
 * Create a new subscriber utility function
 * @param {Object} subscriberData - Subscriber data to create
 * @returns {Promise<Object>} Created subscriber data
 */
export async function createNewsletterSubscriber(subscriberData) {
    try {
        const subscriber = {
            id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: subscriberData.name || '',
            email: subscriberData.email,
            phone: subscriberData.phone || '',
            status: subscriberData.status || 'active',
            source: subscriberData.source || 'manual',
            tags: subscriberData.tags || [],
            subscribedDate: subscriberData.subscribedDate || new Date().toISOString(),
            lastActivity: subscriberData.lastActivity || null,
            preferences: subscriberData.preferences || {},
            metadata: subscriberData.metadata || {},
            ...subscriberData
        };

        const result = await DBService.create(subscriber, 'newsletter_subscribers');
        if (!result.success) {
            throw new Error(result.error || 'Failed to create subscriber');
        }

        return {
            success: true,
            data: result.data
        };
    } catch (error) {
        console.error('Error creating subscriber:', error);
        return {
            success: false,
            error: 'Failed to create subscriber',
            message: error.message
        };
    }
}

/**
 * Update a subscriber utility function
 * @param {string} subscriberId - ID of the subscriber to update
 * @param {Object} subscriberData - Subscriber data to update
 * @returns {Promise<Object>} Updated subscriber data
 */
export async function updateNewsletterSubscriber(subscriberId, subscriberData) {
    try {
        const updateData = {
            ...subscriberData,
            updatedAt: new Date().toISOString()
        };

        const result = await DBService.update(subscriberId, updateData, 'newsletter_subscribers');
        if (!result.success) {
            throw new Error(result.error || 'Failed to update subscriber');
        }

        return {
            success: true,
            data: result.data
        };
    } catch (error) {
        console.error('Error updating subscriber:', error);
        return {
            success: false,
            error: 'Failed to update subscriber',
            message: error.message
        };
    }
}

/**
 * Delete a subscriber utility function
 * @param {string} subscriberId - ID of the subscriber to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteNewsletterSubscriber(subscriberId) {
    try {
        const result = await DBService.remove(subscriberId, 'newsletter_subscribers');
        if (!result.success) {
            throw new Error(result.error || 'Failed to delete subscriber');
        }

        return {
            success: true,
            message: 'Subscriber deleted successfully'
        };
    } catch (error) {
        console.error('Error deleting subscriber:', error);
        return {
            success: false,
            error: 'Failed to delete subscriber',
            message: error.message
        };
    }
}

/**
 * Get subscriber by email utility function
 * @param {string} email - Email of the subscriber to find
 * @returns {Promise<Object>} Subscriber data
 */
export async function getSubscriberByEmail(email) {
    try {
        const result = await DBService.getItemByKey('email', email, 'newsletter_subscribers');
        if (!result.success) {
            return {
                success: false,
                error: 'Subscriber not found'
            };
        }

        return {
            success: true,
            data: result.data
        };
    } catch (error) {
        console.error('Error finding subscriber:', error);
        return {
            success: false,
            error: 'Failed to find subscriber',
            message: error.message
        };
    }
}

/**
 * Update subscriber status utility function
 * @param {string} subscriberId - ID of the subscriber
 * @param {string} status - New status (active, unsubscribed, bounced)
 * @returns {Promise<Object>} Update result
 */
export async function updateSubscriberStatus(subscriberId, status) {
    try {
        const updateData = {
            status,
            statusUpdatedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Add unsubscribe date if status is unsubscribed
        if (status === 'unsubscribed') {
            updateData.unsubscribedDate = new Date().toISOString();
        }

        const result = await DBService.update(subscriberId, updateData, 'newsletter_subscribers');
        if (!result.success) {
            throw new Error(result.error || 'Failed to update subscriber status');
        }

        return {
            success: true,
            data: result.data
        };
    } catch (error) {
        console.error('Error updating subscriber status:', error);
        return {
            success: false,
            error: 'Failed to update subscriber status',
            message: error.message
        };
    }
}

/**
 * Get subscriber statistics utility function
 * @returns {Promise<Object>} Subscriber statistics
 */
export async function getSubscriberStats() {
    try {
        const result = await DBService.readAll('newsletter_subscribers');
        if (!result.success) {
            throw new Error(result.error || 'Failed to fetch subscribers');
        }

        const subscribers = result.data || [];
        
        // Calculate stats
        const total = subscribers.length;
        const active = subscribers.filter(s => s.status === 'active').length;
        const unsubscribed = subscribers.filter(s => s.status === 'unsubscribed').length;
        const bounced = subscribers.filter(s => s.status === 'bounced').length;

        // Calculate growth (subscribers in last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recentSubscribers = subscribers.filter(s => {
            const subDate = new Date(s.subscribedDate);
            return subDate >= weekAgo && s.status === 'active';
        }).length;

        // Calculate churn rate
        const churnRate = total > 0 ? ((unsubscribed / total) * 100).toFixed(1) : 0;

        // Group by source
        const bySource = subscribers.reduce((acc, subscriber) => {
            const source = subscriber.source || 'unknown';
            acc[source] = (acc[source] || 0) + 1;
            return acc;
        }, {});

        return {
            success: true,
            data: {
                total,
                active,
                unsubscribed,
                bounced,
                recentSubscribers,
                churnRate: parseFloat(churnRate),
                bySource
            }
        };
    } catch (error) {
        console.error('Error fetching subscriber stats:', error);
        return {
            success: false,
            error: 'Failed to fetch subscriber stats',
            message: error.message
        };
    }
}

/**
 * Bulk update subscribers utility function
 * @param {Array} subscriberIds - Array of subscriber IDs
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Update result
 */
export async function bulkUpdateSubscribers(subscriberIds, updateData) {
    try {
        const results = [];
        
        for (const subscriberId of subscriberIds) {
            const result = await updateNewsletterSubscriber(subscriberId, updateData);
            results.push(result);
        }

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;

        return {
            success: true,
            data: {
                total: results.length,
                successful: successCount,
                failed: failureCount
            }
        };
    } catch (error) {
        console.error('Error bulk updating subscribers:', error);
        return {
            success: false,
            error: 'Failed to bulk update subscribers',
            message: error.message
        };
    }
}

/**
 * Export subscribers utility function
 * @param {Object} filters - Export filters
 * @returns {Promise<Object>} Export data
 */
export async function exportSubscribers(filters = {}) {
    try {
        const result = await getAllNewsletterSubscribers({ ...filters, limit: 10000 });
        if (!result.success) {
            throw new Error(result.error || 'Failed to fetch subscribers for export');
        }

        const subscribers = result.data || [];
        
        // Format data for export
        const exportData = subscribers.map(subscriber => ({
            name: subscriber.name || '',
            email: subscriber.email,
            phone: subscriber.phone || '',
            status: subscriber.status,
            source: subscriber.source,
            subscribedDate: subscriber.subscribedDate,
            lastActivity: subscriber.lastActivity || '',
            tags: Array.isArray(subscriber.tags) ? subscriber.tags.join(', ') : ''
        }));

        return {
            success: true,
            data: exportData,
            total: exportData.length
        };
    } catch (error) {
        console.error('Error exporting subscribers:', error);
        return {
            success: false,
            error: 'Failed to export subscribers',
            message: error.message
        };
    }
}

// BLOCKS MANAGEMENT UTILITY FUNCTIONS (NOT SERVER ACTIONS)
// These functions can be imported directly into client components

/**
 * Get all blocks utility function with pagination support
 * @param {Object} params - Query parameters (page, limit, search, type, status, etc.)
 * @returns {Promise<Object>} Blocks data with pagination info
 */
export async function getAllBlocks(params = {}) {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search = '', 
            type = 'all',
            status = 'all',
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = params;

        // Fetch all blocks from database
        const blocksData = await DBService.readAll('blocks');
        
        // Convert to array if needed
        let blocks = Array.isArray(blocksData) ? blocksData : Object.values(blocksData || {});

        // Apply search filter
        if (search && search.trim()) {
            const searchTerm = search.toLowerCase().trim();
            blocks = blocks.filter(block => {
                return (
                    (block.name || '').toLowerCase().includes(searchTerm) ||
                    (block.description || '').toLowerCase().includes(searchTerm) ||
                    (block.id || '').toLowerCase().includes(searchTerm)
                );
            });
        }

        // Apply type filter
        if (type && type !== 'all') {
            blocks = blocks.filter(block => block.type === type);
        }

        // Apply status filter
        if (status && status !== 'all') {
            const isActive = status === 'active';
            blocks = blocks.filter(block => block.isActive === isActive);
        }

        // Sort blocks
        blocks.sort((a, b) => {
            const aValue = a[sortBy] || '';
            const bValue = b[sortBy] || '';
            
            if (sortOrder === 'desc') {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            } else {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            }
        });

        // Calculate pagination
        const total = blocks.length;
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;
        const paginatedBlocks = blocks.slice(offset, offset + limit);

        const pagination = {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        };

        return {
            success: true,
            data: paginatedBlocks,
            pagination
        };
    } catch (error) {
        console.error('Error fetching blocks:', error);
        return {
            success: false,
            error: 'Failed to fetch blocks data',
            data: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false }
        };
    }
}

/**
 * Get single block by ID utility function (for frontend use)
 * @param {string} blockId - ID of the block to get
 * @returns {Promise<Object>} Block data
 */
export async function getBlockById(blockId) {
    try {
        const block = await DBService.getItemByKey('id', blockId, 'blocks');
        
        if (!block) {
            return {
                success: false,
                error: 'Block not found',
                data: null
            };
        }

        return {
            success: true,
            data: block
        };
    } catch (error) {
        console.error('Error fetching block:', error);
        return {
            success: false,
            error: 'Failed to fetch block',
            data: null
        };
    }
}

/**
 * Create a new block utility function
 * @param {Object} blockData - Block data to create
 * @returns {Promise<Object>} Created block data
 */
export async function createBlock(blockData) {
    try {
        // Generate unique ID if not provided
        const blockId = blockData.id || `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Prepare block data
        const newBlock = {
            id: blockId,
            name: blockData.name || '',
            description: blockData.description || '',
            type: blockData.type || 'text',
            content: blockData.content || '',
            data: blockData.data || {},
            settings: blockData.settings || {},
            isActive: blockData.isActive !== false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: blockData.createdBy || 'admin'
        };

        // Validate required fields
        if (!newBlock.name.trim()) {
            return {
                success: false,
                error: 'Block name is required'
            };
        }

        // Check for duplicate ID
        const existingBlock = await DBService.getItemByKey('id', blockId, 'blocks');
        if (existingBlock) {
            return {
                success: false,
                error: 'Block ID already exists'
            };
        }

        const result = await DBService.create(newBlock, 'blocks');
        
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error creating block:', error);
        return {
            success: false,
            error: 'Failed to create block'
        };
    }
}

/**
 * Update a block utility function
 * @param {string} blockId - ID of the block to update
 * @param {Object} blockData - Block data to update
 * @returns {Promise<Object>} Updated block data
 */
export async function updateBlock(blockId, blockData) {
    try {
        // Fetch existing block
        const existingBlock = await DBService.getItemByKey('id', blockId, 'blocks');
        
        if (!existingBlock) {
            return {
                success: false,
                error: 'Block not found'
            };
        }

        // Prepare update data
        const updateData = {
            ...existingBlock,
            ...blockData,
            id: blockId, // Ensure ID doesn't change
            updatedAt: new Date().toISOString()
        };

        // Validate required fields
        if (!updateData.name.trim()) {
            return {
                success: false,
                error: 'Block name is required'
            };
        }

        const result = await DBService.update(blockId, updateData, 'blocks');
        
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error updating block:', error);
        return {
            success: false,
            error: 'Failed to update block'
        };
    }
}

/**
 * Delete a block utility function
 * @param {string} blockId - ID of the block to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteBlock(blockId) {
    try {
        // Check if block exists
        const existingBlock = await DBService.getItemByKey('id', blockId, 'blocks');
        
        if (!existingBlock) {
            return {
                success: false,
                error: 'Block not found'
            };
        }

        await DBService.delete(blockId, 'blocks');
        
        return {
            success: true,
            message: 'Block deleted successfully'
        };
    } catch (error) {
        console.error('Error deleting block:', error);
        return {
            success: false,
            error: 'Failed to delete block'
        };
    }
}

// AI MANAGEMENT UTILITY FUNCTIONS (NOT SERVER ACTIONS)
// These functions handle AI settings, models and Replicate integration

/**
 * Get AI settings utility function
 * @returns {Promise<Object>} AI settings data
 */
export async function getAISettings() {
    try {
        const all = await DBService.readAll('ai_settings');
        if (!all) return { success: true, data: null };

        let record = null;
        if (Array.isArray(all)) {
            record = all.length ? all[0] : null;
        } else if (typeof all === 'object') {
            const firstKey = Object.keys(all)[0];
            record = firstKey ? all[firstKey] : null;
        }

        return {
            success: true,
            data: record || null
        };
    } catch (error) {
        console.error('Error fetching AI settings:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch AI settings'
        };
    }
}

/**
 * Update or create AI settings utility function
 * @param {Object} settingsData - AI settings data to save
 * @returns {Promise<Object>} Save result
 */
export async function updateAISettings(settingsData) {
    try {
        const payload = {
            enabled: !!settingsData.enabled,
            replicateApiKey: settingsData.replicateApiKey || '',
            updatedAt: new Date().toISOString()
        };

        // Check for existing record
        const all = await DBService.readAll('ai_settings');
        let existingKey = null;
        if (Array.isArray(all) && all.length) {
            const first = all[0];
            existingKey = first.id || first.key || null;
        } else if (all && typeof all === 'object') {
            const firstKey = Object.keys(all)[0];
            if (firstKey) existingKey = firstKey;
        }

        let result;
        if (existingKey) {
            result = await DBService.update(existingKey, payload, 'ai_settings');
        } else {
            payload.createdAt = new Date().toISOString();
            result = await DBService.create(payload, 'ai_settings');
        }

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error updating AI settings:', error);
        return {
            success: false,
            error: error.message || 'Failed to update AI settings'
        };
    }
}

/**
 * Get all AI models utility function
 * @param {Object} params - Query parameters (enabled filter, etc.)
 * @returns {Promise<Object>} AI models data
 */
export async function getAllAIModels(params = {}) {
    try {
        const all = await DBService.readAll('ai_models');
        if (!all) return { success: true, data: [] };

        let records = [];
        if (Array.isArray(all)) {
            records = all;
        } else if (typeof all === 'object') {
            records = Object.values(all || {});
        }

        // Filter enabled models if requested
        if (params.enabledOnly) {
            records = records.filter(model => model.enabled === true);
        }

        // Sort by creation date (newest first)
        records.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
        });

        return {
            success: true,
            data: records
        };
    } catch (error) {
        console.error('Error fetching AI models:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch AI models'
        };
    }
}

/**
 * Get AI model by ID utility function
 * @param {string} modelId - ID of the model to get
 * @returns {Promise<Object>} AI model data
 */
export async function getAIModelById(modelId) {
    try {
        const result = await DBService.getItemByKey('id', modelId, 'ai_models');
        if (!result) {
            return {
                success: false,
                error: 'Model not found'
            };
        }

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error fetching AI model:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch AI model'
        };
    }
}

/**
 * Create a new AI model utility function
 * @param {Object} modelData - AI model data to create
 * @returns {Promise<Object>} Created AI model data
 */
export async function createAIModel(modelData) {
    try {
        const timeNow = new Date().toISOString();
        const payload = {
            id: `ai_model_${Date.now()}`,
            name: modelData.name || 'Unnamed Model',
            modelId: modelData.modelId || '',
            description: modelData.description || '',
            enabled: modelData.enabled !== false,
            config: modelData.config || {},
            provider: 'replicate', // Always use Replicate
            createdAt: timeNow,
            updatedAt: timeNow
        };

        const result = await DBService.create(payload, 'ai_models');
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error creating AI model:', error);
        return {
            success: false,
            error: error.message || 'Failed to create AI model'
        };
    }
}

/**
 * Update an AI model utility function
 * @param {string} modelId - ID of the model to update
 * @param {Object} modelData - AI model data to update
 * @returns {Promise<Object>} Updated AI model data
 */
export async function updateAIModel(modelId, modelData) {
    try {
        const updateData = {
            name: modelData.name,
            modelId: modelData.modelId,
            description: modelData.description,
            enabled: modelData.enabled,
            config: modelData.config || {},
            updatedAt: new Date().toISOString()
        };

        // Remove undefined values
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });

        const result = await DBService.update(modelId, updateData, 'ai_models');
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error updating AI model:', error);
        return {
            success: false,
            error: error.message || 'Failed to update AI model'
        };
    }
}

/**
 * Delete an AI model utility function
 * @param {string} modelId - ID of the model to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteAIModel(modelId) {
    try {
        const result = await DBService.delete(modelId, 'ai_models');
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error deleting AI model:', error);
        return {
            success: false,
            error: error.message || 'Failed to delete AI model'
        };
    }
}

/**
 * Execute AI model utility function
 * Makes request to Replicate API with the model configuration
 * @param {string} modelId - ID of the model to execute
 * @param {Object} params - Parameters for the model execution
 * @returns {Promise<Object>} Execution result
 */
export async function executeAIModel(modelId, params = {}) {
    try {
        // Get AI settings to check if enabled and get API key
        const settingsResult = await getAISettings();
        if (!settingsResult.success || !settingsResult.data?.enabled) {
            return {
                success: false,
                error: 'AI agent is not enabled'
            };
        }

        const apiKey = settingsResult.data.replicateApiKey;
        if (!apiKey) {
            return {
                success: false,
                error: 'Replicate API key not configured'
            };
        }

        // Get the model configuration
        const modelResult = await getAIModelById(modelId);
        if (!modelResult.success) {
            return {
                success: false,
                error: 'Model not found'
            };
        }

        const model = modelResult.data;
        if (!model.enabled) {
            return {
                success: false,
                error: 'Model is disabled'
            };
        }

        // Merge model config with runtime params
        const replicateInput = {
            ...model.config,
            ...params
        };

        // Make request to Replicate API
        const response = await fetch(`https://api.replicate.com/v1/models/${model.modelId}/predictions`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                input: replicateInput
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                success: false,
                error: `Replicate API error: ${response.status} ${errorText}`
            };
        }

        const result = await response.json();
        return {
            success: true,
            data: result
        };

    } catch (error) {
        console.error('Error executing AI model:', error);
        return {
            success: false,
            error: error.message || 'Failed to execute AI model'
        };
    }
}

// ENDPOINTS MANAGEMENT UTILITY FUNCTIONS (NOT SERVER ACTIONS)
// These functions handle endpoints, API keys, and access control

/**
 * Initialize default endpoints in database
 * @returns {Promise<Object>} Initialization result
 */
export async function initializeDefaultEndpoints() {
    try {
        // Check if endpoints already exist
        const existingEndpoints = await DBService.readAll('endpoints');
        const endpointsArray = Array.isArray(existingEndpoints) ? existingEndpoints : Object.values(existingEndpoints || {});
        
        // If endpoints already exist, don't reinitialize
        if (endpointsArray.length > 0) {
            return {
                success: true,
                data: endpointsArray,
                message: 'Endpoints already initialized'
            };
        }

        // Default endpoints based on current implementation
        const defaultEndpoints = [
            {
                id: 'public-query-get',
                method: 'GET',
                path: '/api/query/public/[slug]',
                description: 'Retrieve data from any collection with optional pagination, search, and filtering',
                status: 'active',
                authentication: 'none',
                rateLimit: 100,
                rateLimitWindow: 3600000, // 1 hour
                usage: 0,
                responseFormat: 'JSON',
                parameters: 'slug (path), id, key, value, page, limit, search (query)',
                example: '{"success": true, "data": [...], "pagination": {...}}',
                isDefault: true,
                permissions: ['READ'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'public-query-post',
                method: 'POST',
                path: '/api/query/public/[slug]',
                description: 'Create new items in any collection',
                status: 'active',
                authentication: 'none',
                rateLimit: 50,
                rateLimitWindow: 3600000,
                usage: 0,
                responseFormat: 'JSON',
                parameters: 'slug (path), JSON body with item data',
                example: '{"success": true, "data": {...}, "message": "Record created successfully!"}',
                isDefault: true,
                permissions: ['WRITE'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'public-query-put',
                method: 'PUT',
                path: '/api/query/public/[slug]',
                description: 'Update existing items in any collection',
                status: 'active',
                authentication: 'none',
                rateLimit: 50,
                rateLimitWindow: 3600000,
                usage: 0,
                responseFormat: 'JSON',
                parameters: 'slug (path), JSON body with id and updated data',
                example: '{"success": true, "data": {...}, "message": "Record updated successfully!"}',
                isDefault: true,
                permissions: ['WRITE'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'public-query-delete',
                method: 'DELETE',
                path: '/api/query/public/[slug]',
                description: 'Delete items from any collection',
                status: 'active',
                authentication: 'none',
                rateLimit: 25,
                rateLimitWindow: 3600000,
                usage: 0,
                responseFormat: 'JSON',
                parameters: 'slug (path), id (query parameter)',
                example: '{"success": true, "message": "Record deleted successfully!", "data": {"id": "123"}}',
                isDefault: true,
                permissions: ['DELETE'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'upload-files',
                method: 'POST',
                path: '/api/upload',
                description: 'Upload files with support for images, documents, and media files',
                status: 'active',
                authentication: 'apikey',
                rateLimit: 20,
                rateLimitWindow: 3600000,
                usage: 0,
                responseFormat: 'JSON',
                parameters: 'file (multipart/form-data), folder, resize (query)',
                example: '{"success": true, "data": {"filename": "...", "url": "...", "size": 123456}}',
                isDefault: true,
                permissions: ['UPLOAD'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'ai-execute',
                method: 'POST',
                path: '/api/ai/execute',
                description: 'Execute AI model with custom parameters',
                status: 'active',
                authentication: 'apikey',
                rateLimit: 50,
                rateLimitWindow: 3600000,
                usage: 0,
                responseFormat: 'JSON',
                parameters: 'modelId (body), params (body object)',
                example: '{"success": true, "data": {...}}',
                isDefault: true,
                permissions: ['AI_EXECUTE'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'ai-prediction-status',
                method: 'GET',
                path: '/api/ai/prediction/[id]',
                description: 'Get the status of a Replicate prediction',
                status: 'active',
                authentication: 'apikey',
                rateLimit: 100,
                rateLimitWindow: 3600000,
                usage: 0,
                responseFormat: 'JSON',
                parameters: 'id (path parameter)',
                example: '{"success": true, "data": {"status": "succeeded", "output": [...]}}',
                isDefault: true,
                permissions: ['AI_EXECUTE'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];

        // Create all default endpoints
        const createdEndpoints = [];
        for (const endpoint of defaultEndpoints) {
            const result = await DBService.create(endpoint, 'endpoints');
            createdEndpoints.push(result);
        }

        return {
            success: true,
            data: createdEndpoints,
            message: 'Default endpoints initialized successfully'
        };
    } catch (error) {
        console.error('Error initializing default endpoints:', error);
        return {
            success: false,
            error: error.message || 'Failed to initialize default endpoints'
        };
    }
}

/**
 * Get all endpoints utility function
 * @param {Object} params - Query parameters (includeDefault, status, etc.)
 * @returns {Promise<Object>} Endpoints data
 */
export async function getAllEndpoints(params = {}) {
    try {
        // Initialize default endpoints if needed
        await initializeDefaultEndpoints();
        
        const all = await DBService.readAll('endpoints');
        let records = [];
        if (Array.isArray(all)) {
            records = all;
        } else if (typeof all === 'object') {
            records = Object.values(all || {});
        }

        // Apply filters
        if (params.status) {
            records = records.filter(endpoint => endpoint.status === params.status);
        }

        if (params.isDefault !== undefined) {
            records = records.filter(endpoint => endpoint.isDefault === params.isDefault);
        }

        if (params.method) {
            records = records.filter(endpoint => endpoint.method === params.method);
        }

        // Sort by creation date (newest first)
        records.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
        });

        return {
            success: true,
            data: records
        };
    } catch (error) {
        console.error('Error fetching endpoints:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch endpoints'
        };
    }
}

/**
 * Get endpoint by ID utility function
 * @param {string} endpointId - ID of the endpoint to get
 * @returns {Promise<Object>} Endpoint data
 */
export async function getEndpointById(endpointId) {
    try {
        const result = await DBService.getItemByKey('id', endpointId, 'endpoints');
        if (!result) {
            return {
                success: false,
                error: 'Endpoint not found'
            };
        }

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error fetching endpoint:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch endpoint'
        };
    }
}

/**
 * Create a new custom endpoint utility function
 * @param {Object} endpointData - Endpoint data to create
 * @returns {Promise<Object>} Created endpoint data
 */
export async function createCustomEndpoint(endpointData) {
    try {
        const timeNow = new Date().toISOString();
        const payload = {
            id: `custom_endpoint_${Date.now()}`,
            method: endpointData.method || 'GET',
            path: endpointData.path || '',
            description: endpointData.description || '',
            status: endpointData.status || 'active',
            authentication: endpointData.authentication || 'apikey',
            rateLimit: endpointData.rateLimit || 100,
            rateLimitWindow: endpointData.rateLimitWindow || 3600000,
            usage: 0,
            responseFormat: endpointData.responseFormat || 'JSON',
            parameters: endpointData.parameters || '',
            example: endpointData.example || '{}',
            permissions: endpointData.permissions || [],
            isDefault: false, // Custom endpoints are never default
            createdAt: timeNow,
            updatedAt: timeNow
        };

        const result = await DBService.create(payload, 'endpoints');
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error creating custom endpoint:', error);
        return {
            success: false,
            error: error.message || 'Failed to create custom endpoint'
        };
    }
}

/**
 * Update an endpoint utility function (only for custom endpoints)
 * @param {string} endpointId - ID of the endpoint to update
 * @param {Object} endpointData - Endpoint data to update
 * @returns {Promise<Object>} Updated endpoint data
 */
export async function updateCustomEndpoint(endpointId, endpointData) {
    try {
        // Get the endpoint first to check if it's a default endpoint
        const existingEndpoint = await DBService.getItemByKey('id', endpointId, 'endpoints');
        
        if (!existingEndpoint) {
            return {
                success: false,
                error: 'Endpoint not found'
            };
        }

        if (existingEndpoint.isDefault) {
            return {
                success: false,
                error: 'Default endpoints cannot be modified'
            };
        }

        const updateData = {
            ...endpointData,
            updatedAt: new Date().toISOString()
        };

        // Remove undefined values and prevent changing isDefault
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined || key === 'isDefault') {
                delete updateData[key];
            }
        });

        const result = await DBService.update(endpointId, updateData, 'endpoints');
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error updating endpoint:', error);
        return {
            success: false,
            error: error.message || 'Failed to update endpoint'
        };
    }
}

/**
 * Delete a custom endpoint utility function (only for custom endpoints)
 * @param {string} endpointId - ID of the endpoint to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteCustomEndpoint(endpointId) {
    try {
        // Get the endpoint first to check if it's a default endpoint
        const existingEndpoint = await DBService.getItemByKey('id', endpointId, 'endpoints');
        
        if (!existingEndpoint) {
            return {
                success: false,
                error: 'Endpoint not found'
            };
        }

        if (existingEndpoint.isDefault) {
            return {
                success: false,
                error: 'Default endpoints cannot be deleted'
            };
        }

        const result = await DBService.delete(endpointId, 'endpoints');
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error deleting endpoint:', error);
        return {
            success: false,
            error: error.message || 'Failed to delete endpoint'
        };
    }
}

// API KEYS MANAGEMENT UTILITY FUNCTIONS

/**
 * Get all API keys utility function
 * @param {Object} params - Query parameters (status, etc.)
 * @returns {Promise<Object>} API keys data
 */
export async function getAllAPIKeys(params = {}) {
    try {
        const all = await DBService.readAll('api_keys');
        let records = [];
        if (Array.isArray(all)) {
            records = all;
        } else if (typeof all === 'object') {
            records = Object.values(all || {});
        }

        // Apply status filter
        if (params.status) {
            records = records.filter(key => key.status === params.status);
        }

        // Sort by creation date (newest first)
        records.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
        });

        return {
            success: true,
            data: records
        };
    } catch (error) {
        console.error('Error fetching API keys:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch API keys'
        };
    }
}

/**
 * Get API key by key string utility function (for authentication)
 * @param {string} apiKeyString - The API key string to validate
 * @returns {Promise<Object>} API key data
 */
export async function getAPIKeyByString(apiKeyString) {
    try {
        const result = await DBService.getItemByKey('key', apiKeyString, 'api_keys');
        if (!result) {
            return {
                success: false,
                error: 'API key not found'
            };
        }

        // Check if API key is active and not expired
        if (result.status !== 'active') {
            return {
                success: false,
                error: 'API key is not active'
            };
        }

        if (result.expiresAt && new Date(result.expiresAt) < new Date()) {
            return {
                success: false,
                error: 'API key has expired'
            };
        }

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error validating API key:', error);
        return {
            success: false,
            error: error.message || 'Failed to validate API key'
        };
    }
}

/**
 * Validate API key - alias for getAPIKeyByString for clarity
 * @param {string} apiKeyString - The API key string to validate
 * @returns {Promise<Object>} API key validation result
 */
export async function validateApiKey(apiKeyString) {
    return await getAPIKeyByString(apiKeyString);
}

/**
 * Create a new API key utility function
 * @param {Object} apiKeyData - API key data to create
 * @returns {Promise<Object>} Created API key data
 */
export async function createAPIKey(apiKeyData) {
    try {
        const timeNow = new Date().toISOString();
        
        // Generate API key
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 15);
        const random2 = Math.random().toString(36).substring(2, 15);
        const apiKey = `pk_live_${timestamp}_${random}_${random2}`;

        const payload = {
            id: `api_key_${Date.now()}`,
            name: apiKeyData.name || 'Unnamed API Key',
            description: apiKeyData.description || '',
            key: apiKey,
            keyPreview: `${apiKey.substring(0, 20)}...${apiKey.slice(-4)}`,
            permissions: apiKeyData.permissions || ['READ'],
            rateLimit: apiKeyData.rateLimit || 100,
            rateLimitWindow: apiKeyData.rateLimitWindow || 3600000,
            status: 'active',
            usage: 0,
            lastUsed: null,
            expiresAt: apiKeyData.expiresAt || null,
            createdAt: timeNow,
            updatedAt: timeNow
        };

        const result = await DBService.create(payload, 'api_keys');
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error creating API key:', error);
        return {
            success: false,
            error: error.message || 'Failed to create API key'
        };
    }
}

/**
 * Update an API key utility function
 * @param {string} keyId - ID of the API key to update
 * @param {Object} apiKeyData - API key data to update
 * @returns {Promise<Object>} Updated API key data
 */
export async function updateAPIKey(keyId, apiKeyData) {
    try {
        const updateData = {
            ...apiKeyData,
            updatedAt: new Date().toISOString()
        };

        // Remove undefined values and prevent changing the actual key
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined || key === 'key') {
                delete updateData[key];
            }
        });

        const result = await DBService.update(keyId, updateData, 'api_keys');
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error updating API key:', error);
        return {
            success: false,
            error: error.message || 'Failed to update API key'
        };
    }
}

/**
 * Delete an API key utility function
 * @param {string} keyId - ID of the API key to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteAPIKey(keyId) {
    try {
        const result = await DBService.delete(keyId, 'api_keys');
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error deleting API key:', error);
        return {
            success: false,
            error: error.message || 'Failed to delete API key'
        };
    }
}

/**
 * Increment API key usage utility function
 * @param {string} apiKeyString - The API key string
 * @returns {Promise<Object>} Update result
 */
export async function incrementAPIKeyUsage(apiKeyString) {
    try {
        const apiKeyResult = await getAPIKeyByString(apiKeyString);
        if (!apiKeyResult.success) {
            return apiKeyResult;
        }

        const apiKey = apiKeyResult.data;
        const updateData = {
            usage: (apiKey.usage || 0) + 1,
            lastUsed: new Date().toISOString()
        };

        const keyId = apiKey.id || apiKey.key;
        await DBService.update(keyId, updateData, 'api_keys');

        return {
            success: true,
            data: { ...apiKey, ...updateData }
        };
    } catch (error) {
        console.error('Error incrementing API key usage:', error);
        return {
            success: false,
            error: error.message || 'Failed to update API key usage'
        };
    }
}

// API SETTINGS MANAGEMENT

/**
 * Get API settings utility function
 * @returns {Promise<Object>} API settings data
 */
export async function getAPISettings() {
    try {
        const all = await DBService.readAll('api_settings');
        let record = null;
        
        if (Array.isArray(all)) {
            record = all.length ? all[0] : null;
        } else if (typeof all === 'object') {
            const firstKey = Object.keys(all)[0];
            record = firstKey ? all[firstKey] : null;
        }

        // Return default settings if none exist
        if (!record) {
            const defaultSettings = {
                apiEnabled: true,
                allowedOrigins: ['*'],
                rateLimit: {
                    enabled: true,
                    defaultLimit: 100,
                    windowMs: 3600000
                }
            };
            return {
                success: true,
                data: defaultSettings
            };
        }

        return {
            success: true,
            data: record
        };
    } catch (error) {
        console.error('Error fetching API settings:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch API settings'
        };
    }
}

/**
 * Update or create API settings utility function
 * @param {Object} settingsData - API settings data to save
 * @returns {Promise<Object>} Save result
 */
export async function updateAPISettings(settingsData) {
    try {
        const payload = {
            apiEnabled: settingsData.apiEnabled !== false,
            allowedOrigins: settingsData.allowedOrigins || ['*'],
            rateLimit: settingsData.rateLimit || {
                enabled: true,
                defaultLimit: 100,
                windowMs: 3600000
            },
            updatedAt: new Date().toISOString()
        };

        // Check for existing record
        const all = await DBService.readAll('api_settings');
        let existingKey = null;
        if (Array.isArray(all) && all.length) {
            const first = all[0];
            existingKey = first.id || first.key || null;
        } else if (all && typeof all === 'object') {
            const firstKey = Object.keys(all)[0];
            if (firstKey) existingKey = firstKey;
        }

        let result;
        if (existingKey) {
            result = await DBService.update(existingKey, payload, 'api_settings');
        } else {
            payload.createdAt = new Date().toISOString();
            result = await DBService.create(payload, 'api_settings');
        }

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error updating API settings:', error);
        return {
            success: false,
            error: error.message || 'Failed to update API settings'
        };
    }
}

// ENDPOINTS MANAGEMENT SERVER ACTIONS

/**
 * Get all endpoints server action
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Endpoints data
 */
export async function getAllEndpointsAction(params = {}) {
    try {
        const result = await getAllEndpoints(params);
        return result;
    } catch (error) {
        console.error('Error in get all endpoints action:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch endpoints'
        };
    }
}

/**
 * Get endpoint by ID server action
 * @param {string} endpointId - ID of the endpoint to get
 * @returns {Promise<Object>} Endpoint data
 */
export async function getEndpointByIdAction(endpointId) {
    try {
        const result = await getEndpointById(endpointId);
        return result;
    } catch (error) {
        console.error('Error in get endpoint action:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch endpoint'
        };
    }
}

/**
 * Create custom endpoint server action
 * @param {Object} endpointData - Endpoint data to create
 * @returns {Promise<Object>} Created endpoint data
 */
export async function createCustomEndpointAction(endpointData) {
    try {
        const result = await createCustomEndpoint(endpointData);
        return result;
    } catch (error) {
        console.error('Error in create custom endpoint action:', error);
        return {
            success: false,
            error: error.message || 'Failed to create custom endpoint'
        };
    }
}

/**
 * Update custom endpoint server action
 * @param {string} endpointId - ID of the endpoint to update
 * @param {Object} endpointData - Endpoint data to update
 * @returns {Promise<Object>} Updated endpoint data
 */
export async function updateCustomEndpointAction(endpointId, endpointData) {
    try {
        const result = await updateCustomEndpoint(endpointId, endpointData);
        return result;
    } catch (error) {
        console.error('Error in update custom endpoint action:', error);
        return {
            success: false,
            error: error.message || 'Failed to update custom endpoint'
        };
    }
}

/**
 * Delete custom endpoint server action
 * @param {string} endpointId - ID of the endpoint to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteCustomEndpointAction(endpointId) {
    try {
        const result = await deleteCustomEndpoint(endpointId);
        return result;
    } catch (error) {
        console.error('Error in delete custom endpoint action:', error);
        return {
            success: false,
            error: error.message || 'Failed to delete custom endpoint'
        };
    }
}

// API KEYS MANAGEMENT SERVER ACTIONS

/**
 * Get all API keys server action
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} API keys data
 */
export async function getAllAPIKeysAction(params = {}) {
    try {
        const result = await getAllAPIKeys(params);
        return result;
    } catch (error) {
        console.error('Error in get all API keys action:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch API keys'
        };
    }
}

/**
 * Create API key server action
 * @param {Object} apiKeyData - API key data to create
 * @returns {Promise<Object>} Created API key data
 */
export async function createAPIKeyAction(apiKeyData) {
    try {
        const result = await createAPIKey(apiKeyData);
        return result;
    } catch (error) {
        console.error('Error in create API key action:', error);
        return {
            success: false,
            error: error.message || 'Failed to create API key'
        };
    }
}

/**
 * Update API key server action
 * @param {string} keyId - ID of the API key to update
 * @param {Object} apiKeyData - API key data to update
 * @returns {Promise<Object>} Updated API key data
 */
export async function updateAPIKeyAction(keyId, apiKeyData) {
    try {
        const result = await updateAPIKey(keyId, apiKeyData);
        return result;
    } catch (error) {
        console.error('Error in update API key action:', error);
        return {
            success: false,
            error: error.message || 'Failed to update API key'
        };
    }
}

/**
 * Delete API key server action
 * @param {string} keyId - ID of the API key to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteAPIKeyAction(keyId) {
    try {
        const result = await deleteAPIKey(keyId);
        return result;
    } catch (error) {
        console.error('Error in delete API key action:', error);
        return {
            success: false,
            error: error.message || 'Failed to delete API key'
        };
    }
}

// API SETTINGS MANAGEMENT SERVER ACTIONS

/**
 * Get API settings server action
 * @returns {Promise<Object>} API settings data
 */
export async function getAPISettingsAction() {
    try {
        const result = await getAPISettings();
        return result;
    } catch (error) {
        console.error('Error in get API settings action:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch API settings'
        };
    }
}

/**
 * Update API settings server action
 * @param {Object} settingsData - API settings data to save
 * @returns {Promise<Object>} Save result
 */
export async function updateAPISettingsAction(settingsData) {
    try {
        const payload = {
            apiEnabled: settingsData.apiEnabled !== false,
            allowedOrigins: settingsData.allowedOrigins || ['*'],
            rateLimit: settingsData.rateLimit || {
                enabled: true,
                defaultLimit: 100,
                windowMs: 3600000
            },
            updatedAt: new Date().toISOString()
        };

        // Check for existing record
        const all = await DBService.readAll('api_settings');
        let existingKey = null;
        if (Array.isArray(all) && all.length) {
            const first = all[0];
            existingKey = first.id || first.key || null;
        } else if (all && typeof all === 'object') {
            const firstKey = Object.keys(all)[0];
            if (firstKey) existingKey = firstKey;
        }

        let result;
        if (existingKey) {
            result = await DBService.update(existingKey, payload, 'api_settings');
        } else {
            payload.createdAt = new Date().toISOString();
            result = await DBService.create(payload, 'api_settings');
        }

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error updating API settings:', error);
        return {
            success: false,
            error: error.message || 'Failed to update API settings'
        };
    }
}

// CRONJOBS MANAGEMENT UTILITY FUNCTIONS (NOT SERVER ACTIONS)
// These functions can be imported directly into client components

/**
 * Get all cronjobs utility function
 * @param {Object} params - Query parameters (status filter, etc.)
 * @returns {Promise<Object>} Cronjobs data
 */
export async function getAllCronjobs(params = {}) {
    try {
        const { statusFilter } = params;
        
        const allCronjobs = await DBService.readAll('cronjobs');
        
        if (!allCronjobs || Object.keys(allCronjobs).length === 0) {
            return {
                success: true,
                data: [],
                message: 'No cronjobs found'
            };
        }

        // Convert object to array
        let cronjobsArray = Array.isArray(allCronjobs) ? allCronjobs : Object.entries(allCronjobs).map(([key, value]) => ({
            id: key,
            ...value
        }));

        // Apply status filter
        if (statusFilter && statusFilter !== 'all') {
            cronjobsArray = cronjobsArray.filter(job => {
                if (statusFilter === 'enabled') return job.enabled === true;
                if (statusFilter === 'disabled') return job.enabled === false;
                return true;
            });
        }

        // Sort by creation date (newest first)
        cronjobsArray.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB.getTime() - dateA.getTime();
        });

        return {
            success: true,
            data: cronjobsArray
        };
    } catch (error) {
        console.error('Error fetching cronjobs:', error);
        return {
            success: false,
            error: 'Failed to fetch cronjobs',
            message: error.message,
            data: []
        };
    }
}

/**
 * Create a new cronjob utility function
 * @param {Object} cronjobData - Cronjob data to create
 * @returns {Promise<Object>} Created cronjob data
 */
export async function createCronjob(cronjobData) {
    try {
        const timeNow = new Date().toISOString();
        const newCronjob = {
            ...cronjobData,
            id: cronjobData.id || Date.now().toString(),
            createdAt: timeNow,
            updatedAt: timeNow,
            lastRun: null,
            lastStatus: null,
            enabled: cronjobData.enabled !== false // Default to true
        };

        const result = await DBService.create(newCronjob, 'cronjobs');

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error creating cronjob:', error);
        return {
            success: false,
            error: 'Failed to create cronjob',
            message: error.message
        };
    }
}

/**
 * Update a cronjob utility function
 * @param {string} cronjobId - ID of the cronjob to update
 * @param {Object} cronjobData - Cronjob data to update
 * @returns {Promise<Object>} Updated cronjob data
 */
export async function updateCronjob(cronjobId, cronjobData) {
    try {
        const updateData = {
            ...cronjobData,
            updatedAt: new Date().toISOString()
        };

        const result = await DBService.update(cronjobId, updateData, 'cronjobs');

        if (!result) {
            return {
                success: false,
                error: 'Cronjob not found'
            };
        }

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error updating cronjob:', error);
        return {
            success: false,
            error: 'Failed to update cronjob',
            message: error.message
        };
    }
}

/**
 * Delete a cronjob utility function
 * @param {string} cronjobId - ID of the cronjob to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteCronjob(cronjobId) {
    try {
        const result = await DBService.delete(cronjobId, 'cronjobs');

        return {
            success: true,
            message: 'Cronjob deleted successfully'
        };
    } catch (error) {
        console.error('Error deleting cronjob:', error);
        return {
            success: false,
            error: 'Failed to delete cronjob',
            message: error.message
        };
    }
}

/**
 * Execute cronjobs that are due to run
 * @returns {Promise<Object>} Execution result
 */
export async function executeDueCronjobs() {
    try {
        const allCronjobs = await DBService.readAll('cronjobs');
        
        if (!allCronjobs || Object.keys(allCronjobs).length === 0) {
            return {
                success: true,
                message: 'No cronjobs to execute',
                executed: 0
            };
        }

        const cronjobsArray = Array.isArray(allCronjobs) ? allCronjobs : Object.entries(allCronjobs).map(([key, value]) => ({
            id: key,
            ...value
        }));

        const now = Date.now();
        let executed = 0;

        for (const job of cronjobsArray) {
            if (!job.enabled) continue;

            const lastRun = job.lastRun ? new Date(job.lastRun).getTime() : 0;
            const intervalMs = (job.intervalMinutes || 60) * 60 * 1000;
            
            if (now - lastRun >= intervalMs) {
                try {
                    // Execute HTTP cronjob
                    if (job.type === 'http' && job.config?.url) {
                        const response = await fetch(job.config.url, {
                            method: job.config.method || 'GET',
                            headers: job.config.headers || {},
                            body: job.config.body ? JSON.stringify(job.config.body) : undefined
                        });

                        // Update job status
                        await DBService.update(job.id, {
                            lastRun: new Date().toISOString(),
                            lastStatus: response.ok ? 'success' : `error: ${response.status}`,
                            updatedAt: new Date().toISOString()
                        }, 'cronjobs');

                        executed++;
                    }
                } catch (jobError) {
                    console.error(`Error executing cronjob ${job.id}:`, jobError);
                    
                    // Update job with error status
                    await DBService.update(job.id, {
                        lastRun: new Date().toISOString(),
                        lastStatus: `error: ${jobError.message}`,
                        updatedAt: new Date().toISOString()
                    }, 'cronjobs');
                }
            }
        }

        return {
            success: true,
            message: `Executed ${executed} cronjobs`,
            executed
        };
    } catch (error) {
        console.error('Error executing cronjobs:', error);
        return {
            success: false,
            error: 'Failed to execute cronjobs',
            message: error.message,
            executed: 0
        };
    }
}

// CRONJOBS MANAGEMENT SERVER ACTIONS

/**
 * Get all cronjobs server action
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Cronjobs data
 */
export async function getAllCronjobsAction(params = {}) {
    try {
        return await getAllCronjobs(params);
    } catch (error) {
        console.error('Error in get all cronjobs action:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch cronjobs'
        };
    }
}

/**
 * Create cronjob server action
 * @param {Object} cronjobData - Cronjob data to create
 * @returns {Promise<Object>} Created cronjob data
 */
export async function createCronjobAction(cronjobData) {
    try {
        return await createCronjob(cronjobData);
    } catch (error) {
        console.error('Error in create cronjob action:', error);
        return {
            success: false,
            error: error.message || 'Failed to create cronjob'
        };
    }
}

/**
 * Update cronjob server action
 * @param {string} cronjobId - ID of the cronjob to update
 * @param {Object} cronjobData - Cronjob data to update
 * @returns {Promise<Object>} Updated cronjob data
 */
export async function updateCronjobAction(cronjobId, cronjobData) {
    try {
        return await updateCronjob(cronjobId, cronjobData);
    } catch (error) {
        console.error('Error in update cronjob action:', error);
        return {
            success: false,
            error: error.message || 'Failed to update cronjob'
        };
    }
}

/**
 * Delete cronjob server action
 * @param {string} cronjobId - ID of the cronjob to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteCronjobAction(cronjobId) {
    try {
        return await deleteCronjob(cronjobId);
    } catch (error) {
        console.error('Error in delete cronjob action:', error);
        return {
            success: false,
            error: error.message || 'Failed to delete cronjob'
        };
    }
}

/**
 * Execute due cronjobs server action
 * @returns {Promise<Object>} Execution result
 */
export async function executeDueCronjobsAction() {
    try {
        return await executeDueCronjobs();
    } catch (error) {
        console.error('Error in execute due cronjobs action:', error);
        return {
            success: false,
            error: error.message || 'Failed to execute cronjobs'
        };
    }
}

// SITE SETTINGS MANAGEMENT UTILITY FUNCTIONS (NOT SERVER ACTIONS)
// These functions handle site settings with sensitive data filtering for public API access

/**
 * Get all site settings utility function (internal use - includes sensitive data)
 * @returns {Promise<Object>} Complete site settings data
 */
export async function getAllSiteSettings() {
    try {
        const allSettings = await DBService.readAll('site_settings');
        
        if (!allSettings || Object.keys(allSettings).length === 0) {
            return {
                success: true,
                data: null,
                message: 'No site settings found'
            };
        }

        // Convert object to array and find the main settings record
        const settingsArray = Array.isArray(allSettings) ? allSettings : Object.entries(allSettings).map(([key, value]) => ({
            id: key,
            ...value
        }));

        // Find the main site settings record
        const mainSettings = settingsArray.find(s => s.type === 'site' || s.key === 'site' || !s.type) || settingsArray[0];

        return {
            success: true,
            data: mainSettings || null
        };
    } catch (error) {
        console.error('Error fetching site settings:', error);
        return {
            success: false,
            error: 'Failed to fetch site settings',
            message: error.message,
            data: null
        };
    }
}

/**
 * Get public site settings utility function (external API - sensitive data filtered)
 * @returns {Promise<Object>} Filtered site settings data safe for public consumption
 */
export async function getPublicSiteSettings() {
    try {
        const result = await getAllSiteSettings();
        
        if (!result.success || !result.data) {
            return result;
        }

        const settings = result.data;
        
        // Filter out sensitive data for public API
        const publicSettings = {
            siteName: settings.siteName || '',
            siteEmail: settings.siteEmail || '',
            sitePhone: settings.sitePhone || '',
            businessAddress: settings.businessAddress || '',
            latitude: settings.latitude,
            longitude: settings.longitude,
            country: settings.country || '',
            countryIso: settings.countryIso || '',
            language: settings.language || 'en',
            availableLanguages: settings.availableLanguages || ['en'],
            baseUrl: settings.baseUrl || '',
            serviceArea: settings.serviceArea || '',
            serviceRadius: settings.serviceRadius,
            siteLogo: settings.siteLogo || '',
            socialNetworks: settings.socialNetworks || [],
            workingHours: settings.workingHours || [],
            allowRegistration: settings.allowRegistration !== false,
            enableFrontend: settings.enableFrontend !== false,
            // Only include enabled status for integrations, not sensitive keys
            integrations: {
                smsEnabled: settings.smsEnabled === true,
                googleMapsEnabled: settings.googleMapsEnabled === true,
                turnstileEnabled: settings.turnstileEnabled === true,
                web3Active: settings.web3Active === true
            },
            // Public OAuth provider info (enabled status only)
            oauthProviders: settings.providers ? Object.keys(settings.providers).filter(provider => 
                settings.providers[provider]?.enabled === true
            ) : []
        };

        return {
            success: true,
            data: publicSettings
        };
    } catch (error) {
        console.error('Error fetching public site settings:', error);
        return {
            success: false,
            error: 'Failed to fetch public site settings',
            message: error.message,
            data: null
        };
    }
}

/**
 * Update or create site settings utility function
 * @param {Object} settingsData - Site settings data to save
 * @returns {Promise<Object>} Save result
 */
export async function updateSiteSettings(settingsData) {
    try {
        const timeNow = new Date().toISOString();
        
        // Check for existing site settings record
        const existing = await getAllSiteSettings();
        let result;

        const payload = {
            ...settingsData,
            type: 'site',
            updatedAt: timeNow
        };

        if (existing.success && existing.data && existing.data.id) {
            // Update existing record
            result = await DBService.update(existing.data.id, payload, 'site_settings');
        } else {
            // Create new record
            payload.createdAt = timeNow;
            payload.id = payload.id || Date.now().toString();
            result = await DBService.create(payload, 'site_settings');
        }

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Error updating site settings:', error);
        return {
            success: false,
            error: 'Failed to update site settings',
            message: error.message
        };
    }
}

/**
 * Upload file utility function (for site logo and other file uploads)
 * @param {FormData} formData - FormData containing files to upload
 * @returns {Promise<Object>} Upload result with file URLs
 */
export async function uploadFiles(formData) {
    try {
        // In a real implementation, you would:
        // 1. Validate file types and sizes
        // 2. Generate unique filenames
        // 3. Upload to your preferred storage (Vercel Blob, AWS S3, etc.)
        // 4. Store file metadata in database
        
        const files = formData.getAll('files');
        const uploadedFiles = [];
        
        for (const file of files) {
            if (file && file.size > 0) {
                // For now, return a placeholder response
                // In production, implement actual file upload logic
                const fileData = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    url: `/uploads/${Date.now()}_${file.name}`, // Placeholder URL
                    uploadedAt: new Date().toISOString()
                };
                
                // Store file metadata in database
                await DBService.create(fileData, 'uploaded_files');
                uploadedFiles.push(fileData);
            }
        }

        return {
            success: true,
            data: {
                files: uploadedFiles,
                count: uploadedFiles.length
            },
            message: `Successfully uploaded ${uploadedFiles.length} file(s)`
        };
    } catch (error) {
        console.error('Error uploading files:', error);
        return {
            success: false,
            error: 'Failed to upload files',
            message: error.message,
            data: { files: [], count: 0 }
        };
    }
}

// SITE SETTINGS MANAGEMENT SERVER ACTIONS

/**
 * Get all site settings server action
 * @returns {Promise<Object>} Site settings data
 */
export async function getAllSiteSettingsAction() {
    try {
        return await getAllSiteSettings();
    } catch (error) {
        console.error('Error in get all site settings action:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch site settings'
        };
    }
}

/**
 * Get public site settings server action
 * @returns {Promise<Object>} Filtered site settings data
 */
export async function getPublicSiteSettingsAction() {
    try {
        return await getPublicSiteSettings();
    } catch (error) {
        console.error('Error in get public site settings action:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch public site settings'
        };
    }
}

/**
 * Update site settings server action
 * @param {Object} settingsData - Site settings data to save
 * @returns {Promise<Object>} Save result
 */
export async function updateSiteSettingsAction(settingsData) {
    try {
        return await updateSiteSettings(settingsData);
    } catch (error) {
        console.error('Error in update site settings action:', error);
        return {
            success: false,
            error: error.message || 'Failed to update site settings'
        };
    }
}

/**
 * Upload files server action
 * @param {FormData} formData - FormData containing files to upload
 * @returns {Promise<Object>} Upload result
 */
export async function uploadFilesAction(formData) {
    try {
        return await uploadFiles(formData);
    } catch (error) {
        console.error('Error in upload files action:', error);
        return {
            success: false,
            error: error.message || 'Failed to upload files'
        };
    }
}
