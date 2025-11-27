'use client';

import {
    Activity,
    AlertTriangle,
    Clock,
    Cpu,
    Database,
    HardDrive,
    MemoryStick,
    Monitor,
    RefreshCw,
    Server,
    Settings,
    Trash2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    getServerInfoAction,
    clearSystemCacheAction,
    getDatabaseStatsAction,
    performSystemCleanupAction
} from '@/lib/server/admin.js';
import AdminHeader from '../../components/AdminHeader';

export default function MaintenancePage() {
    const [serverInfo, setServerInfo] = useState(null);
    const [databaseStats, setDatabaseStats] = useState(null);
    const [loading, setLoading] = useState({
        serverInfo: true,
        database: true,
        cache: false,
        cleanup: false
    });

    // Fetch server information using server action
    const fetchServerInfo = async () => {
        setLoading((prev) => ({ ...prev, serverInfo: true }));
        try {
            const result = await getServerInfoAction();
            if (result?.success) {
                setServerInfo(result.data);
            } else {
                toast.error(result?.error || 'Failed to fetch server information');
            }
        } catch (error) {
            console.error('Error fetching server info:', error);
            toast.error('Failed to fetch server information');
        } finally {
            setLoading((prev) => ({ ...prev, serverInfo: false }));
        }
    };

    // Fetch database statistics using server action
    const fetchDatabaseStats = async () => {
        setLoading((prev) => ({ ...prev, database: true }));
        try {
            const result = await getDatabaseStatsAction();
            if (result?.success) {
                setDatabaseStats(result.data);
            } else {
                toast.error(result?.error || 'Failed to fetch database statistics');
            }
        } catch (error) {
            console.error('Error fetching database stats:', error);
            toast.error('Failed to fetch database statistics');
        } finally {
            setLoading((prev) => ({ ...prev, database: false }));
        }
    };

    // Clear cache using server action
    const clearCache = async (action) => {
        setLoading((prev) => ({ ...prev, cache: true }));
        try {
            const result = await clearSystemCacheAction(action);
            if (result?.success) {
                toast.success(result.message || 'Cache cleared successfully');
                if (result.data?.errors && result.data.errors.length > 0) {
                    toast.warning(`Some operations had errors: ${result.data.errors.join(', ')}`);
                }
            } else {
                toast.error(result?.error || 'Failed to clear cache');
            }
        } catch (error) {
            console.error('Error clearing cache:', error);
            toast.error('Failed to clear cache');
        } finally {
            setLoading((prev) => ({ ...prev, cache: false }));
        }
    };

    // Perform system cleanup using server action
    const performCleanup = async (options = {}) => {
        setLoading((prev) => ({ ...prev, cleanup: true }));
        try {
            const result = await performSystemCleanupAction(options);
            if (result?.success) {
                toast.success(result.message || 'System cleanup completed');
                if (result.data?.errors && result.data.errors.length > 0) {
                    toast.warning(`Some cleanup operations had issues: ${result.data.errors.join(', ')}`);
                }
                // Refresh data after cleanup
                await Promise.all([fetchServerInfo(), fetchDatabaseStats()]);
            } else {
                toast.error(result?.error || 'Failed to perform system cleanup');
            }
        } catch (error) {
            console.error('Error during system cleanup:', error);
            toast.error('Failed to perform system cleanup');
        } finally {
            setLoading((prev) => ({ ...prev, cleanup: false }));
        }
    };

    // Format bytes
    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
    };

    // Format uptime
    const formatUptime = (seconds) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    };

    // Refresh all data
    const refreshAll = async () => {
        await Promise.all([fetchServerInfo(), fetchDatabaseStats()]);
    };

    useEffect(() => {
        refreshAll();
    }, []);

    return (
        <div className="space-y-6">
            <AdminHeader 
                title="System Maintenance" 
                description="Monitor system health and manage database operations"
                actions={
                    <Button 
                        variant="outline" 
                        onClick={refreshAll}
                        disabled={loading.serverInfo || loading.database}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${(loading.serverInfo || loading.database) ? 'animate-spin' : ''}`} />
                        Refresh All
                    </Button>
                }
            />

            <Tabs defaultValue="system" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="system">System Info</TabsTrigger>
                    <TabsTrigger value="database">Database</TabsTrigger>
                    <TabsTrigger value="cache">Cache Management</TabsTrigger>
                    <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                </TabsList>

                <TabsContent value="system" className="space-y-6">
                    <SystemInfoTab
                        serverInfo={serverInfo}
                        loading={loading}
                        onRefresh={fetchServerInfo}
                        formatBytes={formatBytes}
                        formatUptime={formatUptime}
                    />
                </TabsContent>

                <TabsContent value="database" className="space-y-6">
                    <DatabaseTab
                        databaseStats={databaseStats}
                        loading={loading}
                        onRefresh={fetchDatabaseStats}
                    />
                </TabsContent>

                <TabsContent value="cache" className="space-y-6">
                    <CacheManagementTab
                        loading={loading}
                        onClearCache={clearCache}
                    />
                </TabsContent>

                <TabsContent value="maintenance" className="space-y-6">
                    <MaintenanceTab
                        loading={loading}
                        onPerformCleanup={performCleanup}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// System Information Tab Component
function SystemInfoTab({ serverInfo, loading, onRefresh, formatBytes, formatUptime }) {
    if (loading.serverInfo) {
        return <ServerInfoSkeleton />;
    }

    if (!serverInfo) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center p-8">
                    <div className="text-center">
                        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">Failed to load server information</p>
                        <Button onClick={onRefresh} className="mt-4">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Retry
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-6">
            {/* Version Information */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Monitor className="h-5 w-5" />
                                Version Information
                            </CardTitle>
                            <CardDescription>Current versions of key dependencies</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={onRefresh}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="rounded-lg border p-4 text-center">
                            <div className="font-bold text-blue-600">{serverInfo.versions.node}</div>
                            <div className="text-muted-foreground text-sm">Node.js</div>
                        </div>
                        <div className="rounded-lg border p-4 text-center">
                            <div className="font-bold text-blue-600">{serverInfo.versions.next}</div>
                            <div className="text-muted-foreground text-sm">Next.js</div>
                        </div>
                        <div className="rounded-lg border p-4 text-center">
                            <div className="font-bold text-blue-600">{serverInfo.versions.react}</div>
                            <div className="text-muted-foreground text-sm">React</div>
                        </div>
                        <div className="rounded-lg border p-4 text-center">
                            <div className="font-bold text-purple-600">{serverInfo.versions.tailwindcss}</div>
                            <div className="text-muted-foreground text-sm">Tailwind</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* System Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        System Information
                    </CardTitle>
                    <CardDescription>Current system status and resource usage</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="flex items-center gap-3 rounded-lg border p-4">
                            <Cpu className="h-8 w-8 text-orange-500" />
                            <div>
                                <div className="font-semibold">{serverInfo.system.cpus} CPUs</div>
                                <div className="text-muted-foreground text-sm">
                                    {serverInfo.system.arch} • {serverInfo.system.platform}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-lg border p-4">
                            <MemoryStick className="h-8 w-8 text-blue-500" />
                            <div>
                                <div className="font-semibold">
                                    {serverInfo.system.freeMemory}GB / {serverInfo.system.totalMemory}GB
                                </div>
                                <div className="text-muted-foreground text-sm">Memory</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-lg border p-4">
                            <Clock className="h-8 w-8 text-green-500" />
                            <div>
                                <div className="font-semibold">{formatUptime(serverInfo.system.uptime)}</div>
                                <div className="text-muted-foreground text-sm">System Uptime</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-lg border p-4">
                            <Server className="h-8 w-8 text-purple-500" />
                            <div>
                                <div className="font-semibold">{formatUptime(serverInfo.system.processUptime)}</div>
                                <div className="text-muted-foreground text-sm">Process Uptime</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-lg border p-4">
                            <div className="mb-2 flex items-center gap-2">
                                <Badge variant={serverInfo.system.nodeEnv === 'production' ? 'default' : 'secondary'}>
                                    {serverInfo.system.nodeEnv}
                                </Badge>
                                <span className="text-muted-foreground text-sm">Environment</span>
                            </div>
                        </div>

                        <div className="rounded-lg border p-4">
                            <div className="mb-1 font-medium text-sm">Working Directory</div>
                            <div className="break-all font-mono text-muted-foreground text-sm">
                                {serverInfo.system.cwd}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Server Logs */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5" />
                        Recent Server Logs
                    </CardTitle>
                    <CardDescription>Latest system messages and events</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-64 w-full rounded-lg border p-4">
                        <div className="space-y-2">
                            {serverInfo.logs.map((log, index) => (
                                <div key={index} className="font-mono text-sm">
                                    <span className="text-muted-foreground">{log}</span>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}

// Database Tab Component
function DatabaseTab({ databaseStats, loading, onRefresh }) {
    if (loading.database) {
        return <DatabaseSkeleton />;
    }

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5" />
                                Database Health
                            </CardTitle>
                            <CardDescription>Database connectivity and collection status</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={onRefresh}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {databaseStats ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Badge variant={databaseStats.healthy ? 'default' : 'destructive'}>
                                    {databaseStats.healthy ? 'Healthy' : 'Unhealthy'}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    Provider: {databaseStats.provider}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                                {Object.entries(databaseStats.collections).map(([collection, stats]) => (
                                    <div key={collection} className="rounded-lg border p-4">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-sm">{collection}</span>
                                            <Badge 
                                                variant={stats.accessible ? 'default' : 'destructive'}
                                                className="text-xs"
                                            >
                                                {stats.accessible ? 'OK' : 'Error'}
                                            </Badge>
                                        </div>
                                        {stats.error && (
                                            <p className="mt-1 text-xs text-red-500">{stats.error}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground">
                            Failed to load database statistics
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// Cache Management Tab Component
function CacheManagementTab({ loading, onClearCache }) {
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trash2 className="h-5 w-5" />
                        Cache Management
                    </CardTitle>
                    <CardDescription>Clear cached data to improve performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Button
                            variant="outline"
                            onClick={() => onClearCache('revalidate-path')}
                            disabled={loading.cache}
                            className="h-24 flex-col gap-2"
                        >
                            {loading.cache ? (
                                <RefreshCw className="h-5 w-5 animate-spin" />
                            ) : (
                                <RefreshCw className="h-5 w-5" />
                            )}
                            <span>Revalidate Paths</span>
                            <span className="text-muted-foreground text-xs">Clear page cache</span>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => onClearCache('revalidate-tag')}
                            disabled={loading.cache}
                            className="h-24 flex-col gap-2"
                        >
                            {loading.cache ? (
                                <RefreshCw className="h-5 w-5 animate-spin" />
                            ) : (
                                <RefreshCw className="h-5 w-5" />
                            )}
                            <span>Revalidate Tags</span>
                            <span className="text-muted-foreground text-xs">Clear tagged cache</span>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => onClearCache('clear-settings-cache')}
                            disabled={loading.cache}
                            className="h-24 flex-col gap-2"
                        >
                            {loading.cache ? (
                                <RefreshCw className="h-5 w-5 animate-spin" />
                            ) : (
                                <RefreshCw className="h-5 w-5" />
                            )}
                            <span>Clear Settings Cache</span>
                            <span className="text-muted-foreground text-xs">site_settings & store_settings</span>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => onClearCache('clear-all-cache')}
                            disabled={loading.cache}
                            className="h-24 flex-col gap-2"
                        >
                            {loading.cache ? (
                                <RefreshCw className="h-5 w-5 animate-spin" />
                            ) : (
                                <RefreshCw className="h-5 w-5" />
                            )}
                            <span>Clear All Cache</span>
                            <span className="text-muted-foreground text-xs">All cache types</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Maintenance Tab Component
function MaintenanceTab({ loading, onPerformCleanup }) {
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        System Cleanup
                    </CardTitle>
                    <CardDescription>Perform comprehensive system maintenance operations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <Button
                            variant="outline"
                            onClick={() => onPerformCleanup({ cleanNotifications: true, clearCaches: false })}
                            disabled={loading.cleanup}
                            className="h-24 flex-col gap-2"
                        >
                            {loading.cleanup ? (
                                <RefreshCw className="h-5 w-5 animate-spin" />
                            ) : (
                                <Trash2 className="h-5 w-5" />
                            )}
                            <span>Clean Notifications</span>
                            <span className="text-muted-foreground text-xs">Remove expired notifications</span>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => onPerformCleanup({ cleanNotifications: false, clearCaches: true })}
                            disabled={loading.cleanup}
                            className="h-24 flex-col gap-2"
                        >
                            {loading.cleanup ? (
                                <RefreshCw className="h-5 w-5 animate-spin" />
                            ) : (
                                <RefreshCw className="h-5 w-5" />
                            )}
                            <span>Clear All Caches</span>
                            <span className="text-muted-foreground text-xs">Full cache cleanup</span>
                        </Button>

                        <Button
                            variant="default"
                            onClick={() => onPerformCleanup({ cleanNotifications: true, clearCaches: true })}
                            disabled={loading.cleanup}
                            className="h-24 flex-col gap-2"
                        >
                            {loading.cleanup ? (
                                <RefreshCw className="h-5 w-5 animate-spin" />
                            ) : (
                                <Settings className="h-5 w-5" />
                            )}
                            <span>Full Cleanup</span>
                            <span className="text-muted-foreground text-xs">Complete maintenance</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Server Info Skeleton Component
function ServerInfoSkeleton() {
    return (
        <div className="grid gap-6">
            {/* Version Information Skeleton */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-4 w-56" />
                        </div>
                        <Skeleton className="h-8 w-16" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="rounded-lg border p-4 text-center">
                                <Skeleton className="mx-auto mb-2 h-8 w-16" />
                                <Skeleton className="mx-auto h-4 w-12" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* System Information Skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-3 rounded-lg border p-4">
                                <Skeleton className="h-8 w-8 rounded" />
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Server Logs Skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                    <div className="h-64 w-full space-y-2 rounded-lg border p-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-4 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Database Skeleton Component
function DatabaseSkeleton() {
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                        <Skeleton className="h-8 w-16" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="rounded-lg border p-4">
                                    <div className="flex items-center justify-between">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-5 w-12" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
