# Chaty

A full-stack Instagram-like social application built with Next.js (web), Expo (mobile), and Supabase.

## Tech Stack

- **Web:** Next.js 16 (App Router), React 19, Tailwind CSS v4
- **Mobile:** Expo SDK 56 (development builds), Expo Router
- **Shared:** TypeScript, Zod schemas, Turborepo monorepo
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Push:** Expo Push API via Supabase Edge Function

## Features

- **Auth:** Email/password signup and login with auto-profile creation
- **Posts:** Image upload, captions, location tags
- **Feed:** Infinite-scroll post feed with stories row at top
- **Stories:** 24-hour ephemeral stories with auto-advance viewer
- **Likes:** Optimistic UI with animated heart toggle
- **Comments:** Inline comment sheet per post
- **Follow/Unfollow:** User search and follow management
- **DMs:** Real-time messaging with conversation list
- **Notifications:** Like, comment, follow, message alerts with push

## Prerequisites

- Node.js 20+
- npm 10+
- A Supabase project (free tier works)

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/wyllade/Chaty-App.git
cd Chaty-App
npm install

# 2. Copy environment files
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env.local
```

Edit both `.env.local` files with your Supabase project credentials.

### 3. Run Database Migration

Open your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql/new) and paste the contents of `setup.sql`, then click **Run**.

After migration, create these storage buckets in **Supabase Dashboard → Storage**:
- `avatars` (public)
- `posts` (public)
- `stories` (public)
- `messages` (public)

Enable Realtime in **Database → Replication** for tables: `messages`, `notifications`.

### 4. Start Development

```bash
# Web app
cd apps/web && npm run dev

# Mobile (separate terminal)
cd apps/mobile && npx expo start
```

## Project Structure

```
Chaty-App/
├── apps/
│   ├── web/          # Next.js web application
│   │   └── src/app/(main)/   # Authenticated pages
│   │       ├── feed, create, search, messages, stories, profile, activity
│   │   └── src/app/auth/     # Login/Signup
│   ├── mobile/       # Expo React Native app
│   └── ...           # (mirrors web structure)
├── packages/
│   └── shared/       # Shared types, schemas, constants, utilities
├── supabase/
│   ├── migrations/   # Database migration files
│   └── functions/    # Edge Functions (push notifications)
├── setup.sql         # Full database schema (one-shot migration)
└── turbo.json        # Turborepo configuration
```

## Branches

| Branch | Focus |
|--------|-------|
| `main` | Complete project |
| `phase-1-auth` | Project setup + authentication |
| `phase-2-posts` | Posts, feed, likes, comments |
| `phase-3-stories` | Stories with viewer |
| `phase-4-follow` | User profiles, follow/unfollow |
| `phase-5-dms` | Real-time direct messages |
| `phase-6-notifications` | Notifications + push tokens |

## License

MIT
