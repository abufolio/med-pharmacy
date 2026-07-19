---
name: project-context
description: Core project context — architecture, ports, credentials, and key decisions
tags: [core, reference, always-load]
---

# Project Context

## Tech Stack
- **Monorepo**: server/ (NestJS 11), client/ (React 19 + Vite 8), cashier/ (React 19)
- **Database**: PostgreSQL 18 via Prisma 6 ORM
- **Auth**: JWT (access + refresh tokens), auto-refresh via Axios interceptor

## Ports (actual, not what docs say)
| Service | Port | Notes |
|---------|------|-------|
| Backend API (NestJS) | `:3000` | NOT 4000 as docs say |
| Admin Panel (Vite) | `:3001` | Proxies `/api` → `:3000` |
| Cashier Backend | `:4000` | Separate NestJS instance |

## Credentials (from seed.js)
| Role | Login | Password |
|------|-------|----------|
| Pharmacy Admin | `admin` | `admin123` |
| Pharmacy 2 | `pharmacy2` | `admin123` |
| Cashier 1 | `cashier1` | `admin123` |
| Cashier 2 | `cashier2` | `admin123` |

**Note**: No SUPER_ADMIN user exists in seed. The auth system only supports PHARMACY_ADMIN (via pharmacy login) and EMPLOYEE (via employee login). SUPER_ADMIN routes exist in frontend but have no backend user.

## API Response Format
Backend wraps ALL responses with `{ success: true, data: ..., ...rest }`. The `apiService` helper in `client/src/lib/api.ts` strips the `success` wrapper automatically.

- **Paginated**: `{ success: true, data: [...], total: N, page: N, limit: N }` → pages access `data?.data` (array) and `data?.total`
- **Single**: `{ success: true, data: {...} }` → pages access `data?.data` (object)
- **Auth**: `{ success: true, user: {...}, tokens: {...} }` — NO `data` key, pages use `res.user`, `res.tokens` directly

## Fixed Issues
- ✅ **2026-07-17**: Created `apiService` helper that unwraps AxiosResponse → pages get JSON body directly
- ✅ **2026-07-17**: Fixed LoginPage destructuring (`{ data }` → `res`)
- ✅ **2026-07-17**: Fixed EmployeeDashboard (`data.data` → `res.data`)
- ✅ **2026-07-17**: Created dedicated Regions & Districts backend modules
- ✅ **2026-07-17**: Standardized all backend controllers to `{ success: true, ... }` format

## Completed (2026-07-18)
- ✅ **UI/UX Complete Redesign — P0 Core Pages Done**
  - **Design system** (globals.css): New tokens (emerald/teal, deep navy sidebar, 4 shadow levels, animations, glass effect, gradient utilities)
  - **LoginPage**: Dual-panel design with brand left side (emerald gradient) + clean form on right, animated error states
  - **Sidebar**: Deep navy #0f172a, Med Bonus logo, user profile at bottom, collapsible, active indicators
  - **Navbar**: Clean design with language switcher, notification bell, profile dropdown with avatar
  - **MainLayout**: Proper flex layout with max-w-7xl centered content, page-enter animation
  - **StatCard**: Gradient icon circles, hover elevation, entrance animations with stagger delays
  - **SuperAdminDashboard**: Gradient stat cards, proper data table with status badges, empty states
  - **PharmacyDashboard**: Quick action grid with gradient icons, stat cards, transaction table
  - **EmployeeDashboard**: Large gradient action cards, recent transactions, helpful empty state with CTA
  - **Build verified**: TypeScript `tsc --noEmit` passes, Vite production build succeeds (587ms)

## Remaining Work
- ⏳ List pages (UserList, PharmacyList, TransactionList, CardManagement) — need UI polish
- ⏳ Pharmacy & Employee sub-pages — need UI polish
- ⏳ Remaining super-admin pages — need UI polish
- ⏳ E2E testing and documentation
- ⏳ SUPER_ADMIN seed user needs to be created

## Key File Locations
| File | Purpose |
|------|---------|
| `client/src/lib/api.ts` | Axios instance + apiService helper |
| `client/src/lib/api-services.ts` | All typed API functions |
| `client/src/stores/authStore.ts` | Auth state management |
| `server/apps/api/src/modules/auth/auth.service.ts` | Login logic, role assignment |
| `server/seed.js` | Database seed data |
