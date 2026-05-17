# T-Video Media Demo

A complete educational replica of a "video reward" platform, built as a
school project about online scam awareness.

> **Educational demo for scam-awareness research. No real money, no real
> accounts, no real rewards.**
>
> This site is **not** affiliated with any real company or brand. The name
> "T-Video Media Demo" is fictional and is used purely to study the design
> patterns commonly seen on fake reward / task platforms. There is no real
> backend, no real authentication, no real payment processing, and no real
> wallet addresses.

## What is included

A 16-page responsive UI that mirrors the typical structure of a
reward-task scam platform, plus a dedicated **Scam Analysis** page that
explains every pattern the demo intentionally reproduces.

| Page | File | Purpose |
|---|---|---|
| Landing | `index.html` | Marketing-style intro, feature cards, red-flag list |
| Login | `login.html` | Fake login (any input redirects to dashboard) |
| Register | `register.html` | Fake registration with invitation-code warning |
| Dashboard | `dashboard.html` | Profile, fake balance, stats, quick actions |
| Video Tasks | `tasks.html` | Fake "watch to earn" cards with countdown modal |
| VIP Levels | `vip.html` | 6 fake VIP tiers with upgrade warning modal |
| Recharge | `recharge.html` | Fake deposit form (no real payment processing) |
| Withdraw | `withdraw.html` | Fake withdrawal form, history with all status types |
| Invite | `invite.html` | Fake invite code/link, L1/L2/L3 commission cards |
| Team | `team.html` | Fake downline statistics and table |
| Transactions | `transactions.html` | Tabbed history of fake records |
| Messages | `messages.html` | Fake announcements illustrating urgency tactics |
| Support | `support.html` | Auto-reply demo chat, FAQ, demo ticket form |
| Scam Analysis | `scam-analysis.html` | Educational walkthrough of every red flag |
| Settings | `settings.html` | Local-only preferences and reset |
| Admin Demo | `admin.html` | Fake operator dashboard for educational analysis |

## File structure

```
.
├── index.html
├── login.html
├── register.html
├── dashboard.html
├── tasks.html
├── vip.html
├── recharge.html
├── withdraw.html
├── invite.html
├── team.html
├── transactions.html
├── messages.html
├── support.html
├── scam-analysis.html
├── settings.html
├── admin.html
└── assets/
    ├── css/
    │   └── styles.css      # full dark theme, components
    └── js/
        ├── data.js         # all FAKE demo data (user, tasks, VIP, ...)
        └── app.js          # sidebar/topbar shell, modal, toast helpers
```

## Running locally

This is plain HTML / CSS / JavaScript. There is **no build step** and **no
backend**.

Just open `index.html` in any modern browser, or serve the folder
statically:

```bash
# Python 3
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Demo interactions (all fake)

- Login redirects to the dashboard regardless of input.
- Register shows a "Demo account created. No data was saved." modal.
- Watching a video task runs a 5-second countdown, then increases the
  fake balance and completed-task count locally.
- VIP upgrade buttons open a warning modal explaining the
  deposit-to-earn-more scam pattern.
- Recharge form shows "Demo only. No payment was made.".
- Withdrawal request adds a fake "Pending" record locally.
- Copy invite link copies a fake demo URL.
- Support chat replies automatically with a demo message.
- Settings → "Reset demo data" clears local state and reloads.
- Logout clears local state and returns to the landing page.

## Why this exists

Real reward-task scams reuse the same UI building blocks: VIP tiers, fake
balances, task lists, multi-level referrals, and "pending" withdrawals.
By recreating the visual language of these platforms - with educational
notes attached to each section - this project gives readers a guided tour
of every red flag, so they can recognise the pattern in the wild.

See `scam-analysis.html` for the full educational walkthrough.

## What this project does **not** include

- No real authentication.
- No real backend, database, or analytics.
- No real payment processing.
- No real cryptocurrency wallets, addresses, or QR codes.
- No real bank or card collection.
- No real referral tracking.
- No real branding, logos, or claim of partnership with any company.
