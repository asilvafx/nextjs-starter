// @/app/book-service/page.jsx - Test Page for Service Booking

'use client';

import { Clock, Euro, MapPin, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from 'react-use-cart';
import { toast } from 'sonner';
import ServiceBooking from '@/components/ServiceBooking';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getAll } from '@/lib/client/query';

export default function BookServicePage() {
    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [storeSettings, setStoreSettings] = useState(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const router = useRouter();
    const { emptyCart } = useCart();

    // Fetch available services (all services, regardless of requiresAppointment) and store settings
    const fetchServices = async () => {
        try {
            setIsLoading(true);
            const [response, settingsRes] = await Promise.all([getAll('catalog'), getAll('store_settings')]);

            if (response?.success && response.data) {
                // Only include services that require an appointment
                const appointmentServices = response.data.filter(
                    (item) => item.type === 'service' && item.isActive && item.requiresAppointment
                );
                console.log(response);
                setServices(appointmentServices);
            }

            if (settingsRes?.success && Array.isArray(settingsRes.data) && settingsRes.data.length > 0) {
                setStoreSettings(settingsRes.data[0]);
            }
        } catch (error) {
            console.error('Error fetching services or settings:', error);
            toast.error('Failed to load services');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    if (isLoading) {
        return (
            <div className="container mx-auto space-y-6 px-4 py-8">
                <div>
                    <Skeleton className="mb-2 h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-64" />
                    ))}
                </div>
            </div>
        );
    }

    const getAvailablePaymentMethods = () => {
        const methods = [];

    const hasStripe = !!storeSettings?.paymentMethods?.cardPayments;

        if (hasStripe && storeSettings?.paymentMethods?.cardPayments) {
            methods.push({ value: 'card', label: `💳 Card`, description: 'Pay with card' });
        }

        if (storeSettings?.paymentMethods?.bankTransfer) {
            methods.push({ value: 'bank_transfer', label: `🏦 Bank Transfer`, description: 'Pay via bank transfer' });
        }

        if (storeSettings?.paymentMethods?.payOnDelivery) {
            methods.push({ value: 'pay_on_delivery', label: `📦 Pay on Delivery`, description: 'Pay on delivery' });
        }

        return methods;
    };

    const purchaseService = async (service, method) => {
        try {
            const paymentMethod = method || (getAvailablePaymentMethods()[0]?.value || 'pending');

            const orderId = `${Math.floor(Date.now() / 1000)}_${Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000}`;

            const orderData = {
                id: orderId,
                customer: { firstName: '', lastName: '', email: '', phone: '' },
                items: [
                    {
                        id: service.id,
                        name: service.name,
                        price: service.price || 0,
                        quantity: 1,
                        type: 'service',
                        deliveryMethod: service.deliveryMethod || service.delivery || 'none',
                        // include appointment info if present
                        appointment: service.appointment || null
                    }
                ],
                cartTotal: service.price || 0,
                subtotal: service.price || 0,
                subtotalInclVat: service.price || 0,
                shippingCost: 0,
                shipping: 0,
                vatEnabled: storeSettings?.vatEnabled || false,
                vatPercentage: storeSettings?.vatPercentage || 0,
                vatAmount: 0,
                total: service.price || 0,
                amount: service.price || 0,
                totalItems: 1,
                currency: storeSettings?.currency || 'EUR',
                status: 'pending',
                paymentStatus: paymentMethod === 'card' ? 'paid' : 'pending',
                paymentMethod: paymentMethod,
                method: paymentMethod,
                shippingMethod: service.deliveryMethod || 'none',
                createdAt: new Date().toISOString()
            };

            // Store locally so success page can read it
            localStorage.setItem('orderData', JSON.stringify(orderData));

            // Create order record on server for non-card methods
            if (paymentMethod !== 'card') {
                const res = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });
                const json = await res.json();

                if (!json?.success) {
                    toast.error('Failed to create order');
                    return;
                }
            }

            // Clear cart if any and redirect to success
            emptyCart();
            router.push(`/shop/checkout/success?order_id=${orderData.id}&payment_method=${paymentMethod}`);
        } catch (err) {
            console.error('Purchase service error', err);
            toast.error('Failed to process purchase');
        }
    };

    if (selectedService) {
        // If service requires appointment, show booking flow, else show purchase UI
        if (selectedService.requiresAppointment) {
            return (
                <div className="container mx-auto px-4 py-8">
                    <ServiceBooking service={selectedService} onBack={() => setSelectedService(null)} />
                </div>
            );
        }

        // Purchase UI for non-booking services
        return (
            <div className="container mx-auto px-4 py-8">
                <Card className="mx-auto w-full max-w-2xl">
                    <CardHeader>
                        <CardTitle>{selectedService.name}</CardTitle>
                        <CardDescription>{selectedService.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4">
                            <div className="flex items-center justify-between">
                                <div className="font-medium text-lg">Price</div>
                                <div className="font-semibold">€{selectedService.price}</div>
                            </div>
                            <div className="text-sm text-muted-foreground mt-2">
                                Delivery Method: {selectedService.deliveryMethod || 'none'}
                            </div>
                        </div>

                        <div className="mb-4">
                            <h3 className="font-medium mb-2">Payment</h3>
                            <div className="space-y-2">
                                {getAvailablePaymentMethods().map((m) => (
                                    <button
                                        key={m.value}
                                        type="button"
                                        onClick={() => setSelectedPaymentMethod(m.value)}
                                        className={`w-full text-left cursor-pointer rounded border p-3 ${
                                            selectedPaymentMethod === m.value ? 'border-primary bg-primary/5' : ''
                                        }`}>
                                        <div className="font-medium">{m.label}</div>
                                        <div className="text-muted-foreground text-sm">{m.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => purchaseService(selectedService, selectedPaymentMethod)}
                                className="button primary w-full">
                                Buy Service
                            </button>
                            <button type="button" onClick={() => setSelectedService(null)} className="button">
                                Back
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto space-y-6 px-4 py-8">
            {/* Header */}
            <div className="space-y-2 text-center">
                <h1 className="font-bold text-3xl">Book a Service Appointment</h1>
                <p className="text-muted-foreground">
                    Choose from our available services and schedule your appointment
                </p>
            </div>

            {/* Services Grid */}
            {services.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <div className="text-muted-foreground">
                            <Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
                            <h3 className="mb-2 font-medium text-lg">No Services Available</h3>
                            <p>There are currently no services that require appointments.</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {services.map((service) => (
                        <Card
                            key={service.id}
                            className="cursor-pointer transition-shadow hover:shadow-lg"
                            onClick={() => setSelectedService(service)}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-xl">{service.name}</CardTitle>
                                        <CardDescription className="mt-1">{service.description}</CardDescription>
                                    </div>
                                    <Badge variant="secondary">Service</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Price */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 font-semibold text-green-600 text-lg">
                                        <Euro className="h-4 w-4" />
                                        {service.price}
                                    </div>
                                    {service.appointmentSettings?.duration && (
                                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                                            <Clock className="h-3 w-3" />
                                            {service.appointmentSettings.duration} min
                                        </div>
                                    )}
                                </div>

                                {/* Appointment Info */}
                                {service.appointmentSettings && (
                                    <div className="space-y-2 text-muted-foreground text-sm">
                                        {service.appointmentSettings.workingHours && (
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                Working Hours: {service.appointmentSettings.workingHours.start} -{' '}
                                                {service.appointmentSettings.workingHours.end}
                                            </div>
                                        )}

                                        {service.appointmentSettings.bufferTime && (
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {service.appointmentSettings.bufferTime} min buffer between appointments
                                            </div>
                                        )}

                                        {service.appointmentSettings.advanceBookingDays && (
                                            <div className="text-xs">
                                                Book up to {service.appointmentSettings.advanceBookingDays} days in
                                                advance
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Features */}
                                {service.features && service.features.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {service.features.slice(0, 3).map((feature, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                                {feature}
                                            </Badge>
                                        ))}
                                        {service.features.length > 3 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{service.features.length - 3} more
                                            </Badge>
                                        )}
                                    </div>
                                )}

                                {/* Book Button */}
                                <div className="border-t pt-4">
                                    <div className="h-10 w-full rounded-md bg-primary px-4 py-2 text-center font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                                        Book Appointment
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Info Section */}
            <Card className="bg-muted/50">
                <CardContent className="p-6">
                    <div className="space-y-2 text-center">
                        <h3 className="font-medium text-lg">How It Works</h3>
                        <div className="grid grid-cols-1 gap-4 text-muted-foreground text-sm md:grid-cols-3">
                            <div className="space-y-1">
                                <div className="font-medium text-foreground">1. Choose Service</div>
                                <div>Select the service you need from our available options</div>
                            </div>
                            <div className="space-y-1">
                                <div className="font-medium text-foreground">2. Pick Time</div>
                                <div>Choose a convenient date and time slot for your appointment</div>
                            </div>
                            <div className="space-y-1">
                                <div className="font-medium text-foreground">3. Confirm</div>
                                <div>Provide your details and confirm your booking</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
