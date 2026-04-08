Terminal 1 — Backend
  cd /Users/girishdhommaraju.s/Desktop/demo_sta/my_git/botassist_team1/backend    
  source .venv/bin/activate
  makedev                                                                                                                                        
   
  # Terminal 2 — Frontend                                                                                                                         
  cd /Users/girishdhommaraju.s/Desktop/demo_sta/my_git/botassist_team1/frontend                                                                 
  npm run dev

  lsof -ti:8000
  kill -9 64198
# BotAssist — AI Document Chat

An AI-powered RAG (Retrieval-Augmented Generation) chat application for querying uploaded documents. Built with FastAPI, ChromaDB, Claude API, and React.

## What is this?

BotAssist lets users upload documents (PDF, TXT, DOCX) and ask natural language questions about them. The system chunks documents, stores embeddings in ChromaDB, retrieves relevant passages, and uses Claude to generate answers grounded in the source material.

This is a training exercise repository for Level 2 Claude Code training at Botree.

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Edit with your API keys
make dev
```

Backend runs at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Architecture

```
botassist/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app entry point
│   │   ├── routes/           # API route handlers
│   │   ├── services/         # Business logic (RAG, auth, uploads)
│   │   ├── models/           # SQLAlchemy / Pydantic models
│   │   └── database.py       # SQLite connection
│   ├── tests/                # pytest test suite
│   ├── Makefile              # dev, test, lint commands
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API client
│   │   └── App.jsx           # Root component
│   ├── package.json
│   └── vite.config.js
├── docs/                     # Sample documents for RAG testing
├── CLAUDE.md                 # Claude Code instructions (READ THIS)
└── .github/
    └── PULL_REQUEST_TEMPLATE.md
```

---

## The Rules

> Every contributor MUST follow this process. No exceptions.

1. Pick a ticket from the Linear board
2. Run `/loop BOT-###` in Claude Code
3. Follow all 6 steps — triage, plan, implement, blast-radius, test, PR
4. Open PR with the template filled — ALL checkboxes checked
5. Assign a reviewer. Wait for approval.
6. Reviewer uses `/review` to check the PR
7. Merge only after reviewer approves

**Shortcuts are not allowed. The process is the product.**

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |
| POST | `/api/upload` | Upload a document |
| GET | `/api/documents` | List uploaded documents |
| DELETE | `/api/documents/{id}` | Delete a document |
| POST | `/api/chat` | Send a chat message (RAG query) |
| GET | `/api/chat/history` | Get chat history |
| GET | `/api/search` | Search across documents |
| GET | `/api/health` | Health check |

All endpoints except `/api/auth/*` and `/api/health` require a valid JWT token in the `Authorization: Bearer <token>` header.

## Development

### Adding a Feature

1. Create a ticket on the Linear board
2. Run `/loop BOT-###` in Claude Code
3. Follow the 6-step process (triage, plan, implement, blast-radius, test, PR)

### Running Tests

```bash
cd backend && make test      # Run pytest suite
cd backend && make lint       # Run ruff linter
cd frontend && npm run build  # Verify frontend builds
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Claude API key | Yes |
| `DATABASE_URL` | SQLite path (default: `botassist.db`) | No |
| `CHROMA_PERSIST_DIR` | ChromaDB storage (default: `chroma_data/`) | No |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `UPLOAD_DIR` | Upload directory (default: `uploads/`) | No |
| `MAX_UPLOAD_SIZE_MB` | Max file size in MB (default: 10) | No |

## Contributing

1. Read `CLAUDE.md` before making any changes
2. Follow the `/loop` process for every ticket
3. Use the PR template in `.github/PULL_REQUEST_TEMPLATE.md`
4. All checkboxes must be checked before requesting review
5. Use conventional commit format: `type(scope): description`
