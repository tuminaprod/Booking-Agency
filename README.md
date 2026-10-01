# Oriel — Stays & Journeys

A premium travel-booking platform for **hotels, trips, destinations and experiences** (no flights), built with Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS v4.

All properties, people and bookings are fictional demo data. No real payments are taken.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm test           # pricing, promotions, cancellation & refund-workflow tests
npm run build && npm start
```

Demo accounts (traveller with sample bookings, and an admin) can be filled in with one click on `/auth/sign-in`; credentials live in `src/lib/data/users.ts`.

Test cards at checkout: `4242 4242 4242 4242` (approved), `4000 0000 0000 0002` (declined), `4000 0000 0000 9995` (insufficient funds), `4000 0000 0000 0119` (processing error). Promo codes are listed on `/deals` (`SUMMER25` is intentionally expired).

## Architecture

```
src/
  lib/models/        Domain models (User, Hotel, HotelRoom, Booking, Payment, Price, Availability, …)
  lib/data/          Demo data: 16 destinations, 28 hotels, 12 trips, 20 experiences, guides, promotions, reviews
  lib/booking/       Framework-free booking engine
    pricing.ts       Single source of truth for money: base → discounts → extras → taxes → fees → total
    availability.ts  Deterministic inventory & dynamic nightly rates
    quote.ts         Turns a selection into a validated, priced quote (runs on client AND server)
    promotions.ts    Promo validation · cancellation.ts refund rules · schema.ts zod validation
  lib/admin/         Refund workflow state machine (requested → approved → processing → refunded)
  lib/search/        Typed hotel search query ⇄ URL, autocomplete ranking
  lib/auth/          AuthAdapter interface + local demo adapter (swap for a real provider)
  lib/stores/        Persisted client stores (wishlist, recently viewed, search history, bookings, prefs)
  server/            "Backend": repositories, hotel search, bookings pipeline, payment gateway adapter
  app/api/           Route handlers: hotel search, suggestion index, bookings, promo validation
  components/        Design system (ui/), layout, search, cards, map, booking, admin, …
```

**Pricing transparency.** Every price surface (cards, room list, booking panel, checkout, confirmation, admin) renders the same itemised `Price` object. Mandatory fees are included in totals from the first search result; fees collected at the property are shown separately from "pay now".

**Server-authoritative booking.** `POST /api/bookings` re-validates input, re-prices with the same engine, re-checks availability, rejects if the total differs from what the customer saw, then charges through `server/payments.ts`.

**Map.** `components/map` defines a provider-agnostic `MapViewProps` contract. The bundled `SchematicMap` is clearly labelled as approximate; swap the export in `components/map/index.ts` for a Mapbox/MapLibre/Google implementation.

**Persistence.** Demo data is in-memory; auth, wishlist and bookings made in the browser persist to `localStorage`. Replace `src/server/*` repositories and the auth adapter to connect a real database.

**SEO.** Per-page metadata, canonical URLs, Open Graph, JSON-LD (Hotel/Resort, TouristTrip, Product, TouristDestination, Article, BreadcrumbList), `sitemap.xml` and `robots.txt`. Private routes are `noindex`.

## Design system

See `design-system/oriel/MASTER.md`. Tokens live in `src/app/globals.css` (`@theme`).
