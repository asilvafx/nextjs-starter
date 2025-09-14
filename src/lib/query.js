// (old) lib/query.js

import { authenticatedFetch } from '@/hooks/useAuth.js';
import {getCsrfToken} from '@/lib/auth.js';

class QueryAPI {
    constructor() {
        this.baseURL = `/api/query`;
        this.uploadURL = `/api/upload`;
        this.publicURL = `/api/query/public`; // Fixed: was missing /api/
    }

    // Helper method for making authenticated API calls
    async makeRequest(url, options = {}) {
        try {
            const response = await authenticatedFetch(url, options);

            if (!response) {
                throw new Error('No response received');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }
    // Helper method for making public API calls with CSRF protection
    async makePublicRequest(url, options = {}) {
        try {
            // Get CSRF token for public requests
            const csrfToken = await getCsrfToken();

            if (!csrfToken) {
                throw new Error('Unable to obtain CSRF token');
            }

            const defaultOptions = {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken,
                    ...options.headers
                },
                ...options
            };

            const response = await fetch(url, defaultOptions);

            if (!response) {
                throw new Error('No response received');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Public API request error:', error);
            throw error;
        }
    }

    // GET all items from a collection (authenticated)
    async getAll(collection, params={}) {
        const queryString = new URLSearchParams(params).toString();
        const url = `${this.baseURL}/${collection}${queryString ? `?${queryString}` : ''}`;
        return await this.makeRequest(url);
    }

    // GET all items from a collection (public access)
    async getAllPublic(collection, params={}) {
        const queryString = new URLSearchParams(params).toString();
        const url = `${this.publicURL}/${collection}${queryString ? `?${queryString}` : ''}`;
        return await this.makePublicRequest(url);
    }

    // GET single item by ID (authenticated)
    async get(collection, id) {
        const url = `${this.baseURL}/${collection}?id=${encodeURIComponent(id)}`;
        const result = await this.makeRequest(url);
        return result.data;
    }

    // GET single item by ID (public access)
    async getPublic(collection, id) {
        const url = `${this.publicURL}/${collection}?id=${encodeURIComponent(id)}`;
        const result = await this.makePublicRequest(url);
        return result.data;
    }

    // POST create new item (authenticated)
    async create(data, collection) {
        const url = `${this.baseURL}/${collection}`;
        const options = {
            method: 'POST',
            body: JSON.stringify(data)
        };
        const result = await this.makeRequest(url, options);
        return result.data;
    }

    // POST create new item (public access)
    async createPublic(data, collection) {
        const url = `${this.publicURL}/${collection}`;
        const options = {
            method: 'POST',
            body: JSON.stringify(data)
        };
        const result = await this.makePublicRequest(url, options);
        return result.data;
    }

    // PUT update item (authenticated)
    async update(id, data, collection) {
        const url = `${this.baseURL}/${collection}`;
        const updateData = { ...data, id };
        const options = {
            method: 'PUT',
            body: JSON.stringify(updateData)
        };
        const result = await this.makeRequest(url, options);
        return result.data;
    }

    // PUT update item (public access)
    async updatePublic(id, data, collection) {
        const url = `${this.publicURL}/${collection}`;
        const updateData = { ...data, id };
        const options = {
            method: 'PUT',
            body: JSON.stringify(updateData)
        };
        const result = await this.makePublicRequest(url, options);
        return result.data;
    }

    // DELETE item (authenticated)
    async delete(id, collection) {
        const url = `${this.baseURL}/${collection}?id=${encodeURIComponent(id)}`;
        const options = {
            method: 'DELETE'
        };
        const result = await this.makeRequest(url, options);
        return result.data;
    }

    // DELETE item (public access)
    async deletePublic(id, collection) {
        const url = `${this.publicURL}/${collection}?id=${encodeURIComponent(id)}`;
        const options = {
            method: 'DELETE'
        };
        const result = await this.makePublicRequest(url, options);
        return result.data;
    }

    // UPLOAD file (authenticated)
    async upload(files, path = 'uploads') {
        const formData = new FormData();

        // Handle single file or multiple files
        if (Array.isArray(files)) {
            files.forEach(file => formData.append('files', file));
        } else {
            formData.append('files', files);
        }

        const options = {
            method: 'POST',
            body: formData
        };

        const response = await authenticatedFetch(this.uploadURL, options);

        if (!response) {
            throw new Error('No response received');
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result.data;
    }

    // Batch operations remain the same...
    async batchCreate(items, collection) {
        const results = [];
        for (const item of items) {
            try {
                const result = await this.create(item, collection);
                results.push({ success: true, data: result });
            } catch (error) {
                results.push({ success: false, error: error.message, data: item });
            }
        }
        return results;
    }

    async batchCreatePublic(items, collection) {
        const results = [];
        for (const item of items) {
            try {
                const result = await this.createPublic(item, collection);
                results.push({ success: true, data: result });
            } catch (error) {
                results.push({ success: false, error: error.message, data: item });
            }
        }
        return results;
    }

    // ... other batch methods remain the same
}

// Create and export a singleton instance
const queryAPI = new QueryAPI();

// Export individual functions (authenticated)
export const get = (collection, id) => queryAPI.get(collection, id);
export const getAll = (collection, params = {}) => queryAPI.getAll(collection, params);
export const create = (data, collection) => queryAPI.create(data, collection);
export const update = (id, data, collection) => queryAPI.update(id, data, collection);
export const remove = (id, collection) => queryAPI.delete(id, collection);
export const upload = (files, path) => queryAPI.upload(files, path);

// Export individual functions (public access)
export const getPublic = (collection, id) => queryAPI.getPublic(collection, id);
export const getAllPublic = (collection, params = {}) => queryAPI.getAllPublic(collection, params);
export const createPublic = (data, collection) => queryAPI.createPublic(data, collection);
export const updatePublic = (id, data, collection) => queryAPI.updatePublic(id, data, collection);
export const removePublic = (id, collection) => queryAPI.deletePublic(id, collection);

// Export batch operations
export const batchCreate = (items, collection) => queryAPI.batchCreate(items, collection);
export const batchCreatePublic = (items, collection) => queryAPI.batchCreatePublic(items, collection);

// Export the main class instance
export default queryAPI;
