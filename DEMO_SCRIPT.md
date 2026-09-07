# WayTrace - Demo Script & Talking Points

---

## What is WayTrace?

WayTrace is a real-time delivery tracking mobile app built with React Native and Expo. It lets users track their deliveries on a live map, view delivery history, and get real-time status updates — all with offline support so it works even with a bad or no internet connection.

Think of it like the tracking experience you get from Uber Eats or Amazon, but as a standalone, focused tracking app.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Expo SDK 54 + React Native 0.81 | Modern RN with new architecture, fast builds |
| Routing | Expo Router (file-based) | Type-safe, intuitive navigation |
| Styling | NativeWind (Tailwind CSS) | Rapid UI development, consistent design |
| Backend & DB | Supabase | Auth, Postgres DB, Realtime, Edge Functions — all in one |
| Server State | TanStack React Query | Caching, polling, background refetch |
| Client State | Zustand | Lightweight global state for auth & network |
| Offline | expo-sqlite | Local SQLite cache for offline-first |
| Maps | react-native-maps | Native map with animated markers |
| Lists | @shopify/flash-list | Performant scrolling for delivery history |

---

## "How did you build this?"

I used Expo SDK 54 with Expo Router for file-based routing. The app has a clear structure:

- **Auth screens** — login and signup under `(auth)/`
- **App screens** — tracking map, history list, order detail, and profile under `(app)/`
- A **root layout** that handles authentication gating — if you're logged in, you see the app; if not, you see auth screens.

The UI is built entirely with NativeWind (Tailwind CSS for React Native), which let me build a polished, consistent interface quickly.

For the backend, I chose **Supabase** because it gives me a Postgres database, authentication, realtime subscriptions, and serverless Edge Functions — all from a single platform. There's no separate API server to maintain.

---

## "How does the app communicate with the backend?"

All backend communication goes through the **Supabase JavaScript client**. There is no custom REST API — I use Supabase's built-in query builder directly from React hooks.

For example, to fetch a delivery:

```typescript
const { data, error } = await supabase
  .from("deliveries")
  .select("*")
  .eq("user_id", userId)
  .single();
```

For the **active delivery tracking screen**, I use three strategies simultaneously:

1. **React Query polling** — refetches every 5 seconds as a baseline
2. **Supabase Realtime** — subscribes to Postgres changes via WebSockets for instant position updates
3. **SQLite cache** — stores the last known delivery state locally so the screen loads instantly even offline

When the app detects a network reconnection (via `@react-native-community/netinfo`), it automatically invalidates stale queries to sync fresh data.

The **delivery simulation** (used for demos) runs as a Supabase Edge Function — a Deno serverless function that walks a truck along route waypoints, updating the database every 2 seconds.

---

## "How did you handle authentication?"

Authentication is managed through **Supabase Auth** with a **Zustand store** (`stores/auth.ts`) as the single source of truth for session state.

Key points:

- **Sign in / Sign up** — standard email + password via `supabase.auth.signInWithPassword()` and `supabase.auth.signUp()`. On signup, a profile row is also created in the `profiles` table.
- **Session persistence** — sessions are stored in `AsyncStorage` with auto-refresh enabled, so users stay logged in across app restarts.
- **Route protection** — the root layout uses Expo Router's `Stack.Protected` with a guard on the session object. If `session` exists, the app group renders; if not, the auth group renders. No auth logic leaks into screens.
- **Edge Function auth** — the simulation Edge Function validates the user's JWT by calling `admin.auth.getUser()` with the service role key, ensuring users can only trigger simulations for their own deliveries.

The auth store also listens to `onAuthStateChange` to react to token refreshes or sign-outs from other tabs/devices.

---

## "How did you manage state?"

I use a **three-layer state management** approach:

1. **Zustand** — for global client state that isn't tied to the server:
   - `useAuthStore` — session, loading state, auth actions (signIn, signUp, signOut)
   - `useNetworkStore` — connectivity status fed by NetInfo, used app-wide

2. **TanStack React Query** — for all server state:
   - Active delivery data (polling + realtime)
   - Delivery history list
   - Handles caching, background refetch, stale-while-revalidate, and error states automatically

3. **Local `useState` / `useCallback`** — for screen-level UI state:
   - Search filters, form inputs, loading states, demo panel toggle

This separation means React Query owns all server data, Zustand owns truly global UI state, and local state handles ephemeral concerns. There's no prop drilling — hooks provide everything components need.

---

## "How did you handle errors?"

I use different error handling strategies depending on the context:

- **Server data fetching** (React Query): Supabase errors are thrown as `Error` objects inside `queryFn`, which React Query catches and surfaces via `query.error`. Screens render explicit error states with retry buttons. For example, the history screen computes a `ScreenState` type (`loading | success | empty | error | offline | refreshing`) to render the appropriate UI.

- **Auth operations** (Zustand store): Errors are returned as `{ error: string | null }` instead of thrown. The login/signup screens display inline error messages from this.

- **Client-side validation**: Forms validate inputs before calling the backend — empty fields, password length checks, etc.

- **Race conditions**: The order detail screen uses a `let active = true` flag pattern inside `useEffect` to prevent setting state on unmounted components.

- **Offline scenarios**: The app detects connectivity via NetInfo and shows contextual UI — an orange banner on the tracking screen, a full offline card with retry on the history screen.

- **Edge Functions**: Return structured JSON error responses with proper HTTP status codes (401, 400, 403, 404, 500).

---

## "How did you make it responsive across different screen sizes?"

The app is **portrait-only** (set in `app.json`), which simplifies responsiveness significantly. Beyond that:

- **NativeWind / Tailwind** handles most layout concerns with flexbox utilities (`flex-1`, `flex-row`, `items-center`, etc.) that adapt to screen sizes automatically.
- **SafeAreaProvider + SafeAreaView** on every screen ensures content avoids notches, status bars, and home indicators across iOS and Android.
- **KeyboardAvoidingView** on auth screens adjusts behavior per platform (`"padding"` on iOS, `"height"` on Android) so forms stay usable when the keyboard opens.
- **Dynamic insets** — the tab bar calculates bottom padding based on platform and safe area insets to look correct on devices with and without home indicators.
- **Dimensions API** is used sparingly for the decorative map header on the detail screen.
- **FlashList** for history handles variable list lengths performantly.

Since this is a focused mobile app (not a web app), the primary concern was making it work well on phones from iPhone SE to large Android devices — which the flex-based NativeWind approach handles naturally.

---

## Quick Demo Flow (2-3 minutes)

1. **Login** — show the auth screen, log in with demo credentials
2. **Tracking screen** — point out the live map, animated truck marker, route polyline, driver card, ETA, and progress bar
3. **Run the simulation** — open the demo panel and hit "Run" to show the truck moving along the route in real time. Mention: "This calls a Supabase Edge Function that simulates a truck driving through Lagos, updating the database every 2 seconds."
4. **Offline support** — toggle airplane mode, show the offline banner, then reconnect and show auto-sync
5. **Delivery history** — navigate to history, show the list with search, status badges, pull-to-refresh, and skeleton loading
6. **Order detail** — tap into an order to show the timeline stepper, order info, and decorative map preview
7. **Profile** — show the profile screen with logout confirmation
8. **Auth flow** — log out and show the signup screen with validation

---

## Key Technical Highlights to Emphasize

- **Realtime + polling + offline cache** — three-layer data strategy ensures the user always sees delivery updates
- **Zero custom API** — Supabase handles everything: DB, auth, realtime, and serverless functions
- **TypeScript strict mode** throughout the project
- **New Architecture** enabled in Expo 54 for better performance
- **React Compiler** enabled for automatic memoization
- **EAS Build** for CI/CD with dev, preview, and production channels
