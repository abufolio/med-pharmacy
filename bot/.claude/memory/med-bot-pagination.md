---
name: med-bot-pagination
description: Implemented paginated transaction history with inline keyboard navigation for the Telegram bot
metadata:
  type: project
---

# Transaction History with Pagination

**Implemented:** 2026-07-12

Added full paginated transaction history to the Telegram bot (`med/bot`):

- **More info:** [[med-bot-prisma-auth]]
- `SessionData.historyPage: number` and step `"history_viewing"` added to `src/types.ts`
- `getTransactions(telegramId, page, perPage)` method in `src/utils/store.ts` — Prisma query with skip/take pagination, includes Cashback join
- `showHistory()` in `src/handlers/menu.ts` — rewrote to fetch real DB data with inline keyboard
- `handleHistoryPagination()` — callback query handler for Prev/Next page navigation
- `buildHistoryText()`, `buildHistoryKeyboard()` — helper functions for rendering
- Callback query handler in `src/bot.ts` — `hist_page:0`, `hist_back`, `hist_page_cur`
- i18n keys added (uz/ru/en): `history_page_info`, `history_prev_btn`, `history_next_btn`, `history_status_*`

## Related fix
- `src/config.ts` — `.env` path resolved via `path.resolve(__dirname, "../.env")` so token found from any CWD
- `server/docker-compose.yml` — added `env_file: ../bot/.env` to bot-dev service for reliable env loading

**Why:** Bot runs inside Docker (Windows Docker Desktop proxy breaks local PostgreSQL). Config `.env` loading needed to be CWD-independent.

**How to apply:** Bot auto-restarts via `tsx watch` on file changes. If schema changes, run `docker compose exec bot-dev npx prisma db push`.
