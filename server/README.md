# 💊 Universal Pharmacy Cashback Platform

NestJS 11 monorepo-based backend platform for managing pharmacy cashback programs using NFC cards.

## 🏗 Architecture

```
med/server
├── apps/
│   ├── api/          # REST API (NestJS) — 16 feature modules
│   ├── worker/       # Background jobs (BullMQ processors)
│   └── bot/          # Telegram Bot (grammY, long-polling)
├── packages/
│   ├── database/     # Prisma ORM + tenant context + soft-delete
│   ├── common/       # Shared filters, interceptors, exceptions
│   ├── config/       # Configuration module
│   ├── events/       # RxJS EventBus (inter-module communication)
│   ├── queue/        # BullMQ queue definitions + service
│   └── cache/        # Redis cache-aside (ioredis)
```

## 🧩 Modullar (16)

| Modul | Status | Tavsif |
|-------|--------|--------|
| Auth | ✅ | JWT auth (access 15m + refresh 30d), roles, guards |
| Users | ✅ | Customer CRUD, phone search, block/unblock |
| Pharmacies | ✅ | Pharmacy CRUD, status, region/district |
| Employees | ✅ | Staff CRUD, role assignment |
| Cards | ✅ | NFC card management, assignment, idempotent scan |
| Transactions | ✅ | Atomic cashback engine, status management |
| Cashbacks | ✅ | CashbackRule CRUD, user cashback history |
| Wallets | ✅ | Balance, withdraw requests, wallet transactions |
| Notifications | ✅ | User notification CRUD, mark read |
| Readers | ✅ | NFC reader device management, ping/status |
| Settings | ✅ | Key-value configuration (JSON) |
| Referrals | ✅ | Referral management, stats |
| Promocodes | ✅ | Promo code CRUD + redemption |
| Files | ✅ | File upload/download (local storage) |
| Reports | ✅ | Daily stats, summary, admin overview |
| Audit | ✅ | Event-driven audit logging |

## 🗺 Roadmap

### ✅ Bajarilgan (0–13)

| # | Bosqich | Modullar/Komponentlar |
|---|---------|----------------------|
| 0 | **Loyiha sozlamalari** | NestJS monorepo, npm workspaces, TypeScript, tsconfig paths |
| 1 | **Ma'lumotlar bazasi** | Prisma schema (22 model), PrismaService, tenant context, soft-delete, decimal transform |
| 2 | **Autentifikatsiya** | JWT auth (passport), JwtAuthGuard, RolesGuard, CurrentUser, TenantInterceptor |
| 3 | **Cards + Transactions** | NFC card CRUD, assignment, idempotent scan, atomic transaction engine |
| 4 | **Wallet tizimi** | Balance management, withdraw requests (approve/reject), wallet transactions |
| 5 | **Pharmacies + Employees** | Pharmacy CRUD, staff management, regions/districts |
| 6 | **Queue + Workers** | BullMQ (5 queues), AuditProcessor, NotificationProcessor, CashbackProcessor |
| 7 | **Redis Cache** | CacheService (cache-aside), CacheKeys, TTL strategies |
| 8 | **Qolgan modullar** | Cashbacks, Settings, Referrals, Promocodes, Files, Reports, Readers |
| 9 | **🤖 Telegram Bot** | `apps/bot` — grammY long-polling, BotService, BotUpdate, 7 buyruq, TelegramProcessor |
| 10 | **📊 Observability** | Health check (`/api/v1/health`), Sentry xatolik kuzatuvi, Prometheus (`/api/v1/metrics`) |
| 11 | **🧪 Testing** | Jest config (moduleNameMapper), Unit testlar (auth 10, transactions 15), E2E testlar, test utils |
| 12 | **🐳 Deployment** | Multi-stage Dockerfile, Docker Compose (dev+prod), GitHub Actions CI/CD |
| 13 | **📈 Monitoring** | Liveness/Readiness probes, Redis health, graceful shutdown (SIGTERM/SIGINT) |

## 🤖 Telegram Bot Tahlili

`apps/bot` — grammY asosida qurilgan, long-polling rejimida ishlaydi.

### Arxitektura

```
apps/bot
├── main.ts              # NestFactory.createApplicationContext(BotModule)
├── bot.module.ts        # Imports: DatabaseModule, QueueModule, EventBusModule, CacheModule
├── bot.service.ts       # Bot lifecycle (OnModuleInit → bot.start(), OnModuleDestroy → bot.stop())
├── bot.update.ts        # Command handlers + callback queries + text handler
└── bot.constants.ts     # BOT_COMMANDS, MESSAGES (reply templates)

apps/worker
└── processors/
    └── telegram.processor.ts  # Async xabar jo'natish (Bot API-only mode)
```

### Mavjud buyruqlar

| Buyruq | Status | Tavsif |
|--------|--------|--------|
| `/start` | ✅ | Welcome + inline keyboard (balance, cashbacks, card, notifications) |
| `/balance` | ✅ | Wallet balansini ko'rsatish |
| `/cashbacks` | ✅ | Oxirgi 10 keshbek tarixi |
| `/card` | ✅ | Telefon raqam orqali karta ulash |
| `/notifications` | ✅ | Xabarlar ro'yxati + isRead yangilash |
| `/stats` | ✅ | Admin statistika (foydalanuvchilar, tranzaksiyalar, jami keshbek) |
| `/broadcast` | ✅ | Admin broadcast (queue orqali) |

### Kamchiliklar (TechSpec bo'yicha)

| Faza | Holat | Nima qilish kerak |
|------|-------|-------------------|
| **1-FAZA: Registration** | ⚠️ **Qisman** | `/start` da til tanlash, ism/familiya, telefon yig'ish flow yo'q. `POST /bot/register` endpoint yo'q. `PENDING_CARD → ACTIVE` tranzitsiyasi botda yo'q |
| **2-FAZA: Main Menu** | ❌ **Yo'q** | Registerdan keyin to'liq menyu kerak (10+ tugma) |
| **3-FAZA: Profile** | ❌ **Yo'q** | `/profile` buyrug'i yo'q. F.I.O, telefon, status, balans, karta holatini ko'rsatmaydi |
| **4-FAZA: Balance** | ✅ **Bor** | `/balance` ishlaydi |
| **5-FAZA: Card Status** | ❌ **Yo'q** | Karta statusi (ACTIVE/BLOCKED/REPLACED), UID, aktivlashgan sanani ko'rsatmaydi |
| **6-FAZA: Transactions** | ⚠️ **Qisman** | Keshbek tarixi bor, lekin to'liq tranzaksiyalar tarixi va pagination yo'q |
| **7-FAZA: Notifications** | ✅ **Bor** | Ishlaydi |
| **8-FAZA: Real-time Cashback** | ⚠️ **Qisman** | Queue infrastructure bor, lekin transaction tugashi bilan avtomatik xabar yuborilmaydi |
| **9-FAZA: Withdraw** | ❌ **Yo'q** | Cashback yechish flow yo'q |
| **10-FAZA: Referral** | ❌ **Yo'q** | Referral tizimi botda yo'q |
| **11-FAZA: Promo Code** | ❌ **Yo'q** | Promo kodni botda redeeme qilish yo'q |
| **12-FAZA: Language** | ❌ **Yo'q** | i18n yo'q. Barcha xabarlar faqat Uzbek tilida hardcode qilingan |
| **13-FAZA: Settings** | ❌ **Yo'q** | Sozlamalar moduli yo'q (til, bildirishnomalar, profil) |
| **14-FAZA: Security** | ❌ **Yo'q** | Har bir update oldidan `user.status === 'ACTIVE'` tekshiruvi yo'q |

### Tavsiya etilgan sprintlar

| Sprint | Fazalar | Taxminiy hajm |
|--------|---------|---------------|
| **Sprint 1** | Register, Language, Main Menu, Profile, Balance | ~3-4 kun |
| **Sprint 2** | Card Status, Transactions, Notifications | ~2-3 kun |
| **Sprint 3** | Withdraw, Referral, Promo Codes | ~2-3 kun |
| **Sprint 4** | Real-time Cashback, Settings, Security Hardening | ~2-3 kun |

## 🛠 Tech Stack

| Texnologiya | Versiya | Vazifasi |
|-------------|---------|----------|
| NestJS | 11.x | Framework |
| TypeScript | 5.7+ | Til |
| Prisma | 6.x | ORM (PostgreSQL) |
| PostgreSQL | 16+ | Ma'lumotlar bazasi |
| Redis | 7.x | Cache + Queue broker |
| BullMQ | 5.x | Background jobs |
| RxJS | 7.x | EventBus |
| Passport/JWT | — | Authentication |
| ioredis | 5.x | Redis client |
| class-validator | 0.14 | DTO validation |
| grammY | 1.44+ | Telegram Bot framework |
| Docker | 24+ | Containerization |
| GitHub Actions | — | CI/CD pipeline |

## 🚀 Ishga tushirish

### Lokal (development)

```bash
# Ma'lumotlar bazasi
npm run prisma:generate
npm run prisma:migrate

# API server
npm run dev:api

# Worker
npm run dev:worker

# Telegram Bot
npm run dev:bot
```

### Docker (development)

```bash
# Barcha servislarni ishga tushirish
docker compose up -d

# Loglarni ko'rish
docker compose logs -f api worker bot

# Migration
docker compose exec api npx prisma migrate dev --schema=packages/database/prisma/schema.prisma
```

### Docker (production)

```bash
# Production stack
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Testlar

```bash
npm test                    # Unit testlar
npm run test:cov            # Coverage bilan
npm run test:e2e            # E2E testlar
```

## 📁 Project Structure

```
apps/api/src/
├── app.module.ts          # Root module (16 feature + infrastructure)
├── main.ts                # Bootstrap
└── modules/
    ├── auth/              # Authentication (JWT, guards, decorators)
    ├── audit/             # Audit logging (EventBus-driven)
    ├── users/             # Customer management
    ├── pharmacies/        # Pharmacy CRUD + regions
    ├── employees/         # Staff management
    ├── cards/             # NFC cards + assignments
    ├── transactions/      # Transaction engine (atomic cashback)
    ├── cashbacks/         # Cashback rules + history
    ├── wallets/           # Balance + withdraw
    ├── notifications/     # User notifications
    ├── readers/           # NFC reader devices
    ├── settings/          # System settings
    ├── referrals/         # Referral system
    ├── promocodes/        # Promo codes + redemptions
    ├── files/             # File upload/download
    └── reports/           # Statistics + reports
```
