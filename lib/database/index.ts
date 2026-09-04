import fs from "fs";
import path from "path";
import { User, Device, Session, SecurityEvent, Alert } from "../types";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Optional remote Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
      };
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initial, null, 2));
      return initial;
    }
    const data = fs.readFileSync(DB_FILE_PATH, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return {
      users: [],
      devices: [],
      sessions: [],
      security_events: [],
      alerts: [],
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
  // SESSIONS
  // ----------------------------------------------------
  async createSession(session: Omit<Session, "id" | "created_at" | "last_used_at">): Promise<Session> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newSession: Session = {
      id,
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

  async findSessionByRefreshTokenHash(hash: string): Promise<Session | null> {
    if (supabase) {
      const { data } = await supabase.from("sessions").select("*, device:devices(*)").eq("refresh_token_hash", hash).maybeSingle();
      if (data) return data as Session;
    }
    const db = readLocalDb();
    const sess = db.sessions.find((s) => s.refresh_token_hash === hash);
    if (!sess) return null;
    const device = db.devices.find((d) => d.id === sess.device_id);
    return { ...sess, device };
  },

  async updateSessionActivity(
    sessionId: string,
    updates: Partial<Pick<Session, "last_used_at" | "refresh_token_hash" | "risk_score" | "risk_level" | "status" | "location" | "ip_address">>
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

  async getSecurityEventsByUser(userId: string, limit = 50): Promise<SecurityEvent[]> {
    if (supabase) {
      const { data } = await supabase
        .from("security_events")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (data) return data as SecurityEvent[];
    }
    const db = readLocalDb();
    return db.security_events
      .filter((e) => e.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  },

  // ----------------------------------------------------
  // ALERTS
  // ----------------------------------------------------
  async createAlert(alert: Omit<Alert, "id" | "created_at" | "read" | "resolved">): Promise<Alert> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newAlert: Alert = {
      id,
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

  async getAlertsByUser(userId: string): Promise<Alert[]> {
    if (supabase) {
      const { data } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (data) return data as Alert[];
    }
    const db = readLocalDb();
    return db.alerts
      .filter((a) => a.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
