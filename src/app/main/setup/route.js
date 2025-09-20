// app/main/route.js
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
        const dbConfigured = requiredEnvVars.POSTGRES_URL || requiredEnvVars.REDIS_URL;
        
        Object.entries(requiredEnvVars).forEach(([key, value]) => {
            // Skip REDIS_URL check if POSTGRES_URL is present and vice versa
            if ((key === 'REDIS_URL' && requiredEnvVars.POSTGRES_URL) || 
                (key === 'POSTGRES_URL' && requiredEnvVars.REDIS_URL)) {
                return;
            }

            if (value === undefined) {
                // Only add to missing if it's not the optional DB URL
                if (!(key === 'POSTGRES_URL' || key === 'REDIS_URL') || !dbConfigured) {
                    missingVars.push(key);
                }
            } else if (value === '') {
                // Only add to empty if it's not the optional DB URL
                if (!(key === 'POSTGRES_URL' || key === 'REDIS_URL') || !dbConfigured) {
                    emptyVars.push(key);
                }
            } else {
                presentVars.push(key);
            }
        });

        // Calculate setup status
        // Adjust total vars count to exclude the optional DB connection
        const totalVars = Object.keys(requiredEnvVars).length - 1; // Subtract 1 as only one DB is required
        const configuredVars = presentVars.length;
        const isSetupComplete = (missingVars.length === 0 && emptyVars.length === 0 && dbConfigured);
        const setupPercentage = Math.round((configuredVars / totalVars) * 100);

        // Test connections if setup is partially or fully complete
        let connectionTests = null;
        if (presentVars.length > 0) {
            connectionTests = {
                database: null,
                redis: null,
                blob: null
            };

            // Test database connection (basic URL validation)
            if (requiredEnvVars.POSTGRES_URL) {
                try {
                    new URL(requiredEnvVars.POSTGRES_URL);
                    connectionTests.database = 'URL format valid';
                } catch {
                    connectionTests.database = 'Invalid URL format';
                }
            }

            // Test Redis URL
            if (requiredEnvVars.REDIS_URL) {
                try {
                    new URL(requiredEnvVars.REDIS_URL);
                    connectionTests.redis = 'URL format valid';
                } catch {
                    connectionTests.redis = 'Invalid URL format';
                }
            }

            // Test Blob token
            if (requiredEnvVars.BLOB_READ_WRITE_TOKEN) {
                connectionTests.blob = requiredEnvVars.BLOB_READ_WRITE_TOKEN.startsWith('vercel_blob_rw_')
                    ? 'Token format appears valid'
                    : 'Token format may be invalid';
            }
        }

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
            connectionTests,
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