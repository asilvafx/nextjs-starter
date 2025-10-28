'use client';
import { Boxes, Building, Key, Locate, Mail, MapPin, Plus, Save, Settings, Shield, Trash2, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CountryDropdown } from '@/components/ui/country-dropdown';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { create, getAll, update } from '@/lib/client/query';

// Function to get available languages from locale folder
const getAvailableLanguages = async () => {
    try {
        const response = await fetch('/api/locale/available-languages');
        const result = await response.json();
        if (result.success) {
            return result.data;
        }
        return [];
    } catch (error) {
        console.error('Failed to fetch available languages:', error);
        return [];
    }
};

// Language name mappings
const languageNames = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ja: 'Japanese',
    ko: 'Korean',
    zh: 'Chinese',
    ar: 'Arabic',
    ru: 'Russian',
    hi: 'Hindi',
    nl: 'Dutch',
    sv: 'Swedish',
    no: 'Norwegian',
    da: 'Danish',
    fi: 'Finnish',
    pl: 'Polish',
    tr: 'Turkish'
};

// Email providers
const emailProviders = [
    { id: 'none', name: 'None', service: null },
    { id: 'gmail', name: 'Gmail', service: 'gmail' },
    { id: 'custom', name: 'Custom SMTP', service: null }
];

// OAuth providers
const oauthProviders = [
    { id: 'google', name: 'Google', icon: '🔵' },
    { id: 'github', name: 'GitHub', icon: '⚫' },
    { id: 'facebook', name: 'Facebook', icon: '🔵' },
    { id: 'twitter', name: 'X (Twitter)', icon: '⚫' },
    { id: 'discord', name: 'Discord', icon: '🟣' },
    { id: 'linkedin', name: 'LinkedIn', icon: '🔵' }
];

export default function SystemSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [settingsId, setSettingsId] = useState(null);
    const [activeTab, setActiveTab] = useState('site');
    const [availableLanguages, setAvailableLanguages] = useState([]);

    const form = useForm({
        defaultValues: {
            siteName: '',
            siteEmail: '',
            sitePhone: '',
            businessAddress: '',
            latitude: undefined,
            longitude: undefined,
            country: '',
            countryIso: '',
            language: 'en',
            availableLanguages: ['en'], // Multi-language support for content
            socialNetworks: [],
            workingHours: [],
            serviceArea: '',
            serviceRadius: undefined,
            // New integration settings
            smsEnabled: false,
            twilioApiKey: '',
            googleMapsEnabled: false,
            googleMapsApiKey: '',
            turnstileEnabled: false,
            turnstileSiteKey: '',
            emailProvider: 'none',
            emailUser: '',
            emailPass: '',
            smtpHost: '',
            smtpPort: 587,
            smtpSecure: false,
            allowRegistration: true,
            enableFrontend: true,
            baseUrl: typeof window !== 'undefined' ? window.location.origin : '',
            providers: oauthProviders.reduce(
                (acc, provider) => ({
                    ...acc,
                    [provider.id]: { clientId: '', clientSecret: '', enabled: false }
                }),
                {}
            ),
            web3Active: false,
            web3ContractAddress: '',
            web3ContractSymbol: '',
            web3ChainSymbol: '',
            web3InfuraRpc: '',
            web3ChainId: 1,
            web3NetworkName: 'Ethereum Mainnet'
        }
    });

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const response = await getAll('site_settings');

            if (response?.success && response.data?.length > 0) {
                const settings = response.data[0];
                setSettingsId(settings.id);

                // Reset form with fetched data (including integration settings)
                form.reset({
                    siteName: settings.siteName || '',
                    siteEmail: settings.siteEmail || '',
                    sitePhone: settings.sitePhone || '',
                    businessAddress: settings.businessAddress || '',
                    latitude: settings.latitude,
                    longitude: settings.longitude,
                    country: settings.country || '',
                    countryIso: settings.countryIso || '',
                    language: settings.language || 'en',
                    availableLanguages: settings.availableLanguages || ['en'],
                    socialNetworks: settings.socialNetworks || [],
                    workingHours: settings.workingHours || [],
                    serviceArea: settings.serviceArea || '',
                    serviceRadius: settings.serviceRadius,
                    // Email / SMTP
                    emailProvider: settings.emailProvider || 'none',
                    emailUser: settings.emailUser || '',
                    emailPass: settings.emailPass || '',
                    smtpHost: settings.smtpHost || '',
                    smtpPort: settings.smtpPort || 587,
                    smtpSecure: settings.smtpSecure || false,
                    // Application flags
                    allowRegistration: settings.allowRegistration ?? true,
                    enableFrontend: settings.enableFrontend ?? true,
                    baseUrl: settings.baseUrl || (typeof window !== 'undefined' ? window.location.origin : ''),
                    providers:
                        settings.providers ||
                        oauthProviders.reduce(
                            (acc, provider) => ({
                                ...acc,
                                [provider.id]: { clientId: '', clientSecret: '', enabled: false }
                            }),
                            {}
                        ),
                    // Integration / third-party settings
                    smsEnabled: settings.smsEnabled || false,
                    twilioApiKey: settings.twilioApiKey || '',
                    googleMapsEnabled: settings.googleMapsEnabled || false,
                    googleMapsApiKey: settings.googleMapsApiKey || '',
                    turnstileEnabled: settings.turnstileEnabled || false,
                    turnstileSiteKey: settings.turnstileSiteKey || '',
                    // Web3
                    web3Active: settings.web3Active || false,
                    web3ContractAddress: settings.web3ContractAddress || '',
                    web3ContractSymbol: settings.web3ContractSymbol || '',
                    web3ChainSymbol: settings.web3ChainSymbol || '',
                    web3InfuraRpc: settings.web3InfuraRpc || '',
                    web3ChainId: settings.web3ChainId || 1,
                    web3NetworkName: settings.web3NetworkName || 'Ethereum Mainnet'
                });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const initializeData = async () => {
            await fetchSettings();
            const languages = await getAvailableLanguages();
            const formattedLanguages = languages.map((code) => ({
                code,
                name: languageNames[code] || code.toUpperCase()
            }));
            setAvailableLanguages(formattedLanguages);
        };
        initializeData();
    }, []);

    const onSubmit = async (data) => {
        if (isSubmitting) return; // Prevent double submission

        try {
            setIsSubmitting(true);

            // Basic validation
            if (!data.siteName || !data.siteEmail) {
                toast.error('Site name and email are required');
                return;
            }

            if (!data.country || !data.countryIso) {
                toast.error('Country selection is required');
                return;
            }

            // Clean the data
            const cleanData = {
                ...data,
                // Convert string numbers to numbers
                latitude: data.latitude ? parseFloat(data.latitude) : undefined,
                longitude: data.longitude ? parseFloat(data.longitude) : undefined,
                serviceRadius: data.serviceRadius ? parseInt(data.serviceRadius, 10) : undefined,
                smtpPort: data.smtpPort ? parseInt(data.smtpPort, 10) : 587,
                web3ChainId: data.web3ChainId ? parseInt(data.web3ChainId, 10) : 1,
                // Ensure arrays exist
                socialNetworks: data.socialNetworks || [],
                workingHours: data.workingHours || []
            };

            if (settingsId) {
                await update(settingsId, cleanData, 'site_settings');
                toast.success('Settings updated successfully');
            } else {
                const result = await create(cleanData, 'site_settings');
                setSettingsId(result.id);
                toast.success('Settings created successfully');
            }

            // Clear Web3 config cache when settings change
            try {
                await fetch('/api/web3/cache', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (error) {
                console.error('Failed to clear Web3 cache:', error);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error(error.message || 'Failed to save settings');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle form validation errors with toast alerts
    const onFormError = (errors) => {
        const errorMessages = [];

        const collectErrors = (obj, prefix = '') => {
            Object.entries(obj).forEach(([key, value]) => {
                if (value?.message) {
                    errorMessages.push(value.message);
                } else if (typeof value === 'object' && value !== null) {
                    collectErrors(value, prefix ? `${prefix}.${key}` : key);
                }
            });
        };

        collectErrors(errors);

        if (errorMessages.length > 0) {
            // Show the first error message
            toast.error(errorMessages[0]);
        }
    };

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    form.setValue('latitude', latitude);
                    form.setValue('longitude', longitude);
                    toast.success(`Location set: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                },
                (error) => {
                    console.error('Error getting location:', error);
                    toast.error('Unable to get current location. Please check your browser permissions.');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 600000 // 10 minutes
                }
            );
        } else {
            toast.error('Geolocation is not supported by this browser.');
        }
    };

    if (isLoading) {
        return <SystemSettingsSkeleton />;
    }

    return (
        <ScrollArea className="h-[calc(100vh-80px)]">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-bold text-3xl">System Settings</h1>
                        <p className="text-muted-foreground">Configure your application settings</p>
                    </div>
                </div>

                <div className="relative">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit, onFormError)} className="space-y-6">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                                <TabsList disabled={isSubmitting}>
                                    <TabsTrigger
                                        value="site"
                                        className="flex items-center gap-2"
                                        disabled={isSubmitting}>
                                        <Settings className="h-4 w-4" />
                                        Site
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="email"
                                        className="flex items-center gap-2"
                                        disabled={isSubmitting}>
                                        <Mail className="h-4 w-4" />
                                        Email
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="oauth"
                                        className="flex items-center gap-2"
                                        disabled={isSubmitting}>
                                        <Shield className="h-4 w-4" />
                                        OAuth
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="web3"
                                        className="flex items-center gap-2"
                                        disabled={isSubmitting}>
                                        <Boxes className="h-4 w-4" />
                                        Web3
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="sms"
                                        className="flex items-center gap-2"
                                        disabled={isSubmitting}>
                                        <MessageSquare className="h-4 w-4" />
                                        SMS
                                    </TabsTrigger>

                                    <TabsTrigger
                                        value="location"
                                        className="flex items-center gap-2"
                                        disabled={isSubmitting}>
                                        <MapPin className="h-4 w-4" />
                                        Location
                                    </TabsTrigger>

                                    <TabsTrigger
                                        value="security"
                                        className="flex items-center gap-2"
                                        disabled={isSubmitting}>
                                        <Key className="h-4 w-4" />
                                        Security
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="site" className="space-y-6">
                                    <SiteSettingsTab
                                        form={form}
                                        languages={availableLanguages}
                                        getCurrentLocation={getCurrentLocation}
                                        isSubmitting={isSubmitting}
                                    />
                                </TabsContent>

                                <TabsContent value="email" className="space-y-6">
                                    <EmailSettingsTab
                                        form={form}
                                        emailProviders={emailProviders}
                                        isSubmitting={isSubmitting}
                                    />
                                </TabsContent>

                                <TabsContent value="oauth" className="space-y-6">
                                    <OAuthTab form={form} oauthProviders={oauthProviders} isSubmitting={isSubmitting} />
                                </TabsContent>

                                <TabsContent value="web3" className="space-y-6">
                                    <Web3Tab form={form} isSubmitting={isSubmitting} />
                                </TabsContent>
                                <TabsContent value="sms" className="space-y-6">
                                    <SMSSettingsTab form={form} isSubmitting={isSubmitting} />
                                </TabsContent>

                                <TabsContent value="location" className="space-y-6">
                                    <LocationTab form={form} getCurrentLocation={getCurrentLocation} isSubmitting={isSubmitting} languages={availableLanguages} />
                                </TabsContent>

                                <TabsContent value="security" className="space-y-6">
                                    <SecurityTab form={form} isSubmitting={isSubmitting} />
                                </TabsContent>
                            </Tabs>

                            <div className="right-0 bottom-0 left-0 z-10 mb-6 flex justify-center fixed md:ml-[16rem]">
                                <Button className="w-auto" type="submit" size="lg" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-white border-b-2 dark:border-black"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-1 h-4 w-4" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>

                    {/* Loading Overlay */}
                    {isSubmitting && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-background/50">
                            <div className="flex flex-col items-center gap-4 rounded-lg border bg-background p-6 shadow-lg">
                                <div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2"></div>
                                <p className="text-muted-foreground text-sm">Saving settings...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ScrollArea>
    );
}

// SMS Settings Tab
function SMSSettingsTab({ form, isSubmitting }) {
    const smsEnabled = form.watch('smsEnabled');

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    SMS Configuration
                </CardTitle>
                <CardDescription>Configure SMS provider (Twilio) and enable SMS features</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <FormField
                    control={form.control}
                    name="smsEnabled"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Enable SMS Integration</FormLabel>
                                <FormDescription>Enable sending SMS via Twilio</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="twilioApiKey"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Twilio API Key</FormLabel>
                            <FormControl>
                                <Input placeholder="sk-xxxxxxxxxxxx" disabled={!smsEnabled || isSubmitting} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}

// Location Tab (moved from Site)
function LocationTab({ form, getCurrentLocation, isSubmitting, languages }) {
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Location & Service Area
                    </CardTitle>
                    <CardDescription>Geographic information and service coverage</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="latitude"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Latitude</FormLabel>
                                    <FormControl>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                step="any"
                                                placeholder="40.7128"
                                                disabled={isSubmitting}
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={getCurrentLocation}
                                                disabled={isSubmitting}
                                                className="px-3"
                                                title="Get current location">
                                                <Locate className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="longitude"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Longitude</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="any"
                                            placeholder="-74.0060"
                                            disabled={isSubmitting}
                                            {...field}
                                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Country *</FormLabel>
                                <FormControl>
                                    <CountryDropdown
                                        key={field.value}
                                        defaultValue={field.value}
                                        disabled={isSubmitting}
                                        onChange={(country) => {
                                            const countryCode = country.alpha2.toUpperCase();
                                            field.onChange(countryCode);
                                            form.setValue('countryIso', country.alpha3);
                                        }}
                                        placeholder="Select a country"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="availableLanguages"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Available Languages *</FormLabel>
                                <FormControl>
                                    <MultiLanguageSelector
                                        languages={languages}
                                        value={field.value}
                                        onChange={field.onChange}
                                        disabled={isSubmitting}
                                        defaultLanguage={form.watch('language')}
                                        onDefaultLanguageChange={(langCode) => {
                                            form.setValue('language', langCode);
                                        }}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Select all languages available for content creation. Click on a language card to set
                                    it as the default language.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="serviceArea"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Service Area</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Metropolitan Area" disabled={isSubmitting} {...field} />
                                    </FormControl>
                                    <FormDescription>Describe your service coverage area</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="serviceRadius"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Service Radius (km)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="50"
                                            disabled={isSubmitting}
                                            {...field}
                                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                                        />
                                    </FormControl>
                                    <FormDescription>Maximum distance for services (in kilometers)</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Google Maps Integration
                    </CardTitle>
                    <CardDescription>Enable Google Maps and provide API key for Places/Maps services</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <FormField
                        control={form.control}
                        name="googleMapsEnabled"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Enable Google Maps</FormLabel>
                                    <FormDescription>Enable Google Maps for address autocomplete and maps features</FormDescription>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="googleMapsApiKey"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Google Maps API Key</FormLabel>
                                <FormControl>
                                    <Input placeholder="AIza..." disabled={!form.watch('googleMapsEnabled') || isSubmitting} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

// Security Tab (Turnstile)
function SecurityTab({ form, isSubmitting }) {
    const enabled = form.watch('turnstileEnabled');

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security / Turnstile
                </CardTitle>
                <CardDescription>Cloudflare Turnstile site key and enable/disable the verification</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <FormField
                    control={form.control}
                    name="turnstileEnabled"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Enable Turnstile</FormLabel>
                                <FormDescription>Enable Cloudflare Turnstile security verification</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="turnstileSiteKey"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Turnstile Site Key</FormLabel>
                            <FormControl>
                                <Input placeholder="1x00000000000000000000" disabled={!enabled || isSubmitting} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}

// Site Settings Tab Component
function SiteSettingsTab({ form, languages, getCurrentLocation, isSubmitting }) {
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Business Information
                    </CardTitle>
                    <CardDescription>Basic information about your business and website</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="siteName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Site Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="My Awesome Site" disabled={isSubmitting} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="siteEmail"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contact Email *</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="contact@example.com"
                                            disabled={isSubmitting}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="sitePhone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                    <PhoneInput placeholder="Enter phone number" disabled={isSubmitting} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="businessAddress"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Business Address</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="123 Main Street, City, State, ZIP"
                                        disabled={isSubmitting}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            {/* Location moved to dedicated Location tab */}

            <Card>
                <CardHeader>
                    <CardTitle>Social Networks</CardTitle>
                    <CardDescription>Your social media profiles</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <SocialNetworksSection form={form} isSubmitting={isSubmitting} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Working Hours</CardTitle>
                    <CardDescription>Configure your business operating hours for each day of the week</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <WorkingHoursSection form={form} isSubmitting={isSubmitting} />
                </CardContent>
            </Card>
        </div>
    );
}

// Email Settings Tab Component
function EmailSettingsTab({ form, emailProviders, isSubmitting }) {
    const selectedProvider = form.watch('emailProvider');

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Configuration
                </CardTitle>
                <CardDescription>Configure your email delivery settings</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <FormField
                    control={form.control}
                    name="emailProvider"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email Provider</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an email provider" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {emailProviders.map((provider) => (
                                        <SelectItem key={provider.id} value={provider.id}>
                                            {provider.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {selectedProvider === 'gmail' && (
                    <>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="emailUser"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Username</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="your-email@gmail.com"
                                                disabled={isSubmitting}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="emailPass"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="Your email password or app password"
                                                disabled={isSubmitting}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <p className="text-muted-foreground text-sm">
                            For Gmail, use an App Password instead of your regular password
                        </p>
                    </>
                )}

                {selectedProvider === 'none' && (
                    <div className="rounded-lg border bg-muted/50 p-4">
                        <p className="text-muted-foreground text-sm">
                            Email functionality is disabled. No email notifications will be sent.
                        </p>
                    </div>
                )}

                {selectedProvider === 'custom' && (
                    <div className="grid gap-4 rounded-lg border p-4">
                        <h4 className="font-medium">Custom SMTP Settings</h4>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="smtpHost"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SMTP Host</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="smtp.yourprovider.com"
                                                disabled={isSubmitting}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="smtpPort"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SMTP Port</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="587"
                                                disabled={isSubmitting}
                                                {...field}
                                                onChange={(e) =>
                                                    field.onChange(e.target.value ? parseInt(e.target.value, 10) : 587)
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="smtpSecure"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Secure Connection (SSL/TLS)</FormLabel>
                                        <FormDescription>Enable secure connection for SMTP</FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// OAuth Tab Component (merged Site Options + OAuth Providers)
function OAuthTab({ form, oauthProviders, isSubmitting }) {
    return (
        <div className="grid gap-6">
            {/* Application Settings Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Application Settings
                    </CardTitle>
                    <CardDescription>Control access and general application behavior</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <FormField
                        control={form.control}
                        name="baseUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Base URL</FormLabel>
                                <FormControl>
                                    <Input disabled={true} placeholder="https://yoursite.com" {...field} />
                                </FormControl>
                                <FormDescription>
                                    To change the URL, please update your environment NEXTAUTH_URL variable
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="allowRegistration"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Allow User Registration</FormLabel>
                                    <FormDescription>Allow new users to create accounts</FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        disabled={isSubmitting}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="enableFrontend"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Enable Frontend</FormLabel>
                                    <FormDescription>Allow access to the public-facing website</FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        disabled={isSubmitting}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            {/* OAuth Providers Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        OAuth Providers
                    </CardTitle>
                    <CardDescription>Configure third-party authentication providers</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                        {oauthProviders.map((provider) => (
                            <div key={provider.id} className="rounded-lg border p-4">
                                <div className="mb-4 flex items-center gap-2">
                                    <span className="text-2xl">{provider.icon}</span>
                                    <h4 className="font-medium">{provider.name}</h4>
                                    <FormField
                                        control={form.control}
                                        name={`providers.${provider.id}.enabled`}
                                        render={({ field }) => (
                                            <FormItem className="ml-auto">
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        disabled={isSubmitting}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <FormField
                                        control={form.control}
                                        name={`providers.${provider.id}.clientId`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Client ID</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder={`${provider.name} Client ID`}
                                                        {...field}
                                                        disabled={
                                                            !form.watch(`providers.${provider.id}.enabled`) ||
                                                            isSubmitting
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name={`providers.${provider.id}.clientSecret`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Client Secret</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder={`${provider.name} Client Secret`}
                                                        {...field}
                                                        disabled={
                                                            !form.watch(`providers.${provider.id}.enabled`) ||
                                                            isSubmitting
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Social Networks Section Component
function SocialNetworksSection({ form, isSubmitting }) {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'socialNetworks'
    });

    const addSocialNetwork = () => {
        append({ name: '', url: '' });
    };

    const removeSocialNetwork = (index) => {
        remove(index);
    };

    return (
        <div className="space-y-4">
            {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-3">
                    <FormField
                        control={form.control}
                        name={`socialNetworks.${index}.name`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Social Network Name</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Facebook, Twitter, Instagram, etc."
                                        disabled={isSubmitting}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name={`socialNetworks.${index}.url`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>URL</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://facebook.com/yourpage" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex items-end">
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeSocialNetwork(index)}
                            className="mb-2">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ))}

            <Button
                type="button"
                variant="outline"
                onClick={addSocialNetwork}
                disabled={isSubmitting}
                className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Social Network
            </Button>
        </div>
    );
}

// Working Hours Section Component
function WorkingHoursSection({ form, isSubmitting }) {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'workingHours'
    });

    const daysOfWeek = [
        { value: 'monday', label: 'Monday' },
        { value: 'tuesday', label: 'Tuesday' },
        { value: 'wednesday', label: 'Wednesday' },
        { value: 'thursday', label: 'Thursday' },
        { value: 'friday', label: 'Friday' },
        { value: 'saturday', label: 'Saturday' },
        { value: 'sunday', label: 'Sunday' }
    ];

    const timeOptions = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            timeOptions.push({ value: timeString, label: timeString });
        }
    }

    const addWorkingHours = () => {
        append({
            day: '',
            openTime: '09:00',
            closeTime: '17:00',
            isClosed: false
        });
    };

    const removeWorkingHours = (index) => {
        remove(index);
    };

    const addAllDays = () => {
        const existingDays = fields.map((field) => form.getValues(`workingHours.${fields.indexOf(field)}.day`));

        daysOfWeek.forEach((day) => {
            if (!existingDays.includes(day.value)) {
                append({
                    day: day.value,
                    openTime: '09:00',
                    closeTime: '17:00',
                    isClosed: false
                });
            }
        });
    };

    return (
        <div className="space-y-4 overflow-hidden">
            {fields.length === 0 && (
                <div className="py-8 text-center">
                    <div className="mb-4 text-muted-foreground">No working hours configured</div>
                    <Button type="button" variant="outline" onClick={addAllDays}>
                        Add All Days
                    </Button>
                </div>
            )}

            {fields.map((field, index) => {
                const isClosed = form.watch(`workingHours.${index}.isClosed`);

                return (
                    <div key={field.id} className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-5">
                        <FormField
                            control={form.control}
                            name={`workingHours.${index}.day`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Day</FormLabel>
                                    <Select
                                        className="w-full"
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={isSubmitting}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select day" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {daysOfWeek.map((day) => (
                                                <SelectItem key={day.value} value={day.value}>
                                                    {day.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name={`workingHours.${index}.openTime`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Open Time</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={isClosed || isSubmitting}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select time" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="max-h-60">
                                            {timeOptions.map((time) => (
                                                <SelectItem key={time.value} value={time.value}>
                                                    {time.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name={`workingHours.${index}.closeTime`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Close Time</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={isClosed || isSubmitting}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select time" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="max-h-60">
                                            {timeOptions.map((time) => (
                                                <SelectItem key={time.value} value={time.value}>
                                                    {time.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name={`workingHours.${index}.isClosed`}
                            render={({ field }) => (
                                <FormItem className="flex flex-col justify-end">
                                    <div className="flex items-center space-x-2 pt-6">
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                disabled={isSubmitting}
                                            />
                                        </FormControl>
                                        <FormLabel className="text-sm">Closed</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <div className="flex items-end">
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeWorkingHours(index)}
                                disabled={isSubmitting}
                                className="mb-2">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                );
            })}

            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={addWorkingHours}
                    disabled={isSubmitting}
                    className="flex-1">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Working Hours
                </Button>

                {fields.length > 0 && fields.length < 7 && (
                    <Button type="button" variant="outline" onClick={addAllDays} disabled={isSubmitting}>
                        Add All Days
                    </Button>
                )}
            </div>
        </div>
    );
}

// Web3 Tab Component
function Web3Tab({ form, isSubmitting }) {
    const web3Active = form.watch('web3Active');

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Boxes className="h-5 w-5" />
                    Web3 Configuration
                </CardTitle>
                <CardDescription>Configure blockchain and smart contract settings for Web3 integration</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <FormField
                    control={form.control}
                    name="web3Active"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Enable Web3 Integration</FormLabel>
                                <FormDescription>
                                    Activate blockchain functionality and smart contract interactions
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={isSubmitting}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                {web3Active && (
                    <div className="grid gap-4 rounded-lg border p-4">
                        <h4 className="font-medium">Blockchain Network Settings</h4>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="web3NetworkName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Network Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ethereum Mainnet" disabled={isSubmitting} {...field} />
                                        </FormControl>
                                        <FormDescription>Human-readable network name</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="web3ChainId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Chain ID</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="1"
                                                disabled={isSubmitting}
                                                {...field}
                                                onChange={(e) =>
                                                    field.onChange(e.target.value ? parseInt(e.target.value, 10) : 1)
                                                }
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Network chain ID (1=Mainnet, 11155111=Sepolia, 137=Polygon)
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="web3InfuraRpc"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>RPC Endpoint URL</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="https://mainnet.infura.io/v3/YOUR-PROJECT-ID"
                                            disabled={isSubmitting}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Blockchain RPC endpoint (Infura, Alchemy, or custom node)
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="web3ChainSymbol"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Native Currency Symbol</FormLabel>
                                        <FormControl>
                                            <Input placeholder="ETH" disabled={isSubmitting} {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Native blockchain currency (ETH, MATIC, BNB, etc.)
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="web3ContractSymbol"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Token Symbol</FormLabel>
                                        <FormControl>
                                            <Input placeholder="USDC" disabled={isSubmitting} {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Custom token symbol (if using ERC-20 contract)
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="web3ContractAddress"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Smart Contract Address</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="0xa0b86a33e6bd5c2a6ba7a898f0d6bab9a4b5c8f3"
                                            disabled={isSubmitting}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        ERC-20 token contract address (leave empty for native currency transactions)
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="rounded-lg border border-blue-200 bg-input p-4">
                            <h5 className="mb-2 font-medium">Security Note</h5>
                            <p className="text-sm">
                                Private keys and sensitive credentials are encrypted at rest in the database. Never
                                share your contract private keys or secrets publicly. Always use environment variables
                                or encrypted storage for production deployments.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Multi Language Selector Component
function MultiLanguageSelector({ languages, value, onChange, disabled, defaultLanguage, onDefaultLanguageChange }) {
    const handleLanguageClick = (langCode, event) => {
        if (disabled) return;

        const currentValues = value || [];
        const isSelected = currentValues.includes(langCode);

        // Double-click or Ctrl+click to set as default language
        if (event.detail === 2 || event.ctrlKey || event.metaKey) {
            if (onDefaultLanguageChange) {
                onDefaultLanguageChange(langCode);
                // Ensure the language is also selected
                if (!isSelected) {
                    const newValues = [...currentValues, langCode];
                    onChange(newValues);
                }
            }
            return;
        }

        // Single click to toggle selection
        if (langCode === defaultLanguage) {
            // Default language can be deselected, but a new default must be chosen from remaining languages
            if (currentValues.length > 1) {
                const newValues = currentValues.filter((code) => code !== langCode);
                const newDefault = newValues[0]; // First available language becomes new default
                onChange(newValues);
                if (onDefaultLanguageChange) {
                    onDefaultLanguageChange(newDefault);
                }
            }
            return;
        }

        let newValues;
        if (isSelected) {
            newValues = currentValues.filter((code) => code !== langCode);
        } else {
            newValues = [...currentValues, langCode];
        }

        // Always ensure default language is included
        if (!newValues.includes(defaultLanguage)) {
            newValues.unshift(defaultLanguage);
        }

        onChange(newValues);
    };

    return (
        <div className="space-y-3">
            <div className="text-muted-foreground text-sm">
                Click to select/deselect languages. Double-click or Ctrl+click to set as default language.
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {languages.map((lang) => {
                    const isSelected = value?.includes(lang.code) || lang.code === defaultLanguage;
                    const isDefault = lang.code === defaultLanguage;

                    return (
                        <div key={lang.code} className="relative">
                            <button
                                type="button"
                                onClick={(e) => handleLanguageClick(lang.code, e)}
                                disabled={disabled}
                                className={`w-full rounded-lg border p-2 text-left text-sm transition-colors ${
                                    isSelected
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border hover:border-primary/50'
                                } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${
                                    isDefault ? 'border-primary bg-primary/20 ring-2 ring-primary/30' : ''
                                }`}>
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{lang.name}</span>
                                    <div className="flex items-center gap-1">
                                        {isDefault && (
                                            <span className="rounded bg-primary px-1.5 py-0.5 text-primary-foreground text-xs">
                                                Default
                                            </span>
                                        )}
                                        <span
                                            className={`rounded px-1.5 py-0.5 text-xs ${
                                                isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                            }`}>
                                            {lang.code.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Skeleton Loading Component
function SystemSettingsSkeleton() {
    return (
        <ScrollArea className="h-[calc(100vh-80px)]">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-bold text-3xl">System Settings</h1>
                        <p className="text-muted-foreground">Configure your application settings</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <Skeleton className="h-10 w-full" />

                    <div className="grid gap-6">
                        <div className="rounded-lg border p-6">
                            <Skeleton className="mb-4 h-6 w-40" />
                            <div className="grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-20 w-full" />
                            </div>
                        </div>

                        <div className="rounded-lg border p-6">
                            <Skeleton className="mb-4 h-6 w-40" />
                            <div className="grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
            </div>
        </ScrollArea>
    );
}
