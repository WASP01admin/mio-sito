# WASP — World Animal Solidarity Project

Monorepo for the WASP platform: a bilingual (Italian default, English
secondary) animal welfare website with a public site, a private
organization login area, and a future real-time chat feature.

## Structure

```
/wasp-website
  /web            Next.js 14+ app (App Router, TypeScript, Tailwind CSS).
                  Public site + private organization login area.
  /chat-service   Standalone Express + Socket.io backend for a future
                  real-time chat feature. Deliberately decoupled from
                  /web so it can be scaled or deployed independently.
  /shared         Shared TypeScript types/interfaces (Card, Organization,
                  User, ...) used by both /web and /chat-service.
```

The three packages are managed as npm workspaces from this root
`package.json`, so `/shared` is consumed directly by `/web` and
`/chat-service` without needing to be published anywhere.

## Getting started

Install all dependencies once from the repo root:

```bash
npm install
```

### /web — the website

```bash
cp web/.env.example web/.env.local   # fill in Supabase credentials
npm run dev --workspace=@wasp/web
```

Runs at http://localhost:3000. Locales are handled via `next-intl`
(`it` default, `en` secondary) with routes nested under `app/[locale]`.

### /chat-service — the chat backend

```bash
cp chat-service/.env.example chat-service/.env
npm run dev --workspace=@wasp/chat-service
```

Runs at http://localhost:4000 (health check at `/health`). This service
has no chat logic yet — it's an isolated scaffold to build on later.

### /shared — shared types

No build step is needed during development: both `/web` and
`/chat-service` import directly from `@wasp/shared`'s TypeScript source
via the workspace link.

## Environment variables

Each app that needs environment variables has an `.env.example` file
listing what's expected (`web/.env.example`, `chat-service/.env.example`).
Copy it to a real `.env`/`.env.local` file and fill in actual values —
never commit real secrets.
