import { Router } from 'express';
import { seedData } from '../../prisma/seed.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = Router();

/**
 * POST /api/seed
 * Endpoint to populate / reset seed data in development or demo environment.
 */
router.post('/', async (req, res, next) => {
  try {
    await seedData();
    return sendSuccess(
      res,
      { timestamp: new Date().toISOString() },
      'Database seeded successfully with realistic clinic data.'
    );
  } catch (error) {
    next(error);
  }
});

export default router;
