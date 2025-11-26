# Cowi Mobile Shell

Expo Router project that wraps the existing Cowi Flow OS web app inside a React Native WebView. Goal: ship mobile access in minutes while leaving room for native features later.

## Getting started

```bash
cd apps/mobile
npm install
npx expo start --tunnel
```

Or from repo root: `npm run mobile`.

## Configuration

The app reads these environment variables (set via `.env` or shell):

- `MOBILE_BASE_URL` – default URL loaded by the WebView (prod).
- `MOBILE_STAGE_URL` – optional staging fallback exposed in the settings screen.

You can change the active URL inside the app under **Settings → Base URL**. Values persist via AsyncStorage.

## Folder structure

- `app/_layout.tsx` – Expo Router navigation stack.
- `app/index.tsx` – WebShell screen with the WebView.
- `app/settings.tsx` – Native settings page for base URL switching.
- `app.config.ts` – Expo config + extra metadata.

Future native modules (notifications, uploads, offline logs) can live under `features/*` and gradually replace WebView routes.
