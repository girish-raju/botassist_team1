---
name: morning
description: Daily health check — project status, test results, git state, open tickets. Use when the user starts their day or asks about project status.
user-invocable: true
argument-hint: ""
allowed-tools: Bash, Read, Grep, Glob
model: sonnet
---

# /morning — Daily Health Check

**Level:** L1 — Read-only observation and reporting

Run a complete health check on the current project: git state, test results, ticket status, and next action recommendation. This is the first thing a developer runs each morning.

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
- Branch: `feature/BOT-123-fix-null-pointer`
- Uncommitted changes: 3 files modified, 1 untracked
- Unpushed commits: 2
- Stashes: none
```

### Phase 2: Run Tests

Detect the project type and run the appropriate test command.

1. Check if `pom.xml` exists in the project root — if yes, this is a Java/Maven project
   - Run `mvn test -q 2>&1` and capture output
   - Parse the Surefire output for: Tests run, Failures, Errors, Skipped
2. Check if `package.json` exists in the project root — if yes, this is an Angular/Node project
   - Run `ng build 2>&1` and capture output
   - Parse for compilation errors and warnings
3. If both exist (full-stack project), run both

Report format:
```
## Test Results
- Java: 42 tests — 40 passed, 2 failed, 0 errors
- Angular: Build succeeded (0 errors, 1 warning)
```

For each failure, include:
- Test name (class#method for Java)
- Error message (first line only)
- File and line number if available

### Phase 3: Ticket Status

1. Read `TICKET.md` in the project root
2. Extract: ticket ID, title, acceptance criteria, current status
3. Compare ticket expectations against test results — which acceptance criteria are met?

Report format:
```
## Current Ticket
- ID: BOT-123
- Title: Fix NullPointerException in InvoiceService
- Acceptance criteria: 3 total — 2 met, 1 remaining
- Remaining: "getAllInvoices returns empty list instead of throwing"
```

### Phase 4: Next Action Suggestion

Based on the collected data, suggest one clear next action:

| Condition | Suggestion |
|-----------|------------|
| Tests are failing | "Run `/fix` to diagnose and fix the failing tests." |
| All tests pass, uncommitted changes | "Run `/close` to commit, push, and create a PR." |
| All tests pass, everything committed | "All done! Pick your next ticket from Linear." |
| No branch (on main/master) | "Create a feature branch before starting work: `git checkout -b feature/BOT-XXX-description`" |
| No TICKET.md found | "No ticket found. Check Linear for your next assignment." |
| Build/compilation errors | "Fix compilation errors before running tests." |

---

## Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| Maven not installed | `mvn` command not found | Report: "Maven is not installed. Run `/onboard` to check your environment." |
| Node/Angular not installed | `ng` command not found | Report: "Angular CLI is not installed. Run `/onboard` to check your environment." |
| Not a git repo | `git status` returns fatal error | Report: "This directory is not a git repository." |
| No TICKET.md | File does not exist | Report: "No TICKET.md found. Check Linear for ticket details." |
| Tests crash (not fail) | Maven exits with non-zero and no Surefire output | Report: "Tests crashed before running. Check compilation errors above." |
| No internet / remote unreachable | `git fetch` fails | Skip upstream comparison, note: "Could not reach remote." |

---

## Boundaries

### DO
- Read git status, branch info, and commit history
- Run tests in quiet mode to minimize output
- Read TICKET.md for context
- Provide a single, clear next-action suggestion
- Report all findings in a structured, scannable format

### DO NOT
- Modify any files
- Create commits or branches
- Push to remote
- Install dependencies or run `mvn install`
- Attempt to fix failing tests (suggest `/fix` instead)
- Run tests with `-DskipTests` or skip any checks

---

## Rules

- This skill is strictly **read-only** — it must never modify files, create commits, or change project state
- Always run tests even if git status looks clean — tests may have been broken by a rebase or merge
- Report failures clearly with test name and error message — do not dump raw Maven output
- Keep the report concise — developers scan this in 30 seconds
- If a phase fails (e.g., Maven not installed), continue with remaining phases rather than aborting
- Always end with exactly one next-action suggestion

---

## Next Action

After running `/morning`, the typical workflow is:

- Tests failing → `/fix` to diagnose and resolve
- All green, changes pending → `/close` to commit and PR
- All green, nothing pending → Pick next ticket from Linear
- Environment issues → `/onboard` to verify setup
