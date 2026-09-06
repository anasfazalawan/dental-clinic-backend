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

// Helper to preprocess empty strings, null, and undefined into null
const sanitizeOptionalString = (max, fieldName) =>
  z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return null;
    return typeof val === 'string' ? val.trim() : val;
  }, z.string().max(max, `${fieldName} cannot exceed ${max} characters`).nullable().optional());

const sanitizeOptionalUrl = (fieldName = 'Photo URL') =>
  z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return null;
    return typeof val === 'string' ? val.trim() : val;
  }, z.string().url(`${fieldName} must be a valid URL starting with http:// or https://`).nullable().optional());

const sanitizeOptionalEmail = () =>
  z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return null;
    return typeof val === 'string' ? val.trim() : val;
  }, z.string().email('Please enter a valid email address').nullable().optional());

// Base Doctor Schema
const baseDoctorSchema = z.object({
  name: z.string({ required_error: 'Doctor name is required' }).trim().min(2, 'Doctor name must be at least 2 characters').max(100, 'Doctor name too long'),
  email: z.string({ required_error: 'Email address is required' }).trim().email('Invalid email address format'),
  phone: z.string({ required_error: 'Phone number is required' }).trim().min(5, 'Phone number must be at least 5 digits').max(30, 'Phone number too long'),
  specialization: z.string({ required_error: 'Specialization is required' }).trim().min(2, 'Specialization is required'),
  experienceYears: z.coerce.number().int().min(0, 'Experience years cannot be negative').max(70, 'Experience years cannot exceed 70').default(1),
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
  avatarUrl: sanitizeOptionalUrl('Doctor avatar URL'),
  bio: sanitizeOptionalString(1000, 'Biography'),
  roomNumber: sanitizeOptionalString(50, 'Room number'),
});

// Doctor Create Schema with working hours validation
export const createDoctorSchema = baseDoctorSchema.refine((data) => {
  if (data.availableHoursStart && data.availableHoursEnd) {
    return data.availableHoursStart < data.availableHoursEnd;
  }
  return true;
}, {
  message: 'Shift start time must be earlier than shift end time',
  path: ['availableHoursEnd'],
});

// Doctor Update Schema
export const updateDoctorSchema = baseDoctorSchema.partial();

// Base Appointment Schema
const baseAppointmentSchema = z.object({
  patientName: z.string({ required_error: 'Patient name is required' }).trim().min(2, 'Patient name must be at least 2 characters').max(100, 'Patient name too long'),
  patientPhone: z.string({ required_error: 'Patient phone number is required' }).trim().min(5, 'Patient phone number must be at least 5 digits').max(30, 'Phone number too long'),
  patientEmail: sanitizeOptionalEmail(),
  doctorId: z.string({ required_error: 'Doctor selection is required' }).trim().min(1, 'Please select a doctor'),
  appointmentDate: z.string({ required_error: 'Appointment date is required' }).trim().min(1, 'Appointment date is required (YYYY-MM-DD)'),
  appointmentTime: z.string({ required_error: 'Time slot is required' }).regex(timeRegex, 'Appointment time must be in HH:mm format (e.g. 10:30)'),
  durationMinutes: z.coerce.number().int().min(10, 'Minimum duration is 10 mins').max(240, 'Maximum duration is 240 mins').default(30),
  reason: z.string({ required_error: 'Reason or treatment description is required' }).trim().min(2, 'Reason/Treatment description is required').max(255, 'Reason too long'),
  notes: sanitizeOptionalString(1000, 'Clinical notes'),
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
      // Build a clear, human-friendly summary message for the toast
      const summaryMessage = formattedErrors.map((e) => e.message).join('. ');
      return sendError(res, summaryMessage || 'Validation failed for request data', 422, formattedErrors);
    }
    next(error);
  }
};

