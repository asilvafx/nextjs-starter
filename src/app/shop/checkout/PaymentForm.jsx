// @/app/shop/checkout/PaymentForm.jsx
"use client"

import { useState, useEffect } from 'react';
import {
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import 'react-phone-input-2/lib/style.css'
import PhoneInput from 'react-phone-input-2'
import { useCart } from 'react-use-cart';
import { useTranslations } from 'next-intl';
import { useSession } from "next-auth/react"; 
import ShippingMethodSelector from './ShippingMethodSelector.jsx';
import GooglePlacesInput from '@/components/google-places-input';
import { motion, AnimatePresence } from 'framer-motion';

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

    const handleShippingMethodSelect = (method) => {
        setLocalSelectedShippingMethod(method);
        onShippingUpdate(method.fixed_rate, method);
    };

    const handleCountryChange = (selectedCountry) => {
        const countryCode = COUNTRIES.find(c => c.value === selectedCountry);
        if (countryCode) {
            setCountry(selectedCountry);
            setCountryIso(countryCode.code);
            // Reset shipping method when country changes
            setLocalSelectedShippingMethod(null);
            setHasAutoSelectedFreeShipping(false);
            onShippingUpdate(0, null);
        }
    };

    // Auto-select free shipping when eligible
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
            if (!emailInput) {
                setErrorMessage(t('emailRequired'));
                setIsProcessing(false);
                return;
            }

            // Validate the form
            const { error: submitError } = await elements.submit();
            if (submitError) {
                setErrorMessage(submitError.message);
                setIsProcessing(false);
                return;
            }

            // Calculate the price in cents
            const priceInCents = Math.round(cartTotal * 100);

            // Create the PaymentIntent on your backend
            const response = await fetch(`/api/stripe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currency: (storeSettings?.currency || 'EUR').toLowerCase(),
                    email: emailInput,
                    amount: priceInCents,
                    paymentMethodType: "card"
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || t('paymentError'));
            }

            const { client_secret: clientSecret } = await response.json();

            // Confirm the payment
            const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
                elements,
                clientSecret,
                confirmParams: {
                    return_url: `${window.location.origin}/shop/checkout/success`,
                    receipt_email: emailInput,
                },
                redirect: 'if_required'
            });

            if (confirmError) {
                setErrorMessage(confirmError.message);
                setIsProcessing(false);
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                // Prepare shipping address
                const shippingAddress = {
                    name: `${firstName} ${lastName}`,
                    street: streetAddress,
                    apartment: apartmentUnit,
                    city: city,
                    state: state,
                    zip: zipCode,
                    country: country,
                    phone: phone
                };

                // Format cart items for order storage
                const orderItems = items.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    sku: item.sku || null,
                    image: item.image || null,
                }));

                const orderId = `ORD-${paymentIntent.created}-${Math.floor(Math.random() * 1000)}`;

                // Prepare order data for insertion
                const newOrderData = {
                    uid: orderId,
                    cst_email: emailInput,
                    cst_name: `${firstName} ${lastName}`,
                    tx: paymentIntent.id,
                    amount: paymentIntent.amount / 100,
                    subtotal: subTotal,
                    shipping: shippingCost,
                    shipping_method: JSON.stringify(localSelectedShippingMethod),
                    currency: (storeSettings?.currency || paymentIntent.currency),
                    method: paymentIntent.payment_method_types[0],
                    created_at: paymentIntent.created,
                    status: "pending",
                    tracking: "",
                    shipping_address: JSON.stringify(shippingAddress),
                    delivery_notes: deliveryNotes,
                    items: JSON.stringify(orderItems),
                    ref: localStorage.getItem('ref') || ''
                }

                // Prepare the complete payload with both orderData and emailPayload
                const payload = {
                    // Complete order data for DB storage
                    orderData: {
                        uid: newOrderData.uid || atob(orderId),
                        tx: newOrderData.tx,
                        cst_email: newOrderData.cst_email,
                        cst_name: newOrderData.cst_name,
                        items: newOrderData.items,
                        amount: newOrderData.amount,
                        subtotal: newOrderData.subtotal,
                        shipping: newOrderData.shipping,
                        totalItems: newOrderData.totalItems,
                        shipping_address: newOrderData.shipping_address,
                        currency: (storeSettings?.currency?.toLowerCase() || newOrderData.currency || 'eur'),
                        method: newOrderData.method || 'Carte bancaire',
                        status: newOrderData.status || 'Confirmé',
                        created_at: new Date().toISOString(),
                        // Add any other fields from your orderData
                        ...newOrderData
                    },
                    // Email payload for sending confirmation email
                    emailPayload: {
                        email: newOrderData.cst_email,
                        customerName: newOrderData.cst_name,
                        orderId: newOrderData.uid || atob(orderId),
                        orderDate: new Date().toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }),
                        items: typeof newOrderData.items === 'string' ? JSON.parse(newOrderData.items) : newOrderData.items,
                        subtotal: newOrderData.subtotal,
                        shippingCost: newOrderData.shipping,
                        total: newOrderData.amount,
                        shippingAddress: typeof newOrderData.shipping_address === 'string'
                            ? JSON.parse(newOrderData.shipping_address)
                            : newOrderData.shipping_address,
                    }
                };

                const response = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    localStorage.setItem('orderData', JSON.stringify(newOrderData));
                    window.location.href = `${window.location.origin}/shop/checkout/success?tx=${btoa(orderId)}`;
                } else {
                    setErrorMessage(t('unexpectedError'));
                    setIsProcessing(false);
                }
            }
        } catch (err) {
            setErrorMessage(err.message || t('unexpectedError'));
            setIsProcessing(false);
        }
    };

    const getDefaultCountry = (countryCode = null) => {
        let lang = navigator.language || 'fr-FR';
        if (countryCode) {
            lang = countryCode.code;
            setCountry(countryCode.name);
            setCountryIso(lang);
        }

        const country = lang.split('-')[1] || 'US';

        const fallback = 'FR';
        const supportedCountries = ['US', 'CA', 'GB', 'FR', 'DE', 'AU', 'PT', 'ES'];

        lang = supportedCountries.includes(country) ? country : fallback;
        setCountryIso(lang.toLowerCase());

        return lang;
    };

    useEffect(() => {
        const defaultC = getDefaultCountry();
        setCountry(defaultC);
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
                                    required
                                    country={countryIso?.toLowerCase() || 'fr'}
                                    value={phone}
                                    onChange={setPhone}
                                    inputStyle={{ width: "100%" }}
                                    containerClass="phone-input-container rounded-xl border"
                                    buttonClass="phone-input-button"
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
                                            onPlaceSelected={(placeDetails) => {
                                                if (placeDetails.formatted_address) {
                                                    handleAddressChange(placeDetails);
                                                }
                                            }}
                                            onError={handleAddressError}
                                            placeholder={t('streetAddress')}
                                            styles={{
                                                width: '100%',
                                            }}
                                            apiKey={process.env.NEXT_PUBLIC_GOOGLE_API_KEY}
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
                                    {/* Country Selector Component */}
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
                                </div>
                                <button
                                    type="button"
                                    onClick={handleBackToInformation}
                                    className="text-primary text-sm mt-3 hover:underline"
                                >
                                    ← {t('editInformation')}
                                </button>
                            </div>

                            {/* Payment Element Section */}
                            <div>
                                <h2 className="text-lg font-semibold mb-4">{t('cardInformation')}</h2>
                                <PaymentElement theme="light" />
                            </div>

                            {/* Submit Button */}
                            <button
                                className="w-full button primary"
                                type="submit"
                                disabled={!stripe || !elements || isProcessing}
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
