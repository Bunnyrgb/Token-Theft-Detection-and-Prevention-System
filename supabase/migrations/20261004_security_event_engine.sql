-- Migration: 20261004_security_event_engine.sql
-- Upgrades TokenGuard schema for realistic Token Replay Detection,
-- Security Event Engine, Geolocation / Impossible Travel analysis,
-- and Simulation Sandboxing.

-- 1. Upgrade SESSIONS table
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS previous_refresh_token_hashes TEXT[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS rotation_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS last_rotated_at TIMESTAMPTZ;

-- 2. Upgrade SECURITY_EVENTS table
ALTER TABLE public.security_events
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS reason TEXT,
ADD COLUMN IF NOT EXISTS action_taken VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_simulation BOOLEAN DEFAULT FALSE NOT NULL;

-- 3. Upgrade ALERTS table
ALTER TABLE public.alerts
ADD COLUMN IF NOT EXISTS is_simulation BOOLEAN DEFAULT FALSE NOT NULL;

-- 4. Create FAILED_LOGINS tracking table for brute-force / repeated failed attempt detection
CREATE TABLE IF NOT EXISTS public.failed_logins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    attempted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Additional SOC Query Indexes
CREATE INDEX IF NOT EXISTS idx_security_events_is_simulation ON public.security_events(is_simulation);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_sessions_rotation_count ON public.sessions(rotation_count);
CREATE INDEX IF NOT EXISTS idx_failed_logins_email ON public.failed_logins(email);
CREATE INDEX IF NOT EXISTS idx_failed_logins_ip ON public.failed_logins(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_logins_attempted_at ON public.failed_logins(attempted_at DESC);
