# 🏥 HealthSync — Healthcare Appointment & Follow-Up Manager

A full-stack healthcare appointment management system with AI-powered visit summaries, email notifications, Google Calendar sync, and medication reminders. Built with Next.js 14 App Router, Prisma, PostgreSQL, and the Claude API.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Setup Guide](#setup-guide)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [LLM Prompts](#llm-prompts)
- [Google Calendar Setup](#google-calendar-setup)
- [Deployment](#deployment)
- [Demo Accounts](#demo-accounts)

---

## ✨ Features

| Role | Capabilities |
|------|-------------|
| **Admin** | Manage doctors, view all appointments, mark doctor leave, send broadcast notifications |
| **Doctor** | View schedule, add post-visit notes, trigger AI summaries, manage availability |
| **Patient** | Book appointments, receive AI pre-visit summaries, view medication reminders, sync to Google Calendar |

- 🤖 **AI Pre-visit summaries** — Claude generates a personalised briefing before each appointment
- 🤖 **AI Post-visit summaries** — Claude converts doctor notes into patient-friendly follow-up reports
- 📧 **Email notifications** — Booking confirmations, reminders, and cancellation alerts via Resend
- 📅 **Google Calendar sync** — Patients can add appointments directly to their calendar
- 💊 **Medication reminders** — Vercel Cron jobs send scheduled follow-up emails
- 🔒 **JWT authentication** — Secure role-based access for Admin, Doctor, and Patient portals

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Neon.tech) |
| ORM | Prisma |
| Auth | JWT (jose) + HTTP-only cookies |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) |
| Email | Resend |
| Calendar | Google Calendar API v3 |
| Cron Jobs | Vercel Cron |
| Hosting | Vercel |

---

## 🚀 Setup Guide

### Prerequisites

- Node.js 18+
- npm or yarn
- A [Neon.tech](https://neon.tech) PostgreSQL database
- An [Anthropic](https://console.anthropic.com) API key
- A [Resend](https://resend.com) account and verified domain
- A Google Cloud project with Calendar API enabled

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/healthsync.git
cd healthsync
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

See the [Environment Variables](#environment-variables) section below for a full explanation of every key.

### 4. Set Up the Database

Push the Prisma schema to your Neon database:

```bash
npx prisma db push
```

Seed the database with demo accounts:

```bash
npx prisma db seed
```

### 5. Run the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### 6. (Optional) Run Prisma Studio

```bash
npx prisma studio
```

---

## 🔐 Environment Variables

Create a `.env.local` file in the project root. All variables below are required unless marked optional.

```env
# ─── DATABASE ─────────────────────────────────────────────
# Your Neon.tech PostgreSQL connection string (pooled recommended for serverless)
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"

# ─── JWT AUTH ─────────────────────────────────────────────
# A long, random secret used to sign JWT tokens — generate with:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET="your-very-long-random-secret-here"

# ─── ANTHROPIC (Claude API) ───────────────────────────────
# Your Claude API key from https://console.anthropic.com
ANTHROPIC_API_KEY="sk-ant-api03-..."

# ─── RESEND (Email) ───────────────────────────────────────
# Your Resend API key from https://resend.com/api-keys
RESEND_API_KEY="re_..."
# The verified sender address on your Resend account/domain
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# ─── GOOGLE CALENDAR ──────────────────────────────────────
# OAuth 2.0 credentials from Google Cloud Console
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-..."
# Must match the redirect URI registered in Google Cloud Console
GOOGLE_REDIRECT_URI="http://localhost:3000/api/calendar/callback"

# ─── APP ──────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# ─── CRON SECRET ──────────────────────────────────────────
# A secret header value that protects cron endpoints from external calls
# Set the same value in your Vercel project settings under cron job config
CRON_SECRET="your-cron-secret-here"
```

---

## 🗄 Database Schema

The full schema lives in `prisma/schema.prisma`. Below is a human-readable overview.

### `User`
```
id          String    (cuid, PK)
email       String    (unique)
password    String    (bcrypt hash)
name        String
role        Role      (ADMIN | DOCTOR | PATIENT)
createdAt   DateTime
updatedAt   DateTime
```

### `Doctor`
```
id              String    (cuid, PK)
userId          String    (FK → User, unique)
specialization  String
bio             String?
consultationFee Float
leaveDate       DateTime[]   // Dates the doctor is on leave
```

### `Patient`
```
id                  String    (cuid, PK)
userId              String    (FK → User, unique)
dateOfBirth         DateTime?
bloodGroup          String?
medicalHistory      String?
googleAccessToken   String?   // Stored for Calendar sync
googleRefreshToken  String?
```

### `Appointment`
```
id            String              (cuid, PK)
patientId     String              (FK → Patient)
doctorId      String              (FK → Doctor)
date          DateTime            // Date only (UTC midnight)
timeSlot      String              // e.g. "10:00"
status        AppointmentStatus   (PENDING | CONFIRMED | CANCELLED | COMPLETED)
symptoms      String?
notes         String?             // Doctor's post-visit notes
preSummary    String?             // Claude-generated pre-visit summary
postSummary   String?             // Claude-generated post-visit summary
calEventId    String?             // Google Calendar event ID
createdAt     DateTime
updatedAt     DateTime

@@unique([doctorId, date, timeSlot])   // Prevents double-booking at DB level
```

### `Notification`
```
id          String              (cuid, PK)
userId      String              (FK → User)
type        NotificationType    (BOOKING | REMINDER | CANCELLATION | SUMMARY)
message     String
sentAt      DateTime?
status      NotifStatus         (PENDING | SENT | FAILED)
retryCount  Int                 (default 0)
```

### `MedicationReminder`
```
id            String    (cuid, PK)
appointmentId String    (FK → Appointment, unique)
medication    String
dosage        String
frequency     String
nextReminderAt DateTime
active        Boolean   (default true)
```

---

## 📡 API Documentation

All API routes live under `/app/api/`. Authentication is enforced via the JWT cookie (`healthsync_token`).

### Auth

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/login` | None | Login and receive JWT cookie |
| POST | `/api/auth/register` | None | Register a new user |
| POST | `/api/auth/logout` | Any | Clear JWT cookie |
| GET | `/api/auth/me` | Any | Return current user from token |

**POST `/api/auth/login`**
```json
// Request
{ "email": "patient@demo.com", "password": "demo123" }

// Response 200
{ "user": { "id": "...", "name": "...", "role": "PATIENT" } }

// Response 401
{ "error": "Invalid credentials" }
```

---

### Appointments

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/appointments` | Any | List appointments (filtered by role) |
| POST | `/api/appointments` | Patient | Book a new appointment |
| PATCH | `/api/appointments/[id]` | Doctor/Admin | Update status or add notes |
| DELETE | `/api/appointments/[id]` | Admin | Cancel appointment |
| GET | `/api/appointments/slots` | Patient | Get available slots for a doctor/date |

**POST `/api/appointments`**
```json
// Request
{
  "doctorId": "clx...",
  "date": "2024-02-15",
  "timeSlot": "10:00",
  "symptoms": "Fever and headache for 3 days"
}

// Response 201
{ "appointment": { "id": "...", "status": "CONFIRMED", ... } }

// Response 409 — slot already taken
{ "error": "This slot is no longer available" }

// Response 400 — doctor on leave
{ "error": "Doctor is on leave on this date" }
```

---

### Doctors

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/doctors` | Any | List all doctors |
| GET | `/api/doctors/[id]` | Any | Get single doctor profile |
| POST | `/api/doctors` | Admin | Create doctor profile |
| PATCH | `/api/doctors/[id]/leave` | Admin | Mark doctor leave dates |

---

### AI Summaries

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/ai/pre-summary` | Patient | Generate pre-visit briefing |
| POST | `/api/ai/post-summary` | Doctor | Generate post-visit patient report |

**POST `/api/ai/pre-summary`**
```json
// Request
{ "appointmentId": "clx..." }

// Response 200
{ "summary": "Based on your symptoms of fever and headache..." }
```

---

### Notifications & Email

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/notifications` | Any | List user's notifications |
| POST | `/api/notifications/send` | Admin | Send broadcast notification |

---

### Google Calendar

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/calendar/auth` | Patient | Redirect to Google OAuth consent screen |
| GET | `/api/calendar/callback` | Patient | Handle OAuth callback, store tokens |
| POST | `/api/calendar/add-event` | Patient | Add appointment to Google Calendar |

---

### Cron Jobs (Vercel)

| Method | Route | Header Required | Description |
|--------|-------|-----------------|-------------|
| GET | `/api/cron/reminders` | `x-cron-secret` | Send medication & appointment reminders |
| GET | `/api/cron/retry-notifications` | `x-cron-secret` | Retry failed email notifications |

---

## 🤖 LLM Prompts

All Claude prompts are stored in `lib/prompts.ts`. Here are the exact prompts used:

### Pre-Visit Summary Prompt

```
System:
You are a compassionate medical assistant helping patients prepare for their doctor's appointment. 
Keep your response concise, reassuring, and in simple language a non-medical person can understand.
Always end with a short list of questions the patient might want to ask their doctor.

User:
Generate a pre-visit summary for a patient with the following details:

Doctor: {{doctorName}} ({{specialization}})
Appointment Date: {{date}} at {{timeSlot}}
Patient's reported symptoms: {{symptoms}}
Patient's medical history: {{medicalHistory}}

Please provide:
1. A brief, empathetic acknowledgement of their symptoms
2. What to expect during this type of appointment
3. How to prepare (what to bring, what to wear, fasting if relevant)
4. 3–5 suggested questions to ask the doctor
```

### Post-Visit Summary Prompt

```
System:
You are a medical documentation assistant. Convert a doctor's clinical notes into a 
clear, actionable follow-up report for the patient. Use plain English.
Structure your response with clear sections and bullet points.

User:
Convert the following doctor's notes into a patient-friendly post-visit summary:

Doctor: {{doctorName}}
Appointment Date: {{date}}
Doctor's Notes: {{notes}}

Please produce:
1. Diagnosis / What the doctor found (in simple terms)
2. Treatment plan and medications (name, dosage, frequency)
3. Follow-up instructions (rest, diet, activity restrictions)
4. Warning signs — when to seek immediate care
5. Next appointment recommendation
```

### Medication Reminder Email Prompt

```
System:
You are a friendly healthcare reminder assistant. Write a short, warm, personalised 
medication reminder email. Keep it under 100 words. Never use clinical jargon.

User:
Write a medication reminder for:
Patient name: {{patientName}}
Medication: {{medication}}
Dosage: {{dosage}}
Frequency: {{frequency}}
Prescribed by: Dr. {{doctorName}}
```

---

## 📅 Google Calendar Setup

Follow these steps to enable the Google Calendar integration.

### Step 1 — Create a Google Cloud Project

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Click **New Project**, give it a name (e.g. `HealthSync`), and click **Create**

### Step 2 — Enable the Calendar API

1. In the left sidebar go to **APIs & Services → Library**
2. Search for **Google Calendar API**
3. Click it, then click **Enable**

### Step 3 — Create OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth client ID**
3. Set the application type to **Web application**
4. Under **Authorized redirect URIs**, add:
   - `http://localhost:3000/api/calendar/callback` (development)
   - `https://your-app.vercel.app/api/calendar/callback` (production)
5. Click **Create** — copy the **Client ID** and **Client Secret** into your `.env.local`

### Step 4 — Configure OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**
2. Set User Type to **External**
3. Fill in the app name, support email, and developer contact
4. Add the scope: `.../auth/calendar.events`
5. Add test users (your own email) while in development mode

### Step 5 — Set Environment Variables

```env
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-..."
GOOGLE_REDIRECT_URI="http://localhost:3000/api/calendar/callback"
```

### Step 6 — Production

When deploying to Vercel, add the production redirect URI to your Google Cloud credentials and update `GOOGLE_REDIRECT_URI` in your Vercel environment variables.

---

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables from `.env.local` to the Vercel project settings
4. Add the cron job configuration to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/retry-notifications",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

5. Deploy — Vercel will automatically run `prisma db push` via the build command if configured

### Build Command (in Vercel settings)

```bash
npx prisma generate && next build
```

---

## 👥 Demo Accounts

The seed script creates three ready-to-use accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | demo123 |
| Doctor | doctor@demo.com | demo123 |
| Patient | patient@demo.com | demo123 |

A quick-fill UI on the login page lets you switch between roles with one click during testing.

---

## 📁 Project Structure

```
healthsync/
├── app/
│   ├── api/               # All API route handlers
│   │   ├── auth/
│   │   ├── appointments/
│   │   ├── doctors/
│   │   ├── ai/
│   │   ├── calendar/
│   │   ├── notifications/
│   │   └── cron/
│   ├── (portals)/
│   │   ├── admin/         # Admin dashboard pages
│   │   ├── doctor/        # Doctor dashboard pages
│   │   └── patient/       # Patient dashboard pages
│   ├── login/
│   └── register/
├── components/            # Shared React components
├── lib/
│   ├── auth.ts            # JWT helpers
│   ├── prisma.ts          # Prisma client singleton
│   ├── prompts.ts         # All Claude prompt templates
│   ├── email.ts           # Resend email helpers
│   └── calendar.ts        # Google Calendar helpers
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── middleware.ts           # JWT-aware route protection
├── .env.example
├── vercel.json
└── README.md
```

---

## 📄 License

MIT
