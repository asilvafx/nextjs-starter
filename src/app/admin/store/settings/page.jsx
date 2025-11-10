// @/app/admin/store/settings/page.jsx

'use client';

// Country data for shipping/restrictions
import { countries } from 'country-data-list';
import {
    Building,
    CreditCard,
    DollarSign,
    Globe,
    Loader2,
    Package,
    Plus,
    Settings,
    Store,
    Truck,
    X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import AdminHeader from '@/app/admin/components/AdminHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CountryDropdown } from '@/components/ui/country-dropdown';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Form components removed - using traditional React state management
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { create, getAll, update } from '@/lib/client/query';

// Default form state
const defaultFormState = {
    businessName: '',
    tvaNumber: '',
    address: '',
    vatEnabled: true,
    vatPercentage: 20,
    vatIncludedInPrice: true,
    applyVatAtCheckout: false,
    paymentMethods: {
        cardPayments: false,
        stripePublicKey: '',
        stripeSecretKey: '',
        bankTransfer: false,
        bankTransferDetails: {
            bankName: '',
            accountHolder: '',
            iban: '',
            bic: '',
            additionalInstructions: ''
        },
        payOnDelivery: false
    },
    freeShippingEnabled: false,
    freeShippingThreshold: 50,
    internationalShipping: false,
    allowedCountries: [],
    bannedCountries: [],
    carriers: [],
    currency: 'EUR'
};

export default function StoreSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [settingsId, setSettingsId] = useState(null);
    const [formData, setFormData] = useState(defaultFormState);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedAllowedCountries, setSelectedAllowedCountries] = useState([]);
    const [selectedBannedCountries, setSelectedBannedCountries] = useState([]);
    const [carriers, setCarriers] = useState([]);
    const [_allowedOpen, _setAllowedOpen] = useState(false);
    const [_bannedOpen, _setBannedOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('business');
    const fetchedRef = useRef(false);

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value
        }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const handleNestedInputChange = (parent, field, value) => {
        setFormData((prev) => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [field]: value
            }
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.businessName || formData.businessName.length < 2) {
            newErrors.businessName = 'Business name is required (minimum 2 characters)';
        }

        if (formData.vatPercentage < 0 || formData.vatPercentage > 100) {
            newErrors.vatPercentage = 'VAT percentage must be between 0 and 100';
        }

        if (formData.freeShippingEnabled && (!formData.freeShippingThreshold || formData.freeShippingThreshold <= 0)) {
            newErrors.freeShippingThreshold = 'Free shipping threshold must be greater than 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        const fetchSettings = async () => {
            // Skip if already fetched
            if (fetchedRef.current) return;

            try {
                // Mark as fetched immediately to prevent race conditions
                fetchedRef.current = true;

                const settings = await getAll('store_settings');
                const settingsData = settings?.data[0];

                console.log(settings);

                if (settings.success && settingsData?.id) {
                    setSettingsId(settingsData?.id);
                    setFormData({
                        businessName: settingsData.businessName || '',
                        tvaNumber: settingsData.tvaNumber || '',
                        address: settingsData.address || '',
                        vatPercentage: settingsData.vatPercentage || 20,
                        vatIncludedInPrice: settingsData.vatIncludedInPrice !== false,
                        applyVatAtCheckout: settingsData.applyVatAtCheckout || false,
                        paymentMethods: {
                            cardPayments: settingsData.paymentMethods?.cardPayments || false,
                            stripePublicKey: settingsData.paymentMethods?.stripePublicKey || '',
                            stripeSecretKey: settingsData.paymentMethods?.stripeSecretKey || '',
                            bankTransfer: settingsData.paymentMethods?.bankTransfer || false,
                            payOnDelivery: settingsData.paymentMethods?.payOnDelivery || false
                        },
                        freeShippingEnabled: settingsData.freeShippingEnabled || false,
                        freeShippingThreshold: settingsData.freeShippingThreshold || 50,
                        internationalShipping: settingsData.internationalShipping || false,
                        allowedCountries: settingsData.allowedCountries || [],
                        bannedCountries: settingsData.bannedCountries || [],
                        carriers: settingsData.carriers || [],
                        currency: settingsData.currency || 'EUR'
                    });
                    setSelectedAllowedCountries(settingsData.allowedCountries || []);
                    setSelectedBannedCountries(settingsData.bannedCountries || []);
                    setCarriers(settingsData.carriers || []);
                }
            } catch (error) {
                // Reset fetched flag on error so it can try again
                fetchedRef.current = false;
                toast.error('Failed to load store settings');
                console.error('Store settings error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const onSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the validation errors');
            return;
        }

        setIsSubmitting(true);
        try {
            const submissionData = {
                ...formData,
                allowedCountries: selectedAllowedCountries,
                bannedCountries: selectedBannedCountries,
                carriers: carriers
            };

            if (settingsId) {
                await update(settingsId, submissionData, 'store_settings');
            } else {
                await create(submissionData, 'store_settings');
            }

            toast.success('Store settings saved successfully!');
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Failed to save settings');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <StoreSettingsSkeleton />;
    }

    return (
        <div className="space-y-4">
            <AdminHeader title="Store Settings" description="Manage your store's configuration and preferences" />

            <form onSubmit={onSubmit} className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="business" className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Business
                        </TabsTrigger>
                        <TabsTrigger value="payments" className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Payments
                        </TabsTrigger>
                        <TabsTrigger value="shipping" className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            Shipping
                        </TabsTrigger>
                        <TabsTrigger value="general" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            General
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="business" className="space-y-6">
                        <BusinessTab
                            formData={formData}
                            handleInputChange={handleInputChange}
                            handleNestedInputChange={handleNestedInputChange}
                            errors={errors}
                        />
                    </TabsContent>

                    <TabsContent value="payments" className="space-y-6">
                        <PaymentsTab
                            formData={formData}
                            handleNestedInputChange={handleNestedInputChange}
                            errors={errors}
                        />
                    </TabsContent>

                    <TabsContent value="shipping" className="space-y-6">
                        <ShippingTab
                            formData={formData}
                            handleInputChange={handleInputChange}
                            selectedAllowedCountries={selectedAllowedCountries}
                            selectedBannedCountries={selectedBannedCountries}
                            setSelectedAllowedCountries={setSelectedAllowedCountries}
                            setSelectedBannedCountries={setSelectedBannedCountries}
                            carriers={carriers}
                            setCarriers={setCarriers}
                            errors={errors}
                        />
                    </TabsContent>

                    <TabsContent value="general" className="space-y-6">
                        <GeneralTab formData={formData} handleInputChange={handleInputChange} errors={errors} />
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end">
                    <Button type="submit" size="lg" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Store className="mr-2 h-4 w-4" />
                                Save Settings
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}

// Business Tab Component
function BusinessTab({ formData, handleInputChange, handleNestedInputChange, errors }) {
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Business Information
                    </CardTitle>
                    <CardDescription>Enter your business details and VAT information</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <Label htmlFor="businessName">Business Name</Label>
                            <Input
                                id="businessName"
                                placeholder="Your Business Name"
                                value={formData.businessName}
                                onChange={(e) => handleInputChange('businessName', e.target.value)}
                            />
                            {errors.businessName && <p className="mt-1 text-red-500 text-sm">{errors.businessName}</p>}
                        </div>
                        <div>
                            <Label htmlFor="tvaNumber">TVA Number</Label>
                            <Input
                                id="tvaNumber"
                                placeholder="TVA/VAT Number"
                                value={formData.tvaNumber}
                                onChange={(e) => handleInputChange('tvaNumber', e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="address">Business Address</Label>
                        <Input
                            id="address"
                            placeholder="Complete Business Address"
                            value={formData.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        VAT Configuration
                    </CardTitle>
                    <CardDescription>Configure how VAT is handled in your store</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Enable VAT/TVA</Label>
                            <p className="text-muted-foreground text-sm">
                                Enable or disable VAT/TVA calculations for your store
                            </p>
                        </div>
                        <Switch
                            checked={formData.vatEnabled}
                            onCheckedChange={(checked) => handleInputChange('vatEnabled', checked)}
                        />
                    </div>

                    {formData.vatEnabled && (
                        <>
                            <div>
                                <Label htmlFor="vatPercentage">VAT Percentage</Label>
                                <Input
                                    id="vatPercentage"
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="20"
                                    value={formData.vatPercentage}
                                    onChange={(e) =>
                                        handleInputChange('vatPercentage', parseFloat(e.target.value) || 0)
                                    }
                                />
                                {errors.vatPercentage && (
                                    <p className="mt-1 text-red-500 text-sm">{errors.vatPercentage}</p>
                                )}
                            </div>

                            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">VAT Included in Price</Label>
                                    <p className="text-muted-foreground text-sm">
                                        Display product prices with VAT included
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.vatIncludedInPrice}
                                    onCheckedChange={(checked) => handleInputChange('vatIncludedInPrice', checked)}
                                />
                            </div>

                            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Apply VAT at Checkout</Label>
                                    <p className="text-muted-foreground text-sm">
                                        Calculate VAT during checkout process (only if VAT not included in price)
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.applyVatAtCheckout}
                                    onCheckedChange={(checked) => handleInputChange('applyVatAtCheckout', checked)}
                                    disabled={formData.vatIncludedInPrice}
                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// Payments Tab Component
function PaymentsTab({ formData, handleNestedInputChange, errors }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Methods
                </CardTitle>
                <CardDescription>Configure available payment options for your customers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label className="text-base">Accept Card Payments (Stripe)</Label>
                        <p className="text-muted-foreground text-sm">Process payments via Stripe</p>
                    </div>
                    <Switch
                        checked={formData.paymentMethods?.cardPayments || false}
                        onCheckedChange={(checked) =>
                            handleNestedInputChange('paymentMethods', 'cardPayments', checked)
                        }
                    />
                </div>
                {formData.paymentMethods?.cardPayments && (
                    <>
                        <div>
                            <Label htmlFor="stripePublicKey">Stripe Public Key</Label>
                            <Input
                                id="stripePublicKey"
                                placeholder="pk_..."
                                value={formData.paymentMethods?.stripePublicKey || ''}
                                onChange={(e) =>
                                    handleNestedInputChange('paymentMethods', 'stripePublicKey', e.target.value)
                                }
                            />
                        </div>
                        <div>
                            <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
                            <Input
                                id="stripeSecretKey"
                                type="password"
                                placeholder="sk_..."
                                value={formData.paymentMethods?.stripeSecretKey || ''}
                                onChange={(e) =>
                                    handleNestedInputChange('paymentMethods', 'stripeSecretKey', e.target.value)
                                }
                            />
                        </div>
                    </>
                )}
                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label className="text-base">Bank Transfer</Label>
                        <p className="text-muted-foreground text-sm">Accept bank transfer payments</p>
                    </div>
                    <Switch
                        checked={formData.paymentMethods?.bankTransfer || false}
                        onCheckedChange={(checked) =>
                            handleNestedInputChange('paymentMethods', 'bankTransfer', checked)
                        }
                    />
                </div>
                {formData.paymentMethods?.bankTransfer && (
                    <>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <Label htmlFor="bankName">Bank Name</Label>
                                <Input
                                    id="bankName"
                                    placeholder="Bank Name"
                                    value={formData.paymentMethods?.bankTransferDetails?.bankName || ''}
                                    onChange={(e) => {
                                        const newDetails = {
                                            ...formData.paymentMethods?.bankTransferDetails,
                                            bankName: e.target.value
                                        };
                                        handleNestedInputChange('paymentMethods', 'bankTransferDetails', newDetails);
                                    }}
                                />
                            </div>
                            <div>
                                <Label htmlFor="accountHolder">Account Holder</Label>
                                <Input
                                    id="accountHolder"
                                    placeholder="Account Holder Name"
                                    value={formData.paymentMethods?.bankTransferDetails?.accountHolder || ''}
                                    onChange={(e) => {
                                        const newDetails = {
                                            ...formData.paymentMethods?.bankTransferDetails,
                                            accountHolder: e.target.value
                                        };
                                        handleNestedInputChange('paymentMethods', 'bankTransferDetails', newDetails);
                                    }}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <Label htmlFor="iban">IBAN</Label>
                                <Input
                                    id="iban"
                                    placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                                    value={formData.paymentMethods?.bankTransferDetails?.iban || ''}
                                    onChange={(e) => {
                                        const newDetails = {
                                            ...formData.paymentMethods?.bankTransferDetails,
                                            iban: e.target.value
                                        };
                                        handleNestedInputChange('paymentMethods', 'bankTransferDetails', newDetails);
                                    }}
                                />
                            </div>
                            <div>
                                <Label htmlFor="bic">BIC/SWIFT</Label>
                                <Input
                                    id="bic"
                                    placeholder="BNPAFRPPXXX"
                                    value={formData.paymentMethods?.bankTransferDetails?.bic || ''}
                                    onChange={(e) => {
                                        const newDetails = {
                                            ...formData.paymentMethods?.bankTransferDetails,
                                            bic: e.target.value
                                        };
                                        handleNestedInputChange('paymentMethods', 'bankTransferDetails', newDetails);
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="additionalInstructions">Additional Instructions</Label>
                            <Input
                                id="additionalInstructions"
                                placeholder="Additional transfer instructions (optional)"
                                value={formData.paymentMethods?.bankTransferDetails?.additionalInstructions || ''}
                                onChange={(e) => {
                                    const newDetails = {
                                        ...formData.paymentMethods?.bankTransferDetails,
                                        additionalInstructions: e.target.value
                                    };
                                    handleNestedInputChange('paymentMethods', 'bankTransferDetails', newDetails);
                                }}
                            />
                        </div>
                    </>
                )}
                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label className="text-base">Pay on Delivery</Label>
                        <p className="text-muted-foreground text-sm">
                            Allow customers to pay when receiving their order
                        </p>
                    </div>
                    <Switch
                        checked={formData.paymentMethods?.payOnDelivery || false}
                        onCheckedChange={(checked) =>
                            handleNestedInputChange('paymentMethods', 'payOnDelivery', checked)
                        }
                    />
                </div>
            </CardContent>
        </Card>
    );
}

// Shipping Tab Component
function ShippingTab({
    formData,
    handleInputChange,
    selectedAllowedCountries,
    selectedBannedCountries,
    setSelectedAllowedCountries,
    setSelectedBannedCountries,
    carriers,
    setCarriers,
    errors
}) {
    const addNewCarrier = () => {
        const newCarrier = {
            id: `carrier_${Date.now()}`,
            name: '',
            carrierName: '',
            description: '',
            deliveryTime: '',
            basePrice: 0,
            supportedCountries: [],
            logo: '',
            enabled: true
        };
        setCarriers([...carriers, newCarrier]);
    };

    const removeCarrier = (index) => {
        const newCarriers = carriers.filter((_, i) => i !== index);
        setCarriers(newCarriers);
    };

    const updateCarrier = (index, field, value) => {
        const newCarriers = [...carriers];
        newCarriers[index] = { ...newCarriers[index], [field]: value };
        setCarriers(newCarriers);
    };

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        Free Shipping Configuration
                    </CardTitle>
                    <CardDescription>Configure free shipping options and eligible countries</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Free Shipping</Label>
                            <p className="text-muted-foreground text-sm">Offer free shipping to customers</p>
                        </div>
                        <Switch
                            checked={formData.freeShippingEnabled}
                            onCheckedChange={(checked) => handleInputChange('freeShippingEnabled', checked)}
                        />
                    </div>
                    {formData.freeShippingEnabled && (
                        <div>
                            <Label htmlFor="freeShippingThreshold">Free Shipping Threshold (€)</Label>
                            <Input
                                id="freeShippingThreshold"
                                type="number"
                                min="0"
                                placeholder="100"
                                value={formData.freeShippingThreshold}
                                onChange={(e) =>
                                    handleInputChange('freeShippingThreshold', parseFloat(e.target.value) || 0)
                                }
                            />
                            <p className="mt-2 text-muted-foreground text-sm">Minimum order amount for free shipping</p>
                            {errors.freeShippingThreshold && (
                                <p className="mt-1 text-red-500 text-sm">{errors.freeShippingThreshold}</p>
                            )}
                        </div>
                    )}
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">International Shipping</Label>
                            <p className="text-muted-foreground text-sm">
                                Enable shipping to international destinations
                            </p>
                        </div>
                        <Switch
                            checked={formData.internationalShipping}
                            onCheckedChange={(checked) => handleInputChange('internationalShipping', checked)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Shipping Countries
                    </CardTitle>
                    <CardDescription>Configure allowed and restricted shipping destinations</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div>
                        <Label>Allowed Countries</Label>
                        <div className="mb-4 flex flex-wrap gap-2">
                            <div className="flex-grow">
                                <CountryDropdown
                                    onChange={(country) => {
                                        const values = new Set(selectedAllowedCountries || []);
                                        if (!values.has(country.alpha3)) {
                                            values.add(country.alpha3);
                                            const newValues = Array.from(values);
                                            handleInputChange('allowedCountries', newValues);
                                            setSelectedAllowedCountries(newValues);
                                        }
                                    }}
                                    placeholder="Select countries..."
                                />
                            </div>
                        </div>
                        <p className="mb-2 text-muted-foreground text-sm">
                            Select countries where shipping is allowed (leave empty to allow all countries)
                        </p>
                        {selectedAllowedCountries?.length > 0 && (
                            <div className="mb-2 flex flex-wrap gap-1">
                                {selectedAllowedCountries.map((countryCode) => {
                                    const country = countries.all.find((c) => c.alpha3 === countryCode);
                                    return (
                                        country && (
                                            <Badge
                                                key={countryCode}
                                                variant="secondary"
                                                className="mr-1 mb-1 flex items-center gap-2">
                                                <span>{country.name}</span>
                                                <button
                                                    type="button"
                                                    className="hover:text-destructive"
                                                    onClick={() => {
                                                        const values = selectedAllowedCountries.filter(
                                                            (c) => c !== countryCode
                                                        );
                                                        handleInputChange('allowedCountries', values);
                                                        setSelectedAllowedCountries(values);
                                                    }}>
                                                    ×
                                                </button>
                                            </Badge>
                                        )
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div>
                        <Label>Banned Countries</Label>
                        <div className="mb-4 flex flex-wrap gap-2">
                            <div className="flex-grow">
                                <CountryDropdown
                                    onChange={(country) => {
                                        const values = new Set(selectedBannedCountries || []);
                                        if (!values.has(country.alpha3)) {
                                            values.add(country.alpha3);
                                            const newValues = Array.from(values);
                                            handleInputChange('bannedCountries', newValues);
                                            setSelectedBannedCountries(newValues);
                                        }
                                    }}
                                    placeholder="Select countries..."
                                />
                            </div>
                        </div>
                        <p className="mb-2 text-muted-foreground text-sm">
                            Select countries where shipping is not allowed
                        </p>
                        {selectedBannedCountries?.length > 0 && (
                            <div className="mb-2 flex flex-wrap gap-1">
                                {selectedBannedCountries.map((countryCode) => {
                                    const country = countries.all.find((c) => c.alpha3 === countryCode);
                                    return (
                                        country && (
                                            <Badge
                                                key={countryCode}
                                                variant="secondary"
                                                className="mr-1 mb-1 flex items-center gap-2">
                                                <span>{country.name}</span>
                                                <button
                                                    type="button"
                                                    className="hover:text-destructive"
                                                    onClick={() => {
                                                        const values = selectedBannedCountries.filter(
                                                            (c) => c !== countryCode
                                                        );
                                                        handleInputChange('bannedCountries', values);
                                                        setSelectedBannedCountries(values);
                                                    }}>
                                                    ×
                                                </button>
                                            </Badge>
                                        )
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Carriers Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Shipping Carriers
                    </CardTitle>
                    <CardDescription>Configure available shipping carriers and their rates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {carriers.map((carrier, index) => (
                        <Card key={carrier.id} className="border-dashed">
                            <CardContent className="pt-6">
                                <div className="grid gap-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-sm">Carrier {index + 1}</h4>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => removeCarrier(index)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <Label htmlFor={`carrier-name-${index}`}>Service Name</Label>
                                            <Input
                                                id={`carrier-name-${index}`}
                                                placeholder="Standard Delivery"
                                                value={carrier.name || ''}
                                                onChange={(e) => updateCarrier(index, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor={`carrier-carrier-name-${index}`}>Carrier Name</Label>
                                            <Input
                                                id={`carrier-carrier-name-${index}`}
                                                placeholder="DHL, FedEx, UPS..."
                                                value={carrier.carrierName || ''}
                                                onChange={(e) => updateCarrier(index, 'carrierName', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor={`carrier-description-${index}`}>Description</Label>
                                        <Input
                                            id={`carrier-description-${index}`}
                                            placeholder="Reliable delivery service..."
                                            value={carrier.description || ''}
                                            onChange={(e) => updateCarrier(index, 'description', e.target.value)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <Label htmlFor={`carrier-delivery-time-${index}`}>Delivery Time</Label>
                                            <Input
                                                id={`carrier-delivery-time-${index}`}
                                                placeholder="3-5 business days"
                                                value={carrier.deliveryTime || ''}
                                                onChange={(e) => updateCarrier(index, 'deliveryTime', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor={`carrier-base-price-${index}`}>Base Price (€)</Label>
                                            <Input
                                                id={`carrier-base-price-${index}`}
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="9.99"
                                                value={carrier.basePrice || 0}
                                                onChange={(e) =>
                                                    updateCarrier(index, 'basePrice', parseFloat(e.target.value) || 0)
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor={`carrier-logo-${index}`}>Logo URL (Optional)</Label>
                                        <Input
                                            id={`carrier-logo-${index}`}
                                            placeholder="https://example.com/logo.png"
                                            value={carrier.logo || ''}
                                            onChange={(e) => updateCarrier(index, 'logo', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`carrier-countries-${index}`}>Supported Countries</Label>
                                        <Input
                                            id={`carrier-countries-${index}`}
                                            placeholder="FR, DE, BE, NL (leave empty for all countries)"
                                            value={
                                                carrier.supportedCountries ? carrier.supportedCountries.join(', ') : ''
                                            }
                                            onChange={(e) => {
                                                const countries = e.target.value
                                                    .split(',')
                                                    .map((c) => c.trim().toUpperCase())
                                                    .filter((c) => c.length > 0);
                                                updateCarrier(index, 'supportedCountries', countries);
                                            }}
                                        />
                                        <p className="mt-2 text-muted-foreground text-sm">
                                            Enter country codes separated by commas (e.g., FR, DE, BE) or leave empty to
                                            support all countries
                                        </p>
                                    </div>
                                    <div className="flex flex-row items-center justify-between rounded-lg border p-3">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Enabled</Label>
                                            <p className="text-muted-foreground text-sm">
                                                Show this carrier as an option during checkout
                                            </p>
                                        </div>
                                        <Switch
                                            checked={carrier.enabled !== false}
                                            onCheckedChange={(checked) => updateCarrier(index, 'enabled', checked)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    <Button type="button" variant="outline" onClick={addNewCarrier} className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Carrier
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

// General Tab Component
function GeneralTab({ formData, handleInputChange, errors }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    General Store Settings
                </CardTitle>
                <CardDescription>Configure general store settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div>
                    <Label htmlFor="currency">Store Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a currency" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="AUD">AUD (A$)</SelectItem>
                            <SelectItem value="CAD">CAD (C$)</SelectItem>
                            <SelectItem value="JPY">JPY (¥)</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="mt-2 text-muted-foreground text-sm">Select the default currency for your store</p>
                </div>
            </CardContent>
        </Card>
    );
}

// Skeleton Loading Component
function StoreSettingsSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="mt-2 h-4 w-64" />
                </div>
            </div>

            <div className="space-y-6">
                {/* Business Information Card Skeleton */}
                <div className="rounded-lg border p-6">
                    <div className="mb-4 flex items-center gap-2">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-6 w-40" />
                    </div>
                    <Skeleton className="mb-4 h-4 w-64" />
                    <div className="grid gap-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>

                {/* VAT Configuration Card Skeleton */}
                <div className="rounded-lg border p-6">
                    <div className="mb-4 flex items-center gap-2">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-6 w-32" />
                    </div>
                    <Skeleton className="mb-4 h-4 w-48" />
                    <div className="grid gap-4">
                        <Skeleton className="h-10 w-full" />
                        <div className="rounded-lg border p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Skeleton className="mb-2 h-4 w-32" />
                                    <Skeleton className="h-3 w-48" />
                                </div>
                                <Skeleton className="h-6 w-12" />
                            </div>
                        </div>
                        <div className="rounded-lg border p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Skeleton className="mb-2 h-4 w-28" />
                                    <Skeleton className="h-3 w-40" />
                                </div>
                                <Skeleton className="h-6 w-12" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Methods Card Skeleton */}
                <div className="rounded-lg border p-6">
                    <div className="mb-4 flex items-center gap-2">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-6 w-36" />
                    </div>
                    <Skeleton className="mb-4 h-4 w-56" />
                    <div className="grid gap-4">
                        <div className="rounded-lg border p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Skeleton className="mb-2 h-4 w-40" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                                <Skeleton className="h-6 w-12" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                </div>

                {/* Shipping Configuration Card Skeleton */}
                <div className="rounded-lg border p-6">
                    <div className="mb-4 flex items-center gap-2">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-6 w-44" />
                    </div>
                    <Skeleton className="mb-4 h-4 w-52" />
                    <div className="grid gap-4">
                        <div className="rounded-lg border p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Skeleton className="mb-2 h-4 w-24" />
                                    <Skeleton className="h-3 w-36" />
                                </div>
                                <Skeleton className="h-6 w-12" />
                            </div>
                        </div>
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>

                <div className="flex justify-end">
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>
        </div>
    );
}
