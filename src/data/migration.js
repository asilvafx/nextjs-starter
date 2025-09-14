// migration.js - Advanced Migration Utilities (Firebase ↔ Redis)
import fs from 'fs/promises';
import path from 'path';

class Migration {

    // Data transformation templates for Firebase ↔ Redis conversions
    static transformations = {
        // Firebase to Redis transformations
        firebaseToRedis: {
            // Remove Firebase-specific metadata and clean data structure
            removeFirebaseMetadata: (data, key, table) => {
                const { '.key': firebaseKey, '.priority': priority, '.value': value, ...cleanData } = data;

                // If data was stored as a primitive value with .value, extract it
                if (value !== undefined && Object.keys(cleanData).length === 0) {
                    return { value };
                }

                return cleanData;
            },

            // Convert Firebase timestamps to ISO strings for Redis storage
            convertTimestamps: (data, key, table) => {
                const converted = { ...data };
                for (const [field, value] of Object.entries(converted)) {
                    if (value && typeof value === 'object' && value.seconds && value.nanoseconds) {
                        // Firebase Timestamp object
                        converted[field] = new Date(value.seconds * 1000 + value.nanoseconds / 1000000).toISOString();
                    } else if (field.includes('_at') || field.includes('Time') || field.includes('Date') || field.includes('timestamp')) {
                        // Common timestamp field patterns
                        if (typeof value === 'number' && value > 1000000000000) {
                            converted[field] = new Date(value).toISOString();
                        }
                    }
                }
                return converted;
            },

            // Add Redis-compatible metadata
            addRedisMetadata: (data, key, table) => {
                const now = new Date().toISOString();
                return {
                    ...data,
                    // Preserve original Firebase key as metadata
                    originalFirebaseKey: key,
                    // Add Redis-friendly timestamps if not present
                    createdAt: data.createdAt || data.created_at || now,
                    updatedAt: data.updatedAt || data.updated_at || now,
                    migratedFrom: 'firebase',
                    migratedAt: now
                };
            },

            // Flatten nested objects for better Redis performance (optional)
            flattenNestedObjects: (data, key, table, maxDepth = 2) => {
                const flatten = (obj, prefix = '', depth = 0) => {
                    if (depth >= maxDepth) return obj;

                    const flattened = {};
                    for (const [k, v] of Object.entries(obj)) {
                        const newKey = prefix ? `${prefix}_${k}` : k;

                        if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
                            Object.assign(flattened, flatten(v, newKey, depth + 1));
                        } else {
                            flattened[newKey] = v;
                        }
                    }
                    return flattened;
                };

                // Only flatten if object is deeply nested
                const hasNestedObjects = Object.values(data).some(v =>
                    v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)
                );

                return hasNestedObjects ? flatten(data) : data;
            }
        },

        // Redis to Firebase transformations
        redisToFirebase: {
            // Remove Redis-specific metadata
            removeRedisMetadata: (data, key, table) => {
                const {
                    originalFirebaseKey,
                    migratedFrom,
                    migratedAt,
                    createdAt,
                    updatedAt,
                    ...cleanData
                } = data;
                return cleanData;
            },

            // Convert ISO strings back to Firebase timestamps
            convertToFirebaseTimestamps: (data, key, table) => {
                const converted = { ...data };
                for (const [field, value] of Object.entries(converted)) {
                    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
                        // ISO string pattern - convert to Firebase timestamp format
                        const date = new Date(value);

                        // For common timestamp fields, convert to Firebase server timestamp format
                        if (field.includes('_at') || field.includes('Time') || field.includes('Date') || field.includes('timestamp')) {
                            converted[field] = date.getTime(); // Firebase typically uses milliseconds
                        }
                    }
                }
                return converted;
            },

            // Restore nested object structure if it was flattened
            unflattenObjects: (data, key, table) => {
                const unflattened = {};

                for (const [field, value] of Object.entries(data)) {
                    if (field.includes('_') && !['created_at', 'updated_at'].includes(field)) {
                        const parts = field.split('_');
                        let current = unflattened;

                        for (let i = 0; i < parts.length - 1; i++) {
                            const part = parts[i];
                            if (!current[part]) {
                                current[part] = {};
                            }
                            current = current[part];
                        }

                        current[parts[parts.length - 1]] = value;
                    } else {
                        unflattened[field] = value;
                    }
                }

                // If no nested structure was created, return original data
                return Object.keys(unflattened).length > 0 ? unflattened : data;
            },

            // Add Firebase-compatible structure
            addFirebaseStructure: (data, key, table) => {
                // Firebase auto-generates timestamps, so we can remove explicit ones
                const { createdAt, updatedAt, ...firebaseData } = data;

                return {
                    ...firebaseData,
                    migratedFrom: 'redis',
                    migratedAt: new Date().toISOString()
                };
            }
        },

        // Generic transformations for both directions
        generic: {
            // Sanitize field names for database compatibility
            sanitizeFieldNames: (targetDB = 'redis') => (data, key, table) => {
                const sanitized = {};
                for (const [field, value] of Object.entries(data)) {
                    let cleanField = field;

                    if (targetDB === 'redis') {
                        // Redis is more flexible, but avoid special characters
                        cleanField = field.replace(/[^a-zA-Z0-9_.-]/g, '_');
                    } else if (targetDB === 'firebase') {
                        // Firebase doesn't allow certain characters in keys
                        cleanField = field.replace(/[.$#\[\]/]/g, '_');
                    }

                    sanitized[cleanField] = value;
                }
                return sanitized;
            },

            // Validate required fields
            validateRequiredFields: (requiredFields) => (data, key, table) => {
                const missing = [];
                for (const field of requiredFields) {
                    if (!data.hasOwnProperty(field) || data[field] === null || data[field] === undefined) {
                        missing.push(field);
                    }
                }

                if (missing.length > 0) {
                    throw new Error(`Required fields missing: ${missing.join(', ')}`);
                }

                return data;
            },

            // Add default values for missing fields
            addDefaults: (defaults) => (data, key, table) => {
                return { ...defaults, ...data };
            },

            // Handle array serialization for Redis
            serializeArraysForRedis: (data, key, table) => {
                const serialized = { ...data };
                for (const [field, value] of Object.entries(serialized)) {
                    if (Array.isArray(value)) {
                        // Redis stores everything as strings, so we serialize arrays as JSON
                        serialized[`${field}_array`] = JSON.stringify(value);
                        delete serialized[field];
                    }
                }
                return serialized;
            },

            // Deserialize arrays from Redis
            deserializeArraysFromRedis: (data, key, table) => {
                const deserialized = { ...data };
                const arrayFields = [];

                for (const [field, value] of Object.entries(deserialized)) {
                    if (field.endsWith('_array') && typeof value === 'string') {
                        try {
                            const originalField = field.replace('_array', '');
                            deserialized[originalField] = JSON.parse(value);
                            arrayFields.push(field);
                        } catch (error) {
                            console.warn(`Failed to deserialize array field ${field}:`, error);
                        }
                    }
                }

                // Remove the serialized array fields
                arrayFields.forEach(field => delete deserialized[field]);

                return deserialized;
            },

            // Handle large text fields
            optimizeForRedis: (data, key, table) => {
                const optimized = { ...data };

                for (const [field, value] of Object.entries(optimized)) {
                    // Compress large text fields
                    if (typeof value === 'string' && value.length > 1000) {
                        // Mark as compressed for later decompression
                        optimized[`${field}_large`] = value;
                        optimized[field] = `[LARGE_TEXT:${value.length}]`;
                    }
                }

                return optimized;
            }
        }
    };

    // Combine multiple transformations
    static combineTransformations(...transformations) {
        return async (data, key, table, fromProvider, toProvider) => {
            let result = data;
            for (const transform of transformations) {
                if (typeof transform === 'function') {
                    result = await transform(result, key, table, fromProvider, toProvider);
                }
            }
            return result;
        };
    }

    // Get recommended transformation chain
    static getRecommendedTransformation(fromProvider, toProvider) {
        const normalizedFrom = fromProvider.toLowerCase();
        const normalizedTo = toProvider.toLowerCase();

        if (normalizedFrom === 'firebase' && normalizedTo === 'redis') {
            return this.combineTransformations(
                this.transformations.firebaseToRedis.removeFirebaseMetadata,
                this.transformations.firebaseToRedis.convertTimestamps,
                this.transformations.generic.sanitizeFieldNames('redis'),
                this.transformations.generic.serializeArraysForRedis,
                this.transformations.firebaseToRedis.addRedisMetadata,
                this.transformations.generic.optimizeForRedis
            );
        } else if (normalizedFrom === 'redis' && normalizedTo === 'firebase') {
            return this.combineTransformations(
                this.transformations.redisToFirebase.removeRedisMetadata,
                this.transformations.generic.deserializeArraysFromRedis,
                this.transformations.redisToFirebase.convertToFirebaseTimestamps,
                this.transformations.generic.sanitizeFieldNames('firebase'),
                this.transformations.redisToFirebase.addFirebaseStructure
            );
        }

        console.warn(`No specific transformation found for ${fromProvider} -> ${toProvider}`);
        return this.transformations.generic.sanitizeFieldNames(normalizedTo);
    }

    // Enhanced schema validation for Firebase ↔ Redis
    static async validateSchema(data, schema, targetProvider = 'redis') {
        const errors = [];

        for (const [field, rules] of Object.entries(schema)) {
            const value = data[field];

            if (rules.required && (value === undefined || value === null)) {
                errors.push(`Field '${field}' is required`);
                continue;
            }

            if (value !== undefined && value !== null) {
                if (rules.type && typeof value !== rules.type) {
                    errors.push(`Field '${field}' must be of type ${rules.type}, got ${typeof value}`);
                }

                if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
                    errors.push(`Field '${field}' exceeds maximum length of ${rules.maxLength}`);
                }

                if (rules.pattern && !rules.pattern.test(value)) {
                    errors.push(`Field '${field}' does not match required pattern`);
                }

                if (rules.enum && !rules.enum.includes(value)) {
                    errors.push(`Field '${field}' must be one of: ${rules.enum.join(', ')}`);
                }

                // Provider-specific validations
                if (targetProvider === 'firebase') {
                    if (typeof field === 'string' && /[.$#\[\]/]/.test(field)) {
                        errors.push(`Field name '${field}' contains invalid characters for Firebase`);
                    }
                }
            }
        }

        return { valid: errors.length === 0, errors };
    }

    // Provider-specific migration recommendations
    static getProviderSpecificRecommendations(fromProvider, toProvider, dataAnalysis) {
        const recommendations = [];

        if (fromProvider === 'firebase' && toProvider === 'redis') {
            recommendations.push('Consider setting TTL for temporary data in Redis');
            recommendations.push('Large nested objects will be flattened for better Redis performance');
            recommendations.push('Array fields will be JSON-serialized for Redis compatibility');

            if (dataAnalysis.hasLargeTextFields) {
                recommendations.push('Large text fields will be compressed and may need special handling');
            }

            if (dataAnalysis.hasTimestamps) {
                recommendations.push('Firebase timestamps will be converted to ISO strings');
            }
        } else if (fromProvider === 'redis' && toProvider === 'firebase') {
            recommendations.push('Redis TTL settings will be lost in Firebase migration');
            recommendations.push('Serialized arrays will be deserialized back to native arrays');
            recommendations.push('Consider Firebase security rules for migrated data');

            if (dataAnalysis.hasCompressedFields) {
                recommendations.push('Compressed text fields will be restored to full content');
            }
        }

        return recommendations;
    }

    // Export migration results to file
    static async exportResults(results, filename = null) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const exportFilename = filename || `migration-results-${results.fromProvider}-to-${results.toProvider}-${timestamp}.json`;

        try {
            await fs.writeFile(exportFilename, JSON.stringify(results, null, 2));
            console.log(`Migration results exported to: ${exportFilename}`);
            return exportFilename;
        } catch (error) {
            console.error('Failed to export migration results:', error);
            throw error;
        }
    }

    // Import migration results from file
    static async importResults(filename) {
        try {
            const data = await fs.readFile(filename, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Failed to import migration results:', error);
            throw error;
        }
    }

    // Generate migration report
    static generateReport(results) {
        const { summary, tables } = results;

        let report = `
# Migration Report: ${results.fromProvider} → ${results.toProvider}
**Date:** ${results.startTime}
**Duration:** ${results.duration}ms (${(results.duration / 1000).toFixed(2)}s)

## Summary
- **Tables:** ${summary.successfulTables}/${summary.totalTables} successful
- **Records:** ${summary.migratedRecords}/${summary.totalRecords} migrated
- **Success Rate:** ${((summary.migratedRecords / summary.totalRecords) * 100).toFixed(2)}%

`;

        if (summary.errors.length > 0) {
            report += `## Global Errors\n`;
            summary.errors.forEach(error => {
                report += `- ${error}\n`;
            });
            report += '\n';
        }

        report += `## Table Details\n`;
        Object.entries(tables).forEach(([tableName, tableResult]) => {
            const successRate = tableResult.totalRecords > 0
                ? ((tableResult.migratedRecords / tableResult.totalRecords) * 100).toFixed(2)
                : '0';

            report += `### ${tableName}\n`;
            report += `- **Status:** ${tableResult.status}\n`;
            report += `- **Records:** ${tableResult.migratedRecords}/${tableResult.totalRecords} (${successRate}%)\n`;

            if (tableResult.startTime && tableResult.endTime) {
                const duration = new Date(tableResult.endTime).getTime() - new Date(tableResult.startTime).getTime();
                report += `- **Duration:** ${duration}ms\n`;
            }

            if (tableResult.errors.length > 0) {
                report += `- **Errors:** ${tableResult.errors.length}\n`;
                tableResult.errors.slice(0, 5).forEach(error => {
                    const errorMsg = error.error || error.message || error;
                    report += `  - ${errorMsg}\n`;
                });
                if (tableResult.errors.length > 5) {
                    report += `  - ... and ${tableResult.errors.length - 5} more\n`;
                }
            }
            report += '\n';
        });

        return report;
    }

    // Save report to file
    static async saveReport(results, filename = null) {
        const report = this.generateReport(results);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportFilename = filename || `migration-report-${results.fromProvider}-to-${results.toProvider}-${timestamp}.md`;

        try {
            await fs.writeFile(reportFilename, report);
            console.log(`Migration report saved to: ${reportFilename}`);
            return reportFilename;
        } catch (error) {
            console.error('Failed to save migration report:', error);
            throw error;
        }
    }

    // Compare Firebase and Redis data for consistency
    static async compareData(dbService, provider1, provider2, tables) {
        const originalProvider = dbService.getProvider();
        const differences = {};

        try {
            for (const table of tables) {
                console.log(`Comparing table: ${table} between ${provider1} and ${provider2}`);

                // Get data from both providers
                dbService.switchProvider(provider1);
                const data1 = await dbService.readAll(table);

                dbService.switchProvider(provider2);
                const data2 = await dbService.readAll(table);

                // Normalize data for comparison
                const keys1 = new Set(Object.keys(data1));
                const keys2 = new Set(Object.keys(data2));

                const onlyIn1 = [...keys1].filter(k => !keys2.has(k));
                const onlyIn2 = [...keys2].filter(k => !keys1.has(k));
                const common = [...keys1].filter(k => keys2.has(k));

                const contentDifferences = [];
                for (const key of common) {
                    // Remove metadata for comparison
                    const cleanData1 = { ...data1[key] };
                    const cleanData2 = { ...data2[key] };

                    // Remove migration metadata
                    delete cleanData1.migratedFrom;
                    delete cleanData1.migratedAt;
                    delete cleanData1.originalFirebaseKey;
                    delete cleanData2.migratedFrom;
                    delete cleanData2.migratedAt;
                    delete cleanData2.originalFirebaseKey;

                    if (JSON.stringify(cleanData1) !== JSON.stringify(cleanData2)) {
                        contentDifferences.push({
                            key,
                            [provider1]: cleanData1,
                            [provider2]: cleanData2
                        });
                    }
                }

                differences[table] = {
                    total1: Object.keys(data1).length,
                    total2: Object.keys(data2).length,
                    onlyIn1: onlyIn1.length,
                    onlyIn2: onlyIn2.length,
                    common: common.length,
                    contentDifferences: contentDifferences.length,
                    consistency: contentDifferences.length === 0 && onlyIn1.length === 0 && onlyIn2.length === 0,
                    details: {
                        onlyIn1,
                        onlyIn2,
                        contentDifferences: contentDifferences.slice(0, 10)
                    }
                };

                console.log(`${table}: ${differences[table].consistency ? 'CONSISTENT' : 'INCONSISTENT'}`);
            }
        } finally {
            dbService.switchProvider(originalProvider);
        }

        return differences;
    }

    // Rollback migration (reverse migration)
    static async rollbackMigration(dbService, migrationResults, options = {}) {
        const { deleteTargetData = false, preserveOriginalKeys = true } = options;

        console.log('Starting migration rollback...');

        const rollbackResults = {
            startTime: new Date().toISOString(),
            originalMigration: {
                from: migrationResults.fromProvider,
                to: migrationResults.toProvider,
                timestamp: migrationResults.startTime
            },
            rollbackActions: {},
            summary: { successfulTables: 0, failedTables: 0 }
        };

        const originalProvider = dbService.getProvider();

        try {
            for (const [tableName, tableResult] of Object.entries(migrationResults.tables)) {
                if (tableResult.status !== 'success' && tableResult.status !== 'partial-success') {
                    continue;
                }

                console.log(`Rolling back table: ${tableName}`);
                rollbackResults.rollbackActions[tableName] = {
                    startTime: new Date().toISOString(),
                    actions: []
                };

                try {
                    if (deleteTargetData) {
                        dbService.switchProvider(migrationResults.toProvider);

                        const successfulRecords = tableResult.records.filter(r => r.status === 'success');
                        let deletedCount = 0;

                        for (const record of successfulRecords) {
                            try {
                                const keyToDelete = record.newKey || record.id;
                                await dbService.delete(keyToDelete, tableName);
                                deletedCount++;
                            } catch (error) {
                                console.warn(`Failed to delete record ${record.newKey}:`, error.message);
                            }
                        }

                        rollbackResults.rollbackActions[tableName].actions.push({
                            type: 'delete_target_data',
                            recordsDeleted: deletedCount,
                            totalRecords: successfulRecords.length
                        });
                    }

                    rollbackResults.rollbackActions[tableName].status = 'success';
                    rollbackResults.rollbackActions[tableName].endTime = new Date().toISOString();
                    rollbackResults.summary.successfulTables++;

                } catch (error) {
                    rollbackResults.rollbackActions[tableName].status = 'failed';
                    rollbackResults.rollbackActions[tableName].error = error.message;
                    rollbackResults.rollbackActions[tableName].endTime = new Date().toISOString();
                    rollbackResults.summary.failedTables++;
                    console.error(`Rollback failed for table ${tableName}:`, error);
                }
            }

        } finally {
            dbService.switchProvider(originalProvider);
        }

        rollbackResults.endTime = new Date().toISOString();
        console.log('Migration rollback completed:', rollbackResults.summary);

        return rollbackResults;
    }

    // Preview migration with Firebase/Redis specific analysis
    static async previewMigration(dbService, fromProvider, toProvider, tables, options = {}) {
        const { sampleSize = 5, analyzeTTL = true } = options;

        console.log(`Generating migration preview from ${fromProvider} to ${toProvider}...`);

        const originalProvider = dbService.getProvider();
        const preview = {
            fromProvider,
            toProvider,
            timestamp: new Date().toISOString(),
            tables: {},
            summary: {
                totalTables: tables.length,
                totalEstimatedRecords: 0,
                estimatedDataSize: 0,
                warnings: [],
                recommendations: []
            }
        };

        try {
            dbService.switchProvider(fromProvider);

            for (const table of tables) {
                console.log(`Analyzing table: ${table}`);

                const tablePreview = {
                    tableName: table,
                    recordCount: 0,
                    estimatedSize: 0,
                    sampleRecords: [],
                    fieldAnalysis: {},
                    warnings: [],
                    recommendations: [],
                    ttlInfo: null
                };

                try {
                    const allData = await dbService.readAll(table);
                    const entries = Object.entries(allData);

                    tablePreview.recordCount = entries.length;
                    preview.summary.totalEstimatedRecords += entries.length;

                    if (entries.length === 0) {
                        tablePreview.warnings.push('Table is empty');
                        preview.tables[table] = tablePreview;
                        continue;
                    }

                    // Sample records for analysis
                    const sampleCount = Math.min(sampleSize, entries.length);
                    const sampleIndices = new Set();
                    while (sampleIndices.size < sampleCount) {
                        sampleIndices.add(Math.floor(Math.random() * entries.length));
                    }

                    const sampleEntries = [...sampleIndices].map(i => entries[i]);
                    tablePreview.sampleRecords = sampleEntries.slice(0, 3).map(([key, data]) => ({
                        key,
                        data: JSON.stringify(data).substring(0, 200) + '...'
                    }));

                    // Analyze fields and data characteristics
                    const fieldStats = {};
                    let totalDataSize = 0;
                    let hasArrays = false;
                    let hasNestedObjects = false;
                    let hasTimestamps = false;

                    for (const [key, record] of entries) {
                        const recordSize = JSON.stringify(record).length;
                        totalDataSize += recordSize;

                        for (const [field, value] of Object.entries(record)) {
                            if (!fieldStats[field]) {
                                fieldStats[field] = {
                                    count: 0,
                                    types: new Set(),
                                    nullCount: 0,
                                    maxLength: 0,
                                    examples: []
                                };
                            }

                            fieldStats[field].count++;

                            if (value === null || value === undefined) {
                                fieldStats[field].nullCount++;
                            } else {
                                const valueType = Array.isArray(value) ? 'array' : typeof value;
                                fieldStats[field].types.add(valueType);

                                if (Array.isArray(value)) {
                                    hasArrays = true;
                                } else if (typeof value === 'object') {
                                    hasNestedObjects = true;
                                } else if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
                                    hasTimestamps = true;
                                }

                                if (typeof value === 'string') {
                                    fieldStats[field].maxLength = Math.max(
                                        fieldStats[field].maxLength,
                                        value.length
                                    );
                                }
                                if (fieldStats[field].examples.length < 3) {
                                    fieldStats[field].examples.push(value);
                                }
                            }
                        }
                    }

                    // Convert field stats for JSON serialization
                    tablePreview.fieldAnalysis = Object.entries(fieldStats).reduce((acc, [field, stats]) => {
                        acc[field] = {
                            ...stats,
                            types: [...stats.types],
                            presence: ((stats.count / entries.length) * 100).toFixed(1) + '%',
                            nullPercentage: ((stats.nullCount / stats.count) * 100).toFixed(1) + '%'
                        };
                        return acc;
                    }, {});

                    tablePreview.estimatedSize = totalDataSize;
                    preview.summary.estimatedDataSize += totalDataSize;

                    // Generate provider-specific warnings and recommendations
                    if (fromProvider === 'firebase' && toProvider === 'redis') {
                        if (hasArrays) {
                            tablePreview.recommendations.push('Arrays will be JSON-serialized for Redis storage');
                        }
                        if (hasNestedObjects) {
                            tablePreview.recommendations.push('Nested objects may be flattened for better Redis performance');
                        }
                        if (hasTimestamps) {
                            tablePreview.recommendations.push('Timestamps will be converted to ISO strings');
                        }
                        tablePreview.recommendations.push('Consider setting TTL for time-sensitive data in Redis');
                    } else if (fromProvider === 'redis' && toProvider === 'firebase') {
                        tablePreview.warnings.push('Redis TTL settings will be lost in Firebase');
                        tablePreview.recommendations.push('Serialized arrays will be restored to native arrays');
                        tablePreview.recommendations.push('Consider Firebase security rules for the migrated data');
                    }

                    // Field-specific warnings
                    for (const [field, analysis] of Object.entries(tablePreview.fieldAnalysis)) {
                        if (analysis.types.length > 1) {
                            tablePreview.warnings.push(`Field '${field}' has mixed types: ${analysis.types.join(', ')}`);
                        }

                        if (parseFloat(analysis.nullPercentage) > 50) {
                            tablePreview.warnings.push(`Field '${field}' is null in ${analysis.nullPercentage} of records`);
                        }

                        if (toProvider === 'firebase' && /[.$#\[\]/]/.test(field)) {
                            tablePreview.warnings.push(`Field name '${field}' contains characters invalid for Firebase`);
                        }
                    }

                } catch (error) {
                    tablePreview.warnings.push(`Failed to analyze table: ${error.message}`);
                }

                preview.tables[table] = tablePreview;
            }

            // Global recommendations
            const totalSizeMB = preview.summary.estimatedDataSize / (1024 * 1024);
            if (totalSizeMB > 100) {
                preview.summary.recommendations.push(`Large dataset (${totalSizeMB.toFixed(2)}MB) - consider batch processing`);
            }

            if (preview.summary.totalEstimatedRecords > 10000) {
                preview.summary.recommendations.push('Large number of records - enable progress monitoring and increase batch size');
            }

            // Provider-specific global recommendations
            if (fromProvider === 'firebase' && toProvider === 'redis') {
                preview.summary.recommendations.push('Consider Redis clustering for high-volume data');
                preview.summary.recommendations.push('Plan Redis memory usage and persistence strategy');
            } else if (fromProvider === 'redis' && toProvider === 'firebase') {
                preview.summary.recommendations.push('Review Firebase pricing for the expected data volume');
                preview.summary.recommendations.push('Plan Firebase security rules before migration');
            }

        } finally {
            dbService.switchProvider(originalProvider);
        }

        return preview;
    }

    // Test connection and compatibility between providers
    static async testConnections(dbService, providers = ['firebase', 'redis']) {
        const results = {};
        const originalProvider = dbService.getProvider();

        for (const provider of providers) {
            console.log(`Testing ${provider} connection...`);

            try {
                dbService.switchProvider(provider);

                const testResult = await dbService.healthCheck();

                // Test basic operations
                const testData = {
                    testField: 'testValue',
                    timestamp: new Date().toISOString(),
                    number: 123,
                    array: [1, 2, 3],
                    nested: { inner: 'value' }
                };

                // Test create
                const created = await dbService.create(testData, 'migration_test');
                const createdId = created.key || created.id;

                // Test read
                const read = await dbService.read(createdId, 'migration_test');

                // Test update
                const updated = await dbService.update(createdId, { updated: true }, 'migration_test');

                // Test delete
                const deleted = await dbService.delete(createdId, 'migration_test');

                results[provider] = {
                    status: 'success',
                    connection: testResult.status === 'connected',
                    operations: {
                        create: !!created,
                        read: !!read,
                        update: !!updated,
                        delete: deleted
                    },
                    features: {
                        supportsArrays: read && Array.isArray(read.array),
                        supportsNestedObjects: read && typeof read.nested === 'object',
                        preservesDataTypes: read && typeof read.number === 'number'
                    }
                };

            } catch (error) {
                results[provider] = {
                    status: 'error',
                    error: error.message,
                    connection: false
                };
            }
        }

        // Restore original provider
        dbService.switchProvider(originalProvider);

        return results;
    }

    // Generate migration plan
    static generateMigrationPlan(previewResults, options = {}) {
        const {
            batchSize = 100,
            enableProgressTracking = true,
            backupBeforeMigration = true,
            continueOnError = true,
            customTransformations = null
        } = options;

        const plan = {
            metadata: {
                fromProvider: previewResults.fromProvider,
                toProvider: previewResults.toProvider,
                generatedAt: new Date().toISOString(),
                estimatedDuration: this.estimateMigrationTime(previewResults),
                totalRecords: previewResults.summary.totalEstimatedRecords
            },
            configuration: {
                batchSize,
                enableProgressTracking,
                backupBeforeMigration,
                continueOnError,
                transformations: customTransformations || this.getRecommendedTransformation(
                    previewResults.fromProvider,
                    previewResults.toProvider
                )
            },
            phases: [],
            risks: [],
            recommendations: []
        };

        // Phase 1: Pre-migration
        plan.phases.push({
            phase: 'pre-migration',
            description: 'Preparation and validation',
            steps: [
                'Test connections to both databases',
                'Validate source data structure',
                backupBeforeMigration ? 'Create backup of target database' : null,
                'Set up progress tracking',
                'Prepare error handling'
            ].filter(Boolean),
            estimatedTime: '2-5 minutes'
        });

        // Phase 2: Migration
        const tables = Object.keys(previewResults.tables);
        plan.phases.push({
            phase: 'migration',
            description: `Migrate ${tables.length} tables with ${plan.metadata.totalRecords} total records`,
            steps: tables.map(table => {
                const tableData = previewResults.tables[table];
                return `Migrate table '${table}' (${tableData.recordCount} records)`;
            }),
            estimatedTime: plan.metadata.estimatedDuration
        });

        // Phase 3: Post-migration
        plan.phases.push({
            phase: 'post-migration',
            description: 'Validation and cleanup',
            steps: [
                'Validate migrated data',
                'Compare source vs target data',
                'Generate migration report',
                'Clean up temporary data'
            ],
            estimatedTime: '1-3 minutes'
        });

        // Identify risks
        let totalWarnings = 0;
        for (const table of Object.values(previewResults.tables)) {
            totalWarnings += table.warnings.length;
        }

        if (totalWarnings > 0) {
            plan.risks.push(`${totalWarnings} data compatibility warnings detected`);
        }

        if (plan.metadata.totalRecords > 50000) {
            plan.risks.push('Large dataset - migration may take significant time');
        }

        if (previewResults.fromProvider === 'redis' && previewResults.toProvider === 'firebase') {
            plan.risks.push('Redis TTL settings will be lost during migration');
        }

        // Add recommendations
        plan.recommendations = [
            ...previewResults.summary.recommendations,
            'Monitor migration progress closely',
            'Have rollback plan ready',
            'Test with small dataset first'
        ];

        return plan;
    }

    // Estimate migration time
    static estimateMigrationTime(previewResults) {
        const totalRecords = previewResults.summary.totalEstimatedRecords;
        const totalSizeMB = previewResults.summary.estimatedDataSize / (1024 * 1024);

        // Base estimates (records per second)
        const firebaseToRedis = 50; // Firebase to Redis is generally faster
        const redisToFirebase = 30; // Redis to Firebase is slower due to Firebase write limits

        let recordsPerSecond;
        if (previewResults.fromProvider === 'firebase' && previewResults.toProvider === 'redis') {
            recordsPerSecond = firebaseToRedis;
        } else if (previewResults.fromProvider === 'redis' && previewResults.toProvider === 'firebase') {
            recordsPerSecond = redisToFirebase;
        } else {
            recordsPerSecond = 40; // Default estimate
        }

        // Adjust for data size
        if (totalSizeMB > 100) {
            recordsPerSecond *= 0.7; // Slower for large records
        }

        const estimatedSeconds = Math.ceil(totalRecords / recordsPerSecond);

        if (estimatedSeconds < 60) {
            return `${estimatedSeconds} seconds`;
        } else if (estimatedSeconds < 3600) {
            return `${Math.ceil(estimatedSeconds / 60)} minutes`;
        } else {
            return `${Math.ceil(estimatedSeconds / 3600)} hours`;
        }
    }

    // Validate migration plan
    static validateMigrationPlan(plan, dbService) {
        const validation = {
            valid: true,
            errors: [],
            warnings: [],
            recommendations: []
        };

        // Check if providers are available
        const availableProviders = dbService.getAvailableProviders();
        if (!availableProviders.includes(plan.metadata.fromProvider)) {
            validation.errors.push(`Source provider '${plan.metadata.fromProvider}' is not available`);
            validation.valid = false;
        }

        if (!availableProviders.includes(plan.metadata.toProvider)) {
            validation.errors.push(`Target provider '${plan.metadata.toProvider}' is not available`);
            validation.valid = false;
        }

        // Validate configuration
        if (plan.configuration.batchSize < 1 || plan.configuration.batchSize > 1000) {
            validation.warnings.push('Unusual batch size - recommend 50-500 for optimal performance');
        }

        if (plan.metadata.totalRecords > 100000 && plan.configuration.batchSize < 100) {
            validation.warnings.push('Small batch size for large dataset - consider increasing batch size');
        }

        // Provider-specific validations
        if (plan.metadata.toProvider === 'firebase' && plan.metadata.totalRecords > 1000) {
            validation.recommendations.push('Consider Firebase pricing impact for large datasets');
        }

        if (plan.metadata.toProvider === 'redis' && plan.metadata.totalRecords > 10000) {
            validation.recommendations.push('Ensure Redis instance has sufficient memory');
        }

        return validation;
    }

    // Execute migration plan
    static async executeMigrationPlan(dbService, plan, tables) {
        console.log('Executing migration plan...');
        console.log(`From: ${plan.metadata.fromProvider} → To: ${plan.metadata.toProvider}`);
        console.log(`Estimated duration: ${plan.metadata.estimatedDuration}`);

        const options = {
            ...plan.configuration,
            transformData: plan.configuration.transformations,
            onProgress: plan.configuration.enableProgressTracking ? (progress) => {
                if (progress.phase === 'migration') {
                    console.log(`[${progress.currentTable}] ${progress.tableProgress || progress.overallProgress}% complete`);
                }
            } : null
        };

        try {
            const results = await dbService.migrateData(
                plan.metadata.fromProvider,
                plan.metadata.toProvider,
                tables,
                options
            );

            // Add plan metadata to results
            results.planExecuted = {
                plan: plan.metadata,
                configuration: plan.configuration,
                executedAt: new Date().toISOString()
            };

            return results;

        } catch (error) {
            console.error('Migration plan execution failed:', error);
            throw error;
        }
    }
}

export default Migration;
