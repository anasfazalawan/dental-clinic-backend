import { Router } from 'express';
import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
} from '../controllers/appointmentController.js';
import {
  validateBody,
  createAppointmentSchema,
  updateAppointmentSchema,
  updateAppointmentStatusSchema,
} from '../middleware/validator.js';

const router = Router();

// Appointment routes
router.get('/', getAllAppointments);
router.get('/:id', getAppointmentById);
router.post('/', validateBody(createAppointmentSchema), createAppointment);
router.put('/:id', validateBody(updateAppointmentSchema), updateAppointment);
router.patch('/:id/status', validateBody(updateAppointmentStatusSchema), updateAppointmentStatus);
router.delete('/:id', deleteAppointment);

export default router;
