---
name: onboard
description: BotAssist setup guide — verify Python/Node/Git environment, understand the project, learn available skills, start your first ticket.
user-invocable: true
argument-hint: ""
allowed-tools: Bash, Read, Grep, Glob
model: sonnet
---

# /onboard — BotAssist Getting Started Guide

**Level:** L0 — Read-only environment check and orientation

Verify the development environment for BotAssist, explain the project structure, introduce available skills, and suggest the first task. This is the entry point for new developers.

---

## Steps

### Step 1: Environment Check

Run each command and report whether the tool is installed and its version:

| Tool | Command | Required |
|------|---------|----------|
| Python 3 | `python3 --version 2>&1` | Yes |
| pip | `pip3 --version 2>&1` | Yes |
| Node.js | `node --version 2>&1` | Yes |
| npm | `npm --version 2>&1` | Yes |
| Git | `git --version 2>&1` | Yes |
| Claude Code | `claude --version 2>&1` | Yes |
| GitHub CLI | `gh auth status 2>&1` | Recommended |

Also check BotAssist-specific dependencies:

| Dependency | Check | Required |
|------------|-------|----------|
| Backend venv | `test -d backend/.venv && echo "EXISTS" \|\| echo "MISSING"` | Yes |
| Backend packages | `backend/.venv/bin/pip list 2>/dev/null \| grep -c fastapi` | Yes |
| Frontend node_modules | `test -d frontend/node_modules && echo "EXISTS" \|\| echo "MISSING"` | Yes |

Report format:
```
## Environment

| Tool | Status | Version |
|------|--------|---------|
| Python 3 | OK | 3.12.1 |
| pip | OK | 24.0 |
| Node.js | OK | v20.10.0 |
| npm | OK | 10.2.3 |
| Git | OK | 2.42.0 |
| Claude Code | OK | 1.0.12 |
| GitHub CLI | OK | gh 2.40.0 (authenticated) |

| Dependency | Status |
|------------|--------|
| backend/.venv | EXISTS |
| Backend packages | INSTALLED (fastapi found) |
| frontend/node_modules | EXISTS |

All required tools and dependencies installed.
```

If any required tool or dependency is missing:
```
| Backend venv | MISSING |

ACTION REQUIRED: Backend virtual environment not found.
  Run: cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
```

### Step 2: Project Orientation

1. **Read CLAUDE.md** in the project root. Summarize the key points:
   - BotAssist is an AI-powered RAG chat application
   - Upload documents, ask questions, get AI answers with source citations
   - Backend: Python FastAPI + SQLite + ChromaDB + Claude API
   - Frontend: React 18 + Vite + react-markdown
   - 28 planted bugs across the codebase
   - Linear board: tech-assistant workspace (TEC-5 through TEC-39)

2. **Show the project structure:**
```
## Project Structure

botassist/
├── CLAUDE.md                    — Project instructions + dependency map
├── backend/
│   ├── app/
│   │   ├── main.py              — FastAPI app + 7 routes (135 lines)
│   │   ├── auth.py              — API key authentication (23 lines)
│   │   ├── config.py            — Pydantic settings (17 lines)
│   │   ├── database.py          — SQLite operations (126 lines)
│   │   ├── documents.py         — Doc upload + chunking (81 lines)
│   │   └── rag.py               — ChromaDB + Claude API (67 lines)
│   ├── tests/
│   │   ├── conftest.py          — Fixtures: temp_db, sample_text
│   │   └── test_documents.py    — 3 tests (VERY INCOMPLETE)
│   ├── requirements.txt
│   └── Makefile                 — dev, test, lint, setup
├── frontend/
│   ├── src/
│   │   ├── App.jsx              — Main layout, 3 tabs
│   │   ├── Chat.jsx             — Chat interface
│   │   ├── Upload.jsx           — Document upload
│   │   ├── History.jsx          — Chat history + search
│   │   ├── api.js               — API client, 6 functions
│   │   └── App.css              — Styles
│   ├── vite.config.js           — Proxy /api → localhost:8000
│   └── package.json
└── .claude/skills/              — Claude Code skills (13 total)
```

3. **Show API routes:**
```
## API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /health | No | Health check |
| POST | /documents/upload | X-Admin-Key | Upload document |
| GET | /documents | No | List documents |
| DELETE | /documents/{id} | BUG: No auth | Delete document |
| POST | /query | X-Admin-Key | RAG query |
| GET | /chat/{session_id} | No | Chat history |
| GET | /search?keyword= | No | Search history |
```

4. **Report file counts:**
```
- Python source files: 6 (in backend/app/)
- Python test files: 1 (test_documents.py — 3 tests)
- React/JS files: 6 (in frontend/src/)
- Known bugs: 28 planted across the codebase
```

### Step 3: Available Skills

List the skills available in `.claude/skills/`:

```
## Available Skills

| Command | Description |
|---------|-------------|
| `/morning` | Daily health check — git status, tests, build, known issues |
| `/loop TEC-{n}` | Enforced 6-step workflow for every ticket |
| `/triage` | Scan codebase for bugs — security, logic, test gaps |
| `/fix` | Fix a bug end-to-end with diagnosis + approval gate |
| `/test` | Run pytest + Vite build, report results + coverage gaps |
| `/review` | 7-criteria code review before committing |
| `/close` | Close ticket — commit, push, create PR |
| `/onboard` | This guide — environment check and orientation |
| `/ticket TEC-{n}` | Start working on a specific ticket |
| `/pr` | Create a GitHub pull request |
| `/create-ticket` | Create a new Linear ticket |
| `/update-ticket` | Update Linear ticket status |
| `/sprint` | Board overview of all tickets |
```

### Step 4: Daily Workflow Overview

Present the standard BotAssist daily workflow:

```
## Daily Workflow

1. `/morning` — Start your day. Check git status, run tests, check build, review known issues.
2. Pick a ticket from Linear (linear.app/tech-assistant) — TEC-5 through TEC-39
3. `/loop TEC-{n}` — Follow the enforced 6-step workflow:
   - TRIAGE → PLAN → IMPLEMENT → BLAST RADIUS → TEST → PR
4. `/close` — Commit with conventional format, push, create PR
5. Pick the next ticket and repeat

## Key Commands

- Backend tests: `cd backend && python -m pytest tests/ -v`
- Frontend build: `cd frontend && npm run build`
- Start backend: `cd backend && make dev` (runs on localhost:8000)
- Start frontend: `cd frontend && npm run dev` (runs on localhost:5173)
- Open app: http://localhost:5173
```

### Step 5: First Task Suggestion

Based on the current project state, suggest what to do first:

| Condition | Suggestion |
|-----------|------------|
| Environment incomplete | "Install the missing tools listed above, then run `/onboard` again." |
| Venv or node_modules missing | "Set up dependencies first: `cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt` and `cd frontend && npm install`" |
| Everything installed | "Run `/morning` for a full health check. Then pick your first ticket from Linear." |

Default suggestion:
```
## Get Started

1. Run `cd backend && python -m pytest tests/ -v` to see the current test state
2. Run `cd frontend && npm run build` to verify the frontend compiles
3. Open http://localhost:5173 in your browser (start backend with `make dev` first)
4. Run `/morning` for a complete project health check
5. Pick your first ticket from Linear (linear.app/tech-assistant) and run `/loop TEC-{n}`
```

---

## Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| Python not installed | `python3 --version` fails | Report as MISSING. Suggest: `brew install python@3.12` (macOS) or `sudo apt install python3` (Linux). |
| Node.js not installed | `node --version` fails | Report as MISSING. Suggest: `brew install node` or use nvm. |
| Git not installed | `git --version` fails | Report as MISSING. This is critical — cannot proceed. |
| gh not authenticated | `gh auth status` fails | Report as WARNING. Suggest: `gh auth login`. Needed for creating PRs. |
| Backend venv missing | `backend/.venv` does not exist | Report with setup command. |
| Frontend deps missing | `frontend/node_modules` does not exist | Report with `npm install` command. |
| Not in project root | Neither `backend/` nor `frontend/` exists | Report: "Navigate to the BotAssist project root directory first." |
| CLAUDE.md missing | File does not exist | Note: "No CLAUDE.md found. This may not be the BotAssist project." |

---

## Boundaries

### DO
- Check tool versions and report installed/missing status
- Check BotAssist-specific dependencies (venv, node_modules)
- Read CLAUDE.md for project context
- List project structure and file counts
- List available skills from `.claude/skills/`
- Show API routes and key commands
- Provide install instructions for missing tools
- Suggest a clear first action

### DO NOT
- Install any software or dependencies
- Modify any files or configurations
- Run `pip install` or `npm install`
- Create branches or commits
- Start servers
- Run tests (suggest `/morning` or `/test` instead — keep onboard fast)
- Modify shell configuration files

---

## Rules

- This skill is strictly **read-only** — it checks and reports but never installs, configures, or modifies
- Always check all tools in the table, plus BotAssist-specific dependencies
- Report missing tools with specific install instructions for the detected OS
- Always read and summarize CLAUDE.md — it contains the dependency map and security rules
- Keep the report structured and scannable — use tables and headers
- End with a concrete first-action suggestion
- Do not run tests during onboard — the environment check should be fast (under 10 seconds)

---

## Next Action

After running `/onboard`:

- Environment complete → `/morning` for a full project health check
- Missing tools → Install them, then run `/onboard` again
- Ready to work → `/morning` then pick a ticket from Linear (TEC-5 to TEC-39)
- Need help → Check CLAUDE.md or ask your instructor
