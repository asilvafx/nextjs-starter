// data/postgres.db.js
import { createPool, createClient } from "@vercel/postgres";
import { put } from '@vercel/blob';
import { ca } from "zod/v4/locales";

// Add connection logging
if (process.env.POSTGRES_URL) {
    console.error("POSTGRES_URL environment variable found!");
}

let client;
try {
    client = createPool({
        connectionString: process.env.POSTGRES_URL,
    });
} catch (e) {
    try {
    client = createClient({
            connectionString: process.env.POSTGRES_URL,
    });
    } catch (e) {
    client = null;
    }
}

class PostgresDBService {
    constructor() {
        this.initialized = false;
    }

    // Ensure table exists with better logging
    async ensureTable() {
        if (this.initialized) {
            return;
        }

        try {
            const start = Date.now();

            await client.sql`
                CREATE TABLE IF NOT EXISTS kv_store (
                    key TEXT PRIMARY KEY,
                    data JSONB NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `;

            // Verify table exists
            const tableCheck = await client.sql`
                SELECT table_name
                FROM information_schema.tables
                WHERE table_name = 'kv_store'
            `;

            this.initialized = true;

        } catch (err) {
            console.error("❌ Failed to create kv_store table:", err.message);
            throw err;
        }
    }

    // Build key for storage
    buildKey(table, id) {
        return `${table}:${id}`;
    }

    // Generate unique ID
    generateId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Extract ID from key
    extractIdFromKey(key, table) {
        return key.replace(`${table}:`, '');
    }

    // Get multiple items by a specific key-value pair
    async getItemsByKeyValue(key, value, table) {
        try {
            await this.ensureTable();
            const pattern = `${table}:%`;

            const result = await client.sql`
                SELECT key, data
                FROM kv_store
                WHERE key LIKE ${pattern}
                AND data->>${key} = ${String(value)}
            `;

            if (result.rows.length === 0) {
                return null;
            }

            const results = {};
            result.rows.forEach(row => {
                const id = this.extractIdFromKey(row.key, table);
                results[id] = row.data;
            });

            return results;
        } catch (err) {
            console.error(`❌ getItemsByKeyValue error:`, err.message);
            throw new Error(`Query failed for ${table}: ${err.message}`);
        }
    }

    // Get a single item by a specific key-value pair
    async readBy(key, value, table) {
        try {
            await this.ensureTable();
            const pattern = `${table}:%`;

            const result = await client.sql`
                SELECT data
                FROM kv_store
                WHERE key LIKE ${pattern}
                AND data->>${key} = ${String(value)}
                LIMIT 1
            `;

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0].data;
        } catch (err) {
            console.error(`❌ readBy error:`, err.message);
            throw new Error(`Query failed for ${table}: ${err.message}`);
        }
    }

    // Get the key of an item by a specific key-value pair
    async getItemKey(key, value, table) {
        try {
            await this.ensureTable();
            const pattern = `${table}:%`;

            const result = await client.sql`
                SELECT key
                FROM kv_store
                WHERE key LIKE ${pattern}
                AND data->>${key} = ${String(value)}
                LIMIT 1
            `;

            if (result.rows.length === 0) {
                return null;
            }

            return this.extractIdFromKey(result.rows[0].key, table);
        } catch (err) {
            console.error(`❌ getItemKey error:`, err.message);
            throw new Error(`Query failed for ${table}: ${err.message}`);
        }
    }

    // Get an item by ID
    async read(id, table) {
        try {
            await this.ensureTable();
            const key = this.buildKey(table, id);

            const result = await client.sql`
                SELECT data FROM kv_store WHERE key = ${key}
            `;

            if (result.rows.length === 0) return null;
            return result.rows[0].data;
        } catch (err) {
            console.error(`❌ read error:`, err.message);
            throw new Error(`Find failed for ${key}: ${err.message}`);
        }
    }

    // Read all items from a table
    async readAll(table) {
        try {
            await this.ensureTable();
            const pattern = `${table}:%`;

            const result = await client.sql`
                SELECT key, data
                FROM kv_store
                WHERE key LIKE ${pattern}
                ORDER BY created_at DESC
            `;

            if (result.rows.length === 0) {
                return {};
            }

            const results = {};
            result.rows.forEach(row => {
                const id = this.extractIdFromKey(row.key, table);
                results[id] = row.data;
            });

            return results;
        } catch (err) {
            console.error(`❌ readAll error:`, err.message);
            throw new Error(`Fetch all failed for table ${table}: ${err.message}`);
        }
    }

    // Create a new item
    async create(data, table) {
        try {
            await this.ensureTable();
            const id = this.generateId();
            const key = this.buildKey(table, id);

            // Add metadata
            const dataWithMetadata = {
                ...data,
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const result = await client.sql`
                INSERT INTO kv_store (key, data)
                VALUES (${key}, ${JSON.stringify(dataWithMetadata)})
                RETURNING *
            `;

            return { key: id, id: id };
        } catch (err) {
            console.error(`❌ create error:`, err.message);
            throw new Error(`Insert failed for ${table}: ${err.message}`);
        }
    }

    // Update an existing item
    async update(id, updateData, table) {
        try {
            await this.ensureTable();
            const key = this.buildKey(table, id);

            // Get existing data first
            const existing = await this.read(id, table);
            if (!existing) {
                throw new Error(`Item with id ${id} not found in table ${table}`);
            }

            // Merge data
            const updatedData = {
                ...existing,
                ...updateData,
                updatedAt: new Date().toISOString()
            };

            const result = await client.sql`
                UPDATE kv_store
                SET data = ${JSON.stringify(updatedData)}
                WHERE key = ${key}
                RETURNING *
            `;

            if (result.rows.length === 0) {
                throw new Error(`Record not found for key: ${key}`);
            }
            return result.rows[0].data;
        } catch (err) {
            console.error(`❌ update error:`, err.message);
            throw new Error(`Update failed for ${key}: ${err.message}`);
        }
    }

    // Delete an item by ID
    async delete(id, table) {
        try {
            await this.ensureTable();
            const key = this.buildKey(table, id);

            const result = await client.sql`
                DELETE FROM kv_store WHERE key = ${key} RETURNING *
            `;

            return result.rows.length > 0;
        } catch (err) {
            console.error(`❌ delete error:`, err.message);
            throw new Error(`Delete failed for ${key}: ${err.message}`);
        }
    }

    // Delete all items from a table
    async deleteAll(table) {
        try {
            await this.ensureTable();
            const pattern = `${table}:%`;

            await client.sql`
                DELETE FROM kv_store WHERE key LIKE ${pattern}
            `;

            return true;
        } catch (err) {
            console.error(`❌ deleteAll error:`, err.message);
            throw new Error(`Delete all failed for table ${table}: ${err.message}`);
        }
    }

    // Upload method - Uses Vercel Blob
    async upload(file, path) {
        try {
            // Check if Vercel Blob token is available
            const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

            if (!blobToken || blobToken.trim() === '') {
                throw new Error('File upload requires BLOB_READ_WRITE_TOKEN environment variable to be set.');
            }

            // Ensure path doesn't start with slash for Vercel Blob
            const cleanPath = path.startsWith('/') ? path.slice(1) : path;

            // Extract the buffer from the file object
            let fileData;
            if (file.buffer) {
                fileData = file.buffer;
            } else if (Buffer.isBuffer(file)) {
                fileData = file;
            } else if (file.stream) {
                fileData = file.stream;
            } else {
                fileData = file;
            }

            // Upload to Vercel Blob with the raw buffer/data
            const blob = await put(cleanPath, fileData, {
                access: 'public',
                token: blobToken
            });

            // Store file metadata in database for tracking
            const fileMetadata = {
                originalPath: path,
                blobUrl: blob.url,
                fileName: cleanPath,
                size: blob.size || file.size,
                uploadedAt: new Date().toISOString(),
                contentType: file.mimetype || file.type || 'application/octet-stream',
                originalName: file.originalname || file.filename || cleanPath
            };

            // Store metadata in database with a special table for files
            const metadataKey = cleanPath.replace(/[^a-zA-Z0-9]/g, '_');
            await this.create(fileMetadata, 'file_metadata');

            return {
                url: blob.url,
                publicUrl: blob.url,
                path: cleanPath,
                size: blob.size,
                metadata: fileMetadata
            };

        } catch (error) {
            console.error('Error in upload:', error);
            throw error;
        }
    }
}

export default new PostgresDBService();
