// @/app/admin/workspace/agenda/page.jsx

"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Clock, Users, Phone, Mail, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { getAll, create, update, remove } from "@/lib/client/query";
import { toast } from "sonner";

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [agendaItems, setAgendaItems] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [appointmentStatus, setAppointmentStatus] = useState('');

  // Fetch all data for synchronization
  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch appointments first as they're most critical
      console.log('Fetching appointments...');
      const appointmentsResponse = await getAll('appointments');
      console.log('Appointments Response:', appointmentsResponse);
      
      if (appointmentsResponse?.success || Array.isArray(appointmentsResponse?.data)) {
        const appointmentsData = appointmentsResponse.success ? appointmentsResponse.data : appointmentsResponse.data || [];
        setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
        console.log('Appointments loaded:', appointmentsData.length);
      } else {
        console.warn('No appointments data found');
        setAppointments([]);
      }
      
      // Try to fetch other data with individual error handling
      try {
        const agendaResponse = await getAll('agenda_items');
        const agendaData = agendaResponse?.success ? agendaResponse.data : agendaResponse?.data || [];
        setAgendaItems(Array.isArray(agendaData) ? agendaData : []);
      } catch (err) {
        console.warn('Failed to load agenda items:', err);
        setAgendaItems([]);
      }
      
      try {
        const scheduleResponse = await getAll('schedule_items');
        const scheduleData = scheduleResponse?.success ? scheduleResponse.data : scheduleResponse?.data || [];
        setScheduleItems(Array.isArray(scheduleData) ? scheduleData : []);
      } catch (err) {
        console.warn('Failed to load schedule items:', err);
        setScheduleItems([]);
      }
      
      try {
        const tasksResponse = await getAll('tasks');
        const tasksData = tasksResponse?.success ? tasksResponse.data : tasksResponse?.data || [];
        setTasks(Array.isArray(tasksData) ? tasksData : []);
      } catch (err) {
        console.warn('Failed to load tasks:', err);
        setTasks([]);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(`Failed to load data: ${error.message}`);
      setAgendaItems([]);
      setAppointments([]);
      setScheduleItems([]);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Test API connection
  const testAPIConnection = async () => {
    try {
      console.log('Testing API connection...');
      
      // Try a simple API call
      const response = await fetch('/api/query/appointments', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API Response status:', response.status);
      console.log('API Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API Response data:', data);
      } else {
        const errorText = await response.text();
        console.log('API Error text:', errorText);
      }
    } catch (error) {
      console.log('API Connection error:', error);
    }
  };

  useEffect(() => {
    testAPIConnection();
    fetchAllData();
  }, [selectedDate]);

  // Get today's items
  const today = new Date().toISOString().split('T')[0];
  const todaysAppointments = appointments.filter(apt => apt.date === today);
  const todaysAgenda = agendaItems.filter(item => item.date === today);
  const todaysSchedule = scheduleItems.filter(item => item.date === today);
  const todaysTasks = tasks.filter(task => {
    if (task.dueDate) {
      return new Date(task.dueDate).toISOString().split('T')[0] === today;
    }
    return false;
  });

  // Calculate stats
  const totalAppointments = todaysAppointments.length;
  const totalDuration = todaysAppointments.reduce((sum, apt) => sum + (apt.duration || 60), 0);
  const totalRevenue = todaysAppointments.reduce((sum, apt) => sum + (apt.price || 0), 0);

  const handleUpdateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      const appointmentToUpdate = appointments.find(apt => apt.id === appointmentId);
      if (!appointmentToUpdate) return;

      const updatedAppointment = {
        ...appointmentToUpdate,
        status: newStatus,
        updatedAt: new Date().toISOString()
      };

      const response = await update(appointmentId, updatedAppointment, 'appointments');
      if (response?.success) {
        // Also update the corresponding order status
        if (appointmentToUpdate.orderId) {
          const orderStatus = newStatus === 'completed' ? 'completed' : 
                             newStatus === 'cancelled' ? 'cancelled' : 'processing';
          
          await update(appointmentToUpdate.orderId, { status: orderStatus }, 'orders');
        }
        
        toast.success('Appointment status updated');
        fetchAllData();
      } else {
        toast.error('Failed to update appointment');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no-show': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const formatTime = (timeString) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const time = new Date();
      time.setHours(parseInt(hours), parseInt(minutes));
      return time.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return timeString;
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Agenda & Appointments</h1>
          <p className="text-muted-foreground">
            Manage your daily schedule, appointments, and synchronized tasks
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Appointments</p>
                <p className="text-2xl font-bold">{totalAppointments}</p>
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
                <p className="text-2xl font-bold">{Math.round(totalDuration / 60)}h</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expected Revenue</p>
                <p className="text-2xl font-bold">€{totalRevenue.toFixed(0)}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Due Tasks</p>
                <p className="text-2xl font-bold">{todaysTasks.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Appointments</CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {todaysAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No appointments scheduled for today</p>
              </div>
            ) : (
              todaysAppointments.map((appointment) => (
                <div key={appointment.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium">{appointment.serviceName}</h3>
                      <p className="text-sm text-muted-foreground">{appointment.customerName}</p>
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {appointment.duration}min
                    </div>
                    <span className="font-medium text-green-600">€{appointment.price}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <Mail className="h-3 w-3" />
                    {appointment.customerEmail}
                    {appointment.customerPhone && (
                      <>
                        <Phone className="h-3 w-3 ml-2" />
                        {appointment.customerPhone}
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedAppointment(appointment)}>
                          <Edit className="h-3 w-3 mr-1" />
                          Manage
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Manage Appointment</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Service</Label>
                            <p className="text-sm">{appointment.serviceName}</p>
                          </div>
                          <div>
                            <Label>Customer</Label>
                            <p className="text-sm">{appointment.customerName} ({appointment.customerEmail})</p>
                          </div>
                          <div>
                            <Label>Date & Time</Label>
                            <p className="text-sm">{appointment.date} at {formatTime(appointment.startTime)}</p>
                          </div>
                          <div>
                            <Label htmlFor="status">Status</Label>
                            <Select 
                              value={appointmentStatus || appointment.status} 
                              onValueChange={setAppointmentStatus}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                <SelectItem value="no-show">No Show</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => {
                                handleUpdateAppointmentStatus(appointment.id, appointmentStatus || appointment.status);
                                setSelectedAppointment(null);
                                setAppointmentStatus('');
                              }}
                              className="flex-1"
                            >
                              Update Status
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    {appointment.status === 'scheduled' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleUpdateAppointmentStatus(appointment.id, 'confirmed')}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Confirm
                      </Button>
                    )}
                    
                    {appointment.status === 'confirmed' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleUpdateAppointmentStatus(appointment.id, 'completed')}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Synchronized Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Overview</CardTitle>
            <CardDescription>Synchronized agenda, schedule, and tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {/* Tasks Due Today */}
            {todaysTasks.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-orange-700">Tasks Due Today</h4>
                {todaysTasks.map((task) => (
                  <div key={task.id} className="p-2 bg-orange-50 border border-orange-200 rounded text-sm mb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{task.title}</span>
                      <Badge variant="outline" className="text-xs">{task.priority}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                  </div>
                ))}
              </div>
            )}
            
            {/* Schedule Items */}
            {todaysSchedule.filter(item => !item.appointmentId).length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-blue-700">Schedule</h4>
                {todaysSchedule.filter(item => !item.appointmentId).map((item) => (
                  <div key={item.id} className="p-2 bg-blue-50 border border-blue-200 rounded text-sm mb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.title}</span>
                      <span className="text-xs text-muted-foreground">{item.startTime} - {item.endTime}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                  </div>
                ))}
              </div>
            )}
            
            {/* Other Agenda Items */}
            {todaysAgenda.filter(item => !item.appointmentId).length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-green-700">Other Events</h4>
                {todaysAgenda.filter(item => !item.appointmentId).map((item) => (
                  <div key={item.id} className="p-2 bg-green-50 border border-green-200 rounded text-sm mb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.title}</span>
                      <span className="text-xs text-muted-foreground">{item.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{item.duration}</span>
                      <span>{item.attendees} attendees</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {todaysTasks.length === 0 && todaysSchedule.filter(item => !item.appointmentId).length === 0 && todaysAgenda.filter(item => !item.appointmentId).length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">All clear for today!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}