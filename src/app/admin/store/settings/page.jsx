"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; 
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { get, create, update } from "@/lib/client/query";
import { StoreSettingsSkeleton } from './StoreSettingsSkeleton';
// Country data for shipping/restrictions
import { countries } from "country-data-list";
import { CountryDropdown } from "@/components/ui/country-dropdown";

// Form validation schema
const storeSettingsSchema = z.object({
  // Business Details
  businessName: z.string().min(2, "Business name is required"),
  tvaNumber: z.string().optional(),
  address: z.string().min(5, "Business address is required"),
  
  // VAT Settings
  vatPercentage: z.number().min(0).max(100),
  vatIncludedInPrice: z.boolean(),
  applyVatAtCheckout: z.boolean(),
  
  // Payment Methods
  paymentMethods: z.object({
    cardPayments: z.boolean(),
    stripePublicKey: z.string().optional(),
    stripeSecretKey: z.string().optional(),
    bankTransfer: z.boolean(),
    payOnDelivery: z.boolean(),
  }),
  
  // Shipping Settings
  freeShippingEnabled: z.boolean(),
  freeShippingThreshold: z.number().optional(),
  internationalShipping: z.boolean(),
  allowedCountries: z.array(z.string().length(3)), // ISO 3166-1 alpha-3 codes
  bannedCountries: z.array(z.string().length(3)), // ISO 3166-1 alpha-3 codes
  
  // Store Settings
  currency: z.enum(["EUR", "USD", "GBP", "AUD", "CAD", "JPY"]),
});

export default function StoreSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAllowedCountries, setSelectedAllowedCountries] = useState([]);
  const [selectedBannedCountries, setSelectedBannedCountries] = useState([]);
  const [allowedOpen, setAllowedOpen] = useState(false);
  const [bannedOpen, setBannedOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      businessName: "",
      tvaNumber: "",
      address: "",
      vatPercentage: 0,
      vatIncludedInPrice: false,
      applyVatAtCheckout: true,
      paymentMethods: {
        cardPayments: false,
        stripePublicKey: "",
        stripeSecretKey: "",
        bankTransfer: false,
        payOnDelivery: false,
      },
      freeShippingEnabled: false,
      freeShippingThreshold: 0,
      internationalShipping: false,
      allowedCountries: [],
      bannedCountries: [],
      currency: "EUR",
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await get("store_settings", "current");
        if (settings) {
          if(settings?.error){
            toast.error("Failed to load store settings");
          }  
          form.reset(settings);
          setSelectedAllowedCountries(settings.allowedCountries || []);
          setSelectedBannedCountries(settings.bannedCountries || []);
        }
      } catch (error) {
        toast.error("Failed to load store settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [form]);

  const onSubmit = async (data) => {
    try {
      // Try to update first, if it fails (doesn't exist) then create
      try {
        await update("current", data, "store_settings");
      } catch {
        await create(data, "store_settings");
      }
      toast.success("Store settings updated successfully");
    } catch (error) {
      toast.error("Failed to update store settings");
    }
  };

  if (isLoading) {
    return <StoreSettingsSkeleton />;
  }

  return (
    <ScrollArea className="h-full">
      <div className="container space-y-4 pb-16">
        <div className="flex flex-col space-y-0.5">
          <h2 className="text-3xl font-bold">Store Settings</h2>
          <p className="text-muted-foreground">
            Manage your store's configuration and preferences
          </p>
        </div> 
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Business Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>
                  Enter your business details and VAT information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Business Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tvaNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TVA Number</FormLabel>
                      <FormControl>
                        <Input placeholder="TVA/VAT Number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Complete Business Address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* VAT Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle>VAT Configuration</CardTitle>
                <CardDescription>
                  Configure how VAT is handled in your store
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="vatPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VAT Percentage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="20"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vatIncludedInPrice"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          VAT Included in Price
                        </FormLabel>
                        <FormDescription>
                          Display product prices with VAT included
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="applyVatAtCheckout"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Apply VAT at Checkout
                        </FormLabel>
                        <FormDescription>
                          Calculate VAT during checkout process
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Payment Methods Card */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>
                  Configure available payment options for your customers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="paymentMethods.cardPayments"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Accept Card Payments (Stripe)
                        </FormLabel>
                        <FormDescription>
                          Process payments via Stripe
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {form.watch("paymentMethods.cardPayments") && (
                  <>
                    <FormField
                      control={form.control}
                      name="paymentMethods.stripePublicKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stripe Public Key</FormLabel>
                          <FormControl>
                            <Input placeholder="pk_..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="paymentMethods.stripeSecretKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stripe Secret Key</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="sk_..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                <FormField
                  control={form.control}
                  name="paymentMethods.bankTransfer"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Bank Transfer</FormLabel>
                        <FormDescription>
                          Accept bank transfer payments
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paymentMethods.payOnDelivery"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Pay on Delivery</FormLabel>
                        <FormDescription>
                          Allow customers to pay when receiving their order
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Shipping Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Configuration</CardTitle>
                <CardDescription>
                  Manage shipping options and delivery settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="freeShippingEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Free Shipping</FormLabel>
                        <FormDescription>
                          Offer free shipping to customers
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {form.watch("freeShippingEnabled") && (
                  <FormField
                    control={form.control}
                    name="freeShippingThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Free Shipping Threshold (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="100"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum order amount for free shipping
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="internationalShipping"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          International Shipping
                        </FormLabel>
                        <FormDescription>
                          Enable shipping to international destinations
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Countries Configuration Card */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Countries</CardTitle>
                <CardDescription>
                  Configure allowed and restricted shipping destinations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="allowedCountries"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Allowed Countries</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap gap-2">
                          <div className="flex-grow">
                            <CountryDropdown
                              onChange={(country) => {
                                const values = new Set(field.value || []);
                                if (!values.has(country.alpha3)) {
                                  values.add(country.alpha3);
                                  field.onChange(Array.from(values));
                                }
                              }}
                              placeholder="Select countries..."
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Select countries where shipping is allowed
                      </FormDescription>
                      <FormMessage />
                      {field.value?.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-2">
                          {field.value.map((countryCode) => {
                            const country = countries.all.find(
                              (c) => c.alpha3 === countryCode
                            );
                            return (
                              country && (
                                <Badge
                                  key={countryCode}
                                  variant="secondary"
                                  className="mr-1 mb-1 flex items-center gap-2"
                                >
                                  <span>{country.name}</span>
                                  <button
                                    type="button"
                                    className="hover:text-destructive"
                                    onClick={() => {
                                      const values = field.value.filter(
                                        (c) => c !== countryCode
                                      );
                                      field.onChange(values);
                                    }}
                                  >
                                    ×
                                  </button>
                                </Badge>
                              )
                            );
                          })}
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bannedCountries"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Banned Countries</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap gap-2">
                          <div className="flex-grow">
                            <CountryDropdown
                              onChange={(country) => {
                                const values = new Set(field.value || []);
                                if (!values.has(country.alpha3)) {
                                  values.add(country.alpha3);
                                  field.onChange(Array.from(values));
                                }
                              }}
                              placeholder="Select countries..."
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Select countries where shipping is not allowed
                      </FormDescription>
                      <FormMessage />
                      {field.value?.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-2">
                          {field.value.map((countryCode) => {
                            const country = countries.all.find(
                              (c) => c.alpha3 === countryCode
                            );
                            return (
                              country && (
                                <Badge
                                  key={countryCode}
                                  variant="secondary"
                                  className="mr-1 mb-1 flex items-center gap-2"
                                >
                                  <span>{country.name}</span>
                                  <button
                                    type="button"
                                    className="hover:text-destructive"
                                    onClick={() => {
                                      const values = field.value.filter(
                                        (c) => c !== countryCode
                                      );
                                      field.onChange(values);
                                    }}
                                  >
                                    ×
                                  </button>
                                </Badge>
                              )
                            );
                          })}
                        </div>
                      )}
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Store Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle>Store Settings</CardTitle>
                <CardDescription>
                  Configure general store settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Currency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="AUD">AUD (A$)</SelectItem>
                          <SelectItem value="CAD">CAD (C$)</SelectItem>
                          <SelectItem value="JPY">JPY (¥)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the default currency for your store
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" size="lg">
                Save Settings
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </ScrollArea>
  );
}

