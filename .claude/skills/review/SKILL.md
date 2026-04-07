---
name: review
description: BotAssist code review — 7 criteria check against project security rules, dependency map, and conventions. Use before committing.
user-invocable: true
argument-hint: "[--staged | file path]"
allowed-tools: Bash, Read, Grep, Glob
model: sonnet
---

# /review — BotAssist Code Review

**Level:** L1 — Read-only analysis and reporting

Review code changes against 7 BotAssist-specific criteria: correctness, security, blast radius, tests, conventions, error handling, and frontend/backend consistency. This is a pre-commit quality gate.

---

## Phases

### Phase 1: Get the Diff

Goal: Determine what code to review.

1. **Parse the argument:**
   - No argument or `--staged` → review staged changes: `git diff --staged`
   - A file path → review that specific file: `git diff -- {path}` (or read the file if it is new/untracked)
   - No argument and nothing staged → review unstaged changes: `git diff`
2. **If no diff is available** (nothing changed), report: "No changes to review. Stage changes with `git add` or specify a file path." and stop.
3. **List the changed files** and their modification types (added, modified, deleted).

```
## Changes to Review

- Modified: backend/app/database.py (+5, -3)
- Added: backend/tests/test_database.py (+42)
- Total: 2 files, +47 lines, -3 lines
```

### Phase 2: Read Context

Goal: Understand the context of the changes.

1. **Read CLAUDE.md** — contains the dependency map, security rules, conventions, and known issues
2. **Read the full file** for each changed file (not just the diff) — context around the change matters
3. **Find related files** — using the dependency map:
   - Changed `auth.py` → also read `main.py` (imports auth)
   - Changed `database.py` → also read `main.py` and `documents.py`
   - Changed `documents.py` → also read `main.py`
   - Changed `rag.py` → also read `main.py` and `documents.py`
   - Changed `api.js` → also read `Chat.jsx`, `Upload.jsx`, `History.jsx`
   - Changed a component → also read `api.js`

### Phase 3: Review Against 7 Criteria

For each criterion, evaluate the changes and report findings.

#### Criterion 1: Correctness

Does the change fix the reported issue? Does it match the ticket acceptance criteria?

- Trace through the code change: given the expected inputs, does the new code produce the correct output?
- Check for off-by-one errors (documents.py chunk_text), wrong comparison operators, incorrect return values
- Check sort directions (documents.py list_documents, Chat.jsx messages)
- Check pagination math (Math.floor vs Math.ceil)
- Verify the fix actually addresses the root cause, not just a symptom

#### Criterion 2: Security

Check against the BotAssist security rules from CLAUDE.md:

- **No hardcoded secrets:** API keys, admin keys, and passwords must come from environment variables, not literal strings. Check `auth.py`, `config.py`, `api.js`.
- **Parameterized SQL:** All SQL queries must use `?` placeholders, never f-strings or `.format()`. Check `database.py`.
- **Constant-time auth:** API key comparison must use `hmac.compare_digest()`, never `==`. Check `auth.py`.
- **Restricted CORS:** `allow_origins` must list specific origins, never `["*"]`. Check `main.py`.
- **Auth on all mutating routes:** POST, PUT, DELETE endpoints must have `Depends(verify_admin)`. Check `main.py`.
- **File upload validation:** Validate file type and size before processing. Check `main.py` upload route and `Upload.jsx` accept attribute.
- **No prompt injection:** User input must not be passed directly into LLM prompts without sanitization. Check `rag.py`.
- **No secrets in frontend:** `api.js` and components must not contain API keys or secrets.

#### Criterion 3: Blast Radius

Use the BotAssist dependency map to check what else could break:

```
main.py  →  auth.py, database.py, documents.py, rag.py
documents.py  →  database.py, rag.py
rag.py  →  config.py, chromadb
api.js  →  all backend routes
Chat.jsx, Upload.jsx, History.jsx  →  api.js
```

- Search for all callers of changed functions:
  ```bash
  grep -rn "{function_name}" backend/app/ frontend/src/ --include="*.py" --include="*.js" --include="*.jsx"
  ```
- List every file that depends on the changed code
- Flag if any dependent files need corresponding updates

#### Criterion 4: Tests

Does the changed module have tests? If not, tests MUST be written.

- Check if `backend/tests/test_{module}.py` exists for the changed module
- BotAssist currently only has `test_documents.py` (3 tests)
- If the change touches `auth.py`, `database.py`, `main.py`, or `rag.py` — there are NO existing tests
- If no tests exist for the changed module, this is a **MUST FIX**: "Write tests for {module} before committing"
- If tests exist, verify they cover the changed code paths

#### Criterion 5: Conventions

Does the code follow BotAssist project patterns?

- **Python:** snake_case for all names, `ruff` clean, type hints on function signatures
- **React:** PascalCase components, camelCase functions, all API calls through `api.js` (never direct `fetch()` in components)
- **Commits:** conventional format `type(scope): description`
  - Types: `feat`, `fix`, `refactor`, `test`, `docs`, `security`, `chore`
  - Scopes: `api`, `rag`, `auth`, `upload`, `chat`, `history`, `frontend`, `db`
- **Branches:** `BOT-{ticket-number}/{name}/{short-desc}`

#### Criterion 6: Error Handling

- **No silent catches:** catch blocks must log or re-throw, never return `undefined` or swallow the error. Check `api.js` (all 6 functions have catch blocks).
- **No stack trace leaks:** FastAPI error responses should not include Python tracebacks. Check `main.py` exception handlers.
- **Proper HTTP status codes:** 400 for bad input, 401 for unauthorized, 404 for not found, 500 for server errors. Check `main.py` routes.
- **Input validation:** Empty strings, missing fields, and invalid types should be caught early. Check `main.py` /query route (empty message), upload route (file type).

#### Criterion 7: Frontend/Backend Consistency

If a backend route was changed, does the frontend `api.js` still match?

- Route paths: does `api.js` call the correct URL?
- Request format: does `api.js` send the expected fields (message, session_id, top_k)?
- Response handling: does the component handle the response shape correctly?
- Auth headers: does `api.js` send `X-Admin-Key` on routes that require it?
- If a new route was added, does `api.js` have a corresponding function?
- Check the Vite proxy config (`vite.config.js`): `/api/*` rewrites to `http://localhost:8000/*`

### Phase 4: Report Findings

For each issue found, report in this format:

```
### Issue: [brief title]
- **File:** backend/app/database.py:45
- **Severity:** MUST FIX / SHOULD FIX / NITPICK
- **Criterion:** Security
- **Description:** The `search_history` function still uses f-string SQL: `f"...WHERE content LIKE '%{keyword}%'"`. This is a SQL injection vulnerability.
- **Suggestion:** Use parameterized query: `cursor.execute("...WHERE content LIKE ?", (f"%{keyword}%",))`
```

Severity definitions:
- **MUST FIX** — Security vulnerability, crash, data loss, missing tests for changed module. Cannot be merged.
- **SHOULD FIX** — Logic error in edge cases, missing validation, inconsistency. Should fix before merge.
- **NITPICK** — Style preference, minor improvement. OK to merge without addressing.

### Phase 5: Verdict

After reviewing all 7 criteria, deliver a final verdict:

```
## Review Verdict: APPROVE / APPROVE WITH SUGGESTIONS / REQUEST CHANGES

### Summary
- Correctness: PASS — fix addresses the root cause
- Security: 1 MUST FIX — hardcoded key still in config.py
- Blast Radius: LOW — only main.py calls this function
- Tests: MUST FIX — no test file for database.py
- Conventions: PASS — follows snake_case, conventional commit ready
- Error Handling: 1 SHOULD FIX — catch block in api.js swallows error
- Frontend/Backend: PASS — api.js matches the updated route

### Issues Found: 3
- 1 MUST FIX (security)
- 1 MUST FIX (tests)
- 1 SHOULD FIX (error handling)
```

Verdict criteria:
- **APPROVE** — No issues found, or only NITPICKs. Safe to commit.
- **APPROVE WITH SUGGESTIONS** — Only SHOULD FIX or NITPICK issues. Safe to commit but improvements recommended.
- **REQUEST CHANGES** — At least one MUST FIX issue. Do not commit until resolved.

---

## Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| No changes to review | `git diff --staged` and `git diff` both empty | Report: "No changes to review. Stage changes with `git add` or specify a file path." Stop. |
| File not found | Specified file path does not exist | Report: "File not found: {path}. Check the path and try again." Stop. |
| Very large diff | More than 500 lines changed | Focus review on security and correctness first. Note: "Large changeset — consider splitting into smaller PRs." |
| CLAUDE.md missing | File does not exist | Skip dependency map check. Note: "No CLAUDE.md found — reviewing without project context." |
| Not a git repo | `git diff` fails | If a file path was given, read the file directly. Otherwise report: "Not a git repo — specify a file path to review." |

---

## Boundaries

### DO
- Read and analyze diffs and source files against all 7 criteria
- Search for callers and dependencies using the BotAssist dependency map
- Check security rules from CLAUDE.md (parameterized SQL, no hardcoded keys, constant-time auth, restricted CORS)
- Verify test coverage exists for changed modules
- Check frontend/backend consistency when routes change
- Report each finding with file, line, severity, and concrete suggestion
- Provide a clear verdict: APPROVE, APPROVE WITH SUGGESTIONS, or REQUEST CHANGES

### DO NOT
- Modify any files — this is strictly a read-only review
- Automatically fix issues found — report them and let the user decide
- Block on NITPICK issues — these should not prevent approval
- Run tests (suggest `/test` instead)
- Report style issues as MUST FIX — style is NITPICK at most

---

## Rules

- **Read-only** — this skill analyzes code but never modifies it.
- **All 7 criteria** — evaluate every criterion for every review. Do not skip criteria even if the change looks simple.
- **Security is paramount** — any hardcoded secret, SQL injection, timing attack, or missing auth is always MUST FIX.
- **Tests are mandatory** — if the changed module has no tests, that is MUST FIX. BotAssist only has test_documents.py.
- **MUST FIX blocks approval** — if any MUST FIX issue exists, the verdict must be REQUEST CHANGES.
- **Use the dependency map** — always check what other files depend on the changed code.
- **Be specific** — every finding must include file path, line number, and a concrete suggestion.
- **Frontend/backend sync** — if a backend route changed, always verify api.js still matches.

---

## Next Action

After `/review` completes:

- APPROVE → `/close` to commit, push, and create a PR
- APPROVE WITH SUGGESTIONS → Fix suggestions or proceed to `/close`
- REQUEST CHANGES → Fix the MUST FIX issues, then `/review` again
- Need to run tests → `/test` to verify before reviewing
