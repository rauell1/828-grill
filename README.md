# 🔥 828 Grill

> **Fire-kissed flavors. Dark grill-house ordering.**  
> A full-stack online ordering system for 828 Grill LLC, Asheville NC.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-000?logo=vercel&logoColor=white)](https://828-grill.vercel.app)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-000?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Neon PostgreSQL](https://img.shields.io/badge/Database-Neon_PostgreSQL-00e699?logo=postgresql&logoColor=white)](https://neon.tech)

---

## What is this?

828 Grill is a full dark-mode ordering SPA. Customers browse the menu, add to cart, and check out. The admin has a full CMS to manage items, images, pricing, and send email newsletters to subscribers.

---

## Features

| Feature | Status |
|---|---|
| 🍔 Full menu with category filtering | ✅ Live |
| 🛒 Cart with real-time subtotal | ✅ Live |
| 💳 Checkout with order creation | ✅ Live (mock payment — Stripe WIP) |
| 🔐 Custom cookie-based auth (register / login) | ✅ Live |
| 👤 Account + order history | ✅ Live |
| 🛠 Admin CMS — create / edit / delete menu items | ✅ Live |
| 🖼 Image upload via Cloudinary | ✅ Live |
| 📧 Newsletter — admin compose & send via Resend | ✅ Live |
| 📬 Public newsletter subscribe (homepage) | ✅ Live |
| 💰 Real Stripe payment integration | 🔜 Next milestone |
| 📋 Admin orders dashboard | 🔜 Next milestone |

---

## Tech Stack

```
Frontend    Next.js 16 App Router + Tailwind CSS v4
Database    Neon PostgreSQL (serverless HTTP driver)
Auth        Custom HMAC-signed cookies + bcryptjs
State       Zustand (routing + cart)
Images      Cloudinary (free, client-side unsigned upload)
Email       Resend (newsletter campaigns)
Deployment  Vercel (auto-deploy on git push)
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # SPA root — all views live here
│   └── api/                  # All API routes
│       ├── auth/             # register · login · logout · session
│       ├── menu/             # Public menu fetch
│       ├── checkout/         # Order creation + confirmation
│       ├── orders/           # Order history
│       ├── newsletter/       # Public subscribe
│       └── admin/            # CMS routes (menu CRUD + newsletter send)
├── components/grill/         # All page components
├── store/                    # Zustand stores (ui, cart)
└── lib/                      # DB client, auth, session helpers
```

---

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/rauell1/828-grill.git
cd 828-grill
npm install
```

### 2. Set environment variables

Create a `.env.local` file:

```env
# Required
DATABASE_URL=your_neon_connection_string
AUTH_SECRET=any-long-random-string

# Admin access
ADMIN_EMAILS=royokola3@gmail.com

# Image upload (Cloudinary free tier)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset

# Newsletter (Resend free tier)
RESEND_API_KEY=re_xxxxxxxxxxxx
NEWSLETTER_FROM=noreply@yourdomain.com
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

No manual deploy commands needed — Vercel is connected to the `master` branch.

---

## Admin Access

Visit the site, sign in with an admin email (`royokola3@gmail.com` by default), and the **Admin** link appears in the header.

To add more admins, set `ADMIN_EMAILS=email1@x.com,email2@x.com` in Vercel environment variables.

### Admin capabilities
- ✏️ Create / edit / delete menu items
- 🔄 Toggle item availability and Popular badge in one click
- 🖼 Upload images from device (Cloudinary) or paste a URL
- 📧 Compose and send newsletter campaigns to all subscribers
- 📊 View subscriber count and past campaign history

---

## Newsletter Setup

Two ways users subscribe:
1. **Homepage form** — anyone can enter their email without registering
2. **Registration checkbox** — opt in when creating an account

Both sources are merged and deduplicated when the admin sends a campaign.

---

## Database Schema

```sql
"User"                 -- Accounts (bcrypt password, phone, address, newsletterSubscribed)
"MenuItem"             -- Menu catalogue
"Order"                -- Customer orders
"OrderItem"            -- Order line items
"NewsletterCampaign"   -- Sent campaign log
"NewsletterSubscriber" -- Public (non-registered) newsletter signups
```

Schema is managed inline via `CREATE TABLE IF NOT EXISTS` — no migration runner needed.

---

## Roadmap

- [ ] **Stripe integration** — real card processing, webhooks
- [ ] **Admin orders dashboard** — live order feed + full history
- [ ] **Order status updates** — email notifications when order is ready
- [ ] **Loyalty / promo codes** — discount engine
- [ ] **Mobile app** (React Native)

---

## Docs

| Document | Description |
|---|---|
| [`docs/SITEMAP.md`](docs/SITEMAP.md) | All routes and views |
| [`docs/CODEBASE.md`](docs/CODEBASE.md) | Architecture deep-dive |
| [`docs/ROLLBACK.md`](docs/ROLLBACK.md) | How to revert deployments |

---

## License

Private — 828 Grill LLC. All rights reserved.
