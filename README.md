# 🏥 DentPulse — Backend RESTful API

[![Node.js Version](https://img.shields.io/badge/Node.js-v18+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21.1-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22.0-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Zod Validation](https://img.shields.io/badge/Validation-Zod%203.23-3E67B1?logo=zod&logoColor=white)](https://zod.dev/)
[![Deployment](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render&logoColor=white)](https://render.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A robust, enterprise-grade RESTful API for the **DentPulse Dental Clinic Management System**. Built with Node.js, Express, Prisma ORM, and Supabase PostgreSQL. Provides complete doctor management, intelligent appointment scheduling with conflict prevention, real-time analytics, and health monitoring for production deployment on Render.

---

## 🌟 Key Features

- **👨‍⚕️ Doctor Management (CRUD)**: Create, view, update, and delete doctors with medical specializations, practice status, ratings, room assignments, and customized weekly availability schedules (days & working hours).
- **📅 Appointment Scheduling (CRUD)**: Book, reschedule, view, and delete appointments with patient contact details, treatment reasons, and duration.
- **⚡ Smart Conflict Prevention Engine**: Automatically validates doctor working days, daily shift hours, and prevents double-booking overlapping time slots using the interval collision algorithm (`startA < endB && endA > startB`).
- **📊 Dashboard Analytics**: Real-time aggregated metrics for total doctors, today's schedule, upcoming appointments, and status breakdowns.
- **🛡️ Data Validation & Sanitization**: Request validation using Zod schemas with pre-processing to handle empty strings and optional fields cleanly.
- **🚀 Production-Ready Architecture**: Centralized error handling, CORS security, Helmet security headers, Morgan logging, and `/api/health` monitoring for Render.
- **🧪 Minimal Test Seed Script**: Fast seed script populating 2 specialist test doctors (`Dr. John Doe` & `Dr. Jane Smith`) and 2 patient visits (`John Doe` & `Jane Roe`).

---

## 🏗️ Database Schema & Entity Relationships

```
┌──────────────────────────────────────────────┐
│                    Doctor                    │
├──────────────────────────────────────────────┤
│ id                  String (UUID) [PK]       │
│ name                String                   │
│ email               String [UNIQUE]          │
│ phone               String                   │
│ specialization      String                   │
│ experienceYears     Int                      │
│ availabilityDays    String[]                 │
│ availableHoursStart String (HH:mm)           │
│ availableHoursEnd   String (HH:mm)           │
│ isActive            Boolean                  │
│ rating              Float                    │
│ avatarUrl           String?                  │
│ bio                 String?                  │
│ roomNumber          String?                  │
│ createdAt           DateTime                 │
│ updatedAt           DateTime                 │
└──────────────────────┬───────────────────────┘
                       │ 1
                       │ 
                       │ has many
                       │ 
                       │ *
┌──────────────────────┴───────────────────────┐
│                 Appointment                  │
├──────────────────────────────────────────────┤
│ id                  String (UUID) [PK]       │
│ patientName         String                   │
│ patientPhone        String                   │
│ patientEmail        String?                  │
│ doctorId            String [FK -> Doctor.id] │
│ appointmentDate     Date                     │
│ appointmentTime     String (HH:mm)           │
│ durationMinutes     Int                      │
│ reason              String                   │
│ notes               String?                  │
│ status              String (Enum)            │
│ createdAt           DateTime                 │
│ updatedAt           DateTime                 │
└──────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: v9.0.0 or higher
- **PostgreSQL Database**: A free [Supabase](https://supabase.com/) PostgreSQL instance or local PostgreSQL.

### 1. Installation

Clone the repository and checkout the `develop` branch:

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

# Supabase PostgreSQL Connection String (Session / Transaction pooler or Direct)
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require"

# Optional Direct URL for Prisma migrations when using Supabase pooler
# DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# Optional Supabase credentials
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

> **Note on Special Characters**: If your database password contains special characters (e.g. `@`, `%`, `#`), make sure they are URL-encoded in the connection string (`@` -> `%40`, `%` -> `%25`).

### 3. Setting Up the Database

1. Push the Prisma schema to Supabase:
   ```bash
   npx prisma db push
   ```
2. Seed the database with the minimal test data (2 test doctors & 2 appointments):
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
| `GET` | `/api/health` | Service status and Supabase connection health check | `200 OK`, `503 Service Unavailable` |

### Dashboard Analytics

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/api/dashboard/stats` | Aggregated statistics, today's schedule, and doctor workload | `200 OK` |

### Doctors (`/api/doctors`)

| Method | Endpoint | Description | Query Parameters / Body | Status Codes |
|---|---|---|---|---|
| `GET` | `/api/doctors` | List doctors with filtering | `search`, `specialization`, `isActive`, `sort`, `order` | `200 OK` |
| `GET` | `/api/doctors/specializations` | Get list of distinct specializations | None | `200 OK` |
| `GET` | `/api/doctors/:id` | Get single doctor details with booked visits | None | `200 OK`, `404 Not Found` |
| `POST` | `/api/doctors` | Create a new doctor | Doctor JSON payload | `201 Created`, `409 Conflict`, `422 Unprocessable` |
| `PUT` | `/api/doctors/:id` | Update doctor details | Doctor JSON payload | `200 OK`, `404 Not Found`, `422 Unprocessable` |
| `DELETE` | `/api/doctors/:id` | Delete doctor (checks for active appointments) | `force=true` (optional) | `200 OK`, `400 Bad Request`, `404 Not Found` |

#### Doctor JSON Payload Example:
```json
{
  "name": "Dr. John Doe, DDS",
  "email": "john.doe@dentpulse.com",
  "phone": "+1 (555) 100-2001",
  "specialization": "General Dentistry",
  "experienceYears": 10,
  "availabilityDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "availableHoursStart": "09:00",
  "availableHoursEnd": "17:00",
  "isActive": true,
  "rating": 4.9,
  "roomNumber": "Suite 101"
}
```

### Appointments (`/api/appointments`)

| Method | Endpoint | Description | Query Parameters / Body | Status Codes |
|---|---|---|---|---|
| `GET` | `/api/appointments` | List appointments with filtering | `doctorId`, `status`, `date`, `startDate`, `endDate`, `search`, `page`, `limit` | `200 OK` |
| `GET` | `/api/appointments/:id` | Get single appointment details | None | `200 OK`, `404 Not Found` |
| `POST` | `/api/appointments` | Book appointment (with conflict check) | Appointment JSON payload | `201 Created`, `409 Conflict`, `422 Unprocessable` |
| `PUT` | `/api/appointments/:id` | Update / reschedule appointment | Appointment JSON payload | `200 OK`, `404 Not Found`, `409 Conflict`, `422 Unprocessable` |
| `PATCH` | `/api/appointments/:id/status` | Update appointment status | `{ "status": "CONFIRMED" }` | `200 OK`, `404 Not Found`, `422 Unprocessable` |
| `DELETE` | `/api/appointments/:id` | Delete appointment | None | `200 OK`, `404 Not Found` |

#### Appointment JSON Payload Example:
```json
{
  "patientName": "John Doe",
  "patientPhone": "+1 (555) 019-2831",
  "patientEmail": "johndoe.patient@example.com",
  "doctorId": "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
  "appointmentDate": "2026-09-10",
  "appointmentTime": "10:00",
  "durationMinutes": 30,
  "reason": "Routine Dental Checkup & Cleaning",
  "notes": "Patient reports minor sensitivity on upper left molar.",
  "status": "SCHEDULED"
}
```

### Seed Endpoint (`/api/seed`)

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `POST` | `/api/seed` | Repopulate database with minimal test records (John Doe test data) | `200 OK`, `500 Internal Error` |

---

## ⚡ Smart Conflict Prevention Algorithm

When scheduling or rescheduling an appointment, `src/utils/timeConflict.js` performs validation:
1. **Doctor Working Day Verification**: Ensures the requested date matches one of the doctor's `availabilityDays`.
2. **Shift Hours Boundary**: Ensures `[appointmentTime, appointmentTime + duration]` falls strictly within `[availableHoursStart, availableHoursEnd]`.
3. **Time Interval Collision**: Queries existing active bookings for that doctor on the specified date and verifies that:
   $$\text{start}_{\text{new}} < \text{end}_{\text{existing}} \quad \text{and} \quad \text{end}_{\text{new}} > \text{start}_{\text{existing}}$$
   If an overlap is detected, the API returns HTTP `409 Conflict` with clear details of the collision.

---

## 🌐 Deploying to Render (Web Service)

- **Live Production Service**: [https://dental-clinic-backend-ilhq.onrender.com](https://dental-clinic-backend-ilhq.onrender.com/)
- **Live Health Endpoint**: [https://dental-clinic-backend-ilhq.onrender.com/api/health](https://dental-clinic-backend-ilhq.onrender.com/api/health)

1. Push your repository to GitHub on the `develop` branch:
   ```bash
   git push origin develop
   ```
2. Go to the [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
3. Connect your `anasfazalawan/dental-clinic-backend` repository.
4. Configure service settings:
   - **Name**: `dental-clinic-backend`
   - **Runtime**: `Node`
   - **Branch**: `develop`
   - **Build Command**: `npm install && npx prisma generate && npx prisma db push`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
5. Under **Environment Variables**, add:
   - `DATABASE_URL`: *Your Supabase PostgreSQL Connection String (Pooler)*
   - `DIRECT_URL`: *Your Supabase PostgreSQL Direct Connection String*
   - `NODE_ENV`: `production`
   - `CORS_ORIGIN`: `http://localhost:5173,https://dental-clinic-frontend-nine.vercel.app`
6. Click **Create Web Service**.

---

## 🔒 Security & Best Practices

- **Zero Hardcoded Secrets**: Secrets are read from environment variables; `.env` is ignored by Git.
- **SQL Injection Immune**: All database operations use Prisma ORM parameterized queries.
- **Strict Input Validation**: Zod middleware guarantees valid types and formats before reaching controllers.
- **Graceful Error Handling**: Unknown runtime exceptions are caught and sanitized to prevent leaking stack traces in production.

---

## 📄 License

This project is licensed under the MIT License.