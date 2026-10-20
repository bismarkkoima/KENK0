# Kenko — health companion

Kenko (健康, "health") is a mobile health companion built with Expo / React Native.
It brings three habits into one place:

- **Meal tracking** — log meals by breakfast / lunch / dinner / snack, search foods from
  [Open Food Facts](https://world.openfoodfacts.org) with portion scaling, or enter
  calories and macros manually. Re-log recent foods in one tap.
- **Meditation guides** — guided sessions (breathing, calm, focus, sleep) with an animated
  breathing circle, step-by-step prompts and a session timer. Completed minutes are logged
  automatically.
- **Progress analytics** — 7- and 30-day charts for calories and mindful minutes against
  your goals, activity streaks, and plain-language insights.

All data is stored **on the device** in SQLite. Nothing leaves the phone except food search
queries sent to Open Food Facts.

## Getting started

```bash
npm install
npx expo start
```

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
    goals.tsx             Daily targets modal
    session/[id].tsx      Guided meditation player
  components/ui.tsx       Shared UI: Screen, Card, Button, Chip, Field, ProgressBar, Stat
  data/meditations.ts     Built-in meditation library (scripts + breathing patterns)
  db/                     SQLite schema migrations and queries
  hooks/                  Theme and data-loading hooks
  lib/                    Date helpers, Open Food Facts client
```

To add a meditation, append an entry to `src/data/meditations.ts`. To change the database,
append a new migration to `src/db/migrations.ts` (never edit a shipped one).

## Roadmap

- Barcode scanning with `expo-camera`
- Audio narration for meditations (`expo-audio`) and reminders (`expo-notifications`)
- Mood / energy journal and water tracking
- Apple Health / Health Connect sync (steps, sleep, weight)
- Optional accounts and cloud sync (e.g. Supabase)

## Disclaimer

Kenko is a wellness tool, not a medical device, and does not give medical advice. Talk to a
qualified professional before making significant changes to your diet or health routine.
