---
name: fix
description: Fix a bug end-to-end — reproduce, diagnose, fix, test, verify. Use when a test fails or user reports a bug.
user-invocable: true
argument-hint: "[test name or bug description]"
allowed-tools: Bash, Read, Edit, Grep, Glob
model: opus
---

# /fix — Fix a Bug End-to-End

**Level:** L3 — OBSERVE, BUILD, TEST, GATE, MUTATE

Full-cycle bug fix: reproduce the failure, diagnose the root cause, propose a fix, get approval, apply, and verify. This is the primary skill for resolving failing tests in Botree exercise repos.

---

## Phases

### Phase 1: OBSERVE — Reproduce and Diagnose

Goal: Confirm the bug exists and understand what is going wrong.

1. **Reproduce the failure.** Run `mvn test` (or `mvn test -pl . -Dtest=ClassName#methodName` if a specific test was provided). Capture full output.
2. **Identify failing tests.** Parse Surefire output for each failure: test class, method name, assertion error, expected vs. actual values.
3. **Read the failing test.** Use Grep to find the test file, then Read the test method. Understand what the test expects — this is the specification.
4. **Read the source code under test.** Trace from the test into the production code. Read the class and method being tested. Identify the exact line where behavior diverges from the test expectation.
5. **Read TICKET.md.** Cross-reference the ticket's acceptance criteria with the test failures. Confirm this is the bug the ticket describes.
6. **Identify the root cause.** Classify it:

| Category | Example |
|----------|---------|
| `null_pointer` | Calling `.equals()` on a nullable field, missing null check |
| `wrong_status` | Returning HTTP 200 instead of 404, wrong enum value |
| `off_by_one` | `<` instead of `<=`, wrong list index, boundary error |
| `missing_validation` | No check for empty input, missing required field validation |
| `wrong_filter` | Stream filter logic inverted, wrong predicate |
| `logic_error` | Incorrect conditional, wrong operator, swapped arguments |

### Phase 2: BUILD — Propose the Fix

Goal: Design the minimal correct fix.

1. **Identify the exact change needed.** Specify: file path, method name, line number, current code, proposed code.
2. **Explain the reasoning.** Why does this fix address the root cause? Why is this the right approach?
3. **Assess blast radius.** Search for other callers of the changed method. Check:
   - What other tests exercise this code path?
   - What other classes depend on this class?
   - Could this change break anything else?
4. **Keep the fix minimal.** Change only what is necessary. Do not refactor, do not improve style, do not add features.

### Phase 3: TEST — Mental Validation

Goal: Verify the fix is correct before applying it.

1. **Trace the fix through the failing test.** Walk through the test step by step with the proposed change applied. Does the assertion now pass?
2. **Check acceptance criteria.** Does the fix satisfy all criteria in TICKET.md?
3. **Check for regressions.** Will any currently-passing test break? Consider edge cases.
4. **Check for completeness.** Is this a single-point fix or are there multiple locations that need the same change?

### Phase 4: GATE — Present and Get Approval

**This phase is mandatory. Never skip the gate.**

Present the fix to the user in this exact format:

```
## Proposed Fix

**Root cause:** [category] — [one sentence explanation]

**Change:**
- File: `src/main/java/com/botree/example/Service.java`
- Method: `processInvoice()`
- Line: 47

**Before:**
```java
if (invoice.getStatus() == Status.PAID) {
```

**After:**
```java
if (invoice.getStatus() == Status.PENDING) {
```

**Why:** The method should process pending invoices, not paid ones. The comparison operator is correct but the enum value is wrong.

**Blast radius:**
- 2 other tests call `processInvoice()` — both pass and will continue to pass
- `InvoiceController` calls this method — no behavior change for valid inputs
- No other files reference `Status.PAID` in a way affected by this change

**Apply this fix?** (Apply / Modify / Reject)
```

Wait for the user to respond:
- **Apply** → Proceed to Phase 5
- **Modify** → Adjust the fix based on feedback, re-present
- **Reject** → Stop. Do not make changes.

### Phase 5: MUTATE — Apply and Verify

Goal: Apply the fix and confirm all tests pass.

1. **Apply the change** using the Edit tool. Make exactly the change that was approved in the gate.
2. **Run ALL tests** with `mvn test`. Not just the previously-failing test — run the full suite.
3. **Verify results:**
   - Previously-failing test now passes → success
   - All other tests still pass → no regression
   - New failures appeared → **regression detected**, proceed to rollback

**On regression:**
- Immediately revert the change (re-apply the original code)
- Report which tests broke and why
- Go back to Phase 2 with new information

### Phase 6: Report

Summarize the fix:

```
## Fix Summary

**Ticket:** BOT-123
**Root cause:** wrong_status — processInvoice compared against PAID instead of PENDING
**File changed:** src/main/java/com/botree/example/Service.java (line 47)
**Tests before:** 40 passed, 2 failed
**Tests after:** 42 passed, 0 failed
**Regression:** None
```

---

## Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| Cannot reproduce | Test passes when run | Report: "Cannot reproduce. The test passes. Check if the issue was already fixed or if there is an environment difference." |
| Fix causes regression | New test failures after applying fix | Immediately revert. Report which tests broke. Return to Phase 2. |
| Multiple root causes | More than one unrelated bug in the failing test path | Fix one at a time. Complete the full cycle for the first, then start a new cycle for the next. |
| Test infrastructure broken | Tests crash before assertions (compilation error, missing dependency) | Report: "Test infrastructure issue — this is not a bug in the source code." and describe the infrastructure problem. |
| Compilation error after fix | `mvn test` fails to compile | Revert immediately. The fix introduced a syntax or type error. Re-examine in Phase 2. |
| User rejects fix | User says "Reject" at gate | Stop. Do not apply any changes. Ask if the user wants to investigate a different approach. |
| Ambiguous root cause | Multiple possible explanations | Present all candidates in the gate with reasoning for each. Let the user choose. |

---

## Boundaries

### DO
- Reproduce the failure before diagnosing
- Read both the test and the source code under test
- Present a complete fix proposal at the gate with blast radius
- Wait for explicit user approval before changing any code
- Run the full test suite after applying the fix
- Revert immediately if the fix causes regression
- Classify the root cause using the standard categories

### DO NOT
- Skip the GATE phase — approval is mandatory
- Apply changes without showing the user first
- Fix more than one bug per invocation — complete one cycle, then start another
- Refactor or improve code style while fixing — minimal changes only
- Modify test files — tests are the specification, not the bug
- Run only the failing test after fixing — always run the full suite
- Guess at the fix without reading the source code
- Continue if you cannot reproduce the failure

---

## Rules

- **Reproduce first** — if you cannot reproduce the failure, you cannot fix it. Stop and report.
- **GATE is mandatory** — never apply code changes without presenting the proposal and getting explicit user approval.
- **Show blast radius** — always search for other code that depends on the changed code and report it.
- **Run ALL tests after fix** — never run only the single failing test. Regressions hide in other tests.
- **Revert immediately on regression** — if new tests fail after applying the fix, undo the change before doing anything else.
- **Minimal fix only** — change the fewest lines possible to resolve the bug. No refactoring, no style changes, no "while we're here" improvements.
- **Tests are the spec** — the test defines correct behavior. If the test expects X and the code produces Y, the code is wrong (not the test).
- **One bug per cycle** — if there are multiple unrelated failures, fix them one at a time through the full OBSERVE-BUILD-TEST-GATE-MUTATE cycle.

---

## Next Action

After `/fix` completes:

- All tests pass → `/close` to commit, push, and create a PR
- More failures remain → run `/fix` again for the next failure
- Unsure about the fix → `/test` to verify current state
- Want a broader scan → `/triage` to find other potential issues
