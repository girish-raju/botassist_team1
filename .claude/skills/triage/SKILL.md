---
name: triage
description: Scan the codebase for potential issues — null safety, logic bugs, test coverage gaps. Use when the user wants to find problems or prioritize what to fix.
user-invocable: true
argument-hint: "[file or directory]"
allowed-tools: Bash, Read, Grep, Glob
model: sonnet
---

# /triage — Scan for Issues

**Level:** L1 — Read-only analysis and reporting

Scan Java and TypeScript source files for potential bugs, null safety issues, logic errors, and test coverage gaps. Prioritize findings by severity and suggest next actions.

---

## Phases

### Phase 1: Determine Scan Scope

1. If a **file path** is provided as an argument, scan only that file
2. If a **directory** is provided, scan all source files in that directory (recursively)
3. If **no argument** is provided, scan the entire project:
   - Java: all `.java` files under `src/main/java/`
   - TypeScript: all `.ts` files under `src/app/` (excluding `*.spec.ts` and `node_modules`)
4. List the files that will be scanned and their count

```
## Scan Scope
- Target: src/main/java/com/botree/invoice/
- Files: 6 Java source files
```

### Phase 2: Null Safety Scan

Search for common null pointer patterns:

**Java patterns:**
- Calling `.equals()` on a potentially nullable variable (should use `Objects.equals()` or null-safe comparison)
- Returning `null` from a method that returns a collection (should return empty collection)
- Missing null checks before dereferencing method parameters
- Unchecked `.get()` on `Optional` (should use `.orElse()` or `.orElseThrow()`)
- Chained method calls without null guards (`a.getB().getC().getValue()`)

**TypeScript patterns:**
- Accessing properties without optional chaining where the object could be undefined
- Missing null/undefined checks on service responses
- Using `!` non-null assertion operator (indicates potential null issue)

For each finding:
```
- File: InvoiceService.java:35
- Severity: CRITICAL
- Pattern: null_return_collection
- Code: `return null;` in method returning `List<Invoice>`
- Fix: Return `Collections.emptyList()` instead of `null`
```

### Phase 3: Logic Bug Scan

Search for common logic errors:

**Comparison issues:**
- Using `==` instead of `.equals()` for String/Object comparison in Java
- Inverted boolean logic (`!condition` where `condition` was intended, or vice versa)
- Wrong comparison operator (`<` vs `<=`, `>` vs `>=`)
- Comparing against wrong enum values or magic numbers

**Filter and stream issues:**
- Stream `.filter()` with inverted predicate
- `.findFirst()` on unfiltered stream
- Missing `.collect()` or terminal operation

**Control flow issues:**
- Missing `break` in switch cases (fall-through)
- Unreachable code after `return`/`throw`
- Empty catch blocks that swallow exceptions

For each finding:
```
- File: InvoiceService.java:52
- Severity: WARNING
- Pattern: inverted_filter
- Code: `.filter(i -> i.getStatus() != Status.ACTIVE)` — filters OUT active items
- Fix: Change `!=` to `==` if active items are wanted
```

### Phase 4: Test Coverage Gap Analysis

1. List all public methods in source classes
2. List all test methods in test classes
3. Cross-reference: which public methods have no corresponding test?
4. Check for edge cases not covered:
   - Null input tests
   - Empty collection tests
   - Boundary value tests
   - Error/exception path tests

```
## Coverage Gaps
- InvoiceService.deleteInvoice() — no test exists
- InvoiceService.getAllInvoices() — no null-input test
- InvoiceController.createInvoice() — no validation-error test
```

### Phase 5: Prioritized Report

Compile all findings into a single prioritized report:

```
## Triage Report

### CRITICAL (will crash or produce wrong results)
1. [null_return_collection] InvoiceService.java:35 — returns null instead of empty list
2. [wrong_status] InvoiceService.java:52 — filters by wrong status enum

### WARNING (incorrect behavior in edge cases)
3. [missing_null_check] InvoiceController.java:28 — no null check on request body
4. [inverted_filter] InvoiceService.java:67 — filter predicate inverted

### INFO (code smell, maintainability)
5. [empty_catch] InvoiceService.java:89 — empty catch block swallows IOException
6. [coverage_gap] InvoiceService.deleteInvoice() — no test coverage

### Summary
- CRITICAL: 2
- WARNING: 2
- INFO: 2
- Total: 6 issues across 3 files
```

### Phase 6: Next Action Suggestion

| Condition | Suggestion |
|-----------|------------|
| CRITICAL issues found | "Run `/fix` to address the critical issues first. Start with: [first critical issue]" |
| Only WARNING issues | "No critical issues. Run `/fix` on warnings if they relate to the current ticket." |
| Only INFO issues | "Code is in reasonable shape. Only minor code smells found." |
| No issues found | "No issues detected. Run `/test` to verify everything passes." |
| Matches ticket bugs | "Found [N] issues that match the TICKET.md description. Run `/fix` to resolve." |

---

## Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| No source files found | Glob returns empty for `*.java` and `*.ts` patterns | Report: "No source files found in the specified path. Check the directory." |
| Project doesn't compile | Syntax errors prevent meaningful analysis | Report: "Project has compilation errors. Fix those first, then re-scan." Run basic scan anyway for obvious issues. |
| File not found | Specified file argument doesn't exist | Report: "File not found: [path]. Check the path and try again." |
| Very large codebase | More than 50 source files | Scan in batches. Report progress: "Scanning batch 1/3..." Focus on files changed recently (`git diff --name-only` against main). |
| No test directory | `src/test/` or `*.spec.ts` not found | Skip Phase 4 (coverage analysis). Note: "No test directory found — cannot assess coverage." |

---

## Boundaries

### DO
- Read and analyze source files for common bug patterns
- Search for null safety violations, logic errors, and coverage gaps
- Prioritize findings by severity (CRITICAL > WARNING > INFO)
- Report each finding with file, line, severity, description, and suggested fix
- Cross-reference findings with TICKET.md when available
- Scan both Java and TypeScript files in full-stack projects

### DO NOT
- Modify any files — this is strictly a read-only scan
- Run tests (suggest `/test` instead)
- Attempt to fix issues (suggest `/fix` instead)
- Report style issues (formatting, naming conventions) as bugs
- Scan test files for bugs (tests are the specification)
- Scan files in `node_modules/`, `target/`, or other build output directories
- Report dependency vulnerabilities (out of scope)

---

## Rules

- This skill is strictly **read-only** — it scans and reports but never modifies files
- Always prioritize findings: CRITICAL first, then WARNING, then INFO
- A CRITICAL finding is one that will cause a crash, data loss, or clearly wrong output at runtime
- A WARNING finding is one that will produce incorrect behavior in specific edge cases
- An INFO finding is a code smell that may cause future problems but is not currently broken
- Do not flag standard patterns as issues (e.g., returning `Optional.empty()` is fine, not a null issue)
- Cross-reference with TICKET.md — issues that match the ticket description should be highlighted
- Keep descriptions actionable — every finding should include a concrete suggested fix
- For large files, focus on public methods and API boundaries rather than internal helper methods

---

## Next Action

After running `/triage`:

- CRITICAL issues found → `/fix` to resolve them immediately
- All clean → `/test` to verify tests pass
- Coverage gaps found → Consider writing tests (if that is part of the ticket)
- Matches ticket description → `/fix` targeting the specific issue
