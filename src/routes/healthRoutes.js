import { Router } from 'express';
import { checkDatabaseConnection } from '../config/prisma.js';

const router = Router();

/**
 * GET /api/health
 * Production health check endpoint for Render and uptime monitoring.
 */
router.get('/', async (req, res) => {
  const startTime = Date.now();
  const dbStatus = await checkDatabaseConnection();
  const responseTimeMs = Date.now() - startTime;

  const isHealthy = dbStatus.connected;
  const statusCode = isHealthy ? 200 : 503;

  return res.status(statusCode).json({
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'Dental Clinic Management API',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbStatus,
    responseTimeMs,
    environment: process.env.NODE_ENV || 'development',
  });
});

export default router;
