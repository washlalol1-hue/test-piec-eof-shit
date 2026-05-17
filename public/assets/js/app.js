/* =============================================================
   VidLog - shared dashboard shell
   Renders the sidebar/topbar/bottom-nav and provides modal + toast
   helpers. Pages assemble their own content inside <template id="pageContent">.
   ============================================================= */
(function () {
  const NAV = [
    { href: "/dashboard.html", icon: "\u{1F3E0}", label: "Home" },
    { href: "/videos.html",    icon: "\u{1F3AC}", label: "Library" },
    { href: "/messages.html",  icon: "\u{1F514}", label: "Messages" },
    { href: "/support.html",   icon: "\u{1F4AC}", label: "Help" },
    { href: "/settings.html",  icon: "\u{2699}",  label: "Settings" },
  ];

  const ADMIN_NAV = { href: "/admin.html", icon: "\u{1F6E0}", label: "Admin" };

  const BOTTOM = [
    { href: "/dashboard.html", icon: "\u{1F3E0}", label: "Home" },
    { href: "/videos.html",    icon: "\u{1F3AC}", label: "Library" },
    { href: "/messages.html",  icon: "\u{1F514}", label: "Messages" },
    { href: "/settings.html",  icon: "\u{2699}",  label: "Me" },
  ];

  function currentPath() {
    return location.pathname || "/";
  }

  function isActive(href) {
    const cur = currentPath();
    if (href === "/dashboard.html") return cur === "/" || cur === "/dashboard.html";
    return cur === href;
  }

  function renderShell(pageTitle) {
    const root = document.getElementById("appRoot");
    if (!root) return;
    const tpl = document.getElementById("pageContent");
    const contentHtml = tpl ? tpl.innerHTML : "";

    // Build nav, then refresh once we know the user role.
    const nav = NAV.slice();

    const sidebarHtml = `
      <aside class="sidebar" id="sidebar">
        <a href="/dashboard.html" class="brand">
          <span class="brand-mark">V</span>
          <span>VidLog</span>
        </a>
        <nav id="sidebarNav">
          ${nav.map(n => `
            <a class="nav-link ${isActive(n.href) ? "active" : ""}" href="${n.href}">
              <span class="ico">${n.icon}</span><span>${n.label}</span>
            </a>`).join("")}
          <a class="nav-link" href="#" id="logoutLink">
            <span class="ico">\u{1F6AA}</span><span>Log out</span>
          </a>
        </nav>
      </aside>
    `;
    const topbarHtml = `
      <header class="topbar">
        <button class="menu-btn" id="menuBtn" aria-label="Open menu">&#9776;</button>
        <div class="title">${VidLog.escape(pageTitle || "")}</div>
        <div class="spacer"></div>
        <a href="/messages.html" class="btn btn-sm btn-ghost" title="Messages">&#128276;</a>
        <a href="/settings.html" class="btn btn-sm btn-ghost" title="Settings">&#9881;</a>
      </header>
    `;
    const bottomHtml = `
      <nav class="bottom-nav">
        <div class="row">
          ${BOTTOM.map(n => `
            <a href="${n.href}" class="${isActive(n.href) ? "active" : ""}">
              <span class="ico">${n.icon}</span><span>${n.label}</span>
            </a>`).join("")}
        </div>
      </nav>
    `;

    root.innerHTML = `
      <div class="app">
        ${sidebarHtml}
        <div class="main">
          ${topbarHtml}
          <div class="content">${contentHtml}</div>
        </div>
      </div>
      <div class="sidebar-backdrop" id="sbBackdrop"></div>
      ${bottomHtml}
      <div class="modal-backdrop" id="modal">
        <div class="modal" role="dialog" aria-modal="true">
          <h3 id="modalTitle">Notice</h3>
          <div class="body" id="modalBody"></div>
          <div class="actions">
            <button class="btn" id="modalClose">Close</button>
            <button class="btn btn-primary hidden" id="modalConfirm">OK</button>
          </div>
        </div>
      </div>
      <div class="toast" id="toast"></div>
    `;

    // Wire menu drawer
    const sb = document.getElementById("sidebar");
    const bd = document.getElementById("sbBackdrop");
    const mb = document.getElementById("menuBtn");
    if (mb) mb.addEventListener("click", () => { sb.classList.add("open"); bd.classList.add("open"); });
    if (bd) bd.addEventListener("click", () => { sb.classList.remove("open"); bd.classList.remove("open"); });

    // Logout
    document.getElementById("logoutLink").addEventListener("click", async (e) => {
      e.preventDefault();
      await VidLog.logout();
      location.href = "/";
    });

    // Modal close
    document.getElementById("modalClose").addEventListener("click", closeModal);
    document.getElementById("modal").addEventListener("click", (e) => {
      if (e.target.id === "modal") closeModal();
    });

    // Inject admin nav if applicable.
    VidLog.me().then(u => {
      if (u && u.role === "admin") {
        const list = document.getElementById("sidebarNav");
        const a = document.createElement("a");
        a.className = "nav-link " + (isActive(ADMIN_NAV.href) ? "active" : "");
        a.href = ADMIN_NAV.href;
        a.innerHTML = `<span class="ico">${ADMIN_NAV.icon}</span><span>${ADMIN_NAV.label}</span>`;
        // insert before logout link
        list.insertBefore(a, document.getElementById("logoutLink"));
      }
    });
  }

  function openModal(title, bodyHtml, opts = {}) {
    const m = document.getElementById("modal");
    document.getElementById("modalTitle").textContent = title || "Notice";
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
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("show"), 1800);
  }

  window.UI = { renderShell, openModal, closeModal, toast };
})();
