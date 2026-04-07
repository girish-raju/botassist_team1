---
name: triage
description: Scan the BotAssist codebase for bugs — SQL injection, hardcoded secrets, silent errors, missing validation, test gaps. Use to find and prioritize issues.
user-invocable: true
argument-hint: "[file or directory]"
allowed-tools: Bash, Read, Grep, Glob
model: sonnet
---

# /triage — BotAssist Code Scanner

**Level:** L1 — Read-only analysis and reporting

Scan BotAssist Python and React source files for planted bugs, security vulnerabilities, logic errors, and test coverage gaps. Prioritize findings by severity and suggest next actions.

---

## Phases

### Phase 1: Determine Scan Scope

1. If a **file path** is provided as an argument, scan only that file
2. If a **directory** is provided, scan all source files in that directory (recursively)
3. If **no argument** is provided, scan the entire project:
   - Python: all `.py` files under `backend/app/` (main.py, auth.py, config.py, database.py, documents.py, rag.py)
   - React: all `.jsx` and `.js` files under `frontend/src/` (App.jsx, Chat.jsx, Upload.jsx, History.jsx, api.js)
4. List the files that will be scanned and their count

```
## Scan Scope
- Backend: 6 Python files in backend/app/
- Frontend: 6 JS/JSX files in frontend/src/
- Tests: 2 files in backend/tests/
```

### Phase 2: Security Scan

Search for security vulnerabilities specific to BotAssist:

**SQL Injection (database.py, main.py):**
- f-string or string formatting in SQL queries (e.g., `f"SELECT ... WHERE ... LIKE '%{keyword}%'"`)
- Any use of `.format()` or `%` string interpolation in SQL statements
- Grep: `grep -n "f\".*SELECT\|f\".*INSERT\|f\".*DELETE\|\.format.*SELECT" backend/app/*.py`

**Hardcoded Secrets (auth.py, config.py, api.js):**
- Hardcoded API keys, admin keys, or passwords in source code
- Grep: `grep -n "API_KEY\|ADMIN_KEY\|SECRET\|password\|token" backend/app/*.py frontend/src/*.js`
- Check if values come from environment variables or are literal strings

**Timing Attacks (auth.py):**
- Using `==` for API key or password comparison instead of `hmac.compare_digest`
- Grep: `grep -n "== .*key\|== .*token\|== .*password\|key ==\|token ==" backend/app/auth.py`

**Missing Auth (main.py):**
- Routes that should require authentication but don't use `verify_admin` dependency
- Check: DELETE /documents/{doc_id} — does it have auth?
- Grep: `grep -n "Depends(verify_admin)\|@app.delete\|@app.post\|@app.put" backend/app/main.py`

**CORS Misconfiguration (main.py):**
- `allow_origins=["*"]` instead of specific allowed origins
- Grep: `grep -n "allow_origins\|CORSMiddleware" backend/app/main.py`

**Prompt Injection (rag.py):**
- User input passed directly into LLM prompts without sanitization
- Grep: `grep -n "f\".*{.*message\|f\".*{.*query\|f\".*{.*input" backend/app/rag.py`

### Phase 3: Logic Bug Scan

Search for logic errors specific to BotAssist:

**Python patterns:**
- Off-by-one in chunk_text (documents.py): check if `range()` step parameter matches chunk_size correctly
- Wrong sort order in list_documents (documents.py): check ORDER BY direction
- Missing error handling: bare `except` or `except Exception: pass`
- Wrong HTTP status codes in route handlers
- Missing input validation (empty message in /query, missing fields)
- Unbounded parameters (top_k with no max limit)

Grep commands:
```bash
grep -n "range(" backend/app/documents.py
grep -n "ORDER BY" backend/app/database.py
grep -n "except.*pass\|except:" backend/app/*.py
grep -n "top_k\|limit\|offset" backend/app/main.py backend/app/rag.py
```

**React/JavaScript patterns:**
- Hardcoded API keys in frontend code (api.js)
- Silent error swallowing: catch blocks that return undefined or do nothing
- Missing useEffect dependency arrays
- `Math.floor` vs `Math.ceil` for pagination calculations
- Case-sensitive string comparisons where case-insensitive is needed
- Wrong sort direction for messages (Chat.jsx) or documents
- File type validation: does Upload.jsx accept the right file extensions (e.g., missing .doc)?

Grep commands:
```bash
grep -n "catch\|\.catch" frontend/src/*.js frontend/src/*.jsx
grep -n "useEffect" frontend/src/*.jsx
grep -n "Math\.\(floor\|ceil\)" frontend/src/*.jsx
grep -n "\.sort\|\.reverse\|localeCompare" frontend/src/*.jsx frontend/src/*.js
grep -n "accept=" frontend/src/Upload.jsx
grep -n "API_KEY\|api_key\|apiKey" frontend/src/*.js
```

### Phase 4: Test Coverage Gap Analysis

1. List all backend modules: `main.py`, `auth.py`, `config.py`, `database.py`, `documents.py`, `rag.py`
2. List all test files in `backend/tests/`
3. Cross-reference: which modules have ZERO test coverage?
4. Report:

```
## Test Coverage Gaps
| Module | Test File | Tests | Status |
|--------|-----------|-------|--------|
| documents.py | test_documents.py | 3 | PARTIAL |
| auth.py | — | 0 | NO TESTS |
| database.py | — | 0 | NO TESTS |
| main.py | — | 0 | NO TESTS |
| rag.py | — | 0 | NO TESTS |
| config.py | — | 0 | NO TESTS |
```

5. For `test_documents.py`, read it and check what's actually tested vs what's missing (e.g., does it test `chunk_text` edge cases? file type validation?)

### Phase 5: Prioritized Report

Compile all findings into a single prioritized report:

```
## Triage Report

### CRITICAL (security vulnerabilities, data loss, crashes)
1. [sql_injection] database.py:NN — f-string SQL in search_history
2. [hardcoded_secret] auth.py:NN — ADMIN_KEY is a literal string
3. [hardcoded_secret] config.py:NN — API_KEY fallback is a literal string
4. [timing_attack] auth.py:NN — uses == for key comparison
5. [missing_auth] main.py:NN — DELETE /documents/{doc_id} has no auth check
6. [prompt_injection] rag.py:NN — user input unsanitized in LLM prompt

### WARNING (incorrect behavior, data integrity)
7. [off_by_one] documents.py:NN — chunk_text step parameter wrong
8. [wrong_sort] documents.py:NN — list_documents returns wrong order
9. [wrong_sort] Chat.jsx:NN — messages sorted in wrong direction
10. [cors_wildcard] main.py:NN — CORS allows all origins
11. [silent_error] api.js:NN — catch blocks swallow errors

### INFO (missing tests, code smells)
12. [no_tests] auth.py — zero test coverage
13. [no_tests] database.py — zero test coverage
14. [no_tests] main.py — zero test coverage
15. [no_tests] rag.py — zero test coverage

### Summary
- CRITICAL: N
- WARNING: N
- INFO: N
- Total: N issues across N files
```

### Phase 6: Next Action Suggestion

| Condition | Suggestion |
|-----------|------------|
| CRITICAL security issues found | "Start with security fixes. Run `/loop TEC-{n}` for the SQL injection or hardcoded secrets ticket." |
| Logic bugs found | "Run `/fix` targeting the specific bug. Start with the off-by-one or sort issues." |
| Only test gaps | "Write tests first. Run `/loop TEC-{n}` for a test coverage ticket." |
| No issues found | "No issues detected in scanned files. Run `/test` to verify everything passes." |
| Multiple categories | "Found N issues. Prioritize: security first, then logic bugs, then test gaps." |

---

## Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| No source files found | Glob returns empty for `*.py` and `*.jsx` patterns | Report: "No source files found in the specified path. Check the directory." |
| File not found | Specified file argument doesn't exist | Report: "File not found: [path]. Check the path and try again." |
| Backend directory missing | `backend/app/` does not exist | Report: "Backend directory not found. Are you in the BotAssist project root?" |
| Frontend directory missing | `frontend/src/` does not exist | Report: "Frontend directory not found. Are you in the BotAssist project root?" |

---

## Boundaries

### DO
- Read and analyze source files for BotAssist-specific bug patterns
- Search for SQL injection, hardcoded secrets, timing attacks, missing auth
- Search for logic errors: off-by-one, wrong sort, silent catches, missing validation
- Check test coverage per module
- Prioritize findings by severity (CRITICAL > WARNING > INFO)
- Report each finding with file, line, severity, description, and suggested fix

### DO NOT
- Modify any files — this is strictly a read-only scan
- Run tests (suggest `/test` instead)
- Attempt to fix issues (suggest `/fix` or `/loop` instead)
- Scan node_modules/, .venv/, chroma_data/, or build output directories
- Report style issues (formatting, naming) as bugs

---

## Rules

- This skill is strictly **read-only** — it scans and reports but never modifies files
- Always prioritize findings: CRITICAL first, then WARNING, then INFO
- A CRITICAL finding is a security vulnerability, crash, or data loss risk
- A WARNING finding is incorrect behavior (wrong sort, off-by-one, silent errors)
- An INFO finding is a test gap or code smell
- Keep descriptions actionable — every finding should include a concrete suggested fix
- Reference the 28 planted bugs documented in CLAUDE.md where relevant
- For each finding, note the corresponding Linear ticket (TEC-5 to TEC-39) if known

---

## Next Action

After running `/triage`:

- CRITICAL security issues → `/loop TEC-{n}` to fix them properly
- Logic bugs → `/fix` to resolve specific bugs
- Test gaps → write tests as part of the next `/loop` cycle
- All clean → `/test` to verify tests pass
