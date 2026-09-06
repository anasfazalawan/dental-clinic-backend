import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env.js';
import { checkDatabaseConnection, prisma } from './config/prisma.js';
import healthRoutes from './routes/healthRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import seedRoutes from './routes/seedRoutes.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// 1. Security & Logging Middleware
app.use(helmet());

// Configure CORS using centralized env config
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman, Render health checks)
      if (!origin) return callback(null, true);
      if (env.CORS_ORIGIN.includes('*') || env.CORS_ORIGIN.includes(origin) || env.isDevelopment) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy does not allow access from origin ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(morgan(env.isDevelopment ? 'dev' : 'combined'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 2. Base Welcome Route
app.get('/', (req, res) => {
  res.json({
    name: 'DentPulse API - Dental Clinic Management System',
    version: '1.0.0',
    documentation: '/api/health',
    status: 'online',
    timestamp: new Date().toISOString(),
  });
});

// 3. API Routes
app.use('/api/health', healthRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/seed', seedRoutes);

// 4. Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// 5. Start Server
const startServer = async () => {
  try {
    const dbStatus = await checkDatabaseConnection();
    if (dbStatus.connected) {
      console.log('✅ Supabase / PostgreSQL database connected successfully.');
    } else {
      console.warn('⚠️ Database connection notice:', dbStatus.message);
      console.warn('💡 Tip: Ensure DATABASE_URL is properly configured in .env for PostgreSQL/Supabase');
    }

    const server = app.listen(env.PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🏥 DentPulse Backend API running on port ${env.PORT}`);
      console.log(`📡 Health Check:  http://localhost:${env.PORT}/api/health`);
      console.log(`👨‍⚕️ Doctors API:   http://localhost:${env.PORT}/api/doctors`);
      console.log(`📅 Appointments: http://localhost:${env.PORT}/api/appointments`);
      console.log(`📊 Dashboard:    http://localhost:${env.PORT}/api/dashboard/stats`);
      console.log(`🌱 Seed API:     http://localhost:${env.PORT}/api/seed (POST)`);
      console.log(`⚙️ Environment:   ${env.NODE_ENV}`);
      console.log(`======================================================\n`);
    });

    // Graceful Shutdown
    const shutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Shutting down server gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('🔌 Database disconnected. Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
