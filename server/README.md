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

## 2. Setting up email sending (Gmail SMTP)

This backend sends verification emails through **your own Gmail account** via SMTP,
using an App Password (not your normal Google password).

1. Turn on **2-Step Verification** on the Gmail account you'll send from:
   `myaccount.google.com/security`
2. Create an App Password: `myaccount.google.com/apppasswords` → choose "Mail" →
   you'll get a 16-character password.
3. In your `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=youraddress@gmail.com
   SMTP_PASS=your16characterapppassword
   SMTP_FROM="FitForge <youraddress@gmail.com>"
   ```
4. **No recipient restriction**: unlike a brand-new Resend account, a Gmail App Password
   can send to any email address immediately — no domain verification step, no
   "only your own email" limit. This is what actually lets every signer-upper receive
   their code, not just you.
5. If you ever change `.env`, restart the server (`Ctrl+C` then `npm start`) — Node only
   reads `.env` once at startup.

Every send attempt is logged to your server console — either
`[mailer] Sent to ... — messageId: ...` on success, or a thrown error with details on
failure — so you never have to guess whether an email actually went out. Gmail SMTP mail
can occasionally land in spam on the first few sends to a new recipient; that's a
deliverability quirk of using a personal Gmail account rather than a dedicated
transactional email service, not a bug in this code.

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
