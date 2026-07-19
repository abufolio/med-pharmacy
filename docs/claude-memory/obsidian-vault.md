---
name: obsidian-vault
description: Obsidian vault configuration and usage in docs/ folder
tags: [obsidian, memory, workflow]
---

# Obsidian Vault

The project has an Obsidian vault at `docs/` with both documentation and working memory.

## Vault Structure
```
docs/
├── index.md                          ← Documentation hub
├── API-Integration-Guide.md          ← API reference
├── Frontend-Architecture.md          ← React architecture
├── Development-Setup.md             ← Local setup guide
├── Pharmacy-Website-Plan.md         ← Full project plan
├── claude-memory/                   ← Claude's working memory (created by Claude)
│   └── project-context.md           ← Core project context
├── .obsidian/                        ← Obsidian config + plugins
│   ├── plugins/realclaudian/        ← "Claudian" plugin (v2.0.34)
│   │   └── manifest.json
│   ├── appearance.json
│   ├── app.json
│   ├── community-plugins.json
│   └── workspace.json
└── Untitled.canvas
```

## How to Use
1. **Read docs/** first to understand project structure before making changes
2. **Write memory** to `docs/claude-memory/` for persistent context across sessions
3. **Check project-context.md** for current state before starting new work
4. **Update memory** when significant changes are made

## Realclaudian Plugin
The "Claudian" plugin (v2.0.34) embeds Claude Code agents as AI collaborators in the vault, with file read/write/search/bash capabilities. This is an Obsidian integration for Claude.

## Memory Strategy
- `project-context.md` — Always loaded first, contains the full project state
- Per-session working memory in `claude-memory/`
- Updates after every significant change
