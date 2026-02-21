---
name: kanban-init
description: Register and initialize the current project in the central kanban DB (~/.claude/kanban.db). Usage: /kanban-init or /kanban-init my-project-name. Run with /kanban-init.
license: MIT
---

Registers the current project in the central kanban DB (`~/.claude/kanban.db`) and creates a local config so `/kanban` knows which project to use.

## Usage

```
/kanban-init                  — project name = basename of current directory
/kanban-init my-project-name  — explicit project name
```

The argument after `kanban-init` (if any) is the project name. Strip any leading dashes: `kanban-init -unahouse.finance` → project `unahouse.finance`.

## Procedure

### 1. Determine project name

```bash
# If argument provided, strip leading dashes and use it
# Otherwise:
PROJECT=$(basename "$(pwd)")
```

### 2. Ensure central DB schema exists

```bash
mkdir -p ~/.claude
sqlite3 ~/.claude/kanban.db "
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'todo',
    priority TEXT NOT NULL DEFAULT 'medium',
    description TEXT,
    plan TEXT,
    implementation_notes TEXT,
    tags TEXT,
    review_comments TEXT,
    plan_review_comments TEXT,
    test_results TEXT,
    agent_log TEXT,
    current_agent TEXT,
    plan_review_count INTEGER NOT NULL DEFAULT 0,
    impl_review_count INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 3,
    attachments TEXT,
    notes TEXT,
    rank INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    started_at TEXT,
    planned_at TEXT,
    reviewed_at TEXT,
    tested_at TEXT,
    completed_at TEXT
  );
"
```

### 3. Write local project config

Create `.claude/kanban.json` in the **current project root**:

```json
{
  "project": "<PROJECT_NAME>",
  "db": "~/.claude/kanban.db"
}
```

Use the Write tool to create this file at `.claude/kanban.json`.

### 4. Create `kanban-board/start.sh`

```bash
mkdir -p kanban-board
```

Write `kanban-board/start.sh`:
```bash
#!/usr/bin/env bash
pnpm --dir ~/.claude/kanban-board dev
```

Make executable:
```bash
chmod +x kanban-board/start.sh
```

### 5. Output confirmation

```
✅ Project '<PROJECT_NAME>' registered in central kanban.

  Config:  .claude/kanban.json
  DB:      ~/.claude/kanban.db
  Board:   http://localhost:5173/?project=<PROJECT_NAME>
  Start:   ./kanban-board/start.sh

Add tasks with /kanban add <title>
```

## Notes

- If `.claude/kanban.json` already exists, read the current project name and ask the user whether to overwrite or keep as-is.
- The central board (`~/.claude/kanban-board/`) must be installed. If `~/.claude/kanban-board/package.json` doesn't exist, warn the user.
- `node_modules/` in the local `kanban-board/` is not created (no `pnpm install` needed — the central board handles its own deps).
