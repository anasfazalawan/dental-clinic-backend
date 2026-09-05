import { Router } from 'express';
import {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getSpecializations,
} from '../controllers/doctorController.js';
import {
  validateBody,
  createDoctorSchema,
  updateDoctorSchema,
} from '../middleware/validator.js';

const router = Router();

// Doctor routes
router.get('/specializations', getSpecializations);
router.get('/', getAllDoctors);
router.get('/:id', getDoctorById);
router.post('/', validateBody(createDoctorSchema), createDoctor);
router.put('/:id', validateBody(updateDoctorSchema), updateDoctor);
router.delete('/:id', deleteDoctor);

export default router;
