# 828 Grill

> Fire-kissed flavors. Dark grill-house ordering.  
> Full-stack online ordering system for 828 Grill LLC, Asheville NC.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-000?logo=vercel&logoColor=white)](https://828-grill.vercel.app)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-000?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Neon PostgreSQL](https://img.shields.io/badge/Database-Neon_PostgreSQL-00e699?logo=postgresql&logoColor=white)](https://neon.tech)

---

## What is this?

828 Grill is a production food ordering SPA. Customers browse the menu, tap items for full detail, add to cart, apply promo codes, and pay via Stripe. The admin has a full CMS: live kitchen display, menu management, promo code control, order history, customer analytics, feedback reviews, and newsletter campaigns — all in one dark-mode dashboard.

---

## Features

### Customer-facing

| Feature | Status |
|---------|--------|
| Menu browse with category filter and search | Live |
| Item detail modal — image, description, allergens, qty stepper | Live |
| Shopping cart with real-time subtotal | Live |
| Sticky mobile cart bar | Live |
| Promo code input (masked) — DB-backed, admin-controlled | Live |
| Stripe checkout (PaymentIntents + Elements) | Live |
| Mock checkout (runs without Stripe keys) | Live |
| Order confirmation + estimated wait time | Live |
| Order history + reorder with one tap | Live |
| Post-order feedback (food + service ratings) | Live |
| User registration with email verification | Live |
| Login / logout | Live |
| Profile management (name, phone, address, newsletter pref) | Live |
| Public newsletter signup | Live |
| Restaurant hours + open/closed banner | Live |
| Cookie consent (GDPR) | Live |

### Admin dashboard

| Tab | Description | Status |
|-----|-------------|--------|
| Live Orders | Real-time KDS board — new orders auto-refresh, one-tap status advance, colour-coded elapsed time | Live |
| Menu | Full CRUD — name, price, category, description, allergens, image (Cloudinary), availability toggle, featured badge | Live |
| Orders | Full history — expand for line items, notes, customer info; update status | Live |
| Promos | Create codes (% or flat $), set max uses + expiry, activate / pause / disable / delete | Live |
| Customers | All users — order count, LTV, avg food/service rating, contact info | Live |
| Reviews | Avg ratings dashboard + individual feedback comments | Live |
| Newsletter | Compose and send campaigns via Resend; subscriber list; campaign history | Live |
| Reports | Revenue KPIs, 30-day trend chart, top/least popular items, category split, top customers | Live |

---

## Tech Stack

```
Frontend    Next.js 16 App Router + Tailwind CSS v4
Database    Neon PostgreSQL (serverless HTTP driver)
Auth        Custom HMAC-signed cookies + bcryptjs
Payments    Stripe PaymentIntents + Elements
State       Zustand (SPA routing + cart)
Images      Cloudinary (client-side unsigned upload)
Email       Resend (verification + newsletter campaigns)
Deployment  Vercel (auto-deploy on git push to master)
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              SPA root — renders the active Zustand view
│   ├── privacy/              Privacy policy
│   ├── terms/                Terms of service
│   └── api/
│       ├── auth/             register · login · logout · session · verify
│       ├── menu/             Public menu fetch
│       ├── hours/            Open/closed status
│       ├── promo/            Customer promo code validation
│       ├── checkout/         Order creation + Stripe PaymentIntent
│       ├── orders/           Order history + single order detail
│       ├── feedback/         Post-order ratings
│       ├── user/             Profile read/write
│       ├── newsletter/       Public subscribe/unsubscribe
│       ├── webhooks/stripe/  Stripe webhook
│       └── admin/            CMS routes (menu · orders · promos · analytics
│                             · customers · feedback · newsletter)
├── components/grill/         All page + admin components
├── store/                    Zustand stores (ui, cart)
└── lib/                      DB, auth, session, email, hours, utils
```

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/rauell1/828-grill.git
cd 828-grill
npm install
```

### 2. Set environment variables

Create `.env.local`:

```env
# Required
DATABASE_URL=your_neon_connection_string
AUTH_SECRET=any-long-random-string

# Admin access
ADMIN_EMAILS=your@email.com

# Image upload (Cloudinary free tier)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
NEWSLETTER_FROM=noreply@yourdomain.com

# Stripe (optional — app runs with mock checkout if not set)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxx
STRIPE_SECRET_KEY=sk_live_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx
```

### 3. Run locally

```bash
npm run dev
# App starts at http://localhost:3000
```

---

## Deployment

```bash
git push origin master
# Vercel auto-deploys to production in ~60s
```

Vercel is connected to the `master` branch — no manual deploy commands needed.

---

## Admin Access

Sign in with an email from the `ADMIN_EMAILS` list and the **Admin** link appears in the header.

To add admins, update `ADMIN_EMAILS=email1@x.com,email2@x.com` in Vercel environment variables.

---

## Database Schema

```sql
"User"                 -- Accounts (bcrypt password, phone, address, verified, newsletterSubscribed)
"MenuItem"             -- Menu catalogue (name, price, category, image, allergens, available, popular)
"Order"                -- Orders (userId, total, discount, promoCode, stripeId, status, notes)
"OrderItem"            -- Line items (orderId, menuItemId, quantity, unitPrice)
"Feedback"             -- Ratings (orderId, foodRating, serviceRating, comment)
"NewsletterSubscriber" -- Public (non-account) newsletter signups
"NewsletterCampaign"   -- Sent campaign log (subject, sentAt, recipientCount)
"PromoCode"            -- Discount codes (code, discountType, discountValue, status, usedCount, maxUses, expiresAt)
```

Schema is managed inline via `CREATE TABLE IF NOT EXISTS` — no migration runner needed.

---

## Roadmap

- [x] Stripe integration — PaymentIntents + Elements + webhook
- [x] Admin live kitchen display (KDS board)
- [x] Admin orders dashboard — full history + status management
- [x] Admin analytics — revenue, top items, customers, charts
- [x] Promo code system — admin-managed, DB-backed, masked checkout input
- [x] Post-order feedback (food + service ratings)
- [x] Customer reorder from account history
- [x] Item detail modals + sticky mobile cart bar
- [ ] Order-ready email notification to customer
- [ ] Loyalty / rewards points
- [ ] Item customization (modifiers, add-ons)
- [ ] Guest checkout (no login required)
- [ ] Tip option at checkout

---

## Docs

| Document | Description |
|----------|-------------|
| [`docs/SITEMAP.md`](docs/SITEMAP.md) | All views, routes, and DB tables |
| [`docs/CODEBASE.md`](docs/CODEBASE.md) | Architecture deep-dive |
| [`docs/ROLLBACK.md`](docs/ROLLBACK.md) | How to revert deployments |

---

## License

Private — 828 Grill LLC. All rights reserved.
