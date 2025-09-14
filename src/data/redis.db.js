// data/redis.db.js
import { createClient } from 'redis';
import { put } from '@vercel/blob';

class RedisDBService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.initializeClient();
    }

    async initializeClient() {
        const redisUrl = process.env.REDIS_URL;
        if(!redisUrl || redisUrl.trim() === '') return null;
        try {
            this.client = createClient({
                url:redisUrl,
                socket: {
                    reconnectStrategy: (retries) => {
                        console.log(`Redis reconnection attempt ${retries}`);
                        return Math.min(retries * 100, 3000);
                    }
                }
            });

            this.client.on('error', (err) => {
                console.error('Redis Client Error:', err);
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                console.log('Redis Client Connected');
                this.isConnected = true;
            });

            this.client.on('disconnect', () => {
                console.log('Redis Client Disconnected');
                this.isConnected = false;
            });

            await this.client.connect();
        } catch (error) {
            console.error('Failed to initialize Redis client:', error);
            throw error;
        }
    }

    async ensureConnection() {
        if (!this.client || !this.isConnected) {
            await this.initializeClient();
        }
    }

    // Helper method to generate Redis keys
    generateKey(table, id = null) {
        if (id) {
            return `${table}:${id}`;
        }
        return `${table}:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Helper method to extract ID from Redis key
    extractIdFromKey(key, table) {
        return key.replace(`${table}:`, '');
    }

    // Get multiple items by a specific key-value pair
    async getItemsByKeyValue(key, value, table) {
        try {
            await this.ensureConnection();

            const pattern = `${table}:*`;
            const keys = await this.client.keys(pattern);

            if (keys.length === 0) {
                return null;
            }

            const results = {};

            for (const redisKey of keys) {
                const data = await this.client.get(redisKey);
                if (data) {
                    const parsedData = JSON.parse(data);
                    if (parsedData[key] === value) {
                        const id = this.extractIdFromKey(redisKey, table);
                        results[id] = parsedData;
                    }
                }
            }

            return Object.keys(results).length > 0 ? results : null;
        } catch (error) {
            console.error('Error in getItemsByKeyValue:', error);
            throw error;
        }
    }

    // Get a single item by a specific key-value pair
    async readBy(key, value, table) {
        try {
            await this.ensureConnection();

            const pattern = `${table}:*`;
            const keys = await this.client.keys(pattern);

            for (const redisKey of keys) {
                const data = await this.client.get(redisKey);
                if (data) {
                    const parsedData = JSON.parse(data);
                    if (parsedData[key] === value) {
                        return parsedData;
                    }
                }
            }

            return null;
        } catch (error) {
            console.error('Error in readBy:', error);
            throw error;
        }
    }

    // Get the key of an item by a specific key-value pair
    async getItemKey(key, value, table) {
        try {
            await this.ensureConnection();

            const pattern = `${table}:*`;
            const keys = await this.client.keys(pattern);

            for (const redisKey of keys) {
                const data = await this.client.get(redisKey);
                if (data) {
                    const parsedData = JSON.parse(data);
                    if (parsedData[key] === value) {
                        return this.extractIdFromKey(redisKey, table);
                    }
                }
            }

            return null;
        } catch (error) {
            console.error('Error in getItemKey:', error);
            throw error;
        }
    }

    // Get an item by ID
    async read(id, table) {
        try {
            await this.ensureConnection();

            const redisKey = `${table}:${id}`;
            const data = await this.client.get(redisKey);

            if (data) {
                return JSON.parse(data);
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error in read:', error);
            throw error;
        }
    }

    // Read all items from a table
    async readAll(table) {
        try {
            await this.ensureConnection();

            const pattern = `${table}:*`;
            const keys = await this.client.keys(pattern);

            if (keys.length === 0) {
                return {};
            }

            const results = {};

            for (const redisKey of keys) {
                const data = await this.client.get(redisKey);
                if (data) {
                    const id = this.extractIdFromKey(redisKey, table);
                    results[id] = JSON.parse(data);
                }
            }

            return results;
        } catch (error) {
            console.error('Error in readAll:', error);
            return {};
        }
    }

    // Create a new item
    async create(data, table) {
        try {
            await this.ensureConnection();

            const id = this.generateKey(table).split(':')[1]; // Get just the ID part
            const redisKey = `${table}:${id}`;

            // Add timestamp to data if not present
            const dataWithMetadata = {
                ...data,
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await this.client.set(redisKey, JSON.stringify(dataWithMetadata));

            return { key: id, id: id };
        } catch (error) {
            console.error('Error in create:', error);
            throw error;
        }
    }

    // Update an existing item
    async update(id, updateData, table) {
        try {
            await this.ensureConnection();

            const redisKey = `${table}:${id}`;
            const existingData = await this.client.get(redisKey);

            if (!existingData) {
                throw new Error(`Item with id ${id} not found in table ${table}`);
            }

            const parsedExistingData = JSON.parse(existingData);
            const updatedData = {
                ...parsedExistingData,
                ...updateData,
                updatedAt: new Date().toISOString()
            };

            await this.client.set(redisKey, JSON.stringify(updatedData));

            return updatedData;
        } catch (error) {
            console.error('Error in update:', error);
            throw error;
        }
    }

    // Delete an item by key
    async delete(id, table) {
        try {
            await this.ensureConnection();

            const redisKey = `${table}:${id}`;
            const result = await this.client.del(redisKey);

            return result > 0; // Returns true if item was deleted
        } catch (error) {
            console.error('Error in delete:', error);
            throw error;
        }
    }

    // Delete all items from a table
    async deleteAll(table) {
        try {
            await this.ensureConnection();

            const pattern = `${table}:*`;
            const keys = await this.client.keys(pattern);

            if (keys.length === 0) {
                return true;
            }

            await this.client.del(keys);
            return true;
        } catch (error) {
            console.error('Error in deleteAll:', error);
            throw error;
        }
    }

    // Upload method - Uses Vercel Blob if token is available
    async upload(file, path) {
        try {
            // Check if Vercel Blob token is available
            const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

            if (!blobToken || blobToken.trim() === '') {
                throw new Error('File upload is not supported by Redis. Consider using a file storage service like AWS S3, Cloudinary, or Vercel Blob storage.');
            }

            await this.ensureConnection();

            // Ensure path doesn't start with slash for Vercel Blob
            const cleanPath = path.startsWith('/') ? path.slice(1) : path;

            // Extract the buffer from the file object
            let fileData;
            if (file.buffer) {
                // If file has a buffer property, use it
                fileData = file.buffer;
            } else if (Buffer.isBuffer(file)) {
                // If file is already a buffer
                fileData = file;
            } else if (file.stream) {
                // If file has a stream property
                fileData = file.stream;
            } else {
                // Fallback - try to use the file directly
                fileData = file;
            }

            // Upload to Vercel Blob with the raw buffer/data
            const blob = await put(cleanPath, fileData, {
                access: 'public',
                token: blobToken
            });

            // Store file metadata in Redis for tracking
            const fileMetadata = {
                originalPath: path,
                blobUrl: blob.url,
                fileName: cleanPath,
                size: blob.size || file.size,
                uploadedAt: new Date().toISOString(),
                contentType: file.mimetype || file.type || 'application/octet-stream',
                originalName: file.originalname || file.filename || cleanPath
            };

            // Store metadata in Redis with a special key pattern for files
            const metadataKey = `file_metadata:${cleanPath.replace(/[^a-zA-Z0-9]/g, '_')}`;
            await this.client.set(metadataKey, JSON.stringify(fileMetadata));

            return {
                url: blob.url,
                publicUrl: blob.url, // Add this for compatibility
                path: cleanPath,
                size: blob.size,
                metadata: fileMetadata
            };

        } catch (error) {
            console.error('Error in upload:', error);
            throw error;
        }
    }

    // Get file metadata from Redis
    async getFileMetadata(path) {
        try {
            await this.ensureConnection();

            const cleanPath = path.startsWith('/') ? path.slice(1) : path;
            const metadataKey = `file_metadata:${cleanPath.replace(/[^a-zA-Z0-9]/g, '_')}`;

            const metadata = await this.client.get(metadataKey);
            return metadata ? JSON.parse(metadata) : null;
        } catch (error) {
            console.error('Error in getFileMetadata:', error);
            throw error;
        }
    }

    // List all uploaded files metadata
    async listUploadedFiles() {
        try {
            await this.ensureConnection();

            const pattern = 'file_metadata:*';
            const keys = await this.client.keys(pattern);

            if (keys.length === 0) {
                return [];
            }

            const files = [];
            for (const key of keys) {
                const metadata = await this.client.get(key);
                if (metadata) {
                    files.push(JSON.parse(metadata));
                }
            }

            return files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        } catch (error) {
            console.error('Error in listUploadedFiles:', error);
            throw error;
        }
    }

    // Delete file metadata from Redis (Note: doesn't delete from Vercel Blob)
    async deleteFileMetadata(path) {
        try {
            await this.ensureConnection();

            const cleanPath = path.startsWith('/') ? path.slice(1) : path;
            const metadataKey = `file_metadata:${cleanPath.replace(/[^a-zA-Z0-9]/g, '_')}`;

            const result = await this.client.del(metadataKey);
            return result > 0;
        } catch (error) {
            console.error('Error in deleteFileMetadata:', error);
            throw error;
        }
    }

    // Redis-specific methods

    // Set expiration on a key (TTL in seconds)
    async setExpiration(id, table, ttlSeconds) {
        try {
            await this.ensureConnection();

            const redisKey = `${table}:${id}`;
            const result = await this.client.expire(redisKey, ttlSeconds);

            return result > 0;
        } catch (error) {
            console.error('Error in setExpiration:', error);
            throw error;
        }
    }

    // Get TTL of a key
    async getTTL(id, table) {
        try {
            await this.ensureConnection();

            const redisKey = `${table}:${id}`;
            return await this.client.ttl(redisKey);
        } catch (error) {
            console.error('Error in getTTL:', error);
            throw error;
        }
    }

    // Execute custom Redis commands
    async executeCommand(command, ...args) {
        try {
            await this.ensureConnection();

            return await this.client.sendCommand([command, ...args]);
        } catch (error) {
            console.error('Error in executeCommand:', error);
            throw error;
        }
    }

    // Get Redis info
    async getInfo() {
        try {
            await this.ensureConnection();

            return await this.client.info();
        } catch (error) {
            console.error('Error in getInfo:', error);
            throw error;
        }
    }

    // Close connection
    async disconnect() {
        try {
            if (this.client && this.isConnected) {
                await this.client.disconnect();
            }
        } catch (error) {
            console.error('Error disconnecting from Redis:', error);
        }
    }
}

export default new RedisDBService();
