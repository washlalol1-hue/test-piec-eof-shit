/* =============================================================
   T-Video Media Demo - DEMO DATA MODULE
   Educational scam awareness project - all data below is FAKE.
   No real users, no real money, no real wallets, no real APIs.
   ============================================================= */

window.DEMO = (function () {
  // Fake current user (read from localStorage if present, otherwise default)
  const defaultUser = {
    username: "demo_user_42",
    email: "demo@example.test",
    avatar: "DU",
    balance: 128.50,        // fake USD-equivalent demo points
    todayEarnings: 12.40,
    totalEarnings: 1340.75,
    vipLevel: 1,
    completedTasks: 27,
    referrals: 8,
    inviteCode: "TVMD-9F4K2X",
    withdrawalStatus: "Pending review",
  };

  function loadUser() {
    try {
      const saved = JSON.parse(localStorage.getItem("tvmd_user") || "null");
      return saved ? { ...defaultUser, ...saved } : { ...defaultUser };
    } catch { return { ...defaultUser }; }
  }
  function saveUser(u) {
    try { localStorage.setItem("tvmd_user", JSON.stringify(u)); } catch {}
  }
  function resetUser() {
    try { localStorage.removeItem("tvmd_user"); } catch {}
  }

  // Fake video tasks
  const tasks = [
    { id: "t1", title: "Intro to Reward Platforms (Demo)", duration: "0:30", reward: 1.20, status: "available" },
    { id: "t2", title: "Spot the Red Flag #1 (Demo)",       duration: "0:45", reward: 1.50, status: "available" },
    { id: "t3", title: "Fake Testimonial Patterns (Demo)",  duration: "1:00", reward: 2.00, status: "available" },
    { id: "t4", title: "Pyramid Referral Walkthrough",       duration: "0:50", reward: 1.80, status: "completed" },
    { id: "t5", title: "VIP Upgrade Pressure (Demo)",        duration: "0:40", reward: 1.40, status: "available" },
    { id: "t6", title: "Withdrawal Block Analysis",          duration: "1:10", reward: 2.50, status: "locked" },
    { id: "t7", title: "Brand Impersonation Examples",       duration: "0:55", reward: 1.90, status: "available" },
    { id: "t8", title: "Deposit-Before-Withdraw Trick",      duration: "1:05", reward: 2.20, status: "locked" },
  ];

  // Fake VIP tiers
  const vipTiers = [
    { level: 0, name: "VIP 0", price: 0,    daily: 3,  dailyIncome: 1.50,  monthlyIncome: 45,    unlocked: true,  free: true },
    { level: 1, name: "VIP 1", price: 50,   daily: 6,  dailyIncome: 4.00,  monthlyIncome: 120,   unlocked: true },
    { level: 2, name: "VIP 2", price: 200,  daily: 10, dailyIncome: 12.00, monthlyIncome: 360,   unlocked: false },
    { level: 3, name: "VIP 3", price: 800,  daily: 15, dailyIncome: 35.00, monthlyIncome: 1050,  unlocked: false },
    { level: 4, name: "VIP 4", price: 2500, daily: 25, dailyIncome: 95.00, monthlyIncome: 2850,  unlocked: false },
    { level: 5, name: "VIP 5", price: 8000, daily: 40, dailyIncome: 280.00, monthlyIncome: 8400, unlocked: false, featured: true },
  ];

  // Fake transactions
  const transactions = [
    { date: "2026-05-17 09:14", type: "Task Reward",   amount:  +1.50, status: "Completed", desc: "Watched demo video t2" },
    { date: "2026-05-17 09:01", type: "Task Reward",   amount:  +1.20, status: "Completed", desc: "Watched demo video t1" },
    { date: "2026-05-16 22:48", type: "Referral",      amount:  +5.00, status: "Completed", desc: "Demo invite bonus from L1" },
    { date: "2026-05-16 18:20", type: "Withdraw",      amount: -25.00, status: "Pending",   desc: "Demo withdraw request" },
    { date: "2026-05-15 12:32", type: "Recharge",      amount: +50.00, status: "Completed", desc: "Demo recharge - USDT (fake)" },
    { date: "2026-05-15 12:30", type: "VIP Upgrade",   amount: -50.00, status: "Completed", desc: "Demo upgrade to VIP 1" },
    { date: "2026-05-14 19:11", type: "Task Reward",   amount:  +2.00, status: "Completed", desc: "Watched demo video t3" },
    { date: "2026-05-13 08:02", type: "Withdraw",      amount: -10.00, status: "Rejected",  desc: "Demo withdraw rejected (insufficient VIP)" },
    { date: "2026-05-12 21:45", type: "Withdraw",      amount: -15.00, status: "Frozen",    desc: "Demo withdraw frozen (security review)" },
    { date: "2026-05-11 14:00", type: "Referral",      amount:  +2.50, status: "Completed", desc: "Demo L2 commission" },
  ];

  // Fake referral list
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

  // Fake announcements
  const messages = [
    { tag: "Promo",   title: "Complete more tasks to unlock higher rewards", date: "2026-05-17", body: "Reach 50 completed tasks this month for a demo bonus." },
    { tag: "VIP",     title: "VIP Upgrade Promotion - Limited Time",         date: "2026-05-16", body: "Demo notice: 20% discount on VIP upgrades this week." },
    { tag: "System",  title: "Withdrawal system maintenance",                date: "2026-05-15", body: "Withdrawals may be delayed during demo maintenance window." },
    { tag: "Invite",  title: "Invite friends to earn more demo rewards",     date: "2026-05-14", body: "Earn fake L1, L2, L3 commissions when invitees complete tasks." },
    { tag: "Alert",   title: "Verify your account to continue withdrawing",  date: "2026-05-13", body: "Educational note: this is a typical pressure tactic on real scam sites." },
  ];

  // Fake withdrawal history
  const withdrawals = [
    { date: "2026-05-16", amount: 25.00, address: "demo-addr-****a91", status: "Pending"   },
    { date: "2026-05-13", amount: 10.00, address: "demo-addr-****b32", status: "Rejected"  },
    { date: "2026-05-12", amount: 15.00, address: "demo-addr-****c77", status: "Frozen"    },
    { date: "2026-05-08", amount:  5.00, address: "demo-addr-****d05", status: "Completed" },
    { date: "2026-05-02", amount:  3.00, address: "demo-addr-****e18", status: "Completed" },
  ];

  // Admin demo
  const admin = {
    totalUsers: 12480,
    totalDeposits: 482300,
    totalWithdrawals: 38120,
    pendingWithdrawals: 214,
    vipDistribution: [ // percentages
      { level: "VIP 0", pct: 52 },
      { level: "VIP 1", pct: 24 },
      { level: "VIP 2", pct: 12 },
      { level: "VIP 3", pct: 7 },
      { level: "VIP 4", pct: 3 },
      { level: "VIP 5", pct: 2 },
    ],
    weeklyTasks: [120, 180, 240, 210, 280, 330, 410], // bar values
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

  return {
    user: loadUser(),
    saveUser, resetUser, loadUser,
    tasks, vipTiers, transactions, referrals, messages, withdrawals, admin,
  };
})();
