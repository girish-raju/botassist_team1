---
name: test
description: Run tests and report results clearly. Use when the user wants to check if tests pass or verify changes.
user-invocable: true
argument-hint: "[--all]"
allowed-tools: Bash, Read, Grep, Glob
model: sonnet
---

# /test — Run Tests and Report

**Level:** L0 — Execute and report

Detect the project type, run the appropriate test or build command, and report results in a clear, structured format. This is the quickest way to check project health.

---

## Steps

### Step 1: Detect Project Type

Check the project root for build files to determine the project type:

1. Check if `pom.xml` exists → **Java/Maven project**
2. Check if `package.json` exists (and `node_modules/@angular` exists) → **Angular project**
3. If both exist → **Full-stack project** (run both)
4. If neither exists → Report error and stop

### Step 2: Run Tests

**For Java/Maven projects:**
```
mvn test 2>&1
```
- Parse Surefire summary line: `Tests run: X, Failures: Y, Errors: Z, Skipped: W`
- For each failure, extract: test class, test method, assertion message, expected vs. actual
- Note compilation errors separately — they prevent tests from running

**For Angular projects:**
```
ng build 2>&1
```
- Parse for: compilation errors (TS errors with file:line), warnings, success/failure
- Count total errors and warnings

**If `--all` argument is provided:**
- Run both Java and Angular regardless of auto-detection
- Also check for integration tests: `mvn verify -DskipUnitTests 2>&1`

### Step 3: Report Results

Format the report clearly:

```
## Test Results

### Java (Maven)
- Total: 42 tests
- Passed: 40
- Failed: 2
- Errors: 0
- Skipped: 0

### Failures

1. InvoiceServiceTest#testGetAllInvoices
   - Expected: empty list
   - Actual: NullPointerException at InvoiceService.java:35
   - File: src/test/java/com/botree/invoice/InvoiceServiceTest.java:28

2. InvoiceControllerTest#testGetInvoiceNotFound
   - Expected: HTTP 404
   - Actual: HTTP 500
   - File: src/test/java/com/botree/invoice/InvoiceControllerTest.java:55
```

For Angular:
```
### Angular (Build)
- Status: FAILED
- Errors: 2
- Warnings: 1

### Errors

1. TS2339: Property 'invoice' does not exist on type 'DashboardComponent'
   - File: src/app/dashboard/dashboard.component.ts:24:15

2. TS2345: Argument of type 'string' is not assignable to parameter of type 'number'
   - File: src/app/services/invoice.service.ts:42:8
```

### Step 4: Compare with Ticket Expectations

1. Read `TICKET.md` if it exists
2. Check which tests the ticket says should be failing (for exercise repos, tickets describe intentional bugs)
3. Report whether the current failures match the ticket expectations:
   - "Expected failures (per ticket): 2 — Actual failures: 2 — MATCHES"
   - "Expected failures (per ticket): 2 — Actual failures: 3 — MISMATCH (1 unexpected failure)"

### Step 5: Next Action Suggestion

| Condition | Suggestion |
|-----------|------------|
| All tests pass | "All green. Run `/close` to commit and create a PR." |
| Failures match ticket expectations | "Failures match the ticket. Run `/fix` to start resolving them." |
| Unexpected failures (not in ticket) | "Unexpected failures detected. Investigate before working on the ticket." |
| Compilation errors | "Fix compilation errors first — tests cannot run until the code compiles." |
| No test files found | "No tests found in this project." |

---

## Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| Maven not installed | `mvn: command not found` | Report: "Maven is not installed. Install it or run `/onboard` to check your environment." |
| Node/Angular CLI not installed | `ng: command not found` | Report: "Angular CLI is not installed. Install it or run `/onboard` to check your environment." |
| Compilation error (Java) | `mvn test` exits with `COMPILATION ERROR` in output | Report compilation errors separately. Note: "Tests did not run — fix compilation errors first." |
| Compilation error (Angular) | `ng build` exits with TypeScript errors | Report each error with file and line. |
| Test timeout | Command runs longer than 120 seconds | Kill the process. Report: "Tests timed out. Check for infinite loops or deadlocks." |
| No test files | No `*Test.java` files or `*.spec.ts` files found | Report: "No test files found in this project." |
| Dependency resolution failure | Maven cannot download dependencies | Report: "Dependency resolution failed. Check your internet connection and Maven settings." |

---

## Boundaries

### DO
- Detect the project type automatically from build files
- Run the standard test command for the detected project type
- Parse and summarize results in a structured format
- Report each failure with test name, error message, and file location
- Compare results against TICKET.md expectations when available
- Provide a single clear next-action suggestion

### DO NOT
- Modify any source files or test files
- Attempt to fix failing tests (suggest `/fix` instead)
- Skip tests or run with `-DskipTests`
- Install dependencies or modify `pom.xml` / `package.json`
- Run tests in parallel or with custom flags unless requested
- Dump raw Maven or Angular output — always parse and summarize

---

## Rules

- This skill is strictly **read-only** — it runs tests but never modifies code
- Always parse test output into a structured report — never dump raw console output at the user
- Report both the count summary and individual failure details
- If TICKET.md exists, always compare failures against ticket expectations
- For Java projects, focus on the Surefire summary and individual test failure blocks
- For Angular projects, focus on TypeScript compilation errors and their file locations
- End with exactly one next-action suggestion based on the results
- If both Java and Angular are present, report both in separate sections

---

## Next Action

After running `/test`:

- All tests pass → `/close` to wrap up the ticket
- Tests failing as expected → `/fix` to start resolving
- Unexpected failures → Investigate before proceeding
- Environment issues → `/onboard` to verify setup
