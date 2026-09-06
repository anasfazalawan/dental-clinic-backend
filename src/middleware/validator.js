import { z } from 'zod';
import { sendError } from '../utils/response.js';

// Time string regex: HH:mm (24-hour format)
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const validDays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const validSpecializations = [
  'General Dentistry',
  'Orthodontics',
  'Periodontics',
  'Endodontics',
  'Pediatric Dentistry',
  'Oral & Maxillofacial Surgery',
  'Prosthodontics',
  'Cosmetic Dentistry',
];

export const validStatuses = [
  'SCHEDULED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
];

// Base Doctor Schema
const baseDoctorSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address'),
  phone: z.string().trim().min(5, 'Phone number must be at least 5 digits').max(30),
  specialization: z.string().trim().min(2, 'Specialization is required'),
  experienceYears: z.coerce.number().int().min(0).max(70).default(1),
  availabilityDays: z.array(z.string()).min(1, 'Select at least one available working day').default([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ]),
  availableHoursStart: z.string().regex(timeRegex, 'Start time must be in HH:mm format (e.g. 09:00)').default('09:00'),
  availableHoursEnd: z.string().regex(timeRegex, 'End time must be in HH:mm format (e.g. 17:00)').default('17:00'),
  isActive: z.boolean().default(true),
  rating: z.coerce.number().min(1).max(5).default(4.9),
  avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
  bio: z.string().max(1000).optional(),
  roomNumber: z.string().max(50).optional(),
});

// Doctor Create Schema with validation
export const createDoctorSchema = baseDoctorSchema.refine((data) => {
  if (data.availableHoursStart && data.availableHoursEnd) {
    return data.availableHoursStart < data.availableHoursEnd;
  }
  return true;
}, {
  message: 'Available start time must be earlier than end time',
  path: ['availableHoursEnd'],
});

// Doctor Update Schema
export const updateDoctorSchema = baseDoctorSchema.partial();

// Base Appointment Schema
const baseAppointmentSchema = z.object({
  patientName: z.string().trim().min(2, 'Patient name must be at least 2 characters').max(100),
  patientPhone: z.string().trim().min(5, 'Patient phone number is required').max(30),
  patientEmail: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  doctorId: z.string().trim().min(1, 'Doctor selection is required'),
  appointmentDate: z.string().trim().min(1, 'Appointment date is required (YYYY-MM-DD)'),
  appointmentTime: z.string().regex(timeRegex, 'Appointment time must be in HH:mm format (e.g. 10:30)'),
  durationMinutes: z.coerce.number().int().min(10, 'Minimum duration is 10 mins').max(240, 'Maximum duration is 240 mins').default(30),
  reason: z.string().trim().min(2, 'Reason/Treatment description is required').max(255),
  notes: z.string().max(1000).optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).default('SCHEDULED'),
});

export const createAppointmentSchema = baseAppointmentSchema;

// Appointment Update Schema
export const updateAppointmentSchema = baseAppointmentSchema.partial();

// Appointment Status Update Schema
export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'], {
    errorMap: () => ({ message: `Status must be one of: ${validStatuses.join(', ')}` }),
  }),
});

/**
 * Higher-order middleware function to validate request body with a Zod schema.
 */
export const validateBody = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req.body);
    req.body = parsed;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return sendError(res, 'Validation failed for request data', 422, formattedErrors);
    }
    next(error);
  }
};
