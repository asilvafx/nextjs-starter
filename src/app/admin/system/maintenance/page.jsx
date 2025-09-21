"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Server, 
  Database, 
  Trash2, 
  Download, 
  Upload, 
  RefreshCw, 
  Monitor, 
  Activity,
  HardDrive,
  Cpu,
  MemoryStick,
  Clock,
  AlertTriangle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function MaintenancePage() {
  const [activeTab, setActiveTab] = useState("server");
  const [serverInfo, setServerInfo] = useState(null);
  const [backups, setBackups] = useState([]);
  const [selectedBackup, setSelectedBackup] = useState("");
  const [loading, setLoading] = useState({
    serverInfo: true,
    backups: true,
    backup: false,
    restore: false,
    cache: false
  });

  // Fetch server information
  const fetchServerInfo = async () => {
    setLoading(prev => ({ ...prev, serverInfo: true }));
    try {
      const response = await fetch('/api/maintenance/server-info');
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
      setLoading(prev => ({ ...prev, serverInfo: false }));
    }
  };

  // Fetch backup list
  const fetchBackups = async () => {
    setLoading(prev => ({ ...prev, backups: true }));
    try {
      const response = await fetch('/api/maintenance/database?action=list');
      const data = await response.json();
      
      if (data.success) {
        setBackups(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch backups');
      }
    } catch (error) {
      console.error('Error fetching backups:', error);
      toast.error('Failed to fetch backups');
    } finally {
      setLoading(prev => ({ ...prev, backups: false }));
    }
  };

  // Create backup
  const createBackup = async () => {
    setLoading(prev => ({ ...prev, backup: true }));
    try {
      const response = await fetch('/api/maintenance/database?action=backup');
      const data = await response.json();
      
      if (data.success) {
        toast.success('Database backup created successfully');
        
        // Download backup file
        const backup = data.data.backup;
        const blob = new Blob([JSON.stringify(backup, null, 2)], { 
          type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = data.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // Refresh backups list
        fetchBackups();
      } else {
        toast.error(data.error || 'Failed to create backup');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup');
    } finally {
      setLoading(prev => ({ ...prev, backup: false }));
    }
  };

  // Restore backup
  const restoreBackup = async () => {
    if (!selectedBackup) {
      toast.error('Please select a backup to restore');
      return;
    }

    setLoading(prev => ({ ...prev, restore: true }));
    try {
      const response = await fetch('/api/maintenance/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: selectedBackup })
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Database restored successfully');
        if (data.data.errors && data.data.errors.length > 0) {
          toast.warning(`Some collections had errors: ${data.data.errors.join(', ')}`);
        }
      } else {
        toast.error(data.error || 'Failed to restore backup');
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error('Failed to restore backup');
    } finally {
      setLoading(prev => ({ ...prev, restore: false }));
    }
  };

  // Clear cache
  const clearCache = async (action) => {
    setLoading(prev => ({ ...prev, cache: true }));
    try {
      const response = await fetch('/api/maintenance/cache', {
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
      setLoading(prev => ({ ...prev, cache: false }));
    }
  };

  // Format bytes
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    fetchBackups();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Maintenance</h1>
          <p className="text-muted-foreground">
            Monitor system health and manage database operations
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="server" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Server Info
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="cache" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Cache
          </TabsTrigger>
        </TabsList>

        <TabsContent value="server" className="space-y-6">
          <ServerInfoTab 
            serverInfo={serverInfo} 
            loading={loading.serverInfo}
            onRefresh={fetchServerInfo}
            formatBytes={formatBytes}
            formatUptime={formatUptime}
          />
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <DatabaseTab 
            backups={backups}
            selectedBackup={selectedBackup}
            setSelectedBackup={setSelectedBackup}
            loading={loading}
            onCreateBackup={createBackup}
            onRestoreBackup={restoreBackup}
            onRefresh={fetchBackups}
            formatBytes={formatBytes}
          />
        </TabsContent>

        <TabsContent value="cache" className="space-y-6">
          <CacheTab 
            loading={loading.cache}
            onClearCache={clearCache}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Server Information Tab Component
function ServerInfoTab({ serverInfo, loading, onRefresh, formatBytes, formatUptime }) {
  if (loading) {
    return <ServerInfoSkeleton />;
  }

  if (!serverInfo) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Failed to load server information</p>
            <Button onClick={onRefresh} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
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
              <CardDescription>
                Current versions of key dependencies
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {serverInfo.versions.node}
              </div>
              <div className="text-sm text-muted-foreground">Node.js</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {serverInfo.versions.next}
              </div>
              <div className="text-sm text-muted-foreground">Next.js</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-cyan-600">
                {serverInfo.versions.react}
              </div>
              <div className="text-sm text-muted-foreground">React</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {serverInfo.versions.tailwindcss}
              </div>
              <div className="text-sm text-muted-foreground">Tailwind</div>
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
          <CardDescription>
            Current system status and resource usage
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Cpu className="h-8 w-8 text-orange-500" />
              <div>
                <div className="font-semibold">{serverInfo.system.cpus} CPUs</div>
                <div className="text-sm text-muted-foreground">
                  {serverInfo.system.arch} • {serverInfo.system.platform}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <MemoryStick className="h-8 w-8 text-blue-500" />
              <div>
                <div className="font-semibold">
                  {serverInfo.system.freeMemory}GB / {serverInfo.system.totalMemory}GB
                </div>
                <div className="text-sm text-muted-foreground">Memory</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Clock className="h-8 w-8 text-green-500" />
              <div>
                <div className="font-semibold">
                  {formatUptime(serverInfo.system.uptime)}
                </div>
                <div className="text-sm text-muted-foreground">System Uptime</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Server className="h-8 w-8 text-purple-500" />
              <div>
                <div className="font-semibold">
                  {formatUptime(serverInfo.system.processUptime)}
                </div>
                <div className="text-sm text-muted-foreground">Process Uptime</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={serverInfo.system.nodeEnv === 'production' ? 'default' : 'secondary'}>
                  {serverInfo.system.nodeEnv}
                </Badge>
                <span className="text-sm text-muted-foreground">Environment</span>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium mb-1">Working Directory</div>
              <div className="text-sm text-muted-foreground font-mono break-all">
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
          <CardDescription>
            Latest system messages and events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 w-full border rounded-lg p-4">
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
function DatabaseTab({ 
  backups, 
  selectedBackup, 
  setSelectedBackup, 
  loading, 
  onCreateBackup, 
  onRestoreBackup, 
  onRefresh, 
  formatBytes 
}) {
  return (
    <div className="grid gap-6">
      {/* Backup Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Backup & Restore
          </CardTitle>
          <CardDescription>
            Create backups and restore your database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={onCreateBackup}
              disabled={loading.backup}
              className="flex-1"
            >
              {loading.backup ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Create Backup
            </Button>
            
            <div className="flex gap-2 flex-1">
              <Select value={selectedBackup} onValueChange={setSelectedBackup}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select backup to restore" />
                </SelectTrigger>
                <SelectContent>
                  {backups.map((backup) => (
                    <SelectItem key={backup.filename} value={backup.filename}>
                      {backup.filename} ({formatBytes(backup.size)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive"
                    disabled={!selectedBackup || loading.restore}
                  >
                    {loading.restore ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Restore
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Database Restore</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will restore the database from the selected backup. 
                      This operation cannot be undone. Are you sure you want to continue?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onRestoreBackup}>
                      Restore Database
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Backups */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Available Backups</CardTitle>
              <CardDescription>
                List of all database backups
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading.backups ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No backups available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {backups.map((backup) => (
                <div 
                  key={backup.filename} 
                  className={`flex justify-between items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedBackup === backup.filename ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedBackup(backup.filename)}
                >
                  <div>
                    <div className="font-medium">{backup.filename}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(backup.created).toLocaleString()} • {backup.collections.length} collections • {backup.totalRecords} records
                    </div>
                  </div>
                  <Badge variant="outline">{formatBytes(backup.size)}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Cache Tab Component
function CacheTab({ loading, onClearCache }) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Cache Management
          </CardTitle>
          <CardDescription>
            Clear various types of cached data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline"
              onClick={() => onClearCache('revalidate-path')}
              disabled={loading}
              className="h-20 flex-col gap-2"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5" />
              )}
              <span>Revalidate Paths</span>
              <span className="text-xs text-muted-foreground">Clear page cache</span>
            </Button>

            <Button 
              variant="outline"
              onClick={() => onClearCache('revalidate-tag')}
              disabled={loading}
              className="h-20 flex-col gap-2"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5" />
              )}
              <span>Revalidate Tags</span>
              <span className="text-xs text-muted-foreground">Clear tagged cache</span>
            </Button>

            <Button 
              variant="outline"
              onClick={() => onClearCache('clear-temp')}
              disabled={loading}
              className="h-20 flex-col gap-2"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
              <span>Clear Temp Files</span>
              <span className="text-xs text-muted-foreground">Remove temporary files</span>
            </Button>

            <Button 
              variant="outline"
              onClick={() => onClearCache('clear-logs')}
              disabled={loading}
              className="h-20 flex-col gap-2"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
              <span>Clear Old Logs</span>
              <span className="text-xs text-muted-foreground">Remove old log files</span>
            </Button>
          </div>

          <div className="pt-4 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive"
                  disabled={loading}
                  className="w-full h-16"
                >
                  {loading ? (
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-5 w-5 mr-2" />
                  )}
                  Clear All Cache
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Cache</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will clear all cached data including pages, tags, temporary files, and old logs. 
                    This may temporarily slow down your application. Continue?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onClearCache('clear-all')}>
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center p-4 border rounded-lg">
                <Skeleton className="h-8 w-16 mx-auto mb-2" />
                <Skeleton className="h-4 w-12 mx-auto" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4 border rounded-lg">
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
          <div className="h-64 w-full border rounded-lg p-4 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}