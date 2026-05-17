/* =============================================================
   T-Video Media Demo - Shared App Script
   - Renders sidebar/topbar for dashboard pages
   - Hides the Admin link unless the demo admin is unlocked
   - Applies the saved theme to <html>
   - Provides modal + toast helpers
   All interactions are local demo only.
   ============================================================= */

(function () {
  // Apply theme as early as possible so the page does not flash.
  try {
    const raw = JSON.parse(localStorage.getItem("tvmd_state") || "null");
    const theme = (raw && raw.preferences && raw.preferences.theme) || "dark";
    document.documentElement.setAttribute("data-theme", theme);
  } catch {}

  const NAV = [
    { href: "dashboard.html",     icon: "\uD83C\uDFE0", label: "Home" },
    { href: "tasks.html",         icon: "\uD83C\uDFAC", label: "Video tasks" },
    { href: "vip.html",           icon: "\uD83D\uDC51", label: "VIP packages" },
    { href: "recharge.html",      icon: "\uD83D\uDCB3", label: "Recharge" },
    { href: "withdraw.html",      icon: "\uD83D\uDCB8", label: "Withdraw" },
    { href: "invite.html",        icon: "\uD83E\uDD1D", label: "Invite" },
    { href: "team.html",          icon: "\uD83D\uDC65", label: "Team" },
    { href: "transactions.html",  icon: "\uD83D\uDCDC", label: "Transactions" },
    { href: "messages.html",      icon: "\uD83D\uDD14", label: "Messages" },
    { href: "support.html",       icon: "\uD83D\uDCAC", label: "Support" },
    { href: "scam-analysis.html", icon: "\uD83D\uDEE1\uFE0F", label: "Scam analysis" },
    { href: "settings.html",      icon: "\u2699\uFE0F",  label: "Settings" },
    { href: "admin.html",         icon: "\uD83E\uDDEA", label: "Admin", adminOnly: true },
  ];

  const BOTTOM = [
    { href: "dashboard.html", icon: "\uD83C\uDFE0", label: "Home" },
    { href: "tasks.html",     icon: "\uD83C\uDFAC", label: "Tasks" },
    { href: "vip.html",       icon: "\uD83D\uDC51", label: "VIP" },
    { href: "invite.html",    icon: "\uD83E\uDD1D", label: "Invite" },
    { href: "settings.html",  icon: "\u2699\uFE0F", label: "Me" },
  ];

  function currentPage() {
    return location.pathname.split("/").pop() || "dashboard.html";
  }

  function navItems() {
    // Hide admin-only items unless the user has unlocked the admin gate
    // OR they are currently on the admin page (so they see the active link).
    return NAV.filter(n => !n.adminOnly || DEMO.isAdmin || currentPage() === n.href);
  }

  function renderShell(pageTitle) {
    const page = currentPage();

    // .sidebar-backdrop must live OUTSIDE .app or it occupies a grid cell
    // on desktop and pushes .main offscreen.
    const sidebarHtml = `
      <aside class="sidebar" id="sidebar">
        <a href="dashboard.html" class="brand">
          <span class="brand-mark">T</span>
          <span>T-Video Media <small class="muted" style="font-size:10px;display:block;">Educational demo</small></span>
        </a>
        <nav>
          ${navItems().map(n => `
            <a class="nav-link ${n.href === page ? "active" : ""}" href="${n.href}">
              <span class="ico">${n.icon}</span><span>${n.label}</span>
            </a>`).join("")}
          <a class="nav-link" href="index.html" id="logoutLink">
            <span class="ico">\uD83D\uDEAA</span><span>Logout</span>
          </a>
        </nav>
      </aside>
    `;
    const topbarHtml = `
      <header class="topbar">
        <button class="menu-btn" id="menuBtn" aria-label="Open menu">&#9776;</button>
        <div class="title">${pageTitle || ""}</div>
        <div class="spacer"></div>
        <span class="badge badge-warning" title="Educational demo only">DEMO</span>
        <a href="messages.html" class="btn btn-sm btn-ghost" title="Notifications">\uD83D\uDD14</a>
        <a href="settings.html" class="btn btn-sm btn-ghost" title="Settings">\u2699\uFE0F</a>
      </header>
    `;
    const bottomHtml = `
      <nav class="bottom-nav">
        <div class="row">
          ${BOTTOM.map(n => `
            <a href="${n.href}" class="${n.href === page ? "active" : ""}">
              <span class="ico">${n.icon}</span><span>${n.label}</span>
            </a>`).join("")}
        </div>
      </nav>
    `;

    const root = document.getElementById("appRoot");
    if (!root) return;
    const tpl = document.getElementById("pageContent");
    const contentHtml = tpl ? tpl.innerHTML : "";

    root.innerHTML = `
      <div class="app">
        ${sidebarHtml}
        <div class="main">
          ${topbarHtml}
          <div class="content">
            ${contentHtml}
          </div>
        </div>
      </div>
      <div class="sidebar-backdrop" id="sbBackdrop"></div>
      ${bottomHtml}
      <div class="modal-backdrop" id="modal">
        <div class="modal" role="dialog" aria-modal="true">
          <h3 id="modalTitle">Demo notice</h3>
          <div class="body" id="modalBody"></div>
          <div class="actions">
            <button class="btn" id="modalClose">Close</button>
            <button class="btn btn-primary hidden" id="modalConfirm">OK</button>
          </div>
        </div>
      </div>
      <div class="toast" id="toast"></div>
    `;

    const sb = document.getElementById("sidebar");
    const bd = document.getElementById("sbBackdrop");
    const mb = document.getElementById("menuBtn");
    if (mb) mb.addEventListener("click", () => { sb.classList.add("open"); bd.classList.add("open"); });
    if (bd) bd.addEventListener("click", () => { sb.classList.remove("open"); bd.classList.remove("open"); });

    const logout = document.getElementById("logoutLink");
    if (logout) logout.addEventListener("click", (e) => {
      e.preventDefault();
      DEMO.api.lockAdmin();
      location.href = "index.html";
    });

    document.getElementById("modalClose").addEventListener("click", closeModal);
    document.getElementById("modal").addEventListener("click", (e) => {
      if (e.target.id === "modal") closeModal();
    });
  }

  function openModal(title, bodyHtml, opts = {}) {
    const m = document.getElementById("modal");
    document.getElementById("modalTitle").textContent = title || "Demo notice";
    document.getElementById("modalBody").innerHTML = bodyHtml || "";
    const confirmBtn = document.getElementById("modalConfirm");
    if (opts.confirmText) {
      confirmBtn.classList.remove("hidden");
      confirmBtn.textContent = opts.confirmText;
      confirmBtn.onclick = () => { closeModal(); opts.onConfirm && opts.onConfirm(); };
    } else {
      confirmBtn.classList.add("hidden");
      confirmBtn.onclick = null;
    }
    m.classList.add("open");
  }
  function closeModal() {
    const m = document.getElementById("modal");
    if (m) m.classList.remove("open");
  }
  function toast(msg) {
    const t = document.getElementById("toast");
    if (!t) return alert(msg);
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("show"), 1800);
  }
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme || "dark");
  }

  window.UI = { renderShell, openModal, closeModal, toast, applyTheme };
})();
