# 828 Grill — Codebase Map

Architecture reference. Last updated to reflect the full feature set as of the promo code + live KDS release.

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js 16 App Router | Single physical URL `/`, all views via Zustand |
| Language | TypeScript 5 | Strict mode |
| Styling | Tailwind CSS v4 | Custom dark design system; no component library |
| State | Zustand 5 | `ui.ts` (routing + modals) · `cart.ts` (persisted localStorage) |
| Database | Neon PostgreSQL | `@neondatabase/serverless` HTTP driver, raw SQL, no ORM |
| Auth | Custom HMAC cookies | `bcryptjs` password hashing; stateless signed tokens |
| Payments | Stripe | PaymentIntents + Elements; mock fallback if key absent |
| Email | Resend | Verification emails + newsletter campaigns |
| Images | Cloudinary | Free tier, client-side unsigned upload |
| Deploy | Vercel | `master` branch → auto-deploy to production |

---

## Directory Structure

```
src/
├── app/
│   ├── layout.tsx                    Root layout (fonts, Vercel Analytics)
│   ├── page.tsx                      SPA entry — renders active Zustand view
│   ├── privacy/page.tsx              Privacy policy (static)
│   ├── terms/page.tsx                Terms of service (static)
│   └── api/
│       ├── auth/                     register · login · logout · session · verify · resend-verification
│       ├── menu/                     GET — public available items
│       ├── hours/                    GET — open/closed status + today's hours
│       ├── promo/                    GET ?code= — validate promo code
│       ├── checkout/                 POST — create order + Stripe PaymentIntent
│       │   └── confirm/              POST — finalize payment
│       ├── orders/                   GET — user order history
│       │   └── [id]/                 GET — single order detail
│       ├── feedback/                 POST — food + service rating
│       ├── user/                     GET/PUT — profile
│       ├── newsletter/               subscribe · unsubscribe
│       ├── webhooks/stripe/          POST — Stripe payment webhook
│       └── admin/
│           ├── check/                GET — isAdmin boolean
│           ├── menu/                 GET/POST — all items
│           │   └── [id]/             PUT/DELETE
│           ├── orders/               GET (supports ?live=1) / PUT status
│           │   └── [id]/
│           ├── promo/                GET/POST — promo code list + create
│           │   └── [id]/             PUT/DELETE — status toggle + delete
│           ├── analytics/            GET — KPIs + 30-day chart data
│           ├── customers/            GET — all users + metrics
│           ├── feedback/             GET — review dashboard
│           └── newsletter/           GET subscribers + history / POST send
│
├── components/grill/
│   ├── header.tsx                    Sticky nav — cart icon, auth, admin link
│   ├── hero.tsx                      Full-screen landing hero
│   ├── marquee.tsx                   Animated scrolling ticker
│   ├── featured-section.tsx          Popular items grid (links to item detail modal)
│   ├── menu-section.tsx              Full menu — category filter, sticky mobile cart bar
│   ├── menu-card.tsx                 Item card — click opens ItemDetailModal
│   ├── item-detail-modal.tsx         Full-screen item detail, qty stepper, add to cart
│   ├── cart-drawer.tsx               Side-sheet cart with qty controls
│   ├── checkout-view.tsx             3-step checkout: info → payment → confirmation
│   │                                 PromoField: masked (type="password") promo input
│   │                                 Stripe Elements or mock card form
│   ├── auth-view.tsx                 Login + register forms
│   ├── account-view.tsx              Profile, order history, reorder button
│   ├── order-confirmation-view.tsx   Order status display
│   ├── about-section.tsx             Brand story
│   ├── cta-section.tsx               "Order now" call-to-action
│   ├── newsletter-section.tsx        Public email signup
│   ├── footer.tsx                    Hours, links, social icons
│   ├── cookie-consent.tsx            GDPR consent banner
│   ├── admin-view.tsx                Admin CMS — all 8 tabs (live/menu/orders/promos/
│   │                                 customers/feedback/newsletter/analytics)
│   ├── admin-live-orders.tsx         Real-time KDS board — grouped by status,
│   │                                 one-tap status advance, 30s auto-refresh
│   ├── admin-orders.tsx              Full order history table + status updates
│   └── admin-analytics.tsx           Revenue charts + KPI cards (recharts)
│
├── store/
│   ├── ui.ts                         useUI — view, orderId, cartOpen
│   └── cart.ts                       useCart — items array (persisted localStorage)
│
└── lib/
    ├── db.ts                         getSql() — lazy Neon serverless singleton
    ├── session.ts                    signToken / verifyToken (HMAC-SHA256)
    ├── admin.ts                      getAdminSession() — checks ADMIN_EMAILS
    ├── format.ts                     formatPrice, shortId
    ├── hours.ts                      isOpen(), getTodayHours() (Asheville ET)
    ├── email.ts                      Resend wrapper — verification + order emails
    ├── rate-limit.ts                 IP-based rate limiter for auth routes
    ├── utils.ts                      cn() (clsx + tailwind-merge)
    └── auth/
        ├── server.ts                 auth.getSession() — reads cookie server-side
        └── client.ts                 useSession hook — client components
```

---

## Key Patterns

### SPA Routing

No `Link` or `router.push`. Navigation goes through Zustand:

```ts
const { setView } = useUI();
setView('checkout');
```

`page.tsx` renders the component matching `useUI().view`.

### Auth

Stateless HMAC-signed cookies (`828-session`). No DB session table.

```
Register → bcrypt hash → INSERT "User" → signToken(userId) → Set-Cookie
Login    → bcrypt compare              → signToken(userId) → Set-Cookie
Request  → verifyToken(cookie)         → { user }
Admin    → verifyToken + email ∈ ADMIN_EMAILS → { admin }
```

### Database

Raw SQL, Neon HTTP driver, PascalCase quoted table names:

```ts
const sql = getSql();
const rows = await sql`SELECT * FROM "MenuItem" WHERE available = true`;
```

Schema bootstrapped inline with `CREATE TABLE IF NOT EXISTS`. No migration runner.

### Promo Codes

1. Admin creates → `POST /api/admin/promo` → `"PromoCode"` row, `status = 'active'`
2. Customer enters code → `GET /api/promo?code=X` → validates status + limits
3. Order placed → `POST /api/checkout` re-validates + applies discount + increments `usedCount` (non-blocking)
4. Checkout input uses `type="password"` — characters masked while typing

### Admin Live Orders

`admin-live-orders.tsx` polls `GET /api/admin/orders?live=1` every 30s. Returns only active orders with items inline. Each card shows elapsed time with colour coding (green <8m, yellow 8–18m, red >18m). "Mark [Next]" button advances status in one tap.

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Neon connection string |
| `AUTH_SECRET` | Yes | HMAC key for session cookies |
| `ADMIN_EMAILS` | Yes | Comma-separated admin emails |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary image upload |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Yes | Cloudinary unsigned preset |
| `RESEND_API_KEY` | Yes | Email (Resend) |
| `NEWSLETTER_FROM` | Yes | Sender address for campaigns |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional | Stripe — mock checkout if absent |
| `STRIPE_SECRET_KEY` | Optional | Stripe |
| `STRIPE_WEBHOOK_SECRET` | Optional | Stripe webhook verification |
| `TAX_RATE` | Optional | Tax rate as decimal (default `0.08` = 8%) — server-side |
| `NEXT_PUBLIC_TAX_RATE` | Optional | Same rate exposed to client for display (default `0.08`) |

---

## What Is and Is Not Implemented

### Done
- Full customer ordering flow (browse → cart → checkout → confirmation)
- Item detail modals with quantity stepper
- Sticky mobile cart bar
- Promo codes: DB-backed, admin-managed, masked checkout input
- Reorder from account history
- Post-order feedback (food + service ratings)
- Order status emails (preparing / ready / delivered / cancelled) via Resend
- Admin live KDS board (grouped by status, one-tap advance, auto-refresh)
- Admin menu CRUD with Cloudinary image upload + stock count management
- Admin promo code management (create, activate, pause, disable, delete)
- Admin analytics (revenue, 30-day trend, top items, category split, top customers)
- Admin customer directory with metrics
- Admin reviews dashboard
- Admin newsletter compose + send (Resend, batched)
- Email verification on registration
- Cookie consent banner
- Restaurant hours display + open/closed status
- Tip option at checkout (15% / 18% / 20% / custom)
- Guest checkout (no account required — name + email collected)
- Configurable tax rate via environment variables
- Inventory stock counts (admin-set per item; "Only N left" badge; auto-hidden at 0)

### Not Yet Implemented
- Loyalty points / rewards system
- Item customization (modifiers, add-ons, substitutions)
- Scheduled / pre-orders ("pickup at 6pm")
- SMS notifications
- Admin activity audit log

---

## Component files (auto-generated — do not edit this section)

<!-- AUTO:components -->
- `about-section.tsx`
- `account-view.tsx`
- `admin-analytics.tsx`
- `admin-live-orders.tsx`
- `admin-orders.tsx`
- `admin-view.tsx`
- `auth-view.tsx`
- `cart-drawer.tsx`
- `checkout-view.tsx`
- `cookie-consent.tsx`
- `cta-section.tsx`
- `featured-section.tsx`
- `footer.tsx`
- `header.tsx`
- `hero.tsx`
- `image-fallback.tsx`
- `item-detail-modal.tsx`
- `marquee.tsx`
- `menu-card.tsx`
- `menu-section.tsx`
- `newsletter-section.tsx`
- `order-confirmation-view.tsx`
- `reveal.tsx`
<!-- /AUTO:components -->
