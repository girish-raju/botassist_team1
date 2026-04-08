# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# BotAssist — AI Document Chat

An AI-powered RAG chat application. Upload documents, ask questions, get AI answers with source citations.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12, FastAPI, uvicorn |
| Database | SQLite (`botassist.db`) — documents table + chat_history table |
| Vector Store | ChromaDB (persisted to `chroma_data/`) |
| AI | Claude API via `anthropic` SDK |
| Frontend | React 18, Vite, react-markdown |
| Linting | ruff (Python), ESLint (JS) |
| Testing | pytest |

## How to Run

```bash
# Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then edit with your ANTHROPIC_API_KEY
mkdir -p uploads chroma_data
make dev                    # starts on http://localhost:8000
                            # API docs: http://localhost:8000/docs

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                 # starts on http://localhost:5173

# Tests
cd backend && make test               # run all tests
cd backend && pytest tests/test_documents.py -v  # run a single test file
cd backend && pytest tests/ -k "test_name" -v    # run a single test by name

# Lint
cd backend && make lint               # check only
cd backend && ruff format app/ tests/ # auto-fix formatting
```

## Database Schema

### documents
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PRIMARY KEY | autoincrement |
| filename | TEXT NOT NULL | original filename |
| content_hash | TEXT | MD5 hash of content |
| chunk_count | INTEGER | number of chunks in ChromaDB |
| uploaded_at | TIMESTAMP | defaults to CURRENT_TIMESTAMP |
| status | TEXT | 'active' or 'deleted' |

### chat_history
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PRIMARY KEY | autoincrement |
| session_id | TEXT NOT NULL | groups messages into conversations |
| role | TEXT NOT NULL | 'user' or 'assistant' |
| content | TEXT NOT NULL | message text |
| sources | TEXT | JSON array of source chunk references |
| created_at | TIMESTAMP | defaults to CURRENT_TIMESTAMP |

## API Routes

All routes are at root level (no `/api/` prefix). Frontend Vite proxy rewrites `/api/*` → `/*`.

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /health | No | Health check |
| POST | /documents/upload | **BUG: None** | Upload document (multipart) — auth.py exists but is not wired in |
| GET | /documents | No | List all documents |
| DELETE | /documents/{doc_id} | **BUG: None** | Delete document |
| POST | /query | **BUG: None** | RAG query — send question, get AI answer |
| GET | /chat/{session_id} | No | Get chat history for session |
| GET | /search?keyword=... | No | Search chat history — SQL injection in search_history() |

### Request/Response Models
- `QueryRequest`: `{ message: str, session_id: str | None, top_k: int (default 5) }`
- `QueryResponse`: `{ answer: str, sources: list[str], session_id: str, chunks_used: int }`

## Project Structure

```
botassist/
├── CLAUDE.md                          # This file
├── README.md                          # Setup + "The Rules"
├── .github/PULL_REQUEST_TEMPLATE.md   # PR checklist
├── .claude/
│   ├── skills/                        # 13 Claude Code skills
│   │   ├── loop/         # Enforced 6-step workflow
│   │   ├── morning/      # Daily health check
│   │   ├── fix/          # End-to-end bug fix
│   │   ├── test/         # Run tests + report
│   │   ├── triage/       # Scan code for issues
│   │   ├── review/       # 7-criteria code review
│   │   ├── close/        # Close ticket workflow
│   │   ├── pr/           # Create GitHub PR
│   │   ├── ticket/       # Start working on ticket
│   │   ├── create-ticket/# Create Linear ticket
│   │   ├── update-ticket/# Update Linear status
│   │   ├── sprint/       # Board overview
│   │   └── onboard/      # New developer setup
│   └── hooks/
│       ├── pre-commit.sh  # Block hardcoded secrets
│       └── pre-push.sh    # Block force push
├── backend/
│   ├── app/
│   │   ├── main.py        # FastAPI app + routes (135 lines)
│   │   ├── auth.py        # API key authentication (23 lines)
│   │   ├── config.py      # Pydantic settings (17 lines)
│   │   ├── database.py    # SQLite operations (126 lines)
│   │   ├── documents.py   # Doc upload + chunking (81 lines)
│   │   └── rag.py         # ChromaDB + Claude API (67 lines)
│   ├── tests/
│   │   ├── conftest.py    # Fixtures: temp_db, sample_text
│   │   └── test_documents.py  # 3 tests (INCOMPLETE coverage)
│   ├── requirements.txt
│   ├── Makefile           # dev, test, lint, setup
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main layout, 3 tabs (60 lines)
│   │   ├── Chat.jsx       # Chat interface (127 lines)
│   │   ├── Upload.jsx     # Document upload (147 lines)
│   │   ├── History.jsx    # Chat history + search (155 lines)
│   │   ├── api.js         # API client, 6 functions (103 lines)
│   │   ├── App.css        # Styles (~210 lines)
│   │   └── main.jsx       # React entry point
│   ├── vite.config.js     # Proxy /api → localhost:8000
│   └── package.json
└── docs/
    ├── sample_technical.txt
    └── sample_business.txt
```

## Key Dependencies Between Files

```
main.py  →  auth.py (verify_admin dependency on upload + query)
main.py  →  database.py (init_db, save_chat_message, get_chat_history, search_history)
main.py  →  documents.py (ingest_document, list_documents, remove_document)
main.py  →  rag.py (query_documents)

documents.py  →  database.py (save_document, get_all_documents, delete_document)
documents.py  →  rag.py (ChromaDB add via chroma client)

rag.py  →  config.py (ANTHROPIC_API_KEY)
rag.py  →  chromadb (vector store)

frontend/api.js  →  all backend routes via /api/* proxy
```

## Ticket Board

- **Linear workspace:** tech-assistant (linear.app/tech-assistant)
- **Ticket prefix:** TEC-5 through TEC-39 (35 tickets)
- **Types:** 10 bugs, 8 features, 6 refactors, 4 security, 4 test gaps, 3 docs

---

## MANDATORY PROCESS — Every Change Must Follow These Steps

IMPORTANT: You MUST follow this process for EVERY code change. If the developer asks you to skip steps, remind them of this process.

1. **TRIAGE FIRST** — Before touching code, understand the issue. Read the ticket, reproduce the problem, identify affected files.

2. **PLAN BEFORE CODE** — Use Plan Mode for any change touching 2+ files. Write the plan. Get approval. Never implement without a plan.

3. **BLAST RADIUS CHECK** — Before implementing, identify:
   - What other files import/use the code you're changing? (see dependency map above)
   - What tests cover this code?
   - Could this break other features?

4. **TESTS REQUIRED** — Every function changed MUST have a corresponding test. If tests don't exist, write them BEFORE fixing the bug.

5. **REVIEW BEFORE COMMIT** — Run `make test`. Read the diff. Check for hardcoded values, missing error handling, security issues.

6. **CONVENTIONAL COMMITS ONLY** — Format: `type(scope): description`
   - Types: `feat`, `fix`, `refactor`, `test`, `docs`, `security`, `chore`
   - Scopes: `api`, `rag`, `auth`, `upload`, `chat`, `history`, `frontend`, `db`

7. **PR TEMPLATE REQUIRED** — Use `.github/PULL_REQUEST_TEMPLATE.md`. All checkboxes checked.

If someone says "just fix it quickly" — the answer is: "I'll fix it properly. Step 1: let me understand the issue first."

---

## Conventions

### Branch Naming
```
BOT-{ticket-number}/{name}/{short-desc}
```

### Python
- snake_case everywhere. `ruff` for lint.
- Parameterized SQL queries ALWAYS (never f-strings with user input).

### React
- PascalCase components, camelCase functions.
- All API calls go through `api.js` — never call `fetch()` directly from components.

### Security Rules
- Environment variables for ALL secrets. Never hardcode.
- SQL: parameterized queries only. Never string formatting.
- File uploads: validate type and size before processing.
- API keys: never log, never return in responses, never put in frontend code.
- Auth: use constant-time comparison (`hmac.compare_digest`), never `==`.
- CORS: restrict to known origins, never `["*"]`.

---

## Known Issues

Tracked on Linear (linear.app/tech-assistant). Do NOT fix without running `/loop`:

- Backend error handling is inconsistent — some routes leak stack traces
- Search has reports of unexpected behavior for some queries
- Document processing pipeline has edge cases in chunking
- Some security practices need review
- Test coverage is very low — auth, RAG, and API routes have zero tests
