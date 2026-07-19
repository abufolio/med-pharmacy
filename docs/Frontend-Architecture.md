---
name: frontend-architecture
description: React frontend architecture for pharmacy cashback platform
---

# Frontend Architecture — Pharmacy Cashback Platform

## Tech Stack
- **Framework:** React 19 + TypeScript 6
- **Build:** Vite 8, Tailwind CSS 4
- **Routing:** React Router v7
- **State:** Zustand (auth), React Query (server state)
- **HTTP:** Axios (with auto-refresh interceptor)
- **Forms:** React Hook Form + Zod
- **UI:** Custom Shadcn/ui-style components (Radix UI primitives)
- **Icons:** Lucide React
- **i18n:** i18next (UZ/RU/EN)
- **Charts:** Recharts

## Directory Structure
```
client/src/
├── components/
│   ├── ui/           ← Base UI components (Button, Card, Table, Dialog, etc.)
│   ├── layout/       ← Sidebar, Navbar, MainLayout, StatCard
│   └── auth/         ← ProtectedRoute
├── pages/
│   ├── dashboard/    ← Role-specific dashboards
│   ├── super-admin/  ← Super admin feature pages
│   ├── pharmacy/     ← Pharmacy admin pages
│   └── employee/     ← Employee/cashier pages
├── hooks/            ← Custom hooks (useApi, useFetch, etc.)
├── lib/              ← Axios API client, API services, utils
├── stores/           ← Zustand stores (authStore)
├── i18n/             ← Translation files (en, uz, ru)
├── types/            ← TypeScript interfaces for all backend models
└── styles/           ← Global CSS with Tailwind
```

## API Integration
- Base URL: `/api/v1` (proxied to `localhost:4000` in dev)
- Auth: JWT Bearer token via Axios interceptor
- Auto-refresh: 401 → refresh token → retry
- All API services in `lib/api-services.ts`

## Routing Structure
- `/login` — Public login page
- `/dashboard` — Role-based dashboard
- `/super-admin/*` — Super Admin routes
- `/pharmacy/*` — Pharmacy Admin routes
- `/employee/*` — Employee routes
- `/profile` — User profile

## Connections to Backend
| Backend Module | Frontend Pages |
|----------------|----------------|
| Auth | LoginPage, authStore, API interceptor |
| Pharmacies | PharmacyListPage, PharmacyDetailPage |
| Regions | RegionManagementPage |
| Users (Customers) | UserListPage, UserDetailPage |
| Employees | EmployeeManagePage |
| Cards | CardManagementPage |
| Cashback Rules | CashbackRulesPage, CashbackRulesManagePage |
| Transactions | TransactionListPage, TransactionViewPage |
| Wallets | UserDetailPage (wallet tab) |
| Withdrawals | WithdrawRequestPage |
| Promo Codes | PromoCodePage |
| Readers | ReaderManagePage |
| Reports | ReportsPage, Dashboards |
| Settings | SettingsPage |
| Audit | AuditLogPage |
| NFC Scan | NFCPage, CreateTransactionPage |
