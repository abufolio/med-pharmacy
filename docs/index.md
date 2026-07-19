---
name: docs-index
description: Documentation hub for Universal Pharmacy Cashback Platform
---

# 📚 Universal Pharmacy Cashback Platform — Documentation

## 📋 Overview

This documentation covers the complete **Super Admin Panel + Pharmacy Admin Panel + Employee Interface** for the pharmacy cashback platform built with:

- **Backend:** NestJS (Node.js) + PostgreSQL + Redis
- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS
- **Architecture:** Modular monorepo (server/, client/, bot/)

---

## 📖 Core Documentation

| File | Description | Audience |
|------|-------------|----------|
| [Pharmacy-Website-Plan.md](Pharmacy-Website-Plan.md) | Full project plan: roles, routes, features, API modules | All |
| [Frontend-Architecture.md](Frontend-Architecture.md) | React architecture: stack, structure, routing, API integration | Frontend Devs |
| [API-Integration-Guide.md](API-Integration-Guide.md) | Complete backend API reference: endpoints, auth, response formats | Full-stack Devs |
| [Development-Setup.md](Development-Setup.md) | Local environment setup: prerequisites, commands, architecture | All |

---

## 🧭 Quick Navigation

### 🏗️ Architecture & Planning
- **Project Plan** → [Pharmacy-Website-Plan.md](Pharmacy-Website-Plan.md)
- **Frontend Architecture** → [Frontend-Architecture.md](Frontend-Architecture.md)
- **API Reference** → [API-Integration-Guide.md](API-Integration-Guide.md)

### ⚙️ Development
- **Local Setup** → [Development-Setup.md](Development-Setup.md)
- **Obsidian Config** → [`.obsidian/`](.obsidian/)

---

## 🎯 Key Links

| Component | Path | Description |
|-----------|------|-------------|
| **Frontend (client/)** | `../client/` | React admin panel |
| **Backend (server/)** | `../server/` | NestJS API + Prisma |
| **Telegram Bot (bot/)** | `../bot/` | Grammy bot for notifications |
| **Obsidian Vault** | `.obsidian/` | Local knowledge base |

---

## 🚀 Quick Start

```bash
# 1. Backend
cd server && npm install && cp .env.example .env && npm run prisma:generate && npm run prisma:migrate && npm run dev:api

# 2. Frontend
cd client && npm install && npm run dev

# 3. Bot (optional)
cd bot && npm install && npm run dev
```

**Default credentials (after seed):**
- Super Admin: `admin` / `admin123`
- Pharmacy Admin: `pharmacy1` / `pharmacy123`

---

## 🔐 Roles & Access

| Role | Routes | Scope |
|------|--------|-------|
| **Super Admin** | `/super-admin/*` | Full system access |
| **Pharmacy Admin** | `/pharmacy/*` | Single pharmacy |
| **Employee** | `/employee/*` | Cashier operations |

---

## 📁 Repository Structure

```
med-pharmacy/
├── client/          # React frontend
├── server/          # NestJS backend
├── bot/             # Telegram bot
├── docs/            # ← YOU ARE HERE
│   ├── index.md
│   ├── Pharmacy-Website-Plan.md
│   ├── Frontend-Architecture.md
│   ├── API-Integration-Guide.md
│   ├── Development-Setup.md
│   └── .obsidian/   # Obsidian vault config
└── .gitignore       # Root gitignore
```

---

## 📝 Maintenance

- **Update docs** when API changes
- **Keep .obsidian/** synced for local knowledge base
- **Reference this index** in PR descriptions and onboarding