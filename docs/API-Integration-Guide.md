---
name: api-integration-guide
description: Detailed API integration reference for frontend ↔ backend
---

# Backend API Integration Guide

## Base Configuration
- **Base URL:** `http://localhost:4000/api/v1`
- **Dev proxy:** Vite proxies `/api/*` to `localhost:4000`
- **Auth:** JWT Bearer token (auto-attached by Axios interceptor)

## Authentication Flow
```
Login → POST /auth/login → { tokens: { accessToken, refreshToken }, user: {...} }
     ↓
Store tokens in localStorage
     ↓
Every API call: Authorization: Bearer <accessToken>
     ↓
401 response → POST /auth/refresh → new tokens → retry
     ↓
Refresh fails → clear storage → redirect /login
```

## Key API Endpoints

### Authentication
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/login | Public | Login with login+password |
| POST | /auth/refresh | Public | Refresh tokens |
| POST | /auth/logout | JWT | Logout |
| POST | /auth/register-employee | PHARMACY_ADMIN, SUPER_ADMIN | Register employee |

### Regions & Districts
| Method | Path | Auth |
|--------|------|------|
| GET | /regions | Public |
| POST/PATCH/DELETE | /regions/:id | SUPER_ADMIN |
| GET | /districts?regionId= | Public |
| POST/PATCH/DELETE | /districts/:id | SUPER_ADMIN |

### Pharmacies
| Method | Path | Auth |
|--------|------|------|
| GET | /pharmacies?status=&page=&limit= | SUPER_ADMIN, PHARMACY_ADMIN |
| GET | /pharmacies/:id | SUPER_ADMIN, PHARMACY_ADMIN |
| POST | /pharmacies | SUPER_ADMIN |
| PATCH | /pharmacies/:id | SUPER_ADMIN, PHARMACY_ADMIN |
| PATCH | /pharmacies/:id/status | SUPER_ADMIN |
| POST | /pharmacies/:id/change-password | SUPER_ADMIN, PHARMACY_ADMIN |
| GET | /pharmacies/:id/cashback-rules | SUPER_ADMIN, PHARMACY_ADMIN |
| POST | /pharmacies/:id/cashback-rules | SUPER_ADMIN, PHARMACY_ADMIN |

### Users (Customers)
| Method | Path | Auth |
|--------|------|------|
| GET | /users?search=&page=&limit= | SUPER_ADMIN, PHARMACY_ADMIN |
| GET | /users/phone/:phone | SUPER_ADMIN, PHARMACY_ADMIN, EMPLOYEE |
| GET | /users/:id | SUPER_ADMIN, PHARMACY_ADMIN, EMPLOYEE |
| POST | /users | SUPER_ADMIN, PHARMACY_ADMIN |
| PATCH | /users/:id | SUPER_ADMIN, PHARMACY_ADMIN |
| POST | /users/:id/block | SUPER_ADMIN |
| POST | /users/:id/unblock | SUPER_ADMIN |

### Employees
| Method | Path | Auth |
|--------|------|------|
| GET | /employees?page=&limit= | SUPER_ADMIN, PHARMACY_ADMIN |
| GET | /employees/:id | SUPER_ADMIN, PHARMACY_ADMIN |
| POST | /employees | SUPER_ADMIN, PHARMACY_ADMIN |
| PATCH | /employees/:id | SUPER_ADMIN, PHARMACY_ADMIN |
| POST | /employees/:id/suspend | SUPER_ADMIN |
| POST | /employees/:id/activate | SUPER_ADMIN |

### Cards
| Method | Path | Auth |
|--------|------|------|
| GET | /cards?page=&limit= | SUPER_ADMIN, PHARMACY_ADMIN |
| GET | /cards/:uid | SUPER_ADMIN, PHARMACY_ADMIN |
| POST | /cards | SUPER_ADMIN, PHARMACY_ADMIN |
| PATCH | /cards/:uid/status | SUPER_ADMIN, PHARMACY_ADMIN |
| POST | /cards/assign | SUPER_ADMIN, PHARMACY_ADMIN |
| POST | /cards/unassign | SUPER_ADMIN, PHARMACY_ADMIN |
| POST | /cards/scan | Public |

### Cashbacks
| Method | Path | Auth |
|--------|------|------|
| GET | /cashbacks/rules | All authenticated |
| GET | /cashbacks/rules/:id | All authenticated |
| POST | /cashbacks/rules | SUPER_ADMIN, PHARMACY_ADMIN |
| PATCH | /cashbacks/rules/:id | SUPER_ADMIN, PHARMACY_ADMIN |
| DELETE | /cashbacks/rules/:id | SUPER_ADMIN, PHARMACY_ADMIN |
| GET | /cashbacks/user/:userId | All authenticated |

### Transactions
| Method | Path | Auth |
|--------|------|------|
| GET | /transactions | SUPER_ADMIN, PHARMACY_ADMIN |
| GET | /transactions/:id | SUPER_ADMIN, PHARMACY_ADMIN |
| POST | /transactions | SUPER_ADMIN, PHARMACY_ADMIN, EMPLOYEE |
| POST | /transactions/:id/reverse | SUPER_ADMIN, PHARMACY_ADMIN |

### Wallets
| Method | Path | Auth |
|--------|------|------|
| GET | /wallets/:userId | All authenticated |
| GET | /wallets/:userId/transactions | SUPER_ADMIN, PHARMACY_ADMIN |
| POST | /wallets/:userId/withdraw | SUPER_ADMIN, PHARMACY_ADMIN |
| GET | /wallets/withdraw-requests | SUPER_ADMIN |
| POST | /wallets/withdraw-requests/:id/review | SUPER_ADMIN |

### Promo Codes
| Method | Path | Auth |
|--------|------|------|
| GET | /promocodes | SUPER_ADMIN |
| GET | /promocodes/:id | SUPER_ADMIN |
| GET | /promocodes/code/:code | SUPER_ADMIN |
| POST | /promocodes | SUPER_ADMIN |
| PATCH | /promocodes/:id | SUPER_ADMIN |
| DELETE | /promocodes/:id | SUPER_ADMIN |
| POST | /promocodes/redeem | SUPER_ADMIN, PHARMACY_ADMIN, EMPLOYEE |
| GET | /promocodes/redemptions/:userId | SUPER_ADMIN, PHARMACY_ADMIN, EMPLOYEE |

### Reports
| Method | Path | Auth |
|--------|------|------|
| GET | /reports/daily | SUPER_ADMIN, PHARMACY_ADMIN |
| GET | /reports/summary | SUPER_ADMIN, PHARMACY_ADMIN |
| GET | /reports/overview | SUPER_ADMIN |
| GET | /reports/top-pharmacies | SUPER_ADMIN |
| GET | /reports/transactions | SUPER_ADMIN, PHARMACY_ADMIN |

### Settings, Audit, Health
| Endpoints | Auth |
|-----------|------|
| /settings/* | SUPER_ADMIN |
| /audit | SUPER_ADMIN |
| /health, /health/live, /health/ready | Public |

## Response Formats

### Success (paginated)
```json
{ "data": [...], "total": 100, "page": 1, "limit": 20 }
```

### Success (single)
```json
{ "id": "...", "name": "...", ... }
```

### Error
```json
{ "message": "Error description", "statusCode": 400 }
```

## Frontend Services
All API calls are centralized in `lib/api-services.ts` with typed methods matching each module. Use:
```typescript
import { pharmacyApi, transactionApi, /* ... */ } from '@/lib/api-services';
```
