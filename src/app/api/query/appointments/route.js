import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/server/auth.js';
import DBService from '@/data/rest.db.js';

/**
 * @swagger
 * /api/query/appointments:
 *   get:
 *     summary: Get all appointments
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of appointments
 */
async function GET() {
  try {
    const appointments = await DBService.readAll('appointments') || [];
    
    // Sort by appointment date (nearest first)
    const sortedAppointments = appointments.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.startTime}`);
      const dateB = new Date(`${b.date} ${b.startTime}`);
      return dateA - dateB;
    });
    
    return NextResponse.json({
      success: true,
      data: sortedAppointments
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/query/appointments:
 *   post:
 *     summary: Create a new appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               serviceId:
 *                 type: string
 *               serviceName:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               customerName:
 *                 type: string
 *               customerEmail:
 *                 type: string
 *               customerPhone:
 *                 type: string
 *               notes:
 *                 type: string
 *               price:
 *                 type: number
 *             required:
 *               - serviceId
 *               - serviceName
 *               - date
 *               - startTime
 *               - endTime
 *               - customerName
 *               - customerEmail
 *               - price
 */
async function POST(request) {
  try {
    const appointmentData = await request.json();

    // Validate required fields
    const requiredFields = ['serviceId', 'serviceName', 'date', 'startTime', 'endTime', 'customerName', 'customerEmail', 'price'];
    for (const field of requiredFields) {
      if (!appointmentData[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate date and time
    const appointmentDate = new Date(`${appointmentData.date} ${appointmentData.startTime}`);
    if (appointmentDate <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'Appointment must be scheduled for a future date and time' },
        { status: 400 }
      );
    }

    // Check for time conflicts
    const existingAppointments = await DBService.readAll('appointments') || [];
    const hasConflict = existingAppointments.some(apt => {
      if (apt.date !== appointmentData.date) return false;
      
      const existingStart = new Date(`${apt.date} ${apt.startTime}`);
      const existingEnd = new Date(`${apt.date} ${apt.endTime}`);
      const newStart = new Date(`${appointmentData.date} ${appointmentData.startTime}`);
      const newEnd = new Date(`${appointmentData.date} ${appointmentData.endTime}`);
      
      return (newStart < existingEnd && newEnd > existingStart);
    });

    if (hasConflict) {
      return NextResponse.json(
        { success: false, error: 'Time slot conflicts with existing appointment' },
        { status: 409 }
      );
    }

    // Generate unique ID
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);

    // Create appointment
    const newAppointment = {
      id,
      serviceId: appointmentData.serviceId,
      serviceName: appointmentData.serviceName,
      date: appointmentData.date,
      startTime: appointmentData.startTime,
      endTime: appointmentData.endTime,
      duration: appointmentData.duration || 60,
      customerName: appointmentData.customerName,
      customerEmail: appointmentData.customerEmail,
      customerPhone: appointmentData.customerPhone || '',
      notes: appointmentData.notes || '',
      price: parseFloat(appointmentData.price),
      status: 'scheduled',
      paymentStatus: 'pending',
      orderId: null, // Will be set when order is created
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save appointment
    const saved = await DBService.create(newAppointment, 'appointments');
    
    if (!saved) {
      return NextResponse.json(
        { success: false, error: 'Failed to create appointment' },
        { status: 500 }
      );
    }

    // Sync to agenda and schedule
    await syncAppointmentToAgenda(newAppointment);
    await syncAppointmentToSchedule(newAppointment);

    return NextResponse.json(
      { success: true, data: newAppointment },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/query/appointments:
 *   put:
 *     summary: Update an existing appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 */
async function PUT(request) {
  try {
    const appointmentData = await request.json();

    if (!appointmentData.id) {
      return NextResponse.json(
        { success: false, error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    // Check if appointment exists
    const existingAppointments = await DBService.readAll('appointments') || [];
    const existingAppointment = existingAppointments.find(apt => apt.id === appointmentData.id);

    if (!existingAppointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Update appointment
    const updatedAppointment = {
      ...existingAppointment,
      ...appointmentData,
      updatedAt: new Date().toISOString(),
    };

    const updated = await DBService.update(appointmentData.id, updatedAppointment, 'appointments');
    
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Failed to update appointment' },
        { status: 500 }
      );
    }

    // Update agenda and schedule
    await updateAgendaItem(updatedAppointment);
    await updateScheduleItem(updatedAppointment);

    return NextResponse.json({
      success: true,
      data: updatedAppointment
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/query/appointments:
 *   delete:
 *     summary: Delete an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 */
async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    // Check if appointment exists
    const existingAppointments = await DBService.readAll('appointments') || [];
    const appointmentExists = existingAppointments.some(apt => apt.id === id);

    if (!appointmentExists) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Delete appointment
    const deleted = await DBService.delete(id, 'appointments');
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete appointment' },
        { status: 500 }
      );
    }

    // Remove from agenda and schedule
    await removeFromAgenda(id);
    await removeFromSchedule(id);

    return NextResponse.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete appointment' },
      { status: 500 }
    );
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
      description: `Service appointment with ${appointment.customerName}`,
      appointmentId: appointment.id,
      createdAt: new Date().toISOString()
    };
    
    await DBService.create(scheduleItem, 'schedule_items');
  } catch (error) {
    console.error('Error syncing to schedule:', error);
  }
}

async function updateAgendaItem(appointment) {
  try {
    const agendaItems = await DBService.readAll('agenda_items') || [];
    const agendaItem = agendaItems.find(item => item.appointmentId === appointment.id);
    
    if (agendaItem) {
      const updatedItem = {
        ...agendaItem,
        title: `${appointment.serviceName} - ${appointment.customerName}`,
        time: appointment.startTime,
        duration: `${appointment.duration} minutes`,
        date: appointment.date,
        updatedAt: new Date().toISOString()
      };
      
      await DBService.update(agendaItem.id, updatedItem, 'agenda_items');
    }
  } catch (error) {
    console.error('Error updating agenda item:', error);
  }
}

async function updateScheduleItem(appointment) {
  try {
    const scheduleItems = await DBService.readAll('schedule_items') || [];
    const scheduleItem = scheduleItems.find(item => item.appointmentId === appointment.id);
    
    if (scheduleItem) {
      const updatedItem = {
        ...scheduleItem,
        title: appointment.serviceName,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        date: appointment.date,
        attendees: [appointment.customerName],
        description: `Service appointment with ${appointment.customerName}`,
        updatedAt: new Date().toISOString()
      };
      
      await DBService.update(scheduleItem.id, updatedItem, 'schedule_items');
    }
  } catch (error) {
    console.error('Error updating schedule item:', error);
  }
}

async function removeFromAgenda(appointmentId) {
  try {
    const agendaItems = await DBService.readAll('agenda_items') || [];
    const agendaItem = agendaItems.find(item => item.appointmentId === appointmentId);
    
    if (agendaItem) {
      await DBService.delete(agendaItem.id, 'agenda_items');
    }
  } catch (error) {
    console.error('Error removing from agenda:', error);
  }
}

async function removeFromSchedule(appointmentId) {
  try {
    const scheduleItems = await DBService.readAll('schedule_items') || [];
    const scheduleItem = scheduleItems.find(item => item.appointmentId === appointmentId);
    
    if (scheduleItem) {
      await DBService.delete(scheduleItem.id, 'schedule_items');
    }
  } catch (error) {
    console.error('Error removing from schedule:', error);
  }
}

export { GET, POST, PUT, DELETE };

// Apply authentication middleware
export const withAuthGET = withAuth(GET);
export const withAuthPOST = withAuth(POST);
export const withAuthPUT = withAuth(PUT);
export const withAuthDELETE = withAuth(DELETE);