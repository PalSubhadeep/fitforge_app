# FitForge

A real client-server fitness tracker: React Native (Expo) mobile app + Node/Express backend
with MySQL storage and JWT authentication.

```
fitforge-app/
├── server/     Node + Express + MySQL + JWT backend (see server/README.md)
└── mobile/     React Native / Expo app (see mobile/README.md)
```

## Do this in order

1. **Set up the database** — see `server/README.md` section 3 (Railway, Aiven, or Clever Cloud
   all have a usable free MySQL tier). Load `server/schema.sql` into it.
2. **Set up email sending** — see `server/README.md` section 2 (a Gmail App Password is the
   fastest way to get this working).
3. **Run the backend locally first** to confirm signup → email → verify → login all work
   before deploying anywhere (`server/README.md` section 1).
4. **Deploy the backend** to Railway or Render (`server/README.md` section 4) — this is what
   makes it reachable from a real phone instead of just your laptop.
5. **Point the mobile app at your deployed backend** — edit `API_BASE_URL` in
   `mobile/src/api.js`.
6. **Test with Expo Go** on your phone (`mobile/README.md` section 2) — much faster than
   rebuilding an APK every time you change something.
7. **Build the APK** with EAS Build once everything works in Expo Go (`mobile/README.md`
   section 3).

## Why it's split this way

A React Native app is just a client — it needs somewhere real to send its data. That's the
server half: it owns the MySQL database, hashes passwords, issues JWTs, and sends the
verification emails. The mobile app never talks to MySQL directly; it only ever calls the
server's API over HTTPS with a bearer token attached.

## Honesty about what's "done" vs. what needs your accounts

Everything here is real, working code — not a mockup. But three things need credentials only
you can provide, so I can't finish them from my end:
- A live MySQL database (needs a hosting account)
- A live backend URL (needs a hosting account)
- A real signed APK (needs a free Expo/EAS account, since Android builds require Google's
  build toolchain, which isn't available in the environment I write code in)

Follow the two READMEs in order and each of those becomes a 5-10 minute step.
