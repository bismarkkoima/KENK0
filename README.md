# Kenko — health companion

Kenko (健康, "health") is a mobile health companion built with Expo / React Native.
It brings three habits into one place:

- **Meal tracking** — log meals by breakfast / lunch / dinner / snack, scan a product barcode
  or search foods from [Open Food Facts](https://world.openfoodfacts.org) with portion
  scaling, or enter calories and macros manually. Re-log recent foods in one tap.
- **Meditation guides** — guided sessions (breathing, calm, focus, sleep) with an animated
  breathing circle, spoken guidance (text-to-speech, can be muted), step-by-step prompts and
  a session timer. Completed minutes are logged automatically.
- **Water & mood** — one-tap water logging and a daily mood check-in with an optional note.
- **Reminders** — optional daily notifications for meals, meditation and water.
- **Progress analytics** — 7- and 30-day charts for calories, mood, mindful minutes and water,
  activity streaks, and insights that link your mood to your habits (e.g. "your mood averages
  4.7/5 on days you meditate, vs 2.3 on days you don't").

All data is stored **on the device** in SQLite. Nothing leaves the phone except food search
queries and scanned barcodes sent to Open Food Facts. Camera images are never stored.

## Getting started

```bash
npm install
npx expo start
```

Barcode scanning, reminders and voice guidance need a phone (Expo Go or a development
build); on web they're hidden or show a note.

Then press `i` (iOS simulator), `a` (Android emulator), `w` (web), or scan the QR code with
Expo Go on your phone.

Checks to run before committing:

```bash
npx tsc --noEmit
npx expo lint
```

## Project layout

```
src/
  app/                    Expo Router screens (every file is a route)
    (tabs)/               Today, Food, Meditate, Progress tabs
    add-meal.tsx          Log food modal (search + manual entry)
    scan.tsx              Barcode scanner
    goals.tsx             Daily targets modal
    reminders.tsx         Notification reminders
    session/[id].tsx      Guided meditation player
  components/ui.tsx       Shared UI: Screen, Card, Button, Chip, Field, ProgressBar, Stat
  components/wellness-cards.tsx  Water and mood cards
  data/meditations.ts     Built-in meditation library (scripts + breathing patterns)
  db/                     SQLite schema migrations and queries
  hooks/                  Theme and data-loading hooks
  lib/                    Dates, Open Food Facts client, reminders, insights
```

To add a meditation, append an entry to `src/data/meditations.ts`. To change the database,
append a new migration to `src/db/migrations.ts` (never edit a shipped one).

## Roadmap

- Recorded audio narration and ambient sounds for meditations (`expo-audio`)
- Apple Health / Health Connect sync (steps, sleep, weight)
- Optional accounts and cloud sync (e.g. Supabase)

## Disclaimer

Kenko is a wellness tool, not a medical device, and does not give medical advice. Talk to a
qualified professional before making significant changes to your diet or health routine.
