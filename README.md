# T-Video Media Demo

A complete educational replica of a "video reward" platform, built as a
school project about online scam awareness.

> **Educational demo for scam-awareness research. No real money, no real
> accounts, no real rewards.**
>
> This site is **not** affiliated with any real company or brand. The name
> "T-Video Media Demo" is fictional. There is no backend, no real auth,
> no real payments, and no real wallet addresses.

## Pages

| Page | File | Purpose |
|---|---|---|
| Landing | `index.html` | Marketing-style intro, feature cards, red-flag list |
| Login | `login.html` | Fake login (any input redirects to dashboard) |
| Register | `register.html` | Fake registration with invitation-code warning |
| Dashboard | `dashboard.html` | Profile, balance, live stats, recent activity |
| Video Tasks | `tasks.html` | Real `<video>` player gated by package selection |
| VIP Packages | `vip.html` | 6 fake tiers, "Buy" actually activates one locally |
| Recharge | `recharge.html` | Fake deposit form (no real payment processing) |
| Withdraw | `withdraw.html` | Real-balance check + optional withdrawal password |
| Invite | `invite.html` | Live referral list with "simulate sign-up / activity" demo controls |
| Team | `team.html` | Same downline data formatted as a team view |
| Transactions | `transactions.html` | Tabbed history of real records (rewards, packages, withdrawals, referrals) |
| Messages | `messages.html` | Fake announcements illustrating urgency tactics |
| Support | `support.html` | Auto-reply demo chat, FAQ, demo ticket form |
| Scam Analysis | `scam-analysis.html` | Educational walkthrough of every red flag |
| Settings | `settings.html` | Profile, security, preferences, notifications, admin access, danger zone |
| Admin Demo | `admin.html` | Operator-style dashboard (password-gated) |

## File structure

```
.
├── index.html
├── login.html / register.html
├── dashboard.html
├── tasks.html  vip.html
├── recharge.html  withdraw.html
├── invite.html  team.html
├── transactions.html  messages.html
├── support.html  scam-analysis.html
├── settings.html  admin.html
└── assets/
    ├── css/styles.css
    ├── js/data.js              # state store + domain API
    ├── js/app.js               # shell renderer (sidebar, topbar, modal, toast)
    └── videos/                 # drop task-1.mp4 ... task-N.mp4 here
```

## Running locally

Plain HTML/CSS/JS. No build step.

```bash
# Python 3
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Live demo logic

State lives in `localStorage` under `tvmd_state`. The domain API on
`window.DEMO.api` is what every page calls.

### Buying a package (VIP page)

1. Visit **VIP packages**.
2. Pick a tier and confirm the educational warning.
3. The dashboard, tasks page, and VIP page all live-update.

If no package is active, the dashboard shows a red CTA and the Tasks
page shows a locked card pointing back to the VIP page.

### Daily video tasks

Each package decides how many tasks per day and how much each one pays:

| Package | Daily tasks | Per-task reward | Daily income |
|---------|-------------|-----------------|--------------|
| VIP 0 | 3  | $0.50 | $1.50   |
| VIP 1 | 6  | $0.67 | $4.00   |
| VIP 2 | 10 | $1.20 | $12.00  |
| VIP 3 | 15 | $2.33 | $35.00  |
| VIP 4 | 25 | $3.80 | $95.00  |
| VIP 5 | 40 | $7.00 | $280.00 |

Tasks reset every calendar day.

### Real video playback

Drop `task-1.mp4`, `task-2.mp4`, … into `assets/videos/`. The watch
modal:

- shows a loading hint while the file fetches,
- enables **Complete task** only when the user has actually watched
  ≥90% of the runtime (skipping ahead with the seek bar does **not**
  count — we only credit forward jumps of ≤1 second as real playback),
- still fires "Complete" when the video ends, in case the browser
  doesn't dispatch enough `timeupdate` events,
- falls back to a 5-second demo countdown if the file is missing.

`assets/videos/README.md` has details on naming and formats.

### Live referrals

Open **Invite friends** and use the demo controls:

- **Simulate new sign-up** — adds a randomly-named referral.
- **Simulate referral activity** — picks an active referral, makes
  them earn a small amount, and credits 10% to your balance as an L1
  commission. Logged in Transactions as type **Referral**.

The Team and dashboard pages reflect the same live list.

### Withdrawals

The Withdraw page validates against your real demo balance. If you set
a withdrawal password in **Settings → Security**, the form will
require it before a request is accepted. New requests appear as
`Pending` in both the withdrawal history and the transaction list.

### Admin access

The Admin link is hidden from the sidebar by default. To unlock:

1. **Settings → Admin access** → enter the demo password
   `demo-admin` and submit, **or**
2. Open `admin.html` directly and enter the password on the gate.

Unlock state lives in memory only — closing the browser, clicking
**Lock admin**, or hitting **Logout** in the sidebar all re-lock it.

> **Educational note:** a client-side gate is not real security. Real
> admin systems verify access on the server, where the password
> can't be read from the page source.

### Theme & preferences

Settings → **Preferences** has a live dark/midnight toggle and a
language selector (UI strings stay English; the choice is just
persisted). Notifications are 4 toggles persisted in localStorage.

### Reset

Settings → **Danger zone → Reset demo data** clears `tvmd_state` and
reloads.

## What this project does **not** include

- No real authentication.
- No real backend, database, or analytics.
- No real payment processing or recharge flow.
- No real cryptocurrency wallets, addresses, or QR codes.
- No real bank or card collection.
- No real referral tracking.
- No real branding, logos, or claim of partnership with any company.
