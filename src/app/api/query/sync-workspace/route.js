import { NextResponse } from 'next/server';
import DBService from '@/data/rest.db.js';
import { withAuth } from '@/lib/server/auth.js';

/**
 * @swagger
 * /api/query/sync-workspace:
 *   post:
 *     summary: Synchronize agenda, schedule, tasks, and appointments
 *     tags: [Workspace]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Synchronization completed successfully
 */
async function postHandler(_request) {
    try {
        console.log('Starting workspace synchronization...');

        // Fetch all data
        const [appointments, agendaItems, scheduleItems, tasks] = await Promise.all([
            DBService.readAll('appointments') || [],
            DBService.readAll('agenda_items') || [],
            DBService.readAll('schedule_items') || [],
            DBService.readAll('tasks') || []
        ]);

        const syncResults = {
            appointmentsProcessed: 0,
            agendaItemsCreated: 0,
            scheduleItemsCreated: 0,
            tasksCreated: 0,
            errors: []
        };

        // Sync appointments to agenda and schedule
        for (const appointment of appointments) {
            try {
                // Check if agenda item already exists
                const existingAgendaItem = agendaItems.find((item) => item.appointmentId === appointment.id);
                if (!existingAgendaItem) {
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
                        createdAt: new Date().toISOString(),
                        syncedAt: new Date().toISOString()
                    };

                    await DBService.create(agendaItem, 'agenda_items');
                    syncResults.agendaItemsCreated++;
                }

                // Check if schedule item already exists
                const existingScheduleItem = scheduleItems.find((item) => item.appointmentId === appointment.id);
                if (!existingScheduleItem) {
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
                        createdAt: new Date().toISOString(),
                        syncedAt: new Date().toISOString()
                    };

                    await DBService.create(scheduleItem, 'schedule_items');
                    syncResults.scheduleItemsCreated++;
                }

                syncResults.appointmentsProcessed++;
            } catch (error) {
                console.error(`Error syncing appointment ${appointment.id}:`, error);
                syncResults.errors.push(`Appointment ${appointment.id}: ${error.message}`);
            }
        }

        // Create follow-up tasks for upcoming appointments
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const upcomingAppointments = appointments.filter((apt) => {
            const aptDate = new Date(apt.date);
            return aptDate >= tomorrow && apt.status === 'scheduled';
        });

        for (const appointment of upcomingAppointments) {
            try {
                // Check if task already exists
                const existingTask = tasks.find(
                    (task) => task.appointmentId === appointment.id && task.type === 'appointment-followup'
                );

                if (!existingTask) {
                    const followupTask = {
                        id: `task_apt_${appointment.id}`,
                        title: `Prepare for ${appointment.serviceName} appointment`,
                        description: `Prepare for appointment with ${appointment.customerName} on ${appointment.date} at ${appointment.startTime}`,
                        status: 'pending',
                        priority: 'medium',
                        assignee: 'Admin',
                        dueDate: appointment.date,
                        tags: ['appointment', 'preparation'],
                        type: 'appointment-followup',
                        appointmentId: appointment.id,
                        createdAt: new Date().toISOString(),
                        syncedAt: new Date().toISOString()
                    };

                    await DBService.create(followupTask, 'tasks');
                    syncResults.tasksCreated++;
                }
            } catch (error) {
                console.error(`Error creating follow-up task for appointment ${appointment.id}:`, error);
                syncResults.errors.push(`Follow-up task for appointment ${appointment.id}: ${error.message}`);
            }
        }

        // Clean up orphaned agenda/schedule items (appointments that no longer exist)
        const appointmentIds = appointments.map((apt) => apt.id);

        // Clean agenda items
        const orphanedAgendaItems = agendaItems.filter(
            (item) => item.appointmentId && !appointmentIds.includes(item.appointmentId)
        );

        for (const orphan of orphanedAgendaItems) {
            try {
                await DBService.delete(orphan.id, 'agenda_items');
            } catch (error) {
                console.error(`Error deleting orphaned agenda item ${orphan.id}:`, error);
            }
        }

        // Clean schedule items
        const orphanedScheduleItems = scheduleItems.filter(
            (item) => item.appointmentId && !appointmentIds.includes(item.appointmentId)
        );

        for (const orphan of orphanedScheduleItems) {
            try {
                await DBService.delete(orphan.id, 'schedule_items');
            } catch (error) {
                console.error(`Error deleting orphaned schedule item ${orphan.id}:`, error);
            }
        }

        console.log('Workspace synchronization completed:', syncResults);

        return NextResponse.json({
            success: true,
            message: 'Workspace synchronization completed successfully',
            results: syncResults
        });
    } catch (error) {
        console.error('Error during workspace synchronization:', error);
        return NextResponse.json({ success: false, error: 'Failed to synchronize workspace' }, { status: 500 });
    }
}

/**
 * @swagger
 * /api/query/sync-workspace:
 *   get:
 *     summary: Get synchronization status
 *     tags: [Workspace]
 *     security:
 *       - bearerAuth: []
 */
async function getHandler() {
    try {
        const [appointments, agendaItems, scheduleItems, tasks] = await Promise.all([
            DBService.readAll('appointments') || [],
            DBService.readAll('agenda_items') || [],
            DBService.readAll('schedule_items') || [],
            DBService.readAll('tasks') || []
        ]);

        // Count synced items
        const syncedAgendaItems = agendaItems.filter((item) => item.appointmentId).length;
        const syncedScheduleItems = scheduleItems.filter((item) => item.appointmentId).length;
        const appointmentTasks = tasks.filter((task) => task.appointmentId).length;

        // Get today's items
        const today = new Date().toISOString().split('T')[0];
        const todaysAppointments = appointments.filter((apt) => apt.date === today);
        const todaysAgenda = agendaItems.filter((item) => item.date === today);
        const todaysSchedule = scheduleItems.filter((item) => item.date === today);
        const todaysTasks = tasks.filter((task) => {
            if (task.dueDate) {
                return new Date(task.dueDate).toISOString().split('T')[0] === today;
            }
            return false;
        });

        return NextResponse.json({
            success: true,
            data: {
                totals: {
                    appointments: appointments.length,
                    agendaItems: agendaItems.length,
                    scheduleItems: scheduleItems.length,
                    tasks: tasks.length
                },
                synced: {
                    agendaItems: syncedAgendaItems,
                    scheduleItems: syncedScheduleItems,
                    appointmentTasks: appointmentTasks
                },
                today: {
                    appointments: todaysAppointments.length,
                    agendaItems: todaysAgenda.length,
                    scheduleItems: todaysSchedule.length,
                    tasks: todaysTasks.length
                },
                lastSync: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error getting sync status:', error);
        return NextResponse.json({ success: false, error: 'Failed to get synchronization status' }, { status: 500 });
    }
}

// Apply authentication middleware and export
export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
