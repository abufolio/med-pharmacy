---
name: med-server-where-we-left-off
description: Current state of med/server development — fixed bugs and pending work
metadata:
  type: project
---

# Med/Server Development Status (2026-07-15)

## Bugs Fixed This Session

**CRITICAL (4 → 0 remaining):**
1. ✅ Wallets route ordering — `@Get('withdraw-requests')` above `@Get(':userId')` (route hijack)
2. ✅ Employees privilege escalation — `data: { ...dto, pharmacyId }` (spread order)
3. ✅ Notifications P2025 — NOT FOUND check before update (500→404)
4. ✅ Promocodes race condition — usage-limit + duplicate checks inside `$transaction`
5. ✅ UsersService.findByPhone() leaks passwordHash — added `select` projection
6. ✅ TransactionsService.create() — cashback rule lookup moved inside `$transaction`

**MEDIUM (9 → 2 remaining):**
7. ✅ Cashbacks accrual — `POST /cashbacks/accrue` with wallet + wallet TX
8. ✅ Pharmacies dead code — impossible condition replaced (minPurchase)
9. ✅ Auth `GET /auth/me` — endpoint + service method added
10. ✅ Audit filtering — 7 query params (actorType, action, entity, from, to, etc.)
11. ✅ Pharmacies scope checks — ownership verified on `findById`, `update`, `changePassword`, cashback rules (controller + service)
12. ✅ Transactions scope checks — `findById` and `reverseTransaction` now scoped by pharmacyId
13. ✅ Readers pharmacy ownership — `updateStatus` verifies reader belongs to admin's pharmacy
14. ✅ CardsService.scan() — real wallet balance instead of hardcoded 0
15. ✅ TransactionsService.calculateCashback() — all types rounded to 2 decimals (consistent with Decimal(14,2))
16. ✅ SUPER_ADMIN auth — Prisma schema + migration + login path + JwtStrategy + seed + webpack bundling
17. ❌ DTO spread in PharmaciesService.update() & EmployeesService.update() — relies on ValidationPipe whitelist

**MINOR (5 → 5 remaining):**
- Health duplicates — `check()` now delegates to `ready()`
- Others (files DB records, workers tenant context, cards DELETE, users DELETE, readers audit, reports validation) — enhancement items

## Remaining Issues

### DTO spread pattern (risk, not active bug)
- `PharmaciesService.update()` at line 196 uses `data: dto` directly
- `EmployeesService.update()` at line 55 uses `data: dto` directly
- Relies on global ValidationPipe `whitelist: true` — if that's ever removed, fields can be injected.

## Next Steps per User Direction
1. ✅ SUPER_ADMIN auth fixed
2. Build admin web panel
