import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';

/**
 * GET /api/dashboard/stats
 * Aggregate key metrics for the clinic management dashboard.
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.setUTCHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setUTCHours(23, 59, 59, 999));

    const [
      totalDoctors,
      activeDoctors,
      totalAppointments,
      todayAppointmentsCount,
      upcomingAppointmentsCount,
      todayCompletedCount,
      statusCounts,
      todayAppointments,
      recentAppointments,
      doctorsWithWorkload,
    ] = await Promise.all([
      // 1. Total doctors
      prisma.doctor.count(),

      // 2. Active doctors
      prisma.doctor.count({ where: { isActive: true } }),

      // 3. Total appointments
      prisma.appointment.count(),

      // 4. Today's appointments count
      prisma.appointment.count({
        where: {
          appointmentDate: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      }),

      // 5. Upcoming appointments count (future dates or later today)
      prisma.appointment.count({
        where: {
          appointmentDate: {
            gte: startOfToday,
          },
          status: {
            in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'],
          },
        },
      }),

      // 6. Today's completed appointments count
      prisma.appointment.count({
        where: {
          appointmentDate: {
            gte: startOfToday,
            lte: endOfToday,
          },
          status: 'COMPLETED',
        },
      }),

      // 7. Status breakdown
      prisma.appointment.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
      }),

      // 8. Today's schedule list
      prisma.appointment.findMany({
        where: {
          appointmentDate: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
        orderBy: { appointmentTime: 'asc' },
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              specialization: true,
              avatarUrl: true,
              roomNumber: true,
            },
          },
        },
        take: 10,
      }),

      // 9. Recent appointments list
      prisma.appointment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              specialization: true,
              avatarUrl: true,
            },
          },
        },
      }),

      // 10. Doctor workload (top 5 active doctors with appointment counts)
      prisma.doctor.findMany({
        where: { isActive: true },
        take: 5,
        select: {
          id: true,
          name: true,
          specialization: true,
          avatarUrl: true,
          availabilityDays: true,
          availableHoursStart: true,
          availableHoursEnd: true,
          _count: {
            select: {
              appointments: true,
            },
          },
        },
        orderBy: {
          appointments: {
            _count: 'desc',
          },
        },
      }),
    ]);

    // Format status breakdown map
    const statusMap = {
      SCHEDULED: 0,
      CONFIRMED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      NO_SHOW: 0,
    };

    statusCounts.forEach((item) => {
      statusMap[item.status] = item._count.status;
    });

    const statsData = {
      overview: {
        totalDoctors,
        activeDoctors,
        totalAppointments,
        todayAppointmentsCount,
        upcomingAppointmentsCount,
        todayCompletedCount,
        completedCount: statusMap.COMPLETED || 0,
        pendingCount: statusMap.SCHEDULED || 0,
      },
      statusBreakdown: statusMap,
      todaySchedule: todayAppointments,
      recentAppointments,
      topDoctors: doctorsWithWorkload,
    };

    return sendSuccess(res, statsData, 'Dashboard statistics retrieved');
  } catch (error) {
    next(error);
  }
};
