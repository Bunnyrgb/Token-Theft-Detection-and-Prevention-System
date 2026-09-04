-- TokenGuard: Supabase PostgreSQL Schema & Row Level Security Policies
-- Migration: 20260904_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. DEVICES TABLE
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    device_identifier VARCHAR(255) NOT NULL,
    device_name VARCHAR(255) NOT NULL,
    browser VARCHAR(100) NOT NULL,
    operating_system VARCHAR(100) NOT NULL,
    device_type VARCHAR(50) NOT NULL DEFAULT 'Desktop',
    first_seen_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_seen_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    trusted BOOLEAN DEFAULT FALSE NOT NULL,
    CONSTRAINT unique_user_device UNIQUE (user_id, device_identifier)
);

-- 3. SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_identifier VARCHAR(100) UNIQUE NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL,
    device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NOT NULL,
    location VARCHAR(255) DEFAULT 'Unknown Location',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_used_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    risk_score INTEGER DEFAULT 0 NOT NULL,
    risk_level VARCHAR(20) DEFAULT 'LOW' NOT NULL,
    status VARCHAR(20) DEFAULT 'Active' NOT NULL -- Active, Suspicious, Revoked, Expired
);

-- 4. SECURITY EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL, -- LOGIN, LOGOUT, TOKEN_CREATED, TOKEN_REFRESHED, TOKEN_REVOKED, SESSION_CREATED, SESSION_REVOKED, NEW_DEVICE, NEW_IP, RISK_INCREASED, SUSPICIOUS_ACTIVITY, REAUTH_REQUIRED
    severity VARCHAR(20) DEFAULT 'INFO' NOT NULL, -- INFO, LOW, MEDIUM, HIGH, CRITICAL
    risk_score INTEGER DEFAULT 0 NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.security_events(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'MEDIUM' NOT NULL,
    read BOOLEAN DEFAULT FALSE NOT NULL,
    resolved BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- INDEXES FOR HIGH-PERFORMANCE SOC QUERYING
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_identifier ON public.sessions(session_identifier);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON public.devices(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON public.alerts(resolved);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Note: When integrated with Supabase Auth or custom JWT auth, RLS enforces auth.uid() = user_id
CREATE POLICY "Users can only read and update own profile"
    ON public.users FOR ALL
    USING (auth.uid() = id);

CREATE POLICY "Users can only access own devices"
    ON public.devices FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own sessions"
    ON public.sessions FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own security events"
    ON public.security_events FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own alerts"
    ON public.alerts FOR ALL
    USING (auth.uid() = user_id);
