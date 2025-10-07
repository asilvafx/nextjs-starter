// data/rest.db.js
import RedisService from './redis.db.js';
import PostgresService from './postgres.db.js';
// Import future providers here
// import FirebaseService from './firebase.db.js';
// import MongoService from './mongo.db.js';
// import MySQLService from './mysql.db.js';

class DBService {
    constructor() {
        // Database providers registry
        this.providers = {
            redis: RedisService,
            postgres: PostgresService,
            // Add future providers here
            // firebase: FirebaseService,
            // mongodb: MongoService,
            // mysql: MySQLService,
        };

        // Initialize the database service based on available environment variables
        try {
            if (process.env.POSTGRES_URL ) { 
                this.provider = 'postgres';
                // Check if PostgresService is a constructor or already an instance
                this.service = typeof PostgresService === 'function' ? new PostgresService() : PostgresService;
            } else if (process.env.REDIS_URL) { 
                this.provider = 'redis';
                // Check if RedisService is a constructor or already an instance
                this.service = typeof RedisService === 'function' ? new RedisService() : RedisService;
            } else {
                console.log('No database configuration found');
                this.provider = null;
                this.service = null;
            }
        } catch (error) {
            console.error('Database service initialization failed:', error.message);
            this.provider = null;
            this.service = null;
        }
    }

    // Get service instance for a specific provider
    getProviderService(providerName) {
        const service = this.providers[providerName.toLowerCase()];
        if (!service) {
            throw new Error(`Unknown database provider: ${providerName}. Available: ${Object.keys(this.providers).join(', ')}`);
        }
        return service;
    }

    // Get the current provider name
    getProvider() {
        return this.provider;
    }

    // Get list of available providers
    getAvailableProviders() {
        return Object.keys(this.providers);
    }

    // Switch provider at runtime (optional)
    switchProvider(newProvider) {
        const availableProviders = Object.keys(this.providers);
        if (!availableProviders.includes(newProvider.toLowerCase())) {
            throw new Error(`Invalid provider: ${newProvider}. Available providers: ${availableProviders.join(', ')}`);
        }

        this.provider = newProvider.toLowerCase();
        this.service = this.getProviderService(this.provider);

        console.log(`Database provider switched to: ${this.provider}`);
        return this.provider;
    }

    // Unified methods - these will call the appropriate service
    async getItemsByKeyValue(key, value, table) {
        if (!this.service) {
            console.error('Database service not initialized');
            return null;
        }
        try {
            if (typeof this.service.getItemsByKeyValue === 'function') {
                return await this.service.getItemsByKeyValue(key, value, table);
            } else {
                console.warn(`getItemsByKeyValue not implemented for ${this.provider} provider`);
                return null;
            }
        } catch (error) {
            console.error(`Error in getItemsByKeyValue (${this.provider}):`, error);
            return null;
        }
    }

    async readBy(key, value, table) {
        if (!this.service) {
            console.error('Database service not initialized');
            return null;
        }
        try {
            if (typeof this.service.readBy === 'function') {
                return await this.service.readBy(key, value, table);
            } else {
                console.warn(`readBy not implemented for ${this.provider} provider`);
                return null;
            }
        } catch (error) {
            console.error(`Error in readBy (${this.provider}):`, error);
            return null;
        }
    }

    async getItemKey(key, value, table) {
        if (!this.service) {
            console.error('Database service not initialized');
            return null;
        }
        try {
            if (typeof this.service.getItemKey === 'function') {
                return await this.service.getItemKey(key, value, table);
            } else {
                console.warn(`getItemKey not implemented for ${this.provider} provider`);
                return null;
            }
        } catch (error) {
            console.error(`Error in getItemKey (${this.provider}):`, error);
            return null;
        }
    }

    async read(id, table) {
        if (!this.service) {
            console.error('Database service not initialized');
            return null;
        }
        try {
            return await this.service.read(id, table);
        } catch (error) {
            console.error(`Error in read (${this.provider}):`, error);
            return null;
        }
    }

    async readAll(table) {
        if (!this.service) {
            console.error('Database service not initialized');
            return {};
        }
        try {
            return await this.service.readAll(table);
        } catch (error) {
            console.error(`Error in readAll (${this.provider}):`, error);
            return {};
        }
    }

    async create(data, table) {
        if (!this.service) {
            console.error('Database service not initialized');
            return { success: false, message: 'Database not configured' };
        }
        try {
            return await this.service.create(data, table);
        } catch (error) {
            console.error(`Error in create (${this.provider}):`, error);
            return { success: false, message: error.message };
        }
    }

    async update(id, updateData, table) {
        if (!this.service) {
            console.error('Database service not initialized');
            return { success: false, message: 'Database not configured' };
        }
        try {
            return await this.service.update(id, updateData, table);
        } catch (error) {
            console.error(`Error in update (${this.provider}):`, error);
            return { success: false, message: error.message };
        }
    }

    async delete(id, table) {
        if (!this.service) {
            console.error('Database service not initialized');
            return { success: false, message: 'Database not configured' };
        }
        try {
            return await this.service.delete(id, table);
        } catch (error) {
            console.error(`Error in delete (${this.provider}):`, error);
            return { success: false, message: error.message };
        }
    }

    async deleteAll(table) {
        if (!this.service) {
            console.error('Database service not initialized');
            return false;
        }
        try {
            return await this.service.deleteAll(table);
        } catch (error) {
            console.error(`Error in deleteAll (${this.provider}):`, error);
            return false;
        }
    }

    async upload(file, path) {
        if (!this.service) {
            console.error('Database service not initialized');
            return null;
        }
        try {
            if (typeof this.service.upload === 'function') {
                return await this.service.upload(file, path);
            } else {
                console.warn(`upload not implemented for ${this.provider} provider`);
                return null;
            }
        } catch (error) {
            console.error(`Error in upload (${this.provider}):`, error);
            return null;
        }
    }

    // Health check method
    async healthCheck() {
        try {
            // Simple test to verify connection
            const testResult = await this.readAll('test_table');
            return {
                provider: this.provider,
                status: 'connected',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                provider: this.provider,
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Enhanced Migration System
    async migrateData(fromProvider, toProvider, options = {}) {
        const {
            tables = [],
            batchSize = 100,
            dryRun = false,
            transformData = null,
            onProgress = null,
            continueOnError = true,
            backupBeforeMigration = false
        } = options;

        // Validation
        const availableProviders = Object.keys(this.providers);
        if (!availableProviders.includes(fromProvider.toLowerCase())) {
            throw new Error(`Invalid source provider: ${fromProvider}. Available: ${availableProviders.join(', ')}`);
        }
        if (!availableProviders.includes(toProvider.toLowerCase())) {
            throw new Error(`Invalid destination provider: ${toProvider}. Available: ${availableProviders.join(', ')}`);
        }
        if (fromProvider.toLowerCase() === toProvider.toLowerCase()) {
            throw new Error('Source and destination providers cannot be the same');
        }
        if (!tables.length) {
            throw new Error('No tables specified for migration');
        }

        console.log(`Starting migration from ${fromProvider} to ${toProvider}...`);
        console.log(`Migration options:`, { tables, batchSize, dryRun, continueOnError, backupBeforeMigration });

        // Store original provider to restore later
        const originalProvider = this.provider;

        // Get services for both providers
        const sourceService = this.getProviderService(fromProvider);
        const destinationService = this.getProviderService(toProvider);

        const migrationResults = {
            startTime: new Date().toISOString(),
            fromProvider: fromProvider.toLowerCase(),
            toProvider: toProvider.toLowerCase(),
            tables: {},
            summary: {
                totalTables: tables.length,
                successfulTables: 0,
                failedTables: 0,
                totalRecords: 0,
                migratedRecords: 0,
                errors: []
            }
        };

        // Backup phase (if requested)
        if (backupBeforeMigration && !dryRun) {
            console.log('Creating backup before migration...');
            try {
                migrationResults.backup = await this.createBackup(toProvider, tables);
            } catch (error) {
                console.error('Backup failed:', error);
                migrationResults.summary.errors.push(`Backup failed: ${error.message}`);
                if (!continueOnError) {
                    throw error;
                }
            }
        }

        // Migration phase
        for (let i = 0; i < tables.length; i++) {
            const table = tables[i];
            const tableResult = {
                tableName: table,
                startTime: new Date().toISOString(),
                status: 'in-progress',
                totalRecords: 0,
                migratedRecords: 0,
                errors: [],
                records: []
            };

            try {
                console.log(`[${i + 1}/${tables.length}] Migrating table: ${table}`);

                // Progress callback
                if (onProgress) {
                    onProgress({
                        phase: 'migration',
                        currentTable: table,
                        tableIndex: i + 1,
                        totalTables: tables.length,
                        overallProgress: ((i / tables.length) * 100).toFixed(2)
                    });
                }

                // Switch to source provider and read data
                this.switchProvider(fromProvider);
                const sourceData = await sourceService.readAll(table);

                if (!sourceData || Object.keys(sourceData).length === 0) {
                    console.log(`Table ${table} is empty, skipping...`);
                    tableResult.status = 'skipped';
                    tableResult.totalRecords = 0;
                    migrationResults.tables[table] = tableResult;
                    continue;
                }

                const recordEntries = Object.entries(sourceData);
                tableResult.totalRecords = recordEntries.length;
                migrationResults.summary.totalRecords += recordEntries.length;

                console.log(`Found ${recordEntries.length} records in ${table}`);

                if (dryRun) {
                    console.log(`[DRY RUN] Would migrate ${recordEntries.length} records from ${table}`);
                    tableResult.status = 'dry-run-success';
                    tableResult.migratedRecords = recordEntries.length;
                    migrationResults.summary.migratedRecords += recordEntries.length;
                    migrationResults.tables[table] = tableResult;
                    continue;
                }

                // Switch to destination provider
                this.switchProvider(toProvider);

                // Process records in batches
                for (let batchStart = 0; batchStart < recordEntries.length; batchStart += batchSize) {
                    const batch = recordEntries.slice(batchStart, Math.min(batchStart + batchSize, recordEntries.length));

                    console.log(`Processing batch ${Math.floor(batchStart / batchSize) + 1}/${Math.ceil(recordEntries.length / batchSize)} (${batch.length} records)`);

                    for (const [originalKey, recordData] of batch) {
                        try {
                            // Apply data transformation if provided
                            let transformedData = recordData;
                            if (transformData && typeof transformData === 'function') {
                                transformedData = await transformData(recordData, originalKey, table, fromProvider, toProvider);
                            }

                            // Create record in destination
                            const result = await destinationService.create(transformedData, table);

                            tableResult.records.push({
                                originalKey,
                                newKey: result.key || result.id,
                                status: 'success',
                                data: transformedData
                            });

                            tableResult.migratedRecords++;
                            migrationResults.summary.migratedRecords++;

                        } catch (error) {
                            const errorInfo = {
                                originalKey,
                                error: error.message,
                                data: recordData
                            };

                            tableResult.errors.push(errorInfo);
                            tableResult.records.push({
                                originalKey,
                                status: 'error',
                                error: error.message
                            });

                            console.error(`Error migrating record ${originalKey} in ${table}:`, error.message);

                            if (!continueOnError) {
                                throw error;
                            }
                        }
                    }

                    // Progress update for batch completion
                    if (onProgress) {
                        onProgress({
                            phase: 'migration',
                            currentTable: table,
                            tableProgress: ((batchStart + batch.length) / recordEntries.length * 100).toFixed(2),
                            recordsProcessed: batchStart + batch.length,
                            totalRecordsInTable: recordEntries.length
                        });
                    }
                }

                tableResult.status = tableResult.errors.length === 0 ? 'success' : 'partial-success';
                tableResult.endTime = new Date().toISOString();

                if (tableResult.errors.length === 0) {
                    migrationResults.summary.successfulTables++;
                } else {
                    migrationResults.summary.failedTables++;
                }

                console.log(`Table ${table} migration completed: ${tableResult.migratedRecords}/${tableResult.totalRecords} records migrated`);

            } catch (error) {
                tableResult.status = 'failed';
                tableResult.endTime = new Date().toISOString();
                tableResult.errors.push({
                    type: 'table-level',
                    error: error.message
                });

                migrationResults.summary.failedTables++;
                migrationResults.summary.errors.push(`Table ${table}: ${error.message}`);

                console.error(`Table ${table} migration failed:`, error);

                if (!continueOnError) {
                    migrationResults.endTime = new Date().toISOString();
                    this.switchProvider(originalProvider);
                    throw error;
                }
            }

            migrationResults.tables[table] = tableResult;
        }

        // Restore original provider
        this.switchProvider(originalProvider);

        migrationResults.endTime = new Date().toISOString();
        migrationResults.duration = new Date(migrationResults.endTime).getTime() - new Date(migrationResults.startTime).getTime();

        console.log('\n=== MIGRATION SUMMARY ===');
        console.log(`Duration: ${migrationResults.duration}ms`);
        console.log(`Tables: ${migrationResults.summary.successfulTables}/${migrationResults.summary.totalTables} successful`);
        console.log(`Records: ${migrationResults.summary.migratedRecords}/${migrationResults.summary.totalRecords} migrated`);
        if (migrationResults.summary.errors.length > 0) {
            console.log(`Errors: ${migrationResults.summary.errors.length}`);
        }
        console.log('========================\n');

        return migrationResults;
    }

    // Create backup of specific tables
    async createBackup(provider, tables) {
        const originalProvider = this.provider;
        this.switchProvider(provider);

        const backup = {
            timestamp: new Date().toISOString(),
            provider: provider,
            tables: {}
        };

        try {
            for (const table of tables) {
                console.log(`Backing up table: ${table}`);
                backup.tables[table] = await this.readAll(table);
            }
        } finally {
            this.switchProvider(originalProvider);
        }

        return backup;
    }

    // Restore from backup
    async restoreFromBackup(backup, options = {}) {
        const { overwrite = false, tables = null } = options;

        const tablesToRestore = tables || Object.keys(backup.tables);
        const results = {};

        for (const table of tablesToRestore) {
            if (!backup.tables[table]) {
                results[table] = { error: 'Table not found in backup' };
                continue;
            }

            try {
                if (overwrite) {
                    await this.deleteAll(table);
                }

                const records = backup.tables[table];
                let restoredCount = 0;

                for (const [key, data] of Object.entries(records)) {
                    try {
                        await this.create(data, table);
                        restoredCount++;
                    } catch (error) {
                        console.error(`Error restoring record ${key}:`, error);
                    }
                }

                results[table] = {
                    totalRecords: Object.keys(records).length,
                    restoredRecords: restoredCount,
                    status: 'success'
                };

            } catch (error) {
                results[table] = { error: error.message, status: 'failed' };
            }
        }

        return results;
    }

    // Close all connections (useful for Redis)
    async disconnect() {
        if (this.service && typeof this.service.disconnect === 'function') {
            await this.service.disconnect();
        }
    }
}

export default new DBService();
