---
name: med-bot-where-we-left-off
description: Current state of med/bot development — ongoing tasks after pagination
metadata:
  type: project
---

# Med/Bot Development Status (2026-07-12)

**Completed:**
1. ✅ Prisma/PostgreSQL integration — bot uses PostgreSQL via Prisma, Docker hot-reload dev setup
2. ✅ Auth system — /login, /logout, bcrypt password verification, session-based isLoggedIn
3. ✅ Transaction history with pagination — inline keyboard, 5 per page, Prev/Next navigation

**Pending (next in order):**
4. 📜 Card status details — show NFC card info, activation status, card history
5. 📜 Admin commands — broadcast, stats
6. 📜 Real-time cashback notifications
7. 📜 Security hardening

**References:** [[med-bot-prisma-auth]], [[med-bot-pagination]]

**Dev setup:** Bot runs in Docker (`server-bot-dev-1`) with hot-reload via `tsx watch` + volume mounts. Docker Desktop PostgreSQL proxy bug => bot MUST run inside Docker, not locally.
