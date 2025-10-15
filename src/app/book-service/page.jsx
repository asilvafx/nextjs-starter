// @/app/book-service/page.jsx - Test Page for Service Booking

"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ServiceBooking from "@/components/ServiceBooking";
import { getAll } from "@/lib/client/query";
import { toast } from "sonner";
import { Clock, MapPin, Euro, Users } from "lucide-react";

export default function BookServicePage() {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch available services that require appointments
  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const response = await getAll('catalog_items');
      
      if (response?.success && response.data) {
        // Filter for services that require appointments
        const appointmentServices = response.data.filter(item => 
          item.type === 'service' && 
          item.requiresAppointment && 
          item.status === 'active'
        );
        setServices(appointmentServices);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
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
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    );
  }

  if (selectedService) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ServiceBooking 
          service={selectedService} 
          onBack={() => setSelectedService(null)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Book a Service Appointment</h1>
        <p className="text-muted-foreground">
          Choose from our available services and schedule your appointment
        </p>
      </div>

      {/* Services Grid */}
      {services.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Services Available</h3>
              <p>There are currently no services that require appointments.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card 
              key={service.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedService(service)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{service.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {service.description}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">Service</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-lg font-semibold text-green-600">
                    <Euro className="h-4 w-4" />
                    {service.price}
                  </div>
                  {service.appointmentSettings?.duration && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {service.appointmentSettings.duration} min
                    </div>
                  )}
                </div>

                {/* Appointment Info */}
                {service.appointmentSettings && (
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {service.appointmentSettings.workingHours && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Working Hours: {service.appointmentSettings.workingHours.start} - {service.appointmentSettings.workingHours.end}
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
                        Book up to {service.appointmentSettings.advanceBookingDays} days in advance
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
                <div className="pt-4 border-t">
                  <div className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md text-center font-medium transition-colors">
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
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
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