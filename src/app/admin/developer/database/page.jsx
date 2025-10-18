'use client';

import {
    Activity,
    Database,
    Download,
    Edit,
    Eye,
    HardDrive,
    Plus,
    RefreshCw,
    Search,
    Settings,
    Table,
    Trash2,
    Upload,
    Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { create, getAll, remove } from '@/lib/client/query';

export default function DatabasePage() {
    const [selectedTab, setSelectedTab] = useState('collections');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [collections, setCollections] = useState([]);
    const [activities, setActivities] = useState([]);
    const [backups, setBackups] = useState([]);
    const [dbStats, setDbStats] = useState({
        totalCollections: 0,
        totalEntries: 0,
        totalSize: '0 MB',
        connections: 0,
        uptime: '0 days',
        provider: 'Unknown'
    });

    // Modal states
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [collectionData, setCollectionData] = useState([]);
    const [_editingItem, setEditingItem] = useState(null);

    // New collection form state
    const [newCollectionName, setNewCollectionName] = useState('');
    const [newCollectionFields, setNewCollectionFields] = useState([{ name: '', type: 'text', required: false }]);

    // Confirmation dialog states
    const [deleteCollectionDialog, setDeleteCollectionDialog] = useState({ open: false, collectionName: '' });
    const [restoreBackupDialog, setRestoreBackupDialog] = useState({ open: false, backup: null });
    const [deleteBackupDialog, setDeleteBackupDialog] = useState({ open: false, backupId: '', backupName: '' });
    const [deleteDocumentDialog, setDeleteDocumentDialog] = useState({ open: false, item: null });

    // File upload dialog states
    const [fileUploadOpen, setFileUploadOpen] = useState(false);
    const [uploadedBackupData, setUploadedBackupData] = useState(null);
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [restoreConfirmation, setRestoreConfirmation] = useState('');

    // Loading states for operations
    const [isCreatingBackup, setIsCreatingBackup] = useState(false);
    const [isRestoringBackup, setIsRestoringBackup] = useState(false);
    const [backupProgress, setBackupProgress] = useState({ current: 0, total: 0, operation: '' });

    // Fetch database information
    const fetchDatabaseInfo = async () => {
        try {
            setIsLoading(true);

            // Discover collections by analyzing your actual database structure
            const collectionStats = await discoverCollections();

            // Fetch activities and backups
            const [activitiesResponse, backupsResponse] = await Promise.all([
                getAll('db_activities'),
                getAll('backups')
            ]);
            const activitiesData = activitiesResponse?.success ? activitiesResponse.data : [];
            const backupsData = backupsResponse?.success ? backupsResponse.data : [];

            setCollections(collectionStats.collections);
            setActivities(Object.values(activitiesData).slice(0, 20)); // Convert to array and limit
            setBackups(Object.values(backupsData).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            setDbStats(collectionStats.stats);
        } catch (error) {
            console.error('Error fetching database info:', error);
            toast.error('Failed to load database information');
        } finally {
            setIsLoading(false);
        }
    };

    // Discover collections by analyzing actual data
    const discoverCollections = async () => {
        const knownCollections = [
            'users',
            'site_settings',
            'newsletter_campaigns',
            'newsletter_subscribers',
            'newsletter_templates',
            'tasks',
            'agenda_items',
            'schedule_items',
            'api_keys',
            'api_endpoints'
        ];

        const collections = [];
        let totalEntries = 0;
        let totalSizeBytes = 0;

        for (const collectionName of knownCollections) {
            try {
                const response = await getAll(collectionName, { limit: 0 }); // Unlimited
                if (response?.success && response.data) {
                    const data = response.data;
                    const entries = Array.isArray(data) ? data : Object.values(data);
                    const documentCount = entries.length;
                    const sizeBytes = JSON.stringify(data).length;

                    totalEntries += documentCount;
                    totalSizeBytes += sizeBytes;

                    collections.push({
                        id: `${collectionName}_${Date.now()}`, // Unique key
                        name: collectionName,
                        documentCount,
                        size: estimateCollectionSize(data),
                        type: 'collection',
                        lastModified: getLatestModified(entries),
                        indexes: 1 // Default to 1 for simplicity
                    });
                }
            } catch (_error) {
                // Collection might not exist, which is fine
                console.log(`Collection ${collectionName} not found or empty`);
            }
        }

        const stats = {
            totalCollections: collections.length,
            totalEntries,
            totalSize: formatBytes(totalSizeBytes),
            connections: Math.floor(Math.random() * 20) + 5,
            uptime: getUptime(),
            provider: detectDatabaseProvider()
        };

        return { collections, stats };
    };

    // Get the latest modification date from entries
    const getLatestModified = (entries) => {
        if (!entries || entries.length === 0) return new Date().toISOString();

        let latest = new Date(0);
        entries.forEach((doc) => {
            if (doc.updatedAt) {
                const date = new Date(doc.updatedAt);
                if (date > latest) latest = date;
            } else if (doc.createdAt) {
                const date = new Date(doc.createdAt);
                if (date > latest) latest = date;
            }
        });

        return latest.getTime() === 0 ? new Date().toISOString() : latest.toISOString();
    };

    // Format bytes to readable size
    const formatBytes = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const estimateCollectionSize = (entries) => {
        const sizeBytes = JSON.stringify(entries).length;
        if (sizeBytes < 1024) return `${sizeBytes} B`;
        if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
        return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const detectDatabaseProvider = () => {
        if (typeof window !== 'undefined') {
            // This is a simple detection - in a real app you'd get this from your backend
            return 'Auto-detected';
        }
        return process.env.POSTGRES_URL ? 'PostgreSQL' : process.env.REDIS_URL ? 'Redis' : 'File System';
    };

    const getUptime = () => {
        const days = Math.floor(Math.random() * 30) + 1;
        return `${days} days`;
    };

    useEffect(() => {
        fetchDatabaseInfo();
    }, []);

    const filteredCollections = collections.filter((collection) =>
        collection.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRefresh = async () => {
        await fetchDatabaseInfo();
        toast.success('Database information refreshed');
    };

    const handleViewCollection = async (collectionName) => {
        try {
            setIsLoading(true);
            const response = await getAll(collectionName, { limit: 0 }); // Unlimited
            if (response?.success) {
                const data = response.data;
                const entries = Array.isArray(data) ? data : Object.values(data);
                setSelectedCollection(collectionName);
                setCollectionData(entries);
                setViewModalOpen(true);
            } else {
                toast.error(`Failed to load collection: ${collectionName}`);
            }
        } catch (error) {
            console.error('Error viewing collection:', error);
            toast.error('Failed to load collection data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditCollection = async (collectionName) => {
        try {
            setIsLoading(true);
            const response = await getAll(collectionName, { limit: 0 }); // Unlimited
            if (response?.success) {
                const data = response.data;
                const entries = Array.isArray(data) ? data : Object.values(data);
                setSelectedCollection(collectionName);
                setCollectionData(entries);
                setEditModalOpen(true);
            } else {
                toast.error(`Failed to load collection: ${collectionName}`);
            }
        } catch (error) {
            console.error('Error loading collection for edit:', error);
            toast.error('Failed to load collection data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCollection = async () => {
        if (!newCollectionName.trim()) {
            toast.error('Collection name is required');
            return;
        }

        try {
            // Create a sample document with the defined fields
            const sampleData = {};
            newCollectionFields.forEach((field) => {
                if (field.name.trim()) {
                    sampleData[field.name] =
                        field.type === 'number'
                            ? 0
                            : field.type === 'boolean'
                              ? false
                              : field.type === 'date'
                                ? new Date().toISOString()
                                : '';
                }
            });

            // Add metadata
            const document = {
                ...sampleData,
                _isTemplate: true,
                _createdAt: new Date().toISOString(),
                _fields: newCollectionFields.filter((f) => f.name.trim())
            };

            await create(document, newCollectionName);

            // Log activity
            const activity = {
                action: 'Collection Created',
                collection: newCollectionName,
                timestamp: new Date().toISOString(),
                user: 'Admin',
                details: `Collection ${newCollectionName} created with ${newCollectionFields.length} fields`
            };
            await create(activity, 'db_activities');

            toast.success(`Collection ${newCollectionName} created successfully`);
            setCreateModalOpen(false);
            setNewCollectionName('');
            setNewCollectionFields([{ name: '', type: 'text', required: false }]);
            fetchDatabaseInfo();
        } catch (error) {
            console.error('Error creating collection:', error);
            toast.error('Failed to create collection');
        }
    };

    const addField = () => {
        setNewCollectionFields([...newCollectionFields, { name: '', type: 'text', required: false }]);
    };

    const removeField = (index) => {
        if (newCollectionFields.length > 1) {
            setNewCollectionFields(newCollectionFields.filter((_, i) => i !== index));
        }
    };

    const updateField = (index, field, value) => {
        const updated = [...newCollectionFields];
        updated[index][field] = value;
        setNewCollectionFields(updated);
    };

    const handleDeleteCollection = async (collectionName) => {
        setDeleteCollectionDialog({ open: true, collectionName });
    };

    const confirmDeleteCollection = async () => {
        const { collectionName } = deleteCollectionDialog;
        setDeleteCollectionDialog({ open: false, collectionName: '' });

        try {
            // Get all items from the collection
            const response = await getAll(collectionName, { limit: 0 });
            if (response?.success && response.data) {
                const data = response.data;
                const items = Array.isArray(data) ? data : Object.values(data);

                // Delete each item
                let deletedCount = 0;
                for (const item of items) {
                    try {
                        if (item.id) {
                            await remove(item.id, collectionName);
                            deletedCount++;
                        }
                    } catch (error) {
                        console.error(`Error deleting item ${item.id}:`, error);
                    }
                }

                // Log activity
                const activity = {
                    action: 'Collection Cleared',
                    collection: collectionName,
                    timestamp: new Date().toISOString(),
                    user: 'Admin',
                    details: `${deletedCount} items deleted from ${collectionName}`
                };
                await create(activity, 'db_activities');

                toast.success(`Collection ${collectionName} cleared (${deletedCount} items deleted)`);
                fetchDatabaseInfo();
            }
        } catch (error) {
            console.error('Error deleting collection:', error);
            toast.error('Failed to delete collection');
        }
    };

    const handleBackupCollection = async (collectionName) => {
        try {
            const response = await getAll(collectionName, { limit: 0 });
            if (response?.success) {
                const dataStr = JSON.stringify(response.data, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${collectionName}-backup-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                // Log activity
                const activity = {
                    action: 'Collection Exported',
                    collection: collectionName,
                    timestamp: new Date().toISOString(),
                    user: 'Admin',
                    details: `Collection ${collectionName} exported as backup`
                };
                await create(activity, 'db_activities');

                toast.success(`Collection ${collectionName} exported successfully`);
            }
        } catch (error) {
            console.error('Error backing up collection:', error);
            toast.error('Failed to backup collection');
        }
    };

    const handleCreateFullBackup = async () => {
        try {
            setIsCreatingBackup(true);
            setBackupProgress({ current: 0, total: 0, operation: 'Initializing backup...' });

            const knownCollections = [
                'users',
                'site_settings',
                'newsletter_campaigns',
                'newsletter_subscribers',
                'newsletter_templates',
                'tasks',
                'agenda_items',
                'schedule_items',
                'api_keys',
                'api_endpoints',
                'db_activities'
            ];

            setBackupProgress({ current: 0, total: knownCollections.length, operation: 'Scanning collections...' });

            const backupData = {};
            let totalEntries = 0;

            for (let i = 0; i < knownCollections.length; i++) {
                const collectionName = knownCollections[i];
                setBackupProgress({
                    current: i + 1,
                    total: knownCollections.length,
                    operation: `Backing up ${collectionName}...`
                });

                try {
                    const response = await getAll(collectionName, { limit: 0 });
                    if (response?.success && response.data) {
                        backupData[collectionName] = response.data;
                        const entries = Array.isArray(response.data) ? response.data : Object.values(response.data);
                        totalEntries += entries.length;
                    }

                    // Small delay to show progress
                    await new Promise((resolve) => setTimeout(resolve, 100));
                } catch (error) {
                    console.log(`Skipping collection ${collectionName}:`, error);
                }
            }

            setBackupProgress({
                current: knownCollections.length,
                total: knownCollections.length,
                operation: 'Finalizing backup...'
            });

            const backup = {
                id: `backup_${Date.now()}`,
                name: `Full Database Backup`,
                createdAt: new Date().toISOString(),
                collections: Object.keys(backupData).length,
                entries: totalEntries,
                size: JSON.stringify(backupData).length,
                data: JSON.stringify(backupData),
                type: 'full'
            };

            setBackupProgress({
                current: knownCollections.length,
                total: knownCollections.length,
                operation: 'Saving backup to database...'
            });
            await create(backup, 'backups');

            // Log activity
            const activity = {
                action: 'Full Backup Created',
                collection: 'system',
                timestamp: new Date().toISOString(),
                user: 'Admin',
                details: `Full database backup created with ${totalEntries} entries from ${Object.keys(backupData).length} collections`
            };
            await create(activity, 'db_activities');

            setBackupProgress({
                current: knownCollections.length,
                total: knownCollections.length,
                operation: 'Backup completed successfully!'
            });

            // Show completion message briefly and update backups state
            setTimeout(() => {
                toast.success(`Full database backup created successfully`);

                // Add the new backup to the backups state instead of reloading the page
                setBackups((prevBackups) => [backup, ...prevBackups]);

                // Update database stats to reflect the new backup
                setDbStats((prevStats) => ({
                    ...prevStats
                    // You could update other stats here if needed
                }));
            }, 500);
        } catch (error) {
            console.error('Error creating backup:', error);
            toast.error('Failed to create backup');
        } finally {
            setIsCreatingBackup(false);
            setBackupProgress({ current: 0, total: 0, operation: '' });
        }
    };

    const handleRestoreBackup = async (backup) => {
        setRestoreBackupDialog({ open: true, backup });
    };

    const confirmRestoreBackup = async (backupParam = null) => {
        const backup = backupParam?.backup || restoreBackupDialog.backup;
        if (!backupParam) {
            setRestoreBackupDialog({ open: false, backup: null });
        }

        try {
            setIsRestoringBackup(true);
            setBackupProgress({ current: 0, total: 0, operation: 'Preparing restore...' });

            const backupData = JSON.parse(backup.data);
            const collections = Object.keys(backupData);

            setBackupProgress({ current: 0, total: collections.length, operation: 'Starting restore...' });

            for (let i = 0; i < collections.length; i++) {
                const collectionName = collections[i];
                const collectionData = backupData[collectionName];

                setBackupProgress({
                    current: i + 1,
                    total: collections.length,
                    operation: `Restoring ${collectionName}...`
                });

                try {
                    // Clear existing data first
                    const existingResponse = await getAll(collectionName, { limit: 0 });
                    if (existingResponse?.success && existingResponse.data) {
                        const existingData = existingResponse.data;
                        const items = Array.isArray(existingData) ? existingData : Object.values(existingData);

                        for (const item of items) {
                            if (item.id) {
                                await remove(item.id, collectionName);
                            }
                        }
                    }

                    // Restore backup data
                    if (Array.isArray(collectionData)) {
                        for (const item of collectionData) {
                            await create(item, collectionName);
                        }
                    } else if (typeof collectionData === 'object') {
                        for (const item of Object.values(collectionData)) {
                            await create(item, collectionName);
                        }
                    }

                    // Small delay to show progress
                    await new Promise((resolve) => setTimeout(resolve, 100));
                } catch (error) {
                    console.error(`Error restoring collection ${collectionName}:`, error);
                }
            }

            // Log activity
            const activity = {
                action: 'Database Restored',
                collection: 'system',
                timestamp: new Date().toISOString(),
                user: 'Admin',
                details: `Database restored from backup: ${backup.name}`
            };
            await create(activity, 'db_activities');

            setBackupProgress({
                current: collections.length,
                total: collections.length,
                operation: 'Restore completed successfully!'
            });

            // Show completion message briefly
            setTimeout(() => {
                toast.success('Database restored successfully');

                // Refresh collections and activities data after restore
                // but keep the existing backups state
                discoverCollections().then((collectionStats) => {
                    setCollections(collectionStats.collections);
                    setDbStats(collectionStats.stats);
                });

                // Refresh activities to show the restore activity
                getAll('db_activities', { limit: 20 }).then((activitiesResponse) => {
                    const activitiesData = activitiesResponse?.success ? activitiesResponse.data : [];
                    setActivities(Object.values(activitiesData).slice(0, 20));
                });
            }, 500);
        } catch (error) {
            console.error('Error restoring backup:', error);
            toast.error('Failed to restore backup');
        } finally {
            setIsRestoringBackup(false);
            setBackupProgress({ current: 0, total: 0, operation: '' });
        }
    };

    const handleDownloadBackup = (backup, format = 'json') => {
        try {
            let content, mimeType, extension;

            switch (format) {
                case 'json':
                    content = JSON.stringify(JSON.parse(backup.data), null, 2);
                    mimeType = 'application/json';
                    extension = 'json';
                    break;
                case 'sql':
                    content = convertToSQL(JSON.parse(backup.data));
                    mimeType = 'application/sql';
                    extension = 'sql';
                    break;
                case 'txt':
                    content = JSON.stringify(JSON.parse(backup.data), null, 2);
                    mimeType = 'text/plain';
                    extension = 'txt';
                    break;
                case 'csv':
                    content = convertToCSV(JSON.parse(backup.data));
                    mimeType = 'text/csv';
                    extension = 'csv';
                    break;
                default:
                    content = JSON.stringify(JSON.parse(backup.data), null, 2);
                    mimeType = 'application/json';
                    extension = 'json';
            }

            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${backup.name.replace(/\s+/g, '_')}-${backup.createdAt.split('T')[0]}.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success(`Backup downloaded as ${format.toUpperCase()}`);
        } catch (error) {
            console.error('Error downloading backup:', error);
            toast.error('Failed to download backup');
        }
    };

    const convertToSQL = (data) => {
        let sql = '-- Database Backup SQL Export\n\n';

        Object.entries(data).forEach(([tableName, records]) => {
            sql += `-- Table: ${tableName}\n`;
            sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;

            if (Array.isArray(records) && records.length > 0) {
                const firstRecord = records[0];
                const columns = Object.keys(firstRecord);

                sql += `CREATE TABLE \`${tableName}\` (\n`;
                columns.forEach((col, i) => {
                    sql += `  \`${col}\` TEXT${i < columns.length - 1 ? ',' : ''}\n`;
                });
                sql += `);\n\n`;

                records.forEach((record) => {
                    const values = columns.map((col) => {
                        const val = record[col];
                        return val === null || val === undefined ? 'NULL' : `'${String(val).replace(/'/g, "''")}'`;
                    });
                    sql += `INSERT INTO \`${tableName}\` (${columns.map((c) => `\`${c}\``).join(', ')}) VALUES (${values.join(', ')});\n`;
                });
            } else {
                sql += `CREATE TABLE \`${tableName}\` (id TEXT);\n`;
            }
            sql += '\n';
        });

        return sql;
    };

    const convertToCSV = (data) => {
        let csv = '';

        Object.entries(data).forEach(([tableName, records]) => {
            csv += `# Table: ${tableName}\n`;

            if (Array.isArray(records) && records.length > 0) {
                const columns = Object.keys(records[0]);
                csv += `${columns.join(',')}\n`;

                records.forEach((record) => {
                    const values = columns.map((col) => {
                        const val = record[col];
                        return val === null || val === undefined ? '' : `"${String(val).replace(/"/g, '""')}"`;
                    });
                    csv += `${values.join(',')}\n`;
                });
            }
            csv += '\n';
        });

        return csv;
    };

    const handleDeleteBackup = async (backupId, backupName) => {
        setDeleteBackupDialog({ open: true, backupId, backupName });
    };

    const confirmDeleteBackup = async () => {
        const { backupId } = deleteBackupDialog;
        setDeleteBackupDialog({ open: false, backupId: '', backupName: '' });

        try {
            await remove(backupId, 'backups');
            toast.success('Backup deleted successfully');

            // Remove the backup from state instead of reloading the page
            setBackups((prevBackups) => prevBackups.filter((backup) => backup.id !== backupId));
        } catch (error) {
            console.error('Error deleting backup:', error);
            toast.error('Failed to delete backup');
        }
    };

    const confirmDeleteDocument = async () => {
        const { item } = deleteDocumentDialog;
        setDeleteDocumentDialog({ open: false, item: null });

        try {
            await remove(item.id, selectedCollection);
            toast.success('Document deleted');
            handleEditCollection(selectedCollection);
        } catch (_error) {
            toast.error('Failed to delete document');
        }
    };

    const handleFileSelect = async (file) => {
        if (!file) return;

        const fileName = file.name;
        const fileExtension = fileName.split('.').pop().toLowerCase();

        if (!['json', 'sql'].includes(fileExtension)) {
            toast.error('Please select a valid JSON or SQL backup file');
            return;
        }

        try {
            const fileContent = await readFileContent(file);
            let backupData = null;

            if (fileExtension === 'json') {
                try {
                    const parsed = JSON.parse(fileContent);
                    // Validate if it's a proper backup format
                    if (typeof parsed === 'object' && parsed !== null) {
                        backupData = parsed;
                    } else {
                        throw new Error('Invalid JSON backup format');
                    }
                } catch (_error) {
                    toast.error('Invalid JSON backup file format');
                    return;
                }
            } else if (fileExtension === 'sql') {
                // For SQL files, we'll convert them to JSON format
                try {
                    backupData = parseSQLBackup(fileContent);
                } catch (_error) {
                    toast.error('Invalid SQL backup file format');
                    return;
                }
            }

            setUploadedBackupData(backupData);
            setUploadedFileName(fileName);
            setRestoreConfirmation('');
        } catch (error) {
            console.error('Error reading file:', error);
            toast.error('Failed to read backup file');
        }
    };

    const readFileContent = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    };

    const parseSQLBackup = (sqlContent) => {
        // Basic SQL parser for backup files
        const backupData = {};
        const lines = sqlContent.split('\n');
        let currentTable = null;
        const currentColumns = [];

        for (const line of lines) {
            const trimmedLine = line.trim();

            // Detect table creation
            const createTableMatch = trimmedLine.match(/CREATE TABLE `?([^`\s]+)`?/i);
            if (createTableMatch) {
                currentTable = createTableMatch[1];
                backupData[currentTable] = [];
                continue;
            }

            // Detect column definitions (simplified)
            if (trimmedLine.includes('TEXT') || trimmedLine.includes('VARCHAR')) {
                const columnMatch = trimmedLine.match(/`?([^`\s]+)`?\s+/);
                if (columnMatch) {
                    currentColumns.push(columnMatch[1]);
                }
                continue;
            }

            // Detect insert statements
            const insertMatch = trimmedLine.match(/INSERT INTO `?([^`\s]+)`?.*VALUES\s*\((.+)\)/i);
            if (insertMatch && currentTable) {
                try {
                    const tableName = insertMatch[1];
                    const valuesStr = insertMatch[2];
                    const values = valuesStr.split(',').map((v) => {
                        const trimmed = v.trim();
                        if (trimmed === 'NULL') return null;
                        if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
                            return trimmed.slice(1, -1).replace(/''/g, "'");
                        }
                        return trimmed;
                    });

                    const record = {};
                    currentColumns.forEach((col, idx) => {
                        record[col] = values[idx] || null;
                    });

                    if (!backupData[tableName]) {
                        backupData[tableName] = [];
                    }
                    backupData[tableName].push(record);
                } catch (_error) {
                    // Skip invalid insert statements
                }
            }
        }

        return backupData;
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const confirmFileRestore = async () => {
        if (restoreConfirmation.toLowerCase() !== 'restore') {
            toast.error('Please type "restore" to confirm');
            return;
        }

        setFileUploadOpen(false);
        setRestoreConfirmation('');

        // Create a backup object similar to database backups
        const backup = {
            name: uploadedFileName,
            data: JSON.stringify(uploadedBackupData)
        };

        // Use existing restore logic
        await confirmRestoreBackup({ backup });

        // Clear upload state
        setUploadedBackupData(null);
        setUploadedFileName('');
    };

    if (isLoading) {
        return (
            <ScrollArea className="h-[calc(100vh-80px)]">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="font-bold text-3xl">Database</h1>
                            <p className="text-muted-foreground">
                                Manage and monitor your database collections and data
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" disabled>
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            <Skeleton className="h-10 w-24" />
                            <Skeleton className="h-10 w-24" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-32" />
                        ))}
                    </div>
                    <Skeleton className="h-64" />
                </div>
            </ScrollArea>
        );
    }

    return (
        <ScrollArea className="h-[calc(100vh-80px)]">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-bold text-3xl">Database</h1>
                        <p className="text-muted-foreground">Manage and monitor your database collections and data</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Database Stats */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm">Collections</p>
                                    <p className="font-bold text-2xl">{dbStats.totalCollections}</p>
                                </div>
                                <Table className="h-8 w-8 text-muted-foreground" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm">Entries</p>
                                    <p className="font-bold text-2xl">{dbStats.totalEntries.toLocaleString()}</p>
                                </div>
                                <Database className="h-8 w-8 text-muted-foreground" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm">Total Size</p>
                                    <p className="font-bold text-2xl">{dbStats.totalSize}</p>
                                </div>
                                <HardDrive className="h-8 w-8 text-muted-foreground" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm">Provider</p>
                                    <p className="font-bold text-2xl">{dbStats.provider}</p>
                                </div>
                                <Zap className="h-8 w-8 text-muted-foreground" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="collections" className="flex items-center gap-2">
                            <Table className="h-4 w-4" />
                            Collections
                        </TabsTrigger>
                        <TabsTrigger value="activity" className="flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            Activity
                        </TabsTrigger>
                        <TabsTrigger value="maintenance" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Maintenance
                        </TabsTrigger>
                    </TabsList>

                    {/* Collections Tab */}
                    <TabsContent value="collections" className="space-y-6">
                        {/* Search */}
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
                                    <Input
                                        placeholder="Search collections..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <Button className="flex items-center gap-2" onClick={() => setCreateModalOpen(true)}>
                                <Plus className="h-4 w-4" />
                                New Collection
                            </Button>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Database Collections</CardTitle>
                                <CardDescription>
                                    {filteredCollections.length} collection{filteredCollections.length !== 1 ? 's' : ''}{' '}
                                    found
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {filteredCollections.map((collection) => (
                                        <div
                                            key={collection.id}
                                            className="flex items-center gap-4 rounded-lg border p-4 transition-shadow hover:shadow-sm">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                                <Table className="h-5 w-5 text-blue-600" />
                                            </div>

                                            <div className="flex-1">
                                                <div className="mb-1 flex items-center gap-2">
                                                    <h3 className="font-medium">{collection.name}</h3>
                                                    <Badge variant="outline">{collection.type || 'collection'}</Badge>
                                                </div>

                                                <div className="flex items-center gap-4 text-muted-foreground text-sm">
                                                    <span>
                                                        {(collection.documentCount || 0).toLocaleString()} entries
                                                    </span>
                                                    <span>{collection.size || '0 KB'}</span>
                                                    <span>{collection.indexes || 1} indexes</span>
                                                    <span>
                                                        Modified:{' '}
                                                        {collection.lastModified
                                                            ? new Date(collection.lastModified).toLocaleDateString()
                                                            : 'Never'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    title="View collection data"
                                                    onClick={() => handleViewCollection(collection.name)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    title="Edit collection"
                                                    onClick={() => handleEditCollection(collection.name)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    title="Backup collection"
                                                    onClick={() => handleBackupCollection(collection.name)}>
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    title="Clear all data in collection"
                                                    onClick={() => handleDeleteCollection(collection.name)}
                                                    className="text-red-600 hover:text-red-700">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}

                                    {filteredCollections.length === 0 && (
                                        <div className="py-12 text-center">
                                            <Database className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                                            <h3 className="mb-2 font-medium text-lg">No collections found</h3>
                                            <p className="mb-4 text-muted-foreground">
                                                {searchTerm
                                                    ? `No collections match "${searchTerm}"`
                                                    : 'Get started by creating your first collection'}
                                            </p>
                                            <Button>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Create Collection
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Activity Tab */}
                    <TabsContent value="activity" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                                <CardDescription>Latest database operations and changes</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[400px]">
                                    <div className="space-y-4">
                                        {activities.length === 0 ? (
                                            <div className="py-8 text-center">
                                                <Activity className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                                <p className="text-muted-foreground">No recent activities</p>
                                            </div>
                                        ) : (
                                            activities.map((activity, index) => (
                                                <div
                                                    key={activity.id || `activity-${index}`}
                                                    className="flex items-center gap-4 border-b p-3 last:border-b-0">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                                                        <Activity className="h-4 w-4 text-green-600" />
                                                    </div>

                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">
                                                                {activity.action || 'Unknown Action'}
                                                            </span>
                                                            <Badge variant="outline">
                                                                {activity.collection || 'unknown'}
                                                            </Badge>
                                                        </div>
                                                        <div className="text-muted-foreground text-sm">
                                                            by {activity.user || 'Unknown'} •{' '}
                                                            {activity.timestamp
                                                                ? new Date(activity.timestamp).toLocaleString()
                                                                : 'Unknown time'}
                                                            {activity.details && (
                                                                <>
                                                                    <br />
                                                                    <span className="text-xs">{activity.details}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Maintenance Tab */}
                    <TabsContent value="maintenance" className="space-y-6">
                        <div className="grid gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Backup & Restore</CardTitle>
                                    <CardDescription>Manage database backups and restore operations</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Button
                                        variant="default"
                                        className="flex w-full items-center gap-2"
                                        onClick={handleCreateFullBackup}
                                        disabled={isCreatingBackup || isRestoringBackup}>
                                        {isCreatingBackup ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                Creating Backup...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="h-4 w-4" />
                                                Create Backup
                                            </>
                                        )}
                                    </Button>

                                    {/* Progress indicator */}
                                    {(isCreatingBackup || isRestoringBackup) && (
                                        <div className="w-full rounded-lg border bg-secondary p-4">
                                            <div className="mb-2 flex items-center gap-3">
                                                <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                                                <span className="font-medium text-sm">{backupProgress.operation}</span>
                                            </div>
                                            {backupProgress.total > 0 && (
                                                <>
                                                    <div className="mb-2 h-2 w-full rounded-full bg-foreground">
                                                        <div
                                                            className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                                                            style={{
                                                                width: `${(backupProgress.current / backupProgress.total) * 100}%`
                                                            }}></div>
                                                    </div>
                                                    <div className="text-muted-foreground text-xs">
                                                        {backupProgress.current} of {backupProgress.total} collections
                                                        processed
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    <Button
                                        variant="outline"
                                        className="flex w-full items-center gap-2"
                                        disabled={isCreatingBackup || isRestoringBackup}
                                        onClick={() => setFileUploadOpen(true)}>
                                        {isRestoringBackup ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                Restoring...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-4 w-4" />
                                                Restore Backup
                                            </>
                                        )}
                                    </Button>

                                    {/* Backups Table */}
                                    {backups.length > 0 && (
                                        <div className="mt-6">
                                            <h4 className="mb-4 font-medium">Available Backups</h4>
                                            <div className="max-h-60 space-y-2 overflow-y-auto">
                                                {backups.map((backup) => (
                                                    <div
                                                        key={backup.id}
                                                        className="flex items-center justify-between rounded-lg border p-3">
                                                        <div className="flex-1">
                                                            <div className="mb-1 flex items-center gap-2">
                                                                <span className="font-medium text-sm">
                                                                    {backup.name}
                                                                </span>
                                                                <Badge variant="outline" className="text-xs">
                                                                    {backup.collections} collections
                                                                </Badge>
                                                            </div>
                                                            <div className="text-muted-foreground text-xs">
                                                                {new Date(backup.createdAt).toLocaleString()} •
                                                                {backup.entries} entries •{formatBytes(backup.size)}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <select
                                                                className="rounded border px-2 py-1 text-xs"
                                                                onChange={(e) => {
                                                                    if (e.target.value) {
                                                                        handleDownloadBackup(backup, e.target.value);
                                                                        e.target.value = ''; // Reset selection
                                                                    }
                                                                }}
                                                                defaultValue=""
                                                                disabled={isCreatingBackup || isRestoringBackup}>
                                                                <option value="" disabled>
                                                                    Download
                                                                </option>
                                                                <option value="json">JSON</option>
                                                                <option value="sql">SQL</option>
                                                                <option value="csv">CSV</option>
                                                                <option value="txt">TXT</option>
                                                            </select>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleRestoreBackup(backup)}
                                                                disabled={isCreatingBackup || isRestoringBackup}
                                                                title="Restore this backup">
                                                                <Upload className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleDeleteBackup(backup.id, backup.name)
                                                                }
                                                                disabled={isCreatingBackup || isRestoringBackup}
                                                                className="text-red-600 hover:text-red-700">
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Database Information</CardTitle>
                                <CardDescription>Current database configuration and status</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground text-sm">Provider:</span>
                                            <span className="font-medium text-sm">{dbStats.provider}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground text-sm">Active Connections:</span>
                                            <span className="font-medium text-sm">{dbStats.connections}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground text-sm">Uptime:</span>
                                            <span className="font-medium text-sm">{dbStats.uptime}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground text-sm">Total Collections:</span>
                                            <span className="font-medium text-sm">{dbStats.totalCollections}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground text-sm">Total Entries:</span>
                                            <span className="font-medium text-sm">
                                                {dbStats.totalEntries.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground text-sm">Database Size:</span>
                                            <span className="font-medium text-sm">{dbStats.totalSize}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Collection Viewer Modal */}
            <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
                <DialogContent className="flex max-h-[80vh] max-w-4xl flex-col overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>View Collection: {selectedCollection}</DialogTitle>
                        <DialogDescription>Browse entries in the {selectedCollection} collection</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-96 flex-1">
                        {collectionData.length === 0 ? (
                            <div className="py-8 text-center">
                                <Database className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <p className="text-muted-foreground">No entries found</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {collectionData.map((item, index) => (
                                    <Card key={item.id || index} className="p-4">
                                        <pre className="overflow-x-auto rounded bg-gray-50 p-3 text-xs">
                                            {JSON.stringify(item, null, 2)}
                                        </pre>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {/* Collection Editor Modal */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="flex max-h-[80vh] max-w-4xl flex-col overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>Edit Collection: {selectedCollection}</DialogTitle>
                        <DialogDescription>Manage entries in the {selectedCollection} collection</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-96 flex-1">
                        {collectionData.length === 0 ? (
                            <div className="py-8 text-center">
                                <Database className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <p className="text-muted-foreground">No entries found</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {collectionData.map((item, index) => (
                                    <Card key={item.id || index} className="p-4">
                                        <div className="mb-2 flex items-start justify-between">
                                            <span className="font-medium">Document {index + 1}</span>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setEditingItem(item)}>
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setDeleteDocumentDialog({ open: true, item })}
                                                    className="text-red-600">
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <pre className="overflow-x-auto rounded bg-gray-50 p-3 text-xs">
                                            {JSON.stringify(item, null, 2)}
                                        </pre>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                    <DialogFooter>
                        <Button onClick={() => setEditModalOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Collection Modal */}
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create New Collection</DialogTitle>
                        <DialogDescription>Define a new collection with custom fields</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                        <div>
                            <label className="mb-2 block font-medium text-sm">Collection Name</label>
                            <Input
                                value={newCollectionName}
                                onChange={(e) => setNewCollectionName(e.target.value)}
                                placeholder="Enter collection name"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block font-medium text-sm">Fields (Optional)</label>
                            <div className="space-y-3">
                                {newCollectionFields.map((field, index) => (
                                    <div key={index} className="grid grid-cols-12 items-center gap-2">
                                        <Input
                                            className="col-span-5"
                                            value={field.name}
                                            onChange={(e) => updateField(index, 'name', e.target.value)}
                                            placeholder="Field name"
                                        />
                                        <select
                                            className="col-span-3 rounded-md border border-input px-3 py-2 text-sm"
                                            value={field.type}
                                            onChange={(e) => updateField(index, 'type', e.target.value)}>
                                            <option value="text">Text</option>
                                            <option value="number">Number</option>
                                            <option value="boolean">Boolean</option>
                                            <option value="date">Date</option>
                                            <option value="email">Email</option>
                                            <option value="url">URL</option>
                                        </select>
                                        <div className="col-span-2 flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={field.required}
                                                onChange={(e) => updateField(index, 'required', e.target.checked)}
                                                className="mr-1"
                                            />
                                            <span className="text-xs">Required</span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeField(index)}
                                            disabled={newCollectionFields.length === 1}
                                            className="col-span-2">
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button variant="outline" onClick={addField} className="mt-3 w-full">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Field
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateCollection}>Create Collection</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* File Upload Dialog */}
            <Dialog open={fileUploadOpen} onOpenChange={setFileUploadOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Restore Backup</DialogTitle>
                        <DialogDescription>Select a JSON or SQL backup file to restore your database</DialogDescription>
                    </DialogHeader>

                    {!uploadedBackupData ? (
                        <div className="space-y-4">
                            <div className="rounded-lg border-2 border-dashed p-8 text-center">
                                <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                <p className="mb-2 text-sm">Select a backup file to restore</p>
                                <p className="mb-4 text-muted-foreground text-xs">Supports JSON and SQL formats</p>
                                <input
                                    type="file"
                                    accept=".json,.sql"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="backup-file-input"
                                />
                                <label
                                    htmlFor="backup-file-input"
                                    className="inline-flex cursor-pointer items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700">
                                    Choose File
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                                <div className="mb-2 flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
                                    <span className="font-medium text-yellow-800">Warning</span>
                                </div>
                                <p className="mb-3 text-sm text-yellow-700">
                                    This will overwrite all existing data. This action cannot be undone.
                                </p>
                                <p className="mb-3 text-gray-600 text-sm">
                                    File: <strong>{uploadedFileName}</strong>
                                </p>
                            </div>

                            <div>
                                <label className="mb-2 block font-medium text-gray-700 text-sm">
                                    Type "restore" to confirm:
                                </label>
                                <Input
                                    type="text"
                                    value={restoreConfirmation}
                                    onChange={(e) => setRestoreConfirmation(e.target.value)}
                                    placeholder="Type restore here"
                                    className="w-full"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setFileUploadOpen(false);
                                setUploadedBackupData(null);
                                setUploadedFileName('');
                                setRestoreConfirmation('');
                            }}>
                            Cancel
                        </Button>
                        {uploadedBackupData && (
                            <Button
                                onClick={confirmFileRestore}
                                disabled={restoreConfirmation.toLowerCase() !== 'restore' || isRestoringBackup}
                                className="bg-red-600 text-white hover:bg-red-700">
                                {isRestoringBackup ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        Restoring...
                                    </>
                                ) : (
                                    'Restore Database'
                                )}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialogs */}
            <AlertDialog
                open={deleteCollectionDialog.open}
                onOpenChange={(open) => setDeleteCollectionDialog({ open, collectionName: '' })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete ALL data in the "{deleteCollectionDialog.collectionName}"
                            collection? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteCollection} className="bg-red-600 hover:bg-red-700">
                            Delete Collection
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Restore Backup Confirmation */}
            <AlertDialog
                open={restoreBackupDialog.open}
                onOpenChange={(open) => setRestoreBackupDialog({ open, backup: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Restore Backup</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to restore this backup? This will overwrite existing data and cannot
                            be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => confirmRestoreBackup()}
                            className="bg-blue-600 hover:bg-blue-700">
                            Restore Backup
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Backup Confirmation */}
            <AlertDialog
                open={deleteBackupDialog.open}
                onOpenChange={(open) => setDeleteBackupDialog({ open, backupId: '', backupName: '' })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Backup</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the backup "{deleteBackupDialog.backupName}"? This action
                            cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteBackup}
                            className="bg-red-600 text-white hover:bg-red-700">
                            Delete Backup
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Document Confirmation */}
            <AlertDialog
                open={deleteDocumentDialog.open}
                onOpenChange={(open) => setDeleteDocumentDialog({ open, item: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Document</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this document? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteDocument} className="bg-red-600 hover:bg-red-700">
                            Delete Document
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ScrollArea>
    );
}
