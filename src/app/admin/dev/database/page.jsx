"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Database, 
  Table, 
  Search, 
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  Download,
  Upload,
  Eye,
  Settings,
  Activity,
  HardDrive,
  Zap
} from "lucide-react";

export default function DatabasePage() {
  const [selectedTab, setSelectedTab] = useState("collections");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Mock database collections data
  const collections = [
    {
      name: "users",
      documentCount: 1247,
      size: "2.4 MB",
      lastModified: "2024-01-15T10:30:00Z",
      indexes: 3,
      type: "collection"
    },
    {
      name: "site_settings", 
      documentCount: 1,
      size: "45.2 KB",
      lastModified: "2024-01-14T15:45:00Z",
      indexes: 1,
      type: "collection"
    },
    {
      name: "orders",
      documentCount: 892,
      size: "5.7 MB",
      lastModified: "2024-01-15T09:20:00Z",
      indexes: 5,
      type: "collection"
    },
    {
      name: "products",
      documentCount: 156,
      size: "1.2 MB", 
      lastModified: "2024-01-13T14:15:00Z",
      indexes: 4,
      type: "collection"
    },
    {
      name: "sessions",
      documentCount: 3421,
      size: "890 KB",
      lastModified: "2024-01-15T11:00:00Z",
      indexes: 2,
      type: "collection"
    }
  ];

  // Mock database stats
  const dbStats = {
    totalCollections: collections.length,
    totalDocuments: collections.reduce((sum, col) => sum + col.documentCount, 0),
    totalSize: "10.2 MB",
    connections: 12,
    uptime: "7 days",
    provider: process.env.POSTGRES_URL ? "PostgreSQL" : "Redis"
  };

  // Mock recent activities
  const recentActivities = [
    {
      id: 1,
      action: "Document Created",
      collection: "users",
      timestamp: "2024-01-15T11:30:00Z",
      user: "System"
    },
    {
      id: 2, 
      action: "Collection Updated",
      collection: "orders",
      timestamp: "2024-01-15T10:45:00Z",
      user: "Admin"
    },
    {
      id: 3,
      action: "Index Created",
      collection: "products", 
      timestamp: "2024-01-15T09:15:00Z",
      user: "Developer"
    },
    {
      id: 4,
      action: "Document Deleted",
      collection: "sessions",
      timestamp: "2024-01-15T08:30:00Z",
      user: "System"
    }
  ];

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate refresh
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Database</h1>
          <p className="text-muted-foreground">
            Manage and monitor your database collections and documents
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Backup
          </Button>
        </div>
      </div>

      {/* Database Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Collections</p>
                <p className="text-2xl font-bold">{dbStats.totalCollections}</p>
              </div>
              <Table className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Documents</p>
                <p className="text-2xl font-bold">{dbStats.totalDocuments.toLocaleString()}</p>
              </div>
              <Database className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Size</p>
                <p className="text-2xl font-bold">{dbStats.totalSize}</p>
              </div>
              <HardDrive className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Provider</p>
                <p className="text-2xl font-bold">{dbStats.provider}</p>
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search collections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Collection
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Database Collections</CardTitle>
              <CardDescription>
                {filteredCollections.length} collection{filteredCollections.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCollections.map((collection) => (
                  <div key={collection.name} className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                      <Table className="h-5 w-5 text-blue-600" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{collection.name}</h3>
                        <Badge variant="outline">
                          {collection.type}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{collection.documentCount.toLocaleString()} documents</span>
                        <span>{collection.size}</span>
                        <span>{collection.indexes} indexes</span>
                        <span>Modified: {new Date(collection.lastModified).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {filteredCollections.length === 0 && (
                  <div className="text-center py-12">
                    <Database className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No collections found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm 
                        ? `No collections match "${searchTerm}"`
                        : "Get started by creating your first collection"
                      }
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
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
              <CardDescription>
                Latest database operations and changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-3 border-b last:border-b-0">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                        <Activity className="h-4 w-4 text-green-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{activity.action}</span>
                          <Badge variant="outline">{activity.collection}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          by {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Backup & Restore</CardTitle>
                <CardDescription>
                  Manage database backups and restore operations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Create Backup
                </Button>
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Restore Backup
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Database Optimization</CardTitle>
                <CardDescription>
                  Tools to optimize database performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full">
                  Rebuild Indexes
                </Button>
                <Button variant="outline" className="w-full">
                  Cleanup Old Data
                </Button>
                <Button variant="outline" className="w-full">
                  Analyze Performance
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Database Information</CardTitle>
              <CardDescription>
                Current database configuration and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Provider:</span>
                    <span className="text-sm font-medium">{dbStats.provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Active Connections:</span>
                    <span className="text-sm font-medium">{dbStats.connections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Uptime:</span>
                    <span className="text-sm font-medium">{dbStats.uptime}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Collections:</span>
                    <span className="text-sm font-medium">{dbStats.totalCollections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Documents:</span>
                    <span className="text-sm font-medium">{dbStats.totalDocuments.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Database Size:</span>
                    <span className="text-sm font-medium">{dbStats.totalSize}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}