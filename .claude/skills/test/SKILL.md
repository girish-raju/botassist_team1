---
name: test
description: Run BotAssist tests and report results — backend pytest, frontend build check, coverage gaps. Use to verify changes.
user-invocable: true
argument-hint: "[--all | --backend | --frontend]"
allowed-tools: Bash, Read, Grep, Glob
model: sonnet
---

# /test — BotAssist Test Runner

**Level:** L0 — Execute and report

Run the BotAssist backend test suite (pytest) and frontend build check (Vite), then report results with coverage gap analysis.

---

## Steps

### Step 1: Inventory Test Files

Check what test files exist in the BotAssist project:

1. List all files in `backend/tests/`:
   - `conftest.py` — fixtures (temp_db, sample_text)
   - `test_documents.py` — 3 tests (INCOMPLETE)
   - Any other test files that may have been added
2. Report which backend modules have test coverage and which have ZERO:

```
## Test File Inventory

| Module | Test File | Status |
|--------|-----------|--------|
| documents.py | test_documents.py (3 tests) | PARTIAL |
| auth.py | — | NO TESTS |
| database.py | — | NO TESTS |
| main.py | — | NO TESTS |
| rag.py | — | NO TESTS |
| config.py | — | NO TESTS |
```

### Step 2: Run Backend Tests

Run the pytest suite:

```bash
cd backend && python -m pytest tests/ -v 2>&1
```

- Parse output for: total tests, passed, failed, errors, skipped
- For each failure, extract: test name, assertion message, expected vs. actual
- Note any import errors or fixture failures separately

Report format:
```
## Backend Tests (pytest)

- Total: 3 tests
- Passed: 3
- Failed: 0
- Errors: 0

### Failures (if any)

1. test_documents.py::test_chunk_text
   - Expected: chunks of size 100
   - Actual: chunks of size 99 (off-by-one in range step)
   - File: backend/tests/test_documents.py:15
```

### Step 3: Run Frontend Build

Since BotAssist has no frontend test framework (no Jest, no Vitest), the build is the check:

```bash
cd frontend && npm run build 2>&1
```

- Parse for: success/failure, TypeScript/JSX errors, warnings
- Vite build output goes to `frontend/dist/`
- A successful build means all imports resolve and JSX compiles

Report format:
```
## Frontend Build (Vite)

- Status: PASS / FAIL
- Output: dist/ directory created
- Errors: [list if any]
- Warnings: [list if any]
```

### Step 4: Coverage Gap Analysis

Cross-reference changed files (from `git diff --name-only main...HEAD` or `git status`) against test files:

1. Which files were recently changed?
2. Do those changed files have test coverage?
3. Report the gap:

```
## Coverage Gap Analysis

Recently changed files without tests:
- backend/app/auth.py — CHANGED, NO TESTS (should have test_auth.py)
- backend/app/database.py — CHANGED, NO TESTS (should have test_database.py)

Modules with zero test coverage (unchanged but risky):
- backend/app/main.py — 7 API routes, 0 tests
- backend/app/rag.py — RAG pipeline, 0 tests
- backend/app/config.py — settings, 0 tests
```

### Step 5: Summary and Next Action

Report format:
```
## Summary

- Backend: 3 tests, 3 passed, 0 failed
- Frontend: Build PASS
- Coverage: 1/6 modules have tests (test_documents.py only)
- Gap: auth, database, main, rag, config have ZERO tests
```

| Condition | Suggestion |
|-----------|------------|
| All tests pass, build succeeds | "All green. Run `/review` then `/close` to commit and create a PR." |
| Backend tests fail | "Tests failing. Run `/fix` to diagnose: [first failure name]" |
| Frontend build fails | "Frontend build broken. Fix JSX/import errors before proceeding." |
| Changed files have no tests | "You changed [file] but it has no tests. Write tests before committing." |
| Everything passes but coverage is low | "Tests pass but coverage is very low (1/6 modules). Consider writing tests for [module]." |

---

## Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| Python not installed | `python3` or `python -m pytest` fails | Report: "Python is not installed. Run `/onboard` to check your environment." |
| pytest not installed | `ModuleNotFoundError: pytest` | Report: "pytest not installed. Run `pip install -r requirements.txt` in the backend venv." |
| Node/npm not installed | `npm: command not found` | Report: "Node.js is not installed. Run `/onboard` to check your environment." |
| Frontend deps missing | `npm run build` fails with module not found | Report: "Run `cd frontend && npm install` first." |
| Import errors in tests | pytest collection errors | Report: "Tests crashed during collection. Check import paths and fixtures in conftest.py." |
| Backend venv not active | Wrong Python path, missing packages | Report: "Activate the virtual environment: `source backend/.venv/bin/activate`" |
| Test timeout | Command runs longer than 60 seconds | Kill the process. Report: "Tests timed out. Check for infinite loops or network calls." |

---

## Boundaries

### DO
- List existing test files and count tests per module
- Run `python -m pytest tests/ -v` for backend
- Run `npm run build` for frontend (no test framework exists yet)
- Parse and summarize results in a structured format
- Report each failure with test name, error message, and file location
- Identify modules with zero test coverage
- Provide a single clear next-action suggestion

### DO NOT
- Modify any source files or test files
- Attempt to fix failing tests (suggest `/fix` instead)
- Install dependencies or modify requirements.txt / package.json
- Write new tests (suggest that the user do it, or use `/loop`)
- Skip the backend tests even if only frontend files changed
- Dump raw pytest or Vite output — always parse and summarize

---

## Rules

- This skill is strictly **read-only** — it runs tests but never modifies code
- Always parse test output into a structured report — never dump raw console output
- Report both the count summary and individual failure details
- Always note that BotAssist has very incomplete test coverage (only test_documents.py with 3 tests)
- If tests pass, still warn about coverage gaps — passing with 3 tests is not "well tested"
- End with exactly one next-action suggestion based on the results

---

## Next Action

After running `/test`:

- All tests pass → `/review` then `/close` to wrap up
- Tests failing → `/fix` to start resolving
- Coverage too low → write tests as part of next `/loop` cycle
- Environment issues → `/onboard` to verify setup
