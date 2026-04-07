---
name: fix
description: Fix a BotAssist bug end-to-end — reproduce, diagnose, fix, test, verify. Use when a test fails or user reports a bug.
user-invocable: true
argument-hint: "[test name, bug category, or description]"
allowed-tools: Bash, Read, Edit, Grep, Glob
model: opus
---

# /fix — Fix a BotAssist Bug End-to-End

**Level:** L3 — OBSERVE, BUILD, TEST, GATE, MUTATE

Full-cycle bug fix: reproduce the failure, diagnose the root cause, propose a fix, get approval, apply, and verify. This is the primary skill for resolving bugs in the BotAssist codebase (28 planted bugs across backend and frontend).

---

## Phases

### Phase 1: OBSERVE — Reproduce and Diagnose

Goal: Confirm the bug exists and understand what is going wrong.

1. **Reproduce the failure.** Run `cd backend && python -m pytest tests/ -v` to see current test state. If a specific file or function was mentioned, read that code directly.
2. **Identify the issue.** Read the relevant source file and trace the bug. The BotAssist source files are:
   - `backend/app/main.py` — FastAPI routes (upload, query, delete, search, chat history)
   - `backend/app/auth.py` — API key authentication
   - `backend/app/config.py` — Pydantic settings, environment config
   - `backend/app/database.py` — SQLite operations (init, save, query, search)
   - `backend/app/documents.py` — Document upload, chunking, listing
   - `backend/app/rag.py` — ChromaDB vector store + Claude API integration
   - `frontend/src/api.js` — API client (6 functions calling backend routes)
   - `frontend/src/Chat.jsx` — Chat interface
   - `frontend/src/Upload.jsx` — Document upload UI
   - `frontend/src/History.jsx` — Chat history + search
3. **Read the test.** If a test exists for this module, read it to understand the expected behavior.
4. **Classify the root cause** using BotAssist-specific categories:

| Category | Location | Description |
|----------|----------|-------------|
| `sql_injection` | database.py `search_history` | f-string SQL instead of parameterized query |
| `hardcoded_secret` | auth.py ADMIN_KEY | Literal string instead of env variable |
| `hardcoded_secret` | config.py API_KEY | Fallback is a literal key, not a safe default |
| `hardcoded_secret` | api.js API_KEY | API key embedded in frontend JavaScript |
| `timing_attack` | auth.py `==` comparison | Uses `==` instead of `hmac.compare_digest` |
| `missing_auth` | main.py DELETE route | No `Depends(verify_admin)` on delete endpoint |
| `cors_wildcard` | main.py CORS config | `allow_origins=["*"]` instead of specific origins |
| `prompt_injection` | rag.py `generate_answer` | User input passed unsanitized into LLM prompt |
| `off_by_one` | documents.py `chunk_text` | Wrong step value in `range()` for chunking |
| `wrong_sort` | documents.py `list_documents` | ORDER BY direction is wrong (ASC vs DESC) |
| `wrong_sort` | Chat.jsx message sort | Messages sorted in wrong direction |
| `silent_error` | api.js all catch blocks | catch returns undefined instead of throwing/reporting |
| `missing_validation` | main.py /query route | Empty message not rejected |
| `missing_validation` | Upload.jsx accept attr | Wrong/missing file extensions in accept list |
| `wrong_comparison` | History.jsx or similar | Case-sensitive comparison where insensitive needed |
| `pagination_error` | components | Math.floor instead of Math.ceil for page count |

### Phase 2: BUILD — Propose the Fix

Goal: Design the minimal correct fix.

1. **Identify the exact change needed.** Specify: file path, function name, line number, current code, proposed code.
2. **Explain the reasoning.** Why does this fix address the root cause?
3. **Assess blast radius.** Use the BotAssist dependency map:
   - `auth.py` → used by `main.py` (upload + query routes)
   - `database.py` → used by `main.py` and `documents.py`
   - `documents.py` → used by `main.py` (upload, list, delete routes)
   - `rag.py` → used by `main.py` (query route) and `documents.py` (ingestion)
   - `config.py` → used by `rag.py` and `auth.py`
   - `api.js` → used by `Chat.jsx`, `Upload.jsx`, `History.jsx`
4. **Keep the fix minimal.** Change only what is necessary.

### Phase 3: TEST — Mental Validation

Goal: Verify the fix is correct before applying it.

1. **Trace the fix through the code.** Walk through the function with the proposed change. Does it produce correct behavior?
2. **Check for regressions.** Will existing tests (test_documents.py) still pass?
3. **Check for completeness.** Is this a single-point fix or does the same pattern exist elsewhere? (e.g., if fixing one hardcoded secret, check if there are others)

### Phase 4: GATE — Present and Get Approval

**This phase is mandatory. Never skip the gate.**

Present the fix to the user in this exact format:

```
## Proposed Fix

**Root cause:** [category] — [one sentence explanation]

**Change:**
- File: `backend/app/database.py`
- Function: `search_history()`
- Line: NN

**Before:**
```python
cursor.execute(f"SELECT * FROM chat_history WHERE content LIKE '%{keyword}%'")
```

**After:**
```python
cursor.execute("SELECT * FROM chat_history WHERE content LIKE ?", (f"%{keyword}%",))
```

**Why:** The f-string SQL allows injection. Parameterized queries pass user input safely.

**Blast radius:**
- `search_history` is called by main.py /search route
- No other callers — change is isolated
- Existing tests in test_documents.py do not test search — no regression risk

**Apply this fix?** (Apply / Modify / Reject)
```

Wait for the user to respond:
- **Apply** → Proceed to Phase 5
- **Modify** → Adjust the fix based on feedback, re-present
- **Reject** → Stop. Do not make changes.

### Phase 5: MUTATE — Apply and Verify

Goal: Apply the fix and confirm everything works.

1. **Apply the change** using the Edit tool. Make exactly the change that was approved in the gate.
2. **Run ALL backend tests** with `cd backend && python -m pytest tests/ -v`. Run the full suite, not just one test.
3. **Run frontend build** with `cd frontend && npm run build` if frontend files were changed.
4. **Verify results:**
   - Previously-failing test now passes (if applicable) → success
   - All other tests still pass → no regression
   - Frontend builds clean → no compilation errors
   - New failures appeared → **regression detected**, proceed to rollback

**On regression:**
- Immediately revert the change (re-apply the original code)
- Report which tests broke and why
- Go back to Phase 2 with new information

### Phase 6: Report

Summarize the fix:

```
## Fix Summary

**Ticket:** TEC-###
**Root cause:** sql_injection — search_history used f-string SQL
**File changed:** backend/app/database.py (line NN)
**Tests before:** 3 passed, 0 failed
**Tests after:** 3 passed, 0 failed (+ new test if written)
**Frontend build:** PASS
**Regression:** None
**Tests still missing for:** auth.py, rag.py, main.py (zero coverage)
```

---

## Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| Cannot reproduce | Code looks correct or test passes | Report: "Cannot reproduce. The code appears correct or the issue was already fixed." |
| Fix causes regression | New test failures after applying fix | Immediately revert. Report which tests broke. Return to Phase 2. |
| Multiple root causes | More than one bug in the failing code path | Fix one at a time. Complete the full cycle for the first, then start a new `/fix` for the next. |
| No tests exist for the module | Changed module has zero test files | Write a basic test before proceeding. BotAssist only has test_documents.py. |
| User rejects fix | User says "Reject" at gate | Stop. Do not apply any changes. Ask if the user wants a different approach. |
| Ambiguous root cause | Multiple possible explanations | Present all candidates in the gate with reasoning for each. Let the user choose. |

---

## Boundaries

### DO
- Reproduce the failure before diagnosing
- Read both the test (if it exists) and the source code under test
- Classify the root cause using BotAssist-specific categories
- Present a complete fix proposal at the gate with blast radius
- Wait for explicit user approval before changing any code
- Run the full test suite after applying the fix
- Revert immediately if the fix causes regression

### DO NOT
- Skip the GATE phase — approval is mandatory
- Apply changes without showing the user first
- Fix more than one bug per invocation — complete one cycle, then start another
- Refactor or improve code style while fixing — minimal changes only
- Modify test files — tests are the specification, not the bug
- Run only a single test after fixing — always run the full suite
- Guess at the fix without reading the source code

---

## Rules

- **Reproduce first** — if you cannot reproduce the failure, you cannot fix it. Stop and report.
- **GATE is mandatory** — never apply code changes without presenting the proposal and getting explicit user approval.
- **Show blast radius** — always check the BotAssist dependency map and report affected files.
- **Run ALL tests after fix** — `cd backend && python -m pytest tests/ -v` for backend, `cd frontend && npm run build` for frontend.
- **Revert immediately on regression** — if new tests fail after applying the fix, undo the change before doing anything else.
- **Minimal fix only** — change the fewest lines possible to resolve the bug. No refactoring, no style changes.
- **One bug per cycle** — BotAssist has 28 planted bugs. Fix them one at a time through the full OBSERVE-BUILD-TEST-GATE-MUTATE cycle.

---

## Next Action

After `/fix` completes:

- All tests pass → `/close` to commit, push, and create a PR
- More failures remain → run `/fix` again for the next failure
- Unsure about the fix → `/test` to verify current state
- Want a broader scan → `/triage` to find other BotAssist bugs
