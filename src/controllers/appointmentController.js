import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { checkAppointmentConflict } from '../utils/timeConflict.js';

/**
 * GET /api/appointments
 * List appointments with rich filtering: doctorId, status, date, date range, search.
 */
export const getAllAppointments = async (req, res, next) => {
  try {
    const {
      doctorId,
      status,
      date,
      startDate,
      endDate,
      search,
      sort = 'date_asc', // date_asc, date_desc, patient_asc
      page,
      limit,
    } = req.query;

    const where = {};

    // Filter by doctor
    if (doctorId && doctorId !== 'All') {
      where.doctorId = doctorId;
    }

    // Filter by status
    if (status && status !== 'All') {
      where.status = status.toUpperCase();
    }

    // Filter by exact single date
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setUTCHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setUTCHours(23, 59, 59, 999));
      where.appointmentDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    } else if (startDate || endDate) {
      // Filter by date range
      where.appointmentDate = {};
      if (startDate) {
        const start = new Date(startDate);
        where.appointmentDate.gte = new Date(start.setUTCHours(0, 0, 0, 0));
      }
      if (endDate) {
        const end = new Date(endDate);
        where.appointmentDate.lte = new Date(end.setUTCHours(23, 59, 59, 999));
      }
    }

    // Search by patient name, phone, email, or treatment reason
    if (search && search.trim() !== '') {
      where.OR = [
        { patientName: { contains: search.trim(), mode: 'insensitive' } },
        { patientPhone: { contains: search.trim() } },
        { patientEmail: { contains: search.trim(), mode: 'insensitive' } },
        { reason: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // Sorting logic
    let orderBy = [];
    if (sort === 'date_desc') {
      orderBy = [{ appointmentDate: 'desc' }, { appointmentTime: 'desc' }];
    } else if (sort === 'patient_asc') {
      orderBy = [{ patientName: 'asc' }];
    } else {
      // default date_asc
      orderBy = [{ appointmentDate: 'asc' }, { appointmentTime: 'asc' }];
    }

    const paginationOptions = {};
    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page, 10));
      const takeLimit = Math.max(1, parseInt(limit, 10));
      paginationOptions.skip = (pageNum - 1) * takeLimit;
      paginationOptions.take = takeLimit;
    }

    const [appointments, totalCount] = await Promise.all([
      prisma.appointment.findMany({
        where,
        orderBy,
        ...paginationOptions,
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              specialization: true,
              email: true,
              phone: true,
              avatarUrl: true,
              isActive: true,
              roomNumber: true,
            },
          },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    return sendSuccess(res, appointments, 'Appointments retrieved successfully', 200, {
      total: totalCount,
      count: appointments.length,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : totalCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/appointments/:id
 * Retrieve a single appointment by ID.
 */
export const getAppointmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: true,
      },
    });

    if (!appointment) {
      return sendError(res, `Appointment with ID '${id}' not found`, 404);
    }

    return sendSuccess(res, appointment, 'Appointment details retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/appointments
 * Create a new appointment with strict time conflict and availability validation.
 */
export const createAppointment = async (req, res, next) => {
  try {
    const appointmentData = req.body;

    // Check conflict & doctor availability
    const conflictResult = await checkAppointmentConflict(prisma, {
      doctorId: appointmentData.doctorId,
      appointmentDate: appointmentData.appointmentDate,
      appointmentTime: appointmentData.appointmentTime,
      durationMinutes: appointmentData.durationMinutes || 30,
    });

    if (conflictResult.hasConflict) {
      return sendError(res, conflictResult.message, 409, {
        conflictReason: conflictResult.reason,
        conflictingAppointment: conflictResult.conflictingAppointment || null,
      });
    }

    // Format ISO date for Prisma
    const formattedDate = new Date(appointmentData.appointmentDate);

    const newAppointment = await prisma.appointment.create({
      data: {
        patientName: appointmentData.patientName,
        patientPhone: appointmentData.patientPhone,
        patientEmail: appointmentData.patientEmail || null,
        doctorId: appointmentData.doctorId,
        appointmentDate: formattedDate,
        appointmentTime: appointmentData.appointmentTime,
        durationMinutes: appointmentData.durationMinutes || 30,
        reason: appointmentData.reason,
        notes: appointmentData.notes || null,
        status: appointmentData.status || 'SCHEDULED',
      },
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
    });

    return sendSuccess(res, newAppointment, 'Appointment scheduled successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/appointments/:id
 * Update appointment details with conflict re-validation if scheduling fields changed.
 */
export const updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check existing
    const existing = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existing) {
      return sendError(res, `Appointment with ID '${id}' not found`, 404);
    }

    const targetDoctorId = updateData.doctorId || existing.doctorId;
    const targetDate = updateData.appointmentDate || existing.appointmentDate;
    const targetTime = updateData.appointmentTime || existing.appointmentTime;
    const targetDuration = updateData.durationMinutes || existing.durationMinutes;

    // If schedule or doctor changed, validate conflict
    const isScheduleChanged =
      updateData.doctorId ||
      updateData.appointmentDate ||
      updateData.appointmentTime ||
      updateData.durationMinutes;

    if (isScheduleChanged) {
      const conflictResult = await checkAppointmentConflict(prisma, {
        doctorId: targetDoctorId,
        appointmentDate: targetDate,
        appointmentTime: targetTime,
        durationMinutes: targetDuration,
        excludeAppointmentId: id,
      });

      if (conflictResult.hasConflict) {
        return sendError(res, conflictResult.message, 409, {
          conflictReason: conflictResult.reason,
          conflictingAppointment: conflictResult.conflictingAppointment || null,
        });
      }
    }

    const dataToUpdate = { ...updateData };
    if (updateData.appointmentDate) {
      dataToUpdate.appointmentDate = new Date(updateData.appointmentDate);
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: dataToUpdate,
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
    });

    return sendSuccess(res, updatedAppointment, 'Appointment updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/appointments/:id/status
 * Quick update for appointment status.
 */
export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existing = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existing) {
      return sendError(res, `Appointment with ID '${id}' not found`, 404);
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
          },
        },
      },
    });

    return sendSuccess(
      res,
      updated,
      `Appointment status changed to '${status}' successfully`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/appointments/:id
 * Delete an appointment.
 */
export const deleteAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: { select: { name: true } },
      },
    });

    if (!existing) {
      return sendError(res, `Appointment with ID '${id}' not found`, 404);
    }

    await prisma.appointment.delete({
      where: { id },
    });

    return sendSuccess(
      res,
      { id, patientName: existing.patientName },
      `Appointment for ${existing.patientName} deleted successfully`
    );
  } catch (error) {
    next(error);
  }
};
