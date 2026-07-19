---
name: med-bot-where-we-left-off
description: Current state of med/bot development — completed items and pending tasks
metadata:
  type: project
---

# Med/Bot Development Status (2026-07-15)

**Completed:**
1. ✅ Prisma/PostgreSQL integration
2. ✅ Auth system (register, login, logout)
3. ✅ Transaction history with pagination
4. ✅ Card status details (info + history)
5. ✅ Admin commands (/stats, /broadcast)
6. ✅ Real-time cashback notifications (background watcher)
7. ✅ Security hardening:
   - Rate limiting: @grammyjs/ratelimiter (20 msg/min per user, admin bypass)
   - Input validation: Zod schemas (name, phone, password, address, withdraw)
   - Session expiry: 24h idle timeout, auto-logout
8. ✅ API integration — withdraw/promo/referral connected to DB:
   - `createWithdrawRequest()` — creates WithdrawRequest record (PENDING), no in-memory balance loss
   - `redeemPromoCode()` — validates active, expiry, usage limit, duplicate — atomically creates PromoRedemption + increments usedCount
   - `getReferralStats()` — real counts and bonus amounts from Referral table
   - All 3 languages updated with detailed promo error messages
9. ✅ Redis session storage (production) — ioredis adapter with 24h TTL, auto-fallback to in-memory in dev
10. ✅ Webhook secret_token verification — already configured via `setWebhook(url, { secret_token })`
11. ✅ Referral deep link — `/start ref_<userId>` parses referrer, creates Referral record on registration
12. ✅ Notification "Mark all as read" button with uz/ru/en localization
13. ✅ Bugfix: auth.ts "register_duplicate" → "register_first" (was showing wrong message)
14. ✅ Bugfix: Withdraw request now returns real UUID (was returning empty string)

**References:** [[med-bot-prisma-auth]], [[med-bot-pagination]]

**Dev setup:** Docker hot-reload via `tsx watch`.
