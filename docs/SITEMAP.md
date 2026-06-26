# 828 Grill — Sitemap

Single-page application. All views render under `/` via Zustand `view` state. No client-side URL changes.

---

## Customer Views

| View key | Component | Auth | Description |
|----------|-----------|------|-------------|
| `home` | Landing sections | No | Hero → Marquee → Featured → About → CTA → Newsletter → Footer |
| `menu` | `MenuSection` | No | Full menu with category filter, item detail modals, sticky mobile cart bar |
| `checkout` | `CheckoutView` | Yes | Delivery info → masked promo code → Stripe payment → confirmation |
| `login` | `AuthView` | No | Email + password login |
| `register` | `AuthView` | No | Registration with newsletter opt-in |
| `account` | `AccountView` | Yes | Profile, order history with reorder, account settings |
| `order` | `OrderConfirmationView` | Yes | Order status tracking |

### Static routes (real URL)
| Route | Description |
|-------|-------------|
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |

---

## Admin Views

Activated when `view = 'admin'` — available only to emails listed in `ADMIN_EMAILS`.

| Tab key | Description |
|---------|-------------|
| `live` | Real-time KDS board — one-tap status advance (Pending → Preparing → Ready), auto-refresh every 30s |
| `menu` | CRUD for menu items — name, price, category, allergens, image (Cloudinary), availability, featured toggle |
| `orders` | Full order history — expand for line items, customer info, notes; update status |
| `promos` | Create / activate / pause / disable / delete promo codes (% or flat $, max uses, expiry) |
| `customers` | All registered users with order count, LTV, avg food/service rating, contact info |
| `feedback` | Customer reviews — avg ratings (food / service / overall), individual comments with order link |
| `newsletter` | Compose & send campaigns via Resend; subscriber list; campaign history |
| `analytics` | Revenue KPIs, 30-day trend chart, top/least popular items, category split, top customers by LTV |

---

## API Routes

### Public
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/menu` | All available menu items |
| GET | `/api/hours` | Restaurant hours + open/closed status |
| GET | `/api/promo?code=X` | Validate promo code (returns discount type + value) |
| POST | `/api/newsletter/subscribe` | Public newsletter signup |
| POST | `/api/newsletter/unsubscribe` | Unsubscribe |

### Auth (unauthenticated endpoints)
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/auth/register` | Create account + send verification email |
| POST | `/api/auth/login` | Login → set `828-session` cookie |
| POST | `/api/auth/logout` | Clear session cookie |
| GET | `/api/auth/session` | Get current session user |
| POST | `/api/auth/verify` | Verify email with token |
| POST | `/api/auth/resend-verification` | Resend verification email |

### Authenticated
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/user` | Get profile |
| PUT | `/api/user` | Update name, phone, address, newsletter opt-in |
| POST | `/api/checkout` | Create order + Stripe PaymentIntent |
| POST | `/api/checkout/confirm` | Confirm payment |
| GET | `/api/orders` | Order history (includes items, category) |
| GET | `/api/orders/[id]` | Single order detail |
| POST | `/api/feedback` | Submit food + service rating |

### Admin only
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/admin/check` | Verify admin status |
| GET | `/api/admin/menu` | All items including unavailable |
| POST | `/api/admin/menu` | Create item |
| PUT | `/api/admin/menu/[id]` | Edit item |
| DELETE | `/api/admin/menu/[id]` | Delete item |
| GET | `/api/admin/orders` | All orders (`?live=1` for active only with items inline) |
| PUT | `/api/admin/orders/[id]` | Update order status |
| GET | `/api/admin/promo` | List all promo codes |
| POST | `/api/admin/promo` | Create promo code |
| PUT | `/api/admin/promo/[id]` | Update status / value / limits |
| DELETE | `/api/admin/promo/[id]` | Delete promo code |
| GET | `/api/admin/analytics` | Revenue KPIs + chart data |
| GET | `/api/admin/customers` | Customer list + metrics |
| GET | `/api/admin/feedback` | Feedback summary + individual reviews |
| GET | `/api/admin/newsletter` | Subscriber list + campaign history |
| POST | `/api/admin/newsletter` | Send campaign to all subscribers |

### Webhooks
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/webhooks/stripe` | Stripe payment confirmation |

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `"User"` | Accounts — email, bcrypt password, phone, address, verified, newsletterSubscribed |
| `"MenuItem"` | Menu catalogue — name, price, category, image, allergens, available, popular |
| `"Order"` | Orders — userId, total, discount, promoCode, stripeId, status, notes |
| `"OrderItem"` | Line items — orderId, menuItemId, quantity, unitPrice |
| `"Feedback"` | Ratings — orderId, foodRating, serviceRating, comment |
| `"NewsletterSubscriber"` | Public (non-account) email signups |
| `"NewsletterCampaign"` | Sent campaign log — subject, sentAt, recipientCount |
| `"PromoCode"` | Discount codes — code, discountType, discountValue, status, usedCount, maxUses, expiresAt |

---

## All API routes (auto-generated — do not edit this section)

<!-- AUTO:api-routes -->
| Method | Route |
|--------|-------|
| GET | `/api/admin/analytics` |
| GET | `/api/admin/check` |
| GET | `/api/admin/customers` |
| GET | `/api/admin/feedback` |
| GET/POST | `/api/admin/menu` |
| PUT/DELETE | `/api/admin/menu/[id]` |
| GET/POST | `/api/admin/newsletter` |
| GET | `/api/admin/orders` |
| GET/PUT | `/api/admin/orders/[id]` |
| GET/POST | `/api/admin/promo` |
| PUT/DELETE | `/api/admin/promo/[id]` |
| GET/POST | `/api/admin/reports` |
| GET/DELETE | `/api/admin/reports/[id]` |
| GET/POST | `/api/auth/[...path]` |
| POST | `/api/auth/login` |
| POST | `/api/auth/logout` |
| POST | `/api/auth/register` |
| POST | `/api/auth/resend-verification` |
| GET | `/api/auth/session` |
| GET | `/api/auth/verify` |
| POST | `/api/checkout` |
| POST | `/api/checkout/confirm` |
| GET/POST | `/api/feedback` |
| GET | `/api/hours` |
| GET | `/api/menu` |
| POST | `/api/newsletter/subscribe` |
| GET | `/api/newsletter/unsubscribe` |
| GET | `/api/orders` |
| GET | `/api/orders/[id]` |
| GET | `/api/promo` |
| POST | `/api/upload` |
| GET/PUT | `/api/user` |
| POST | `/api/webhooks/stripe` |
<!-- /AUTO:api-routes -->
