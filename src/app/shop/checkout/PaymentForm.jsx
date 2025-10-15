// @/app/shop/checkout/PaymentForm.jsx
"use client"

import { useState, useEffect } from 'react';
import {
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { PhoneInput } from '@/components/ui/phone-input';
import { CountryDropdown } from '@/components/ui/country-dropdown';
import { useCart } from 'react-use-cart';
import { useTranslations } from 'next-intl';
import { useSession } from "next-auth/react"; 
import ShippingMethodSelector from './ShippingMethodSelector.jsx';
import GooglePlacesInput from '@/components/google-places-input';
import { motion, AnimatePresence } from 'framer-motion';
import Turnstile from 'react-turnstile';
import { getTurnstileSiteKey, getGoogleMapsApiKey } from '@/lib/client/integrations';

const PaymentForm = ({ cartTotal, subTotal, shippingCost, onShippingUpdate, selectedShippingMethod, isEligibleForFreeShipping, storeSettings }) => {
    const t = useTranslations('Checkout');
    const { data: session } = useSession();
    const stripe = useStripe();
    const elements = useElements();
    const { items } = useCart();

    // UI State
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState('information'); // 'information', 'payment'
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Form Data
    const [emailInput, setEmailInput] = useState(session ? session?.email : '');
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

    const handleShippingMethodSelect = (method) => {
        setLocalSelectedShippingMethod(method);
        onShippingUpdate(method.fixed_rate, method);
    };

    const handleCountryChange = (selectedCountry) => {
        setCountryIso(selectedCountry.alpha2);
        setCountry(selectedCountry.alpha2);
        setState('');
        setCity('');
        setZipCode('');
        onShippingUpdate({
            country: selectedCountry.alpha2,
            state: '',
            city: '',
            zipCode: ''
        });
    };
    
    const handleGooglePlacesSelect = (placeDetails) => {
        if (placeDetails && placeDetails.address_components) {
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
    };    // Auto-select free shipping when eligible
    const handleShippingMethodsLoaded = (shippingMethods) => {
        if (isEligibleForFreeShipping && !hasAutoSelectedFreeShipping && shippingMethods.length > 0) {
            // Find free shipping method (id: 3)
            const freeShippingMethod = shippingMethods.find(method => method.id === 3);

            if (freeShippingMethod) {
                setLocalSelectedShippingMethod(freeShippingMethod);
                onShippingUpdate(0, freeShippingMethod);
                setHasAutoSelectedFreeShipping(true);
            } else if (!localSelectedShippingMethod) {
                // If no free shipping available but user is eligible, select first method
                const firstMethod = shippingMethods[0];
                setLocalSelectedShippingMethod(firstMethod);
                onShippingUpdate(firstMethod.fixed_rate, firstMethod);
            }
        } else if (!isEligibleForFreeShipping && !localSelectedShippingMethod && shippingMethods.length > 0) {
            // If not eligible for free shipping, auto-select first available method
            const firstMethod = shippingMethods[0];
            setLocalSelectedShippingMethod(firstMethod);
            onShippingUpdate(firstMethod.fixed_rate, firstMethod);
        }
    };

    // Reset auto-selection when eligibility changes
    useEffect(() => {
        if (!isEligibleForFreeShipping) {
            setHasAutoSelectedFreeShipping(false);
            // If currently selected method is free shipping and user is no longer eligible, reset
            if (localSelectedShippingMethod && localSelectedShippingMethod.id === 3) {
                setLocalSelectedShippingMethod(null);
                onShippingUpdate(0, null);
            }
        }
    }, [isEligibleForFreeShipping]);

    // Google Places Autocomplete handlers
    const handleAddressChange = (placeDetails = null) => {
        if(!placeDetails) return null;

        setStreetAddress(placeDetails.formatted_address);
        // If we have place details from Google Places, auto-fill other fields
        if (placeDetails && placeDetails.address_components) {
            const components = placeDetails.address_components;

            // Extract address components
            let extractedCity = '';
            let extractedState = '';
            let extractedZipCode = '';
            let extractedCountry = '';
            let extractedCountryCode = '';

            components.forEach(component => {
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
        if (errorMessage && errorMessage.includes('address')) {
            setErrorMessage('');
        }
    };

    const handleAddressError = (error) => {
        console.warn('Address input error:', error);
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
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: promoCode.trim(),
                    orderAmount: parseFloat(subTotal),
                    customerEmail: emailInput
                }),
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
        const requiredFields = [
            emailInput,
            firstName,
            lastName,
            streetAddress,
            city,
            state,
            zipCode,
            phone
        ];

        const hasEmptyFields = requiredFields.some(field => !field || field.trim() === '');
        const hasShippingMethod = localSelectedShippingMethod !== null;

        if (hasEmptyFields) {
            setErrorMessage(t('pleaseCompleteAllRequiredFields'));
            return false;
        }

        if (!hasShippingMethod) {
            setErrorMessage(t('pleaseSelectShippingMethod'));
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

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setErrorMessage('');

        try {
            // Validate form data
            if (!emailInput || !firstName || !lastName || !streetAddress || !city || !state || !zipCode || !localSelectedShippingMethod) {
                throw new Error(t('fillAllFields'));
            }

            if (turnstileKey && !isTurnstileVerified) {
                throw new Error('Please complete the security verification');
            }

            const { error: submitError } = await elements.submit();
            if (submitError) {
                throw new Error(submitError.message);
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
                countryIso,
            };

            // Order items data to match orders structure
            const orderItems = items.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                type: 'catalog'
            }));

            // Calculate pricing with applied coupon discount
            const itemsTotal = parseFloat(subTotal);
            const shippingTotal = localSelectedShippingMethod?.fixed_rate || 0;
            const couponDiscount = discountAmount || 0;
            const finalTotal = itemsTotal + shippingTotal - couponDiscount;

            // Create order data matching the orders page structure
            const orderData = {
                id: `ORD-${Date.now()}`,
                customer: customerData,
                items: orderItems,
                subtotal: itemsTotal,
                shippingCost: shippingTotal,
                discountType: appliedCoupon ? appliedCoupon.type : 'fixed',
                discountValue: appliedCoupon ? appliedCoupon.value : 0,
                discountAmount: couponDiscount,
                coupon: appliedCoupon ? {
                    id: appliedCoupon.id,
                    code: appliedCoupon.code,
                    name: appliedCoupon.name,
                    type: appliedCoupon.type,
                    value: appliedCoupon.value
                } : null,
                total: Math.max(0, finalTotal),
                status: 'pending',
                paymentStatus: 'pending',
                paymentMethod: 'card',
                method: 'card', // Alternative field name used in some places
                tracking: null,
                deliveryNotes,
                sendEmail: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // Create payment intent
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderData,
                    storeSettings,
                    returnUrl: window.location.origin + '/shop/checkout/success',
                }),
            });

            const { clientSecret, error } = await response.json();

            if (error) {
                throw new Error(error);
            }

            // Apply coupon usage if a coupon was used
            if (appliedCoupon) {
                try {
                    await fetch('/api/query/public/apply-coupon', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            couponId: appliedCoupon.id,
                            orderId: orderData.id,
                            customerEmail: emailInput,
                            orderAmount: itemsTotal,
                            discountAmount: couponDiscount
                        }),
                    });
                } catch (couponError) {
                    console.error('Failed to apply coupon usage:', couponError);
                    // Don't fail the payment for coupon tracking errors
                }
            }

            // Confirm payment
            const { error: confirmError } = await stripe.confirmPayment({
                elements,
                clientSecret,
                confirmParams: {
                    return_url: window.location.origin + '/shop/checkout/success',
                },
            });

            if (confirmError) {
                throw new Error(confirmError.message);
            }

        } catch (error) {
            console.error('Payment error:', error);
            setErrorMessage(error.message || t('paymentError'));
            setIsProcessing(false);
        }
    };

    const getDefaultCountry = (countryCode = null) => {
        let lang = navigator.language || 'fr-FR';
        if (countryCode) {
            return countryCode;
        }

        const country = lang.split('-')[1] || 'US';

        const fallback = 'FR';
        const supportedCountries = ['US', 'CA', 'GB', 'FR', 'DE', 'AU', 'PT', 'ES'];

        const detectedCountry = supportedCountries.includes(country) ? country : fallback;
        setCountryIso(detectedCountry);

        return detectedCountry;
    };    useEffect(() => {
        const defaultC = getDefaultCountry();
        setCountry(defaultC);
        
        // Fetch integration keys
        const fetchIntegrationKeys = async () => {
            const [turnstileKey, googleMapsKey] = await Promise.all([
                getTurnstileSiteKey(),
                getGoogleMapsApiKey()
            ]);
            setTurnstileKey(turnstileKey);
            setGoogleMapsApiKey(googleMapsKey);
        };
        
        fetchIntegrationKeys();
    }, []);

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
                        className="space-y-6"
                    >
                        {/* Contact Information */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">{t('contactInformation')}</h2>
                            <div className="space-y-4">
                                <input
                                    required
                                    type="email"
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    placeholder={t('emailAddress')}
                                    className="w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                                <PhoneInput
                                    value={phone}
                                    onChange={setPhone}
                                    defaultCountry={countryIso?.toUpperCase() || 'FR'}
                                    placeholder={'+000000000'}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Shipping Information */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">{t('shippingInformation')}</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    required
                                    type="text"
                                    placeholder={t('firstName')}
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="border rounded-xl px-3 py-2 w-full focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                                <input
                                    required
                                    type="text"
                                    placeholder={t('lastName')}
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="border rounded-xl px-3 py-2 w-full focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />

                                {/* Google Places Autocomplete for Street Address */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('streetAddress')}
                                    </label>
                                    <div className="google-places-container">
                                        <GooglePlacesInput
                                            legacy="mobile"
                                            value={streetAddress}
                                            onChange={handleAddressChange}
                                            onPlaceSelected={handleGooglePlacesSelect}
                                            onError={handleAddressError}
                                            placeholder={t('streetAddress')}
                                            styles={{
                                                width: '100%',
                                            }}
                                            apiKey={googleMapsApiKey}
                                        />
                                    </div>
                                </div>

                                <input
                                    type="text"
                                    placeholder={t('apartmentUnit')}
                                    value={apartmentUnit}
                                    onChange={(e) => setApartmentUnit(e.target.value)}
                                    className="col-span-2 border rounded-xl px-3 py-2 w-full focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                                <input
                                    required
                                    type="text"
                                    placeholder={t('city')}
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="border rounded-xl px-3 py-2 w-full focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                                <input
                                    required
                                    type="text"
                                    placeholder={t('stateProvince')}
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    className="border rounded-xl px-3 py-2 w-full focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                                <input
                                    required
                                    type="text"
                                    placeholder={t('zipPostalCode')}
                                    value={zipCode}
                                    onChange={(e) => setZipCode(e.target.value)}
                                    className="border rounded-xl px-3 py-2 w-full focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                                <div className="w-full"> 
                                    <CountryDropdown
                                        defaultValue={countryIso}
                                        onChange={(selectedCountry) => {
                                            setCountryIso(selectedCountry.alpha2);
                                            setCountry(selectedCountry.alpha2);
                                            // Update shipping when country changes
                                            onShippingUpdate({
                                                country: selectedCountry.alpha2,
                                                state: state,
                                                city: city,
                                                zipCode: zipCode
                                            });
                                        }}
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
                            <h2 className="text-lg font-semibold mb-4">Promo Code</h2>
                            {!appliedCoupon ? (
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={promoCode}
                                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                            placeholder="Enter promo code"
                                            className="flex-1 border rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary uppercase"
                                            disabled={promoLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={validatePromoCode}
                                            disabled={promoLoading || !promoCode.trim()}
                                            className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {promoLoading ? 'Validating...' : 'Apply'}
                                        </button>
                                    </div>
                                    {promoError && (
                                        <div className="text-red-600 text-sm">{promoError}</div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-green-600 font-semibold">✓ {appliedCoupon.code}</span>
                                                <span className="text-sm text-gray-600">- {appliedCoupon.name}</span>
                                            </div>
                                            <div className="text-sm text-green-700 mt-1">
                                                You saved €{discountAmount.toFixed(2)}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={removePromoCode}
                                            className="text-red-600 hover:text-red-700 text-sm"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Delivery Notes */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">{t('deliveryNotes')}</h2>
                            <textarea
                                value={deliveryNotes}
                                onChange={(e) => setDeliveryNotes(e.target.value)}
                                placeholder={t('deliveryInstructions')}
                                className="w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                rows="3"
                            />
                        </div>

                        {/* Continue to Payment Button */}
                        <div className="pt-4">
                            <button
                                type="button"
                                onClick={handleContinueToPayment}
                                className="w-full primary"
                            >
                                {t('continueToPayment')}
                            </button>

                            {/* Error Message */}
                            {errorMessage && (
                                <div className="text-red-600 mt-2 text-sm text-center">{errorMessage}</div>
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
                        transition={{ duration: 0.3 }}
                    >
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Order Summary */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-semibold mb-3">{t('orderConfirmation')}</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>{t('deliverTo')}:</span>
                                        <span>{firstName} {lastName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>{t('address')}:</span>
                                        <span className="text-right">{streetAddress}, {city}, {country}</span>
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
                                            <span>Discount ({appliedCoupon.code}):</span>
                                            <span>-€{discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleBackToInformation}
                                    className="text-primary text-sm mt-3 hover:underline"
                                >
                                    ← {t('editInformation')}
                                </button>
                            </div>

                            {/* Turnstile Verification */}
                            {turnstileKey && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-semibold mb-4">Security Verification</h2>
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

                            {/* Payment Methods Information */}
                            {storeSettings?.paymentMethods && (
                                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                    <h3 className="font-semibold mb-2">Available Payment Methods</h3>
                                    <div className="flex flex-wrap gap-2 text-sm">
                                        {storeSettings.paymentMethods.cardPayments && (
                                            <span className="bg-white px-2 py-1 rounded border">💳 Card Payments</span>
                                        )}
                                        {storeSettings.paymentMethods.bankTransfer && (
                                            <span className="bg-white px-2 py-1 rounded border">🏦 Bank Transfer</span>
                                        )}
                                        {storeSettings.paymentMethods.payOnDelivery && (
                                            <span className="bg-white px-2 py-1 rounded border">📦 Pay on Delivery</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Payment Element Section */}
                            <div>
                                <h2 className="text-lg font-semibold mb-4">{t('cardInformation')}</h2>
                                {storeSettings?.paymentMethods?.cardPayments ? (
                                    <PaymentElement theme="light" />
                                ) : (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <p className="text-yellow-800">Card payments are not currently available. Please contact support for alternative payment methods.</p>
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                className="w-full button primary"
                                type="submit"
                                disabled={!stripe || !elements || isProcessing || (turnstileKey && !isTurnstileVerified)}
                            >
                                {isProcessing ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>{t('processing')}</span>
                                    </div>
                                ) : (
                                    t('payButton', { amount: cartTotal })
                                )}
                            </button>

                            {/* Error Message */}
                            {errorMessage && (
                                <div className="text-red-600 mt-2 text-sm text-center">{errorMessage}</div>
                            )}
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PaymentForm;
