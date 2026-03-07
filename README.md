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

## Structure

- `App.tsx` – root component (shared)
- `app.json` – Expo config (name, icons, iOS/Android/Web)
- Use `Platform.OS === 'web'` or platform-specific files (`.ios.tsx` / `.web.tsx`) when you need divergence.

## iOS dev

- **Simulator:** Xcode installed → `npm run ios` opens iOS simulator.
- **Device:** Expo Go app + same WiFi, or [EAS Build](https://docs.expo.dev/build/introduction/) for standalone builds.

## Web

- `npm run web` → dev server (default port 8081); build with `npx expo export --platform web` for static export.
