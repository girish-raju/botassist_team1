---
name: loop
description: The mandatory development loop — triage, plan, implement, blast-radius, test, PR. Use for EVERY ticket. Cannot skip steps.
user-invocable: true
argument-hint: "<BOT-### ticket ID or description>"
allowed-tools: Bash, Read, Edit, Write, Grep, Glob
model: opus
---

# /loop — The Enforced 6-Step Development Workflow

This skill enforces the complete development cycle for every change. You CANNOT skip steps. Each step has a gate that requires explicit user approval before proceeding.

## Usage

```
/loop BOT-42 Fix search returning wrong results for multi-word queries
```

---

## STEP 1 — TRIAGE

**Goal:** Understand the issue before touching any code.

Actions:
- Read the ticket (from the argument: ticket ID or description)
- Reproduce the issue: read relevant code, run relevant tests
- Identify: what's broken, which files are involved, what's the root cause
- Report findings to the user

**Output format:**
```
TRIAGE REPORT
=============
Ticket: BOT-###
Issue: [one-line summary]
Root cause: [what's actually wrong]
Files involved:
  - path/to/file1.py (reason)
  - path/to/file2.py (reason)
Reproduction: [how to see the bug]
```

**GATE: "Triage complete. Ready to plan? (yes/no)"**

Do NOT proceed to Step 2 without explicit approval.

---

## STEP 2 — PLAN

**Goal:** Design the fix before writing code.

Actions:
- Enter Plan Mode thinking
- Propose implementation plan: files to change, approach, risks
- Identify blast radius: what other code depends on this?
- Estimate change size: Small (1 file) / Medium (2-3 files) / Large (4+ files)

**Output format:**
```
IMPLEMENTATION PLAN
===================
Approach: [what we'll do and why]
Files to change:
  1. path/to/file.py — [what changes]
  2. path/to/test.py — [what tests to add]
Blast radius: [what else could break]
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
- Create branch: `BOT-{n}/{name}/{desc}`
- Implement the changes following the approved plan exactly
- Write code, but DO NOT commit yet
- Note any deviations from the plan

**Output format:**
```
IMPLEMENTATION COMPLETE
=======================
Branch: BOT-###/name/desc
Files changed:
  - path/to/file.py — [summary of changes]
Deviations from plan: [none / list them]
```

**GATE: "Implementation done. Ready for blast radius check? (yes/no)"**

---

## STEP 4 — BLAST RADIUS

**Goal:** Verify the change doesn't break anything unexpected.

Actions:
- Search for all imports and usages of changed modules/functions:
  ```bash
  grep -r "import.*{changed_module}" --include="*.py" --include="*.jsx" .
  grep -r "{changed_function}" --include="*.py" --include="*.jsx" .
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
  - path/to/file.py — [needs update: yes/no] [reason]
  - path/to/other.py — [needs update: yes/no] [reason]
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
- Run full backend test suite: `cd backend && make test`
- Run frontend build: `cd frontend && npm run build`
- Report results

**Output format:**
```
TEST RESULTS
============
New tests written: [list]
Backend tests: PASS / FAIL
  - Total: N, Passed: N, Failed: N
  - Failures: [list if any]
Frontend build: PASS / FAIL
  - Errors: [list if any]
```

**GATE: "Tests passing. Ready to commit and PR? (yes/no)"**

- If tests FAIL: go back to Step 3 (implement) to fix. Do NOT proceed to Step 6.
- Report which tests failed and why.

---

## STEP 6 — PR

**Goal:** Create a clean, reviewable pull request.

Actions:
- Commit with conventional commit format: `type(scope): description`
- Push branch
- Create PR using the `.github/PULL_REQUEST_TEMPLATE.md` template
- Fill in ALL sections and check ALL applicable checkboxes
- Report the PR details

**Output format:**
```
PR CREATED
==========
Branch: BOT-###/name/desc
Commit: type(scope): description
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

## Failure Modes

| Failure | Response |
|---------|----------|
| User tries to skip steps | "The /loop process requires all 6 steps. Which step are you on?" |
| Tests fail | "Tests failing. Going back to Step 3 to fix. Here's what failed: ..." |
| Blast radius too large | "This change affects N files. Consider splitting into smaller PRs." |
| Plan rejected | "Plan rejected. What would you like to change?" |
| User says "just fix it" | "I'll fix it properly. Step 1: let me understand the issue first." |
