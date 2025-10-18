import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';
import { withPublicAccess } from '@/lib/server/auth.js';

/**
 * @swagger
 * /api/query/public/book-appointment:
 *   post:
 *     summary: Book a service appointment (public endpoint)
 *     tags: [Appointments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               serviceId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *               customerName:
 *                 type: string
 *               customerEmail:
 *                 type: string
 *               customerPhone:
 *                 type: string
 *               notes:
 *                 type: string
 *             required:
 *               - serviceId
 *               - date
 *               - startTime
 *               - customerName
 *               - customerEmail
 */
async function postHandler(request) {
    try {
        const bookingData = await request.json();

        // Validate required fields
        const requiredFields = ['serviceId', 'date', 'startTime', 'customerName', 'customerEmail'];
        for (const field of requiredFields) {
            if (!bookingData[field]) {
                return NextResponse.json({ success: false, error: `${field} is required` }, { status: 400 });
            }
        }

        // Get service details
        const services = (await DBService.readAll('catalog')) || [];
        const service = services.find((s) => s.id === bookingData.serviceId && s.type === 'service');

        if (!service) {
            return NextResponse.json(
                { success: false, error: 'Service not found or not available for booking' },
                { status: 404 }
            );
        }

        if (!service.requiresAppointment) {
            return NextResponse.json(
                { success: false, error: 'This service does not require appointment booking' },
                { status: 400 }
            );
        }

        // Validate date and time
        const appointmentDate = new Date(`${bookingData.date} ${bookingData.startTime}`);
        if (appointmentDate <= new Date()) {
            return NextResponse.json(
                { success: false, error: 'Appointment must be scheduled for a future date and time' },
                { status: 400 }
            );
        }

        // Calculate end time based on service duration
        const startTime = new Date(`${bookingData.date} ${bookingData.startTime}`);
        const endTime = new Date(startTime.getTime() + service.duration * 60000);
        const endTimeString = endTime.toTimeString().slice(0, 5);

        // Check for time conflicts
        const existingAppointments = (await DBService.readAll('appointments')) || [];
        const hasConflict = existingAppointments.some((apt) => {
            if (apt.date !== bookingData.date) return false;

            const existingStart = new Date(`${apt.date} ${apt.startTime}`);
            const existingEnd = new Date(`${apt.date} ${apt.endTime}`);
            const newStart = new Date(`${bookingData.date} ${bookingData.startTime}`);
            const newEnd = new Date(`${bookingData.date} ${endTimeString}`);

            return newStart < existingEnd && newEnd > existingStart;
        });

        if (hasConflict) {
            return NextResponse.json(
                { success: false, error: 'Time slot conflicts with existing appointment' },
                { status: 409 }
            );
        }

        // Generate unique IDs
        const appointmentId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const orderId = `ORD-${Date.now()}`;

        // Create appointment
        const newAppointment = {
            id: appointmentId,
            serviceId: service.id,
            serviceName: service.name,
            date: bookingData.date,
            startTime: bookingData.startTime,
            endTime: endTimeString,
            duration: service.duration,
            customerName: bookingData.customerName,
            customerEmail: bookingData.customerEmail,
            customerPhone: bookingData.customerPhone || '',
            notes: bookingData.notes || '',
            price: service.price,
            status: 'scheduled',
            paymentStatus: 'pending',
            orderId: orderId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Create corresponding order
        const orderData = {
            id: orderId,
            customer: {
                firstName: bookingData.customerName.split(' ')[0] || bookingData.customerName,
                lastName: bookingData.customerName.split(' ').slice(1).join(' ') || '',
                email: bookingData.customerEmail,
                phone: bookingData.customerPhone || '',
                streetAddress: '',
                apartmentUnit: '',
                city: '',
                state: '',
                zipCode: '',
                country: '',
                countryIso: ''
            },
            items: [
                {
                    id: service.id,
                    name: service.name,
                    price: service.price,
                    quantity: 1,
                    type: 'service',
                    appointmentId: appointmentId,
                    appointmentDate: bookingData.date,
                    appointmentTime: bookingData.startTime
                }
            ],
            subtotal: service.price,
            shippingCost: 0,
            discountType: 'fixed',
            discountValue: 0,
            discountAmount: 0,
            total: service.price,
            status: 'scheduled', // Special status for service appointments
            paymentStatus: 'pending',
            paymentMethod: 'appointment',
            method: 'appointment',
            tracking: null,
            deliveryNotes: bookingData.notes || '',
            sendEmail: true,
            appointmentId: appointmentId,
            isServiceAppointment: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Save appointment and order
        const [appointmentSaved, orderSaved] = await Promise.all([
            DBService.create(newAppointment, 'appointments'),
            DBService.create(orderData, 'orders')
        ]);

        if (!appointmentSaved || !orderSaved) {
            return NextResponse.json(
                { success: false, error: 'Failed to create appointment booking' },
                { status: 500 }
            );
        }

        // Sync to agenda and schedule
        await syncAppointmentToAgenda(newAppointment);
        await syncAppointmentToSchedule(newAppointment);

        return NextResponse.json({
            success: true,
            data: {
                appointment: newAppointment,
                order: orderData
            },
            message: 'Appointment booked successfully'
        });
    } catch (error) {
        console.error('Error booking appointment:', error);
        return NextResponse.json({ success: false, error: 'Failed to book appointment' }, { status: 500 });
    }
}

// Helper functions for syncing with agenda and schedule
async function syncAppointmentToAgenda(appointment) {
    try {
        const agendaItem = {
            id: `apt_${appointment.id}`,
            title: `${appointment.serviceName} - ${appointment.customerName}`,
            time: appointment.startTime,
            duration: `${appointment.duration} minutes`,
            attendees: 1,
            type: 'appointment',
            date: appointment.date,
            appointmentId: appointment.id,
            customerEmail: appointment.customerEmail,
            customerPhone: appointment.customerPhone,
            price: appointment.price,
            status: appointment.status,
            createdAt: new Date().toISOString()
        };

        await DBService.create(agendaItem, 'agenda_items');
    } catch (error) {
        console.error('Error syncing to agenda:', error);
    }
}

async function syncAppointmentToSchedule(appointment) {
    try {
        const scheduleItem = {
            id: `apt_${appointment.id}`,
            title: `${appointment.serviceName}`,
            type: 'appointment',
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            date: appointment.date,
            location: 'Office',
            attendees: [appointment.customerName],
            description: `Service appointment with ${appointment.customerName} (${appointment.customerEmail})`,
            appointmentId: appointment.id,
            customerEmail: appointment.customerEmail,
            customerPhone: appointment.customerPhone,
            price: appointment.price,
            status: appointment.status,
            createdAt: new Date().toISOString()
        };

        await DBService.create(scheduleItem, 'schedule_items');
    } catch (error) {
        console.error('Error syncing to schedule:', error);
    }
}

// Apply public access middleware and export
export const POST = withPublicAccess(postHandler);
