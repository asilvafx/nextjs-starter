"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

export default function EndpointsPage() {
  const [selectedTab, setSelectedTab] = useState("endpoints");
  const [searchTerm, setSearchTerm] = useState("");

  // Mock API endpoints data
  const endpoints = [
    {
      id: 1,
      method: "GET",
      path: "/api/query/users",
      description: "Retrieve all users with pagination support",
      status: "active",
      authentication: "required",
      rateLimit: "100/hour",
      lastUsed: "2024-01-15T10:30:00Z",
      usage: 1247
    },
    {
      id: 2,
      method: "POST",
      path: "/api/query/users",
      description: "Create a new user account",
      status: "active",
      authentication: "required", 
      rateLimit: "10/hour",
      lastUsed: "2024-01-15T09:45:00Z",
      usage: 89
    },
    {
      id: 3,
      method: "GET",
      path: "/api/query/public/site_settings",
      description: "Get public site settings and configuration",
      status: "active",
      authentication: "none",
      rateLimit: "1000/hour",
      lastUsed: "2024-01-15T11:15:00Z",
      usage: 2341
    },
    {
      id: 4,
      method: "PUT",
      path: "/api/query/settings/:id",
      description: "Update system settings (admin only)",
      status: "active",
      authentication: "admin",
      rateLimit: "5/hour",
      lastUsed: "2024-01-14T16:20:00Z",
      usage: 12
    },
    {
      id: 5,
      method: "DELETE",
      path: "/api/query/users/:id",
      description: "Delete user account",
      status: "deprecated",
      authentication: "admin",
      rateLimit: "5/hour", 
      lastUsed: "2024-01-10T14:30:00Z",
      usage: 3
    }
  ];

  // Mock API keys data
  const apiKeys = [
    {
      id: 1,
      name: "Frontend App Key",
      key: "pk_live_51H7l...xvKQ",
      permissions: ["read:users", "read:products"],
      status: "active",
      createdAt: "2024-01-10T10:00:00Z",
      lastUsed: "2024-01-15T11:30:00Z",
      usage: 1523
    },
    {
      id: 2,
      name: "Mobile App Key",
      key: "pk_live_51H8m...yqLR",
      permissions: ["read:users", "write:orders", "read:products"],
      status: "active", 
      createdAt: "2024-01-08T15:30:00Z",
      lastUsed: "2024-01-15T10:45:00Z",
      usage: 892
    },
    {
      id: 3,
      name: "Analytics Service",
      key: "pk_live_51H9n...zrMS",
      permissions: ["read:analytics", "read:users"],
      status: "inactive",
      createdAt: "2024-01-05T09:15:00Z",
      lastUsed: "2024-01-12T08:20:00Z", 
      usage: 234
    }
  ];

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

  // Stats
  const endpointStats = {
    total: endpoints.length,
    active: endpoints.filter(e => e.status === 'active').length,
    deprecated: endpoints.filter(e => e.status === 'deprecated').length,
    totalUsage: endpoints.reduce((sum, e) => sum + e.usage, 0)
  };

  const apiKeyStats = {
    total: apiKeys.length,
    active: apiKeys.filter(k => k.status === 'active').length,
    inactive: apiKeys.filter(k => k.status === 'inactive').length,
    totalUsage: apiKeys.reduce((sum, k) => sum + k.usage, 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">API Endpoints</h1>
          <p className="text-muted-foreground">
            Manage API endpoints and access keys
          </p>
        </div>
        <Button className="flex items-center gap-2">
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
                {filteredEndpoints.map((endpoint) => {
                  const StatusIcon = statusConfig[endpoint.status].icon;
                  const AuthIcon = authConfig[endpoint.authentication].icon;
                  
                  return (
                    <div key={endpoint.id} className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-3">
                        <Badge className={methodConfig[endpoint.method].color}>
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
                            {authConfig[endpoint.authentication].label}
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {endpoint.rateLimit}
                          </div>
                          <span>{endpoint.usage} requests</span>
                          <span>Last used: {new Date(endpoint.lastUsed).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={statusConfig[endpoint.status].color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {endpoint.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
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
                {filteredApiKeys.map((apiKey) => {
                  const StatusIcon = statusConfig[apiKey.status].icon;
                  
                  return (
                    <div key={apiKey.id} className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                        <Key className="h-5 w-5 text-blue-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{apiKey.name}</h3>
                          <Badge className={statusConfig[apiKey.status].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {apiKey.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                            {apiKey.key}
                          </code>
                          <Button variant="outline" size="sm">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mb-2">
                          {apiKey.permissions.map((permission) => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Created: {new Date(apiKey.createdAt).toLocaleDateString()}</span>
                          <span>Last used: {new Date(apiKey.lastUsed).toLocaleDateString()}</span>
                          <span>{apiKey.usage.toLocaleString()} requests</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          Revoke
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}