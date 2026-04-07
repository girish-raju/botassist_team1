---
name: close
description: Close a ticket after work is done — verify tests, commit, push, create PR. Use when the user has finished fixing a bug or implementing a feature.
user-invocable: true
argument-hint: "[ticket-id]"
allowed-tools: Bash, Read, Grep, Glob
model: sonnet
---

# /close — Close a Ticket

**Level:** L0 — Sequential checklist execution

Verify that work is complete, then commit, push, and create a pull request. This is the final step after a bug fix or feature implementation.

---

## Steps

### Step 1: Run Tests — All Must Pass

1. Detect project type (check for `pom.xml` and/or `package.json`)
2. Run `mvn test` for Java projects
3. Run `ng build` for Angular projects
4. **If any test fails: STOP.** Report the failures and suggest `/fix`. Do not proceed.
5. If all tests pass, continue.

```
## Pre-close Verification
- Java tests: 42 passed, 0 failed — OK
- Angular build: Succeeded — OK
```

### Step 2: Verify Acceptance Criteria

1. Read `TICKET.md` if it exists
2. Check each acceptance criterion against the test results
3. If any criterion is not met, report which ones and suggest what to do
4. **If acceptance criteria are not fully met: STOP.** Do not proceed.

```
## Acceptance Criteria
- [x] getAllInvoices returns empty list for no data
- [x] getInvoiceById returns 404 for missing invoice
- [x] createInvoice validates required fields
All criteria met — OK
```

### Step 3: Check Git Status

1. Run `git status --short` to see all changes
2. Run `git diff --stat` to see what has been modified
3. Report: files modified, files added, files untracked

```
## Changes
- Modified: 2 files
  - src/main/java/com/botree/invoice/InvoiceService.java
  - src/main/java/com/botree/invoice/InvoiceController.java
- Untracked: 0 files
- Staged: 0 files
```

### Step 4: Stage and Commit (if needed)

If there are uncommitted changes:

1. Show the user what will be committed: `git diff` summary
2. Suggest a commit message based on the ticket and changes
3. **Ask the user to confirm before committing.** Present the command:

```
Suggested commit:
  git add -A && git commit -m "fix(invoice): return empty list instead of null for getAllInvoices

Resolves BOT-123"

Proceed? (Yes / Modify message / Skip)
```

4. If the user confirms, execute the commit
5. If the user wants to modify, use their message instead

### Step 5: Push to Remote

1. Check if the branch has an upstream: `git rev-parse --abbrev-ref @{upstream} 2>/dev/null`
2. Get the current branch name: `git branch --show-current`
3. If no upstream is set: `git push -u origin {branch}`
4. If upstream exists: `git push origin {branch}`
5. Report success or failure

```
## Push
- Branch: feature/BOT-123-fix-null-pointer
- Pushed to: origin/feature/BOT-123-fix-null-pointer
- Status: OK
```

### Step 6: Create Pull Request (if none exists)

1. Check if a PR already exists: `gh pr view --json number,url 2>/dev/null`
2. If no PR exists, suggest creating one:

```
Suggested PR:
  Title: fix(invoice): return empty list instead of null for getAllInvoices
  Body: Resolves BOT-123. Fixed NullPointerException in InvoiceService.getAllInvoices
        by returning Collections.emptyList() instead of null.

Create this PR? (Yes / Modify / Skip)
```

3. If approved: `gh pr create --title "..." --body "..."`
4. Report the PR URL

### Step 7: Summary

```
## Ticket Closed

- Ticket: BOT-123
- Branch: feature/BOT-123-fix-null-pointer
- Tests: 42 passed, 0 failed
- Commit: abc1234 — fix(invoice): return empty list instead of null
- PR: https://github.com/botree/invoice-service/pull/7
- Status: Ready for review
```

---

## Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| Tests failing | `mvn test` or `ng build` reports failures | **STOP.** Report failures. Suggest `/fix`. Do not proceed with close. |
| Acceptance criteria not met | TICKET.md criteria not satisfied by test results | **STOP.** Report which criteria are unmet. Suggest what to fix. |
| Uncommitted changes | `git status` shows modified/untracked files | Prompt user to commit. Show suggested commit message. |
| No remote configured | `git remote -v` returns empty | Report: "No remote configured. Add a remote with `git remote add origin <url>`." |
| gh not authenticated | `gh auth status` fails | Report: "GitHub CLI not authenticated. Run `gh auth login` first." |
| PR already exists | `gh pr view` returns a PR | Report existing PR URL. Skip PR creation. |
| Not on a feature branch | Branch is `main` or `master` | **STOP.** Report: "You are on the main branch. Create a feature branch first." |
| Push rejected | `git push` fails (diverged, permissions) | Report the error. Suggest `git pull --rebase origin {branch}` if diverged. |

---

## Boundaries

### DO
- Run tests and verify they all pass before proceeding
- Check acceptance criteria from TICKET.md
- Show the user exactly what will be committed, pushed, and PR'd
- Ask for confirmation before committing and creating PR
- Report the final state clearly with PR URL

### DO NOT
- Proceed if any tests are failing — this is a hard gate
- Commit without showing the user the changes and getting confirmation
- Force push (`git push --force`) under any circumstances
- Close the ticket in Linear or any external system — only create the PR
- Modify source files — this skill only commits existing changes
- Create a PR against a branch other than main/master without asking
- Skip the test verification step

---

## Rules

- **Tests must pass** — this is a non-negotiable gate. If tests fail, stop and suggest `/fix`.
- **Never force push** — if push is rejected, diagnose the issue and suggest a safe resolution.
- **Confirm before committing** — always show the commit message and changes to the user first.
- **Confirm before creating PR** — always show the PR title and body to the user first.
- **Check acceptance criteria** — do not close a ticket unless all criteria in TICKET.md are satisfied.
- **Stay on the feature branch** — never commit directly to main or master.
- **One ticket per close** — this skill closes exactly one ticket. If multiple tickets were worked on, run `/close` for each.

---

## Next Action

After `/close` completes:

- PR created → Share the URL with reviewers, pick next ticket from Linear
- Tests failing → `/fix` to resolve failures first
- PR already exists → Check PR status, address review comments if any
- Environment issues → `/onboard` to verify setup
