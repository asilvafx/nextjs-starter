"use client";
import { useState, useEffect} from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getAll, create, update } from "@/lib/client/query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Mail,
  Settings, 
  MapPin, 
  Boxes,
  Plus,
  Trash2,
  Building, 
  Shield,
  Database,
  Key,
  Locate
} from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { CountryDropdown } from "@/components/ui/country-dropdown";
import { LanguageSelector } from "@/components/ui/language-selector";

// Country data
const countries = [
  { code: "US", name: "United States", iso: "USA" },
  { code: "GB", name: "United Kingdom", iso: "GBR" },
  { code: "DE", name: "Germany", iso: "DEU" },
  { code: "FR", name: "France", iso: "FRA" },
  { code: "ES", name: "Spain", iso: "ESP" },
  { code: "IT", name: "Italy", iso: "ITA" },
  { code: "CA", name: "Canada", iso: "CAN" },
  { code: "AU", name: "Australia", iso: "AUS" },
  { code: "JP", name: "Japan", iso: "JPN" },
  { code: "BR", name: "Brazil", iso: "BRA" }
];

// Languages data
const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" }
];

// Email providers
const emailProviders = [
  { id: "gmail", name: "Gmail", service: "gmail" }, 
  { id: "custom", name: "Custom SMTP", service: null }
];

// OAuth providers
const oauthProviders = [
  { id: "google", name: "Google", icon: "🔵" },
  { id: "github", name: "GitHub", icon: "⚫" },
  { id: "facebook", name: "Facebook", icon: "🔵" },
  { id: "twitter", name: "X (Twitter)", icon: "⚫" },
  { id: "discord", name: "Discord", icon: "🟣" },
  { id: "linkedin", name: "LinkedIn", icon: "🔵" }
];

// Form validation schema
const systemSettingsSchema = z.object({
  // Site Settings
  siteName: z.string().min(1, "Site name is required"),
  siteEmail: z.string().email("Valid email is required"),
  sitePhone: z.string().optional(),
  businessAddress: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  country: z.string().min(2, "Country is required"),
  countryIso: z.string().min(3, "Country ISO is required"),
  language: z.string().min(2, "Language is required"),
  socialNetworks: z.array(z.object({
    name: z.string().min(1, "Social network name is required"),
    url: z.string().url("Valid URL is required")
  })).optional(),
  workingHours: z.array(z.object({
    day: z.string().min(1, "Day is required"),
    openTime: z.string().min(1, "Open time is required"),
    closeTime: z.string().min(1, "Close time is required"),
    isClosed: z.boolean().optional()
  })).optional(),
  serviceArea: z.string().optional(),
  serviceRadius: z.number().optional(),
  
  // Email Settings
  emailProvider: z.string().min(1, "Email provider is required"),
  emailUser: z.string().optional(),
  emailPass: z.string().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpSecure: z.boolean().optional(),
  
  // Site Options
  allowRegistration: z.boolean(),
  enableFrontend: z.boolean(),
  baseUrl: z.string().url("Valid URL is required"),
  
  // Account Providers
  providers: z.record(z.object({
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    enabled: z.boolean()
  })),
  
  // Web3 Settings
  web3Active: z.boolean().optional(),
  web3ContractAddress: z.string().optional(),
  web3ContractSymbol: z.string().optional(),
  web3ChainSymbol: z.string().optional(),
  web3InfuraRpc: z.string().optional(),
  web3ChainId: z.number().optional(),
  web3NetworkName: z.string().optional()
});

export default function SystemSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [settingsId, setSettingsId] = useState(null);
  const [activeTab, setActiveTab] = useState("site");

  const form = useForm({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: {
      siteName: "",
      siteEmail: "",
      sitePhone: "",
      businessAddress: "",
      latitude: undefined,
      longitude: undefined,
      country: "",
      countryIso: "",
      language: "en",
      socialNetworks: [],
      workingHours: [],
      serviceArea: "",
      serviceRadius: undefined,
      emailProvider: "gmail",
      emailUser: "",
      emailPass: "",
      smtpHost: "",
      smtpPort: 587,
      smtpSecure: false,
      allowRegistration: true,
      enableFrontend: true,
      baseUrl: typeof window !== "undefined" ? window.location.origin : "",
      providers: oauthProviders.reduce((acc, provider) => ({
        ...acc,
        [provider.id]: { clientId: "", clientSecret: "", enabled: false }
      }), {}),
      web3Active: false,
      web3ContractAddress: "",
      web3ContractSymbol: "",
      web3ChainSymbol: "",
      web3InfuraRpc: "",
      web3ChainId: 1,
      web3NetworkName: "Ethereum Mainnet"
    }
  });

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await getAll("site_settings");
      
      if (response?.success && response.data?.length > 0) {
        const settings = response.data[0];
        setSettingsId(settings.id);
        
        // Reset form with fetched data
        form.reset({
          siteName: settings.siteName || "",
          siteEmail: settings.siteEmail || "",
          sitePhone: settings.sitePhone || "",
          businessAddress: settings.businessAddress || "",
          latitude: settings.latitude,
          longitude: settings.longitude,
          country: settings.country || "",
          countryIso: settings.countryIso || "",
          language: settings.language || "en",
          socialNetworks: settings.socialNetworks || [],
          workingHours: settings.workingHours || [],
          serviceArea: settings.serviceArea || "",
          serviceRadius: settings.serviceRadius,
          emailProvider: settings.emailProvider || "gmail",
          emailUser: settings.emailUser || "",
          emailPass: settings.emailPass || "",
          smtpHost: settings.smtpHost || "",
          smtpPort: settings.smtpPort || 587,
          smtpSecure: settings.smtpSecure || false,
          allowRegistration: settings.allowRegistration ?? true,
          enableFrontend: settings.enableFrontend ?? true,
          baseUrl: settings.baseUrl || (typeof window !== "undefined" ? window.location.origin : ""),
          providers: settings.providers || oauthProviders.reduce((acc, provider) => ({
            ...acc,
            [provider.id]: { clientId: "", clientSecret: "", enabled: false }
          }), {}),
          web3Active: settings.web3Active || false,
          web3ContractAddress: settings.web3ContractAddress || "",
          web3ContractSymbol: settings.web3ContractSymbol || "",
          web3ChainSymbol: settings.web3ChainSymbol || "",
          web3InfuraRpc: settings.web3InfuraRpc || "",
          web3ChainId: settings.web3ChainId || 1,
          web3NetworkName: settings.web3NetworkName || "Ethereum Mainnet"
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const onSubmit = async (data) => {
    try {
      if (settingsId) {
        await update(settingsId, data, "site_settings");
        toast.success("Settings updated successfully");
      } else {
        const result = await create(data, "site_settings");
        setSettingsId(result.id);
        toast.success("Settings created successfully");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
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

  const handleCountryChange = (countryCode) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      form.setValue("country", countryCode);
      form.setValue("countryIso", country.iso);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          form.setValue("latitude", latitude);
          form.setValue("longitude", longitude);
          toast.success(`Location set: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Unable to get current location. Please check your browser permissions.");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000 // 10 minutes
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser.");
    }
  };

    if (isLoading) {
    return <SystemSettingsSkeleton />;
  }

  return (

    <ScrollArea className="h-[calc(100vh-80px)]">
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">
            Configure your application settings
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onFormError)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="site" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Site
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="oauth" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                OAuth
              </TabsTrigger>
              <TabsTrigger value="web3" className="flex items-center gap-2">
                <Boxes className="h-4 w-4" />
                Web3
              </TabsTrigger>
            </TabsList>

            <TabsContent value="site" className="space-y-6">
              <SiteSettingsTab form={form} countries={countries} languages={languages} onCountryChange={handleCountryChange} getCurrentLocation={getCurrentLocation} />
            </TabsContent>

            <TabsContent value="email" className="space-y-6">
              <EmailSettingsTab form={form} emailProviders={emailProviders} />
            </TabsContent>

            <TabsContent value="oauth" className="space-y-6">
              <OAuthTab form={form} oauthProviders={oauthProviders} />
            </TabsContent>

            <TabsContent value="web3" className="space-y-6">
              <Web3Tab form={form} />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button type="submit" size="lg">
              <Database className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </form>
      </Form>
    </div>
    </ScrollArea>
  );
}

// Site Settings Tab Component
function SiteSettingsTab({ form, countries, languages, onCountryChange, getCurrentLocation }) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Business Information
          </CardTitle>
          <CardDescription>
            Basic information about your business and website
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="siteName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="My Awesome Site" {...field} />
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
                    <Input type="email" placeholder="contact@example.com" {...field} />
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
                  <PhoneInput placeholder="Enter phone number" {...field} />
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
                  <Textarea placeholder="123 Main Street, City, State, ZIP" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location & Service Area
          </CardTitle>
          <CardDescription>
            Geographic information and service coverage
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        {...field}
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={getCurrentLocation}
                        className="px-3"
                        title="Get current location"
                      >
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
                      {...field}
                      onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country *</FormLabel>
                  <FormControl>
                    <CountryDropdown 
                      defaultValue={field.value} 
                      onChange={(country) => {
                        const countryCode = country.alpha2.toUpperCase();
                        field.onChange(countryCode);
                        // Update the form with country code and ISO
                        form.setValue("country", countryCode);
                        form.setValue("countryIso", country.alpha3);
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
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Language *</FormLabel>
                  <FormControl>
                    <LanguageSelector 
                      languages={languages} 
                      value={field.value}
                      onChange={field.onChange}
                      slim={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="serviceArea"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Area</FormLabel>
                  <FormControl>
                    <Input placeholder="Metropolitan Area" {...field} />
                  </FormControl>
                  <FormDescription>
                    Describe your service coverage area
                  </FormDescription>
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
                      {...field}
                      onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum distance for services (in kilometers)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Networks</CardTitle>
          <CardDescription>
            Your social media profiles
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <SocialNetworksSection form={form} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Working Hours</CardTitle>
          <CardDescription>
            Configure your business operating hours for each day of the week
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <WorkingHoursSection form={form} />
        </CardContent>
      </Card>
    </div>
  );
}

// Email Settings Tab Component
function EmailSettingsTab({ form, emailProviders }) {
  const selectedProvider = form.watch("emailProvider");
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Configuration
        </CardTitle>
        <CardDescription>
          Configure your email delivery settings
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <FormField
          control={form.control}
          name="emailProvider"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Provider *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="emailUser"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Username *</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="your-email@gmail.com" 
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
                <FormLabel>Email Password *</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="Your email password or app password" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <p className="text-sm text-muted-foreground">
          For Gmail, use an App Password instead of your regular password
        </p>

        {selectedProvider === "custom" && (
          <div className="grid gap-4 p-4 border rounded-lg">
            <h4 className="font-medium">Custom SMTP Settings</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="smtpHost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SMTP Host</FormLabel>
                    <FormControl>
                      <Input placeholder="smtp.yourprovider.com" {...field} />
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
                        {...field}
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : 587)}
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
                    <FormDescription>
                      Enable secure connection for SMTP
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
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
function OAuthTab({ form, oauthProviders }) {
  return (
    <div className="grid gap-6">
      {/* Application Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Application Settings
          </CardTitle>
          <CardDescription>
            Control access and general application behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <FormField
            control={form.control}
            name="baseUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base URL</FormLabel>
                <FormControl>
                  <Input disabled placeholder="https://yoursite.com" {...field} />
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
                  <FormDescription>
                    Allow new users to create accounts
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                  <FormDescription>
                    Allow access to the public-facing website
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
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
          <CardDescription>
            Configure third-party authentication providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {oauthProviders.map((provider) => (
              <div key={provider.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{provider.icon}</span>
                  <h4 className="font-medium">{provider.name}</h4>
                  <FormField
                    control={form.control}
                    name={`providers.${provider.id}.enabled`}
                    render={({ field }) => (
                      <FormItem className="ml-auto">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            disabled={!form.watch(`providers.${provider.id}.enabled`)}
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
                            disabled={!form.watch(`providers.${provider.id}.enabled`)}
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
function SocialNetworksSection({ form }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "socialNetworks"
  });

  const addSocialNetwork = () => {
    append({ name: "", url: "" });
  };

  const removeSocialNetwork = (index) => {
    remove(index);
  };

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
          <FormField
            control={form.control}
            name={`socialNetworks.${index}.name`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Social Network Name</FormLabel>
                <FormControl>
                  <Input placeholder="Facebook, Twitter, Instagram, etc." {...field} />
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
              className="mb-2"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      
      <Button
        type="button"
        variant="outline"
        onClick={addSocialNetwork}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Social Network
      </Button>
    </div>
  );
}

// Working Hours Section Component
function WorkingHoursSection({ form }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "workingHours"
  });

  const daysOfWeek = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" }
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
      day: "", 
      openTime: "09:00", 
      closeTime: "17:00", 
      isClosed: false 
    });
  };

  const removeWorkingHours = (index) => {
    remove(index);
  };

  const addAllDays = () => {
    const existingDays = fields.map(field => form.getValues(`workingHours.${fields.indexOf(field)}.day`));
    
    daysOfWeek.forEach(day => {
      if (!existingDays.includes(day.value)) {
        append({
          day: day.value,
          openTime: "09:00",
          closeTime: "17:00",
          isClosed: false
        });
      }
    });
  };

  return (
    <div className="overflow-hidden space-y-4">
      {fields.length === 0 && (
        <div className="text-center py-8">
          <div className="text-muted-foreground mb-4">
            No working hours configured
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={addAllDays}
          >
            Add All Days
          </Button>
        </div>
      )}

      {fields.map((field, index) => {
        const isClosed = form.watch(`workingHours.${index}.isClosed`);
        
        return (
          <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
            <FormField
              control={form.control}
              name={`workingHours.${index}.day`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Day</FormLabel>
                  <Select className="w-full" onValueChange={field.onChange} value={field.value}>
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
                  <Select onValueChange={field.onChange} value={field.value} disabled={isClosed}>
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
                  <Select onValueChange={field.onChange} value={field.value} disabled={isClosed}>
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
                className="mb-2"
              >
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
          className="flex-1"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Working Hours
        </Button>
        
        {fields.length > 0 && fields.length < 7 && (
          <Button
            type="button"
            variant="outline"
            onClick={addAllDays}
          >
            Add All Days
          </Button>
        )}
      </div>
    </div>
  );
}

// Web3 Tab Component
function Web3Tab({ form }) {
  const web3Active = form.watch("web3Active");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Boxes className="h-5 w-5" />
          Web3 Configuration
        </CardTitle>
        <CardDescription>
          Configure blockchain and smart contract settings for Web3 integration
        </CardDescription>
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
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {web3Active && (
          <div className="grid gap-4 p-4 border rounded-lg">
            <h4 className="font-medium">Blockchain Network Settings</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="web3NetworkName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Network Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Ethereum Mainnet" {...field} />
                    </FormControl>
                    <FormDescription>
                      Human-readable network name
                    </FormDescription>
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
                        {...field}
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : 1)}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="web3ChainSymbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Native Currency Symbol</FormLabel>
                    <FormControl>
                      <Input placeholder="ETH" {...field} />
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
                      <Input placeholder="USDC" {...field} />
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

            <div className="p-4 bg-input border border-blue-200 rounded-lg">
              <h5 className="font-medium mb-2">Security Note</h5>
              <p className="text-sm">
                Private keys and sensitive credentials are encrypted at rest in the database. Never share your contract private keys or secrets publicly. Always use environment variables or encrypted storage for production deployments.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Skeleton Loading Component
function SystemSettingsSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
      </div>

      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        
        <div className="grid gap-6">
          <div className="border rounded-lg p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
          
          <div className="border rounded-lg p-6">
            <Skeleton className="h-6 w-40 mb-4" />
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
  );
}