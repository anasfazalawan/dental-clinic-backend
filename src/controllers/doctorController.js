import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * GET /api/doctors
 * List doctors with optional search, specialization, and active status filters.
 */
export const getAllDoctors = async (req, res, next) => {
  try {
    const { search, specialization, isActive, sort = 'name', order = 'asc' } = req.query;

    const where = {};

    // Filter by active status
    if (isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true' || isActive === true;
    }

    // Filter by specialization
    if (specialization && specialization !== 'All') {
      where.specialization = specialization;
    }

    // Search by name, email, or phone
    if (search && search.trim() !== '') {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
        { specialization: { contains: search.trim(), mode: 'insensitive' } },
        { phone: { contains: search.trim() } },
      ];
    }

    const orderBy = {};
    if (['name', 'createdAt', 'rating', 'experienceYears'].includes(sort)) {
      orderBy[sort] = order.toLowerCase() === 'desc' ? 'desc' : 'asc';
    } else {
      orderBy.name = 'asc';
    }

    const doctors = await prisma.doctor.findMany({
      where,
      orderBy,
      include: {
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    });

    return sendSuccess(res, doctors, 'Doctors retrieved successfully', 200, {
      count: doctors.length,
      filters: { search, specialization, isActive },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/doctors/specializations
 * Retrieve list of unique doctor specializations.
 */
export const getSpecializations = async (req, res, next) => {
  try {
    const results = await prisma.doctor.findMany({
      distinct: ['specialization'],
      select: { specialization: true },
      orderBy: { specialization: 'asc' },
    });

    const specializations = results.map((r) => r.specialization);
    return sendSuccess(res, specializations, 'Specializations retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/doctors/:id
 * Retrieve doctor by ID with their upcoming appointments.
 */
export const getDoctorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: [
            { appointmentDate: 'desc' },
            { appointmentTime: 'desc' },
          ],
          take: 20,
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    });

    if (!doctor) {
      return sendError(res, `Doctor with ID '${id}' not found`, 404);
    }

    return sendSuccess(res, doctor, 'Doctor details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/doctors
 * Create a new doctor.
 */
export const createDoctor = async (req, res, next) => {
  try {
    const doctorData = req.body;

    // Check for duplicate email
    const existingDoctor = await prisma.doctor.findUnique({
      where: { email: doctorData.email },
    });

    if (existingDoctor) {
      return sendError(
        res,
        `A doctor with email '${doctorData.email}' already exists.`,
        409
      );
    }

    const newDoctor = await prisma.doctor.create({
      data: doctorData,
    });

    return sendSuccess(res, newDoctor, 'Doctor created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/doctors/:id
 * Update an existing doctor.
 */
export const updateDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id },
    });

    if (!doctor) {
      return sendError(res, `Doctor with ID '${id}' not found`, 404);
    }

    // Check email uniqueness if email is being changed
    if (updateData.email && updateData.email !== doctor.email) {
      const emailTaken = await prisma.doctor.findUnique({
        where: { email: updateData.email },
      });

      if (emailTaken) {
        return sendError(
          res,
          `Email '${updateData.email}' is already in use by another doctor.`,
          409
        );
      }
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id },
      data: updateData,
    });

    return sendSuccess(res, updatedDoctor, 'Doctor updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/doctors/:id
 * Delete a doctor. Validates whether active scheduled appointments exist.
 */
export const deleteDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { force = false } = req.query;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        appointments: {
          where: {
            status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
          },
        },
      },
    });

    if (!doctor) {
      return sendError(res, `Doctor with ID '${id}' not found`, 404);
    }

    // If doctor has active future appointments and force delete is not enabled
    if (doctor.appointments.length > 0 && force !== 'true') {
      return sendError(
        res,
        `Cannot delete Dr. ${doctor.name} because they have ${doctor.appointments.length} active appointment(s). Please reassign or cancel those appointments first, or deactivate the doctor.`,
        400,
        { activeAppointmentsCount: doctor.appointments.length }
      );
    }

    // If force is true, delete appointments first or perform transaction
    if (force === 'true') {
      await prisma.$transaction([
        prisma.appointment.deleteMany({ where: { doctorId: id } }),
        prisma.doctor.delete({ where: { id } }),
      ]);
    } else {
      // Normal delete (will succeed if no appointments exist)
      await prisma.appointment.deleteMany({
        where: { doctorId: id, status: { in: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] } },
      });
      await prisma.doctor.delete({
        where: { id },
      });
    }

    return sendSuccess(res, { id, name: doctor.name }, `Dr. ${doctor.name} deleted successfully`);
  } catch (error) {
    next(error);
  }
};
