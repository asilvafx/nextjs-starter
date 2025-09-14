import { createClient, createPool } from "@vercel/postgres";

// Add connection logging
if (!process.env.POSTGRES_URL) {
    console.error("❌ POSTGRES_URL environment variable is not set!");
}

let client;
try {
    client = createPool({
        connectionString: process.env.POSTGRES_URL,
    });
} catch (e) {
    client = createClient({
        connectionString: process.env.POSTGRES_URL,
    });
}

export const orm = {
    initialized: false,

    // Add this method to your existing ORM
    async testConnection() {
        console.log("🧪 Testing database connection...");
        try {
            const start = Date.now();
            const result = await client.sql`SELECT NOW() as current_time`;
            const duration = Date.now() - start;
            console.log(`✅ Database connection successful in ${duration}ms`);
            console.log("📅 Current database time:", result.rows[0]?.current_time);
            return {
                success: true,
                duration: duration,
                dbTime: result.rows[0]?.current_time
            };
        } catch (err) {
            console.error("❌ Database connection failed:", err.message);
            console.error("❌ Full error:", err);
            throw err;
        }
    },

    // Ensure table exists with better logging
    async ensureTable() {

        if (this.initialized) {
            return;
        }

        try {
            console.log("🏗️ Creating kv_store table if not exists...");
            const start = Date.now();

            await client.sql`
                CREATE TABLE IF NOT EXISTS kv_store (
                    key TEXT PRIMARY KEY,
                    data JSONB NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `;

            const duration = Date.now() - start;
            console.log(`✅ kv_store table ensured in ${duration}ms`);

            // Verify table exists
            const tableCheck = await client.sql`
                SELECT table_name
                FROM information_schema.tables
                WHERE table_name = 'kv_store'
            `;

            console.log("📊 Table verification result:", tableCheck.rows.length > 0 ? "EXISTS" : "NOT FOUND");

            this.initialized = true;

        } catch (err) {
            console.error("❌ Failed to create kv_store table:", err.message);
            throw err;
        }
    },

    buildKey(table, id) {
        return `${table}:${id}`;
    },

    async insert(table, id, value) {
        const start = Date.now();

        await this.ensureTable();
        const key = this.buildKey(table, id);

        try {
            const result = await client.sql`
                INSERT INTO kv_store (key, data)
                VALUES (${key}, ${JSON.stringify(value)})
                ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data
                RETURNING *
            `;

            const duration = Date.now() - start;

            return result.rows[0];
        } catch (err) {
            const duration = Date.now() - start;
            console.error(`❌ ORM insert error after ${duration}ms:`, err.message);
            throw new Error(`Insert failed for ${key}: ${err.message}`);
        }
    },

    async find(table, id) {
        const start = Date.now();

        await this.ensureTable();
        const key = this.buildKey(table, id);

        try {
            const result = await client.sql`
                SELECT data FROM kv_store WHERE key = ${key}
            `;

            const duration = Date.now() - start;
            if (result.rows.length === 0) return null;
            return result.rows[0].data;
        } catch (err) {
            const duration = Date.now() - start;
            console.error(`❌ ORM find error after ${duration}ms:`, err.message);
            throw new Error(`Find failed for ${key}: ${err.message}`);
        }
    },

    async update(table, id, value) {
        const start = Date.now();

        await this.ensureTable();
        const key = this.buildKey(table, id);

        try {
            const result = await client.sql`
                UPDATE kv_store
                SET data = data || ${JSON.stringify(value)}::jsonb
                WHERE key = ${key}
                RETURNING *
            `;

            if (result.rows.length === 0) {
                throw new Error(`Record not found for key: ${key}`);
            }
            return result.rows[0].data;
        } catch (err) {
            const duration = Date.now() - start;
            console.error(`❌ ORM update error after ${duration}ms:`, err.message);
            throw new Error(`Update failed for ${key}: ${err.message}`);
        }
    },

    async delete(table, id) {
        const start = Date.now();

        await this.ensureTable();
        const key = this.buildKey(table, id);

        try {
            const result = await client.sql`
                DELETE FROM kv_store WHERE key = ${key} RETURNING *
            `;

            const duration = Date.now() - start;

            return result.rows[0] || null;
        } catch (err) {
            const duration = Date.now() - start;
            console.error(`❌ ORM delete error after ${duration}ms:`, err.message);
            throw new Error(`Delete failed for ${key}: ${err.message}`);
        }
    },

    async fetchAll(table) {
        const start = Date.now();

        await this.ensureTable();

        try {
            const pattern = `${table}:%`;

            const result = await client.sql`
                SELECT key, data
                FROM kv_store
                WHERE key LIKE ${pattern}
                ORDER BY created_at DESC
            `;

            const mappedData = result.rows.map((r) => ({
                id: r.key.split(":")[1],
                data: r.data
            }));

            return mappedData;

        } catch (err) {
            const duration = Date.now() - start;
            console.error(`❌ Fetch all failed for table ${table} after ${duration}ms:`, err.message);
            throw new Error(`Fetch all failed for table ${table}: ${err.message}`);
        }
    },

    async findByQuery(table, query) {
        const start = Date.now();

        await this.ensureTable();

        try {
            const pattern = `${table}:%`;
            let sqlQuery = `
                SELECT key, data
                FROM kv_store
                WHERE key LIKE $1
            `;
            const params = [pattern];

            // Build conditions for JSONB queries
            Object.entries(query).forEach(([key, value], index) => {
                sqlQuery += ` AND data->>'${key}' = $${index + 2}`;
                params.push(String(value));
            });

            const result = await client.query(sqlQuery, params);

            return result.rows.map((r) => ({
                id: r.key.split(":")[1],
                data: r.data
            }));
        } catch (err) {
            const duration = Date.now() - start;
            console.error(`❌ ORM findByQuery error after ${duration}ms:`, err.message);
            throw new Error(`Query failed for table ${table}: ${err.message}`);
        }
    },

    // Helper method to create test data
    async createTestUser(id, userData = {}) {
        console.log(`👤 Creating test user with id: ${id}`);
        const defaultUser = {
            name: `Test User ${id}`,
            email: `test${id}@example.com`,
            role: 'user',
            createdAt: new Date().toISOString(),
            ...userData
        };
        return await this.insert('users', id, defaultUser);
    }
};
