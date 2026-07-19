---
name: pharmacy-website-plan
description: Full pharmacy admin + super admin panel plan → tech spec + backend API
---

# 🏪 Universal Pharmacy Cashback Platform — Web Panel Plan

## 1. Maqsad

Backend (NestJS API) va TechSpec asosida **Super Admin Panel** + **Pharmacy Admin Panel** + **Employee Interface** qurish.

**Texnologiyalar:**
- React 19 + Vite + TypeScript
- React Router v7 (tanlama: yoki TanStack Router)
- Tailwind CSS + Shadcn/ui
- React Query (TanStack Query) — API caching
- Axios — HTTP client
- Zustand — state management
- React Hook Form + Zod — form validation
- Recharts — grafik/dashboard
- i18next — ko'p tillilik (UZ/RU/EN)
- Lucide React — icons

## 2. Auth & Routing Structure

```
/login                          → Public (login page)
/super-admin/*                  → Super Admin routes
/super-admin/dashboard          → Overview stats
/super-admin/pharmacies         → Manage pharmacies
/super-admin/pharmacies/:id     → Single pharmacy
/super-admin/regions            → Regions & districts
/super-admin/users              → All users
/super-admin/employees          → All employees (cross-pharmacy)
/super-admin/cards              → NFC cards management
/super-admin/cashback-rules     → All cashback rules
/super-admin/promo-codes        → Promo codes
/super-admin/reports            → Reports & analytics
/super-admin/settings           → System settings
/super-admin/audit              → Audit logs
/super-admin/withdrawals        → Withdraw requests
/super-admin/profile            → Profile

/pharmacy/*                     → Pharmacy Admin routes
/pharmacy/dashboard             → Pharmacy dashboard
/pharmacy/employees             → Manage employees
/pharmacy/cashback-rules        → Cashback rules
/pharmacy/customers             → Customer list
/pharmacy/transactions          → Transaction history
/pharmacy/reports               → Pharmacy reports
/pharmacy/readers               → NFC Readers
/pharmacy/profile               → Profile
/pharmacy/change-password       → Change password

/employee/*                     → Employee (cashier) routes
/employee/scan                  → NFC scan interface
/employee/transaction/create    → Manual transaction
/employee/transactions          → Today's transactions
/employee/customers             → Customer search
/employee/profile               → Profile
```

## 3. Backend API Connection

Base URL: `http://localhost:4000/api/v1`

### Auth Endpoints (connect to):
- `POST /auth/login` → Login page
- `POST /auth/refresh` → Token refresh interceptor
- `POST /auth/logout` → Logout

### All API Modules to connect:
1. **Auth** — login, refresh, logout, register-employee
2. **Pharmacies** — CRUD, status, password, cashback-rules
3. **Regions/Districts** — CRUD
4. **Users (Customers)** — CRUD, block/unblock, search
5. **Employees** — CRUD, suspend/activate
6. **Cards** — CRUD, assign/unassign, status
7. **Cashbacks** — rules CRUD, user history
8. **Transactions** — create, list, detail, reverse
9. **Wallets** — balance, wallet transactions, withdraw, review
10. **Promocodes** — CRUD, redeem, redemptions
11. **Readers** — CRUD, status
12. **Referrals** — CRUD, stats
13. **Notifications** — list, mark read
14. **Reports** — daily, summary, overview, top-pharmacies, transactions
15. **Settings** — CRUD
16. **Audit** — list
17. **Files** — upload, info

## 4. Component Architecture

```
src/
├── components/
│   ├── ui/              ← Shadcn/ui base components
│   ├── layout/          ← Sidebar, Navbar, MainLayout
│   ├── auth/            ← LoginForm, ProtectedRoute
│   ├── pharmacy/        ← PharmacyCard, PharmacyForm
│   ├── user/            ← UserTable, UserForm, UserSearch
│   ├── card/            ← CardTable, AssignDialog
│   ├── transaction/     ← TransactionTable, CreateTransaction
│   ├── cashback/        ← RuleForm, RuleList
│   ├── wallet/          ← BalanceCard, WithdrawForm
│   ├── report/          ← StatCard, ChartWidget
│   ├── employee/        ← EmployeeTable, EmployeeForm
│   ├── promocode/       ← PromoCodeForm, PromoCodeTable
│   ├── notification/    ← NotificationBell
│   └── dashboard/       ← MetricCard, ActivityFeed
├── hooks/               ← useAuth, useApi, custom hooks
├── lib/                 ← axios instance, utils, constants
├── pages/               ← Route pages
│   ├── super-admin/     ← Super admin pages
│   ├── pharmacy/        ← Pharmacy admin pages
│   └── employee/        ← Employee pages
├── stores/              ← Zustand stores
├── i18n/                ← Translation files
├── types/               ← TypeScript types/interfaces
└── App.tsx              ← Router setup
```

## 5. Design System

Based on Shadcn/ui with custom theme:

**Colors:**
- Primary: Custom pharmacy green #0D9488 (Teal)
- Secondary: Custom blue
- Accent: Warning gold for cashback
- Background: Light gray (#F8FAFC)
- Sidebar: Dark (#1E293B)

**Typography:**
- Font: Inter (sans-serif)
- Sizes: Tailwind defaults

**Layout:**
- Sidebar (collapsible) + Top navbar + Main content
- Responsive: mobile-first

## 6. Key Features per Role

### Super Admin:
- Full system overview dashboard with charts
- CRUD pharmacies (with region/district)
- CRUD regions & districts
- View all users, block/unblock
- CRUD employees (across all pharmacies)
- CRUD cards, assign/unassign
- CRUD cashback rules (global override)
- CRUD promo codes
- View all transactions
- Review withdraw requests
- Full reports & analytics
- System settings
- Audit log viewer

### Pharmacy Admin:
- Pharmacy dashboard (their pharmacy only)
- CRUD employees (their pharmacy)
- Manage cashback rules (their pharmacy)
- View customers (their pharmacy)
- View transactions (their pharmacy)
- View reports (their pharmacy)
- Manage NFC readers
- Change pharmacy password

### Employee (Cashier):
- Scan NFC card interface
- Create manual transaction
- View today's transactions
- Search customers by phone
- View personal profile

## 7. Security

- JWT token interceptor (auto-attach Bearer)
- 401 → refresh token → retry OR redirect to login
- Role-based route protection (ProtectedRoute component)
- Tenant isolation: pharmacy users auto-scoped
- Forms validated with Zod (frontend) + API validation (backend)

## 8. Files to Create (initial estimate)

Total: ~120+ files including:
- 30+ page components
- 20+ feature components
- 15+ layout/navigation components
- 10+ UI base components
- 10+ custom hooks
- 15+ API service files
- 5+ store files
- 5+ utility files
- 10+ type definition files
