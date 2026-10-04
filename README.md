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

## 🗄️ 5. Database Schema & Migrations (Supabase PostgreSQL)

The schema is defined in two progressive migration files in `supabase/migrations/`:

1. **`20260904_initial_schema.sql`**: Base tables for users, devices, sessions, security events, and alerts with Row Level Security.
2. **`20261004_security_event_engine.sql`**: Upgrades for enterprise-grade token security:
   - `sessions`: Adds `previous_refresh_token_hashes (TEXT[])` for token family history, `rotation_count (INTEGER)`, `last_rotated_at (TIMESTAMPTZ)`.
   - `security_events`: Adds `user_agent`, `location`, `description`, `reason`, `action_taken`, `is_simulation (BOOLEAN)`.
   - `alerts`: Adds `is_simulation (BOOLEAN)` to separate simulated alerts from real attacks.
   - `failed_logins`: Brute-force & credential stuffing detection table tracking IP, email, and timestamp.
   - Performance Indexes: Added on `(user_id, created_at DESC)`, `(user_id, is_simulation)`, and GIN index on `previous_refresh_token_hashes`.

To apply migrations in Supabase:
1. Open your Supabase Dashboard -> **SQL Editor**.
2. Run `supabase/migrations/20260904_initial_schema.sql`.
3. Run `supabase/migrations/20261004_security_event_engine.sql`.

---

## ⚙️ 6. Installation & Local Setup

### Prerequisites
- Node.js 18+ or 20+
- npm

### Step 1: Clone & Install Dependencies
```bash
git clone https://github.com/Bunnyrgb/Token-Theft-Detection-and-Prevention-System.git
cd Token-Theft-Detection-and-Prevention-System
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

> **Zero-Config Local Fallback**: If Supabase credentials are not provided during local development, TokenGuard automatically utilizes its built-in local transactional database repository (`.tokenguard-data.json`) with identical RLS and isolation policies, allowing immediate out-of-the-box operation and testing without external database setup!

### Step 3: Run Tests & Build
```bash
# Run security test suite (14/14 automated tests)
npm test

# Build for production
npm run build
```

### Step 4: Launch Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🧪 7. Threat Simulation Lab (8 Attack Scenarios)

TokenGuard includes a safe, fully instrumented **Security Lab** accessible from `/dashboard/simulator`:
1. **Normal Login (`LOGIN_SUCCESS`)**: Validates baseline zero-risk session establishment.
2. **New Device Anomaly (`DEVICE_CHANGED`)**: Emulates browser/OS switch (+20 Risk).
3. **Suspicious IP Drift (`IP_CHANGED`)**: Emulates VPN or unfamiliar subnet hopping (+10 Risk).
4. **Legitimate Token Rotation (`TOKEN_ROTATED`)**: Tests RFC 6749 single-use refresh token exchange.
5. **Token Replay / Theft Attack (`TOKEN_REPLAY_DETECTED`)**: Simulates an adversary presenting a stolen, previously rotated refresh token (+40 Risk -> Auto-Revocation).
6. **Impossible Travel Anomaly (`IMPOSSIBLE_TRAVEL`)**: Simulates 8,000 km geographic jump in 10 minutes (+30 Risk).
7. **Brute Force Infiltration (`LOGIN_FAILED` burst)**: Simulates 5 rapid credential failures (+20 Risk).
8. **Suspicious Bot / Headless Client (`SUSPICIOUS_ACTIVITY`)**: Simulates automated token exfiltration script (+25 Risk).

Every simulated event is tagged with `is_simulation: true` and visible when the top bar is toggled to **"Demo / Simulation"** mode, ensuring simulated attacks are **never presented as real incidents**.

---

## 🌐 8. Deployment to Render

TokenGuard is fully production-ready and configured for deployment as a Render Web Service:

1. **Create Web Service** on Render connected to your Git repository.
2. **Runtime**: `Node`
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm start`
5. **Environment Variables**:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = `<Generate a secure 64-character random string>`
   - `SESSION_SECRET` = `<Generate a secure 64-character random string>`
   - `NEXT_PUBLIC_SUPABASE_URL` = `<Your Supabase Project URL>`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `<Your Supabase Anon Key>`
   - `SUPABASE_SERVICE_ROLE_KEY` = `<Your Supabase Service Role Key>`
6. **Health Check Path**: `/`

---

## 🔒 9. Security Guarantees & Privacy

- **No Plaintext Tokens**: Tokens are never stored in plaintext. Passwords use Bcrypt (12 rounds) and refresh tokens use SHA-256 digests.
- **Strict Cookie Binding**: `tokenguard_access` and `tokenguard_refresh` cookies are configured with `HttpOnly`, `SameSite=Lax`, and `Secure` (in production).
- **Masked Visual Display**: Front-end displays tokens safely masked (`eyJhbGci...••••••••••`).
- **Explainable Dynamic Risk**: Transparent 4-point breakdown for every risk event (What Happened, Why Risky, Action Taken, Recommendation).
- **Time-Decay Recovery**: Passive sessions recover safely using exponential half-life decay.
- **Tenant Isolation**: Supabase RLS and server-side session authentication guarantee User A cannot query or mutate User B's events or sessions.
- **Production Headers**: Strict CSP, HSTS, X-Content-Type-Options: nosniff, Referrer-Policy, and Permissions-Policy.

---

## 📄 License
MIT License. Built for advanced cybersecurity training and production token defense.
