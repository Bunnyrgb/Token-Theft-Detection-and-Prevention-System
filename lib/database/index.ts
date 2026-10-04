import fs from "fs";
import path from "path";
import { User, Device, Session, SecurityEvent, Alert } from "../types";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Optional remote Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseKey && supabaseUrl.startsWith("http")) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (e) {
    console.warn("Could not initialize remote Supabase client:", e);
  }
}

interface LocalDatabaseSchema {
  users: User[];
  devices: Device[];
  sessions: Session[];
  security_events: SecurityEvent[];
  alerts: Alert[];
  failed_logins?: { id: string; email: string; ip_address: string; user_agent: string; attempted_at: string }[];
}

const DB_FILE_PATH = path.join(process.cwd(), ".tokenguard-data.json");

function readLocalDb(): LocalDatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) {
      const initial: LocalDatabaseSchema = {
        users: [],
        devices: [],
        sessions: [],
        security_events: [],
        alerts: [],
        failed_logins: [],
      };
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initial, null, 2));
      return initial;
    }
    const data = fs.readFileSync(DB_FILE_PATH, "utf8");
    const parsed = JSON.parse(data);
    if (!parsed.failed_logins) parsed.failed_logins = [];
    return parsed;
  } catch (err) {
    return {
      users: [],
      devices: [],
      sessions: [],
      security_events: [],
      alerts: [],
      failed_logins: [],
    };
  }
}

function writeLocalDb(db: LocalDatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error("Failed to write local db:", err);
  }
}

export const dbRepository = {
  // ----------------------------------------------------
  // USERS
  // ----------------------------------------------------
  async createUser(user: Omit<User, "id" | "created_at" | "updated_at">): Promise<User> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newUser: User = {
      id,
      ...user,
      created_at: now,
      updated_at: now,
    };

    if (supabase) {
      const { data, error } = await supabase.from("users").insert(newUser).select().single();
      if (!error && data) return data as User;
    }

    const db = readLocalDb();
    db.users.push(newUser);
    writeLocalDb(db);
    return newUser;
  },

  async getUserByEmail(email: string): Promise<User | null> {
    if (supabase) {
      const { data } = await supabase.from("users").select("*").eq("email", email.toLowerCase().trim()).maybeSingle();
      if (data) return data as User;
    }

    const db = readLocalDb();
    return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
  },

  async getUserById(id: string): Promise<User | null> {
    if (supabase) {
      const { data } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
      if (data) return data as User;
    }

    const db = readLocalDb();
    return db.users.find((u) => u.id === id) || null;
  },

  async updateUserPassword(userId: string, passwordHash: string): Promise<boolean> {
    const now = new Date().toISOString();
    if (supabase) {
      const { error } = await supabase.from("users").update({ password_hash: passwordHash, updated_at: now }).eq("id", userId);
      return !error;
    }
    const db = readLocalDb();
    const idx = db.users.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      db.users[idx].password_hash = passwordHash;
      db.users[idx].updated_at = now;
      writeLocalDb(db);
      return true;
    }
    return false;
  },

  // ----------------------------------------------------
  // DEVICES
  // ----------------------------------------------------
  async upsertDevice(device: Omit<Device, "id" | "first_seen_at" | "last_seen_at">): Promise<Device> {
    const now = new Date().toISOString();

    if (supabase) {
      const { data: existing } = await supabase
        .from("devices")
        .select("*")
        .eq("user_id", device.user_id)
        .eq("device_identifier", device.device_identifier)
        .maybeSingle();

      if (existing) {
        const { data: updated } = await supabase
          .from("devices")
          .update({ last_seen_at: now, browser: device.browser, operating_system: device.operating_system })
          .eq("id", existing.id)
          .select()
          .single();
        if (updated) return updated as Device;
      } else {
        const { data: created } = await supabase
          .from("devices")
          .insert({ ...device, first_seen_at: now, last_seen_at: now })
          .select()
          .single();
        if (created) return created as Device;
      }
    }

    const db = readLocalDb();
    const existingIdx = db.devices.findIndex(
      (d) => d.user_id === device.user_id && d.device_identifier === device.device_identifier
    );

    if (existingIdx !== -1) {
      db.devices[existingIdx].last_seen_at = now;
      db.devices[existingIdx].browser = device.browser;
      db.devices[existingIdx].operating_system = device.operating_system;
      writeLocalDb(db);
      return db.devices[existingIdx];
    } else {
      const newDevice: Device = {
        id: crypto.randomUUID(),
        ...device,
        first_seen_at: now,
        last_seen_at: now,
      };
      db.devices.push(newDevice);
      writeLocalDb(db);
      return newDevice;
    }
  },

  async getDevicesByUser(userId: string): Promise<Device[]> {
    if (supabase) {
      const { data } = await supabase.from("devices").select("*").eq("user_id", userId).order("last_seen_at", { ascending: false });
      if (data) return data as Device[];
    }
    const db = readLocalDb();
    return db.devices.filter((d) => d.user_id === userId).sort((a, b) => new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime());
  },

  async setDeviceTrust(userId: string, deviceId: string, trusted: boolean): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from("devices").update({ trusted }).eq("id", deviceId).eq("user_id", userId);
      return !error;
    }
    const db = readLocalDb();
    const dev = db.devices.find((d) => d.id === deviceId && d.user_id === userId);
    if (dev) {
      dev.trusted = trusted;
      writeLocalDb(db);
      return true;
    }
    return false;
  },

  // ----------------------------------------------------
  // SESSIONS & TOKEN LIFECYCLE
  // ----------------------------------------------------
  async createSession(session: Omit<Session, "id" | "created_at" | "last_used_at">): Promise<Session> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newSession: Session = {
      id,
      rotation_count: session.rotation_count || 0,
      previous_refresh_token_hashes: session.previous_refresh_token_hashes || [],
      last_rotated_at: session.last_rotated_at || now,
      ...session,
      created_at: now,
      last_used_at: now,
    };

    if (supabase) {
      const { data, error } = await supabase.from("sessions").insert(newSession).select().single();
      if (!error && data) return data as Session;
    }

    const db = readLocalDb();
    db.sessions.push(newSession);
    writeLocalDb(db);
    return newSession;
  },

  async getSessionById(sessionId: string): Promise<Session | null> {
    if (supabase) {
      const { data } = await supabase.from("sessions").select("*, device:devices(*)").eq("id", sessionId).maybeSingle();
      if (data) return data as Session;
    }
    const db = readLocalDb();
    const sess = db.sessions.find((s) => s.id === sessionId);
    if (!sess) return null;
    const device = db.devices.find((d) => d.id === sess.device_id);
    return { ...sess, device };
  },

  async getSessionsByUser(userId: string): Promise<Session[]> {
    if (supabase) {
      const { data } = await supabase
        .from("sessions")
        .select("*, device:devices(*)")
        .eq("user_id", userId)
        .order("last_used_at", { ascending: false });
      if (data) return data as Session[];
    }
    const db = readLocalDb();
    return db.sessions
      .filter((s) => s.user_id === userId)
      .map((s) => ({ ...s, device: db.devices.find((d) => d.id === s.device_id) }))
      .sort((a, b) => new Date(b.last_used_at).getTime() - new Date(a.last_used_at).getTime());
  },

  /**
   * Evaluates if a given token hash matches active token OR previous rotated token family
   */
  async findSessionByAnyRefreshTokenHash(hash: string): Promise<{ session: Session; isReplay: boolean } | null> {
    const db = readLocalDb();

    // 1. Direct match on active token
    const directMatch = db.sessions.find((s) => s.refresh_token_hash === hash);
    if (directMatch) {
      const device = db.devices.find((d) => d.id === directMatch.device_id);
      return { session: { ...directMatch, device }, isReplay: false };
    }

    // 2. Match on previously rotated tokens (REPLAY DETECTED)
    const replayMatch = db.sessions.find((s) => (s.previous_refresh_token_hashes || []).includes(hash));
    if (replayMatch) {
      const device = db.devices.find((d) => d.id === replayMatch.device_id);
      return { session: { ...replayMatch, device }, isReplay: true };
    }

    if (supabase) {
      const { data: active } = await supabase.from("sessions").select("*, device:devices(*)").eq("refresh_token_hash", hash).maybeSingle();
      if (active) return { session: active as Session, isReplay: false };

      const { data: replayed } = await supabase.from("sessions").select("*, device:devices(*)").contains("previous_refresh_token_hashes", [hash]).maybeSingle();
      if (replayed) return { session: replayed as Session, isReplay: true };
    }

    return null;
  },

  async updateSessionActivity(
    sessionId: string,
    updates: Partial<Pick<Session, "last_used_at" | "refresh_token_hash" | "previous_refresh_token_hashes" | "rotation_count" | "last_rotated_at" | "risk_score" | "risk_level" | "status" | "location" | "ip_address">>
  ): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from("sessions").update(updates).eq("id", sessionId);
      return !error;
    }
    const db = readLocalDb();
    const idx = db.sessions.findIndex((s) => s.id === sessionId);
    if (idx !== -1) {
      db.sessions[idx] = { ...db.sessions[idx], ...updates };
      writeLocalDb(db);
      return true;
    }
    return false;
  },

  async revokeSession(sessionId: string, userId: string): Promise<boolean> {
    const now = new Date().toISOString();
    if (supabase) {
      const { error } = await supabase
        .from("sessions")
        .update({ status: "Revoked", revoked_at: now })
        .eq("id", sessionId)
        .eq("user_id", userId);
      return !error;
    }
    const db = readLocalDb();
    const sess = db.sessions.find((s) => s.id === sessionId && s.user_id === userId);
    if (sess) {
      sess.status = "Revoked";
      sess.revoked_at = now;
      writeLocalDb(db);
      return true;
    }
    return false;
  },

  async reactivateSession(sessionId: string, userId: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase
        .from("sessions")
        .update({ status: "Active", revoked_at: null, risk_score: 10, risk_level: "LOW" })
        .eq("id", sessionId)
        .eq("user_id", userId);
      return !error;
    }
    const db = readLocalDb();
    const sess = db.sessions.find((s) => s.id === sessionId && s.user_id === userId);
    if (sess) {
      sess.status = "Active";
      sess.revoked_at = null;
      sess.risk_score = 10;
      sess.risk_level = "LOW";
      writeLocalDb(db);
      return true;
    }
    return false;
  },

  async revokeAllOtherSessions(userId: string, currentSessionId: string): Promise<number> {
    const now = new Date().toISOString();
    if (supabase) {
      const { data } = await supabase
        .from("sessions")
        .update({ status: "Revoked", revoked_at: now })
        .eq("user_id", userId)
        .neq("id", currentSessionId)
        .eq("status", "Active")
        .select();
      return data?.length || 0;
    }
    const db = readLocalDb();
    let count = 0;
    db.sessions.forEach((s) => {
      if (s.user_id === userId && s.id !== currentSessionId && s.status === "Active") {
        s.status = "Revoked";
        s.revoked_at = now;
        count++;
      }
    });
    writeLocalDb(db);
    return count;
  },

  // ----------------------------------------------------
  // SECURITY EVENTS & AUDIT LOGS
  // ----------------------------------------------------
  async createSecurityEvent(event: Omit<SecurityEvent, "id" | "created_at">): Promise<SecurityEvent> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newEvent: SecurityEvent = {
      id,
      is_simulation: event.is_simulation || false,
      ...event,
      created_at: now,
    };

    if (supabase) {
      const { data, error } = await supabase.from("security_events").insert(newEvent).select().single();
      if (!error && data) return data as SecurityEvent;
    }

    const db = readLocalDb();
    db.security_events.push(newEvent);
    writeLocalDb(db);
    return newEvent;
  },

  async getSecurityEventsByUser(userId: string, limit = 50, filterSimulation?: boolean): Promise<SecurityEvent[]> {
    if (supabase) {
      let query = supabase
        .from("security_events")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (filterSimulation !== undefined) {
        query = query.eq("is_simulation", filterSimulation);
      }

      const { data } = await query.limit(limit);
      if (data) return data as SecurityEvent[];
    }
    const db = readLocalDb();
    let events = db.security_events.filter((e) => e.user_id === userId);
    if (filterSimulation !== undefined) {
      events = events.filter((e) => (filterSimulation ? e.is_simulation === true : !e.is_simulation));
    }
    return events
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  },

  // ----------------------------------------------------
  // FAILED LOGIN TRACKING (BRUTE FORCE & SPRAY DETECTION)
  // ----------------------------------------------------
  async recordFailedLogin(email: string, ip_address: string, user_agent: string): Promise<void> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    if (supabase) {
      try {
        await supabase.from("failed_logins").insert({ id, email: email.toLowerCase().trim(), ip_address, user_agent, attempted_at: now });
      } catch {}
    }
    const db = readLocalDb();
    if (!db.failed_logins) db.failed_logins = [];
    db.failed_logins.push({ id, email: email.toLowerCase().trim(), ip_address, user_agent, attempted_at: now });
    // Keep only last 1000 failed logins in local storage to prevent bloating
    if (db.failed_logins.length > 1000) {
      db.failed_logins = db.failed_logins.slice(-1000);
    }
    writeLocalDb(db);
  },

  async getRecentFailedLoginsCount(email: string, windowMinutes = 30): Promise<number> {
    const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
    if (supabase) {
      try {
        const { count } = await supabase
          .from("failed_logins")
          .select("*", { count: "exact", head: true })
          .eq("email", email.toLowerCase().trim())
          .gte("attempted_at", cutoff);
        return count || 0;
      } catch {}
    }
    const db = readLocalDb();
    if (!db.failed_logins) return 0;
    return db.failed_logins.filter((f) => f.email === email.toLowerCase().trim() && f.attempted_at >= cutoff).length;
  },

  // ----------------------------------------------------
  // ALERTS
  // ----------------------------------------------------
  async createAlert(alert: Omit<Alert, "id" | "created_at" | "read" | "resolved">): Promise<Alert> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newAlert: Alert = {
      id,
      is_simulation: alert.is_simulation || false,
      ...alert,
      read: false,
      resolved: false,
      created_at: now,
    };

    if (supabase) {
      const { data, error } = await supabase.from("alerts").insert(newAlert).select().single();
      if (!error && data) return data as Alert;
    }

    const db = readLocalDb();
    db.alerts.push(newAlert);
    writeLocalDb(db);
    return newAlert;
  },

  async getAlertsByUser(userId: string, filterSimulation?: boolean): Promise<Alert[]> {
    if (supabase) {
      let query = supabase.from("alerts").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      if (filterSimulation !== undefined) {
        query = query.eq("is_simulation", filterSimulation);
      }
      const { data } = await query;
      if (data) return data as Alert[];
    }
    const db = readLocalDb();
    let list = db.alerts.filter((a) => a.user_id === userId);
    if (filterSimulation !== undefined) {
      list = list.filter((a) => (filterSimulation ? a.is_simulation === true : !a.is_simulation));
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async updateAlertStatus(userId: string, alertId: string, updates: { read?: boolean; resolved?: boolean }): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from("alerts").update(updates).eq("id", alertId).eq("user_id", userId);
      return !error;
    }
    const db = readLocalDb();
    const al = db.alerts.find((a) => a.id === alertId && a.user_id === userId);
    if (al) {
      if (updates.read !== undefined) al.read = updates.read;
      if (updates.resolved !== undefined) al.resolved = updates.resolved;
      writeLocalDb(db);
      return true;
    }
    return false;
  },
};

