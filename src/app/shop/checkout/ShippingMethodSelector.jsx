// app/shop/checkout/ShippingMethodSelector.jsx
"use client"

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

const ShippingMethodSelector = ({
                                    selectedCountry,
                                    onShippingMethodSelect,
                                    onShippingMethodsLoaded,
                                    selectedMethod,
                                    isEligibleForFreeShipping = false,
                                    isLoading: parentLoading = false
                                }) => {
    const t = useTranslations('Checkout');
    const [shippingMethods, setShippingMethods] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch shipping methods based on selected country
    useEffect(() => {
        const fetchShippingMethods = async () => {
            if (!selectedCountry) return;

            setIsLoading(true);
            setError('');

            try {
                // Fetch store settings to get carriers
                const response = await fetch('/api/query/public/store_settings');
                
                if (!response.ok) {
                    throw new Error('Failed to fetch store settings');
                }

                const storeData = await response.json();
                const storeSettings = storeData?.data?.[0];
                let availableMethods = [];

                if (storeSettings?.carriers && storeSettings.carriers.length > 0) {
                    // Filter carriers that support the selected country and are enabled
                    const enabledCarriers = storeSettings.carriers.filter(carrier => 
                        carrier.enabled && 
                        (carrier.supportedCountries.includes(selectedCountry) || 
                         carrier.supportedCountries.includes('ALL') ||
                         carrier.supportedCountries.length === 0)
                    );

                    // Convert carriers to shipping method format
                    availableMethods = enabledCarriers.map(carrier => ({
                        id: carrier.id,
                        name: carrier.name,
                        carrier_name: carrier.carrierName,
                        description: carrier.description,
                        delivery_time: carrier.deliveryTime,
                        fixed_rate: carrier.basePrice,
                        logo: carrier.logo
                    }));
                }

                // Add free shipping option if eligible and country is allowed
                if (isEligibleForFreeShipping && storeSettings?.freeShippingEnabled) {
                    const isCountryAllowed = !storeSettings.allowedCountries?.length || 
                        storeSettings.allowedCountries.includes(selectedCountry);
                    const isCountryBanned = storeSettings.bannedCountries?.includes(selectedCountry);
                    
                    if (isCountryAllowed && !isCountryBanned) {
                        availableMethods.unshift({
                            id: 'free_shipping',
                            name: 'Free Shipping',
                            carrier_name: 'Standard',
                            description: `Free shipping on orders over €${storeSettings.freeShippingThreshold}`,
                            delivery_time: '5-7 business days',
                            fixed_rate: 0,
                            logo: null
                        });
                    }
                }

                setShippingMethods(availableMethods);

                // Notify parent component about loaded methods for auto-selection
                if (onShippingMethodsLoaded) {
                    onShippingMethodsLoaded(availableMethods);
                }

            } catch (err) {
                console.error('Error fetching shipping methods:', err);
                setError(t('shippingMethodsError') || 'Failed to load shipping methods');
                setShippingMethods([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchShippingMethods();
    }, [selectedCountry, isEligibleForFreeShipping]);

    const handleMethodSelect = (method) => {
        onShippingMethodSelect(method);
    };

    if (isLoading || parentLoading) {
        return (
            <div className="space-y-3">
                <h3 className="text-lg font-semibold">{t('shippingMethod')}</h3>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                            <div className="border border-border rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-4 h-4 bg-muted rounded-full"></div>
                                        <div className="space-y-2">
                                            <div className="h-4 bg-muted rounded w-32"></div>
                                            <div className="h-3 bg-muted rounded w-24"></div>
                                        </div>
                                    </div>
                                    <div className="h-4 bg-muted rounded w-16"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-3">
                <h3 className="text-lg font-semibold">{t('shippingMethod')}</h3>
                <div className="border rounded-lg p-4 bg-red-50 border-red-200">
                    <div className="flex items-center space-x-2 text-red-700">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{t('shippingError')}</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!selectedCountry) {
        return (
            <div className="space-y-3">
                <h3 className="text-lg font-semibold">{t('shippingMethod')}</h3>
                <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                    <div className="flex items-center space-x-2 text-blue-700">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{t('selectCountryShipping')}</span>
                    </div>
                </div>
            </div>
        );
    }

    if (shippingMethods.length === 0) {
        return (
            <div className="space-y-3">
                <h3 className="text-lg font-semibold">{t('shippingMethod')}</h3>
                <div className="border border-border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm">{t('noShippingMethods')}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold">{t('shippingMethod')}</h3>
            <div className="space-y-3">
                {shippingMethods.map((method) => (
                    <motion.div
                        key={method.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <label
                            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 block ${
                                selectedMethod?.id === method.id
                                    ? 'border-primary bg-accent/50 ring-2 ring-primary/20'
                                    : 'border-border hover:border-primary/50'
                            }`}
                        >
                            <input
                                type="radio"
                                name="shipping-method"
                                value={method.id}
                                checked={selectedMethod?.id === method.id}
                                onChange={() => handleMethodSelect(method)}
                                className="sr-only"
                            />
                            <div className="flex justify-between items-start">
                                <div className="flex items-center space-x-3 flex-1">
                                    <div className={`w-4 h-4 border-2 rounded-full flex items-center justify-center ${
                                        selectedMethod?.id === method.id
                                            ? 'border-primary'
                                            : 'border-muted-foreground'
                                    }`}>
                                        {selectedMethod?.id === method.id && (
                                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-3 flex-1">
                                        {method.logo && (
                                            <Image
                                                width={8}
                                                height={8}
                                                unoptimized={true}
                                                src={method.logo}
                                                alt={method.carrier_name}
                                                className="w-8 h-8 object-contain"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium text-foreground">
                                                    {method.name}
                                                </span>
                                                {method.carrier_name && (
                                                    <span className="text-sm text-muted-foreground">
                                                        via {method.carrier_name}
                                                    </span>
                                                )}
                                            </div>
                                            {method.description && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {method.description}
                                                </p>
                                            )}
                                            {method.delivery_time && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                    </svg>
                                                    {method.delivery_time}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="font-semibold text-foreground">
                                        {method.fixed_rate === 0 ? t('free') : `€${method.fixed_rate.toFixed(2)}`}
                                    </span>
                                </div>
                            </div>
                        </label>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default ShippingMethodSelector;
