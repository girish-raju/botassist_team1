---
name: morning
description: BotAssist daily health check — git state, backend tests, frontend build, server health, known issues. Run this to start your day.
user-invocable: true
argument-hint: ""
allowed-tools: Bash, Read, Grep, Glob
model: sonnet
---

# /morning — BotAssist Daily Health Check

**Level:** L1 — Read-only observation and reporting

Run a complete health check on the BotAssist project: git state, backend test results, frontend build status, server health, and known issues. This is the first thing you run each morning.

---

## Phases

### Phase 1: Git Status

Check the current state of the repository.

1. Run `git branch --show-current` to get the current branch name
2. Run `git status --short` to list uncommitted changes (staged, unstaged, untracked)
3. Run `git log --oneline -5` to show recent commit history
4. Run `git log @{upstream}..HEAD --oneline 2>/dev/null` to check for unpushed commits
5. Run `git stash list` to check for stashed changes

Report format:
```
## Git Status
- Branch: `BOT-12/mahesh/fix-sql-injection`
- Uncommitted changes: 3 files modified, 1 untracked
- Recent commits: [last 5 one-liners]
- Unpushed commits: 2
- Stashes: none
```

### Phase 2: Backend Tests

Run the BotAssist backend test suite.

1. Run `cd backend && python -m pytest tests/ -v 2>&1`
2. Parse output for: total tests, passed, failed, errors
3. Note: BotAssist currently has only `test_documents.py` with 3 tests. Most should pass.
4. Report each failure with test name and error message

Report format:
```
## Backend Tests
- Test file: tests/test_documents.py
- Total: 3 tests — 3 passed, 0 failed
- Missing test files: auth.py, rag.py, main.py, database.py have ZERO test coverage
```

For each failure, include:
- Test name (e.g., `test_documents.py::test_chunk_text`)
- Error message (first line only)

### Phase 3: Frontend Build

Check that the React frontend compiles.

1. Run `cd frontend && npm run build 2>&1`
2. Parse for: success/failure, errors, warnings
3. Vite build should produce output in `frontend/dist/`

Report format:
```
## Frontend Build
- Status: PASS / FAIL
- Errors: [list if any]
- Warnings: [list if any]
```

### Phase 4: Backend Server Health

Check if the backend is running and responding.

1. Run `curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null`
2. If it returns 200, the server is healthy
3. If it fails, report that the server is not running

Report format:
```
## Server Health
- Backend (localhost:8000): UP / DOWN
- Health endpoint: 200 OK / unreachable
```

### Phase 5: Known Issues and Next Action

1. Read `CLAUDE.md` for known issues section
2. Summarize the current state of known problems:
   - 28 planted bugs across the codebase
   - Test coverage gaps (only `test_documents.py` exists)
   - Security issues needing review (hardcoded keys, SQL injection, CORS)
   - Error handling inconsistencies
3. Check Linear board status (linear.app/tech-assistant, tickets TEC-5 through TEC-39)

Report format:
```
## Known Issues
- Planted bugs: 28 across backend and frontend
- Test coverage: only test_documents.py (3 tests) — auth, rag, main, database untested
- Security: hardcoded secrets, SQL injection vectors, CORS wildcard
- Error handling: inconsistent across routes, some leak stack traces

## Next Action
[single clear suggestion based on current state]
```

### Next Action Logic

| Condition | Suggestion |
|-----------|------------|
| Tests are failing | "Run `/fix` to diagnose and fix the failing tests." |
| All tests pass, uncommitted changes | "You have uncommitted work. Run `/review` then `/close` to wrap up." |
| All tests pass, everything committed | "All clean. Pick your next ticket from Linear (TEC-5 to TEC-39). Run `/loop TEC-{n}` to start." |
| No branch (on main) | "Create a feature branch before starting work: `git checkout -b BOT-{n}/name/desc`" |
| Frontend build fails | "Frontend build is broken. Fix compilation errors before proceeding." |
| Server not running | "Backend is not running. Start it with `cd backend && make dev`" |

---

## Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| Python/pip not available | `python3` command not found | Report: "Python is not installed. Run `/onboard` to check your environment." |
| Node/npm not available | `npm` command not found | Report: "Node.js is not installed. Run `/onboard` to check your environment." |
| Not a git repo | `git status` returns fatal error | Report: "This directory is not a git repository." |
| Backend venv missing | `backend/.venv` does not exist | Report: "Virtual environment not found. Run `cd backend && python3 -m venv .venv && pip install -r requirements.txt`" |
| Frontend node_modules missing | `frontend/node_modules` does not exist | Report: "Dependencies not installed. Run `cd frontend && npm install`" |
| Tests crash (not fail) | pytest exits with error before running tests | Report: "Tests crashed before running. Check import errors or missing dependencies." |

---

## Boundaries

### DO
- Read git status, branch info, and commit history
- Run backend pytest in verbose mode
- Run frontend build to check compilation
- Check backend health endpoint
- Read CLAUDE.md for known issues
- Provide a single, clear next-action suggestion
- Report all findings in a structured, scannable format

### DO NOT
- Modify any files
- Create commits or branches
- Push to remote
- Install dependencies or run `pip install`
- Attempt to fix failing tests (suggest `/fix` instead)
- Start the backend server (just check if it's running)

---

## Rules

- This skill is strictly **read-only** — it must never modify files, create commits, or change project state
- Always run backend tests even if git status looks clean — tests may have been broken by a rebase or merge
- Report failures clearly with test name and error message — do not dump raw pytest output
- Keep the report concise — developers scan this in 30 seconds
- If a phase fails (e.g., npm not installed), continue with remaining phases rather than aborting
- Always end with exactly one next-action suggestion

---

## Next Action

After running `/morning`, the typical workflow is:

- Tests failing → `/fix` to diagnose and resolve
- All green, changes pending → `/review` then `/close` to commit and PR
- All green, nothing pending → Pick next ticket from Linear, run `/loop TEC-{n}`
- Environment issues → `/onboard` to verify setup
