import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { checkDatabaseConnection, prisma } from './config/prisma.js';
import healthRoutes from './routes/healthRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import seedRoutes from './routes/seedRoutes.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// 1. Security & Logging Middleware
app.use(helmet());

// Configure CORS for local development and production Render deployment
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman, Render health checks)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin) || NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy does not allow access from origin ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));
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

    const server = app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🏥 DentPulse Backend API running on port ${PORT}`);
      console.log(`📡 Health Check:  http://localhost:${PORT}/api/health`);
      console.log(`👨‍⚕️ Doctors API:   http://localhost:${PORT}/api/doctors`);
      console.log(`📅 Appointments: http://localhost:${PORT}/api/appointments`);
      console.log(`📊 Dashboard:    http://localhost:${PORT}/api/dashboard/stats`);
      console.log(`🌱 Seed API:     http://localhost:${PORT}/api/seed (POST)`);
      console.log(`⚙️ Environment:   ${NODE_ENV}`);
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
