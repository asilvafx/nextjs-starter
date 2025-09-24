"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Plus, Clock, Users } from "lucide-react";
import { getAll, create, update, remove } from "@/lib/client/query";
import { toast } from "sonner";

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [agendaItems, setAgendaItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch agenda items from database
  const fetchAgendaItems = async () => {
    try {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await getAll('agenda_items', { date: today });
      
      if (response?.success && response.data) {
        setAgendaItems(response.data);
      } else {
        setAgendaItems([]);
      }
    } catch (error) {
      console.error('Error fetching agenda items:', error);
      toast.error('Failed to load agenda items');
      setAgendaItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgendaItems();
  }, [selectedDate]);

  // Calculate total duration and attendees
  const totalDuration = agendaItems.reduce((sum, item) => {
    const duration = item.duration || '0';
    const hours = parseFloat(duration.replace(/[^0-9.]/g, '')) || 0;
    return sum + hours;
  }, 0);

  const totalAttendees = agendaItems.reduce((sum, item) => {
    return sum + (item.attendees || 0);
  }, 0);

  const handleCreateEvent = async () => {
    try {
      const newEvent = {
        title: "New Event",
        time: "12:00 PM",
        duration: "1 hour",
        attendees: 1,
        type: "meeting",
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };
      
      await create(newEvent, 'agenda_items');
      toast.success('Event created successfully');
      fetchAgendaItems();
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <div className="lg:col-span-2">
            <Skeleton className="h-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">
            Manage your daily schedule and appointments
          </p>
        </div>
        <Button className="flex items-center gap-2" onClick={handleCreateEvent}>
          <Plus className="h-4 w-4" />
          New Event
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-8">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Calendar component would be integrated here
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Today's Agenda */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today's Agenda</CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {agendaItems.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No events scheduled for today</p>
                <Button className="mt-2" onClick={handleCreateEvent}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Event
                </Button>
              </div>
            ) : (
              agendaItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {item.time || '12:00 PM'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.title || 'Untitled Event'}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>{item.duration || '1 hour'}</span>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {item.attendees || 1}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Events</p>
                <p className="text-2xl font-bold">{agendaItems.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Duration</p>
                <p className="text-2xl font-bold">{totalDuration.toFixed(1)}h</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Attendees</p>
                <p className="text-2xl font-bold">{totalAttendees}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}