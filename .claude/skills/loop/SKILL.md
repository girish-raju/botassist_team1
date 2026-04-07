---
name: loop
description: The mandatory development loop — triage, plan, implement, blast-radius, test, PR. Use for EVERY ticket. Cannot skip steps.
user-invocable: true
argument-hint: "<TEC-### ticket ID or description>"
allowed-tools: Bash, Read, Edit, Write, Grep, Glob
model: opus
---

# /loop — The Enforced 6-Step Development Workflow

This skill enforces the complete development cycle for every BotAssist change. You CANNOT skip steps. Each step has a gate that requires explicit user approval before proceeding.

## Usage

```
/loop TEC-12 Fix SQL injection in search_history
```

---

## STEP 1 — TRIAGE

**Goal:** Understand the issue before touching any code.

Actions:
- Read the ticket (from the argument: ticket ID or description)
- Reproduce the issue: read relevant source files in the BotAssist codebase
- Consult the dependency map in CLAUDE.md to understand how files connect:
  - `main.py` → imports `auth.py`, `database.py`, `documents.py`, `rag.py`
  - `documents.py` → imports `database.py`, `rag.py`
  - `rag.py` → imports `config.py`, uses `chromadb`
  - `frontend/api.js` → calls all backend routes via `/api/*` proxy
- Identify: what's broken, which files are involved, what's the root cause
- Run existing tests: `cd backend && python -m pytest tests/ -v`

**Output format:**
```
TRIAGE REPORT
=============
Ticket: TEC-###
Issue: [one-line summary]
Root cause: [what's actually wrong]
Files involved:
  - backend/app/main.py (reason)
  - backend/app/database.py (reason)
  - frontend/src/api.js (reason)
Reproduction: [how to see the bug]
Related bugs: [any of the 28 planted bugs that interact with this]
```

**GATE: "Triage complete. Ready to plan? (yes/no)"**

Do NOT proceed to Step 2 without explicit approval.

---

## STEP 2 — PLAN

**Goal:** Design the fix before writing code.

Actions:
- Enter Plan Mode thinking
- Propose implementation plan: files to change, approach, risks
- Identify blast radius using the BotAssist dependency map:
  - Changing `auth.py` → affects `main.py` upload + query routes
  - Changing `database.py` → affects `main.py`, `documents.py` (all DB operations)
  - Changing `documents.py` → affects `main.py` upload/list/delete routes
  - Changing `rag.py` → affects `main.py` query route, `documents.py` ingestion
  - Changing `config.py` → affects `rag.py` (API key), `auth.py` (admin key)
  - Changing `api.js` → affects `Chat.jsx`, `Upload.jsx`, `History.jsx`
- Estimate change size: Small (1 file) / Medium (2-3 files) / Large (4+ files)

**Output format:**
```
IMPLEMENTATION PLAN
===================
Approach: [what we'll do and why]
Files to change:
  1. backend/app/database.py — [what changes]
  2. backend/tests/test_database.py — [what tests to add]
Blast radius:
  - database.py is imported by main.py and documents.py
  - [list affected routes and functions]
Size: Small / Medium / Large
Risks: [anything that could go wrong]
```

**GATE: "Plan ready. Approve this plan? (approve/modify/reject)"**

- If **approve**: proceed to Step 3
- If **modify**: update the plan and re-present
- If **reject**: go back to Step 1 or stop

---

## STEP 3 — IMPLEMENT

**Goal:** Write the code following the approved plan.

Actions:
- Create branch: `BOT-{n}/{name}/{desc}` (e.g., `BOT-12/mahesh/fix-sql-injection`)
- Implement the changes following the approved plan exactly
- Write code, but DO NOT commit yet
- Note any deviations from the plan

**Output format:**
```
IMPLEMENTATION COMPLETE
=======================
Branch: BOT-###/name/desc
Files changed:
  - backend/app/database.py — [summary of changes]
  - backend/tests/test_database.py — [new tests added]
Deviations from plan: [none / list them]
```

**GATE: "Implementation done. Ready for blast radius check? (yes/no)"**

---

## STEP 4 — BLAST RADIUS

**Goal:** Verify the change doesn't break anything unexpected.

Actions:
- Search for all imports and usages of changed modules/functions:
  ```bash
  # Check Python imports
  grep -r "from app.database import\|import database" backend/app/ --include="*.py"
  grep -r "from app.auth import\|import auth" backend/app/ --include="*.py"
  grep -r "from app.rag import\|import rag" backend/app/ --include="*.py"
  grep -r "from app.documents import\|import documents" backend/app/ --include="*.py"
  grep -r "from app.config import\|import config" backend/app/ --include="*.py"

  # Check function call sites
  grep -rn "search_history\|save_chat_message\|get_chat_history\|init_db" backend/app/ --include="*.py"
  grep -rn "verify_admin\|check_api_key" backend/app/ --include="*.py"
  grep -rn "ingest_document\|list_documents\|remove_document\|chunk_text" backend/app/ --include="*.py"
  grep -rn "query_documents\|generate_answer" backend/app/ --include="*.py"

  # Check frontend API calls
  grep -rn "uploadDocument\|fetchDocuments\|deleteDocument\|sendQuery\|fetchHistory\|searchHistory" frontend/src/ --include="*.js" --include="*.jsx"
  ```
- List every file that imports or uses the changed code
- Check if any of those files need updates
- Flag any unexpected dependencies

**Output format:**
```
BLAST RADIUS CHECK
==================
Changed: [module/function names]
Files that import/use this code:
  - backend/app/main.py — [needs update: yes/no] [reason]
  - backend/app/documents.py — [needs update: yes/no] [reason]
  - frontend/src/api.js — [needs update: yes/no] [reason]
Total affected files: N
Action needed: [none / list required updates]
```

**GATE: "Blast radius checked. N files affected. Ready to test? (yes/no)"**

- If blast radius reveals unexpected dependencies, recommend going back to Step 2 to revise the plan.
- If more than 5 files affected, suggest splitting into smaller PRs.

---

## STEP 5 — TEST

**Goal:** Verify everything works.

Actions:
- Write tests for the changes (if not already done in Step 3)
- Run full backend test suite: `cd backend && python -m pytest tests/ -v`
- Run frontend build check: `cd frontend && npm run build`
- Report results
- Note: only `test_documents.py` exists (3 tests). If you changed `auth.py`, `rag.py`, `main.py`, or `database.py`, you MUST write new test files.

**Output format:**
```
TEST RESULTS
============
New tests written:
  - backend/tests/test_auth.py (2 tests)
  - backend/tests/test_database.py (3 tests)
Backend tests: PASS / FAIL
  - Total: N, Passed: N, Failed: N
  - Failures: [list if any]
Frontend build: PASS / FAIL
  - Errors: [list if any]
Coverage gaps remaining: [modules still without tests]
```

**GATE: "Tests passing. Ready to commit and PR? (yes/no)"**

- If tests FAIL: go back to Step 3 (implement) to fix. Do NOT proceed to Step 6.
- Report which tests failed and why.

---

## STEP 6 — PR

**Goal:** Create a clean, reviewable pull request.

Actions:
- Commit with conventional commit format: `type(scope): description`
  - Types: `feat`, `fix`, `refactor`, `test`, `docs`, `security`, `chore`
  - Scopes: `api`, `rag`, `auth`, `upload`, `chat`, `history`, `frontend`, `db`
  - Examples:
    - `fix(db): parameterize SQL in search_history to prevent injection`
    - `security(auth): use hmac.compare_digest for constant-time key comparison`
    - `fix(frontend): correct message sort order in Chat.jsx`
- Push branch
- Create PR using the `.github/PULL_REQUEST_TEMPLATE.md` template
- Fill in ALL sections and check ALL applicable checkboxes
- Report the PR details

**Output format:**
```
PR CREATED
==========
Branch: BOT-###/name/desc
Commit: fix(db): parameterize SQL in search_history
PR URL: [url]
Summary: [one paragraph]
Checklist: All items checked
```

---

## Rules

- **NEVER skip a step.** If the user says "just do step 3" — remind them: "The /loop process requires all 6 steps. Which step are you on?"
- Each GATE requires explicit user approval before proceeding.
- If tests fail in Step 5, go back to Step 3 (implement), not Step 6.
- If blast radius reveals unexpected dependencies, go back to Step 2 (plan).
- Log each step's outcome for the final PR description.
- Every changed module MUST have tests. BotAssist currently only has `test_documents.py` — auth, rag, main, and database have zero test coverage.

## Failure Modes

| Failure | Response |
|---------|----------|
| User tries to skip steps | "The /loop process requires all 6 steps. Which step are you on?" |
| Tests fail | "Tests failing. Going back to Step 3 to fix. Here's what failed: ..." |
| Blast radius too large | "This change affects N files. Consider splitting into smaller PRs." |
| Plan rejected | "Plan rejected. What would you like to change?" |
| User says "just fix it" | "I'll fix it properly. Step 1: let me understand the issue first." |
| No tests for changed module | "This module has no tests. Writing tests before proceeding to Step 6." |
