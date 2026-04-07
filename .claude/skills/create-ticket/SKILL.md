---
name: create-ticket
description: Create a new ticket in Linear with proper formatting — title, description, priority, labels. Use when the user finds a bug or wants to track new work.
user-invocable: true
argument-hint: "<title or description>"
allowed-tools: Bash, Read, Grep, Glob
model: sonnet
---

# /create-ticket — Create a New Ticket in Linear

**Level:** L2 — GATHER, BUILD, GATE, CREATE

Create a well-formatted ticket in the Botree Software (BSW) Linear project. Gathers information from the user and codebase, formats it properly, gets approval, and creates it via the Linear API.

---

## Configuration

**Linear Team:** Botree Software (BSW)
- Team ID: `186fc3de-4e72-479f-a1ef-cddb3e7f6df9`
- Todo State ID: `75778467-64d9-41c9-92aa-ab07de93500f`

**Label IDs:**
- Bug: `fa7e3833-01d7-4ca4-bc1f-1cd57822bf76`
- Feature: `9aa87004-faf4-430b-a86a-46db80dd6d32`
- Improvement: `e3434095-ff60-47d4-afb8-462e4970b722`

**Priority Mapping:**
- 0 = No priority
- 1 = Urgent (P0 — crashes, data loss, security)
- 2 = High (P1 — wrong behavior, blocking)
- 3 = Medium (P2 — improvement, non-blocking bug)
- 4 = Low (P3 — minor, cosmetic, nice-to-have)

---

## Phases

### Phase 1: GATHER — Collect Ticket Information

Goal: Get all the information needed to create a useful ticket.

1. **Parse the argument.** If the user provided a title or description, use it as a starting point.
2. **Determine ticket type** from context:
   - **Bug** — something is broken, a test is failing, unexpected behavior
   - **Feature** — new capability that does not exist yet
   - **Improvement** — enhancement to existing functionality
3. **Determine priority** from severity:
   - Crashes, data loss, security vulnerabilities → **1 (Urgent)**
   - Wrong behavior, tests failing, blocking other work → **2 (High)**
   - Enhancement, non-blocking incorrect behavior → **3 (Medium)**
   - Minor cosmetic issue, nice-to-have → **4 (Low)**
4. **Scan the codebase for context** (if applicable):
   - If the user described a bug, use Grep to find relevant files and code
   - If the user mentioned specific files, read them to understand context
   - Identify the affected module, class, or component
5. **Identify the repo.** Check for a `git remote -v` to get the GitHub repo URL for linking.

If information is unclear, ask the user:
```
I need a few details to create the ticket:
- Title: [parsed from input or ask]
- Type: Bug / Feature / Improvement?
- Priority: Urgent / High / Medium / Low?
- Description: What is the problem or what needs to be built?
```

### Phase 2: BUILD — Format the Ticket

Goal: Create a well-structured ticket body with all relevant information.

Format the ticket body in markdown:

```markdown
## Problem

[Clear description of what is broken or what needs to be built. Include specific error messages, unexpected behavior, or the desired new functionality.]

## Acceptance Criteria

- [ ] [First criterion — specific, testable behavior]
- [ ] [Second criterion — specific, testable behavior]
- [ ] [Third criterion — specific, testable behavior]
- [ ] All existing tests continue to pass

## Relevant Files

- `src/main/java/com/botree/example/Service.java` — [brief description of relevance]
- `src/test/java/com/botree/example/ServiceTest.java` — [test that should verify the fix]

## Context

- **Repo:** [GitHub repo URL from git remote]
- **Module:** [affected module/package]
- **Discovered by:** [user or test name]
```

### Phase 3: GATE — Review Before Creating

**This phase is mandatory. Never skip the gate.**

Present the complete ticket to the user:

```
## New Ticket Preview

**Title:** Fix NullPointerException in InvoiceService.getAllInvoices
**Type:** Bug
**Priority:** 2 (High)
**Team:** Botree Software (BSW)
**Status:** Todo

**Description:**
[full formatted body from Phase 2]

Create this ticket? (Create / Edit / Cancel)
```

Wait for the user to respond:
- **Create** → Proceed to Phase 4
- **Edit** → Ask what to change, update the ticket, re-present
- **Cancel** → Stop. Do not create the ticket.

### Phase 4: CREATE — Submit to Linear

Goal: Create the ticket via the Linear GraphQL API.

1. **Verify LINEAR_API_KEY is set:**
   ```bash
   test -n "$LINEAR_API_KEY" && echo "OK" || echo "MISSING"
   ```

2. **Create the issue.** Build and execute the GraphQL mutation. Note: the description body must be properly JSON-escaped (escape newlines, quotes, backslashes):
   ```bash
   curl -s -X POST https://api.linear.app/graphql \
     -H "Content-Type: application/json" \
     -H "Authorization: $LINEAR_API_KEY" \
     -d '{
       "query": "mutation($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { identifier title url priority state { name } labels { nodes { name } } } } }",
       "variables": {
         "input": {
           "teamId": "186fc3de-4e72-479f-a1ef-cddb3e7f6df9",
           "title": "TICKET_TITLE",
           "description": "TICKET_DESCRIPTION",
           "priority": PRIORITY_NUMBER,
           "stateId": "75778467-64d9-41c9-92aa-ab07de93500f",
           "labelIds": ["LABEL_ID"]
         }
       }
     }'
   ```

3. **Parse the response.** Extract the new ticket identifier (BSW-###), URL, and confirm creation.

### Phase 5: Report

```
## Ticket Created

- ID: BSW-25
- Title: Fix NullPointerException in InvoiceService.getAllInvoices
- Priority: 2 (High)
- Type: Bug
- Status: Todo
- URL: https://linear.app/botree-software/issue/BSW-25

To start working on it: `/ticket BSW-25`
```

---

## Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| LINEAR_API_KEY not set | Environment variable is empty or unset | Report: "LINEAR_API_KEY is not set. Export it and try again." Stop. |
| API error on creation | `success` is false or `errors` array in response | Report the error from Linear. Show the ticket content so the user can retry. |
| Network error | curl times out or cannot connect | Report: "Cannot reach Linear API. Check your internet connection." Show the ticket content so the user can create it manually. |
| User cancels at gate | User says "Cancel" | Stop. Do not create the ticket. Report: "Ticket creation canceled." |
| Insufficient information | Cannot determine title, type, or priority from input | Ask the user for the missing information. Do not guess. |
| Invalid label | Label name does not match Bug, Feature, or Improvement | Default to no label. Report: "Unknown label '{input}'. Creating without a label." |
| Not in a git repo | `git remote -v` fails | Skip the repo URL in the description. Note: "Not in a git repo — skipping repo link." |

---

## Boundaries

### DO
- Gather complete information before formatting the ticket
- Scan the codebase for relevant files when the user describes a bug
- Format the ticket body with Problem, Acceptance Criteria, Relevant Files, and Context sections
- Present the complete ticket to the user at the gate for review
- Wait for explicit user approval before creating the ticket
- Use proper priority mapping based on severity
- Include acceptance criteria as checkboxes
- Link to the relevant GitHub repo in the ticket description
- Report the new ticket ID and URL after creation

### DO NOT
- Skip the GATE phase — user approval is mandatory before creating a ticket
- Create tickets without acceptance criteria — every ticket needs testable criteria
- Guess at priority — ask the user if severity is unclear
- Create duplicate tickets — if the user describes something that sounds like an existing ticket, mention it
- Modify any source files — this skill only creates Linear tickets
- Set status to anything other than Todo for new tickets
- Create tickets in teams other than BSW

---

## Rules

- **GATE is mandatory** — never create a ticket without showing the full preview to the user and getting explicit approval.
- **Acceptance criteria are required** — every ticket must have at least one checkbox criterion. If the user does not provide them, write reasonable ones based on the description.
- **Priority reflects severity** — use the mapping consistently. Crashes are Urgent, wrong behavior is High, improvements are Medium, cosmetic issues are Low.
- **Include relevant files** — if you can identify affected files from the codebase, include them in the ticket to help whoever picks it up.
- **Link the repo** — always try to include the GitHub repo URL from `git remote -v`.
- **One ticket per invocation** — create exactly one ticket. If the user describes multiple issues, suggest creating separate tickets for each.
- **JSON-escape the description** — the ticket body goes into a JSON payload. Properly escape newlines (`\n`), quotes (`\"`), and backslashes (`\\`).

---

## Next Action

After `/create-ticket` completes:

- Ticket created → `/ticket BSW-###` to start working on it immediately
- Want to see all tickets → `/sprint` to view the sprint board
- Need to create more tickets → run `/create-ticket` again
- API key missing → Set `LINEAR_API_KEY` and retry
