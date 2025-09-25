"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, MapPin, Users, Plus, ChevronRight } from "lucide-react";
import { getAll, create, update, remove } from "@/lib/client/query";
import { toast } from "sonner";

export default function SchedulePage() {
  const [selectedView, setSelectedView] = useState('week');
  const [scheduleItems, setScheduleItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch schedule items from database
  const fetchScheduleItems = async () => {
    try {
      setIsLoading(true);
      const response = await getAll('schedule_items');
      
      if (response?.success && response.data) {
        setScheduleItems(response.data);
      } else {
        setScheduleItems([]);
      }
    } catch (error) {
      console.error('Error fetching schedule items:', error);
      toast.error('Failed to load schedule items');
      setScheduleItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleItems();
  }, [selectedView]);

  const handleCreateEvent = async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const newEvent = {
        title: "New Event",
        type: "meeting",
        startTime: "12:00",
        endTime: "13:00",
        date: tomorrow.toISOString().split('T')[0],
        location: "TBD",
        attendees: ["Organizer"],
        description: "Event description",
        createdAt: new Date().toISOString()
      };
      
      await create(newEvent, 'schedule_items');
      toast.success('Event created successfully');
      fetchScheduleItems();
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    }
  };

  const typeConfig = {
    meeting: { color: "bg-blue-100 text-blue-800", icon: Users },
    review: { color: "bg-purple-100 text-purple-800", icon: Clock },
    presentation: { color: "bg-green-100 text-green-800", icon: ChevronRight },
    standup: { color: "bg-orange-100 text-orange-800", icon: Users }
  };

  // Group events by date
  const groupedSchedule = scheduleItems.reduce((acc, item) => {
    const date = item.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  // Calculate today's events
  const today = new Date().toISOString().split('T')[0];
  const todaysEvents = scheduleItems.filter(item => item.date === today);
  const meetingCount = scheduleItems.filter(item => item.type === 'meeting').length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="space-y-6">
          {[1,2].map(i => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long', 
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Schedule</h1>
          <p className="text-muted-foreground">
            View and manage your upcoming appointments and events
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-lg">
            {['week', 'month'].map((view) => (
              <Button
                key={view}
                variant={selectedView === view ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedView(view)}
                className="capitalize"
              >
                {view}
              </Button>
            ))}
          </div>
          <Button className="flex items-center gap-2" onClick={handleCreateEvent}>
            <Plus className="h-4 w-4" />
            New Event
          </Button>
        </div>
      </div>

      {/* Schedule Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Events</p>
                <p className="text-2xl font-bold">{todaysEvents.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">{scheduleItems.length}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Meetings</p>
                <p className="text-2xl font-bold">{meetingCount}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Free Time</p>
                <p className="text-2xl font-bold">4h</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Timeline */}
      <div className="space-y-6">
        {Object.keys(groupedSchedule).length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No events scheduled</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first event
              </p>
              <Button onClick={handleCreateEvent}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedSchedule).map(([date, events]) => (
            <Card key={date}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {formatDate(date)}
                </CardTitle>
                <CardDescription>
                  {events.length} event{events.length > 1 ? 's' : ''} scheduled
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {events.map((event) => {
                  const TypeIcon = typeConfig[event.type]?.icon || Clock;
                  
                  return (
                    <div key={event.id} className="flex gap-4 p-4 border rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex flex-col items-center text-sm text-muted-foreground min-w-[80px]">
                        <span className="font-medium">{event.startTime || '12:00'}</span>
                        <span className="text-xs">to</span>
                        <span>{event.endTime || '13:00'}</span>
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{event.title || 'Untitled Event'}</h3>
                          <Badge className={typeConfig[event.type]?.color || typeConfig.meeting.color}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {event.type || 'meeting'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {event.description || 'No description provided'}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location || 'TBD'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {Array.isArray(event.attendees) 
                              ? `${event.attendees.length} attendees`
                              : event.attendees || '1 attendee'
                            }
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}