import { NextResponse } from "next/server";
import { orm } from "@/lib/orm";
import { createClient, createPool } from "@vercel/postgres";

export async function GET() {
    console.log("🧪 Connection test endpoint called");

    try {
        // Test environment variables first
        const envCheck = {
            postgresUrlExists: !!process.env.POSTGRES_URL,
            postgresUrlLength: process.env.POSTGRES_URL?.length || 0,
            postgresUrlStartsWith: process.env.POSTGRES_URL?.substring(0, 20) + "...",
            nodeEnv: process.env.NODE_ENV
        };

        console.log("🔍 Environment check:", envCheck);

        if (!process.env.POSTGRES_URL) {
            return NextResponse.json({
                success: false,
                error: "POSTGRES_URL environment variable is not set",
                environment: envCheck
            }, { status: 500 });
        }

        // Test basic connection with direct client
        console.log("🧪 Testing database connection...");
        let client;

        try {
            client = createPool({
                connectionString: process.env.POSTGRES_URL,
            });
            console.log(`✅ Connecting to Postgres Pool..`);
        } catch (e) {
            client = createClient({
                connectionString: process.env.POSTGRES_URL,
            });
            console.log(`✅ Connecting to Postgres Client..`);
        }


        const start = Date.now();
        const result = await client.sql`SELECT NOW() as current_time, version() as postgres_version`;
        const connectionDuration = Date.now() - start;

        console.log(`✅ Database connection successful in ${connectionDuration}ms`);
        console.log("📅 Database time:", result.rows[0]?.current_time);

        // Test table creation using ORM
        console.log("🏗️ Testing table creation...");
        const tableStart = Date.now();
        await orm.ensureTable();
        const tableDuration = Date.now() - tableStart;

        console.log(`✅ Table creation completed in ${tableDuration}ms`);

        // Test a simple query
        console.log("🔍 Testing table query...");
        const queryStart = Date.now();
        const tableCheck = await client.sql`
            SELECT table_name, column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'kv_store'
            ORDER BY ordinal_position
        `;
        const queryDuration = Date.now() - queryStart;

        console.log(`✅ Table query completed in ${queryDuration}ms`);
        console.log("📊 Table structure:", tableCheck.rows);

        console.log("✅ All tests passed");

        return NextResponse.json({
            success: true,
            message: "Database connection and setup successful",
            tests: {
                connection: {
                    status: "success",
                    duration: connectionDuration,
                    dbTime: result.rows[0]?.current_time,
                    version: result.rows[0]?.postgres_version
                },
                tableCreation: {
                    status: "success",
                    duration: tableDuration
                },
                tableStructure: {
                    status: "success",
                    duration: queryDuration,
                    columns: tableCheck.rows
                },
                environment: envCheck
            },
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error("❌ Connection test failed:", err);

        return NextResponse.json({
            success: false,
            error: err.message,
            details: {
                name: err.name,
                stack: err.stack?.split('\n').slice(0, 5),
                timestamp: new Date().toISOString()
            }
        }, { status: 500 });
    }
}
