---
name: update-ticket
description: Update a Linear ticket status — move to In Progress, In Review, or Done. Use when ticket status changes.
user-invocable: true
argument-hint: "<BSW-### status>"
allowed-tools: Bash, Read
model: sonnet
---

# /update-ticket — Update Ticket Status in Linear

**Level:** L0 — Sequential checklist execution

Update a Linear ticket's workflow state. Use this when a ticket moves through the lifecycle: Backlog, Todo, In Progress, In Review, Done, or Canceled.

---

## Steps

### Step 1: Parse Arguments

1. Extract the **ticket identifier** from the argument (e.g., `BSW-123`).
2. Extract the **target status** from the argument. Accepted values (case-insensitive):
   - `backlog` → Backlog
   - `todo` → Todo
   - `in-progress` or `in_progress` or `started` → In Progress
   - `in-review` or `in_review` or `review` → In Review
   - `done` or `closed` or `complete` → Done
   - `canceled` or `cancelled` → Canceled
3. If either is missing, ask the user to provide it:
   ```
   Usage: /update-ticket BSW-123 in-progress
   
   Available statuses: backlog, todo, in-progress, in-review, done, canceled
   ```

### Step 2: Verify Linear Access

1. Check that the `LINEAR_API_KEY` environment variable is set:
   ```bash
   test -n "$LINEAR_API_KEY" && echo "OK" || echo "MISSING"
   ```
2. If missing, report: "LINEAR_API_KEY environment variable is not set. Cannot update ticket status." and stop.

### Step 3: Fetch Current Ticket Status

1. Query Linear for the ticket's current state:
   ```bash
   curl -s -X POST https://api.linear.app/graphql \
     -H "Content-Type: application/json" \
     -H "Authorization: $LINEAR_API_KEY" \
     -d '{"query": "{ issue(id: \"BSW-123\") { id identifier title state { id name } url } }"}'
   ```
2. Parse the response to get the issue UUID (`id`), current state name, and current state ID.
3. If the ticket is not found, report: "Ticket BSW-123 not found in Linear." and stop.
4. If the ticket is already in the target status, report: "BSW-123 is already in {status}." and stop.

### Step 4: Fetch Team Workflow States

1. Query Linear for the BSW team's workflow states to find the target state ID:
   ```bash
   curl -s -X POST https://api.linear.app/graphql \
     -H "Content-Type: application/json" \
     -H "Authorization: $LINEAR_API_KEY" \
     -d '{"query": "{ team(id: \"186fc3de-4e72-479f-a1ef-cddb3e7f6df9\") { states { nodes { id name type } } } }"}'
   ```
2. Match the target status name to one of the returned state nodes (case-insensitive match on the `name` field).
3. If no matching state is found, report: "Status '{status}' not found for team BSW. Available states: {list}" and stop.

### Step 5: Confirm the Update

Present the change to the user:

```
## Status Update

- Ticket: BSW-123 — Fix NullPointerException in InvoiceService
- Current status: Todo
- New status: In Progress

Proceed? (Yes / Cancel)
```

Wait for confirmation. If the user cancels, stop without making changes.

### Step 6: Update the Ticket

1. Execute the mutation:
   ```bash
   curl -s -X POST https://api.linear.app/graphql \
     -H "Content-Type: application/json" \
     -H "Authorization: $LINEAR_API_KEY" \
     -d '{"query": "mutation { issueUpdate(id: \"ISSUE_UUID\", input: { stateId: \"TARGET_STATE_ID\" }) { success issue { identifier title state { name } url } } }"}'
   ```
2. Check the `success` field in the response.

### Step 7: Report Result

```
## Ticket Updated

- Ticket: BSW-123 — Fix NullPointerException in InvoiceService
- Previous status: Todo
- New status: In Progress
- URL: https://linear.app/botree-software/issue/BSW-123
```

If moving to Done, add a suggestion:
```
Tip: Make sure all tests pass before closing. Run `/test` to verify, then `/close` for the full workflow.
```

If moving to In Review, add a suggestion:
```
Tip: Run `/review` to check your changes, then `/pr` to create a pull request.
```

---

## Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| LINEAR_API_KEY not set | Environment variable is empty or unset | Report: "LINEAR_API_KEY is not set. Export it and try again." Stop. |
| Ticket not found | API returns null for the issue query | Report: "Ticket BSW-### not found in Linear. Check the identifier." Stop. |
| Invalid status name | Target status does not match any accepted value | Report: "Unknown status '{input}'. Available: backlog, todo, in-progress, in-review, done, canceled." Stop. |
| Already in target status | Current state matches target state | Report: "BSW-### is already in {status}. No change needed." Stop. |
| API error | Non-200 response or `errors` array in response | Report the error message from Linear. Suggest checking the API key. |
| Network error | curl times out or cannot connect | Report: "Cannot reach Linear API. Check your internet connection." Stop. |
| Mutation fails | `success` field is false in mutation response | Report: "Failed to update ticket. Linear returned an error." Include error details if available. |

---

## Boundaries

### DO
- Parse ticket ID and status from user arguments
- Confirm the status change with the user before executing
- Fetch current status to show what is changing
- Map friendly status names to Linear state IDs dynamically
- Report the result clearly with old and new status
- Suggest relevant next actions based on the new status

### DO NOT
- Update tickets without user confirmation
- Move to Done without warning about tests — always suggest `/test` first
- Modify any files in the repository — this skill only interacts with Linear
- Create or modify branches, commits, or PRs
- Update fields other than status (use Linear UI for title, description, priority changes)
- Cache state IDs — always fetch them fresh to handle state configuration changes

---

## Rules

- **Confirm before updating** — always show the user what will change and get a Yes before executing the mutation.
- **Never move to Done silently** — if moving to Done, always remind about running tests first.
- **LINEAR_API_KEY is required** — this skill cannot function without it. Fail fast and clearly if it is missing.
- **Map statuses dynamically** — fetch the team's workflow states from the API rather than hardcoding IDs (state IDs may change if the team reconfigures their workflow).
- **Handle already-in-status gracefully** — do not attempt to update if the ticket is already in the target state.
- **One ticket per invocation** — update exactly one ticket at a time.

---

## Next Action

After `/update-ticket` completes:

- Moved to In Progress → `/ticket` or `/fix` to start working
- Moved to In Review → `/review` then `/pr` to create a pull request
- Moved to Done → Celebrate, then `/sprint` to see overall progress
- Error occurred → Fix the issue (API key, network) and retry
