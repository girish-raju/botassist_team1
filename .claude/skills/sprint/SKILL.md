---
name: sprint
description: Show sprint status — tickets by status, what's done, what's in progress, what's blocked. Use when the user asks about overall progress or sprint status.
user-invocable: true
argument-hint: ""
allowed-tools: Bash, Read, Grep, Glob
model: sonnet
---

# /sprint — Sprint Status Overview

**Level:** L1 — Read-only observation and reporting

Fetch all BSW tickets from Linear and present a structured sprint overview: tickets grouped by status, progress metrics, and suggestions for what to work on next. This is the big-picture view of the team's work.

---

## Configuration

**Linear Team:** Botree Software (BSW)
- Team ID: `186fc3de-4e72-479f-a1ef-cddb3e7f6df9`

---

## Steps

### Step 1: Verify Linear Access

1. Check that `LINEAR_API_KEY` is set:
   ```bash
   test -n "$LINEAR_API_KEY" && echo "OK" || echo "MISSING"
   ```
2. If missing, report: "LINEAR_API_KEY is not set. Cannot fetch sprint data from Linear." and stop.

### Step 2: Fetch All Team Issues

Query Linear for all BSW team issues with their current status, priority, assignee, and timestamps:

```bash
curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d '{
    "query": "{ team(id: \"186fc3de-4e72-479f-a1ef-cddb3e7f6df9\") { issues(first: 100, orderBy: updatedAt) { nodes { identifier title priority state { name type } assignee { name } labels { nodes { name } } createdAt updatedAt url } } } }"
  }'
```

Parse the response and extract all issues with their fields.

### Step 3: Group by Status

Organize tickets into workflow status groups. Use the `state.name` field from Linear:

1. **Backlog** — tickets not yet planned for work
2. **Todo** — tickets planned but not started
3. **In Progress** — tickets currently being worked on
4. **In Review** — tickets with PRs awaiting review
5. **Done** — completed tickets
6. **Canceled** — tickets that were dropped

For each ticket, display:
```
- BSW-### | P{priority} | Title (Assignee)
```

Priority display:
- P1 = Urgent (mark with indicator)
- P2 = High
- P3 = Medium
- P4 = Low
- P0 = No priority set

### Step 4: Present the Sprint Board

Format the output as a clear sprint board:

```
## Sprint Status — Botree Software (BSW)

### Backlog (3)
- BSW-18 | P3 | Add pagination to invoice list (Unassigned)
- BSW-19 | P4 | Update footer copyright year (Unassigned)
- BSW-20 | P3 | Refactor service layer error handling (Unassigned)

### Todo (4)
- BSW-14 | P2 | Fix duplicate invoice creation (Mahesh)
- BSW-15 | P2 | Add validation for invoice amount (Unassigned)
- BSW-16 | P3 | Improve error messages on 400 responses (Unassigned)
- BSW-17 | P3 | Add unit tests for InvoiceMapper (Unassigned)

### In Progress (2)
- BSW-12 | P1 | Fix NullPointerException in getAllInvoices (Mahesh) -- 4 days
- BSW-13 | P2 | Return 404 instead of 500 for missing invoice (Mahesh) -- 1 day

### In Review (1)
- BSW-11 | P2 | Fix date parsing in invoice import (Mahesh)

### Done (5)
- BSW-1 | P2 | Set up project skeleton
- BSW-2 | P2 | Implement basic CRUD endpoints
- BSW-3 | P2 | Add Spring Data JPA integration
- BSW-4 | P3 | Configure CORS for Angular frontend
- BSW-5 | P1 | Fix database connection pool exhaustion
```

For "In Progress" tickets, calculate the number of days since the ticket entered that state (use `updatedAt` as an approximation). Display it after the assignee.

### Step 5: Summary Metrics

```
## Summary

| Status      | Count |
|-------------|-------|
| Backlog     | 3     |
| Todo        | 4     |
| In Progress | 2     |
| In Review   | 1     |
| Done        | 5     |
| Canceled    | 0     |
| **Total**   | **15**|

**Progress:** 5 of 15 tickets done (33%)
**Active work:** 3 tickets in progress or review
```

### Step 6: Highlight Potential Issues

Identify and flag potential problems:

1. **Stuck tickets** — In Progress for 3+ days:
   ```
   ## Attention Needed

   POTENTIALLY STUCK:
   - BSW-12 | In Progress for 4 days | Fix NullPointerException in getAllInvoices
     Suggestion: Check if this is blocked. Run `/ticket BSW-12` to investigate.
   ```

2. **High-priority tickets in backlog** — P1 or P2 tickets that are not started:
   ```
   HIGH PRIORITY NOT STARTED:
   - BSW-14 | P2 | Todo | Fix duplicate invoice creation
     Suggestion: This is high priority and should be picked up soon.
   ```

3. **Unassigned in-progress** — Tickets in progress but not assigned to anyone (unusual):
   ```
   UNASSIGNED IN PROGRESS:
   - BSW-22 | In Progress | No assignee
     Suggestion: Assign this ticket to whoever is working on it.
   ```

### Step 7: Suggest Next Action

Based on the sprint state, suggest one action:

| Condition | Suggestion |
|-----------|------------|
| Stuck tickets exist | "BSW-### has been in progress for {N} days. Run `/ticket BSW-###` to investigate." |
| High-priority tickets in Todo | "BSW-### is high priority and ready to start. Run `/ticket BSW-###` to pick it up." |
| Nothing in progress | "No tickets in progress. Pick the highest-priority Todo ticket: `/ticket BSW-###`." |
| Everything done | "All tickets are done! Time to celebrate or plan the next sprint." |
| In Review tickets exist | "BSW-### is waiting for review. Check the PR and merge if ready." |
| Balanced workload | "Sprint is on track. Continue working on current in-progress tickets." |

---

## Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| LINEAR_API_KEY not set | Environment variable is empty or unset | Report: "LINEAR_API_KEY is not set. Cannot fetch sprint data." Stop. |
| API error | Non-200 response or `errors` array in response | Report the error message. Suggest checking the API key. |
| Network error | curl times out or cannot connect | Report: "Cannot reach Linear API. Check your internet connection." Stop. |
| No tickets found | API returns empty `nodes` array | Report: "No tickets found for team BSW. The team may not have any issues yet." |
| Team not found | API returns null for the team query | Report: "Team not found. Check the team ID configuration." |
| Too many tickets | More than 100 tickets (pagination needed) | Fetch first 100 and note: "Showing first 100 tickets. There may be more." |

---

## Boundaries

### DO
- Fetch all BSW tickets from Linear and display them grouped by status
- Calculate and display summary metrics (counts, progress percentage)
- Identify potentially stuck tickets (in progress for 3+ days)
- Flag high-priority tickets that are not yet started
- Flag unassigned in-progress tickets
- Suggest a concrete next action based on sprint state
- Show priority, assignee, and age for each ticket

### DO NOT
- Modify any tickets — this is strictly a read-only view
- Move tickets between statuses (suggest `/update-ticket` instead)
- Create new tickets (suggest `/create-ticket` instead)
- Modify any files in the repository
- Make assumptions about sprint dates or deadlines (Linear does not always have sprint boundaries)
- Show ticket descriptions in the overview — keep it scannable with titles only
- Filter out any tickets — show all statuses for completeness

---

## Rules

- **Read-only** — this skill fetches and displays data. It never modifies tickets or files.
- **Show all statuses** — include every ticket in the team, grouped by workflow state. Do not filter or hide tickets.
- **Highlight problems** — stuck tickets, unassigned work, and high-priority items in the backlog should be called out explicitly.
- **One suggestion** — end with exactly one actionable suggestion based on the most important finding.
- **Keep it scannable** — developers glance at this in 30 seconds. Use tables, short lines, and clear grouping.
- **Priority is important** — always show priority for each ticket. P1/P2 tickets should be visually distinct.
- **Age matters** — for In Progress tickets, show how many days they have been in that state. Staleness indicates potential blockers.
- **LINEAR_API_KEY is required** — this skill cannot function without it. Fail fast and clearly if missing.

---

## Next Action

After `/sprint` completes:

- Stuck ticket identified → `/ticket BSW-###` to investigate
- High-priority ticket ready → `/ticket BSW-###` to start working on it
- PR waiting for review → Check the PR on GitHub
- All done → Plan next sprint or `/create-ticket` for new work
- Want detailed ticket view → `/ticket BSW-###` for a specific ticket
