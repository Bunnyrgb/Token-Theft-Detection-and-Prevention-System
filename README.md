# 🛡️ TokenGuard — Token Theft Detection & Prevention System

> **Modern, Production-Grade Cybersecurity SOC Platform for Real-Time Token Theft Monitoring, Single-Use Rotation, Anomaly Scoring, and Instant Session Revocation.**

---

## 📌 1. Project Overview

**TokenGuard** is an advanced full-stack cybersecurity web application that demonstrates and enforces state-of-the-art defenses against **authentication token theft, replay attacks, session hijacking, and malicious credential reuse**.

By combining **cryptographic single-use refresh token rotation**, **non-invasive device fingerprinting**, **dynamic multi-signal risk scoring**, and **instant session revocation**, TokenGuard continuously guards user sessions with zero-trust rigor.

---

## 🚀 2. Core Features

- **🔐 Robust JWT & Refresh Token Rotation**:
  - Short-lived Access Tokens (15-minute lifespan).
  - High-entropy single-use Refresh Tokens (7-day lifespan).
  - Cryptographic SHA-256 token hashing for database storage (no raw plaintext tokens stored).
  - Strict **HttpOnly**, **SameSite=Lax**, and **Secure** cookie protection (No tokens in `localStorage`).
- **🚨 Refresh Token Replay & Theft Detection**:
  - If an already-rotated or invalidated refresh token is re-submitted, the engine detects an active replay/interception attack.
  - Automatically flags the event as **CRITICAL RISK (Score: 95)**.
  - Instantly revokes the compromised session tree across all endpoints.
  - Triggers an urgent high-priority SOC alert in the user's dashboard.
- **🧠 Multi-Signal Risk Engine**:
  - Evaluates device drift, foreign IP addresses, impossible geographic travel, concurrent multi-city usage, crawler/headless browser headers, and rapid request spikes.
  - Generates a composite score from `0` to `100` mapped to `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL` risk tiers.
- **🖥️ SOC-Style Cybersecurity Dashboard**:
  - Real-time Threat Level Gauge with animated pulse indicators.
  - Safe token fingerprint table displaying obfuscated identifiers (e.g., `sess_8f42••••91ac`).
  - Active session monitor with one-click individual and bulk revocation (`Revoke All Other Sessions`).
  - Privacy-preserving device registry with trusted/untrusted toggles.
  - Searchable, filterable immutable security audit log trail.
  - Interactive charts powered by Recharts (Risk over time, Login volume, Device distribution, Threat activity %).
- **🧪 Threat Simulation Lab**:
  - Interactive, safe testbed to simulate Rogue Devices, Impossible Travel, Concurrent Spikes, and Token Replay Attacks in real-time.

---

## 🏗️ 3. Architecture & Security Flow

```text
       [ User Request / Login ]
                  │
                  ▼
      [ Credentials Validated ]
                  │
                  ▼
     [ Short-Lived JWT & Opaque Refresh Token Issued ]
                  │
                  ▼
     [ Continuous Telemetry Ingestion ]
     (IP, Device Fingerprint, User-Agent, Geo-Location)
                  │
                  ▼
       [ Multi-Signal Risk Engine ]
                  │
     ┌────────────┼────────────┐
     ▼            ▼            ▼
 [ LOW RISK ] [ MEDIUM RISK ] [ HIGH / CRITICAL ]
 (Score: 0-29)(Score: 30-59)  (Score: 60-100)
     │            │            │
   ALLOW      CHALLENGE /    AUTOMATIC SESSION
   ACCESS     GENERATE ALERT   REVOCATION & BLOCK
```

---

## 💻 4. Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion, Lucide React, Recharts.
- **Backend**: Next.js API Routes, Server Actions, JOSE JWT library, Crypto, Bcryptjs.
- **Database**: Supabase PostgreSQL with Row Level Security (RLS), indexes, and foreign key cascades (plus embedded persistent fallback for instant local operation).
- **Security**: Argon2/Bcrypt password hashing, HttpOnly secure cookie management, deterministic device fingerprinting.

---

## 🗄️ 5. Database Schema (Supabase PostgreSQL)

The schema is defined in `supabase/migrations/20260904_initial_schema.sql`:

1. **`users`**: `id (UUID)`, `name`, `email (UNIQUE)`, `password_hash`, `created_at`, `updated_at`.
2. **`devices`**: `id (UUID)`, `user_id (FK)`, `device_identifier`, `device_name`, `browser`, `operating_system`, `device_type`, `first_seen_at`, `last_seen_at`, `trusted (BOOLEAN)`.
3. **`sessions`**: `id (UUID)`, `user_id (FK)`, `session_identifier (UNIQUE)`, `refresh_token_hash`, `device_id (FK)`, `ip_address`, `user_agent`, `location`, `created_at`, `last_used_at`, `expires_at`, `revoked_at`, `risk_score`, `risk_level`, `status (Active | Suspicious | Revoked | Expired)`.
4. **`security_events`**: `id (UUID)`, `user_id (FK)`, `session_id (FK)`, `event_type`, `severity`, `risk_score`, `ip_address`, `device_id`, `metadata (JSONB)`, `created_at`.
5. **`alerts`**: `id (UUID)`, `user_id (FK)`, `event_id (FK)`, `title`, `message`, `severity`, `read (BOOLEAN)`, `resolved (BOOLEAN)`, `created_at`.

---

## ⚙️ 6. Installation & Local Setup

### Prerequisites
- Node.js 18+ or 20+
- npm

### Step 1: Clone & Install Dependencies
```bash
git clone <repo-url>
cd tokenguard
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in the variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
JWT_SECRET=super_secret_tokenguard_jwt_encryption_key_2026_xyz!
SESSION_SECRET=super_secret_tokenguard_session_rotation_key_2026_abc!
```

> **Note**: If Supabase credentials are not provided initially during local development, TokenGuard automatically utilizes its built-in local JSON/relational repository (`.tokenguard-data.json`) with identical RLS and isolation policies, allowing immediate out-of-the-box operation and testing!

### Step 3: Run Database Migrations (Supabase)
In your Supabase SQL Editor, execute the contents of:
```
supabase/migrations/20260904_initial_schema.sql
```

### Step 4: Launch Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🧪 7. Running Automated Tests

Run the security test suite:
```bash
node scripts/test-runner.mjs
```

---

## 🔒 8. Security Guarantees

- **No Tokens in LocalStorage**: All authentication state is bound to HttpOnly, SameSite cookies.
- **Never Display Raw Secrets**: Sessions expose safe identifiers (`sess_8f42••••91ac`), never plain tokens.
- **Replay Proofing**: Reusing an old refresh token automatically invalidates the entire session tree.
- **Zero Cross-User Leakage**: Server-side authorization guards and PostgreSQL RLS strictly isolate operator telemetry.

---

## 📄 License
MIT License. Built for advanced cybersecurity training and production token defense.
