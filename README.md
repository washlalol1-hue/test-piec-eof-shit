# VidLog

A small personal video library: log the videos you watch, track progress,
take notes, and pick what to watch next. No ads, no tiers, no money - just
your library on your account.

The frontend is a static site (HTML/CSS/vanilla JS). The backend is a single
[Cloudflare Worker](https://developers.cloudflare.com/workers/) backed by a
[D1](https://developers.cloudflare.com/d1/) database.

```
.
|-- public/                # static frontend (served by env.ASSETS)
|   |-- index.html
|   |-- login.html
|   |-- register.html
|   |-- dashboard.html
|   |-- videos.html
|   |-- messages.html
|   |-- support.html
|   |-- settings.html
|   |-- admin.html
|   `-- assets/{css,js}/   # styles.css, auth.js, app.js
|-- worker/
|   `-- index.js           # Cloudflare Worker (auth + API)
|-- migrations/
|   `-- 0001_init.sql      # D1 schema + seed data
`-- wrangler.jsonc
```

## Features

- Real authentication (PBKDF2-SHA256 password hashing, signed HttpOnly
  session cookies, 14-day TTL).
- Personal video library with search, sort, tags, and per-user notes.
- Server-side watch tracking - resume any video where you left off,
  on any device.
- Announcements page populated from D1.
- Settings page: edit profile, change password, delete account.
- Admin page: add/delete videos, post announcements, see basic stats.
  The first user to register automatically becomes the admin.

## API

All endpoints are JSON. Authenticated endpoints require the
`vidlog_session` cookie set by the login/register response.

| Method | Path                                  | Auth   | Description                                |
| ------ | ------------------------------------- | ------ | ------------------------------------------ |
| POST   | `/api/auth/register`                  | -      | Create an account, sets session cookie     |
| POST   | `/api/auth/login`                     | -      | Verify password, sets session cookie       |
| POST   | `/api/auth/logout`                    | -      | Clears the session cookie                  |
| GET    | `/api/auth/me`                        | user   | Returns the current user                   |
| GET    | `/api/dashboard`                      | user   | Stats + continue-watching + recent + news  |
| GET    | `/api/videos`                         | user   | Library plus the user's progress per video |
| POST   | `/api/videos/:id/watch`               | user   | Save progress (and optionally `watched`)   |
| POST   | `/api/videos/:id/note`                | user   | Save a per-user note for a video           |
| GET    | `/api/announcements`                  | user   | Recent announcements                       |
| POST   | `/api/feedback`                       | user   | Submit subject + message                   |
| PUT    | `/api/profile`                        | user   | Update display name and email              |
| POST   | `/api/profile/password`               | user   | Change password (current + new)            |
| DELETE | `/api/profile`                        | user   | Delete the account (requires password)     |
| GET    | `/api/admin/stats`                    | admin  | Counts: users, videos, watches, news       |
| GET    | `/api/admin/users`                    | admin  | Latest 200 users                           |
| POST   | `/api/admin/videos`                   | admin  | Add a video to the library                 |
| DELETE | `/api/admin/videos/:id`               | admin  | Remove a video                             |
| POST   | `/api/admin/announcements`            | admin  | Publish an announcement                    |

## Local development

You need Node 18+ and the Wrangler CLI.

```bash
npm install -g wrangler   # or use `npx wrangler ...` for every command

# 1. Create the D1 database (first time only)
wrangler d1 create vidlog
# Wrangler prints something like:
#   database_name = "vidlog"
#   database_id   = "..."
# Copy the database_id into wrangler.jsonc -> d1_databases[0].database_id

# 2. Apply migrations (creates tables and inserts seed data)
wrangler d1 migrations apply vidlog --local       # local dev
# wrangler d1 migrations apply vidlog              # production

# 3. Run locally
wrangler dev
# Open http://localhost:8787 - register a user (the first user becomes admin).
```

## Deploying

```bash
# Set a real production JWT secret (do not rely on the default in vars)
wrangler secret put JWT_SECRET

# Apply migrations to the production D1 database
wrangler d1 migrations apply vidlog

# Deploy the Worker + assets
wrangler deploy
```

After the first deploy:

1. Visit your worker URL (`https://vidlog.<account>.workers.dev` by default).
2. Click "Sign up" and register the first account - it is automatically
   given the `admin` role.
3. Open the Admin page in the sidebar to add videos and post announcements.

## Security notes

- Passwords are stored as `pbkdf2-sha256$<iterations>$<saltB64u>$<hashB64u>`
  using 200,000 iterations. Verification uses constant-time comparison.
- Sessions are JWT-style tokens (`base64url(payload).base64url(HMAC-SHA256
  signature)`), signed with `JWT_SECRET`. The cookie is `HttpOnly`,
  `Secure`, `SameSite=Lax`, and lasts 14 days.
- The default `JWT_SECRET` baked into `wrangler.jsonc` is only meant for
  local development - override it in production with `wrangler secret put`.
- Account deletion cascades: the user row, watch history, notes, and
  feedback are all removed via `ON DELETE CASCADE`.
