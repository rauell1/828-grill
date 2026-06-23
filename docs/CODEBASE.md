# 828 Grill — Codebase Map

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, standalone output) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Database | Neon PostgreSQL (serverless HTTP driver `@neondatabase/serverless`) |
| Auth | Custom HMAC-signed cookie session (bcryptjs, no third-party SDK) |
| State | Zustand (`useUI` for routing, `useCart` for cart) |
| Image hosting | Cloudinary (unsigned upload, client-side direct) |
| Email | Resend (newsletter campaigns) |
| Deployment | Vercel (git push auto-deploys to production) |

---

## Directory Structure

```
src/
├── app/
│   ├── page.tsx                  # Root SPA shell — mounts all views
│   ├── layout.tsx                # HTML shell, fonts, Sonner toaster
│   └── api/
│       ├── auth/
│       │   ├── register/         # POST — bcrypt + insert User + set cookie
│       │   ├── login/            # POST — verify password + set cookie
│       │   ├── logout/           # POST — clear cookie
│       │   └── session/          # GET — verify cookie → return user
│       ├── menu/                 # GET — public menu items
│       ├── checkout/             # POST — create order
│       │   └── confirm/          # POST — confirm payment
│       ├── orders/               # GET — user order history
│       │   └── [id]/             # GET — single order
│       ├── user/                 # GET/PUT — profile
│       ├── upload/               # Deprecated (Cloudinary is client-side now)
│       ├── newsletter/
│       │   └── subscribe/        # POST — public newsletter sign-up
│       └── admin/
│           ├── check/            # GET — isAdmin boolean
│           ├── menu/             # GET/POST — all items
│           │   └── [id]/         # PUT/DELETE — update/remove item
│           └── newsletter/       # GET subscribers + history / POST send
│
├── components/
│   ├── grill/                    # All app UI components
│   │   ├── header.tsx            # Sticky nav, cart button, admin link
│   │   ├── hero.tsx              # Full-screen hero with scroll indicator
│   │   ├── marquee.tsx           # Scrolling ticker
│   │   ├── featured-section.tsx  # Homepage featured items grid
│   │   ├── about-section.tsx     # "Why 828?" with stats
│   │   ├── cta-section.tsx       # Full-bleed CTA with grill image
│   │   ├── newsletter-section.tsx # Public email subscribe form
│   │   ├── menu-section.tsx      # Full menu with category tabs
│   │   ├── menu-card.tsx         # Individual item card with Popular badge
│   │   ├── cart-drawer.tsx       # Slide-in cart
│   │   ├── checkout-view.tsx     # Checkout form + order summary
│   │   ├── auth-view.tsx         # Login / register (shared component)
│   │   ├── account-view.tsx      # User profile + order history
│   │   ├── admin-view.tsx        # Admin CMS (Menu + Newsletter tabs)
│   │   ├── order-confirmation-view.tsx  # Receipt view
│   │   ├── footer.tsx            # Site footer
│   │   ├── image-fallback.tsx    # next/image with error fallback
│   │   └── reveal.tsx            # Intersection-observer fade-in wrapper
│   ├── providers.tsx             # React Query + theme providers
│   └── ui/                       # shadcn/Radix primitives (accordion, dialog…)
│
├── store/
│   ├── ui.ts                     # useUI — view routing, orderId
│   └── cart.ts                   # useCart — items, subtotal, clear
│
└── lib/
    ├── db.ts                     # getSql() — lazy Neon SQL singleton
    ├── session.ts                # HMAC sign/verify for 828-session cookie
    ├── admin.ts                  # getAdminSession() — email allowlist check
    ├── format.ts                 # formatPrice() helper
    ├── utils.ts                  # cn() Tailwind merge
    └── auth/
        ├── server.ts             # auth.getSession() — server component usage
        └── client.ts             # authClient — useSession, signIn, signUp, signOut
```

---

## Auth Flow

```
Register/Login → POST /api/auth/[register|login]
  → bcrypt verify/hash
  → set httpOnly cookie: 828-session = userId.timestamp.hmac-sig
  → client: authClient.useSession() polls /api/auth/session on mount
  → server: auth.getSession() reads cookie via next/headers
```

Cookie is HMAC-SHA256 signed with `AUTH_SECRET` env var (30-day expiry).

---

## Admin Access

`ADMIN_EMAILS` env var (comma-separated). Defaults to `royokola3@gmail.com` if unset.  
Check flow: `getAdminSession()` in `src/lib/admin.ts` → used by all `/api/admin/*` routes and the `GET /api/admin/check` endpoint that drives the header Admin link.

---

## Image Upload (Cloudinary)

Upload happens entirely client-side — browser POSTs directly to:
```
https://api.cloudinary.com/v1_1/{NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload
```
Using an **unsigned preset** (`NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`). No server route involved. The returned `secure_url` is stored in `MenuItem.imageUrl`.

---

## Newsletter

Two subscriber sources merged at send time:
- `User.newsletterSubscribed = true` (opted in at registration)
- `NewsletterSubscriber` table (public form on homepage)

Send flow: `POST /api/admin/newsletter` → Resend `batch.send()` (50/batch) → record in `NewsletterCampaign`.

---

## Checkout (Current State)

The checkout is **mock/test mode** — card fields are UI-only, no real Stripe SDK is wired. The flow:
1. `POST /api/checkout` — creates `Order` row with `status: 'pending'` and a `mock_${timestamp}` stripeId
2. `POST /api/checkout/confirm` — sets `status: 'confirmed'`

Real Stripe integration is the next planned milestone.

---

## Key Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | HMAC key for session cookies |
| `ADMIN_EMAILS` | ❌ | Comma-separated admin emails (defaults to owner email) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | ✅ for upload | Cloudinary cloud name |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | ✅ for upload | Unsigned upload preset name |
| `RESEND_API_KEY` | ✅ for email | Resend API key |
| `NEWSLETTER_FROM` | ❌ | Sender address (defaults to newsletters@828grill.com) |
