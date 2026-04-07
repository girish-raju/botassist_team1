---
name: ticket
description: Start working on a ticket — fetch from Linear, understand scope, plan implementation, create branch. Use when the user picks a ticket or says "work on BSW-X".
user-invocable: true
argument-hint: "<BSW-### or ticket description>"
allowed-tools: Bash, Read, Edit, Grep, Glob
model: opus
---

# /ticket — Start Working on a Ticket

**Level:** L3 — FETCH, UNDERSTAND, ANALYZE, PLAN, GATE, BRANCH

Pick up a ticket from Linear (or TICKET.md), understand the scope, plan the implementation, get approval, and create a working branch. This is the entry point for all new work.

---

## Phases

### Phase 1: FETCH — Get Ticket Details

Goal: Retrieve the full ticket context from Linear or local TICKET.md.

1. **Parse the argument.** Extract the ticket identifier (e.g., `BSW-123`) from the user's input. If the user gave a description instead of an ID, search for it.
2. **Try Linear first.** Query the Linear API for the ticket:

```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d '{"query": "{ issue(id: \"BSW-123\") { identifier title description priority state { name } assignee { name } labels { nodes { name } } team { name } url } }"}'
```

Note: The `id` field in the `issue` query accepts identifiers like `BSW-123`. If this returns an error, try fetching by searching within the team:

```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d '{"query": "{ issueSearch(filter: { team: { id: { eq: \"186fc3de-4e72-479f-a1ef-cddb3e7f6df9\" } }, number: { eq: 123 } }) { nodes { identifier title description priority state { name } assignee { name } labels { nodes { name } } url } } }"}'
```

3. **Fallback to TICKET.md.** If Linear is unreachable (no API key, network error, or API returns an error), read `TICKET.md` in the project root for ticket details.
4. **Extract key fields:** ticket ID, title, description, priority (1=urgent, 2=high, 3=medium, 4=low), current status, labels, assignee.

Report format:
```
## Ticket Fetched

- ID: BSW-123
- Title: Fix NullPointerException in InvoiceService.getAllInvoices
- Priority: 2 (High)
- Status: Todo
- Labels: Bug
- Source: Linear API
```

### Phase 2: UNDERSTAND — Extract Requirements

Goal: Break the ticket into clear problem statement and acceptance criteria.

1. **Read the ticket description.** Parse:
   - **Problem statement** — What is broken or what needs to be built?
   - **Acceptance criteria** — What specific behaviors must be true when the work is done? Convert to a checklist.
   - **Affected files/modules** — Any files, classes, or modules mentioned in the ticket.
2. **Read CLAUDE.md** in the project root for project conventions, tech stack, and coding standards.
3. **Read TICKET.md** if it exists — it may have additional local context not in Linear.

Report format:
```
## Requirements

**Problem:** InvoiceService.getAllInvoices() returns null instead of an empty list when no invoices exist, causing NullPointerException in callers.

**Acceptance Criteria:**
- [ ] getAllInvoices() returns an empty list (not null) when no invoices exist
- [ ] getInvoiceById() returns 404 (not 500) when invoice is not found
- [ ] All existing tests continue to pass

**Affected Modules:** InvoiceService, InvoiceController
```

### Phase 3: ANALYZE — Scope the Work

Goal: Identify what needs to change and estimate effort.

1. **Find relevant source files.** Use Grep and Glob to locate files mentioned in the ticket or related to the problem.
2. **Read the source code.** Understand the current behavior of the affected code paths.
3. **Check existing tests.** Find test files that exercise the affected code. Read them to understand expected behavior.
4. **Check for dependencies.** What other code calls the affected methods? What is the blast radius of changes?
5. **Estimate scope:**

| Size | Criteria |
|------|----------|
| Small | 1-2 files, < 20 lines changed, straightforward fix |
| Medium | 3-5 files, 20-80 lines changed, some complexity |
| Large | 6+ files, 80+ lines changed, architectural implications |

Report format:
```
## Analysis

**Files to change:**
- src/main/java/com/botree/invoice/InvoiceService.java (lines 33-40)
- src/main/java/com/botree/invoice/InvoiceController.java (line 28)

**Existing tests:**
- InvoiceServiceTest — 4 test methods (2 currently failing)
- InvoiceControllerTest — 3 test methods (1 currently failing)

**Dependencies:**
- InvoiceController calls InvoiceService.getAllInvoices()
- No other callers found

**Scope:** Small — 2 files, ~10 lines changed
```

### Phase 4: PLAN — Propose Implementation

Goal: Create a concrete implementation plan for user approval.

1. **Write 3-5 implementation steps.** Each step should specify:
   - Which file to change
   - What change to make (conceptually)
   - Why this change is needed
2. **Identify tests to add or modify** (if any).
3. **Identify risks** — what could go wrong, what edge cases to watch for.

Report format:
```
## Implementation Plan

1. **Fix InvoiceService.getAllInvoices()** — Return `Collections.emptyList()` instead of `null` when the repository returns no results (InvoiceService.java:35)
2. **Fix InvoiceController.getInvoiceById()** — Return `ResponseEntity.notFound()` instead of letting the NullPointerException propagate (InvoiceController.java:28)
3. **Run full test suite** — Verify both fixes resolve the 3 failing tests without introducing regressions

**Tests:** No new tests needed — existing tests already cover the expected behavior
**Risks:** Low — changes are isolated to null-handling logic
```

### Phase 5: GATE — Get User Approval

**This phase is mandatory. Never skip the gate.**

Present the full plan to the user:

```
## Ready to Start

**Ticket:** BSW-123 — Fix NullPointerException in InvoiceService.getAllInvoices
**Scope:** Small (2 files, ~10 lines)
**Plan:** 3 steps (see above)

Approve this plan? (Approve / Modify / Reject)
```

Wait for the user to respond:
- **Approve** → Proceed to Phase 6
- **Modify** → Adjust the plan based on feedback, re-present
- **Reject** → Stop. Do not create a branch or make changes.

### Phase 6: BRANCH — Create Working Branch

Goal: Set up a clean feature branch for the work.

1. **Ensure we are on main and up to date:**
   ```bash
   git checkout main && git pull origin main
   ```
2. **Create the feature branch:**
   ```bash
   git checkout -b BSW-{n}/{user}/short-description
   ```
   - `{n}` is the ticket number (e.g., 123)
   - `{user}` is derived from `git config user.name` or `whoami` (lowercase, no spaces)
   - `short-description` is 2-4 words from the ticket title, kebab-case (e.g., `fix-null-pointer`)
   - Example: `BSW-123/mahesh/fix-null-pointer`
3. **Update ticket status in Linear** (if API is accessible). Move to "In Progress":
   - First, fetch the team's workflow states to find the "In Progress" state ID:
   ```bash
   curl -s -X POST https://api.linear.app/graphql \
     -H "Content-Type: application/json" \
     -H "Authorization: $LINEAR_API_KEY" \
     -d '{"query": "{ team(id: \"186fc3de-4e72-479f-a1ef-cddb3e7f6df9\") { states { nodes { id name } } } }"}'
   ```
   - Then update the issue:
   ```bash
   curl -s -X POST https://api.linear.app/graphql \
     -H "Content-Type: application/json" \
     -H "Authorization: $LINEAR_API_KEY" \
     -d '{"query": "mutation { issueUpdate(id: \"ISSUE_UUID\", input: { stateId: \"IN_PROGRESS_STATE_ID\" }) { success issue { identifier state { name } } } }"}'
   ```
4. **Report:**

```
## Branch Created

- Branch: BSW-123/mahesh/fix-null-pointer
- Base: main (up to date)
- Ticket status: In Progress (updated in Linear)

Ready to implement. Run `/fix` or start coding.
```

---

## Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| Ticket not found | Linear API returns null or error, and no TICKET.md exists | Report: "Ticket not found. Check the identifier and try again, or create a TICKET.md manually." |
| Linear unreachable | No `LINEAR_API_KEY` env var, network error, or API timeout | Fall back to TICKET.md. Report: "Linear unreachable — using TICKET.md for ticket details." |
| Already on a feature branch | `git branch --show-current` is not `main` or `master` | Warn: "You are already on branch {name}. Switch to main first, or confirm you want to create a sub-branch." |
| Uncommitted changes | `git status --short` shows modifications | Warn: "You have uncommitted changes. Commit or stash them before switching branches." |
| Branch already exists | `git checkout -b` fails because branch exists | Report: "Branch already exists. Switch to it with `git checkout BSW-{n}/...` or choose a different name." |
| No CLAUDE.md | File does not exist in project root | Skip project conventions step. Note: "No CLAUDE.md found — proceeding without project conventions." |
| User rejects plan | User says "Reject" at gate | Stop. Do not create a branch or make any changes. |

---

## Boundaries

### DO
- Fetch ticket details from Linear API or TICKET.md before doing anything else
- Read CLAUDE.md for project conventions and coding standards
- Analyze source code and tests to understand scope before planning
- Present a clear implementation plan with file paths, changes, and risks
- Wait for explicit user approval at the gate before creating a branch
- Create a well-named branch from an up-to-date main
- Update ticket status in Linear when moving to In Progress

### DO NOT
- Skip the GATE phase — user approval is mandatory before creating a branch
- Start coding or modifying files — this skill only plans and creates the branch
- Create a branch from a stale main — always pull first
- Create a branch if there are uncommitted changes — warn the user
- Assume ticket details without reading them from Linear or TICKET.md
- Modify test files or source files during this skill
- Force-create a branch that already exists

---

## Rules

- **Fetch before planning** — always read the ticket from Linear or TICKET.md before analyzing code.
- **Read CLAUDE.md** — project conventions inform the plan. Skip gracefully if it does not exist.
- **GATE is mandatory** — never create a branch without user approval of the plan.
- **Branch from main** — always ensure main is up to date before branching.
- **Name branches consistently** — format is `BSW-{n}/{user}/short-description`.
- **Plan before code** — this skill produces a plan, not code changes. Use `/fix` to implement.
- **Estimate scope honestly** — do not underestimate. If it looks Large, say so.
- **Linear is optional** — the skill must work fully even without Linear access by using TICKET.md.

---

## Next Action

After `/ticket` completes:

- Plan approved, branch created → `/fix` to start implementing the plan
- Plan rejected → Discuss with the user, modify approach, or pick a different ticket
- Need more context → Read more source files or ask the user for clarification
- Want to check project health first → `/morning` or `/test`
