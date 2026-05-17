/* =============================================================
   T-Video Media Demo - Shared App Script
   - Renders sidebar/topbar for dashboard pages
   - Provides modal + toast helpers
   - All interactions are local demo only
   ============================================================= */

(function () {
  // ---------- Sidebar definition ----------
  const NAV = [
    { href: "dashboard.html",     icon: "🏠", label: "Home" },
    { href: "tasks.html",         icon: "🎬", label: "Video Tasks" },
    { href: "vip.html",           icon: "👑", label: "VIP Levels" },
    { href: "recharge.html",      icon: "💳", label: "Recharge" },
    { href: "withdraw.html",      icon: "💸", label: "Withdraw" },
    { href: "invite.html",        icon: "🤝", label: "Invite" },
    { href: "team.html",          icon: "👥", label: "Team" },
    { href: "transactions.html",  icon: "📜", label: "Transaction History" },
    { href: "messages.html",      icon: "🔔", label: "Messages" },
    { href: "support.html",       icon: "💬", label: "Support" },
    { href: "scam-analysis.html", icon: "🛡️", label: "Scam Analysis" },
    { href: "settings.html",      icon: "⚙️", label: "Settings" },
    { href: "admin.html",         icon: "🧪", label: "Admin Demo" },
  ];

  // Bottom nav (mobile) - keep to 5 items
  const BOTTOM = [
    { href: "dashboard.html",     icon: "🏠", label: "Home" },
    { href: "tasks.html",         icon: "🎬", label: "Tasks" },
    { href: "vip.html",           icon: "👑", label: "VIP" },
    { href: "invite.html",        icon: "🤝", label: "Invite" },
    { href: "settings.html",      icon: "⚙️", label: "Me" },
  ];

  function currentPage() {
    const p = location.pathname.split("/").pop() || "dashboard.html";
    return p;
  }

  function renderShell(pageTitle) {
    const page = currentPage();
    const sidebarHtml = `
      <aside class="sidebar" id="sidebar">
        <a href="dashboard.html" class="brand">
          <span class="brand-mark">T</span>
          <span>T-Video Media <small class="muted" style="font-size:10px;display:block;">Educational Demo</small></span>
        </a>
        <nav>
          ${NAV.map(n => `
            <a class="nav-link ${n.href === page ? "active" : ""}" href="${n.href}">
              <span class="ico">${n.icon}</span><span>${n.label}</span>
            </a>`).join("")}
          <a class="nav-link" href="index.html" id="logoutLink">
            <span class="ico">🚪</span><span>Logout</span>
          </a>
        </nav>
      </aside>
      <div class="sidebar-backdrop" id="sbBackdrop"></div>
    `;
    const topbarHtml = `
      <header class="topbar">
        <button class="menu-btn" id="menuBtn" aria-label="Open menu">☰</button>
        <div class="title">${pageTitle || ""}</div>
        <div class="spacer"></div>
        <span class="badge badge-warning" title="Educational demo only">DEMO</span>
        <a href="messages.html" class="btn btn-sm btn-ghost" title="Notifications">🔔</a>
        <a href="settings.html" class="btn btn-sm btn-ghost" title="Settings">⚙️</a>
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
    const contentTemplate = document.getElementById("pageContent");
    const contentHtml = contentTemplate ? contentTemplate.innerHTML : "";

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

    // Wire up menu toggle
    const sb = document.getElementById("sidebar");
    const bd = document.getElementById("sbBackdrop");
    const mb = document.getElementById("menuBtn");
    if (mb) mb.addEventListener("click", () => { sb.classList.add("open"); bd.classList.add("open"); });
    if (bd) bd.addEventListener("click", () => { sb.classList.remove("open"); bd.classList.remove("open"); });

    // Logout demo: clear demo state and return to landing
    const logout = document.getElementById("logoutLink");
    if (logout) logout.addEventListener("click", (e) => {
      e.preventDefault();
      DEMO.resetUser();
      location.href = "index.html";
    });

    // Modal close
    document.getElementById("modalClose").addEventListener("click", closeModal);
    document.getElementById("modal").addEventListener("click", (e) => {
      if (e.target.id === "modal") closeModal();
    });
  }

  // ---------- Modal & Toast ----------
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

  // Expose helpers
  window.UI = { renderShell, openModal, closeModal, toast };
})();
