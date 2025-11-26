// @/app/admin/workspace/agenda/page.jsx

'use client';

import { Calendar, CheckCircle, Clock, Edit, Mail, Phone, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    getAllAppointments, 
    getAllAgenda, 
    getAllScheduleItems, 
    getAllTasks, 
    getAllOrders, 
    getAllCatalog,
    updateAppointment,
    updateOrder,
    createOrderTask,
    createTask
} from '@/lib/server/admin.js';

export default function AgendaPage() {
    const [selectedDate, _setSelectedDate] = useState(new Date());
    const [agendaItems, setAgendaItems] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [scheduleItems, setScheduleItems] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [orders, setOrders] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [_selectedAppointment, setSelectedAppointment] = useState(null);
    const [_isAppointmentDialogOpen, _setIsAppointmentDialogOpen] = useState(false);
    const [appointmentStatus, setAppointmentStatus] = useState('');
    const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Fetch all data for synchronization
    const fetchAllData = async () => {
        try {
            setIsLoading(true);

            // Initialize all arrays to prevent undefined errors
            setAppointments([]);
            setAgendaItems([]);
            setScheduleItems([]);
            setTasks([]);
            setOrders([]);
            setCatalog([]);

            // Fetch appointments with proper error handling
            try {
                const appointmentsResponse = await getAllAppointments();

                if (appointmentsResponse?.success && Array.isArray(appointmentsResponse.data)) {
                    setAppointments(appointmentsResponse.data);
                } else {
                    console.warn('No appointments data found or invalid format');
                    setAppointments([]);
                }
            } catch (err) {
                console.warn('Failed to load appointments:', err.message);
                setAppointments([]);
            }

            // Fetch orders (including service bookings)
            try {
                const ordersResponse = await getAllOrders();
                if (ordersResponse?.success && Array.isArray(ordersResponse.data)) {
                    setOrders(ordersResponse.data);
                } else {
                    setOrders([]);
                }
            } catch (err) {
                console.warn('Failed to load orders:', err.message);
                setOrders([]);
            }

            // Fetch catalog items (services)
            try {
                const catalogResponse = await getAllCatalog();
                if (catalogResponse?.success && Array.isArray(catalogResponse.data)) {
                    setCatalog(catalogResponse.data);
                } else {
                    setCatalog([]);
                }
            } catch (err) {
                console.warn('Failed to load catalog:', err.message);
                setCatalog([]);
            }

            // Try to fetch other data with individual error handling
            try {
                const agendaResponse = await getAllAgenda();
                if (agendaResponse?.success && Array.isArray(agendaResponse.data)) {
                    setAgendaItems(agendaResponse.data);
                } else {
                    setAgendaItems([]);
                }
            } catch (err) {
                console.warn('Failed to load agenda items:', err.message);
                setAgendaItems([]);
            }

            try {
                const scheduleResponse = await getAllScheduleItems();
                if (scheduleResponse?.success && Array.isArray(scheduleResponse.data)) {
                    setScheduleItems(scheduleResponse.data);
                } else {
                    setScheduleItems([]);
                }
            } catch (err) {
                console.warn('Failed to load schedule items:', err.message);
                setScheduleItems([]);
            }

            try {
                const tasksResponse = await getAllTasks();
                if (tasksResponse?.success && Array.isArray(tasksResponse.data)) {
                    setTasks(tasksResponse.data);
                } else {
                    setTasks([]);
                }
            } catch (err) {
                console.warn('Failed to load tasks:', err.message);
                setTasks([]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            // Don't show error toast unless it's a critical failure
            // Most workspace data is optional
            setAppointments([]);
            setAgendaItems([]);
            setScheduleItems([]);
            setTasks([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to get service details from catalog
    const getServiceDetails = (serviceId) => {
        return catalog.find((item) => item.id === serviceId) || {};
    };

    // Helper function to get order details
    const getOrderDetails = (orderId) => {
        return orders.find((order) => order.id === orderId) || {};
    };

    // Create enriched appointments with service and order data + include service orders requiring appointments
    const enrichedAppointments = [
        // Regular appointments from appointments collection
        ...appointments.map((apt) => {
            const serviceDetails = getServiceDetails(apt.serviceId);
            const orderDetails = getOrderDetails(apt.orderId);

            return {
                ...apt,
                source: 'appointment',
                // Service details from catalog
                serviceType: serviceDetails.serviceType || 'standard',
                deliveryMethod: serviceDetails.deliveryMethod || 'in-person',
                maxParticipants: serviceDetails.maxParticipants || 1,
                serviceIncludes: serviceDetails.serviceIncludes || '',
                serviceNotes: serviceDetails.serviceNotes || '',
                prerequisites: serviceDetails.prerequisites || '',
                // Order details
                orderStatus: orderDetails.status || 'pending',
                paymentStatus: orderDetails.paymentStatus || 'pending',
                paymentMethod: orderDetails.paymentMethod || '',
                orderTotal: orderDetails.total || apt.price || 0,
                customerDetails: {
                    ...orderDetails.customer,
                    name:
                        apt.customerName || `${orderDetails.customer?.firstName} ${orderDetails.customer?.lastName}` || '',
                    email: apt.customerEmail || orderDetails.customer?.email || '',
                    phone: apt.customerPhone || orderDetails.customer?.phone || ''
                }
            };
        }),
        // Service orders that require appointments from orders collection
        ...orders
            .filter((order) => {
                // Filter orders that have services requiring appointments
                return order.items && order.items.some((item) => {
                    const service = catalog.find((cat) => cat.id === item.productId);
                    return service && service.requiresAppointment === true;
                });
            })
            .map((order) => {
                // Create appointment entries for each service item requiring appointment
                return order.items
                    .filter((item) => {
                        const service = catalog.find((cat) => cat.id === item.productId);
                        return service && service.requiresAppointment === true;
                    })
                    .map((item) => {
                        const service = catalog.find((cat) => cat.id === item.productId);
                        
                        return {
                            id: `order-${order.id}-${item.productId}`,
                            source: 'order',
                            title: `Service: ${service?.name || 'Unknown Service'}`,
                            description: service?.description || '',
                            date: order.appointmentDate || order.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
                            time: order.appointmentTime || '09:00',
                            duration: service?.duration || 60,
                            status: order.appointmentStatus || 'scheduled',
                            serviceId: service?.id,
                            orderId: order.id,
                            price: item.price || service?.price || 0,
                            // Service details from catalog
                            serviceType: service?.serviceType || 'standard',
                            deliveryMethod: service?.deliveryMethod || 'in-person',
                            maxParticipants: service?.maxParticipants || 1,
                            serviceIncludes: service?.serviceIncludes || '',
                            serviceNotes: service?.serviceNotes || '',
                            prerequisites: service?.prerequisites || '',
                            // Order details
                            orderStatus: order.status || 'pending',
                            paymentStatus: order.paymentStatus || 'pending',
                            paymentMethod: order.paymentMethod || '',
                            orderTotal: order.total || 0,
                            customerDetails: {
                                ...order.customer,
                                name: `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim() || order.customer?.email || 'Unknown Customer',
                                email: order.customer?.email || '',
                                phone: order.customer?.phone || ''
                            }
                        };
                    });
            })
            .flat() // Flatten the array since we're mapping over items within orders
    ];

    useEffect(() => {
        fetchAllData();
    }, [selectedDate]);

    // Get today's items using enriched data
    const today = new Date().toISOString().split('T')[0];
    const todaysAppointments = enrichedAppointments.filter((apt) => apt.date === today);
    const todaysAgenda = agendaItems.filter((item) => item.date === today);
    const todaysSchedule = scheduleItems.filter((item) => item.date === today);
    const todaysTasks = tasks.filter((task) => {
        if (task.dueDate) {
            return new Date(task.dueDate).toISOString().split('T')[0] === today;
        }
        return false;
    });

    // Calculate enhanced stats
    const totalAppointments = todaysAppointments.length;
    const totalDuration = todaysAppointments.reduce((sum, apt) => sum + (apt.duration || 60), 0);
    const totalRevenue = todaysAppointments.reduce((sum, apt) => sum + (apt.orderTotal || apt.price || 0), 0);
    const confirmedAppointments = todaysAppointments.filter((apt) => apt.status === 'confirmed').length;
    const pendingAppointments = todaysAppointments.filter(
        (apt) => apt.status === 'scheduled' || apt.status === 'pending'
    ).length;
    const completedAppointments = todaysAppointments.filter((apt) => apt.status === 'completed').length;
    const paidBookings = todaysAppointments.filter((apt) => apt.paymentStatus === 'paid').length;

    const handleViewOrderDetails = (appointment) => {
        const orderDetails = getOrderDetails(appointment.orderId);
        setSelectedOrder({
            ...orderDetails,
            appointment: appointment
        });
        setIsOrderDetailsOpen(true);
    };

    // Create a task related to a service order
    const handleCreateOrderTask = async (orderId, appointment) => {
        try {
            const service = getServiceDetails(appointment.serviceId);
            const order = getOrderDetails(orderId);

            const taskData = {
                title: `Service Preparation: ${service.name || 'Service'}`,
                description: `Prepare for service appointment with ${order.customer?.firstName || 'Customer'} ${order.customer?.lastName || ''}\n\nService: ${service.name || 'Service'}\nDate: ${appointment.date}\nTime: ${appointment.time}\n\nService includes: ${service.serviceIncludes || 'Standard service'}\nPrerequisites: ${service.prerequisites || 'None'}`,
                status: 'pending',
                priority: 'high',
                dueDate: appointment.date,
                assignedTo: 'Service Team',
                type: 'service-preparation',
                orderId: orderId,
                appointmentId: appointment.id
            };

            const result = await createOrderTask(orderId, taskData);
            if (result.success) {
                toast.success('Service preparation task created successfully');
                fetchAllData();
            } else {
                toast.error('Failed to create service task');
            }
        } catch (error) {
            console.error('Error creating order task:', error);
            toast.error('Failed to create service task');
        }
    };

    // Create a general task from agenda
    const handleCreateGeneralTask = async (title, description, dueDate) => {
        try {
            const taskData = {
                title: title || 'New Task',
                description: description || 'Task created from agenda',
                status: 'pending',
                priority: 'medium',
                dueDate: dueDate || new Date().toISOString().split('T')[0],
                assignedTo: 'Team',
                type: 'general'
            };

            const result = await createTask(taskData);
            if (result.success) {
                toast.success('Task created successfully');
                fetchAllData();
            } else {
                toast.error('Failed to create task');
            }
        } catch (error) {
            console.error('Error creating task:', error);
            toast.error('Failed to create task');
        }
    };

    const handleUpdateAppointmentStatus = async (appointmentId, newStatus) => {
        try {
            // Check if this is an order-based appointment or regular appointment
            const isOrderAppointment = appointmentId.startsWith('order-');
            
            if (isOrderAppointment) {
                // For order-based appointments, update the order's appointment status
                const [, orderId] = appointmentId.split('-');
                const orderToUpdate = orders.find((order) => order.id === orderId);
                
                if (orderToUpdate) {
                    const orderStatus =
                        newStatus === 'completed'
                            ? 'completed'
                            : newStatus === 'cancelled'
                              ? 'cancelled'
                              : 'processing';

                    const updatedOrderData = {
                        ...orderToUpdate,
                        appointmentStatus: newStatus,
                        status: orderStatus,
                        updatedAt: new Date().toISOString()
                    };

                    const response = await updateOrder(orderId, updatedOrderData);
                    if (response?.success) {
                        toast.success('Service appointment status updated');
                        fetchAllData();
                    } else {
                        toast.error('Failed to update service appointment');
                    }
                }
            } else {
                // For regular appointments, update the appointment record
                const appointmentToUpdate = appointments.find((apt) => apt.id === appointmentId);
                if (!appointmentToUpdate) return;

                const updatedAppointmentData = {
                    ...appointmentToUpdate,
                    status: newStatus,
                    updatedAt: new Date().toISOString()
                };

                const response = await updateAppointment(appointmentId, updatedAppointmentData);
                if (response?.success) {
                    // Also update the corresponding order status if linked
                    if (appointmentToUpdate.orderId) {
                        const orderStatus =
                            newStatus === 'completed'
                                ? 'completed'
                                : newStatus === 'cancelled'
                                  ? 'cancelled'
                                  : 'processing';

                        await updateOrder(appointmentToUpdate.orderId, { status: orderStatus });
                    }

                    toast.success('Appointment status updated');
                    fetchAllData();
                } else {
                    toast.error('Failed to update appointment');
                }
            }
        } catch (error) {
            console.error('Error updating appointment:', error);
            toast.error('Failed to update appointment');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled':
                return 'bg-blue-100 text-blue-800';
            case 'confirmed':
                return 'bg-green-100 text-green-800';
            case 'completed':
                return 'bg-gray-100 text-gray-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            case 'no-show':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-blue-100 text-blue-800';
        }
    };

    const formatTime = (timeString) => {
        try {
            const [hours, minutes] = timeString.split(':');
            const time = new Date();
            time.setHours(parseInt(hours, 10), parseInt(minutes, 10));
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
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="mb-2 h-8 w-32" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Skeleton className="h-96" />
                    <Skeleton className="h-96" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-bold text-3xl">Agenda & Appointments</h1>
                    <p className="text-muted-foreground">
                        Manage your daily schedule, appointments, and synchronized tasks
                    </p>
                </div>
            </div>

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm">Today's Appointments</p>
                                <p className="font-bold text-2xl">{totalAppointments}</p>
                                <p className="text-muted-foreground text-xs">{confirmedAppointments} confirmed</p>
                            </div>
                            <Calendar className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm">Total Duration</p>
                                <p className="font-bold text-2xl">{Math.round(totalDuration / 60)}h</p>
                                <p className="text-muted-foreground text-xs">{totalDuration} minutes</p>
                            </div>
                            <Clock className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm">Expected Revenue</p>
                                <p className="font-bold text-2xl">€{totalRevenue.toFixed(0)}</p>
                                <p className="text-muted-foreground text-xs">{paidBookings} paid</p>
                            </div>
                            <Users className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm">Pending</p>
                                <p className="font-bold text-2xl">{pendingAppointments}</p>
                                <p className="text-muted-foreground text-xs">need confirmation</p>
                            </div>
                            <Clock className="h-8 w-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm">Completed</p>
                                <p className="font-bold text-2xl">{completedAppointments}</p>
                                <p className="text-muted-foreground text-xs">finished today</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                    <CardContent className="max-h-96 space-y-4 overflow-y-auto">
                        {todaysAppointments.length === 0 ? (
                            <div className="py-8 text-center">
                                <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <p className="text-muted-foreground">No appointments scheduled for today</p>
                            </div>
                        ) : (
                            todaysAppointments.map((appointment) => (
                                <div
                                    key={appointment.id}
                                    className="rounded-lg border p-4 transition-shadow hover:shadow-sm">
                                    <div className="mb-2 flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-medium">{appointment.serviceName}</h3>
                                            <p className="text-muted-foreground text-sm">
                                                {appointment.customerDetails?.name || appointment.customerName}
                                            </p>
                                            {appointment.serviceType && (
                                                <p className="text-blue-600 text-xs capitalize">
                                                    {appointment.serviceType} • {appointment.deliveryMethod}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <Badge className={getStatusColor(appointment.status)}>
                                                {appointment.status}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                {appointment.paymentStatus}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="mb-3 flex items-center gap-4 text-muted-foreground text-sm">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            {appointment.duration}min
                                        </div>
                                        <span className="font-medium text-green-600">
                                            €{appointment.orderTotal || appointment.price}
                                        </span>
                                        {appointment.maxParticipants > 1 && (
                                            <span className="rounded bg-blue-100 px-2 py-1 text-blue-800 text-xs">
                                                Max {appointment.maxParticipants} people
                                            </span>
                                        )}
                                    </div>
                                    <div className="mb-3 flex items-center gap-2 text-muted-foreground text-xs">
                                        <Mail className="h-3 w-3" />
                                        {appointment.customerDetails?.email || appointment.customerEmail}
                                        {(appointment.customerDetails?.phone || appointment.customerPhone) && (
                                            <>
                                                <Phone className="ml-2 h-3 w-3" />
                                                {appointment.customerDetails?.phone || appointment.customerPhone}
                                            </>
                                        )}
                                    </div>
                                    {(appointment.serviceIncludes || appointment.serviceNotes) && (
                                        <div className="mb-3 rounded bg-gray-50 p-2 text-xs">
                                            {appointment.serviceIncludes && (
                                                <p>
                                                    <strong>Includes:</strong> {appointment.serviceIncludes}
                                                </p>
                                            )}
                                            {appointment.serviceNotes && (
                                                <p>
                                                    <strong>Notes:</strong> {appointment.serviceNotes}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedAppointment(appointment)}>
                                                    <Edit className="mr-1 h-3 w-3" />
                                                    Manage
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[600px]">
                                                <DialogHeader>
                                                    <DialogTitle>Manage Service Appointment</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label>Service</Label>
                                                            <p className="text-sm">{appointment.serviceName}</p>
                                                            <p className="text-muted-foreground text-xs">
                                                                {appointment.serviceType} • {appointment.deliveryMethod}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <Label>Customer</Label>
                                                            <p className="text-sm">
                                                                {appointment.customerDetails?.name ||
                                                                    appointment.customerName}
                                                            </p>
                                                            <p className="text-muted-foreground text-xs">
                                                                {appointment.customerDetails?.email ||
                                                                    appointment.customerEmail}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label>Date & Time</Label>
                                                            <p className="text-sm">
                                                                {appointment.date} at{' '}
                                                                {formatTime(appointment.startTime)}
                                                            </p>
                                                            <p className="text-muted-foreground text-xs">
                                                                Duration: {appointment.duration} minutes
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <Label>Payment</Label>
                                                            <p className="text-sm">
                                                                €{appointment.orderTotal || appointment.price}
                                                            </p>
                                                            <p className="text-muted-foreground text-xs">
                                                                {appointment.paymentStatus} •{' '}
                                                                {appointment.paymentMethod || 'Not specified'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {appointment.serviceIncludes && (
                                                        <div>
                                                            <Label>Service Includes</Label>
                                                            <p className="text-muted-foreground text-sm">
                                                                {appointment.serviceIncludes}
                                                            </p>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <Label htmlFor="status">Appointment Status</Label>
                                                        <Select
                                                            value={appointmentStatus || appointment.status}
                                                            onValueChange={setAppointmentStatus}>
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
                                                                handleUpdateAppointmentStatus(
                                                                    appointment.id,
                                                                    appointmentStatus || appointment.status
                                                                );
                                                                setSelectedAppointment(null);
                                                                setAppointmentStatus('');
                                                            }}
                                                            className="flex-1">
                                                            Update Status
                                                        </Button>
                                                        {appointment.orderId && (
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => handleViewOrderDetails(appointment)}>
                                                                View Order
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>

                                        {appointment.orderId && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleViewOrderDetails(appointment)}>
                                                Order #{appointment.orderId.slice(-6)}
                                            </Button>
                                        )}

                                        {appointment.status === 'scheduled' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleUpdateAppointmentStatus(appointment.id, 'confirmed')
                                                }>
                                                <CheckCircle className="mr-1 h-3 w-3" />
                                                Confirm
                                            </Button>
                                        )}

                                        {appointment.status === 'confirmed' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleUpdateAppointmentStatus(appointment.id, 'completed')
                                                }>
                                                <CheckCircle className="mr-1 h-3 w-3" />
                                                Complete
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Enhanced Overview with Task Count */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            Today's Overview
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const today = new Date().toISOString().split('T')[0];
                                    handleCreateGeneralTask(
                                        'New Task',
                                        'Task created from agenda overview',
                                        today
                                    );
                                }}>
                                + Add Task
                            </Button>
                        </CardTitle>
                        <CardDescription>
                            Synchronized agenda, schedule, and {todaysTasks.length} due tasks
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="max-h-96 space-y-4 overflow-y-auto">
                        {/* Tasks Due Today */}
                        {todaysTasks.length > 0 && (
                            <div>
                                <h4 className="mb-2 font-medium text-orange-700">Tasks Due Today</h4>
                                {todaysTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="mb-2 rounded border border-orange-200 bg-orange-50 p-2 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{task.title}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {task.priority}
                                            </Badge>
                                        </div>
                                        <p className="mt-1 text-muted-foreground text-xs">{task.description}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Schedule Items */}
                        {todaysSchedule.filter((item) => !item.appointmentId).length > 0 && (
                            <div>
                                <h4 className="mb-2 font-medium text-blue-700">Schedule</h4>
                                {todaysSchedule
                                    .filter((item) => !item.appointmentId)
                                    .map((item) => (
                                        <div
                                            key={item.id}
                                            className="mb-2 rounded border border-blue-200 bg-blue-50 p-2 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{item.title}</span>
                                                <span className="text-muted-foreground text-xs">
                                                    {item.startTime} - {item.endTime}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-muted-foreground text-xs">{item.description}</p>
                                        </div>
                                    ))}
                            </div>
                        )}

                        {/* Other Agenda Items */}
                        {todaysAgenda.filter((item) => !item.appointmentId).length > 0 && (
                            <div>
                                <h4 className="mb-2 font-medium text-green-700">Other Events</h4>
                                {todaysAgenda
                                    .filter((item) => !item.appointmentId)
                                    .map((item) => (
                                        <div
                                            key={item.id}
                                            className="mb-2 rounded border border-green-200 bg-green-50 p-2 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{item.title}</span>
                                                <span className="text-muted-foreground text-xs">{item.time}</span>
                                            </div>
                                            <div className="mt-1 flex items-center gap-2 text-muted-foreground text-xs">
                                                <span>{item.duration}</span>
                                                <span>{item.attendees} attendees</span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}

                        {todaysTasks.length === 0 &&
                            todaysSchedule.filter((item) => !item.appointmentId).length === 0 &&
                            todaysAgenda.filter((item) => !item.appointmentId).length === 0 && (
                                <div className="py-8 text-center">
                                    <CheckCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                    <p className="text-muted-foreground">All clear for today!</p>
                                </div>
                            )}
                    </CardContent>
                </Card>
            </div>

            {/* Order Details Dialog */}
            <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>Service Booking Order Details</DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="font-medium text-muted-foreground text-sm">Order ID</Label>
                                    <p className="font-mono text-sm">#{selectedOrder.id}</p>
                                </div>
                                <div>
                                    <Label className="font-medium text-muted-foreground text-sm">Status</Label>
                                    <div className="flex gap-2">
                                        <Badge variant="outline">{selectedOrder.status}</Badge>
                                        <Badge variant="outline">{selectedOrder.paymentStatus}</Badge>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Label className="font-medium text-muted-foreground text-sm">
                                    Customer Information
                                </Label>
                                <div className="mt-1 rounded bg-gray-50 p-3">
                                    <p className="font-medium">
                                        {selectedOrder.customer?.firstName} {selectedOrder.customer?.lastName}
                                    </p>
                                    <p className="text-muted-foreground text-sm">{selectedOrder.customer?.email}</p>
                                    <p className="text-muted-foreground text-sm">{selectedOrder.customer?.phone}</p>
                                    {selectedOrder.customer?.streetAddress && (
                                        <p className="text-muted-foreground text-sm">
                                            {selectedOrder.customer.streetAddress}, {selectedOrder.customer.city}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label className="font-medium text-muted-foreground text-sm">Service Details</Label>
                                <div className="mt-1 rounded bg-blue-50 p-3">
                                    <p className="font-medium">{selectedOrder.appointment?.serviceName}</p>
                                    <p className="text-muted-foreground text-sm">
                                        {selectedOrder.appointment?.date} at{' '}
                                        {formatTime(selectedOrder.appointment?.startTime || '')}
                                    </p>
                                    <p className="text-muted-foreground text-sm">
                                        Duration: {selectedOrder.appointment?.duration} minutes
                                    </p>
                                    {selectedOrder.appointment?.serviceType && (
                                        <p className="text-muted-foreground text-sm capitalize">
                                            {selectedOrder.appointment.serviceType} •{' '}
                                            {selectedOrder.appointment.deliveryMethod}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {selectedOrder.items && selectedOrder.items.length > 0 && (
                                <div>
                                    <Label className="font-medium text-muted-foreground text-sm">Order Items</Label>
                                    <div className="mt-1 rounded border">
                                        {selectedOrder.items.map((item, index) => (
                                            <div
                                                key={index}
                                                className="flex justify-between border-b p-3 last:border-b-0">
                                                <div>
                                                    <p className="font-medium">{item.name}</p>
                                                    <p className="text-muted-foreground text-sm">
                                                        Qty: {item.quantity}
                                                    </p>
                                                </div>
                                                <p className="font-medium">
                                                    €{(item.price * item.quantity).toFixed(2)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <Label className="font-medium text-muted-foreground text-sm">Order Summary</Label>
                                <div className="mt-1 rounded bg-gray-50 p-3">
                                    <div className="flex justify-between text-sm">
                                        <span>Subtotal:</span>
                                        <span>€{selectedOrder.subtotal?.toFixed(2) || '0.00'}</span>
                                    </div>
                                    {selectedOrder.taxAmount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span>Tax ({selectedOrder.taxRate}%):</span>
                                            <span>€{selectedOrder.taxAmount?.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {selectedOrder.shippingCost > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span>Shipping:</span>
                                            <span>€{selectedOrder.shippingCost?.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="mt-2 flex justify-between border-t pt-2 font-medium text-lg">
                                        <span>Total:</span>
                                        <span>€{selectedOrder.total?.toFixed(2) || '0.00'}</span>
                                    </div>
                                </div>
                            </div>

                            {selectedOrder.deliveryNotes && (
                                <div>
                                    <Label className="font-medium text-muted-foreground text-sm">Delivery Notes</Label>
                                    <p className="mt-1 rounded bg-yellow-50 p-2 text-sm">
                                        {selectedOrder.deliveryNotes}
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setIsOrderDetailsOpen(false)}>
                                    Close
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (selectedOrder?.appointment && selectedOrder?.id) {
                                            handleCreateOrderTask(selectedOrder.id, selectedOrder.appointment);
                                        }
                                    }}>
                                    Create Service Task
                                </Button>
                                <Button
                                    onClick={() => {
                                        // Navigate to order management page
                                        window.open(`/admin/store/orders`, '_blank');
                                    }}>
                                    Manage in Orders
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
