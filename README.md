# 🏥 DentPulse - Dental Clinic Management System (Backend API)

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/express-4.21.1-blue.svg)](https://expressjs.com/)
[![Prisma ORM](https://img.shields.io/badge/prisma-5.22.0-indigo.svg)](https://www.prisma.io/)
[![Database](https://img.shields.io/badge/database-Supabase%20PostgreSQL-emerald.svg)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A robust, enterprise-grade RESTful API for the **DentPulse Dental Clinic Management System**. Built with Node.js, Express, Prisma ORM, and Supabase PostgreSQL. Provides complete doctor management, intelligent appointment scheduling with conflict prevention, real-time analytics, and health monitoring for production deployment on Render.

---

## 🌟 Key Features

- **Doctor Management (CRUD)**: Create, view, update, and delete doctors with specializations, active status, ratings, and custom availability schedules (days & working hours).
- **Appointment Scheduling (CRUD)**: Book, reschedule, view, and delete appointments with validation for patient contact details, treatment reasons, and duration.
- **Smart Conflict Prevention**: Automatically validates doctor working days, daily shift hours, and prevents double-booking overlapping time slots.
- **Dashboard Analytics**: Real-time aggregated metrics for total doctors, today's schedule, upcoming appointments, and status breakdowns.
- **Data Validation & Sanitization**: Request validation using Zod schemas with descriptive error responses.
- **Production-Ready Architecture**: Centralized error handling, CORS security, Helmet security headers, Morgan logging, and `/api/health` monitoring for Render.
- **Automated Seeding**: One-command seed script to populate realistic specialist doctors and appointments across multiple dates and statuses.

---

## 🏗️ Architecture & Database Model

### Entity-Relationship Diagram (ERD)

```
┌──────────────────────────────────────┐       ┌──────────────────────────────────────┐
│               Doctor                 │       │             Appointment              │
├──────────────────────────────────────┤       ├──────────────────────────────────────┤
│ id: String (UUID) [PK]               │1     *│ id: String (UUID) [PK]               │
│ name: String                         ├───────┤ patientName: String                  │
│ email: String [UNIQUE]               │       │ patientPhone: String                 │
│ phone: String                        │       │ patientEmail: String?                │
│ specialization: String               │       │ doctorId: String [FK]                │
│ experienceYears: Int                 │       │ appointmentDate: Date                │
│ availabilityDays: String[]           │       │ appointmentTime: String (HH:mm)      │
│ availableHoursStart: String (HH:mm)  │       │ durationMinutes: Int                 │
│ availableHoursEnd: String (HH:mm)    │       │ reason: String                       │
│ isActive: Boolean                    │       │ notes: String?                       │
│ rating: Float                        │       │ status: AppointmentStatus            │
│ avatarUrl: String?                   │       │ createdAt: DateTime                  │
│ bio: String?                         │       │ updatedAt: DateTime                  │
│ roomNumber: String?                  │       └──────────────────────────────────────┘
│ createdAt: DateTime                  │
│ updatedAt: DateTime                  │
└──────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: v9.0.0 or higher
- **PostgreSQL Database**: A free [Supabase](https://supabase.com/) PostgreSQL instance or local PostgreSQL.

### 1. Installation

Clone the repository and switch to the `develop` branch:

```bash
git clone <YOUR_BACKEND_REPO_URL> dental-clinic-backend
cd dental-clinic-backend
git checkout develop
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Configure your `.env` variables:

```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Supabase PostgreSQL Connection String
# Example: postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres"

# Optional Direct URL for Prisma migrations when using Supabase connection pooler
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres"
```

### 3. Setting Up Supabase Database

1. Create a free account at [Supabase](https://supabase.com/).
2. Create a new project (e.g. `dentpulse-clinic`).
3. Navigate to **Project Settings** -> **Database**.
4. Copy the **Connection String** (URI) under `Connection Pooling` (Port 6543) or `Direct Connection` (Port 5432).
5. Paste it as `DATABASE_URL` in your `.env` file.
6. Push the Prisma schema to Supabase:
   ```bash
   npx prisma db push
   ```
7. Seed the database with mock clinic data:
   ```bash
   npm run seed
   ```

### 4. Running the Server

- **Development Mode** (with auto-reload):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```

The server will start at `http://localhost:5000`.

---

## 📡 REST API Reference

### Health & Monitoring

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/api/health` | Service and database connectivity health check | `200 OK`, `503 Service Unavailable` |

### Dashboard Analytics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/stats` | Aggregated clinic statistics, today's schedule, and doctor workload |

### Doctors (`/api/doctors`)

| Method | Endpoint | Description | Query Parameters / Body |
|---|---|---|---|
| `GET` | `/api/doctors` | List doctors | `search`, `specialization`, `isActive`, `sort`, `order` |
| `GET` | `/api/doctors/specializations` | Get list of distinct specializations | None |
| `GET` | `/api/doctors/:id` | Get single doctor details with appointments | None |
| `POST` | `/api/doctors` | Create a new doctor | Doctor JSON payload |
| `PUT` | `/api/doctors/:id` | Update doctor details | Doctor JSON payload |
| `DELETE` | `/api/doctors/:id` | Delete doctor (checks for active appointments) | `force=true` (optional) |

#### Doctor JSON Payload Example:
```json
{
  "name": "Dr. Sarah Jenkins, DDS",
  "email": "sarah.jenkins@dentpulse.com",
  "phone": "+1 (555) 234-5678",
  "specialization": "Orthodontics",
  "experienceYears": 12,
  "availabilityDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "availableHoursStart": "08:30",
  "availableHoursEnd": "16:30",
  "isActive": true,
  "rating": 4.95,
  "roomNumber": "Suite 101 - Ortho Wing"
}
```

### Appointments (`/api/appointments`)

| Method | Endpoint | Description | Query Parameters / Body |
|---|---|---|---|
| `GET` | `/api/appointments` | List appointments | `doctorId`, `status`, `date`, `startDate`, `endDate`, `search`, `page`, `limit` |
| `GET` | `/api/appointments/:id` | Get single appointment details | None |
| `POST` | `/api/appointments` | Schedule a new appointment (validates conflicts) | Appointment JSON payload |
| `PUT` | `/api/appointments/:id` | Update appointment details | Appointment JSON payload |
| `PATCH` | `/api/appointments/:id/status` | Update appointment status | `{ "status": "CONFIRMED" }` |
| `DELETE` | `/api/appointments/:id` | Delete appointment | None |

#### Appointment JSON Payload Example:
```json
{
  "patientName": "Emma Watson",
  "patientPhone": "+1 (555) 111-2233",
  "patientEmail": "emma.watson@gmail.com",
  "doctorId": "c3e8e19b-6b04-4b55-b461-123456789abc",
  "appointmentDate": "2026-09-10",
  "appointmentTime": "10:00",
  "durationMinutes": 30,
  "reason": "Invisalign Progress Check",
  "notes": "Bring aligner set #14",
  "status": "SCHEDULED"
}
```

### Demo Seeding (`/api/seed`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/seed` | Reset and repopulate the database with sample clinic data |

---

## 🚀 Deploying to Render

1. Push your code to GitHub on the `develop` (or `main`) branch.
2. Log in to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** -> **Web Service**.
4. Connect your `dental-clinic-backend` GitHub repository.
5. Configure settings:
   - **Name**: `dental-clinic-backend`
   - **Environment**: `Node`
   - **Branch**: `develop`
   - **Root Directory**: Leave blank (or `./`)
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
6. Under **Environment Variables**, add:
   - `DATABASE_URL`: *Your Supabase PostgreSQL Connection String*
   - `NODE_ENV`: `production`
   - `CORS_ORIGIN`: `https://your-frontend-subdomain.onrender.com` (or `*`)
7. Click **Create Web Service**.

---

## 🔒 Security & Best Practices

- **Zero Credentials in Git**: All sensitive credentials are kept in `.env` (excluded by `.gitignore`).
- **Parameterized SQL via Prisma**: SQL injection attacks are prevented by Prisma's query engine.
- **Relational Integrity**: Restrictive foreign key constraints prevent orphaned appointments.
- **Conflict Prevention Engine**: Prevents double-booking doctor schedules.

---

## 📄 License

This project is licensed under the MIT License.
