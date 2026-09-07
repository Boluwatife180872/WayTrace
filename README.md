# WayTrace

A real-time delivery tracking mobile application built with React Native and Expo. WayTrace lets users follow their packages from dispatch to doorstep with live map tracking, driver details, and a full delivery history — even when offline.

## The Problem

Most delivery tracking experiences are fragmented: you get a static confirmation page, maybe a single "out for delivery" status, and then you wait. There's no real visibility into where your package is, who's delivering it, or how long it'll actually take. When you lose internet connection, you lose everything.

## The Goal

WayTrace was built to solve this by giving users a single, polished screen where they can watch their delivery move in real time on a map — complete with an animated truck marker, route visualization, ETA countdown, and driver contact options. The app also works seamlessly offline by caching delivery data locally, so you're never left in the dark.

## Features

- **Live Map Tracking** — Animated truck marker moving along a polyline route with origin and destination pins
- **Real-Time Status Updates** — Push-based updates via Supabase Realtime with progress bar and ETA
- **Driver Profile** — View your driver's name, avatar, and reach them via chat or call
- **Delivery History** — Searchable, filterable list of all past deliveries with status badges and thumbnails
- **Offline Support** — SQLite local cache so the app works without an internet connection
- **Demo Simulation** — Built-in simulator to run test deliveries end-to-end without a real backend
- **Network Awareness** — Detects connectivity changes and shows offline/online banners
- **Authentication** — Secure login and signup powered by Supabase Auth

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 54 + React Native 0.81 |
| Styling | NativeWind (Tailwind CSS) |
| Navigation | Expo Router (file-based) |
| Backend | Supabase (Auth, Database, Realtime, Edge Functions) |
| State | Zustand + TanStack React Query |
| Maps | react-native-maps |
| Offline | expo-sqlite |
| Lists | @shopify/flash-list |

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- A [Supabase](https://supabase.com) project with the database schema set up

### Installation

```bash
git clone <your-repo-url>
cd WayTrace
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running the App

```bash
npx expo start
```

Scan the QR code with Expo Go, or press `a` for Android emulator / `i` for iOS simulator.

### Demo Mode

The app includes a built-in simulator. Open the tracking screen, tap the **Demo** button, and press **Run** to watch a delivery play out in real time — no backend setup required for the demo.

To seed test data into your Supabase instance:

```bash
cd simulator
npm install
node seed-history.js
```

## Project Structure

```
WayTrace/
├── app/                    # Expo Router screens
│   ├── (auth)/             # Login & Signup
│   ├── (app)/              # Main app screens
│   │   ├── index.tsx       # Live tracking map
│   │   ├── profile.tsx     # User profile
│   │   └── history/        # Delivery history list + detail
│   └── _layout.tsx         # Root layout
├── hooks/                  # Custom React hooks
│   ├── use-delivery.ts     # Active delivery + realtime subscription
│   ├── use-history.ts      # Delivery history query
│   └── use-profile.ts      # User profile fetch/update
├── lib/                    # Core utilities
│   ├── supabase.ts         # Supabase client init
│   ├── local-db.ts         # SQLite caching layer
│   ├── demo.ts             # Simulation hook
│   └── network-store.ts    # Connectivity state
├── stores/                 # Zustand stores
│   └── auth.ts             # Authentication state
├── types/                  # TypeScript types
│   ├── database.ts         # Supabase DB schema types
│   ├── delivery.ts         # Delivery & tracking types
│   └── profile.ts          # User profile types
├── simulator/              # Demo seed scripts
└── assets/                 # Images, icons, splash screens
```

## Database Schema

The Supabase database has three core tables:

- **profiles** — User accounts (id, name, email, avatar)
- **deliveries** — Active deliveries with live location, route, progress, and driver info
- **delivery_history** — Completed deliveries with status, price, thumbnails, and route snapshots

## License

Private project. All rights reserved.
