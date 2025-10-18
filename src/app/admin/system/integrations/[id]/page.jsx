// @/app/admin/system/integrations/[id]/page.jsx
'use client';

import { ArrowLeft, BarChart3, Eye, EyeOff, MapPin, Save, Settings, Shield } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
// Direct API calls for integrations
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';

// Icon mapping
const iconMap = {
    BarChart3,
    MapPin,
    Shield,
    Settings
};

export default function IntegrationConfigPage() {
    const router = useRouter();
    const params = useParams();
    const integrationId = params.id;

    const [integration, setIntegration] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({});
    const [showSecrets, setShowSecrets] = useState({});

    const fetchIntegration = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/query/integrations/${integrationId}`, {
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
                setIntegration(result.data);
                setFormData({
                    enabled: result.data.enabled,
                    settings: result.data.settings || {}
                });
            } else {
                toast.error(result.error || 'Integration not found');
                router.push('/admin/system/integrations');
            }
        } catch (error) {
            console.error('Error fetching integration:', error);
            toast.error('Failed to load integration');
            router.push('/admin/system/integrations');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            const response = await fetch(`/api/query/integrations/${integrationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                setIntegration(result.data);
                toast.success('Integration updated successfully');
            } else {
                toast.error(result.error || 'Failed to update integration');
            }
        } catch (error) {
            console.error('Error updating integration:', error);
            toast.error('Failed to update integration');
        } finally {
            setSaving(false);
        }
    };

    const handleSettingChange = (key, value) => {
        setFormData((prev) => ({
            ...prev,
            settings: {
                ...prev.settings,
                [key]: value
            }
        }));
    };

    const toggleShowSecret = (field) => {
        setShowSecrets((prev) => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const getIcon = (iconName) => {
        const IconComponent = iconMap[iconName] || Settings;
        return <IconComponent className="h-6 w-6" />;
    };

    const getStatusBadge = () => {
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

    const renderSettingField = (field, value, isRequired = false) => {
        const isSecret = field.toLowerCase().includes('secret') || field.toLowerCase().includes('key');
        const fieldType = isSecret && !showSecrets[field] ? 'password' : 'text';

        return (
            <div key={field} className="space-y-2">
                <Label htmlFor={field} className="flex items-center gap-2">
                    {field
                        .split(/(?=[A-Z])/)
                        .join(' ')
                        .replace(/^\w/, (c) => c.toUpperCase())}
                    {isRequired && <span className="text-red-500">*</span>}
                </Label>
                <div className="flex gap-2">
                    <Input
                        id={field}
                        type={fieldType}
                        value={value || ''}
                        onChange={(e) => handleSettingChange(field, e.target.value)}
                        placeholder={`Enter ${field}`}
                        className="flex-1"
                    />
                    {isSecret && (
                        <Button type="button" variant="outline" size="sm" onClick={() => toggleShowSecret(field)}>
                            {showSecrets[field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    const renderIntegrationSpecificInfo = () => {
        switch (integrationId) {
            case 'google-analytics':
                return (
                    <div className="space-y-2 text-muted-foreground text-sm">
                        <p>• Get your Measurement ID from Google Analytics 4 property settings</p>
                        <p>• Format: G-XXXXXXXXXX</p>
                        <p>• Enable data sharing with Google products if needed</p>
                    </div>
                );
            case 'google-maps':
                return (
                    <div className="space-y-2 text-muted-foreground text-sm">
                        <p>• Create an API key in Google Cloud Console</p>
                        <p>• Enable Places API and Geocoding API</p>
                        <p>• Add domain restrictions for security</p>
                    </div>
                );
            case 'cloudflare-turnstile':
                return (
                    <div className="space-y-2 text-muted-foreground text-sm">
                        <p>• Create a Turnstile site in Cloudflare dashboard</p>
                        <p>• Copy both site key and secret key</p>
                        <p>• Site key is used in frontend, secret key for backend verification</p>
                    </div>
                );
            default:
                return null;
        }
    };

    useEffect(() => {
        if (integrationId) {
            fetchIntegration();
        }
    }, [integrationId]);

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="mb-8">
                    <Skeleton className="mb-2 h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-24" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!integration) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="py-12 text-center">
                        <Settings className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                        <h3 className="mb-2 font-semibold text-lg">Integration Not Found</h3>
                        <p className="mb-4 text-muted-foreground">The requested integration could not be found.</p>
                        <Button onClick={() => router.push('/admin/system/integrations')}>Back to Integrations</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="mb-8 flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => router.push('/admin/system/integrations')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-muted p-2">{getIcon(integration.icon)}</div>
                    <div>
                        <h1 className="font-bold text-3xl">{integration.name}</h1>
                        <p className="text-muted-foreground">{integration.description}</p>
                    </div>
                </div>
                {getStatusBadge()}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuration</CardTitle>
                            <CardDescription>Configure the settings for this integration</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Enable/Disable Toggle */}
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <h3 className="font-medium">Enable Integration</h3>
                                    <p className="text-muted-foreground text-sm">
                                        {integration.enabled
                                            ? 'Integration is currently active'
                                            : 'Integration is currently inactive'}
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.enabled}
                                    onCheckedChange={(checked) =>
                                        setFormData((prev) => ({ ...prev, enabled: checked }))
                                    }
                                    disabled={!integration.configured}
                                />
                            </div>

                            <Separator />

                            {/* Settings Fields */}
                            <div className="space-y-4">
                                <h3 className="font-medium">Settings</h3>
                                {Object.keys(integration.settings || {}).map((field) =>
                                    renderSettingField(
                                        field,
                                        formData.settings[field],
                                        integration.requiredFields?.includes(field)
                                    )
                                )}
                            </div>

                            {/* Save Button */}
                            <div className="flex justify-end pt-4">
                                <Button onClick={handleSave} disabled={saving}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Status Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Configured</span>
                                <Badge variant={integration.configured ? 'default' : 'secondary'}>
                                    {integration.configured ? 'Yes' : 'No'}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Enabled</span>
                                <Badge variant={integration.enabled ? 'default' : 'outline'}>
                                    {integration.enabled ? 'Yes' : 'No'}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Category</span>
                                <Badge variant="outline">{integration.category}</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Setup Instructions */}
                    {renderIntegrationSpecificInfo() && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Setup Instructions</CardTitle>
                            </CardHeader>
                            <CardContent>{renderIntegrationSpecificInfo()}</CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
