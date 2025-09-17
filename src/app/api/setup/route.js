// app/api/setup/route.js
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Define required environment variables
        const requiredEnvVars = {
            'POSTGRES_URL': process.env.POSTGRES_URL,
            'REDIS_URL': process.env.REDIS_URL,
            'BLOB_READ_WRITE_TOKEN': process.env.BLOB_READ_WRITE_TOKEN,
            'NEXT_SECRET': process.env.NEXT_SECRET
        };

        const missingVars = [];
        const emptyVars = [];
        const presentVars = [];

        // Check each environment variable
        Object.entries(requiredEnvVars).forEach(([key, value]) => {
            if (value === undefined) {
                missingVars.push(key);
            } else if (value === '') {
                emptyVars.push(key);
            } else {
                presentVars.push(key);
            }
        });

        // Calculate setup status
        const totalVars = Object.keys(requiredEnvVars).length;
        const configuredVars = presentVars.length;
        const isSetupComplete = missingVars.length === 0 && emptyVars.length === 0;
        const setupPercentage = Math.round((configuredVars / totalVars) * 100);

        // Prepare response data
        const response = {
            setupComplete: isSetupComplete,
            setupPercentage,
            totalVariables: totalVars,
            configuredVariables: configuredVars,
            status: {
                present: presentVars,
                missing: missingVars,
                empty: emptyVars
            },
            message: isSetupComplete
                ? 'All environment variables are configured correctly.'
                : `Setup incomplete: ${missingVars.length + emptyVars.length} variable(s) need attention.`,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'unknown'
        };

        // Return appropriate HTTP status
        const httpStatus = isSetupComplete ? 200 : 206; // 206 = Partial Content

        return NextResponse.json(response, { status: httpStatus });

    } catch (error) {
        console.error('Setup check error:', error);

        return NextResponse.json(
            {
                setupComplete: false,
                error: 'Failed to check environment setup',
                message: 'An error occurred while checking environment variables.',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}

// Optional: Add POST method for more detailed checks or setup actions
export async function POST(request) {
    try {
        const body = await request.json();
        const { checkConnections = false } = body;

        // Basic env check (same as GET)
        const requiredEnvVars = {
            'POSTGRES_URL': process.env.POSTGRES_URL,
            'REDIS_URL': process.env.REDIS_URL,
            'BLOB_READ_WRITE_TOKEN': process.env.BLOB_READ_WRITE_TOKEN,
            'NEXT_SECRET': process.env.NEXT_SECRET
        };

        const missingVars = [];
        const emptyVars = [];
        const presentVars = [];

        Object.entries(requiredEnvVars).forEach(([key, value]) => {
            if (value === undefined) {
                missingVars.push(key);
            } else if (value === '') {
                emptyVars.push(key);
            } else {
                presentVars.push(key);
            }
        });

        let connectionTests = null;

        // Optional connection testing (if requested)
        if (checkConnections && presentVars.length > 0) {
            connectionTests = {
                database: null,
                redis: null,
                blob: null
            };

            // Test database connection (basic URL validation)
            if (process.env.POSTGRES_URL) {
                try {
                    new URL(process.env.POSTGRES_URL);
                    connectionTests.database = 'URL format valid';
                } catch {
                    connectionTests.database = 'Invalid URL format';
                }
            }

            // Test Redis URL
            if (process.env.REDIS_URL) {
                try {
                    new URL(process.env.REDIS_URL);
                    connectionTests.redis = 'URL format valid';
                } catch {
                    connectionTests.redis = 'Invalid URL format';
                }
            }

            // Test Blob token (basic presence check)
            if (process.env.BLOB_READ_WRITE_TOKEN) {
                connectionTests.blob = process.env.BLOB_READ_WRITE_TOKEN.startsWith('vercel_blob_rw_')
                    ? 'Token format appears valid'
                    : 'Token format may be invalid';
            }
        }

        const isSetupComplete = missingVars.length === 0 && emptyVars.length === 0;

        return NextResponse.json({
            setupComplete: isSetupComplete,
            setupPercentage: Math.round((presentVars.length / Object.keys(requiredEnvVars).length) * 100),
            status: {
                present: presentVars,
                missing: missingVars,
                empty: emptyVars
            },
            connectionTests,
            message: isSetupComplete
                ? 'Environment setup is complete.'
                : 'Environment setup is incomplete.',
            timestamp: new Date().toISOString()
        }, {
            status: isSetupComplete ? 200 : 206
        });

    } catch (error) {
        console.error('Setup POST error:', error);

        return NextResponse.json(
            {
                setupComplete: false,
                error: 'Failed to process setup check',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}
