// @/app/admin/workspace/schedule/page.jsx

"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, MapPin, Users, Plus, ChevronRight, Phone, Mail, Euro, Edit, Trash2, Eye, MoreHorizontal, Search, Filter } from "lucide-react";
import { getAll, create, update, remove } from "@/lib/client/query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function SchedulePage() {
  const [selectedView, setSelectedView] = useState('week');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [scheduleItems, setScheduleItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'meeting',
    startTime: '09:00',
    endTime: '10:00',
    date: new Date().toISOString().split('T')[0],
    location: '',
    attendees: [],
    description: ''
  });

  // Fetch schedule items and appointments from database
  const fetchScheduleItems = async () => {
    try {
      setIsLoading(true);
      
      let allItems = [];
      
      // Fetch appointments with better error handling
      try { 
        const appointmentsResponse = await getAll('appointments'); 
        
        let appointmentsData = [];
        if (appointmentsResponse?.success && Array.isArray(appointmentsResponse.data)) {
          appointmentsData = appointmentsResponse.data;
        } else if (Array.isArray(appointmentsResponse)) {
          appointmentsData = appointmentsResponse;
        }
        
        if (appointmentsData.length > 0) { 
          const appointmentItems = appointmentsData.map(apt => ({
            id: `apt_${apt.id}`,
            title: `${apt.serviceName || 'Service'}`,
            type: 'appointment',
            startTime: apt.startTime || '12:00',
            endTime: apt.endTime || '13:00',
            date: apt.date || new Date().toISOString().split('T')[0],
            location: 'Office',
            attendees: [apt.customerName || 'Customer'],
            description: `Service appointment with ${apt.customerName || 'Customer'}`,
            appointmentId: apt.id,
            customerEmail: apt.customerEmail,
            customerPhone: apt.customerPhone,
            price: apt.price || 0,
            status: apt.status || 'scheduled'
          }));
          
          allItems = [...allItems, ...appointmentItems];
        }
      } catch (err) {
        console.warn('Failed to load appointments for schedule:', err.message);
      }
      
      // Try to fetch schedule items
      try {
        const scheduleResponse = await getAll('schedule_items');
        let scheduleData = [];
        if (scheduleResponse?.success && Array.isArray(scheduleResponse.data)) {
          scheduleData = scheduleResponse.data;
        } else if (Array.isArray(scheduleResponse)) {
          scheduleData = scheduleResponse;
        }
        
        if (scheduleData.length > 0) {
          allItems = [...allItems, ...scheduleData];
        }
      } catch (err) {
        console.warn('Failed to load schedule items:', err.message);
      }
      
      setScheduleItems(allItems);
    } catch (error) {
      console.error('Error fetching schedule items:', error);
      // Don't show error toast for optional workspace data
      setScheduleItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleItems();
  }, [selectedView]);

  const handleCreateEvent = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setFormData({
      title: '',
      type: 'meeting',
      startTime: '09:00',
      endTime: '10:00',
      date: tomorrow.toISOString().split('T')[0],
      location: '',
      attendees: [],
      description: ''
    });
    setSelectedEvent(null);
    setIsCreateDialogOpen(true);
  };

  const handleEditEvent = (event) => {
    setFormData({
      title: event.title || '',
      type: event.type || 'meeting',
      startTime: event.startTime || '09:00',
      endTime: event.endTime || '10:00',
      date: event.date || new Date().toISOString().split('T')[0],
      location: event.location || '',
      attendees: Array.isArray(event.attendees) ? event.attendees : [event.attendees || ''],
      description: event.description || ''
    });
    setSelectedEvent(event);
    setIsEditDialogOpen(true);
  };

  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    setIsViewDialogOpen(true);
  };

  const handleDeleteEvent = (event) => {
    setSelectedEvent(event);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const eventData = {
        ...formData,
        attendees: Array.isArray(formData.attendees) ? formData.attendees : [formData.attendees].filter(Boolean),
        createdAt: selectedEvent ? selectedEvent.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      if (selectedEvent) {
        await update(selectedEvent.id, eventData, 'schedule_items');
        toast.success('Event updated successfully');
        setIsEditDialogOpen(false);
      } else {
        await create(eventData, 'schedule_items');
        toast.success('Event created successfully');
        setIsCreateDialogOpen(false);
      }
      
      fetchScheduleItems();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEvent) return;
    
    setIsDeleting(true);
    try {
      await remove(selectedEvent.id, 'schedule_items');
      toast.success('Event deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedEvent(null);
      fetchScheduleItems();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  const typeConfig = {
    meeting: { color: "bg-blue-100 text-blue-800", icon: Users },
    review: { color: "bg-purple-100 text-purple-800", icon: Clock },
    presentation: { color: "bg-green-100 text-green-800", icon: ChevronRight },
    standup: { color: "bg-orange-100 text-orange-800", icon: Users },
    appointment: { color: "bg-emerald-100 text-emerald-800", icon: Calendar }
  };

  // Filter events based on search and type filter
  const filteredItems = scheduleItems.filter(item => {
    const typeMatch = selectedFilter === 'all' || item.type === selectedFilter;
    const searchMatch = !searchQuery || 
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(item.attendees) ? item.attendees.join(' ') : item.attendees || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    return typeMatch && searchMatch;
  });

  // Group filtered events by date
  const groupedSchedule = filteredItems.reduce((acc, item) => {
    const date = item.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  // Calculate statistics based on selected view
  const today = new Date().toISOString().split('T')[0];
  const todaysEvents = scheduleItems.filter(item => item.date === today);
  
  const getDateRange = () => {
    const now = new Date();
    if (selectedView === 'week') {
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      return { start: weekStart.toISOString().split('T')[0], end: weekEnd.toISOString().split('T')[0] };
    } else {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: monthStart.toISOString().split('T')[0], end: monthEnd.toISOString().split('T')[0] };
    }
  };
  
  const { start, end } = getDateRange();
  const periodEvents = scheduleItems.filter(item => item.date >= start && item.date <= end);
  const meetingCount = periodEvents.filter(item => item.type === 'meeting').length;
  const appointmentCount = periodEvents.filter(item => item.type === 'appointment').length;
  
  // Calculate estimated free time (assuming 8-hour workday)
  const totalBookedHours = periodEvents.reduce((total, event) => {
    const start = event.startTime?.split(':') || ['9', '0'];
    const end = event.endTime?.split(':') || ['10', '0'];
    const duration = (parseInt(end[0]) * 60 + parseInt(end[1])) - (parseInt(start[0]) * 60 + parseInt(start[1]));
    return total + Math.max(0, duration / 60);
  }, 0);
  
  const workDays = selectedView === 'week' ? 5 : 22; // Approximate work days
  const totalWorkHours = workDays * 8;
  const freeHours = Math.max(0, totalWorkHours - totalBookedHours);

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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="meeting">Meetings</SelectItem>
              <SelectItem value="appointment">Appointments</SelectItem>
              <SelectItem value="review">Reviews</SelectItem>
              <SelectItem value="presentation">Presentations</SelectItem>
              <SelectItem value="standup">Standups</SelectItem>
            </SelectContent>
          </Select>
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
                <p className="text-sm text-muted-foreground">This {selectedView === 'week' ? 'Week' : 'Month'}</p>
                <p className="text-2xl font-bold">{periodEvents.length}</p>
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
                <p className="text-sm text-muted-foreground">Appointments</p>
                <p className="text-2xl font-bold">{appointmentCount}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Free Time</p>
                <p className="text-2xl font-bold">{Math.round(freeHours)}h</p>
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
                          {event.status && event.type === 'appointment' && (
                            <Badge variant={event.status === 'confirmed' ? 'default' : 'outline'} className="text-xs">
                              {event.status}
                            </Badge>
                          )}
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
                          {event.price && (
                            <div className="flex items-center gap-1 text-green-600">
                              <Euro className="h-3 w-3" />
                              {event.price}
                            </div>
                          )}
                        </div>
                        
                        {/* Appointment contact info */}
                        {event.type === 'appointment' && (event.customerEmail || event.customerPhone) && (
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            {event.customerEmail && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {event.customerEmail}
                              </div>
                            )}
                            {event.customerPhone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {event.customerPhone}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {/* Mobile view - show individual buttons */}
                        <div className="flex gap-2 sm:hidden">
                          <Button variant="outline" size="sm" onClick={() => handleViewEvent(event)}>
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditEvent(event)}>
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                        
                        {/* Desktop view - show dropdown menu */}
                        <div className="hidden sm:block">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="h-4 w-4 mr-2" />
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px]">
                              <DropdownMenuItem onClick={() => handleViewEvent(event)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditEvent(event)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Event
                              </DropdownMenuItem>
                              {!event.appointmentId && (
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteEvent(event)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Event
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Event Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>
              Schedule a new event or meeting in your calendar.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEvent} className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter event title"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the event..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Event Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="presentation">Presentation</SelectItem>
                      <SelectItem value="standup">Standup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Event location or meeting room"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Event'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update the event details and settings.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEvent} className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Event Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter event title"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the event..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-type">Event Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="presentation">Presentation</SelectItem>
                      <SelectItem value="standup">Standup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-date">Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-startTime">Start Time</Label>
                  <Input
                    id="edit-startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-endTime">End Time</Label>
                  <Input
                    id="edit-endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Event location or meeting room"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Event'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Event Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              View complete event information and details.
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Title</Label>
                  <p className="text-lg font-semibold">{selectedEvent.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="text-sm">{selectedEvent.description || 'No description provided'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                    <div className="mt-1">
                      <Badge className={typeConfig[selectedEvent.type]?.color || typeConfig.meeting.color}>
                        {selectedEvent.type || 'meeting'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Date</Label>
                    <p className="text-sm">{selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString() : 'No date'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Start Time</Label>
                    <p className="text-sm">{selectedEvent.startTime || 'TBD'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">End Time</Label>
                    <p className="text-sm">{selectedEvent.endTime || 'TBD'}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                  <p className="text-sm">{selectedEvent.location || 'TBD'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Attendees</Label>
                  <p className="text-sm">
                    {Array.isArray(selectedEvent.attendees) 
                      ? selectedEvent.attendees.join(', ') || 'No attendees'
                      : selectedEvent.attendees || 'No attendees'
                    }
                  </p>
                </div>
                {selectedEvent.customerEmail && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Contact</Label>
                    <div className="text-sm space-y-1">
                      <p>{selectedEvent.customerEmail}</p>
                      {selectedEvent.customerPhone && <p>{selectedEvent.customerPhone}</p>}
                    </div>
                  </div>
                )}
                {selectedEvent.price && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Price</Label>
                    <p className="text-sm font-semibold text-green-600">€{selectedEvent.price}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setIsViewDialogOpen(false);
                  handleEditEvent(selectedEvent);
                }}>
                  Edit Event
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedEvent?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Event'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}