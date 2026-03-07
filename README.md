# Team-7-
GIT Hack Attack

React Native + Expo monorepo: one codebase for **web** and **iOS**.

## Setup

```bash
npm install
```

## Run

| Target | Command |
|--------|---------|
| **Web** (dev server) | `npm run web` |
| **iOS** (simulator / device) | `npm run ios` |
| **Android** | `npm run android` |
| **Expo dev menu** (choose platform) | `npm start` |

## Supabase

The app uses the **Supabase JS client** (not a direct Postgres connection). Your Postgres details (host `db.shgpurjhwftjvjeyalgv.supabase.co`, port 5432, user `postgres`) are for the database itself; the client uses the **project URL** and **anon key**.

1. **Get the anon key:** Supabase Dashboard → your project → **Settings** → **API** → copy the `anon` (or **Publishable**) key.
2. **Create `.env`** from the example and set the key:
   ```bash
   cp .env.example .env
   # Edit .env and set EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. **Use the client** in your app:
   ```ts
   import { supabase } from './lib/supabase';
   const { data } = await supabase.from('your_table').select();
   ```

For direct Postgres (migrations, scripts, or a backend), use the connection string from Dashboard → **Settings** → **Database** (e.g. `postgresql://postgres:[PASSWORD]@db.shgpurjhwftjvjeyalgv.supabase.co:5432/postgres`). Never put the DB password in the app; use the anon key only.

## Structure

- `App.tsx` – root component (shared)
- `lib/supabase.ts` – Supabase client (reads from `.env`)
- `app.json` – Expo config (name, icons, iOS/Android/Web)
- Use `Platform.OS === 'web'` or platform-specific files (`.ios.tsx` / `.web.tsx`) when you need divergence.

## iOS dev

- **Simulator:** Xcode installed → `npm run ios` opens iOS simulator.
- **Device:** Expo Go app + same WiFi, or [EAS Build](https://docs.expo.dev/build/introduction/) for standalone builds.

## Web

- `npm run web` → dev server (default port 8081); build with `npx expo export --platform web` for static export.
