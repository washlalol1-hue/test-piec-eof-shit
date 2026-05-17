/* =============================================================
   VidLog - shared client helpers
   - VidLog.api(path, { method, body }) -> { ok, status, data?, error? }
   - VidLog.me() -> user object or null (cached for the page)
   - VidLog.requireAuth() -> user or null after redirecting to /login.html
   - VidLog.logout() -> POST /api/auth/logout, clears cache
   - VidLog.applyAuthVisibility() -> toggles [data-auth-show] / [data-auth-hide]
   - VidLog.escape(str) -> safe HTML text
   ============================================================= */
(function () {
  let mePromise = null;

  async function api(path, opts = {}) {
    const init = {
      method: opts.method || "GET",
      headers: { "Accept": "application/json" },
      credentials: "same-origin",
    };
    if (opts.body !== undefined) {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(opts.body);
    }
    let res;
    try {
      res = await fetch(path, init);
    } catch (e) {
      return { ok: false, status: 0, error: "Network error" };
    }
    let data = null;
    const text = await res.text();
    if (text) {
      try { data = JSON.parse(text); } catch { data = { raw: text }; }
    }
    if (!res.ok) {
      return { ok: false, status: res.status, error: (data && data.error) || res.statusText, data };
    }
    return { ok: true, status: res.status, data: data && data.data !== undefined ? data.data : data };
  }

  function me(force) {
    if (!force && mePromise) return mePromise;
    mePromise = api("/api/auth/me").then(r => (r.ok ? r.data : null));
    return mePromise;
  }

  async function requireAuth() {
    const user = await me();
    if (!user) {
      const next = encodeURIComponent(location.pathname + location.search);
      location.replace("/login.html?next=" + next);
      return null;
    }
    return user;
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    mePromise = Promise.resolve(null);
  }

  async function applyAuthVisibility() {
    const user = await me();
    document.querySelectorAll("[data-auth-show]").forEach(el => {
      el.classList.toggle("hidden", !user);
    });
    document.querySelectorAll("[data-auth-hide]").forEach(el => {
      el.classList.toggle("hidden", !!user);
    });
  }

  function escape(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  window.VidLog = { api, me, requireAuth, logout, applyAuthVisibility, escape };
})();
