/* =============================================================
   T-Video Media Demo - STATE STORE & DOMAIN API
   --------------------------------------------------------------
   Educational scam-awareness school project. Everything is FAKE.
   No backend, no real auth, no real money.

   Public surface (window.DEMO):

     // live state (mutates in place; persisted to localStorage)
     DEMO.user            // profile, balance, package, counters, prefs
     DEMO.transactions    // newest first
     DEMO.withdrawals     // newest first
     DEMO.referrals       // live downline
     DEMO.isAdmin         // boolean - admin unlocked this session?

     // static catalog
     DEMO.vipTiers, DEMO.messages, DEMO.admin

     // domain API
     DEMO.api.getActiveVip()
     DEMO.api.rewardPerTask()
     DEMO.api.generateDailyTasks()
     DEMO.api.buyPackage(level)
     DEMO.api.completeTask(id, reward)
     DEMO.api.submitWithdraw(amount, address, password?)
     DEMO.api.setProfile({ username, email })
     DEMO.api.setPreferences({ theme, language, notifications })
     DEMO.api.setWithdrawalPassword(pw)
     DEMO.api.unlockAdmin(pw)   // demo password: "demo-admin"
     DEMO.api.lockAdmin()
     DEMO.api.addReferral(name?)
     DEMO.api.simulateReferralActivity()
     DEMO.api.getInviteCode()

     // legacy
     DEMO.saveUser, DEMO.resetUser, DEMO.loadUser, DEMO.tasks
   ============================================================= */

window.DEMO = (function () {
  const KEY = "tvmd_state";
  const ADMIN_PASSWORD = "demo-admin";   // educational only
  const today = () => new Date().toISOString().slice(0, 10);
  const stamp = () => new Date().toISOString().replace("T", " ").slice(0, 16);
  const round2 = (n) => Math.round(n * 100) / 100;

  // ---------- Static catalogs --------------------------------
  const vipTiers = [
    { level: 0, name: "VIP 0", price: 0,    daily: 3,  dailyIncome: 1.50,   monthlyIncome: 45,    free: true },
    { level: 1, name: "VIP 1", price: 50,   daily: 6,  dailyIncome: 4.00,   monthlyIncome: 120 },
    { level: 2, name: "VIP 2", price: 200,  daily: 10, dailyIncome: 12.00,  monthlyIncome: 360 },
    { level: 3, name: "VIP 3", price: 800,  daily: 15, dailyIncome: 35.00,  monthlyIncome: 1050 },
    { level: 4, name: "VIP 4", price: 2500, daily: 25, dailyIncome: 95.00,  monthlyIncome: 2850 },
    { level: 5, name: "VIP 5", price: 8000, daily: 40, dailyIncome: 280.00, monthlyIncome: 8400, featured: true },
  ];

  const seedReferrals = [
    { username: "alex_demo",  joined: "2026-04-12", vip: 1, contribution: 12.50, status: "Active"   },
    { username: "sam_demo",   joined: "2026-04-18", vip: 0, contribution:  3.10, status: "Active"   },
    { username: "leo_demo",   joined: "2026-04-22", vip: 2, contribution: 41.00, status: "Active"   },
    { username: "mia_demo",   joined: "2026-04-28", vip: 0, contribution:  0.00, status: "Inactive" },
    { username: "kara_demo",  joined: "2026-05-02", vip: 1, contribution: 18.20, status: "Active"   },
    { username: "noah_demo",  joined: "2026-05-04", vip: 0, contribution:  0.40, status: "Inactive" },
  ];

  const messages = [
    { tag: "Promo",  title: "Complete more tasks to unlock higher rewards", date: "2026-05-17", body: "Reach 50 completed tasks this month for a demo bonus." },
    { tag: "VIP",    title: "VIP upgrade promotion - limited time",         date: "2026-05-16", body: "Demo notice: 20% discount on VIP upgrades this week." },
    { tag: "System", title: "Withdrawal system maintenance",                date: "2026-05-15", body: "Withdrawals may be delayed during demo maintenance." },
    { tag: "Invite", title: "Invite friends to earn more demo rewards",     date: "2026-05-14", body: "Earn fake L1, L2, L3 commissions when invitees complete tasks." },
    { tag: "Alert",  title: "Verify your account to continue withdrawing",  date: "2026-05-13", body: "Educational note: this is a typical pressure tactic on real scam sites." },
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

  // ---------- Default state -----------------------------------
  const defaults = {
    username: "demo_user",
    email: "demo@example.test",
    avatar: "DU",
    inviteCode: null,            // derived from username

    packageLevel: null,
    packageActivatedAt: null,

    balance: 0,
    totalEarnings: 0,
    todayEarnings: 0,
    todayDate: "",
    todayCompleted: [],
    completedTasks: 0,

    transactions: [],
    withdrawals: [],
    referrals: null,             // populated on first load (see ensureReferrals)

    withdrawalPassword: "",      // optional 4-digit PIN, demo only

    preferences: {
      theme: "dark",             // dark | midnight
      language: "English",
      notifications: {
        taskReminders: true,
        vipPromos: true,
        withdrawal: true,
        referral: false,
      },
    },
  };

  // ---------- Persistence -------------------------------------
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!raw) return clone(defaults);
      // shallow merge with deep merge for known nested objects
      const merged = { ...clone(defaults), ...raw };
      merged.preferences = {
        ...clone(defaults.preferences),
        ...(raw.preferences || {}),
      };
      merged.preferences.notifications = {
        ...clone(defaults.preferences.notifications),
        ...((raw.preferences && raw.preferences.notifications) || {}),
      };
      return merged;
    } catch { return clone(defaults); }
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }
  function reset() {
    try { localStorage.removeItem(KEY); } catch {}
    state = load();
    ensureToday();
    ensureReferrals();
    ensureInviteCode();
  }

  let state = load();
  let isAdmin = false; // admin status lives in memory, not localStorage

  // ---------- Bootstrap -----------------------------------
  function ensureToday() {
    const t = today();
    if (state.todayDate !== t) {
      state.todayDate = t;
      state.todayEarnings = 0;
      state.todayCompleted = [];
      save();
    }
  }
  function ensureReferrals() {
    if (!Array.isArray(state.referrals)) {
      state.referrals = clone(seedReferrals);
      save();
    }
  }
  function ensureInviteCode() {
    if (!state.inviteCode) {
      const base = (state.username || "demo").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6) || "user";
      const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
      state.inviteCode = `TVMD-${base.toUpperCase()}-${rand}`;
      save();
    }
  }
  ensureToday();
  ensureReferrals();
  ensureInviteCode();

  // ---------- Domain logic -----------------------------------
  function getActiveVip() {
    if (state.packageLevel == null) return null;
    return vipTiers.find(v => v.level === state.packageLevel) || null;
  }

  function rewardPerTask() {
    const v = getActiveVip();
    if (!v || v.daily <= 0) return 0;
    return round2(v.dailyIncome / v.daily);
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
    state.balance        = round2(state.balance + reward);
    state.todayEarnings  = round2(state.todayEarnings + reward);
    state.totalEarnings  = round2(state.totalEarnings + reward);
    state.completedTasks += 1;
    state.transactions.unshift({
      date: stamp(), type: "Task Reward", amount: +reward,
      status: "Completed", desc: `Watched daily task ${id}`,
    });
    save();
    return { ok: true };
  }

  function submitWithdraw(amount, address, password) {
    amount = round2(parseFloat(amount));
    if (!isFinite(amount) || amount <= 0) {
      return { ok: false, error: "Enter a positive amount" };
    }
    if (amount > state.balance) {
      return { ok: false, error: "Insufficient demo balance" };
    }
    if (state.withdrawalPassword) {
      if ((password || "") !== state.withdrawalPassword) {
        return { ok: false, error: "Incorrect withdrawal password" };
      }
    }
    state.balance = round2(state.balance - amount);
    const safeAddr = String(address || "demo-addr-xxxx").slice(0, 16);
    const rec = {
      date: today(),
      amount,
      address: safeAddr.length > 14 ? safeAddr.slice(0, 14) + "..." : safeAddr,
      status: "Pending",
    };
    state.withdrawals.unshift(rec);
    state.transactions.unshift({
      date: stamp(), type: "Withdraw", amount: -amount,
      status: "Pending", desc: `Withdraw to ${rec.address}`,
    });
    save();
    return { ok: true };
  }

  function setProfile(p) {
    let changed = false;
    if (p.username && p.username.trim() && p.username !== state.username) {
      state.username = p.username.trim();
      state.avatar = state.username.slice(0, 2).toUpperCase();
      // refresh invite code so it reflects the new username
      const base = state.username.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6) || "user";
      const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
      state.inviteCode = `TVMD-${base.toUpperCase()}-${rand}`;
      changed = true;
    }
    if (p.email && p.email !== state.email) {
      state.email = p.email.trim();
      changed = true;
    }
    if (changed) save();
    return { ok: true };
  }

  function setPreferences(prefs) {
    if (prefs.theme)    state.preferences.theme = prefs.theme;
    if (prefs.language) state.preferences.language = prefs.language;
    if (prefs.notifications) {
      state.preferences.notifications = {
        ...state.preferences.notifications,
        ...prefs.notifications,
      };
    }
    save();
    return { ok: true };
  }

  function setWithdrawalPassword(pw) {
    pw = String(pw || "").trim();
    if (pw && !/^\d{4,8}$/.test(pw)) {
      return { ok: false, error: "Use 4-8 digits" };
    }
    state.withdrawalPassword = pw;
    save();
    return { ok: true };
  }

  // --- Admin "auth" (educational only - real apps use server-side checks) ---
  function unlockAdmin(pw) {
    if (pw === ADMIN_PASSWORD) { isAdmin = true; return { ok: true }; }
    return { ok: false, error: "Incorrect demo admin password" };
  }
  function lockAdmin() { isAdmin = false; }

  // --- Referrals ---
  const FIRST_NAMES = ["alex", "sam", "leo", "mia", "kara", "noah", "ivy", "ben", "ren", "rae", "jay", "tina", "dan", "luna", "max", "zoe", "ola", "ivan"];
  function nextReferralName() {
    let n = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)] + "_demo";
    let tries = 0;
    while (state.referrals.some(r => r.username === n) && tries < 30) {
      n = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)] + "_demo" + (Math.floor(Math.random() * 90) + 10);
      tries++;
    }
    return n;
  }
  function addReferral(name) {
    const username = (name && name.trim()) || nextReferralName();
    const r = {
      username,
      joined: today(),
      vip: 0,
      contribution: 0,
      status: "Active",
    };
    state.referrals.unshift(r);
    save();
    return { ok: true, referral: r };
  }
  // Picks an active referral, advances them (small contribution + maybe VIP up),
  // and credits a fake L1 commission to the user balance.
  function simulateReferralActivity() {
    const actives = state.referrals.filter(r => r.status === "Active");
    if (!actives.length) return { ok: false, error: "No active referrals to simulate" };
    const r = actives[Math.floor(Math.random() * actives.length)];
    const earned = round2(0.5 + Math.random() * 4); // their own task earnings
    r.contribution = round2(r.contribution + earned);
    if (Math.random() < 0.15 && r.vip < 5) r.vip += 1;
    if (Math.random() < 0.05) r.status = "Inactive";
    const commission = round2(earned * 0.10); // L1 = 10%
    state.balance      = round2(state.balance + commission);
    state.totalEarnings = round2(state.totalEarnings + commission);
    state.transactions.unshift({
      date: stamp(),
      type: "Referral",
      amount: +commission,
      status: "Completed",
      desc: `L1 commission from ${r.username}`,
    });
    save();
    return { ok: true, who: r.username, commission };
  }
  function getInviteCode() { return state.inviteCode; }

  // ---------- Public surface ---------------------------------
  return {
    get user()         { return state; },
    get transactions() { return state.transactions; },
    get withdrawals()  { return state.withdrawals; },
    get referrals()    { return state.referrals; },
    get tasks()        { return generateDailyTasks(); },
    get isAdmin()      { return isAdmin; },

    vipTiers, messages, admin,

    api: {
      ensureToday,
      getActiveVip, rewardPerTask, generateDailyTasks,
      buyPackage, completeTask, submitWithdraw,
      setProfile, setPreferences, setWithdrawalPassword,
      unlockAdmin, lockAdmin,
      addReferral, simulateReferralActivity, getInviteCode,
    },

    saveUser:  save,
    resetUser: reset,
    loadUser:  load,
  };
})();
