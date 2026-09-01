# Alignment Report — Nature's Nectar Wellness

**Purpose:** Reverse-study the AI-built codebase, align it with `docs/system_blueprint.md`, and chart a path to deployment.

**Date:** August 31, 2026

---

## Executive Summary

| Area | Status |
|------|--------|
| Foundation (Next.js, Prisma, Tailwind, Zod) | ✅ Mostly done |
| Database schema & order history | ✅ Strong match to blueprint |
| Storefront (browse, cart, checkout, WhatsApp) | ✅ Core flow works |
| Admin v1 (`/admin`) | ✅ Functional but monolithic |
| Admin v2 (`/admin2`) | ⚠️ WIP — build fixed, still incomplete |
| Delivery quote workflow | ⚠️ Schema exists, **no admin UI/API** |
| Cloudinary uploads | ❌ Not implemented |
| Soft deletion | ⚠️ Uses `isActive` only — partial |
| Security hardening | ⚠️ Gaps on unprotected routes |
| Deployment | ❌ Not production-ready |
| Documentation | ❌ Default Next.js README |

**V1 success metric from blueprint:** *Customer submits order → continues on WhatsApp → owner manages it efficiently.*

That path is largely built. What's missing is operational polish, security fixes, and deployment.

---

## Phase 0: Local Baseline (Half Day)

**Goal:** Get a reproducible dev environment before reading code deeply.

```powershell
# 1. Start Postgres
docker compose up -d

# 2. Ensure .env exists with at minimum:
# DATABASE_URL, DIRECT_DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL
# NEXT_PUBLIC_WHATSAPP_NUMBER

# 3. Migrate + seed + create admin
npx prisma migrate dev
npx tsx scripts/seed.ts
npm run create-admin

# 4. Run dev
npm run dev
```

**Walk the happy path manually:**
1. Browse `/products` → add to cart → `/checkout` → submit
2. Click WhatsApp on success screen
3. Login `/admin/login` → manage catalog, orders, payments

**Document what you observe** in a simple `docs/current_state.md` (your notes, not AI-generated). This anchors your mental model.

---

## Phase 1: Reverse-Study the System (1–2 Days)

Don't read files randomly. Follow **data flow**, not folder order.

### 1.1 Read in this order (90 minutes)

| Order | File(s) | Why |
|-------|---------|-----|
| 1 | `docs/system_blueprint.md` | North star |
| 2 | `prisma/schema.prisma` | Business truth — entities & relationships |
| 3 | `src/app/(storefront)/` routes | Customer-facing surface |
| 4 | `src/features/checkout/` + `src/store/cart.store.ts` | Core conversion flow |
| 5 | `src/server/services/order.service.ts` | Order business logic |
| 6 | `src/server/repositories/` | DB access patterns |
| 7 | `src/app/api/` routes | HTTP boundary |
| 8 | `src/server/auth/` | Admin protection model |
| 9 | `src/features/admin/` | Current operational UI |

### 1.2 Draw two diagrams (pen and paper or Excalidraw)

**Customer flow:**
```
Browse → Cart (Zustand) → Checkout Form → POST /api/orders
  → order.service.submitOrder → Prisma transaction
  → WhatsApp message returned → CheckoutSuccess CTA
```

**Admin flow:**
```
Login (Better Auth) → /admin → Catalog CRUD + Orders + Payments
  → PATCH /api/orders/[id] (status)
  → PATCH /api/payments/[id]/verify
```

### 1.3 Trace one request end-to-end

Pick checkout submission. Follow:
`CheckoutForm` → `useCheckout` → `checkout-client.service` → `POST /api/orders` → `order.service.submitOrder` → `order.repository.createOrderRequest`

This single trace teaches you 80% of the architecture conventions.

### 1.4 Map features to blueprint checklist

Use the 17 "Required V1 Systems" from `docs/system_blueprint.md` as a spreadsheet. Mark each: **Done / Partial / Missing / Broken**.

---

## Phase 2: Gap Analysis — Blueprint vs Reality

### Critical (blocks or blocked deployment)

| Issue | Location | Fix |
|-------|----------|-----|
| ~~**Build fails**~~ | `admin-v2` imports non-existent `apiClient` | ✅ Fixed — uses `readApiData` |
| ~~**Empty route files**~~ | `admin2/orders/page.tsx`, `admin2/orders/[id]/page.tsx` | ✅ Fixed — placeholder pages added |
| **Unprotected admin API** | `/api/admin2/dashboard` — no `requireAdminRequest` | Add auth guard |
| **Unprotected PATCH** | `PATCH` on `/api/orders/route.ts` has no admin auth | Remove dead handler or add auth (proper one is on `[id]/route.ts`) |
| **admin2 has no auth** | `admin2/layout.tsx` — no `requireAdminPage()` | Add protection or don't ship admin2 yet |

### Functional gaps (V1 incomplete)

| Gap | Blueprint says | Current state |
|-----|----------------|---------------|
| **Delivery quote workflow** | Admin confirms delivery fee manually | Schema has `deliveryFee`, `deliveryQuoteNotes` — **no admin UI to set them** |
| **Order status transitions** | PENDING → REVIEWING_DELIVERY → AWAITING_PAYMENT → … | Status enum exists; admin can PATCH status, but no guided workflow |
| **Cloudinary** | Image uploads for products | Products store `image` as URL string only — **no upload integration** |
| **Soft deletion** | Blueprint requires it | Products use `isActive` flag — acceptable V1 compromise |
| **WhatsApp number hardcoded** | Env-driven | `Navbar.tsx` hardcodes `254757122299`; rest uses `NEXT_PUBLIC_WHATSAPP_NUMBER` |

### Code quality / drift signals

| Signal | What it means |
|--------|---------------|
| Two admin areas (`/admin` + `/admin2`) | Agent started refactor, didn't finish — **pick one** |
| Duplicate `AddToCartButton` in `cart/` and `products/` | Copy-paste drift |
| `cancelOrder` checks `"COMPLETED"`, `"REFUNDED"` | Invalid enum values — dead code bug |
| `OrderStatusHistory.id` has no `@default(cuid())` | May fail at runtime when creating history |
| Default README | No project-specific onboarding |
| No `.env.example` | Can't onboard or deploy without guessing |

### What's actually good (don't rewrite)

- Prisma schema matches blueprint closely (order snapshots, status enums, payment model)
- Layered backend is clean and consistent
- Checkout + WhatsApp integration is wired correctly
- Admin v1 is ugly but **operationally usable**
- Env validation with Zod in `env.server.ts`
- SEO metadata on product/category pages
- Production build passes after admin2 stabilization fixes

---

## Phase 3: Stabilize Before Building (1 Day)

**Rule:** Fix what's broken before adding features.

### Priority order

1. **Decision: admin v1 vs admin v2**
   - **Recommended:** Ship with `/admin` (v1) for V1. Park or delete `admin2` until you understand v1 fully.

2. **Fix security holes**
   - Add `requireAdminRequest` to any admin API missing it
   - Remove the orphaned unauthenticated `PATCH` on `/api/orders/route.ts`

3. **Fix schema bug**
   - Add `@default(cuid())` to `OrderStatusHistory.id`

4. **Unify WhatsApp config**
   - Replace hardcoded number in `Navbar.tsx` with `getWhatsAppUrl()`

5. **Verify build passes**
   ```powershell
   npm run build
   npm run lint
   ```

6. **Create `.env.example`** documenting all required vars

---

## Phase 4: Complete V1 Workflows (2–3 Days)

Build only what the blueprint marks as **V1 must support**, in business-priority order:

### 4.1 Delivery confirmation workflow (highest business value)

The whole point of this platform is semi-manual delivery pricing.

**Add to admin orders panel:**
- Input: delivery fee, quote notes
- Action: "Confirm delivery" → sets `deliveryFee`, `totalAmount`, status → `AWAITING_PAYMENT`
- Show subtotal vs total clearly

**Backend:** New service method `confirmDeliveryQuote(orderId, fee, notes)` — don't PATCH status blindly.

### 4.2 Payment verification polish

Mostly exists. Ensure:
- Admin sees payment method + reference field
- Verify payment → auto-advance order to `PAID` or `PROCESSING`
- Mobile-friendly buttons (owner uses phone)

### 4.3 Product images (pragmatic V1)

**Option A (fast):** Admin pastes Cloudinary/external URL — already supported by schema  
**Option B (blueprint):** Integrate Cloudinary upload widget in admin catalog manager

For V1 launch, Option A is fine. Add Cloudinary upload post-launch.

### 4.4 Mobile UX pass

Test every page at 375px width:
- Cart drawer
- Checkout form sections
- Admin order actions (large tap targets)

### 4.5 Content & trust

- Replace placeholder seed data with real products
- Audit product copy for medical claim language (blueprint rule)
- Add basic FAQ or "How ordering works" section on homepage

---

## Phase 5: Deploy to Production (1 Day)

### Stack (per blueprint)

| Service | Purpose |
|---------|---------|
| **Vercel** | Next.js hosting |
| **Neon** (or Supabase) | PostgreSQL |
| **Cloudinary** | Images (optional for V1) |

### Deployment checklist

```
□ Create Neon project → copy DATABASE_URL + DIRECT_DATABASE_URL
□ Set Vercel env vars (all from .env.example)
□ BETTER_AUTH_URL = https://yourdomain.com (production URL)
□ Run prisma migrate deploy against production DB
□ npm run create-admin:production
□ Seed production catalog (or migrate manually)
□ npm run build passes in Vercel
□ Smoke test: place test order → WhatsApp link works
□ Admin login works on production
□ Set NEXT_PUBLIC_WHATSAPP_NUMBER to business number
```

### Post-deploy

- Custom domain on Vercel
- Google Search Console for product pages
- Monitor Vercel function logs for first week

---

## Phase 6: Own the System Long-Term

### Daily habits

| Habit | Why |
|-------|-----|
| Trace one feature per week end-to-end | Builds muscle memory |
| Run `npm run build` before any commit | Catches agent drift early |
| Keep blueprint checklist updated | Single source of truth for "done" |

### Documentation to write (minimal, high value)

1. **`docs/current_state.md`** — your living notes (architecture, quirks, decisions)
2. **`.env.example`** — required for you and future you
3. **`README.md`** — replace boilerplate with: setup, scripts, deploy steps
4. **Skip** auto-generated architecture docs — they rot fast

### Rules for working with AI agents going forward

1. **One task, one PR** — never "build admin v2 alongside v1"
2. **Require green build** before moving on
3. **Point agents at blueprint section** — "implement Section 10 Order System delivery quote workflow"
4. **Review security on every API route** — agents often forget auth
5. **Delete dead code** — don't leave WIP routes that break builds

---

## Recommended Timeline

| Week | Focus | Outcome |
|------|-------|---------|
| **Week 1** | Phase 0–2: Baseline, study, gap spreadsheet | You understand the system |
| **Week 2** | Phase 3–4: Stabilize + delivery workflow + mobile pass | V1 functionally complete |
| **Week 3** | Phase 5: Deploy + real content | Live site, owner can operate |
| **Ongoing** | Phase 6: Own + iterate | Cloudinary, admin v2 refactor, analytics |

---

## What To Do First

1. Run the happy path locally (30 min)
2. Fix the 3 remaining security gaps (30 min)
3. Fill the blueprint checklist spreadsheet (1 hour)
4. Implement delivery quote UI in existing `/admin` (half day)

That gets you from "AI-built mystery" to "I understand it and it's deployable" within a few focused days.

---

## Blueprint V1 Systems — Quick Reference

| # | System | Status |
|---|--------|--------|
| 1 | Foundation | ✅ Done |
| 2 | Database | ✅ Done (soft delete partial) |
| 3 | Authentication | ✅ Done |
| 4 | Products | ✅ Done |
| 5 | Categories | ✅ Done |
| 6 | Inventory | ✅ Done |
| 7 | Cart | ✅ Done |
| 8 | Checkout | ✅ Done |
| 9 | WhatsApp | ⚠️ Partial (hardcoded number in Navbar) |
| 10 | Orders | ⚠️ Partial (delivery quote workflow missing) |
| 11 | Payments | ⚠️ Partial (works, needs polish) |
| 12 | Admin Dashboard | ⚠️ Partial (v1 works, v2 incomplete) |
| 13 | UI / Design System | ⚠️ Partial (functional, needs polish) |
| 14 | API Architecture | ✅ Done |
| 15 | Security | ⚠️ Partial (gaps on admin2 + orders PATCH) |
| 16 | SEO & Performance | ⚠️ Partial |
| 17 | Deployment | ❌ Not started |
