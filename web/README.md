# web

WASP's public website and private organization login area. Next.js
(App Router) + TypeScript + Tailwind CSS, internationalized with
`next-intl` (`it` default, `en` secondary).

Run from the repo root: see the [root README](../README.md) for setup.

## Folder structure

- `app/[locale]` — routes, nested under a locale segment
- `components` — shared React components
- `lib` — client wiring (e.g. Supabase)
- `styles` — global CSS
- `messages` — `it.json` / `en.json` translation files
- `i18n` — `next-intl` routing/navigation/request config
- `proxy.ts` — locale-detection proxy (Next.js 16's renamed `middleware.ts`)
