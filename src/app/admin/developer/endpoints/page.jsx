"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Code, 
  Key, 
  Search,
  Plus,
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Shield,
  Activity
} from "lucide-react";
import { getAll, create, update, remove } from "@/lib/client/query";
import { toast } from "sonner";
import { useRouter } from 'next/navigation';

export default function EndpointsPage() {
  const [selectedTab, setSelectedTab] = useState("endpoints");
  const [searchTerm, setSearchTerm] = useState("");
  const [endpoints, setEndpoints] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Fetch API endpoints and keys from database
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [endpointsResponse, apiKeysResponse] = await Promise.all([
        getAll('api_endpoints'),
        getAll('api_keys')
      ]);
      
      const endpointsData = endpointsResponse?.success ? endpointsResponse.data : [];
      const apiKeysData = apiKeysResponse?.success ? apiKeysResponse.data : [];
      
      // If no endpoints exist, create default ones
      if (endpointsData.length === 0) {
        await createDefaultEndpoints();
      } else {
        setEndpoints(endpointsData);
      }
      
      setApiKeys(apiKeysData);
    } catch (error) {
      console.error('Error fetching API data:', error);
      toast.error('Failed to load API information');
    } finally {
      setIsLoading(false);
    }
  };

  // Create default API endpoints documentation
  const createDefaultEndpoints = async () => {
    const defaultEndpoints = [
      {
        method: "GET",
        path: "/api/query/users",
        description: "Retrieve all users with pagination support",
        status: "active",
        authentication: "required",
        rateLimit: "100/hour",
        usage: 0,
        createdAt: new Date().toISOString()
      },
      {
        method: "POST",
        path: "/api/query/users",
        description: "Create a new user account",
        status: "active",
        authentication: "required", 
        rateLimit: "10/hour",
        usage: 0,
        createdAt: new Date().toISOString()
      },
      {
        method: "GET",
        path: "/api/query/public/site_settings",
        description: "Get public site settings and configuration",
        status: "active",
        authentication: "none",
        rateLimit: "1000/hour",
        usage: 0,
        createdAt: new Date().toISOString()
      },
      {
        method: "PUT",
        path: "/api/query/settings/:id",
        description: "Update system settings (admin only)",
        status: "active",
        authentication: "admin",
        rateLimit: "5/hour",
        usage: 0,
        createdAt: new Date().toISOString()
      },
      {
        method: "POST",
        path: "/api/email",
        description: "Send emails via email service",
        status: "active",
        authentication: "required",
        rateLimit: "50/hour",
        usage: 0,
        createdAt: new Date().toISOString()
      }
    ];

    for (const endpoint of defaultEndpoints) {
      try {
        await create(endpoint, 'api_endpoints');
      } catch (error) {
        console.error('Error creating endpoint:', error);
      }
    }
    
    // Refetch data
    const endpointsResponse = await getAll('api_endpoints');
    setEndpoints(endpointsResponse?.success ? endpointsResponse.data : []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRevokeApiKey = async (apiKeyId) => {
    try {
      await update(apiKeyId, { status: 'revoked', revokedAt: new Date().toISOString() }, 'api_keys');
      toast.success('API key revoked successfully');
      fetchData();
    } catch (error) {
      console.error('Error revoking API key:', error);
      toast.error('Failed to revoke API key');
    }
  };

  const handleDeleteApiKey = async (apiKeyId) => {
    try {
      await remove(apiKeyId, 'api_keys');
      toast.success('API key deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Failed to delete API key');
    }
  };

  const handleCopyApiKey = async (apiKey) => {
    try {
      await navigator.clipboard.writeText(apiKey.key || apiKey.keyPreview);
      toast.success('API key copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleCreateNewKey = () => {
    router.push('/admin/developer/endpoints/new-key');
  };

  const methodConfig = {
    GET: { color: "bg-green-100 text-green-800", textColor: "text-green-600" },
    POST: { color: "bg-blue-100 text-blue-800", textColor: "text-blue-600" },
    PUT: { color: "bg-orange-100 text-orange-800", textColor: "text-orange-600" },
    DELETE: { color: "bg-red-100 text-red-800", textColor: "text-red-600" }
  };

  const statusConfig = {
    active: { color: "bg-green-100 text-green-800", icon: CheckCircle },
    deprecated: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
    inactive: { color: "bg-gray-100 text-gray-800", icon: XCircle }
  };

  const authConfig = {
    none: { color: "bg-gray-100 text-gray-800", label: "Public", icon: Eye },
    required: { color: "bg-blue-100 text-blue-800", label: "Auth Required", icon: Key },
    admin: { color: "bg-purple-100 text-purple-800", label: "Admin Only", icon: Shield }
  };

  const filteredEndpoints = endpoints.filter(endpoint =>
    endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
    endpoint.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredApiKeys = apiKeys.filter(apiKey =>
    apiKey.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const endpointStats = {
    total: endpoints.length,
    active: endpoints.filter(e => e.status === 'active').length,
    deprecated: endpoints.filter(e => e.status === 'deprecated').length,
    totalUsage: endpoints.reduce((sum, e) => sum + (e.usage || 0), 0)
  };

  const apiKeyStats = {
    total: apiKeys.length,
    active: apiKeys.filter(k => k.status === 'active').length,
    inactive: apiKeys.filter(k => k.status !== 'active').length,
    totalUsage: apiKeys.reduce((sum, k) => sum + (k.usage || 0), 0)
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">API Endpoints</h1>
          <p className="text-muted-foreground">
            Manage API endpoints and access keys
          </p>
        </div>
        <Button className="flex items-center gap-2" onClick={handleCreateNewKey}>
          <Plus className="h-4 w-4" />
          Create API Key
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Endpoints</p>
                <p className="text-2xl font-bold">{endpointStats.total}</p>
              </div>
              <Code className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active APIs</p>
                <p className="text-2xl font-bold text-green-600">{endpointStats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">API Keys</p>
                <p className="text-2xl font-bold">{apiKeyStats.active}</p>
              </div>
              <Key className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{endpointStats.totalUsage.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="endpoints" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Endpoints
          </TabsTrigger>
          <TabsTrigger value="keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
        </TabsList>

        {/* Search */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={selectedTab === 'endpoints' ? "Search endpoints..." : "Search API keys..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Endpoints Tab */}
        <TabsContent value="endpoints">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
              <CardDescription>
                {filteredEndpoints.length} endpoint{filteredEndpoints.length !== 1 ? 's' : ''} available
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredEndpoints.length === 0 ? (
                  <div className="text-center py-12">
                    <Code className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No endpoints found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm ? `No endpoints match "${searchTerm}"` : "No API endpoints available"}
                    </p>
                  </div>
                ) : (
                  filteredEndpoints.map((endpoint) => {
                    const StatusIcon = statusConfig[endpoint.status]?.icon || CheckCircle;
                    const AuthIcon = authConfig[endpoint.authentication]?.icon || Eye;
                    
                    return (
                      <div key={endpoint.id} className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3">
                          <Badge className={methodConfig[endpoint.method]?.color || methodConfig.GET.color}>
                            {endpoint.method}
                          </Badge>
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                            {endpoint.path}
                          </code>
                        </div>
                        
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">
                            {endpoint.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                            <div className="flex items-center gap-1">
                              <AuthIcon className="h-3 w-3" />
                              {authConfig[endpoint.authentication]?.label || 'Public'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {endpoint.rateLimit || 'No limit'}
                            </div>
                            <span>{endpoint.usage || 0} requests</span>
                            <span>Last used: {endpoint.lastUsed ? new Date(endpoint.lastUsed).toLocaleDateString() : 'Never'}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={statusConfig[endpoint.status]?.color || statusConfig.active.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {endpoint.status}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="keys">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                {filteredApiKeys.length} API key{filteredApiKeys.length !== 1 ? 's' : ''} configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredApiKeys.length === 0 ? (
                  <div className="text-center py-12">
                    <Key className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No API keys found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm ? `No API keys match "${searchTerm}"` : "Get started by creating your first API key"}
                    </p>
                    <Button onClick={handleCreateNewKey}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create API Key
                    </Button>
                  </div>
                ) : (
                  filteredApiKeys.map((apiKey) => {
                    const StatusIcon = statusConfig[apiKey.status]?.icon || CheckCircle;
                    
                    return (
                      <div key={apiKey.id} className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                          <Key className="h-5 w-5 text-blue-600" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{apiKey.name}</h3>
                            <Badge className={statusConfig[apiKey.status]?.color || statusConfig.active.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {apiKey.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                              {apiKey.keyPreview || apiKey.key || 'Hidden'}
                            </code>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleCopyApiKey(apiKey)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mb-2">
                            {(apiKey.permissions || []).map((permission, index) => (
                              <Badge key={`${permission}-${index}`} variant="outline" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Created: {apiKey.createdAt ? new Date(apiKey.createdAt).toLocaleDateString() : 'Unknown'}</span>
                            <span>Last used: {apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleDateString() : 'Never'}</span>
                            <span>{(apiKey.usage || 0).toLocaleString()} requests</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {apiKey.status === 'active' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRevokeApiKey(apiKey.id)}
                            >
                              Revoke
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteApiKey(apiKey.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}