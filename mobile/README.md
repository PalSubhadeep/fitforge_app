# FitForge Mobile (React Native / Expo)

> Built on **Expo SDK 54** (React Native 0.81, React 19). Expo Go only ever supports the
> current SDK version on the app stores — if Expo Go on your phone says it expects a
> different SDK, that's the actual problem to fix (upgrade this project's `expo` version
> to match), not a bug in the app code. Check what your installed Expo Go app supports
> before troubleshooting anything else.
>
> **SDK 54 also forces Android edge-to-edge display on, with no way to opt out** — content
> draws behind the status bar by default. This project is already set up for it: the app
> root is wrapped in `SafeAreaProvider`, and every screen without its own native header
> (Home, Activity, Food, Leaderboard, Calendar, More hub, Login, Signup, Verify) uses
> `SafeAreaView` from `react-native-safe-area-context` so content sits below the status
> bar instead of under it. The screens inside the More stack (Goals, Routine, Water,
> Weight, Calories, Weekly, Monthly) don't need this — their native-stack header already
> handles the inset automatically.

## 1. Point it at your backend

Open `src/api.js` and change:

```js
export const API_BASE_URL = 'https://YOUR-BACKEND-URL.example.com';
```

to your deployed server URL from `server/README.md` (e.g. `https://fitforge-server-production.up.railway.app`).

While developing locally with Expo Go on a physical phone, `localhost` will **not** work —
use your computer's LAN IP instead (e.g. `http://192.168.1.20:4000`), since your phone and
computer are separate devices on the network.

## 2. Run it locally (Expo Go — fastest way to test)

```bash
cd mobile
npm install
npx expo start
```

This prints a QR code. Install the **Expo Go** app from the Play Store on your phone, then
scan the QR code — the app opens live on your phone, hot-reloading as you edit code. This is
the fastest way to test everything (signup → email code → login → all screens) before
bothering with a real APK build.

## 3. Building a real, installable APK

This requires a free **Expo account** (create one at expo.dev) and their **EAS Build** service,
which compiles the native Android app in the cloud (you don't need Android Studio installed).

```bash
npm install -g eas-cli
eas login
cd mobile
eas build:configure
```

When it asks, choose Android. This creates an `eas.json` — for a plain installable APK
(not a Play Store bundle), make sure your Android build profile includes:

```json
{
  "build": {
    "preview": {
      "android": { "buildType": "apk" }
    }
  }
}
```

Then run:

```bash
eas build --platform android --profile preview
```

This uploads your project to Expo's build servers, compiles it, and gives you a download link
(also emailed to you, and visible on expo.dev under your project's Builds tab) for the `.apk`.
Typical build time is 10-20 minutes.

## 4. Installing the APK on your phone

1. Download the `.apk` from the link EAS gives you (open it directly on your phone's browser,
   or transfer it from your computer).
2. Tap the file — Android will prompt to allow installs from that source under
   **Settings → Security**. Enable it for whichever app you opened the file with.
3. Tap **Install**.
4. Open **FitForge** from your app drawer.

## What's implemented

- **Signup** (username, full name, email, password) → sends a 6-digit email code
- **Verify** screen → confirms the code, creates the account, logs you in with a JWT
- **Login** with username + password
- **Home** — points, rank, today's counts, workout streak, clean-eating streak, quick links
- **Activity** — log workouts (max 12 hours per entry, capped server-side too)
- **Food** — log entries (Date → Yes/No junk food → food name), points awarded/deducted
- **Leaderboard** — every registered user's total points, ranked live
- **Calendar** — month view marking workout days and junk-food days
- **More → Goals** — targets with a deadline, shows days left / overdue
- **More → Daily Routine** — checklist that resets daily
- **More → Water Tracker** — bottle capacity + daily count
- **More → Weight Tracker** — logged weight over time with day-over-day delta
- **More → Calorie Calculator** — BMR/maintenance/cut/bulk estimate (Mifflin-St Jeor), no backend needed
- **More → Weekly Summary** — last 7 days: hours trained, points, junk/clean days, water, day-by-day table
- **More → Monthly Analysis** — pick any month: workout consistency %, points, water, weight change, all-time best streaks

This now has full feature parity with the original web app version.

The JWT is stored with AsyncStorage and attached to every API call automatically. On app
launch, it's validated against `/api/auth/me` — an expired or invalid token silently drops
you back to the login screen.

## Responsive layout

Every screen is wrapped in a shared `ResponsiveContainer` (`src/components/ResponsiveContainer.js`)
that caps content at a comfortable reading width (480px) and centers it on wider screens —
tablets, foldables unfolded, or Expo web. On a normal phone width this has **zero visual
effect** (content already fills the screen), so nothing changes there; it only kicks in once
the screen is wider than a phone. Stat rows and grids also use `flexWrap` so they reflow
instead of overflowing on narrow devices.


