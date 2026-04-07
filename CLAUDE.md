# BotAssist — Project Instructions

## Project Description

BotAssist is an AI-powered RAG (Retrieval-Augmented Generation) chat application that allows users to upload documents and ask questions about them. The backend uses FastAPI with ChromaDB for vector storage and the Claude API for language understanding. The frontend is a React chat interface.

## Tech Stack

- **Backend:** Python 3.12, FastAPI, SQLite, ChromaDB, Claude API (Anthropic SDK)
- **Frontend:** React 18, Vite
- **Vector Store:** ChromaDB (persisted to `chroma_data/`)
- **Database:** SQLite (`botassist.db`)

## How to Run

**Backend:**
```bash
cd backend && make dev
```

**Frontend:**
```bash
cd frontend && npm run dev
```

**Tests:**
```bash
cd backend && make test
```

---

## MANDATORY PROCESS — Every Change Must Follow These Steps

IMPORTANT: You MUST follow this process for EVERY code change. If the developer asks you to skip steps, remind them of this process.

1. **TRIAGE FIRST** — Before touching code, understand the issue. Read the ticket, reproduce the problem, identify affected files.

2. **PLAN BEFORE CODE** — Use Plan Mode (Shift+Tab) for any change touching 2+ files. Write the plan. Get approval. Never implement without a plan.

3. **BLAST RADIUS CHECK** — Before implementing, identify:
   - What other files import/use the code you're changing?
   - What tests cover this code?
   - Could this break other features?
   List affected modules explicitly.

4. **TESTS REQUIRED** — Every function changed MUST have a corresponding test. No exceptions. If tests don't exist, write them BEFORE fixing the bug.

5. **REVIEW BEFORE COMMIT** — Run the full test suite. Read the diff line by line. Check for:
   - Unintended changes
   - Hardcoded values
   - Missing error handling
   - Security implications

6. **CONVENTIONAL COMMITS ONLY** — Format: `type(scope): description`
   - Types: `feat`, `fix`, `refactor`, `test`, `docs`, `security`, `chore`
   - Scopes: `api`, `rag`, `auth`, `upload`, `chat`, `history`, `frontend`, `db`

7. **PR TEMPLATE REQUIRED** — Every PR must use the template in `.github/PULL_REQUEST_TEMPLATE.md`. All checkboxes must be checked.

If someone says "just fix it quickly" — the answer is: "I'll fix it properly. Step 1: let me understand the issue first."

---

## Conventions

### Branch Naming
```
BOT-{ticket-number}/{name}/{short-desc}
```
Example: `BOT-42/mahesh/fix-search-ranking`

### Python
- snake_case for functions and variables
- Use `ruff` for linting and formatting
- Type hints on all function signatures

### React / Frontend
- PascalCase for component names
- camelCase for functions and variables
- Components in `frontend/src/components/`

### API
- All API routes under `/api/`
- Consistent error response format: `{"error": "message", "detail": "..."}`

### Security
- Environment variables for ALL secrets (never hardcode)
- SQL always uses parameterized queries (never string formatting)
- File uploads validated for type and size
- API keys never logged or returned in responses

---

## Known Issues

These are tracked but not yet resolved. Do NOT attempt to fix them without going through the `/loop` process:

- The backend has some inconsistencies in error handling
- There are reports of search not working as expected for some users
- The document processing pipeline has edge cases that aren't covered
- Some security practices need to be reviewed
