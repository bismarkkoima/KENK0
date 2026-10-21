# Kenko — health companion

Kenko (健康, "health") is a mobile health companion built with Expo / React Native.
It brings movement, food and mental wellbeing into one place — personalized to your body and
fitness level, with a color-coded tile dashboard (each area of health keeps its own color), a
deep-green-to-black background, glossy 3D accents, light-blue timers and Google Fonts typography
(DM Sans + Source Serif 4) in light and dark mode.

- **Personal plan** — on first launch Kenko asks about your fitness level, focus, height,
  weight and age, and sizes every goal to you (energy from the Mifflin–St Jeor equation, protein
  per kg, water per kg, workouts and steps by level). Beginners start small on purpose.
- **Summary** — a daily quote and an honest "hope stat" built from *your own* history (e.g.
  "40% of your workouts happen on Friday mornings — that's your power slot") or a cited
  research fact; Activity rings (Move, Exercise, Mindful); your week vs. your plan; level,
  points and next badge; step count with an hourly chart (iPhone); mood, nutrition, a suggested
  meditation and water.
- **Home dashboard** — a grid of color-coded tiles (daily boost, daily activity, steps, food,
  heart, mood, hearing, water, cardio load, workouts, rewards, meditation) with a category bar
  for Overview, Activity, Heart, Mind and Food.
- **Activity & sports** — 59 activities in 9 groups (cardio, gym, team, racket, combat, water,
  winter, outdoor, mind & body), each with a calorie estimate for your weight. Start a timer and
  tap Finish when you're done — a live notification shows your time and calories meanwhile —
  or enter a session manually.
- **Health** — daily activity detail, daily cardio load (session-RPE, compared with your own
  4-week average), heart health (30-second pulse timer, resting heart rate and blood pressure
  with AHA categories) and a hearing guide with safe-exposure times.
- **Transfer** — move your history between iPhone and Android, or import from Apple Health
  (workouts, steps, heart readings, mindful minutes), Samsung Health and Google Fit (steps).
- **Meal tracking** — log meals by breakfast / lunch / dinner / snack, scan a product barcode
  or search foods from [Open Food Facts](https://world.openfoodfacts.org) with portion
  scaling, or enter calories and macros manually.
- **Mind** — private mental-health check-ins (mood, stress, energy, sleep, emotions, journal
  and gratitude), guided meditations with spoken guidance, and links to support.
- **Badges & rewards** — 27 badges across movement, consistency, steps, mind and nutrition,
  plus points and levels (Seedling → Legend) that reward effort, not just results.
- **Trends** — week / month / year analysis: workouts, active minutes, steps, active calories,
  distance, mindful minutes, mood, stress and water, each compared with the previous period;
  which weekdays and times you move most; and your workout mix.
- **Backup** — data lives in a local SQLite database on the phone, is included in Android's
  Google backup and iPhone's iCloud Backup, and can be exported to a backup file (save it to
  Google Drive, Files, etc.) and restored.
- **Reminders** — optional daily notifications for meals, workouts, check-ins, meditation and
  water.

All data is stored **on the device** in SQLite. Nothing leaves the phone except food search
queries and scanned barcodes sent to Open Food Facts, and the phone's own Google / iCloud
backup. Kenko never shows statistics about other people — every number is either yours or a
published study with its source. Camera images are never stored.

## Install on your phone

Kenko isn't in the App Store or Google Play yet. There are two ways to get it on a phone today.

### Option 1 — Try it instantly with Expo Go (no build needed)

Best for testing while you develop. Your phone loads the app from your computer, so both must
be on the same Wi-Fi network (or use `npx expo start --tunnel` if they can't be).

1. Install **Expo Go** on your phone:
   [App Store (iPhone)](https://apps.apple.com/app/expo-go/id982107779) ·
   [Google Play (Android)](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. On your computer (needs [Node.js](https://nodejs.org) 22.13 or newer):

   ```bash
   git clone https://github.com/bismarkkoima/KENK0.git
   cd KENK0
   npm install
   npx expo start
   ```

3. Scan the QR code shown in the terminal:
   - **iPhone:** open the Camera app, point it at the QR code and tap the banner.
   - **Android:** open Expo Go and tap **Scan QR code**.

> The store version of Expo Go only runs projects made for the **latest Expo SDK**. Kenko uses
> SDK 58. If Expo Go says the project is incompatible, update Expo Go, or run
> `npx expo install expo@latest --fix` to upgrade the project.

### Option 2 — Install a standalone app (works without a computer)

This builds a real app with [EAS Build](https://docs.expo.dev/build/introduction/), Expo's cloud
build service (free tier available). You need a free [Expo account](https://expo.dev/signup).

```bash
npm install -g eas-cli
eas login
eas build --profile preview --platform android   # or: --platform ios
```

The first build asks you to pick an app identifier (for example `com.yourname.kenko`) — keep
it, because it can't be changed once the app is published.

**Android:** when the build finishes, EAS prints a link and QR code. Open it on the phone,
download the `.apk` and tap it to install. Android will ask you to allow installing apps from
your browser ("Install unknown apps") — allow it once.

**iPhone:** Apple only allows apps from the App Store or registered test devices, so you need
an [Apple Developer account](https://developer.apple.com/programs/) (US$99/year). Then either:

- register your iPhone with `eas device:create`, rebuild with
  `eas build --profile preview --platform ios`, and open the install link on the iPhone; or
- build with `eas build --profile production --platform ios`, upload it with `eas submit`,
  and install it through **TestFlight** (best for sharing with up to 10,000 testers).

### Publishing to the stores

`eas build --profile production` then `eas submit` uploads the app to Google Play (one-time
US$25 developer fee) and the App Store. Both stores review apps before release, and health
apps need a privacy policy. See [Submit to app stores](https://docs.expo.dev/submit/introduction/).

## Compatibility

| Platform | Minimum version | Notes |
| --- | --- | --- |
| **iPhone** | iOS 16.4 or newer | iPhone 8 / SE (2nd gen) and later. Runs on iPad in iPhone mode. |
| **Android** | Android 7.0 (API 24) or newer | Phones from roughly 2016 onward. |
| **Web browser** | Recent Chrome, Edge, Safari or Firefox | For previewing only — see feature table. |

The app works in portrait mode and follows the phone's light / dark setting.

| Feature | iPhone & Android | Web | Needs |
| --- | --- | --- | --- |
| Meal log, goals, progress charts | ✅ | ✅ | — |
| Food search | ✅ | ✅ | Internet connection |
| Barcode scanning | ✅ | ❌ | Camera permission + internet |
| Meditation sessions | ✅ | ✅ | — |
| Spoken guidance | ✅ | ⚠️ depends on browser | A text-to-speech voice (built into iOS and most Android phones; on Android it may need Google Speech Services) |
| Workouts (live timer & manual log) | ✅ | ✅ | — |
| Step count | iPhone: full history · Android: counted while Kenko is open | ❌ | Motion & Fitness / Physical activity permission |
| Mind check-ins & journal | ✅ | ✅ | — |
| Water & mood tracking | ✅ | ✅ | — |
| Reminders | ✅ | ❌ | Notification permission |
| Badges, rewards & trends | ✅ | ✅ | — |
| Google / iCloud automatic backup | ✅ | ❌ | Backup turned on in the phone's settings |
| Backup file export & restore | ✅ | ✅ | — |
| Transfer & imports (Apple Health, Samsung Health, Google Fit) | ✅ | ✅ | The export file from the other app |
| Live workout notification | ✅ (ongoing on Android, quiet updates on iPhone) | ❌ | Notification permission |
| Heart health, cardio load, hearing guide | ✅ | ✅ | — |

Everything except food search and barcode lookups works **offline**. Your data stays on the
phone — deleting the app deletes it, and it doesn't sync between devices yet.

## Development

```bash
npm install
npx expo start
```

Press `i` (iOS simulator, macOS only), `a` (Android emulator), `w` (web), or scan the QR code
with Expo Go.

Checks to run before committing:

```bash
npx tsc --noEmit
npx expo lint
```

## Project layout

```
src/
  app/                    Expo Router screens (every file is a route)
    (tabs)/               Summary, Activity, Food, Mind, Progress tabs
    workout/[type].tsx    Live workout timer
    log-workout.tsx       Log a past workout
    mind-entry.tsx        Mental-health check-in & journal
    profile.tsx           Profile & personalized plan (also first-launch onboarding)
    badges.tsx            Badges, points and levels
    backup.tsx            Backup & restore
    settings.tsx          Settings hub
    add-meal.tsx          Log food modal (search + manual entry)
    scan.tsx              Barcode scanner
    goals.tsx             Daily targets modal
    reminders.tsx         Notification reminders
    session/[id].tsx      Guided meditation player
  components/ui.tsx       Shared UI: Screen, Card, Button, Chip, Field, ProgressBar, Stat
  components/wellness-cards.tsx  Water and mood cards
  components/tip-card.tsx Dismissible hint cards
  data/meditations.ts     Built-in meditation library (scripts + breathing patterns)
  data/workouts.ts        Workout types, MET values and calorie estimates
  data/mind.ts            Emotions, check-in scales and journal prompts
  db/                     SQLite schema migrations and queries
  hooks/                  Theme and data-loading hooks
  lib/                    Dates, Open Food Facts, reminders, insights, profile, stats,
                          badges, motivation, analysis, backup
```

To add a meditation, append an entry to `src/data/meditations.ts`. To change the database,
append a new migration to `src/db/migrations.ts` (never edit a shipped one).

## Roadmap

- Recorded audio narration and ambient sounds for meditations (`expo-audio`)
- Live sync with Apple Health / Health Connect, and iPhone Lock Screen Live Activities
  (both need a native development build)
- GPS routes and pace for outdoor workouts
- Optional accounts and cloud sync (e.g. Supabase)

## Disclaimer

Kenko is a wellness tool, not a medical device, and does not give medical advice. Calorie
figures are estimates. Talk to a qualified professional before making significant changes to
your diet, exercise or health routine. The Mind tab is not a substitute for mental-health care —
if you are struggling, contact a professional or a helpline (see
[findahelpline.com](https://findahelpline.com)); in an emergency, call your local emergency
number.
