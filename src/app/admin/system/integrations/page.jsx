// @/app/admin/system/integrations/page.jsx
'use client';

import { BarChart3, ChevronRight, MapPin, RefreshCw, Settings, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
// Direct API calls for integrations
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';

// Icon mapping
const iconMap = {
    BarChart3,
    MapPin,
    Shield,
    Settings
};

export default function IntegrationsPage() {
    const router = useRouter();
    const [integrations, setIntegrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    const fetchIntegrations = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/query/integrations', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                // Convert to array if it's an object
                const integrationsData = Array.isArray(result.data) ? result.data : Object.values(result.data || {});
                setIntegrations(integrationsData);
            } else {
                toast.error(result.error || 'Failed to fetch integrations');
            }
        } catch (error) {
            console.error('Error fetching integrations:', error);
            toast.error('Failed to load integrations');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleEnabled = async (integration) => {
        if (!integration.configured && !integration.enabled) {
            toast.error('Please configure this integration first');
            router.push(`/admin/system/integrations/${integration.id}`);
            return;
        }

        try {
            setUpdatingId(integration.id);

            const response = await fetch(`/api/query/integrations/${integration.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    enabled: !integration.enabled
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                setIntegrations((prev) =>
                    prev.map((item) => (item.id === integration.id ? { ...item, enabled: !item.enabled } : item))
                );
                toast.success(`${integration.name} ${!integration.enabled ? 'enabled' : 'disabled'}`);
            } else {
                toast.error(result.error || 'Failed to update integration');
            }
        } catch (error) {
            console.error('Error updating integration:', error);
            toast.error('Failed to update integration');
        } finally {
            setUpdatingId(null);
        }
    };

    const getStatusBadge = (integration) => {
        if (!integration.configured) {
            return <Badge variant="secondary">Not Configured</Badge>;
        }
        if (integration.enabled) {
            return (
                <Badge variant="default" className="bg-green-500">
                    Active
                </Badge>
            );
        }
        return <Badge variant="outline">Inactive</Badge>;
    };

    const getIcon = (iconName) => {
        const IconComponent = iconMap[iconName] || Settings;
        return <IconComponent className="h-8 w-8" />;
    };

    useEffect(() => {
        fetchIntegrations();
    }, []);

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="font-bold text-3xl">Integrations</h1>
                        <p className="text-muted-foreground">Manage your third-party integrations and services</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardHeader>
                                <div className="flex items-center space-x-3">
                                    <Skeleton className="h-8 w-8 rounded" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="mb-4 h-4 w-full" />
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-6 w-20" />
                                    <Skeleton className="h-6 w-12" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="font-bold text-3xl">Integrations</h1>
                    <p className="text-muted-foreground">Manage your third-party integrations and services</p>
                </div>
                <Button onClick={fetchIntegrations} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {integrations.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Settings className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                        <h3 className="mb-2 font-semibold text-lg">No Integrations Available</h3>
                        <p className="text-muted-foreground">No integrations have been configured yet.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {integrations.map((integration) => (
                        <Card
                            key={integration.id}
                            className="cursor-pointer transition-shadow hover:shadow-md"
                            onClick={() => router.push(`/admin/system/integrations/${integration.id}`)}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="rounded-lg bg-muted p-2">{getIcon(integration.icon)}</div>
                                        <div>
                                            <CardTitle className="text-lg">{integration.name}</CardTitle>
                                            <p className="text-muted-foreground text-sm">{integration.category}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="mb-4">{integration.description}</CardDescription>

                                <div className="flex items-center justify-between">
                                    {getStatusBadge(integration)}

                                    <div className="flex items-center space-x-2">
                                        <span className="text-muted-foreground text-sm">
                                            {integration.enabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                        <Switch
                                            checked={integration.enabled}
                                            disabled={updatingId === integration.id || !integration.configured}
                                            onCheckedChange={(_checked) => {
                                                // Prevent event bubbling to card click
                                                event.stopPropagation();
                                                handleToggleEnabled(integration);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
