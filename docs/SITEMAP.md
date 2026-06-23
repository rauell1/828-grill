# 828 Grill — Sitemap

> Single-page application (SPA). All views render under `/` via Zustand `view` state. The only true URL is the root.

---

## Frontend Views (`view` state in `useUI`)

| View key | Rendered component | Auth required |
|---|---|---|
| `home` | Hero → Marquee → Featured → About → CTA → Newsletter | No |
| `menu` | Full menu grid with category filter | No |
| `checkout` | Cart review + payment form | **Yes** (redirects to login) |
| `login` | Sign in form | No (redirects to account if already signed in) |
| `register` | Create account form + newsletter opt-in | No |
| `account` | Profile, order history, sign out | **Yes** |
| `order` | Order confirmation / receipt | **Yes** |
| `admin` | Admin CMS (Menu Items + Newsletter tabs) | **Admin only** |

---

## API Routes

### Public

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/menu` | Fetch all available menu items |
| `POST` | `/api/newsletter/subscribe` | Public newsletter sign-up (email only) |

### Auth

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Create account (name, email, password, phone?, address?, newsletterSubscribed?) |
| `POST` | `/api/auth/login` | Sign in, sets `828-session` cookie |
| `POST` | `/api/auth/logout` | Clear session cookie |
| `GET` | `/api/auth/session` | Verify cookie → return current user |

### Authenticated

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/checkout` | Create order + mock payment session |
| `POST` | `/api/checkout/confirm` | Confirm order → set status to `confirmed` |
| `GET` | `/api/orders` | Fetch orders for logged-in user |
| `GET` | `/api/orders/[id]` | Fetch single order detail |
| `GET/PUT` | `/api/user` | Get / update user profile |

### Admin only

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/admin/check` | Returns `{ isAdmin: bool }` |
| `GET` | `/api/admin/menu` | All menu items (including unavailable) |
| `POST` | `/api/admin/menu` | Create new menu item |
| `PUT` | `/api/admin/menu/[id]` | Update menu item fields |
| `DELETE` | `/api/admin/menu/[id]` | Hard-delete (or soft-delete if has orders) |
| `GET` | `/api/admin/newsletter` | Subscriber list + campaign history |
| `POST` | `/api/admin/newsletter` | Send email campaign via Resend |

---

## Database Tables

| Table | Purpose |
|---|---|
| `User` | Registered accounts (bcrypt password, phone, address, newsletterSubscribed) |
| `MenuItem` | Menu catalogue (name, description, price, category, imageUrl, available, popular) |
| `Order` | Customer orders (userId, total, status, stripeId) |
| `OrderItem` | Line items per order (orderId, menuItemId, quantity, unitPrice) |
| `NewsletterCampaign` | Record of every sent campaign (subject, body, sentAt, recipientCount) |
| `NewsletterSubscriber` | Public subscribers (non-registered users who opted in via frontend form) |
