# Function 5 – Mobile Accessibility (React Native / Expo)

Goal: ship an Expo-powered companion app that initially wraps the existing web experience via WebView (for parity in < 10 minutes) while laying the groundwork for native modules (push, camera, offline) later.

## Architecture

1. **Monorepo structure** (proposed):
   - `apps/web` → current Next.js project (this repo).
   - `apps/mobile` → new Expo project (managed workflow) consuming shared UI + constants from `packages/ui` / `packages/lib` (future step).
   - Short term we can colocate an `apps/mobile` folder with Expo config referencing the deployed web URL.

2. **WebView shell**:
   - Use Expo Router + `react-native-webview` component.
   - `WebView` loads `https://{VERCEL_DEPLOYMENT_URL}` (fall back to local dev via env toggle).
   - Inject custom headers (Supabase anon key) only if needed; otherwise rely on existing auth by embedding the hosted app.
   - Provide custom user agent `cowi-mobile/{version}` for server-side feature flags.

3. **Session handling**:
   - Option A: rely on Supabase auth hosted page (cookie-based) via WebView; user signs in once per device.
   - Option B: embed Supabase Auth UI natively (future). Outline tokens stored in Expo SecureStore.

4. **Navigation scaffolding**:
   - `app/_layout.tsx` defines a stack with two screens: `WebShell` (default) and `Settings` (native page for toggles).
   - Settings page exposes: change base URL (prod/stage/local), log out (clear cookies), view agent status.

5. **Config & env**:
   - `apps/mobile/app.config.ts` reads `MOBILE_BASE_URL`, `MOBILE_STAGE_URL`, `SENTRY_DSN`, etc.
   - Document `.env.mobile` usage.

6. **Native upgrade path**:
   - Identify modules to break out later: Notifications (Expo Notifications), Camera uploads (Expo Camera), Offline logs (SQLite via Expo SQLite).
   - Encourage shared TypeScript models by exporting from `packages/types` (current `lib/types.ts` to be published as package or path alias).

## Immediate tasks

1. Create `apps/mobile` via `npx create-expo-app` (managed). Add scripts in root `package.json` (`dev:mobile`, `start:mobile`).
2. Install `react-native-webview`, `expo-secure-store`, `expo-system-ui` inside mobile app.
3. Implement `WebShell` component with loading indicator + offline fallback.
4. Add native Settings screen (simple React Native UI) with base URL picker stored in AsyncStorage.
5. Add README instructions for developers: how to run Expo app, configure URLs, connect to Supabase.

## Security / cost

- When embedding the web app, ensure only public assets load; sensitive env remains server-side.
- If injecting tokens into WebView, prefer short-lived service tokens, never long-lived keys.
- Use Expo OTA updates to push UI tweaks without App Store review.

## Future native roadmap

1. **Push notifications** – subscribe to Supabase Edge Functions or Vercel webhooks, deliver via Expo Push.
2. **Offline command queue** – queue `agent_events` from mobile (if we expose mobile agent features) using SQLite.
3. **Camera-to-prompt uploads** – integrate Expo Camera to attach screenshots/videos to rooms.
4. **Native navigation** – eventually rebuild key flows (wizard, console) using shared service layer instead of WebView.

## Migration plan: WebView → fully native

1. **Extract shared services**
   - Hoist `lib/ai-client.ts`, Supabase helpers, and prompt types into a future `packages/shared-services` workspace package.
   - Re-export the same hooks for both Next.js and Expo so screens can call identical data fetchers.

2. **Hybrid navigation**
   - Keep the WebView as the default route but register parallel native stacks (e.g., `/project/[id]`, `/room/[id]`).
   - Introduce a feature flag in `apps/mobile/app.config.ts` to opt users into the new native stacks one surface at a time.

3. **Push + realtime**
   - Install `expo-notifications` and reuse the existing Supabase channel IDs; store Expo push tokens next to existing agent identities.
   - Mirror the `room_participants` presence events using Supabase Realtime (same table schema, new channel names).

4. **Camera & uploads**
   - Wrap `expo-image-picker` / `expo-camera` inside a `useAttachmentPicker` hook that posts to `/api/projects/[id]/assets`.
   - Share validation logic with the web uploader by reusing the Zod schemas inside `lib/types.ts`.

5. **Offline flow**
   - Use `expo-sqlite` to cache prompts, rooms, and unsent commands. Serialize payloads with the same DTOs that the web app uses.
   - Sync queued actions via the `/api/agent/events` endpoint once connectivity returns.

This sequence lets us sunset the WebView gradually: spin up a native screen, redirect a subset of routes, and finally remove the `react-native-webview` dependency when parity is reached.
