"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getAll, create, update } from "@/lib/client/query";
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
  Globe,
  Mail,
  Settings,
  Users,
  MapPin,
  Phone,
  Building,
  Languages,
  Shield,
  Database,
  Key
} from "lucide-react";

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
  { id: "outlook", name: "Outlook", service: "hotmail" },
  { id: "yahoo", name: "Yahoo", service: "yahoo" },
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
  socialNetworks: z.object({
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    instagram: z.string().optional(),
    linkedin: z.string().optional(),
    youtube: z.string().optional()
  }),
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
  }))
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
      socialNetworks: {
        facebook: "",
        twitter: "",
        instagram: "",
        linkedin: "",
        youtube: ""
      },
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
      }), {})
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
          socialNetworks: settings.socialNetworks || {
            facebook: "",
            twitter: "",
            instagram: "",
            linkedin: "",
            youtube: ""
          },
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
          }), {})
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

  const handleCountryChange = (countryCode) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      form.setValue("country", countryCode);
      form.setValue("countryIso", country.iso);
    }
  };

  if (isLoading) {
    return <SystemSettingsSkeleton />;
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">
            Configure your application settings
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="site" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Site Settings
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Settings
              </TabsTrigger>
              <TabsTrigger value="options" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Site Options
              </TabsTrigger>
              <TabsTrigger value="providers" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                OAuth Providers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="site" className="space-y-6">
              <SiteSettingsTab form={form} countries={countries} languages={languages} onCountryChange={handleCountryChange} />
            </TabsContent>

            <TabsContent value="email" className="space-y-6">
              <EmailSettingsTab form={form} emailProviders={emailProviders} />
            </TabsContent>

            <TabsContent value="options" className="space-y-6">
              <SiteOptionsTab form={form} />
            </TabsContent>

            <TabsContent value="providers" className="space-y-6">
              <ProvidersTab form={form} oauthProviders={oauthProviders} />
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
  );
}

// Site Settings Tab Component
function SiteSettingsTab({ form, countries, languages, onCountryChange }) {
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
                  <Input placeholder="+1 (555) 123-4567" {...field} />
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
                    <Input 
                      type="number" 
                      step="any" 
                      placeholder="40.7128" 
                      {...field}
                      onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
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
                  <Select onValueChange={onCountryChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
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
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Language *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="socialNetworks.facebook"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facebook</FormLabel>
                  <FormControl>
                    <Input placeholder="https://facebook.com/yourpage" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socialNetworks.twitter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>X (Twitter)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://x.com/youraccount" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socialNetworks.instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram</FormLabel>
                  <FormControl>
                    <Input placeholder="https://instagram.com/youraccount" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socialNetworks.linkedin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn</FormLabel>
                  <FormControl>
                    <Input placeholder="https://linkedin.com/company/yourcompany" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socialNetworks.youtube"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube</FormLabel>
                  <FormControl>
                    <Input placeholder="https://youtube.com/@yourchannel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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
                <FormDescription>
                  For Gmail, use an App Password instead of your regular password
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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

// Site Options Tab Component
function SiteOptionsTab({ form }) {
  return (
    <div className="grid gap-6">
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
                <FormLabel>Base URL *</FormLabel>
                <FormControl>
                  <Input placeholder="https://yoursite.com" {...field} />
                </FormControl>
                <FormDescription>
                  The base URL of your application
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
    </div>
  );
}

// OAuth Providers Tab Component
function ProvidersTab({ form, oauthProviders }) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            OAuth Provider Configuration
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