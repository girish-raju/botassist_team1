---
name: onboard
description: Setup guide for new developers — verify environment, clone repo, understand the project, start your first ticket. Use when someone is getting started.
user-invocable: true
argument-hint: ""
allowed-tools: Bash, Read, Grep, Glob
model: sonnet
---

# /onboard — Getting Started Guide

**Level:** L0 — Read-only environment check and orientation

Verify the development environment, explain the project structure, introduce available skills, and suggest the first task. This is the entry point for new developers joining a Botree training exercise.

---

## Steps

### Step 1: Environment Check

Run each command and report whether the tool is installed and its version:

| Tool | Command | Required |
|------|---------|----------|
| Java | `java --version 2>&1` | Yes (for Java projects) |
| Maven | `mvn --version 2>&1` | Yes (for Java projects) |
| Node.js | `node --version 2>&1` | Yes (for Angular projects) |
| Angular CLI | `npx ng version 2>&1` | Yes (for Angular projects) |
| Git | `git --version 2>&1` | Yes |
| Claude Code | `claude --version 2>&1` | Yes |
| GitHub CLI | `gh auth status 2>&1` | Recommended |

Report format:
```
## Environment

| Tool | Status | Version |
|------|--------|---------|
| Java | OK | OpenJDK 17.0.8 |
| Maven | OK | Apache Maven 3.9.4 |
| Node.js | OK | v20.10.0 |
| Angular CLI | OK | 19.2.5 |
| Git | OK | 2.42.0 |
| Claude Code | OK | 1.0.12 |
| GitHub CLI | OK | gh 2.40.0 (authenticated as user) |

All required tools installed.
```

If any required tool is missing:
```
| Maven | MISSING | — |

ACTION REQUIRED: Maven is not installed.
  macOS: `brew install maven`
  Linux: `sudo apt install maven`
```

### Step 2: Project Orientation

1. **Read CLAUDE.md** if it exists in the project root. This contains project-specific instructions for Claude Code. Summarize the key points:
   - Project name and purpose
   - Tech stack
   - Build commands
   - Special instructions or constraints

2. **Read TICKET.md** if it exists. Summarize:
   - Current ticket ID and title
   - What the bug or feature is about
   - Acceptance criteria
   - Which tests should fail (for exercise repos)

3. **List the project structure.** Show the top-level directories and key files:
```
## Project Structure

invoice-service/
  pom.xml                          — Maven build config
  CLAUDE.md                        — Claude Code project instructions
  TICKET.md                        — Current ticket / exercise description
  src/main/java/com/botree/...     — Java source code
  src/test/java/com/botree/...     — Java test files
  src/main/resources/              — Config files (application.properties)
  frontend/                        — Angular frontend (if full-stack)
    src/app/                       — Angular components and services
    package.json                   — Node dependencies
```

4. **Count source files and test files.** Report how many of each exist:
```
- Java source files: 8
- Java test files: 6
- TypeScript source files: 12 (if Angular frontend exists)
```

### Step 3: Available Skills

List the skills available in the project's `.claude/skills/` directory. For each skill, show the name and one-line description:

```
## Available Skills

| Command | Description |
|---------|-------------|
| `/morning` | Daily health check — git status, test results, ticket status |
| `/test` | Run tests and report results |
| `/fix` | Fix a bug end-to-end with full diagnosis cycle |
| `/triage` | Scan codebase for potential issues |
| `/close` | Close a ticket — commit, push, create PR |
| `/onboard` | This guide — environment check and orientation |
```

If the `.claude/skills/` directory does not exist or is empty, note that skills have not been installed yet.

### Step 4: Daily Workflow Overview

Present the standard daily workflow:

```
## Daily Workflow

1. `/morning` — Start your day. Check git status, run tests, review your ticket.
2. Read the ticket — Understand what needs to be fixed or built.
3. Create a branch — `git checkout -b feature/BOT-XXX-short-description`
4. `/fix` or implement — Use `/fix` for bug tickets, or write code for feature tickets.
5. `/test` — Verify your changes. All tests should pass.
6. `/close` — Commit, push, and create a pull request.
7. Pick next ticket — Move to the next exercise.
```

### Step 5: First Task Suggestion

Based on the current project state, suggest what to do first:

| Condition | Suggestion |
|-----------|------------|
| Environment incomplete | "Install the missing tools listed above, then run `/onboard` again." |
| TICKET.md exists, tests failing | "Run `/test` to see the current state. Then read TICKET.md and start fixing with `/fix`." |
| TICKET.md exists, tests passing | "Tests are already passing. Read TICKET.md to understand the exercise, then run `/close`." |
| No TICKET.md | "No ticket assigned. Check Linear for your next exercise, or ask your instructor." |
| Not a project directory | "This doesn't appear to be a project directory. Navigate to one of: invoice-service, sync-engine, ticket-analyzer, or dashboard-app." |

Default suggestion:
```
## Get Started

Run `/test` to see the current state of the project.
Then read TICKET.md to understand your assignment.
When you're ready, use `/fix` to start resolving the failing tests.
```

---

## Failure Modes

| Failure | Detection | Response |
|---------|-----------|----------|
| Java not installed | `java --version` fails | Report as MISSING. Provide install instructions for macOS (`brew install openjdk@17`) and Linux (`sudo apt install openjdk-17-jdk`). |
| Maven not installed | `mvn --version` fails | Report as MISSING. Provide install instructions for macOS (`brew install maven`) and Linux (`sudo apt install maven`). |
| Node.js not installed | `node --version` fails | Report as MISSING. Suggest: `brew install node` or use nvm. |
| Angular CLI not installed | `npx ng version` fails | Report as MISSING. Suggest: `npm install -g @angular/cli`. |
| Git not installed | `git --version` fails | Report as MISSING. This is critical — cannot proceed without Git. |
| gh not authenticated | `gh auth status` fails | Report as WARNING. Suggest: `gh auth login`. Not blocking but needed for `/close`. |
| Not a project directory | No `pom.xml`, no `package.json`, no `CLAUDE.md` | Report: "This does not appear to be a Botree exercise project. Navigate to the correct directory." |
| CLAUDE.md missing | File does not exist | Note: "No CLAUDE.md found. The project may not have Claude Code instructions configured." |
| Skills not installed | `.claude/skills/` directory is empty or missing | Note: "Skills are not installed. Copy them from _shared_skills/ into .claude/skills/." |

---

## Boundaries

### DO
- Check tool versions and report installed/missing status
- Read CLAUDE.md and TICKET.md for project context
- List project structure and file counts
- List available skills from `.claude/skills/`
- Provide install instructions for missing tools
- Suggest a clear first action based on project state

### DO NOT
- Install any software or dependencies
- Modify any files or configurations
- Run `mvn install` or `npm install`
- Create branches or commits
- Clone repositories
- Modify `.bashrc`, `.zshrc`, or any shell configuration
- Run tests (suggest `/test` instead — keep onboard fast)

---

## Rules

- This skill is strictly **read-only** — it checks and reports but never installs, configures, or modifies
- Always check all tools in the table, even if some are not needed for the current project type
- Report missing tools with specific install instructions for the detected OS (macOS vs Linux)
- If CLAUDE.md exists, always read and summarize it — it contains project-specific instructions
- Keep the report structured and scannable — use tables and headers
- End with a concrete first-action suggestion, not a vague "get started" message
- Do not run tests during onboard — the environment check should be fast (under 10 seconds)

---

## Next Action

After running `/onboard`:

- Environment complete → `/morning` for a full project health check
- Missing tools → Install them, then run `/onboard` again
- Ready to work → `/test` to see current test state, then read TICKET.md
- Need help → Ask your instructor or check the exercise README
