'use client';

import {
    Activity,
    AlertTriangle,
    Clock,
    Cpu,
    HardDrive,
    MemoryStick,
    Monitor,
    RefreshCw,
    Server,
    Trash2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

export default function MaintenancePage() {
    const [serverInfo, setServerInfo] = useState(null);
    const [loading, setLoading] = useState({
        serverInfo: true,
        cache: false
    });

    // Fetch server information
    const fetchServerInfo = async () => {
        setLoading((prev) => ({ ...prev, serverInfo: true }));
        try {
            const response = await fetch('/admin/system/maintenance/route/server-info');
            const data = await response.json();

            if (data.success) {
                setServerInfo(data.data);
            } else {
                toast.error(data.error || 'Failed to fetch server information');
            }
        } catch (error) {
            console.error('Error fetching server info:', error);
            toast.error('Failed to fetch server information');
        } finally {
            setLoading((prev) => ({ ...prev, serverInfo: false }));
        }
    };

    // Clear cache
    const clearCache = async (action) => {
        setLoading((prev) => ({ ...prev, cache: true }));
        try {
            const response = await fetch('/admin/system/maintenance/route/cache', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                if (data.data.errors && data.data.errors.length > 0) {
                    toast.warning(`Some operations had errors: ${data.data.errors.join(', ')}`);
                }
            } else {
                toast.error(data.error || 'Failed to clear cache');
            }
        } catch (error) {
            console.error('Error clearing cache:', error);
            toast.error('Failed to clear cache');
        } finally {
            setLoading((prev) => ({ ...prev, cache: false }));
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

    useEffect(() => {
        fetchServerInfo();
    }, []);

    return (
        <ScrollArea className="h-[calc(100vh-80px)]">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-bold text-3xl">System Maintenance</h1>
                        <p className="text-muted-foreground">Monitor system health and manage database operations</p>
                    </div>
                </div>

                <ServerInfoTab
                    serverInfo={serverInfo}
                    loading={loading}
                    onRefresh={fetchServerInfo}
                    onClearCache={clearCache}
                    formatBytes={formatBytes}
                    formatUptime={formatUptime}
                />
            </div>
        </ScrollArea>
    );
}

// Server Information Tab Component
function ServerInfoTab({ serverInfo, loading, onRefresh, onClearCache, formatBytes, formatUptime }) {
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

            {/* Cache Management */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trash2 className="h-5 w-5" />
                        Cache Management
                    </CardTitle>
                    <CardDescription>Clear cached data to improve performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <Button
                            variant="outline"
                            onClick={() => onClearCache('revalidate-path')}
                            disabled={loading.cache}
                            className="h-20 flex-col gap-2">
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
                            className="h-20 flex-col gap-2">
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
                            className="h-20 flex-col gap-2">
                            {loading.cache ? (
                                <RefreshCw className="h-5 w-5 animate-spin" />
                            ) : (
                                <RefreshCw className="h-5 w-5" />
                            )}
                            <span>Clear Settings Cache</span>
                            <span className="text-muted-foreground text-xs">site_settings & store_settings</span>
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
