// =============================================================
// VidLog - Cloudflare Worker API
// Static assets are served by env.ASSETS (binding to /public).
// API routes live under /api/*.
// =============================================================

const SESSION_COOKIE = "vidlog_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days
const PBKDF2_ITERATIONS = 200_000;

// ---------- small helpers ----------
const json = (data, status = 200, extraHeaders = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...extraHeaders },
  });
const ok = (data) => json({ ok: true, data });
const err = (msg, status = 400) => json({ ok: false, error: msg }, status);

const isEmail = (s) => typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254;
const trim = (s, max = 1000) => (typeof s === "string" ? s.trim().slice(0, max) : "");

// uuid v4 (Web Crypto)
const uuid = () => crypto.randomUUID();

// Base64url
function b64urlFromBytes(bytes) {
  let s = btoa(String.fromCharCode(...bytes));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlToBytes(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function b64urlFromString(s) {
  return b64urlFromBytes(new TextEncoder().encode(s));
}
function stringFromB64url(s) {
  return new TextDecoder().decode(b64urlToBytes(s));
}

// ---------- password hashing (PBKDF2-SHA256) ----------
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS },
    key,
    256
  );
  return `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${b64urlFromBytes(salt)}$${b64urlFromBytes(new Uint8Array(bits))}`;
}

async function verifyPassword(password, stored) {
  if (typeof stored !== "string") return false;
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2-sha256") return false;
  const iter = parseInt(parts[1], 10);
  const salt = b64urlToBytes(parts[2]);
  const expected = b64urlToBytes(parts[3]);
  if (!Number.isFinite(iter) || iter < 1) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: iter },
    key,
    expected.length * 8
  );
  const got = new Uint8Array(bits);
  if (got.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got[i] ^ expected[i];
  return diff === 0;
}

// ---------- session token (HMAC-SHA256 signed cookie) ----------
async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signSession(payload, secret) {
  const body = b64urlFromString(JSON.stringify(payload));
  const key = await hmacKey(secret);
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const sig = b64urlFromBytes(new Uint8Array(sigBuf));
  return `${body}.${sig}`;
}

async function verifySession(token, secret) {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const key = await hmacKey(secret);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    b64urlToBytes(sig),
    new TextEncoder().encode(body)
  );
  if (!valid) return null;
  let payload;
  try { payload = JSON.parse(stringFromB64url(body)); } catch { return null; }
  if (!payload || typeof payload !== "object") return null;
  if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function setSessionCookie(value, maxAge) {
  const attrs = [
    `${SESSION_COOKIE}=${value}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  return attrs.join("; ");
}
function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function readCookie(req, name) {
  const header = req.headers.get("Cookie") || "";
  for (const part of header.split(/;\s*/)) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq) === name) return part.slice(eq + 1);
  }
  return null;
}

// ---------- DB helpers ----------
function userPublic(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    created_at: row.created_at,
  };
}

async function getUserById(env, id) {
  return env.DB.prepare(
    "SELECT id, email, name, role, password_hash, created_at FROM users WHERE id = ?"
  ).bind(id).first();
}

async function getUserByEmail(env, email) {
  return env.DB.prepare(
    "SELECT id, email, name, role, password_hash, created_at FROM users WHERE email = ?"
  ).bind(email).first();
}

async function authenticate(req, env) {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token) return null;
  const payload = await verifySession(token, env.JWT_SECRET || "dev-insecure-secret");
  if (!payload || !payload.uid) return null;
  return getUserById(env, payload.uid);
}

async function makeSession(env, userId) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  return signSession({ uid: userId, exp }, env.JWT_SECRET || "dev-insecure-secret");
}

// ---------- request body ----------
async function readJson(req) {
  if ((req.headers.get("Content-Type") || "").includes("application/json")) {
    try { return await req.json(); } catch { return null; }
  }
  return null;
}

// ---------- routes: auth ----------
async function handleRegister(req, env) {
  const body = await readJson(req);
  if (!body) return err("Invalid request body");
  const name = trim(body.name, 40);
  const email = trim(body.email, 254).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  if (name.length < 2) return err("Display name must be at least 2 characters.");
  if (!isEmail(email)) return err("Enter a valid email address.");
  if (password.length < 8) return err("Password must be at least 8 characters.");
  if (password.length > 200) return err("Password is too long.");

  const existing = await getUserByEmail(env, email);
  if (existing) return err("An account with this email already exists.", 409);

  // First user becomes admin so the project is usable out of the box.
  const userCountRow = await env.DB.prepare("SELECT COUNT(*) AS n FROM users").first();
  const role = (userCountRow && userCountRow.n === 0) ? "admin" : "user";

  const hash = await hashPassword(password);
  const id = uuid();
  const now = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO users (id, email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(id, email, name, hash, role, now).run();

  const token = await makeSession(env, id);
  return new Response(
    JSON.stringify({ ok: true, data: { id, email, name, role, created_at: now } }),
    {
      status: 201,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Set-Cookie": setSessionCookie(token, SESSION_TTL_SECONDS),
      },
    }
  );
}

async function handleLogin(req, env) {
  const body = await readJson(req);
  if (!body) return err("Invalid request body");
  const email = trim(body.email, 254).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) return err("Email and password are required.");

  const user = await getUserByEmail(env, email);
  // Always verify against something to keep timing similar.
  const dummy = "pbkdf2-sha256$200000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  const match = await verifyPassword(password, user ? user.password_hash : dummy);
  if (!user || !match) return err("Invalid email or password.", 401);

  const token = await makeSession(env, user.id);
  return new Response(
    JSON.stringify({ ok: true, data: userPublic(user) }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Set-Cookie": setSessionCookie(token, SESSION_TTL_SECONDS),
      },
    }
  );
}

function handleLogout() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": clearSessionCookie(),
    },
  });
}

async function handleMe(req, env) {
  const u = await authenticate(req, env);
  if (!u) return err("Not authenticated", 401);
  return ok(userPublic(u));
}

// ---------- routes: profile ----------
async function handleProfileUpdate(req, env, user) {
  const body = await readJson(req);
  if (!body) return err("Invalid request body");
  const name = trim(body.name, 40);
  const email = trim(body.email, 254).toLowerCase();
  if (name.length < 2) return err("Display name must be at least 2 characters.");
  if (!isEmail(email)) return err("Enter a valid email address.");

  if (email !== user.email) {
    const conflict = await getUserByEmail(env, email);
    if (conflict && conflict.id !== user.id) return err("That email is already in use.", 409);
  }
  await env.DB.prepare("UPDATE users SET name = ?, email = ? WHERE id = ?")
    .bind(name, email, user.id).run();
  return ok({ id: user.id, name, email, role: user.role });
}

async function handlePasswordChange(req, env, user) {
  const body = await readJson(req);
  if (!body) return err("Invalid request body");
  const current = typeof body.current_password === "string" ? body.current_password : "";
  const next    = typeof body.new_password === "string" ? body.new_password : "";
  if (next.length < 8) return err("New password must be at least 8 characters.");
  if (next.length > 200) return err("New password is too long.");
  const matches = await verifyPassword(current, user.password_hash);
  if (!matches) return err("Current password is incorrect.", 401);
  const hash = await hashPassword(next);
  await env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?")
    .bind(hash, user.id).run();
  return ok({ updated: true });
}

async function handleProfileDelete(req, env, user) {
  const body = await readJson(req);
  const password = body && typeof body.password === "string" ? body.password : "";
  const matches = await verifyPassword(password, user.password_hash);
  if (!matches) return err("Password is incorrect.", 401);
  // Cascading deletes are handled by foreign keys (ON DELETE CASCADE).
  await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(user.id).run();
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": clearSessionCookie(),
    },
  });
}

// ---------- routes: videos ----------
function parseTags(s) {
  if (!s) return [];
  try {
    const arr = JSON.parse(s);
    return Array.isArray(arr) ? arr.filter(t => typeof t === "string") : [];
  } catch { return []; }
}

async function handleListVideos(_req, env, user) {
  const rows = (await env.DB.prepare(`
    SELECT v.id, v.title, v.description, v.url, v.duration_seconds, v.tags, v.added_at,
           wl.progress_seconds, wl.watched, wl.note, wl.watched_at
    FROM videos v
    LEFT JOIN watch_log wl ON wl.video_id = v.id AND wl.user_id = ?
    ORDER BY v.added_at DESC
  `).bind(user.id).all()).results || [];

  const data = rows.map(r => ({
    id: r.id,
    title: r.title,
    description: r.description,
    url: r.url,
    duration_seconds: r.duration_seconds,
    tags: parseTags(r.tags),
    added_at: r.added_at,
    progress_seconds: r.progress_seconds || 0,
    duration_seconds_logged: r.duration_seconds,
    watched: r.watched ? 1 : 0,
    note: r.note || "",
    watched_at: r.watched_at,
  }));
  return ok(data);
}

async function handleWatchProgress(req, env, user, videoId) {
  const body = await readJson(req);
  if (!body) return err("Invalid request body");
  const v = await env.DB.prepare("SELECT id, duration_seconds FROM videos WHERE id = ?")
    .bind(videoId).first();
  if (!v) return err("Video not found.", 404);

  const progress = Math.max(0, parseInt(body.progress_seconds, 10) || 0);
  const duration = Math.max(0, parseInt(body.duration_seconds, 10) || v.duration_seconds || 0);
  const watched = body.watched ? 1 : 0;
  const now = new Date().toISOString();

  const existing = await env.DB.prepare(
    "SELECT user_id FROM watch_log WHERE user_id = ? AND video_id = ?"
  ).bind(user.id, videoId).first();

  if (existing) {
    // Don't let an explicit "watched" be unset by a later progress ping.
    await env.DB.prepare(`
      UPDATE watch_log
      SET progress_seconds = ?, watched = MAX(watched, ?), watched_at = ?
      WHERE user_id = ? AND video_id = ?
    `).bind(progress, watched, now, user.id, videoId).run();
  } else {
    await env.DB.prepare(`
      INSERT INTO watch_log (user_id, video_id, progress_seconds, watched, note, watched_at)
      VALUES (?, ?, ?, ?, '', ?)
    `).bind(user.id, videoId, progress, watched, now).run();
  }

  // Sync video duration if the player learned it and we didn't have it.
  if (duration > 0 && (!v.duration_seconds || v.duration_seconds === 0)) {
    await env.DB.prepare("UPDATE videos SET duration_seconds = ? WHERE id = ?")
      .bind(duration, videoId).run();
  }

  return ok({ saved: true });
}

async function handleSaveNote(req, env, user, videoId) {
  const body = await readJson(req);
  const note = trim(body && body.note, 2000);
  const v = await env.DB.prepare("SELECT id FROM videos WHERE id = ?").bind(videoId).first();
  if (!v) return err("Video not found.", 404);
  const now = new Date().toISOString();
  const existing = await env.DB.prepare(
    "SELECT user_id FROM watch_log WHERE user_id = ? AND video_id = ?"
  ).bind(user.id, videoId).first();
  if (existing) {
    await env.DB.prepare(
      "UPDATE watch_log SET note = ?, watched_at = ? WHERE user_id = ? AND video_id = ?"
    ).bind(note, now, user.id, videoId).run();
  } else {
    await env.DB.prepare(
      "INSERT INTO watch_log (user_id, video_id, progress_seconds, watched, note, watched_at) VALUES (?, ?, 0, 0, ?, ?)"
    ).bind(user.id, videoId, note, now).run();
  }
  return ok({ saved: true });
}

// ---------- routes: dashboard ----------
async function handleDashboard(_req, env, user) {
  const stats = await env.DB.prepare(`
    SELECT
      (SELECT COUNT(*) FROM videos) AS library,
      (SELECT COUNT(*) FROM watch_log WHERE user_id = ? AND watched = 1) AS watched,
      (SELECT COUNT(*) FROM watch_log WHERE user_id = ? AND watched = 0 AND progress_seconds > 0) AS in_progress,
      (SELECT COALESCE(SUM(progress_seconds), 0) FROM watch_log WHERE user_id = ?) AS total_seconds_watched
  `).bind(user.id, user.id, user.id).first();

  const continueRows = (await env.DB.prepare(`
    SELECT v.id, v.title, v.duration_seconds, v.url,
           wl.progress_seconds, wl.watched_at
    FROM watch_log wl JOIN videos v ON v.id = wl.video_id
    WHERE wl.user_id = ? AND wl.watched = 0 AND wl.progress_seconds > 0
    ORDER BY wl.watched_at DESC
    LIMIT 6
  `).bind(user.id).all()).results || [];

  const recentRows = (await env.DB.prepare(`
    SELECT v.id AS video_id, v.title, v.duration_seconds,
           wl.progress_seconds, wl.watched, wl.watched_at
    FROM watch_log wl JOIN videos v ON v.id = wl.video_id
    WHERE wl.user_id = ?
    ORDER BY wl.watched_at DESC
    LIMIT 8
  `).bind(user.id).all()).results || [];

  const announceRows = (await env.DB.prepare(`
    SELECT id, tag, title, body, published_at
    FROM announcements ORDER BY published_at DESC LIMIT 3
  `).all()).results || [];

  return ok({
    stats: {
      library:               stats?.library || 0,
      watched:               stats?.watched || 0,
      in_progress:           stats?.in_progress || 0,
      total_seconds_watched: stats?.total_seconds_watched || 0,
    },
    continue_watching: continueRows,
    recent: recentRows,
    announcements: announceRows,
  });
}

// ---------- routes: announcements (read) ----------
async function listAnnouncements(env) {
  const rows = (await env.DB.prepare(`
    SELECT id, tag, title, body, published_at
    FROM announcements ORDER BY published_at DESC LIMIT 50
  `).all()).results || [];
  return ok(rows);
}

// ---------- routes: feedback ----------
async function handleFeedback(req, env, user) {
  const body = await readJson(req);
  const subject = trim(body && body.subject, 120);
  const message = trim(body && body.message, 2000);
  if (!subject || !message) return err("Subject and message are required.");
  await env.DB.prepare(
    "INSERT INTO feedback (id, user_id, subject, message, created_at) VALUES (?, ?, ?, ?, ?)"
  ).bind(uuid(), user.id, subject, message, new Date().toISOString()).run();
  return ok({ received: true });
}

// ---------- routes: admin ----------
function requireAdmin(user) {
  return user && user.role === "admin";
}

async function handleAdminStats(_req, env) {
  const r = await env.DB.prepare(`
    SELECT
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM videos) AS videos,
      (SELECT COUNT(*) FROM watch_log WHERE watched_at >= datetime('now','-7 days')) AS watches_7d,
      (SELECT COUNT(*) FROM announcements) AS announcements
  `).first();
  return ok({
    users: r?.users || 0,
    videos: r?.videos || 0,
    watches_7d: r?.watches_7d || 0,
    announcements: r?.announcements || 0,
  });
}

async function handleAdminUsers(_req, env) {
  const rows = (await env.DB.prepare(
    "SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC LIMIT 200"
  ).all()).results || [];
  return ok(rows);
}

async function handleAdminCreateVideo(req, env) {
  const body = await readJson(req);
  if (!body) return err("Invalid request body");
  const title = trim(body.title, 120);
  const url   = trim(body.url, 2000);
  const description = trim(body.description, 500);
  const duration_seconds = parseInt(body.duration_seconds, 10) || 0;
  const tags = Array.isArray(body.tags)
    ? body.tags.map(t => trim(t, 32)).filter(Boolean).slice(0, 12)
    : [];
  if (!title) return err("Title is required.");
  if (!/^https?:\/\//.test(url)) return err("URL must start with http(s)://");

  const id = uuid();
  await env.DB.prepare(`
    INSERT INTO videos (id, title, description, url, duration_seconds, tags, added_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, title, description, url, duration_seconds, JSON.stringify(tags), new Date().toISOString()).run();
  return ok({ id });
}

async function handleAdminDeleteVideo(_req, env, _user, videoId) {
  const r = await env.DB.prepare("DELETE FROM videos WHERE id = ?").bind(videoId).run();
  if (!r.success) return err("Could not delete.");
  return ok({ deleted: true });
}

async function handleAdminCreateAnnouncement(req, env) {
  const body = await readJson(req);
  if (!body) return err("Invalid request body");
  const title = trim(body.title, 120);
  const text  = trim(body.body, 2000);
  const tag   = trim(body.tag, 16) || "Notice";
  if (!title || !text) return err("Title and body are required.");
  const id = uuid();
  await env.DB.prepare(
    "INSERT INTO announcements (id, tag, title, body, published_at) VALUES (?, ?, ?, ?, ?)"
  ).bind(id, tag, title, text, new Date().toISOString()).run();
  return ok({ id });
}

// ---------- main router ----------
export default {
  async fetch(request, env, _ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();

    if (!path.startsWith("/api/")) {
      // Static asset (HTML, CSS, JS, etc.) served from /public via the
      // [assets] binding in wrangler.jsonc.
      return env.ASSETS.fetch(request);
    }

    try {
      // ---- public auth endpoints ----
      if (path === "/api/auth/register" && method === "POST") return handleRegister(request, env);
      if (path === "/api/auth/login"    && method === "POST") return handleLogin(request, env);
      if (path === "/api/auth/logout"   && method === "POST") return handleLogout();
      if (path === "/api/auth/me"       && method === "GET")  return handleMe(request, env);

      // Authenticated endpoints below
      const user = await authenticate(request, env);
      if (!user) return err("Not authenticated", 401);

      if (path === "/api/dashboard"     && method === "GET")    return handleDashboard(request, env, user);
      if (path === "/api/announcements" && method === "GET")    return listAnnouncements(env);
      if (path === "/api/feedback"      && method === "POST")   return handleFeedback(request, env, user);
      if (path === "/api/videos"        && method === "GET")    return handleListVideos(request, env, user);
      if (path === "/api/profile"       && method === "PUT")    return handleProfileUpdate(request, env, user);
      if (path === "/api/profile"       && method === "DELETE") return handleProfileDelete(request, env, user);
      if (path === "/api/profile/password" && method === "POST") return handlePasswordChange(request, env, user);

      // /api/videos/:id/watch  and  /api/videos/:id/note
      const watchMatch = path.match(/^\/api\/videos\/([^/]+)\/(watch|note)$/);
      if (watchMatch && method === "POST") {
        const [, vid, action] = watchMatch;
        if (action === "watch") return handleWatchProgress(request, env, user, vid);
        if (action === "note")  return handleSaveNote(request, env, user, vid);
      }

      // ---- admin ----
      if (path.startsWith("/api/admin/")) {
        if (!requireAdmin(user)) return err("Admin access required", 403);
        if (path === "/api/admin/stats" && method === "GET")  return handleAdminStats(request, env);
        if (path === "/api/admin/users" && method === "GET")  return handleAdminUsers(request, env);
        if (path === "/api/admin/videos" && method === "POST") return handleAdminCreateVideo(request, env);
        if (path === "/api/admin/announcements" && method === "POST") return handleAdminCreateAnnouncement(request, env);
        const adminVid = path.match(/^\/api\/admin\/videos\/([^/]+)$/);
        if (adminVid && method === "DELETE") return handleAdminDeleteVideo(request, env, user, adminVid[1]);
      }

      return err("Not found", 404);
    } catch (e) {
      console.error("API error:", e && e.stack ? e.stack : e);
      return err("Internal error", 500);
    }
  },
};
