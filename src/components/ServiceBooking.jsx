'use client';

import { ArrowLeft, Calendar, CheckCircle, Clock, Euro, User } from 'lucide-react';
import { useEffect, useState, useId } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { createPublic } from '@/lib/client/query';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const ServiceBooking = ({ service, onBack, onBookingComplete }) => {
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isBooking, setIsBooking] = useState(false);

    const uid = useId();

    // Generate available time slots
    const generateTimeSlots = (workingHours, duration, bufferTime) => {
        const slots = [];
        const startTime = new Date(`2024-01-01 ${workingHours.start}:00`);
        const endTime = new Date(`2024-01-01 ${workingHours.end}:00`);

        const currentTime = new Date(startTime);

        while (currentTime < endTime) {
            const timeString = currentTime.toTimeString().slice(0, 5);
            slots.push(timeString);

            // Add duration + buffer time
            currentTime.setMinutes(currentTime.getMinutes() + duration + bufferTime);
        }

        return slots;
    };

    // Get available slots for selected date
    const getAvailableSlotsForDate = async (date) => {
        if (!date) return;

        setIsLoading(true);
        try {
                // toLocaleDateString doesn't support a 'lowercase' option for weekday.
                // Get the long weekday name and normalize to lowercase to match the
                // `appointmentSettings.workingHours` keys (e.g. 'monday', 'tuesday').
                const dayOfWeek = new Date(date)
                    .toLocaleDateString('en-US', { weekday: 'long' })
                    .toLowerCase();
                const workingHours = service.appointmentSettings?.workingHours?.[dayOfWeek];

            if (!workingHours?.enabled) {
                setAvailableSlots([]);
                toast.error('Service is not available on this day');
                return;
            }

            // Generate all possible slots
            const allSlots = generateTimeSlots(
                workingHours,
                service.appointmentSettings?.duration || 60,
                service.appointmentSettings?.bufferTime || 15
            );

            // Filter out booked slots (would need API call to get existing appointments)
            // For now, show all slots as available
            setAvailableSlots(allSlots);
        } catch (error) {
            console.error('Error fetching available slots:', error);
            toast.error('Failed to load available time slots');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (selectedDate) {
            getAvailableSlotsForDate(selectedDate);
        }
    }, [selectedDate, service]);

    const handleBookAppointment = async () => {
        if (!customerName || !customerEmail || !selectedDate || !selectedTime) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsBooking(true);
        try {
            const payload = {
                serviceId: service.id,
                date: selectedDate,
                startTime: selectedTime,
                customerName,
                customerEmail,
                customerPhone,
                notes
            };

            // Use the client's createPublic helper which handles CSRF and public request flow
            const data = await createPublic(payload, 'book-appointment');

            // createPublic returns the `data` property from the API response on success
            if (data) {
                toast.success('Appointment booked successfully!');
                onBookingComplete?.(data);
                // Reset form
                setSelectedDate('');
                setSelectedTime('');
                setCustomerName('');
                setCustomerEmail('');
                setCustomerPhone('');
                setNotes('');
            } else {
                toast.error('Failed to book appointment');
            }
        } catch (error) {
            console.error('Error booking appointment:', error);
            // Surface API error message when available
            toast.error(error?.message || 'Failed to book appointment');
        } finally {
            setIsBooking(false);
        }
    };

    // Calculate minimum date (today + 1 day)
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 1);
    const minDateString = minDate.toISOString().split('T')[0];

    // Calculate maximum date (based on advance booking days)
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + (service.appointmentSettings?.advanceBookingDays || 30));
    const maxDateString = maxDate.toISOString().split('T')[0];

    return (
        <div className="space-y-6">
            {/* Back Button */}
            {onBack && (
                <Button variant="ghost" onClick={onBack} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Services
                </Button>
            )}

            <Card className="mx-auto w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Book Appointment
                    </CardTitle>
                    <CardDescription>Schedule your {service.name} appointment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Service Info */}
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">{service.name}</h3>
                        <div className="mt-2 flex items-center gap-4 text-blue-700 text-sm dark:text-blue-300">
                            <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {service.appointmentSettings?.duration || 60} minutes
                            </div>
                            <div className="flex items-center gap-1">
                                <Euro className="h-4 w-4" />
                                {service.price}
                            </div>
                        </div>
                        {service.description && (
                            <p className="mt-2 text-blue-600 text-sm dark:text-blue-400">{service.description}</p>
                        )}
                    </div>

                    {/* Customer Information */}
                    <div className="space-y-4">
                        <h4 className="flex items-center gap-2 font-medium">
                            <User className="h-4 w-4" />
                            Your Information
                        </h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <Label htmlFor={`customerName-${uid}`}>Full Name *</Label>
                                <Input
                                    id={`customerName-${uid}`}
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor={`customerEmail-${uid}`}>Email Address *</Label>
                                <Input
                                    id={`customerEmail-${uid}`}
                                    type="email"
                                    value={customerEmail}
                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor={`customerPhone-${uid}`}>Phone Number</Label>
                            <PhoneInput
                                id={`customerPhone-${uid}`}
                                value={customerPhone}
                                onChange={(val) => setCustomerPhone(val || '')}
                                placeholder="+1 (555) 123-4567"
                            />
                        </div>
                    </div>

                    {/* Date Selection */}
                    <div>
                        <Label htmlFor={`appointmentDate-${uid}`}>Select Date *</Label>
                        <Input
                            id={`appointmentDate-${uid}`}
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            min={minDateString}
                            max={maxDateString}
                            required
                        />
                    </div>

                    {/* Time Selection */}
                    {selectedDate && (
                        <div>
                            <Label>Select Time *</Label>
                            {isLoading ? (
                                <div className="py-4 text-center">
                                    <Clock className="mx-auto mb-2 h-8 w-8 animate-spin text-muted-foreground" />
                                    <p className="text-muted-foreground text-sm">Loading available times...</p>
                                </div>
                            ) : availableSlots.length > 0 ? (
                                <div className="mt-2 grid grid-cols-3 gap-2 md:grid-cols-4">
                                    {availableSlots.map((slot) => (
                                        <Button
                                            key={slot}
                                            variant={selectedTime === slot ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setSelectedTime(slot)}
                                            className="text-xs">
                                            {slot}
                                        </Button>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-4 text-center text-muted-foreground">
                                    <p>No available time slots for this date</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <Label htmlFor={`notes-${uid}`}>Additional Notes</Label>
                        <Textarea
                            id={`notes-${uid}`}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any special requests or information..."
                            rows={3}
                        />
                    </div>

                    {/* Booking Summary */}
                    {selectedDate && selectedTime && (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/20">
                            <h4 className="mb-2 font-medium text-green-900 dark:text-green-100">Booking Summary</h4>
                            <div className="space-y-1 text-green-700 text-sm dark:text-green-300">
                                <p>
                                    <strong>Service:</strong> {service.name}
                                </p>
                                <p>
                                    <strong>Date:</strong>{' '}
                                    {new Date(selectedDate).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                                <p>
                                    <strong>Time:</strong> {selectedTime}
                                </p>
                                <p>
                                    <strong>Duration:</strong> {service.appointmentSettings?.duration || 60} minutes
                                </p>
                                <p>
                                    <strong>Price:</strong> €{service.price}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Book Button */}
                    <Button
                        onClick={handleBookAppointment}
                        disabled={!customerName || !customerEmail || !selectedDate || !selectedTime || isBooking}
                        className="w-full"
                        size="lg">
                        {isBooking ? (
                            <>
                                <Clock className="mr-2 h-4 w-4 animate-spin" />
                                Booking Appointment...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Book Appointment (€{service.price})
                            </>
                        )}
                    </Button>

                    <p className="text-center text-muted-foreground text-xs">
                        You will receive a confirmation email after booking.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default ServiceBooking;
