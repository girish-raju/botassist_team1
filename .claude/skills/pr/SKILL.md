---
name: pr
description: Create a pull request on GitHub with proper description — what changed, how to test, risks. Use after committing when ready to open a PR.
user-invocable: true
argument-hint: "[--draft]"
allowed-tools: Bash, Read, Grep, Glob
model: sonnet
---

# /pr — Create a Pull Request

**Level:** L0 — Sequential checklist execution

Create a well-structured pull request on GitHub with summary, test plan, risks, and linked Linear ticket. This is the step between committing code and getting it reviewed.

---

## Steps

### Step 1: Check Prerequisites

Verify the environment is ready for a PR.

1. **Check current branch:**
   ```bash
   git branch --show-current
   ```
   If on `main` or `master`: **STOP.** Report: "You are on the main branch. Create a feature branch first. Use `/ticket` to set up a branch for a ticket." Do not proceed.

2. **Check for uncommitted changes:**
   ```bash
   git status --short
   ```
   If there are uncommitted changes, warn: "You have uncommitted changes. Commit them first or they will not be included in the PR." Suggest running `/close` instead (which handles commit + push + PR).

3. **Check for commits ahead of main:**
   ```bash
   git log main..HEAD --oneline
   ```
   If no commits ahead of main: **STOP.** Report: "No commits to include in the PR. Make changes and commit first."

4. **Check gh CLI authentication:**
   ```bash
   gh auth status 2>&1
   ```
   If not authenticated: **STOP.** Report: "GitHub CLI is not authenticated. Run `gh auth login` first."

5. **Check if PR already exists:**
   ```bash
   gh pr view --json number,url,state 2>/dev/null
   ```
   If a PR already exists, report: "PR already exists: {url} (state: {state}). Use `gh pr view` to see details." Stop.

### Step 2: Push Branch to Remote

1. **Check if branch is pushed:**
   ```bash
   git rev-parse --abbrev-ref @{upstream} 2>/dev/null
   ```
2. **If not pushed or behind remote, push:**
   ```bash
   git push -u origin $(git branch --show-current)
   ```
3. **Report push status:**
   ```
   ## Push
   - Branch: BSW-123/mahesh/fix-null-pointer
   - Remote: origin
   - Status: Pushed (up to date)
   ```

### Step 3: Extract Ticket Information

1. **Parse ticket ID from branch name.** Branch format is `BSW-{n}/...`, extract `BSW-{n}`.
2. **Read TICKET.md** (if it exists) for ticket title and acceptance criteria.
3. **Try Linear API** (if `LINEAR_API_KEY` is set) to get ticket details:
   ```bash
   curl -s -X POST https://api.linear.app/graphql \
     -H "Content-Type: application/json" \
     -H "Authorization: $LINEAR_API_KEY" \
     -d '{"query": "{ issue(id: \"BSW-123\") { identifier title description url } }"}'
   ```
4. **Get the Linear ticket URL** for linking in the PR body. Format: `https://linear.app/botree-software/issue/BSW-123`

### Step 4: Generate PR Content

1. **Gather commit history for this branch:**
   ```bash
   git log main..HEAD --pretty=format:"- %s" --reverse
   ```

2. **Get the full diff against main for summary:**
   ```bash
   git diff main..HEAD --stat
   ```

3. **Read changed files** to understand the nature of the changes.

4. **Build the PR title:**
   - Keep under 70 characters
   - Format: `fix(module): short description` or `feat(module): short description`
   - Derive from the ticket title or most significant commit message
   - Example: `fix(invoice): return empty list instead of null for getAllInvoices`

5. **Build the PR body:**

```markdown
## Summary

- [1-3 bullet points describing what changed and why]
- [Focus on the "why" not the "what"]

## Linked Ticket

[BSW-123: Ticket Title](https://linear.app/botree-software/issue/BSW-123)

## Changes

[List of files changed with brief description of each change]

## Test Plan

- [ ] All existing tests pass (`mvn test`)
- [ ] [Specific test that verifies the fix]
- [ ] [Manual verification step if applicable]

## Risks

- [Assessment of blast radius — what could be affected]
- [Edge cases to watch for]
- [If low risk: "Low risk — isolated change with existing test coverage"]
```

### Step 5: Confirm with User

Present the PR to the user before creating:

```
## Pull Request Preview

**Title:** fix(invoice): return empty list instead of null for getAllInvoices
**Base:** main
**Head:** BSW-123/mahesh/fix-null-pointer
**Draft:** No

**Body:**
[formatted body from Step 4]

Create this PR? (Create / Edit / Cancel)
```

Wait for the user to respond:
- **Create** → Proceed to Step 6
- **Edit** → Ask what to change, update, re-present
- **Cancel** → Stop. Do not create the PR.

### Step 6: Create the Pull Request

1. **Determine if draft.** If the user passed `--draft` or said "draft", add the `--draft` flag.
2. **Create the PR:**
   ```bash
   gh pr create --title "fix(invoice): return empty list instead of null" --body "$(cat <<'EOF'
   ## Summary
   
   - Fixed NullPointerException in InvoiceService.getAllInvoices by returning empty list instead of null
   
   ## Linked Ticket
   
   [BSW-123: Fix NullPointerException in InvoiceService](https://linear.app/botree-software/issue/BSW-123)
   
   ## Changes
   
   - `InvoiceService.java` — Return Collections.emptyList() instead of null
   - `InvoiceController.java` — Return 404 instead of 500 for missing invoice
   
   ## Test Plan
   
   - [ ] All existing tests pass (mvn test)
   - [ ] InvoiceServiceTest#testGetAllInvoices passes
   - [ ] InvoiceControllerTest#testGetInvoiceNotFound passes
   
   ## Risks
   
   - Low risk — isolated null-handling change with full test coverage
   EOF
   )"
   ```
3. **Capture the PR URL from the output.**

### Step 7: Report

```
## Pull Request Created

- PR: #7 — fix(invoice): return empty list instead of null for getAllInvoices
- URL: https://github.com/amotion-ai/invoice-service/pull/7
- Base: main
- Head: BSW-123/mahesh/fix-null-pointer
- Status: Open (or Draft)
- Ticket: BSW-123

Next: Share the PR URL with reviewers.
Tip: Run `/update-ticket BSW-123 in-review` to update the ticket status.
```

---

## Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| On main branch | `git branch --show-current` returns `main` or `master` | **STOP.** Report: "Cannot create PR from main. Create a feature branch first." |
| Nothing committed | `git log main..HEAD` returns empty | **STOP.** Report: "No commits ahead of main. Commit changes first." |
| gh not authenticated | `gh auth status` fails | **STOP.** Report: "GitHub CLI not authenticated. Run `gh auth login`." |
| PR already exists | `gh pr view` returns a PR | Report existing PR URL and state. Stop. |
| Push fails | `git push` returns error | Report the error. If rejected due to divergence, suggest: `git pull --rebase origin {branch}`. |
| Remote not configured | `git remote -v` returns empty | Report: "No remote configured. Add one with `git remote add origin <url>`." Stop. |
| No ticket ID in branch | Branch name does not match `BSW-{n}/...` pattern | Create PR without ticket link. Note: "Could not extract ticket ID from branch name." |
| User cancels | User says "Cancel" at confirmation | Stop. Do not create the PR. |

---

## Boundaries

### DO
- Check all prerequisites before attempting to create a PR
- Push the branch to remote if not already pushed
- Extract ticket information from branch name, TICKET.md, or Linear
- Generate a well-structured PR body with summary, test plan, and risks
- Link to the Linear ticket in the PR body
- Confirm the PR content with the user before creating
- Report the final PR URL clearly
- Support `--draft` flag for draft PRs

### DO NOT
- Create a PR from the main branch — this is a hard gate
- Create a PR with no commits ahead of main
- Skip the confirmation step — always show the PR to the user first
- Force push or rebase as part of PR creation
- Modify any source files — this skill only creates the PR
- Close or merge the PR — only create it
- Set reviewers or assignees automatically (user can do this in GitHub)
- Create a PR if one already exists for this branch

---

## Rules

- **Never PR from main** — this is the most important rule. Always check the branch first.
- **Confirm before creating** — show the PR title and body to the user. Get explicit approval.
- **Link the ticket** — always include the Linear ticket link in the PR body if a ticket ID can be found.
- **Include test plan** — every PR body must have a test plan section, even if it is just "all existing tests pass."
- **Include risks** — every PR body must have a risk assessment. "Low risk" is a valid assessment.
- **Push before PR** — ensure the branch is pushed to the remote before creating the PR.
- **One PR per branch** — if a PR already exists, report it instead of creating a duplicate.
- **Title under 70 chars** — keep the PR title concise. Use the body for details.

---

## Next Action

After `/pr` completes:

- PR created → Share URL with reviewers, run `/update-ticket BSW-### in-review`
- PR already exists → Check PR status with `gh pr view`
- Push failed → Resolve the push issue and retry
- Not ready for PR → `/review` to check changes first, or `/test` to run tests
