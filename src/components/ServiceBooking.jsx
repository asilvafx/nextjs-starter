"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Euro, User, Phone, Mail, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const ServiceBooking = ({ service, onBookingComplete }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // Generate available time slots
  const generateTimeSlots = (workingHours, duration, bufferTime) => {
    const slots = [];
    const startTime = new Date(`2024-01-01 ${workingHours.start}:00`);
    const endTime = new Date(`2024-01-01 ${workingHours.end}:00`);
    
    let currentTime = new Date(startTime);
    
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
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });
      const workingHours = service.appointmentSettings?.workingHours?.[dayOfWeek];
      
      if (!workingHours?.enabled) {
        setAvailableSlots([]);
        toast.error('Service is not available on this day');
        return;
      }
      
      // Generate all possible slots
      const allSlots = generateTimeSlots(
        workingHours,
        service.duration || 60,
        service.appointmentSettings?.bufferTime || 15
      );
      
      // Filter out booked slots (would need API call to get existing appointments)
      // For now, show all slots as available
      setAvailableSlots(allSlots);
      
    } catch (error) {
      console.error('Error fetching available slots:', error);
      toast.error('Failed to load available time slots');
    } finally {\n      setIsLoading(false);\n    }\n  };\n\n  useEffect(() => {\n    if (selectedDate) {\n      getAvailableSlotsForDate(selectedDate);\n    }\n  }, [selectedDate, service]);\n\n  const handleBookAppointment = async () => {\n    if (!customerName || !customerEmail || !selectedDate || !selectedTime) {\n      toast.error('Please fill in all required fields');\n      return;\n    }\n\n    setIsBooking(true);\n    try {\n      const response = await fetch('/api/query/public/book-appointment', {\n        method: 'POST',\n        headers: {\n          'Content-Type': 'application/json',\n        },\n        body: JSON.stringify({\n          serviceId: service.id,\n          date: selectedDate,\n          startTime: selectedTime,\n          customerName,\n          customerEmail,\n          customerPhone,\n          notes\n        }),\n      });\n\n      const result = await response.json();\n\n      if (result.success) {\n        toast.success('Appointment booked successfully!');\n        onBookingComplete?.(result.data);\n      } else {\n        toast.error(result.error || 'Failed to book appointment');\n      }\n    } catch (error) {\n      console.error('Error booking appointment:', error);\n      toast.error('Failed to book appointment');\n    } finally {\n      setIsBooking(false);\n    }\n  };\n\n  // Calculate minimum date (today + 1 day)\n  const minDate = new Date();\n  minDate.setDate(minDate.getDate() + 1);\n  const minDateString = minDate.toISOString().split('T')[0];\n\n  // Calculate maximum date (based on advance booking days)\n  const maxDate = new Date();\n  maxDate.setDate(maxDate.getDate() + (service.appointmentSettings?.advanceBookingDays || 30));\n  const maxDateString = maxDate.toISOString().split('T')[0];\n\n  return (\n    <Card className=\"w-full max-w-2xl mx-auto\">\n      <CardHeader>\n        <CardTitle className=\"flex items-center gap-2\">\n          <Calendar className=\"h-5 w-5\" />\n          Book Appointment\n        </CardTitle>\n        <CardDescription>\n          Schedule your {service.name} appointment\n        </CardDescription>\n      </CardHeader>\n      <CardContent className=\"space-y-6\">\n        {/* Service Info */}\n        <div className=\"bg-blue-50 border border-blue-200 rounded-lg p-4\">\n          <h3 className=\"font-semibold text-blue-900\">{service.name}</h3>\n          <div className=\"flex items-center gap-4 mt-2 text-sm text-blue-700\">\n            <div className=\"flex items-center gap-1\">\n              <Clock className=\"h-4 w-4\" />\n              {service.duration} minutes\n            </div>\n            <div className=\"flex items-center gap-1\">\n              <Euro className=\"h-4 w-4\" />\n              {service.price}\n            </div>\n          </div>\n          {service.description && (\n            <p className=\"text-sm text-blue-600 mt-2\">{service.description}</p>\n          )}\n        </div>\n\n        {/* Customer Information */}\n        <div className=\"space-y-4\">\n          <h4 className=\"font-medium flex items-center gap-2\">\n            <User className=\"h-4 w-4\" />\n            Your Information\n          </h4>\n          <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">\n            <div>\n              <Label htmlFor=\"customerName\">Full Name *</Label>\n              <Input\n                id=\"customerName\"\n                value={customerName}\n                onChange={(e) => setCustomerName(e.target.value)}\n                placeholder=\"John Doe\"\n                required\n              />\n            </div>\n            <div>\n              <Label htmlFor=\"customerEmail\">Email Address *</Label>\n              <Input\n                id=\"customerEmail\"\n                type=\"email\"\n                value={customerEmail}\n                onChange={(e) => setCustomerEmail(e.target.value)}\n                placeholder=\"john@example.com\"\n                required\n              />\n            </div>\n          </div>\n          <div>\n            <Label htmlFor=\"customerPhone\">Phone Number</Label>\n            <Input\n              id=\"customerPhone\"\n              type=\"tel\"\n              value={customerPhone}\n              onChange={(e) => setCustomerPhone(e.target.value)}\n              placeholder=\"+1 (555) 123-4567\"\n            />\n          </div>\n        </div>\n\n        {/* Date Selection */}\n        <div>\n          <Label htmlFor=\"appointmentDate\">Select Date *</Label>\n          <Input\n            id=\"appointmentDate\"\n            type=\"date\"\n            value={selectedDate}\n            onChange={(e) => setSelectedDate(e.target.value)}\n            min={minDateString}\n            max={maxDateString}\n            required\n          />\n        </div>\n\n        {/* Time Selection */}\n        {selectedDate && (\n          <div>\n            <Label>Select Time *</Label>\n            {isLoading ? (\n              <div className=\"text-center py-4\">\n                <Clock className=\"h-8 w-8 mx-auto text-muted-foreground animate-spin mb-2\" />\n                <p className=\"text-sm text-muted-foreground\">Loading available times...</p>\n              </div>\n            ) : availableSlots.length > 0 ? (\n              <div className=\"grid grid-cols-3 md:grid-cols-4 gap-2 mt-2\">\n                {availableSlots.map((slot) => (\n                  <Button\n                    key={slot}\n                    variant={selectedTime === slot ? \"default\" : \"outline\"}\n                    size=\"sm\"\n                    onClick={() => setSelectedTime(slot)}\n                    className=\"text-xs\"\n                  >\n                    {slot}\n                  </Button>\n                ))}\n              </div>\n            ) : (\n              <div className=\"text-center py-4 text-muted-foreground\">\n                <p>No available time slots for this date</p>\n              </div>\n            )}\n          </div>\n        )}\n\n        {/* Notes */}\n        <div>\n          <Label htmlFor=\"notes\">Additional Notes</Label>\n          <Textarea\n            id=\"notes\"\n            value={notes}\n            onChange={(e) => setNotes(e.target.value)}\n            placeholder=\"Any special requests or information...\"\n            rows={3}\n          />\n        </div>\n\n        {/* Booking Summary */}\n        {selectedDate && selectedTime && (\n          <div className=\"bg-green-50 border border-green-200 rounded-lg p-4\">\n            <h4 className=\"font-medium text-green-900 mb-2\">Booking Summary</h4>\n            <div className=\"space-y-1 text-sm text-green-700\">\n              <p><strong>Service:</strong> {service.name}</p>\n              <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString('en-US', {\n                weekday: 'long',\n                year: 'numeric',\n                month: 'long',\n                day: 'numeric'\n              })}</p>\n              <p><strong>Time:</strong> {selectedTime}</p>\n              <p><strong>Duration:</strong> {service.duration} minutes</p>\n              <p><strong>Price:</strong> €{service.price}</p>\n            </div>\n          </div>\n        )}\n\n        {/* Book Button */}\n        <Button \n          onClick={handleBookAppointment}\n          disabled={!customerName || !customerEmail || !selectedDate || !selectedTime || isBooking}\n          className=\"w-full\"\n          size=\"lg\"\n        >\n          {isBooking ? (\n            <>\n              <Clock className=\"h-4 w-4 mr-2 animate-spin\" />\n              Booking Appointment...\n            </>\n          ) : (\n            <>\n              <CheckCircle className=\"h-4 w-4 mr-2\" />\n              Book Appointment (€{service.price})\n            </>\n          )}\n        </Button>\n\n        <p className=\"text-xs text-center text-muted-foreground\">\n          You will receive a confirmation email after booking.\n        </p>\n      </CardContent>\n    </Card>\n  );\n};\n\nexport default ServiceBooking;"