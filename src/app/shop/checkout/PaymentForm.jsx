// @/app/shop/checkout/PaymentForm.jsx
'use client';

import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { AnimatePresence, motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import Turnstile from 'react-turnstile';
import { useCart } from 'react-use-cart';
import { createOrder, createCustomer } from '@/lib/server/admin';
import GooglePlacesInput from '@/components/google-places-input';
import { Button } from '@/components/ui/button';
import { CountryDropdown } from '@/components/ui/country-dropdown';
import { PhoneInput } from '@/components/ui/phone-input'; 
import ShippingMethodSelector from './ShippingMethodSelector.jsx';

const PaymentForm = ({
    cartTotal,
    subTotal,
    shippingCost,
    onShippingUpdate,
    selectedShippingMethod,
    isEligibleForFreeShipping,
    storeSettings,
    hasStripe = false
}) => {
    const t = useTranslations('Checkout');
    const { data: session } = useSession();
    const stripe = hasStripe ? useStripe() : null;
    const elements = hasStripe ? useElements() : null;
    const { items } = useCart();

    // UI State
    const [_isOpen, _setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState('information'); // 'information', 'payment'
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Form Data - Initialize all values to prevent controlled/uncontrolled input issues
    const [emailInput, setEmailInput] = useState(session?.email || '');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [streetAddress, setStreetAddress] = useState('');
    const [apartmentUnit, setApartmentUnit] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [countryIso, setCountryIso] = useState('FR');
    const [country, setCountry] = useState('FR');
    const [phone, setPhone] = useState('');
    const [deliveryNotes, setDeliveryNotes] = useState('');

    // Shipping State
    const [localSelectedShippingMethod, setLocalSelectedShippingMethod] = useState(null);
    const [hasAutoSelectedFreeShipping, setHasAutoSelectedFreeShipping] = useState(false);

    // Integration State
    const [turnstileKey, setTurnstileKey] = useState(null);
    const [googleMapsApiKey, setGoogleMapsApiKey] = useState(null);
    const [isTurnstileVerified, setIsTurnstileVerified] = useState(false);

    // Promo Code State
    const [promoCode, setPromoCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [promoLoading, setPromoLoading] = useState(false);
    const [promoError, setPromoError] = useState('');
    const [discountAmount, setDiscountAmount] = useState(0);

    // Payment Method State
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

    const handleShippingMethodSelect = (method) => {
        setLocalSelectedShippingMethod(method);
        const shippingCost = method.fixed_rate || method.base_price || method.basePrice || 0;
        onShippingUpdate(shippingCost, method, discountAmount);
    };

    const handleCountryChange = (selectedCountry) => {
        setCountryIso(selectedCountry.alpha2);
        setCountry(selectedCountry.alpha2);
        setState('');
        setCity('');
        setZipCode('');
        // Reset selected shipping method when country changes
        setLocalSelectedShippingMethod(null);
        setHasAutoSelectedFreeShipping(false);
        // Notify parent that shipping method was reset
        onShippingUpdate(0, null, discountAmount);
    };

    const handleGooglePlacesSelect = (placeDetails) => {
        if (placeDetails?.address_components) {
            // Parse address components from Google Places
            let extractedCity = '';
            let extractedState = '';
            let extractedZipCode = '';
            let extractedCountry = 'FR';

            placeDetails.address_components.forEach((component) => {
                const types = component.types;

                if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                    extractedCity = component.long_name;
                } else if (types.includes('administrative_area_level_1')) {
                    extractedState = component.long_name;
                } else if (types.includes('postal_code')) {
                    extractedZipCode = component.long_name;
                } else if (types.includes('country')) {
                    extractedCountry = component.short_name;
                }
            });

            // Update form fields
            setStreetAddress(placeDetails.formatted_address || '');
            setCity(extractedCity);
            setState(extractedState);
            setZipCode(extractedZipCode);
            setCountryIso(extractedCountry);
            setCountry(extractedCountry);

            onShippingUpdate({
                country: extractedCountry,
                state: extractedState,
                city: extractedCity,
                zipCode: extractedZipCode
            });
        }
    }; // Auto-select free shipping when eligible
    const handleShippingMethodsLoaded = (shippingMethods) => {
        if (isEligibleForFreeShipping && !hasAutoSelectedFreeShipping && shippingMethods.length > 0) {
            // Find free shipping method (id: 'free_shipping')
            const freeShippingMethod = shippingMethods.find((method) => method.id === 'free_shipping');

            if (freeShippingMethod) {
                setLocalSelectedShippingMethod(freeShippingMethod);
                onShippingUpdate(0, freeShippingMethod, discountAmount || 0);
                setHasAutoSelectedFreeShipping(true);
            } else if (!localSelectedShippingMethod) {
                // If no free shipping available but user is eligible, select first method
                const firstMethod = shippingMethods[0];
                const shippingCost = firstMethod.fixed_rate || firstMethod.base_price || firstMethod.basePrice || 0;

                setLocalSelectedShippingMethod(firstMethod);
                onShippingUpdate(shippingCost, firstMethod, discountAmount || 0);
            }
        } else if (!isEligibleForFreeShipping && !localSelectedShippingMethod && shippingMethods.length > 0) {
            // If not eligible for free shipping, auto-select first available method
            const firstMethod = shippingMethods[0];
            const shippingCost = firstMethod.fixed_rate || firstMethod.base_price || firstMethod.basePrice || 0;

            setLocalSelectedShippingMethod(firstMethod);
            onShippingUpdate(shippingCost, firstMethod, discountAmount || 0);
        } else if (shippingMethods.length === 1 && !localSelectedShippingMethod) {
            // Always auto-select if only one method available
            const onlyMethod = shippingMethods[0];
            const shippingCost = onlyMethod.fixed_rate || onlyMethod.base_price || onlyMethod.basePrice || 0;
            setLocalSelectedShippingMethod(onlyMethod);
            onShippingUpdate(shippingCost, onlyMethod, discountAmount || 0);
        }
    };

    // Reset auto-selection when eligibility changes
    useEffect(() => {
        if (!isEligibleForFreeShipping) {
            setHasAutoSelectedFreeShipping(false);
            // If currently selected method is free shipping and user is no longer eligible, reset
            if (localSelectedShippingMethod && localSelectedShippingMethod.id === 'free_shipping') {
                setLocalSelectedShippingMethod(null);
                onShippingUpdate(0, null);
            }
        }
    }, [isEligibleForFreeShipping]);

    // Direct address input handler for GooglePlacesInput onChange
    const handleAddressInputChange = (value) => {
        setStreetAddress(value);
    };

    // Google Places Autocomplete handlers
    const _handleAddressChange = (placeDetails = null) => {
        if (!placeDetails) return null;

        setStreetAddress(placeDetails.formatted_address);
        // If we have place details from Google Places, auto-fill other fields
        if (placeDetails?.address_components) {
            const components = placeDetails.address_components;

            // Extract address components
            let extractedCity = '';
            let extractedState = '';
            let extractedZipCode = '';
            let extractedCountry = '';
            let extractedCountryCode = '';

            components.forEach((component) => {
                const types = component.types;

                if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                    extractedCity = component.long_name || component.longText;
                } else if (types.includes('administrative_area_level_1')) {
                    extractedState = component.long_name || component.longText;
                } else if (types.includes('postal_code')) {
                    extractedZipCode = component.long_name || component.longText;
                } else if (types.includes('country')) {
                    extractedCountry = component.long_name || component.longText;
                    extractedCountryCode = component.short_name || component.shortText;
                }
            });

            // Update form fields
            if (extractedCity) setCity(extractedCity);
            if (extractedState) setState(extractedState);
            if (extractedZipCode) setZipCode(extractedZipCode);

            // Update country if found in COUNTRIES list
            if (extractedCountry && extractedCountryCode) {
                setCountry(extractedCountryCode);
                setCountryIso(extractedCountry);

                // Reset shipping method when country changes
                setLocalSelectedShippingMethod(null);
                setHasAutoSelectedFreeShipping(false);
                onShippingUpdate(0, null);
            }
        }

        // Clear error when user inputs address
        if (errorMessage?.includes('address')) {
            setErrorMessage('');
        }
    };

    const handleAddressError = (_error) => {
        // You can set a specific error state here if needed
    };

    const validatePromoCode = async () => {
        if (!promoCode.trim()) {
            setPromoError('Please enter a promo code');
            return;
        }

        setPromoLoading(true);
        setPromoError('');

        try {
            const response = await fetch('/api/query/public/validate-coupon', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: promoCode.trim(),
                    orderAmount: parseFloat(subTotal),
                    customerEmail: emailInput
                })
            });

            const result = await response.json();

            if (result.success && result.valid) {
                setAppliedCoupon(result.coupon);
                setDiscountAmount(result.discount.amount);
                setPromoError('');
                // Update cart total display
                onShippingUpdate(shippingCost, selectedShippingMethod, result.discount.amount);
            } else {
                setPromoError(result.message || 'Invalid promo code');
                setAppliedCoupon(null);
                setDiscountAmount(0);
            }
        } catch (error) {
            console.error('Promo code validation error:', error);
            setPromoError('Failed to validate promo code. Please try again.');
            setAppliedCoupon(null);
            setDiscountAmount(0);
        } finally {
            setPromoLoading(false);
        }
    };

    const removePromoCode = () => {
        setPromoCode('');
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setPromoError('');
        // Reset cart total display
        onShippingUpdate(shippingCost, selectedShippingMethod, 0);
    };

    const validateInformationStep = () => {
        const requiredFields = {
            email: emailInput,
            firstName: firstName,
            lastName: lastName,
            streetAddress: streetAddress,
            city: city,
            state: state,
            zipCode: zipCode,
            phone: phone
        };

        // Check for empty required fields
        const emptyFields = Object.entries(requiredFields)
            .filter(([_key, value]) => !value || value.toString().trim() === '')
            .map(([key]) => key);

        if (emptyFields.length > 0) {
            setErrorMessage(`Please complete the following required fields: ${emptyFields.join(', ')}`);
            return false;
        }

        // Check for shipping method
        if (!localSelectedShippingMethod) {
            setErrorMessage('Please select a shipping method');
            return false;
        }

        setErrorMessage('');
        return true;
    };

    const handleContinueToPayment = () => {
        if (validateInformationStep()) {
            setCurrentStep('payment');
        }
    };

    const handleBackToInformation = () => {
        setCurrentStep('information');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setIsProcessing(true);
        setErrorMessage('');

        try {
            // Validate form data
            const requiredFields = {
                email: emailInput,
                firstName: firstName,
                lastName: lastName,
                streetAddress: streetAddress,
                city: city,
                state: state,
                zipCode: zipCode,
                phone: phone
            };

            const emptyFields = Object.entries(requiredFields)
                .filter(([_key, value]) => !value || value.toString().trim() === '')
                .map(([key]) => key);

            if (emptyFields.length > 0) {
                throw new Error(`Please complete the following required fields: ${emptyFields.join(', ')}`);
            }

            if (!localSelectedShippingMethod) {
                throw new Error('Please select a shipping method');
            }

            if (turnstileKey && !isTurnstileVerified) {
                throw new Error('Please complete the security verification');
            }

            // Handle Stripe payment if available
            if (hasStripe && stripe && elements) {
                const { error: submitError } = await elements.submit();
                if (submitError) {
                    throw new Error(submitError.message);
                }
            }

            // Create customer data to match orders structure
            const customerData = {
                firstName,
                lastName,
                email: emailInput,
                phone,
                streetAddress,
                apartmentUnit,
                city,
                state,
                zipCode,
                country,
                countryIso
            };

            // Order items data to match orders structure
            const orderItems = items.map((item) => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                type: 'catalog'
            }));

            // Calculate pricing with applied coupon discount and VAT
            const itemsTotal = parseFloat(subTotal);
            const shippingTotal = localSelectedShippingMethod?.fixed_rate || 0;
            const couponDiscount = discountAmount || 0;

            // Calculate VAT correctly based on store settings
            let vatAmount = 0;
            let finalTotal = 0;
            let subtotalExclVat = itemsTotal;

            if (storeSettings?.vatEnabled) {
                const vatRate = (storeSettings.vatPercentage || 20) / 100;

                if (storeSettings.vatIncludedInPrice) {
                    // VAT is already included in item prices
                    subtotalExclVat = itemsTotal / (1 + vatRate);
                    vatAmount = itemsTotal - subtotalExclVat;
                    finalTotal = itemsTotal + shippingTotal - couponDiscount;
                } else if (storeSettings.applyVatAtCheckout) {
                    // VAT needs to be added at checkout
                    vatAmount = itemsTotal * vatRate;
                    finalTotal = itemsTotal + vatAmount + shippingTotal - couponDiscount;
                } else {
                    // No VAT applied
                    finalTotal = itemsTotal + shippingTotal - couponDiscount;
                }
            } else {
                // VAT disabled
                finalTotal = itemsTotal + shippingTotal - couponDiscount;
            }

            // Use selected payment method
            const paymentMethod = selectedPaymentMethod || 'pending';

            if (!selectedPaymentMethod) {
                throw new Error(t('selectPaymentMethodFirst'));
            }

            // Create order data matching the orders page structure
            const orderData = {
                id: Math.floor(Date.now() / 1000) + '_' + Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000,
                customer: customerData,
                items: orderItems,
                subtotal: storeSettings?.vatEnabled && storeSettings.vatIncludedInPrice ? subtotalExclVat : itemsTotal,
                shippingCost: shippingTotal,
                discountType: appliedCoupon ? appliedCoupon.type : 'fixed',
                discountValue: appliedCoupon ? appliedCoupon.value : 0,
                discountAmount: couponDiscount,
                taxEnabled: storeSettings?.vatEnabled || false,
                taxRate: storeSettings?.vatPercentage || 20,
                taxAmount: vatAmount,
                taxIncluded: storeSettings?.vatIncludedInPrice || false,
                total: Math.max(0, finalTotal),
                status: 'pending',
                paymentStatus: paymentMethod === 'card' ? 'paid' : 'pending',
                paymentMethod: paymentMethod,
                deliveryNotes,
                shippingNotes: '', 
                sendEmail: true,
                appointmentId: null,
                isServiceAppointment: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Handle different payment methods
            if (paymentMethod === 'card' && hasStripe && stripe && elements) {
                // Handle Stripe card payment
                const { error: submitError } = await elements.submit();
                if (submitError) {
                    throw new Error(submitError.message);
                }

                // Create payment intent for card payments
                const response = await fetch('/api/stripe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        amount: Math.round(finalTotal * 100), // Use calculated finalTotal, not cartTotal prop
                        currency: (storeSettings?.currency || 'EUR').toLowerCase(),
                        email: emailInput,
                        automatic_payment_methods: true
                    })
                });

                const { client_secret: clientSecret, error } = await response.json();

                if (error) {
                    throw new Error(error);
                }

                // Apply coupon usage if a coupon was used
                if (appliedCoupon) {
                    try {
                        await fetch('/api/query/public/apply-coupon', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                couponId: appliedCoupon.id,
                                orderId: orderData.id,
                                customerEmail: emailInput,
                                orderAmount: itemsTotal,
                                discountAmount: couponDiscount
                            })
                        });
                    } catch (couponError) {
                        console.error('Failed to apply coupon usage:', couponError);
                        // Don't fail the payment for coupon tracking errors
                    }
                }

                // Store order data in localStorage before confirming payment
                localStorage.setItem('orderData', JSON.stringify(orderData));

                // Confirm payment with Stripe
                const { error: confirmError } = await stripe.confirmPayment({
                    elements,
                    clientSecret,
                    confirmParams: {
                        return_url: `${window.location.origin}/shop/checkout/success?tx=${btoa(orderData.id)}&payment_method=card`
                    }
                });

                if (confirmError) {
                    // Remove order data if payment fails
                    localStorage.removeItem('orderData');
                    throw new Error(confirmError.message);
                }
            } else {
                // Handle alternative payment methods (bank transfer, pay on delivery)
                
                // First create customer if needed
                try {
                    const customerData = {
                        firstName: orderData.customer.firstName,
                        lastName: orderData.customer.lastName,
                        email: orderData.customer.email,
                        phone: orderData.customer.phone,
                        streetAddress: orderData.customer.streetAddress,
                        apartmentUnit: orderData.customer.apartmentUnit,
                        city: orderData.customer.city,
                        state: orderData.customer.state,
                        zipCode: orderData.customer.zipCode,
                        country: orderData.customer.country,
                        countryIso: orderData.customer.countryIso,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    
                    await createCustomer(customerData);
                } catch (customerError) {
                    console.warn('Customer creation failed:', customerError);
                    // Continue with order creation even if customer creation fails
                }
                
                const result = await createOrder(orderData);

                if (result.success) {
                    // Apply coupon usage if a coupon was used
                    if (appliedCoupon) {
                        try {
                            await fetch('/api/query/public/apply-coupon', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    couponId: appliedCoupon.id,
                                    orderId: orderData.id,
                                    customerEmail: emailInput,
                                    orderAmount: itemsTotal,
                                    discountAmount: couponDiscount
                                })
                            });
                        } catch (couponError) {
                            console.error('Failed to apply coupon usage:', couponError);
                        }
                    }

                    // Store order data in localStorage before redirecting
                    localStorage.setItem('orderData', JSON.stringify(orderData));

                    // Clear cart and redirect to success page
                    if (typeof window !== 'undefined' && window.emptyCart) {
                        window.emptyCart();
                    }

                    window.location.href = `/shop/checkout/success?order_id=${orderData.id}&payment_method=${paymentMethod}`;
                } else {
                    throw new Error(result.error || 'Failed to create order');
                }
            }
        } catch (error) {
            console.error('Payment error:', error);
            setErrorMessage(error.message || t('paymentError'));
            setIsProcessing(false);
        }
    };

    const getDefaultCountry = (countryCode = null) => {
        const lang = navigator.language || 'fr-FR';
        if (countryCode) {
            return countryCode;
        }

        const country = lang.split('-')[1] || 'US';

        const fallback = 'FR';
        const supportedCountries = ['US', 'CA', 'GB', 'FR', 'DE', 'AU', 'PT', 'ES'];

        const detectedCountry = supportedCountries.includes(country) ? country : fallback;
        setCountryIso(detectedCountry);

        return detectedCountry;
    };

    // Get available payment methods based on store settings
    const getAvailablePaymentMethods = () => {
        const methods = [];

        if (hasStripe && storeSettings?.paymentMethods?.cardPayments) {
            methods.push({ value: 'card', label: `💳 ${t('cardPayment')}`, description: t('cardPaymentDescription') });
        }

        if (storeSettings?.paymentMethods?.bankTransfer) {
            methods.push({
                value: 'bank_transfer',
                label: `🏦 ${t('bankTransfer')}`,
                description: t('bankTransferDescription')
            });
        }

        if (storeSettings?.paymentMethods?.payOnDelivery) {
            methods.push({
                value: 'pay_on_delivery',
                label: `📦 ${t('payOnDelivery')}`,
                description: t('payOnDeliveryDescription')
            });
        }

        return methods;
    };
    useEffect(() => {
        const defaultC = getDefaultCountry();
        setCountry(defaultC);

        // Fetch keys from public site settings (site_settings)
        const fetchIntegrationKeys = async () => {
            try {
                const res = await fetch('/api/query/public/site_settings');
                const json = await res.json();
                if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
                    const settings = json.data[0] || {};
                    setTurnstileKey(settings.turnstileEnabled ? settings.turnstileSiteKey : null);
                    setGoogleMapsApiKey(settings.googleMapsEnabled ? settings.googleMapsApiKey : null);
                }
            } catch (err) {
                console.error('Failed to fetch site settings for integration keys:', err);
            }
        };

        fetchIntegrationKeys();
    }, []);

    // Auto-select first available payment method when store settings are loaded
    useEffect(() => {
        if (storeSettings && !selectedPaymentMethod) {
            const availableMethods = getAvailablePaymentMethods();
            if (availableMethods.length > 0) {
                setSelectedPaymentMethod(availableMethods[0].value);
            }
        }
    }, [storeSettings, selectedPaymentMethod]);

    return (
        <div className="space-y-6">
            <AnimatePresence mode="wait">
                {currentStep === 'information' && (
                    <motion.div
                        key="information"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6">
                        {/* Contact Information */}
                        <div>
                            <h2 className="mb-4 font-semibold text-lg">{t('contactInformation')}</h2>
                            <div className="space-y-4">
                                <input
                                    required
                                    type="email"
                                    value={emailInput || ''}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    placeholder={t('emailAddress')}
                                    className="w-full rounded-xl border px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                                <PhoneInput
                                    value={phone || ''}
                                    onChange={setPhone}
                                    defaultCountry={countryIso?.toUpperCase() || 'FR'}
                                    placeholder={'+000000000'}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Shipping Information */}
                        <div>
                            <h2 className="mb-4 font-semibold text-lg">{t('shippingInformation')}</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    required
                                    type="text"
                                    placeholder={t('firstName')}
                                    value={firstName || ''}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full rounded-xl border px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                                <input
                                    required
                                    type="text"
                                    placeholder={t('lastName')}
                                    value={lastName || ''}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full rounded-xl border px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />

                                {/* Google Places Autocomplete for Street Address */}
                                <div className="col-span-2">
                                    <label className="mb-1 block font-medium text-gray-700 text-sm">
                                        {t('streetAddress')}
                                    </label>
                                    <div className="google-places-container">
                                        <GooglePlacesInput
                                            legacy="mobile"
                                            value={streetAddress || ''}
                                            onChange={handleAddressInputChange}
                                            onPlaceSelected={handleGooglePlacesSelect}
                                            onError={handleAddressError}
                                            placeholder={t('streetAddress')}
                                            styles={{
                                                width: '100%'
                                            }}
                                            apiKey={googleMapsApiKey}
                                        />
                                        {/* Fallback input in case GooglePlacesInput doesn't render */}
                                        <input
                                            type="text"
                                            placeholder={t('streetAddress')}
                                            value={streetAddress || ''}
                                            onChange={(e) => setStreetAddress(e.target.value)}
                                            className="hidden w-full rounded-xl border px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                            style={{ display: 'none' }}
                                        />
                                    </div>
                                </div>

                                <input
                                    type="text"
                                    placeholder={t('apartmentUnit')}
                                    value={apartmentUnit || ''}
                                    onChange={(e) => setApartmentUnit(e.target.value)}
                                    className="col-span-2 w-full rounded-xl border px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                                <input
                                    required
                                    type="text"
                                    placeholder={t('city')}
                                    value={city || ''}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="w-full rounded-xl border px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                                <input
                                    required
                                    type="text"
                                    placeholder={t('stateProvince')}
                                    value={state || ''}
                                    onChange={(e) => setState(e.target.value)}
                                    className="w-full rounded-xl border px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                                <input
                                    required
                                    type="text"
                                    placeholder={t('zipPostalCode')}
                                    value={zipCode || ''}
                                    onChange={(e) => setZipCode(e.target.value)}
                                    className="w-full rounded-xl border px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                                <div className="w-full">
                                    <CountryDropdown
                                        defaultValue={countryIso}
                                        onChange={handleCountryChange}
                                        placeholder={'Select'}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Shipping Methods */}
                        <div>
                            <ShippingMethodSelector
                                selectedCountry={country}
                                onShippingMethodSelect={handleShippingMethodSelect}
                                onShippingMethodsLoaded={handleShippingMethodsLoaded}
                                selectedMethod={localSelectedShippingMethod}
                                isEligibleForFreeShipping={isEligibleForFreeShipping}
                                isLoading={false}
                            />
                        </div>

                        {/* Promo Code */}
                        <div>
                            <h2 className="mb-4 font-semibold text-lg">{t('promoCode')}</h2>
                            {!appliedCoupon ? (
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={promoCode || ''}
                                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                            placeholder={t('enterPromoCode')}
                                            className="flex-1 rounded-xl border px-3 py-2 uppercase focus:border-primary focus:ring-2 focus:ring-primary/20"
                                            disabled={promoLoading}
                                        />
                                        <Button
                                            variant="ghost"
                                            onClick={validatePromoCode}
                                            disabled={promoLoading || !promoCode.trim()}
                                            className="disabled:cursor-not-allowed disabled:opacity-50">
                                            {promoLoading ? t('validating') : t('apply')}
                                        </Button>
                                    </div>
                                    {promoError && <div className="text-red-600 text-sm">{promoError}</div>}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-green-600">
                                                    ✓ {appliedCoupon.code}
                                                </span>
                                                <span className="text-gray-600 text-sm">- {appliedCoupon.name}</span>
                                            </div>
                                            <div className="mt-1 text-green-700 text-sm">
                                                {t('youSaved', { amount: discountAmount.toFixed(2) })}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={removePromoCode}
                                            className="text-red-600 text-sm hover:text-red-700">
                                            {t('remove')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Delivery Notes */}
                        <div>
                            <h2 className="mb-4 font-semibold text-lg">{t('deliveryNotes')}</h2>
                            <textarea
                                value={deliveryNotes || ''}
                                onChange={(e) => setDeliveryNotes(e.target.value)}
                                placeholder={t('deliveryInstructions')}
                                className="w-full rounded-xl border px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20"
                                rows="3"
                            />
                        </div>

                        {/* Continue to Payment Button */}
                        <div className="pt-4">
                            <button type="button" onClick={handleContinueToPayment} className="primary w-full">
                                {t('continueToPayment')}
                            </button>

                            {/* Error Message */}
                            {errorMessage && (
                                <div className="mt-2 text-center text-red-600 text-sm">{errorMessage}</div>
                            )}
                        </div>
                    </motion.div>
                )}

                {currentStep === 'payment' && (
                    <motion.div
                        key="payment"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Order Summary */}
                            <div className="rounded-xl bg-card">
                                <h3 className="mb-3 font-semibold">{t('orderConfirmation')}</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>{t('deliverTo')}:</span>
                                        <span>
                                            {firstName} {lastName}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>{t('address')}:</span>
                                        <span className="text-right">
                                            {streetAddress}, {city}, {country}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>{t('shippingMethod')}:</span>
                                        <span>{localSelectedShippingMethod?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>{t('email')}:</span>
                                        <span>{emailInput}</span>
                                    </div>
                                    {appliedCoupon && (
                                        <div className="flex justify-between text-green-600">
                                            <span>{t('discount', { code: appliedCoupon.code })}:</span>
                                            <span>-€{discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleBackToInformation}
                                    className="mt-3 text-primary text-sm hover:underline">
                                    ← {t('editInformation')}
                                </button>
                            </div>

                            {/* Turnstile Verification */}
                            {turnstileKey && (
                                <div className="space-y-4">
                                    <h2 className="mb-4 font-semibold text-lg">{t('securityVerification')}</h2>
                                    <div className="flex justify-center">
                                        <Turnstile
                                            sitekey={turnstileKey}
                                            theme="light"
                                            size="flexible"
                                            onVerify={() => setIsTurnstileVerified(true)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Payment Methods Section */}
                            <div>
                                <h2 className="mb-4 font-semibold text-lg">{t('paymentMethod')}</h2>

                                {/* Payment Method Selection */}
                                <div className="mb-6">
                                    <label className="mb-4 block font-medium text-sm">{t('selectPaymentMethod')}</label>
                                    <div className="grid gap-3">
                                        {getAvailablePaymentMethods().map((method) => (
                                            <div
                                                key={method.value}
                                                onClick={() => setSelectedPaymentMethod(method.value)}
                                                className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md ${
                                                    selectedPaymentMethod === method.value
                                                        ? 'border-primary bg-primary/5 shadow-sm'
                                                        : 'border-border bg-card hover:border-primary/50'
                                                }
                                                `}>
                                                {/* Radio indicator */}
                                                <div className="absolute top-4 right-4">
                                                    <div
                                                        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                                                            selectedPaymentMethod === method.value
                                                                ? 'border-primary bg-primary'
                                                                : 'border-gray-300'
                                                        }
                                                        `}>
                                                        {selectedPaymentMethod === method.value && (
                                                            <div className="h-2 w-2 rounded-full bg-white" />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Payment method content */}
                                                <div className="pr-8">
                                                    <div className="mb-1 font-medium text-base">{method.label}</div>
                                                    <div className="text-muted-foreground text-sm">
                                                        {method.description}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {getAvailablePaymentMethods().length === 0 && (
                                        <div className="rounded-lg border-2 border-border border-dashed px-4 py-8 text-center">
                                            <p className="text-muted-foreground">{t('noPaymentMethods')}</p>
                                            <p className="mt-1 text-muted-foreground text-sm">{t('contactSupport')}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Payment Method Details */}
                                {selectedPaymentMethod && (
                                    <div className="space-y-4">
                                        {selectedPaymentMethod === 'card' && hasStripe && (
                                            <div className="rounded-lg border bg-card p-4">
                                                <h3 className="mb-2 font-medium text-md">💳 {t('cardPayment')}</h3>
                                                <p className="mb-4 text-muted-foreground text-sm">
                                                    {t('cardPaymentDescription')}
                                                </p>
                                                <PaymentElement theme="light" />
                                            </div>
                                        )}
                                        {selectedPaymentMethod === 'card' && !hasStripe && (
                                            <div className="rounded-lg border bg-accent p-4">
                                                <h3 className="mb-2 font-medium text-md">💳 {t('cardPayment')}</h3>
                                                <p className="text-muted-foreground text-sm">{t('cardPaymentSetup')}</p>
                                            </div>
                                        )}
                                        {selectedPaymentMethod === 'bank_transfer' && (
                                            <div className="rounded-lg border bg-accent p-4">
                                                <h3 className="mb-2 font-medium text-md">🏦 {t('bankTransfer')}</h3>
                                                {storeSettings?.paymentMethods?.bankTransferDetails && (
                                                    <div className="mb-3 space-y-2">
                                                        {storeSettings.paymentMethods.bankTransferDetails.bankName && (
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">{t('bankName')}:</span>
                                                                <span>
                                                                    {
                                                                        storeSettings.paymentMethods.bankTransferDetails
                                                                            .bankName
                                                                    }
                                                                </span>
                                                            </div>
                                                        )}
                                                        {storeSettings.paymentMethods.bankTransferDetails
                                                            .accountHolder && (
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">
                                                                    {t('accountHolder')}:
                                                                </span>
                                                                <span>
                                                                    {
                                                                        storeSettings.paymentMethods.bankTransferDetails
                                                                            .accountHolder
                                                                    }
                                                                </span>
                                                            </div>
                                                        )}
                                                        {storeSettings.paymentMethods.bankTransferDetails.iban && (
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">IBAN:</span>
                                                                <span className="font-mono text-sm">
                                                                    {
                                                                        storeSettings.paymentMethods.bankTransferDetails
                                                                            .iban
                                                                    }
                                                                </span>
                                                            </div>
                                                        )}
                                                        {storeSettings.paymentMethods.bankTransferDetails.bic && (
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">BIC:</span>
                                                                <span className="font-mono text-sm">
                                                                    {
                                                                        storeSettings.paymentMethods.bankTransferDetails
                                                                            .bic
                                                                    }
                                                                </span>
                                                            </div>
                                                        )}
                                                        {storeSettings.paymentMethods.bankTransferDetails
                                                            .additionalInstructions && (
                                                            <div className="mt-3 border-t pt-2">
                                                                <p className="text-muted-foreground text-xs">
                                                                    {
                                                                        storeSettings.paymentMethods.bankTransferDetails
                                                                            .additionalInstructions
                                                                    }
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <p className="text-muted-foreground text-sm">
                                                    {t('bankTransferInstructions')}
                                                </p>
                                            </div>
                                        )}{' '}
                                        {selectedPaymentMethod === 'pay_on_delivery' && (
                                            <div className="rounded-lg border bg-accent p-4">
                                                <h3 className="mb-2 font-medium text-md">📦 {t('payOnDelivery')}</h3>
                                                <p className="text-muted-foreground text-sm">
                                                    {t('payOnDeliveryInstructions')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                className="button primary w-full"
                                type="submit"
                                disabled={
                                    isProcessing ||
                                    !selectedPaymentMethod ||
                                    (turnstileKey && !isTurnstileVerified) ||
                                    (selectedPaymentMethod === 'card' && (!stripe || !elements))
                                }>
                                {isProcessing ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                                        <span>{t('processing')}</span>
                                    </div>
                                ) : selectedPaymentMethod === 'card' ? (
                                    t('payAmount', { amount: cartTotal })
                                ) : (
                                    t('placeOrder')
                                )}
                            </button>

                            {/* Error Message */}
                            {errorMessage && (
                                <div className="mt-2 text-center text-red-600 text-sm">{errorMessage}</div>
                            )}
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PaymentForm;
