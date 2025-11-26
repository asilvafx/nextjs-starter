// app/main/route.js
import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';

// Default data structures based on admin pages
const getDefaultSiteSettings = () => ({
    id: 1,
    siteName: 'My CMS Platform',
    siteEmail: 'admin@example.com',
    sitePhone: '',
    businessAddress: '',
    latitude: undefined,
    longitude: undefined,
    country: '',
    countryIso: '',
    language: 'en',
    availableLanguages: ['en'],
    timezone: 'UTC',
    socialNetworks: [],
    workingHours: [],
    serviceArea: '',
    serviceRadius: undefined,
    googleAnalyticsId: '',
    smsEnabled: false,
    twilioApiKey: '',
    googleMapsEnabled: false,
    googleMapsApiKey: '',
    turnstileEnabled: false,
    turnstileSiteKey: '',
    emailProvider: 'none',
    emailUser: '',
    emailPass: '',
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: false,
    allowRegistration: true,
    enableFrontend: true,
    baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    providers: {
        google: { clientId: '', clientSecret: '', enabled: false },
        github: { clientId: '', clientSecret: '', enabled: false },
        facebook: { clientId: '', clientSecret: '', enabled: false },
        twitter: { clientId: '', clientSecret: '', enabled: false },
        discord: { clientId: '', clientSecret: '', enabled: false },
        linkedin: { clientId: '', clientSecret: '', enabled: false }
    },
    web3Active: false,
    web3ContractAddress: '',
    web3ContractSymbol: '',
    web3ChainSymbol: '',
    web3InfuraRpc: '',
    web3ChainId: 1,
    web3NetworkName: 'Ethereum Mainnet',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
});

const getDefaultStoreSettings = () => ({
    id: 'store_settings_1',
    businessName: 'My Store',
    tvaNumber: '',
    address: '',
    vatEnabled: true,
    vatPercentage: 20,
    vatIncludedInPrice: true,
    applyVatAtCheckout: false,
    paymentMethods: {
        cardPayments: false,
        stripePublicKey: '',
        stripeSecretKey: '',
        bankTransfer: false,
        bankTransferDetails: {
            bankName: '',
            accountHolder: '',
            iban: '',
            bic: '',
            additionalInstructions: ''
        },
        payOnDelivery: false
    },
    freeShippingEnabled: false,
    freeShippingThreshold: 50,
    internationalShipping: false,
    allowedCountries: [],
    bannedCountries: [],
    carriers: [],
    currency: 'EUR',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
});

const getDefaultRoles = () => [
    {
        id: 'admin_role',
        name: 'admin',
        displayName: 'Administrator',
        description: 'Full access to all features and settings',
        permissions: ['*'],
        isProtected: true,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'user_role',
        name: 'user',
        displayName: 'User',
        description: 'Standard user with basic access',
        permissions: ['read:profile', 'update:profile'],
        isProtected: true,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

// Initialize default database tables and data
const initializeDatabase = async () => {
    const results = {
        success: false,
        tablesCreated: [],
        errors: [],
        message: ''
    };

    try {
        // Check and create site_settings
        try {
            const existingSiteSettings = await DBService.readAll('site_settings');
            const hasData = existingSiteSettings && Object.keys(existingSiteSettings).length > 0;
            
            if (!hasData) {
                const defaultSiteSettings = getDefaultSiteSettings();
                await DBService.create(defaultSiteSettings, 'site_settings');
                results.tablesCreated.push('site_settings');
            }
        } catch (error) {
            console.log('Creating site_settings table with default data...');
            const defaultSiteSettings = getDefaultSiteSettings();
            await DBService.create(defaultSiteSettings, 'site_settings');
            results.tablesCreated.push('site_settings');
        }

        // Check and create store_settings
        try {
            const existingStoreSettings = await DBService.readAll('store_settings');
            const hasData = existingStoreSettings && Object.keys(existingStoreSettings).length > 0;
            
            if (!hasData) {
                const defaultStoreSettings = getDefaultStoreSettings();
                await DBService.create(defaultStoreSettings, 'store_settings');
                results.tablesCreated.push('store_settings');
            }
        } catch (error) {
            console.log('Creating store_settings table with default data...');
            const defaultStoreSettings = getDefaultStoreSettings();
            await DBService.create(defaultStoreSettings, 'store_settings');
            results.tablesCreated.push('store_settings');
        }

        // Check and create roles
        try {
            const existingRoles = await DBService.readAll('roles');
            const hasData = existingRoles && Object.keys(existingRoles).length > 0;
            
            if (!hasData) {
                const defaultRoles = getDefaultRoles();
                for (const role of defaultRoles) {
                    await DBService.create(role, 'roles');
                }
                results.tablesCreated.push('roles');
            }
        } catch (error) {
            console.log('Creating roles table with default data...');
            const defaultRoles = getDefaultRoles();
            for (const role of defaultRoles) {
                await DBService.create(role, 'roles');
            }
            results.tablesCreated.push('roles');
        }

        // Initialize empty tables that might be needed
        const emptyTables = ['users', 'customers', 'orders', 'catalog', 'categories', 'collections', 'attributes'];
        for (const tableName of emptyTables) {
            try {
                await DBService.readAll(tableName);
            } catch (error) {
                // Table doesn't exist, we don't need to create it as it will be created when first item is added
                console.log(`Table ${tableName} will be created when first item is added`);
            }
        }

        results.success = true;
        results.message = results.tablesCreated.length > 0 
            ? `Database initialized successfully. Created: ${results.tablesCreated.join(', ')}`
            : 'Database already initialized with default data';

        return results;
    } catch (error) {
        console.error('Database initialization error:', error);
        results.errors.push(error.message);
        results.message = 'Failed to initialize database';
        return results;
    }
};

export async function GET() {
    try {
        // Define required environment variables
        const requiredEnvVars = {
            POSTGRES_URL: process.env.POSTGRES_URL || '',
            REDIS_URL: process.env.REDIS_URL || '',
            BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN || '',
            NEXT_SECRET_KEY: process.env.NEXT_SECRET_KEY || ''
        };

        const missingVars = [];
        const emptyVars = [];
        const presentVars = [];

        // Check each environment variable
        const dbConfigured = requiredEnvVars.POSTGRES_URL || requiredEnvVars.REDIS_URL;

        Object.entries(requiredEnvVars).forEach(([key, value]) => {
            // Skip REDIS_URL check if POSTGRES_URL is present and vice versa
            if (
                (key === 'REDIS_URL' && requiredEnvVars.POSTGRES_URL) ||
                (key === 'POSTGRES_URL' && requiredEnvVars.REDIS_URL)
            ) {
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
        const isSetupComplete = missingVars.length === 0 && emptyVars.length === 0 && dbConfigured;
        const setupPercentage = Math.round((configuredVars / totalVars) * 100);

        // Test connections if setup is partially or fully complete
        let connectionTests = null;
        let databaseInitialization = null;
        
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

            // Initialize database with default tables and data if setup is complete
            if (isSetupComplete && dbConfigured) {
                console.log('Setup complete, initializing database...');
                databaseInitialization = await initializeDatabase();
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
            databaseInitialization,
            message: isSetupComplete
                ? 'All environment variables are configured correctly and database is initialized.'
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
