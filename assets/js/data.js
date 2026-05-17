/* =============================================================
   T-Video Media Demo - STATE STORE & STATIC CATALOG
   --------------------------------------------------------------
   Educational scam-awareness school project. All values are FAKE
   (no real money, no real backend). The store is just localStorage.

   Public API on `window.DEMO`:

   Static catalog:
     DEMO.vipTiers, DEMO.referrals, DEMO.messages, DEMO.admin

   Live state (read-only references that mutate in place):
     DEMO.user           // profile, balance, package, counters
     DEMO.transactions   // chronological tx records
     DEMO.withdrawals    // withdraw history

   Mutating API:
     DEMO.api.getActiveVip()
     DEMO.api.rewardPerTask()
     DEMO.api.generateDailyTasks()
     DEMO.api.buyPackage(level)
     DEMO.api.completeTask(id, reward)
     DEMO.api.submitWithdraw(amount, address)
     DEMO.api.setProfile({ username, email })

   Legacy compat (pre-existing pages still work):
     DEMO.saveUser(), DEMO.resetUser(), DEMO.loadUser(), DEMO.tasks
   ============================================================= */

window.DEMO = (function () {
  const KEY = "tvmd_state";
  const today = () => new Date().toISOString().slice(0, 10);
  const stamp = () => new Date().toISOString().replace("T", " ").slice(0, 16);

  // ---------- Static catalogs (immutable) -----------------------
  const vipTiers = [
    { level: 0, name: "VIP 0", price: 0,    daily: 3,  dailyIncome: 1.50,   monthlyIncome: 45,    free: true },
    { level: 1, name: "VIP 1", price: 50,   daily: 6,  dailyIncome: 4.00,   monthlyIncome: 120 },
    { level: 2, name: "VIP 2", price: 200,  daily: 10, dailyIncome: 12.00,  monthlyIncome: 360 },
    { level: 3, name: "VIP 3", price: 800,  daily: 15, dailyIncome: 35.00,  monthlyIncome: 1050 },
    { level: 4, name: "VIP 4", price: 2500, daily: 25, dailyIncome: 95.00,  monthlyIncome: 2850 },
    { level: 5, name: "VIP 5", price: 8000, daily: 40, dailyIncome: 280.00, monthlyIncome: 8400, featured: true },
  ];

  const referrals = [
    { username: "alex_demo",   joined: "2026-04-12", vip: 1, contribution: 12.50, status: "Active"   },
    { username: "sam_demo",    joined: "2026-04-18", vip: 0, contribution:  3.10, status: "Active"   },
    { username: "leo_demo",    joined: "2026-04-22", vip: 2, contribution: 41.00, status: "Active"   },
    { username: "mia_demo",    joined: "2026-04-28", vip: 0, contribution:  0.00, status: "Inactive" },
    { username: "kara_demo",   joined: "2026-05-02", vip: 1, contribution: 18.20, status: "Active"   },
    { username: "noah_demo",   joined: "2026-05-04", vip: 0, contribution:  0.40, status: "Inactive" },
    { username: "ivy_demo",    joined: "2026-05-09", vip: 1, contribution:  9.80, status: "Active"   },
    { username: "ben_demo",    joined: "2026-05-13", vip: 0, contribution:  0.00, status: "Inactive" },
  ];

  const messages = [
    { tag: "Promo",   title: "Complete more tasks to unlock higher rewards", date: "2026-05-17", body: "Reach 50 completed tasks this month for a demo bonus." },
    { tag: "VIP",     title: "VIP Upgrade Promotion - Limited Time",         date: "2026-05-16", body: "Demo notice: 20% discount on VIP upgrades this week." },
    { tag: "System",  title: "Withdrawal system maintenance",                date: "2026-05-15", body: "Withdrawals may be delayed during demo maintenance window." },
    { tag: "Invite",  title: "Invite friends to earn more demo rewards",     date: "2026-05-14", body: "Earn fake L1, L2, L3 commissions when invitees complete tasks." },
    { tag: "Alert",   title: "Verify your account to continue withdrawing",  date: "2026-05-13", body: "Educational note: this is a typical pressure tactic on real scam sites." },
  ];

  const admin = {
    totalUsers: 12480,
    totalDeposits: 482300,
    totalWithdrawals: 38120,
    pendingWithdrawals: 214,
    vipDistribution: [
      { level: "VIP 0", pct: 52 }, { level: "VIP 1", pct: 24 },
      { level: "VIP 2", pct: 12 }, { level: "VIP 3", pct: 7 },
      { level: "VIP 4", pct: 3 },  { level: "VIP 5", pct: 2 },
    ],
    weeklyTasks: [120, 180, 240, 210, 280, 330, 410],
    users: [
      { id: 1001, username: "alex_demo",  vip: 1, balance: 12.50, status: "Active" },
      { id: 1002, username: "sam_demo",   vip: 0, balance:  3.10, status: "Active" },
      { id: 1003, username: "leo_demo",   vip: 2, balance: 41.00, status: "Active" },
      { id: 1004, username: "mia_demo",   vip: 0, balance:  0.00, status: "Suspended" },
      { id: 1005, username: "kara_demo",  vip: 1, balance: 18.20, status: "Active" },
      { id: 1006, username: "noah_demo",  vip: 0, balance:  0.40, status: "Inactive" },
    ],
    pendingReview: [
      { id: "W-2031", username: "alex_demo", amount: 25.00, address: "demo-addr-****a91", date: "2026-05-16" },
      { id: "W-2030", username: "leo_demo",  amount: 50.00, address: "demo-addr-****a55", date: "2026-05-15" },
      { id: "W-2029", username: "kara_demo", amount: 12.00, address: "demo-addr-****a02", date: "2026-05-14" },
    ],
  };

  // ---------- Default user state --------------------------------
  const defaults = {
    username: "demo_user",
    email: "demo@example.test",
    avatar: "DU",
    inviteCode: "TVMD-9F4K2X",
    referrals: 8,                 // demo number for the dashboard card

    packageLevel: null,           // null = no package selected yet
    packageActivatedAt: null,

    balance: 0,
    totalEarnings: 0,
    todayEarnings: 0,
    todayDate: "",
    todayCompleted: [],           // ids of tasks completed today
    completedTasks: 0,            // all-time completed task count

    transactions: [],             // newest first
    withdrawals: [],              // newest first
    withdrawalStatus: "—",
  };

  // ---------- Persistence --------------------------------------
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "null");
      return raw ? { ...defaults, ...raw } : { ...defaults };
    } catch { return { ...defaults }; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }
  function reset() {
    try { localStorage.removeItem(KEY); } catch {}
    state = { ...defaults };
    ensureToday();
  }

  let state = load();

  // ---------- Daily reset --------------------------------------
  function ensureToday() {
    const t = today();
    if (state.todayDate !== t) {
      state.todayDate = t;
      state.todayEarnings = 0;
      state.todayCompleted = [];
      save();
    }
  }
  ensureToday();

  // ---------- Domain logic -------------------------------------
  function getActiveVip() {
    if (state.packageLevel == null) return null;
    return vipTiers.find(v => v.level === state.packageLevel) || null;
  }

  function rewardPerTask() {
    const v = getActiveVip();
    if (!v || v.daily <= 0) return 0;
    return Math.round((v.dailyIncome / v.daily) * 100) / 100;
  }

  function generateDailyTasks() {
    ensureToday();
    const v = getActiveVip();
    if (!v) return [];
    const reward = rewardPerTask();
    return Array.from({ length: v.daily }, (_, i) => {
      const slot = i + 1;
      const id = `${state.todayDate}-t${slot}`;
      return {
        id,
        slot,
        title: `Daily video task ${slot}`,
        videoSrc: `assets/videos/task-${slot}.mp4`,
        reward,
        completed: state.todayCompleted.includes(id),
      };
    });
  }

  function buyPackage(level) {
    const v = vipTiers.find(t => t.level === level);
    if (!v) return { ok: false, error: "Unknown package" };
    state.packageLevel = level;
    state.packageActivatedAt = new Date().toISOString();
    state.transactions.unshift({
      date: stamp(), type: "VIP Upgrade", amount: -v.price,
      status: "Completed", desc: `Activated ${v.name} (demo, no real payment)`,
    });
    save();
    return { ok: true };
  }

  function completeTask(id, reward) {
    if (!id || state.todayCompleted.includes(id)) {
      return { ok: false, error: "Already completed today" };
    }
    state.todayCompleted.push(id);
    state.balance        += reward;
    state.todayEarnings  += reward;
    state.totalEarnings  += reward;
    state.completedTasks += 1;
    state.transactions.unshift({
      date: stamp(), type: "Task Reward", amount: +reward,
      status: "Completed", desc: `Watched daily task ${id}`,
    });
    save();
    return { ok: true };
  }

  function submitWithdraw(amount, address) {
    amount = Math.round(parseFloat(amount) * 100) / 100;
    if (!isFinite(amount) || amount <= 0) {
      return { ok: false, error: "Enter a positive amount" };
    }
    if (amount > state.balance) {
      return { ok: false, error: "Insufficient demo balance" };
    }
    state.balance -= amount;
    const safeAddr = (String(address || "demo-addr-xxxx")).slice(0, 16);
    const rec = {
      date: today(), amount,
      address: safeAddr.length > 14 ? safeAddr.slice(0, 14) + "…" : safeAddr,
      status: "Pending",
    };
    state.withdrawals.unshift(rec);
    state.transactions.unshift({
      date: stamp(), type: "Withdraw", amount: -amount,
      status: "Pending", desc: `Withdraw to ${rec.address}`,
    });
    state.withdrawalStatus = "Pending review";
    save();
    return { ok: true };
  }

  function setProfile(p) {
    if (p.username) {
      state.username = p.username;
      state.avatar   = p.username.slice(0, 2).toUpperCase();
    }
    if (p.email) state.email = p.email;
    save();
  }

  // ---------- Public surface -----------------------------------
  return {
    // live, mutable references (in-place updates persist via save())
    get user()         { return state; },
    get transactions() { return state.transactions; },
    get withdrawals()  { return state.withdrawals; },
    get tasks()        { return generateDailyTasks(); }, // legacy compat

    // static catalog
    vipTiers, referrals, messages, admin,

    // domain API
    api: {
      ensureToday,
      getActiveVip,
      rewardPerTask,
      generateDailyTasks,
      buyPackage,
      completeTask,
      submitWithdraw,
      setProfile,
    },

    // legacy compatibility for older inline scripts
    saveUser:  save,
    resetUser: reset,
    loadUser:  load,
  };
})();
