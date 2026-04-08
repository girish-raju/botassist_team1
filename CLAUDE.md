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
| content | TEXT NOT NULL | full document text |
| chunk_count | INTEGER | number of chunks in ChromaDB |
| uploaded_at | TEXT | ISO 8601 UTC timestamp |
| file_size | INTEGER | bytes |

### chat_history
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PRIMARY KEY | autoincrement |
| session_id | TEXT NOT NULL | groups messages into conversations |
| role | TEXT NOT NULL | 'user' or 'assistant' |
| content | TEXT NOT NULL | message text |
| sources | TEXT | JSON array of source chunk references |
| created_at | TEXT | ISO 8601 UTC timestamp |

### users
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PRIMARY KEY | autoincrement |
| email | TEXT NOT NULL UNIQUE | lowercased on insert |
| name | TEXT NOT NULL | display name |
| password_hash | TEXT NOT NULL | bcrypt hash |
| created_at | TEXT | ISO 8601 UTC timestamp |

## API Routes

All routes are at root level (no `/api/` prefix). Frontend Vite proxy rewrites `/api/*` → `/*`.

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /health | No | Health check |
| POST | /auth/signup | No | Register user → returns JWT token |
| POST | /auth/signin | No | Login → returns JWT token |
| GET | /auth/me | JWT Bearer | Get current user info |
| POST | /documents/upload | **BUG: None** | Upload document (multipart) — no auth enforced |
| GET | /documents | No | List all documents |
| DELETE | /documents/{doc_id}?filename=... | **BUG: None** | Delete document — no auth enforced |
| POST | /query | **BUG: None** | RAG query — no auth enforced |
| GET | /chat/{session_id} | No | Get chat history for session |
| GET | /search?keyword=... | No | Search chat history |
| GET | /history/sessions?page=&limit= | No | Paginated session list |
| DELETE | /history/sessions/{session_id} | No | Delete a session |
| DELETE | /history/sessions | No | Clear all history |

### Request/Response Models
- `QueryRequest`: `{ message: str, session_id: str | None, top_k: int (default 5) }`
- `QueryResponse`: `{ answer: str, sources: list[SourceItem], session_id: str, chunks_used: int }`
- `SourceItem`: `{ filename: str, chunk_content: str, relevance_score: float | None }`
- `SignUpRequest` / `SignInRequest`: `{ email: str, name: str, password: str }` / `{ email: str, password: str }`

### JWT Auth
- Tokens stored in `localStorage` as `botassist_token`; sent as `Authorization: Bearer <token>`
- JWT signing key defaults to a hardcoded fallback in `jwt_auth.py` — must be set via `JWT_SECRET_KEY` env var
- Token expiry: 24 hours

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
│   │   ├── main.py        # FastAPI app + routes + auth middleware
│   │   ├── auth.py        # Legacy API key auth (NOT wired in — unused)
│   │   ├── jwt_auth.py    # JWT token creation/decoding, bcrypt hashing
│   │   ├── users.py       # users table CRUD (separate from database.py)
│   │   ├── config.py      # Pydantic settings (loads .env)
│   │   ├── database.py    # SQLite: documents + chat_history tables
│   │   ├── documents.py   # Doc ingest/chunking + ChromaDB search
│   │   └── rag.py         # ChromaDB query + Claude API answer generation
│   ├── tests/
│   │   ├── conftest.py    # Fixtures: temp_db, sample_text
│   │   └── test_documents.py  # 3 tests (INCOMPLETE coverage)
│   ├── requirements.txt
│   ├── Makefile           # dev, test, lint, setup
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Root: screen router (landing/signin/signup/app) + sidebar layout
│   │   ├── Landing.jsx    # Marketing landing page with sign in/up CTAs
│   │   ├── AuthPages.jsx  # SignIn + SignUp form components
│   │   ├── Chat.jsx       # Chat interface with session resumption
│   │   ├── Upload.jsx     # Document upload + list
│   │   ├── History.jsx    # Chat history + search + session management
│   │   ├── api.js         # All API calls — never use fetch() directly in components
│   │   ├── App.css        # Styles
│   │   └── main.jsx       # React entry point
│   ├── vite.config.js     # Proxy /api → localhost:8000
│   └── package.json
└── docs/
    ├── sample_technical.txt
    └── sample_business.txt
```

## Key Dependencies Between Files

```
main.py  →  jwt_auth.py (create_access_token, decode_access_token, hash_password, verify_password)
main.py  →  users.py (create_user, get_user_by_email, init_users_table)
main.py  →  database.py (init_db, save_chat_message, get_chat_history, search_history,
                         get_history_sessions, delete_session, delete_all_history)
main.py  →  documents.py (ingest_document, list_documents, remove_document)
main.py  →  rag.py (query_documents)

documents.py  →  database.py (save_document, get_all_documents, delete_document)
documents.py  →  chromadb (PersistentClient — collection "botassist_docs")

rag.py  →  documents.py (search_documents — ChromaDB similarity search)
rag.py  →  config.py (ANTHROPIC_API_KEY, CLAUDE_MODEL)
rag.py  →  anthropic SDK (Claude messages API)

users.py  →  config.py (SQLITE_DB_PATH — uses same DB file as database.py)
jwt_auth.py  →  python-jose (JWT), passlib[bcrypt]

frontend/App.jsx  →  Landing, AuthPages, Chat, Upload, History
frontend/api.js  →  all backend routes via /api/* proxy
frontend/AuthPages.jsx  →  api.js (signIn, signUp) — saves token to localStorage
```

### Auth state flow (frontend)
`localStorage.botassist_token` + `localStorage.botassist_user` → restored on mount in `App.jsx` → passed implicitly (api.js reads token from localStorage for auth'd calls — NOTE: current `api.js` does NOT attach the token to request headers; this is a bug)

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

- `api.js` does not attach the JWT token to authenticated requests (upload, query, delete)
- `jwt_auth.py` has a hardcoded fallback `JWT_SECRET_KEY` — must be overridden via env
- `config.py` has a hardcoded fallback `ANTHROPIC_API_KEY` — must be overridden via env
- `/documents/upload`, `/documents/{doc_id}`, and `/query` routes have no auth enforced
- Backend error handling is inconsistent — some routes leak stack traces
- Document processing pipeline has edge cases in chunking
- Test coverage is very low — auth, RAG, and API routes have zero tests
- `auth.py` is unused dead code (legacy API key approach, replaced by JWT)
