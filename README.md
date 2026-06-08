# Chaty

A full-stack social application built with Next.js (web), Expo (mobile), and Supabase.

## The Problem

Building a social app from scratch means managing user auth, file uploads, real-time messaging, push notifications, and a database — all while keeping costs low. Most solutions lock you into expensive proprietary services or require managing your own servers.

Chaty solves this by leveraging **Supabase's free tier** as the entire backend: PostgreSQL for data, Auth for user management, Storage for media, and Realtime for live messaging — all behind Row-Level Security policies. The frontend runs on Next.js and Expo with a shared TypeScript package.

## How It Works

```
User → Web/Mobile App → Supabase (Auth + DB + Storage + Realtime)
                          ├── Auth: Email/password signup, session management
                          ├── PostgreSQL: Users, posts, likes, comments, stories, follows, conversations, messages, notifications
                          ├── Storage: Images for avatars, posts, stories, messages
                          └── Realtime: Live chat and notification updates via WebSocket subscriptions
```

- **Auth:** Users sign up via Supabase Auth. A database trigger auto-creates their profile row in `users`.
- **Persistence:** All data lives in PostgreSQL tables with Row-Level Security (users can only modify their own data).
- **Realtime:** Supabase Realtime channels push new messages and notifications to connected clients without polling.
- **Storage:** Images are uploaded directly to Supabase Storage buckets with public read access.
- **Push:** An Edge Function relays notification events to Expo's Push API for mobile alerts.

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

## How to Use

### As a User

1. **Sign up** with email, password, username, and display name
2. **Find people** using the search page or browse the feed
3. **Follow users** to see their posts on your feed
4. **Create posts** by uploading photos with captions and location
5. **Like and comment** on posts in the feed
6. **Share stories** that auto-expire after 24 hours
7. **Send direct messages** to any user — conversations sync in real-time
8. **View your activity** — see who liked, commented, or followed you

### As a Developer

See [Quick Start](#quick-start) below to set up your own instance.

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
