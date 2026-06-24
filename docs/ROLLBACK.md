# 828 Grill — Rollback Guide

All deployments are triggered by `git push origin master`. Vercel builds automatically.  
To rollback: revert the commit, push, Vercel redeploys in ~60s.

---

## Quick Rollback Commands

```bash
# See recent commits
git log --oneline -20

# Revert a specific commit (safe — creates a new commit)
git revert <commit-hash>
git push origin master

# Hard rollback to a specific point (destructive — only if you're sure)
git reset --hard <commit-hash>
git push --force origin master
```

---

## Milestone Snapshots

| Commit | Description | Key files changed |
|---|---|---|
| `67a6bbf` | Switch image upload to Cloudinary | `admin-view.tsx`, `next.config.ts` |
| `190732f` | Image upload + newsletter admin + opt-in | `admin-view.tsx`, `auth-view.tsx`, `api/admin/newsletter/`, `api/upload/` |
| `e2cd781` | Admin access restricted to owner email | `src/lib/admin.ts` |
| `6c41eea` | Custom cookie auth (replaces broken Neon Auth beta) | `src/lib/auth/`, `src/lib/session.ts`, `api/auth/*` |

---

## Rolling Back the Auth System

The auth rewrite (`6c41eea`) replaced `@neondatabase/auth@0.4.2-beta`. Do **not** revert to it — the SDK is broken and causes registration failures. The custom auth is stable.

---

## Rolling Back Database Schema Changes

Database changes are applied lazily (via `IF NOT EXISTS` in API routes) and are non-destructive.  
If you need to remove newsletter tables:

```sql
-- Remove public subscriber table
DROP TABLE IF EXISTS "NewsletterSubscriber";

-- Remove campaign history table
DROP TABLE IF EXISTS "NewsletterCampaign";

-- Remove opt-in column from users
ALTER TABLE "User" DROP COLUMN IF EXISTS "newsletterSubscribed";
```

Run these in the Neon console at console.neon.tech → your project → SQL Editor.

---

## Vercel Rollback (via Dashboard)

1. Go to vercel.com → 828-grill project → Deployments
2. Find the last known-good deployment
3. Click the `⋯` menu → **Promote to Production**

This is instant and doesn't require a git commit.

---

## Environment Variable Rollback

If a bad env var causes issues:
1. Vercel dashboard → 828-grill → Settings → Environment Variables
2. Edit or delete the problematic variable
3. Trigger a redeploy: push an empty commit or click **Redeploy** in the Deployments tab


## Deployment Snapshots (auto-updated)

<!-- AUTO:snapshots -->
| Commit | Date (UTC) | Description | Files changed |
|--------|------------|-------------|---------------|
| `7283f15` | 2026-06-24 12:25 UTC | fix(header): solid bg on non-home views; add pt-16 to menu s | src/components/grill/header.tsx, src/components/grill/menu-section.tsx |
|--------|------------|-------------|---------------|
| `e7be683` | 2026-06-23 21:24 UTC | Fix admin order visibility for guest checkouts and improve m | bun.lock, package-lock.json, package.json, prisma/schema.prisma, src/app/api/admin/orders/[id]/route.ts, src/app/api/admin/orders/route.ts, src/app/globals.css, src/components/grill/admin-view.tsx |
|--------|------------|-------------|---------------|
| `6a7038a` | 2026-06-23 19:08 UTC | feat: tip, guest checkout, inventory stock, tax env var + au | .github/workflows/update-docs.yml, docs/CODEBASE.md, docs/ROLLBACK.md, docs/SITEMAP.md, scripts/update-docs.js, src/app/api/admin/menu/[id]/route.ts, src/app/api/admin/menu/route.ts, src/app/api/admin/orders/[id]/route.ts |
|--------|------------|-------------|---------------|
| `cb3778b` | 2026-06-23 19:07 UTC | docs: update README, SITEMAP, CODEBASE to reflect full featu | README.md, docs/CODEBASE.md, docs/SITEMAP.md |
<!-- /AUTO:snapshots -->