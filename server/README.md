# FitForge Server

Express + MySQL + JWT backend with email-verified signup.

## What it does

- `POST /api/auth/signup` — takes `username`, `fullName`, `email`, `password`. Does **not** create
  an account yet — it stores the details in `pending_verifications` and emails a 6-digit code.
- `POST /api/auth/verify` — takes `email`, `code`. If the code matches and hasn't expired (15 min),
  the real account is created in `users` and a JWT is returned.
- `POST /api/auth/resend` — re-sends a fresh code to a pending signup.
- `POST /api/auth/login` — takes `username`, `password`, returns a JWT.
- `GET /api/auth/me` — returns the logged-in user (used by the app to check a stored token is still valid).
- Everything else (`/api/activities`, `/api/food`, `/api/leaderboard`, `/api/routine`, `/api/water`,
  `/api/weight`, `/api/goals`) requires `Authorization: Bearer <token>`.

## 1. Local setup

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env`:
- `DB_*` — your MySQL connection details.
- `JWT_SECRET` — generate one with `openssl rand -hex 32` (or any long random string).
- `SMTP_*` — see the email section below.

Create the database and load the schema:

```bash
mysql -u root -p -e "CREATE DATABASE fitforge;"
mysql -u root -p fitforge < schema.sql
```

Run it:

```bash
npm start
```

Visit `http://localhost:4000/health` — you should see `{"status":"healthy"}`.

## 2. Setting up email sending (Resend)

This backend sends verification emails through **Resend's API** directly (not raw SMTP),
using their official Node SDK.

1. Sign up free at [resend.com](https://resend.com) — no credit card needed.
2. Go to **API Keys** → **Create API Key** → copy it.
3. In your `.env`:
   ```
   RESEND_API_KEY=re_your_actual_key
   RESEND_FROM="FitForge <onboarding@resend.dev>"
   ```
4. **Important limitation until you verify a domain**: a brand-new Resend account can
   only send emails *to* the address you signed up with, and *from* their shared
   `onboarding@resend.dev` address. This is enough to fully test signup yourself, but
   other people's signups will fail with a `403`/validation error until you verify a
   domain (see below) — and that error will be logged clearly by the server, not silent.
5. To let anyone sign up: buy/own a domain, go to **Domains → Add Domain** on Resend,
   add the DNS records it gives you at your registrar, wait for verification, then
   change `RESEND_FROM` to an address on that domain (e.g. `no-reply@yourdomain.com`).

Every send attempt is logged to your server console — either
`[mailer] Sent to ... — Resend id: ...` on success, or a clear error object on failure —
so you never have to guess whether an email actually went out.

## 3. Hosting the database (MySQL)

Pick one (all have free tiers as of writing — check current pricing before committing):
- **Railway** (railway.app) — click "New Project" → "Provision MySQL", copy the connection
  details it gives you into your `.env`.
- **Aiven** (aiven.io) — free MySQL plan, good if Railway's free tier changes.
- **Clever Cloud** (clever-cloud.com) — has a small always-free MySQL add-on.

Whichever you pick, once you have host/port/user/password/database, run the schema against it:
```bash
mysql -h <host> -P <port> -u <user> -p <database> < schema.sql
```

## 4. Hosting the server itself

**Railway** or **Render** are the simplest for a small Node/Express app:
1. Push this `server/` folder to a GitHub repo.
2. On Railway/Render, "New Project" → "Deploy from GitHub" → pick the repo, set the root directory
   to `server` if your repo has both `server/` and `mobile/` in it.
3. Add all the same environment variables from your `.env` in their dashboard's "Variables" section
   (never commit `.env` itself).
4. Set the start command to `npm start`.
5. Deploy — you'll get a public URL like `https://fitforge-server-production.up.railway.app`.
6. Confirm `https://<your-url>/health` responds.

That public URL is what you'll put into the mobile app's `API_BASE_URL` (see `mobile/README.md`).

## Notes

- Passwords are hashed with bcrypt — never stored in plain text.
- JWTs are signed with `JWT_SECRET` and expire after `JWT_EXPIRES_IN` (30 days by default).
- Points are updated server-side in the same transaction as each workout/food entry, so the
  leaderboard is always consistent with the underlying logs.
- This is a minimal, honest backend — there's no rate limiting, email-sending retry queue, or
  refresh-token rotation. Fine for personal/small-group use; harden it further before any
  wider public launch.
