---
name: review
description: Review staged changes before committing — check correctness, patterns, tests, security. Use before /commit or when the user asks for a code review.
user-invocable: true
argument-hint: "[--staged | file path]"
allowed-tools: Bash, Read, Grep, Glob
model: sonnet
---

# /review — Code Review Before Commit

**Level:** L1 — Read-only analysis and reporting

Review code changes against 7 criteria: correctness, null safety, test coverage, conventions, blast radius, security, and completeness. This is a pre-commit quality gate to catch issues before they reach a PR.

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

- Modified: src/main/java/com/botree/invoice/InvoiceService.java (+8, -3)
- Modified: src/main/java/com/botree/invoice/InvoiceController.java (+2, -1)
- Total: 2 files, +10 lines, -4 lines
```

### Phase 2: Read Context

Goal: Understand the context of the changes.

1. **Read TICKET.md** (if it exists) to understand what the changes are supposed to accomplish.
2. **Read CLAUDE.md** (if it exists) for project conventions and coding standards.
3. **Read the full file** for each changed file (not just the diff) — context around the change matters.
4. **Find related test files** — for each changed source file, locate the corresponding test file.

### Phase 3: Review Against 7 Criteria

For each criterion, evaluate the changes and report findings.

#### Criterion 1: Correctness

Does the change fix the reported issue? Does it match TICKET.md acceptance criteria?

- Trace through the code change mentally: given the inputs described in the ticket, does the new code produce the correct output?
- Check that each acceptance criterion in TICKET.md is addressed by the change.
- Look for off-by-one errors, wrong comparison operators, incorrect return values.

#### Criterion 2: Null Safety

Are there any null pointer risks introduced by the change?

- New method calls on potentially nullable objects without null checks
- Returning null where a collection or Optional is expected
- Dereferencing parameters without validating them
- Chained method calls without null guards (e.g., `a.getB().getC()`)

#### Criterion 3: Test Coverage

Are there tests for the new or changed code?

- Check if existing tests cover the modified code paths
- Identify test gaps: new public methods without tests, new branches without test cases
- Check if the changed behavior has a corresponding test assertion
- Note if test files were modified (tests should generally not be modified in bug-fix tickets)

#### Criterion 4: Conventions

Does the code follow the project's established patterns?

- Naming conventions (check CLAUDE.md and existing code)
- Import organization
- Error handling patterns (exceptions vs. return codes vs. Optional)
- API response format consistency
- Branch naming format (BSW-{n}/{user}/description)

#### Criterion 5: Blast Radius

What else depends on the changed code?

- Search for other callers of modified methods: `grep -r "methodName" src/`
- Check if changed classes are injected or imported elsewhere
- Assess whether the change could affect other features or modules
- Look for shared state that might be affected

#### Criterion 6: Security

Are there any security concerns?

- No hardcoded secrets, API keys, passwords, or tokens
- Input validation on user-facing endpoints (SQL injection, XSS, path traversal)
- No overly permissive CORS or authentication bypass
- Sensitive data not logged or exposed in error messages
- Dependencies not introduced with known vulnerabilities

#### Criterion 7: Completeness

Is anything left incomplete?

- TODO or FIXME comments in the changed code
- Partial implementations (method declared but not fully implemented)
- Missing error handling for edge cases
- Acceptance criteria from TICKET.md not addressed by the change

### Phase 4: Report Findings

For each issue found, report in this format:

```
### Issue: [brief title]
- **File:** src/main/java/com/botree/invoice/InvoiceService.java:35
- **Severity:** MUST FIX / SHOULD FIX / NITPICK
- **Criterion:** Null Safety
- **Description:** The method `getAllInvoices()` now returns `repository.findAll()` directly, but `findAll()` can return null if the datasource is unavailable. Add a null check or use `Optional`.
- **Suggestion:** Wrap with `Objects.requireNonNullElse(repository.findAll(), Collections.emptyList())`
```

Severity definitions:
- **MUST FIX** — Will cause a bug, crash, security issue, or test failure. Cannot be merged as-is.
- **SHOULD FIX** — Likely to cause problems in edge cases or violates project conventions. Should be fixed before merge.
- **NITPICK** — Style preference, minor improvement, or informational. OK to merge without addressing.

### Phase 5: Verdict

After reviewing all criteria, deliver a final verdict:

```
## Review Verdict: APPROVE / APPROVE WITH SUGGESTIONS / REQUEST CHANGES

### Summary
- Correctness: PASS — changes correctly address the ticket
- Null Safety: 1 SHOULD FIX — missing null check on line 35
- Test Coverage: PASS — existing tests cover the changes
- Conventions: PASS — follows project patterns
- Blast Radius: LOW — 1 other caller, no behavior change
- Security: PASS — no concerns
- Completeness: PASS — all acceptance criteria addressed

### Issues Found: 1
- 0 MUST FIX
- 1 SHOULD FIX
- 0 NITPICK
```

Verdict criteria:
- **APPROVE** — No issues found, or only NITPICKs. Safe to commit.
- **APPROVE WITH SUGGESTIONS** — Only SHOULD FIX or NITPICK issues. Safe to commit but improvements recommended.
- **REQUEST CHANGES** — At least one MUST FIX issue. Do not commit until resolved.

If approved, suggest: "Ready to commit. Run `/close` to commit, push, and create a PR."

If requesting changes, suggest: "Fix the MUST FIX issues above, then run `/review` again."

---

## Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| No changes to review | `git diff --staged` and `git diff` both empty | Report: "No changes to review. Stage changes with `git add` or specify a file path." Stop. |
| File not found | Specified file path does not exist | Report: "File not found: {path}. Check the path and try again." Stop. |
| Binary file in diff | Diff contains binary file changes | Skip binary files. Note: "Skipping binary file: {path} — cannot review binary content." |
| Very large diff | More than 500 lines changed | Focus review on the most critical files first. Note: "Large changeset — prioritizing review of core logic files." |
| No TICKET.md | File does not exist | Skip correctness check against ticket. Note: "No TICKET.md found — reviewing without ticket context." |
| Not a git repo | `git diff` fails | If a file path was given, read the file directly. Otherwise report: "Not a git repo — specify a file path to review." |

---

## Boundaries

### DO
- Read and analyze diffs and source files for issues across all 7 criteria
- Search for callers and dependencies of changed code (blast radius)
- Report each finding with file, line, severity, and a concrete suggestion
- Read TICKET.md and CLAUDE.md for context
- Provide a clear verdict: APPROVE, APPROVE WITH SUGGESTIONS, or REQUEST CHANGES
- Suggest next action based on the verdict

### DO NOT
- Modify any files — this is strictly a read-only review
- Automatically fix issues found — report them and let the user decide
- Review files that are not part of the change (unless checking blast radius)
- Block on NITPICK issues — these should not prevent approval
- Review test files for bugs — tests are the specification
- Run tests (suggest `/test` instead)
- Report style issues as MUST FIX — style is NITPICK at most

---

## Rules

- **Read-only** — this skill analyzes code but never modifies it.
- **All 7 criteria** — evaluate every criterion for every review. Do not skip criteria even if the change looks simple.
- **Severity matters** — clearly distinguish between MUST FIX, SHOULD FIX, and NITPICK. Do not inflate severity.
- **MUST FIX blocks approval** — if any MUST FIX issue exists, the verdict must be REQUEST CHANGES.
- **Context is key** — always read the full changed file, not just the diff. Bugs hide in the surrounding code.
- **Blast radius is mandatory** — always search for other callers of changed methods. This catches regressions.
- **Be specific** — every finding must include file path, line number, and a concrete suggestion for how to fix it.
- **Tests are the spec** — if a test expects X, the code should produce X. Do not suggest changing tests.
- **One review per invocation** — review all staged changes together as a coherent changeset.

---

## Next Action

After `/review` completes:

- APPROVE → `/close` to commit, push, and create a PR
- APPROVE WITH SUGGESTIONS → Fix suggestions or proceed to `/close`
- REQUEST CHANGES → Fix the MUST FIX issues, then `/review` again
- Need to run tests → `/test` to verify before reviewing
