# BotAssist Sprint Plan — 20 Tickets Across 5 Members

## Context

Building a production-ready RAG documentation chatbot. Target UI is `botree-demo.html` — 3-tab layout (Docs Portal, Ask AI chat, Sprint Plan) with blue/purple design, source citation cards, typing indicators, and thread sidebar.

**Team:** Girish, Raj Kumar, Soundhar, Sharmila, Sri Karthik (4 tickets each)

---

## Current Codebase State

### What Exists
- React 18 + Vite + Tailwind + shadcn/ui components
- `Chat.jsx`, `Upload.jsx`, `History.jsx`, `App.jsx` (tab-based, no React Router)
- FastAPI backend with routes but **no auth protection**
- `auth.py` — `verify_admin` defined but never wired in; uses `==` (timing attack)
- `database.py` — no `users` table, no `user_id` FK
- `rag.py` — prompt injection vulnerability, no error handling
- `documents.py` — chunking overlap bug, orphaned ChromaDB vectors on delete
- `api.js` — hardcoded API key exposed, route mismatch (`/api/chat` vs `/query`)

### What Does NOT Exist (Must Be Created)
- `Login.jsx`, `Register.jsx`, `Landing.jsx`, `Settings.jsx`, `Help.jsx`
- React Router setup
- Users table + auth middleware
- JWT token flow

---

## Ticket Assignments

### Girish — Backend Foundation & Security
**Role: Backend Lead / Security | Milestone 1 Critical Path**

| # | Ticket | Priority | Files |
|---|--------|----------|-------|
| 1 | Fix Critical Bugs | P0 | `database.py`, `auth.py`, `config.py`, `api.js`, `main.py` |
| 2 | Database Schema | P0 | `database.py` |
| 3 | Authentication Backend | P0 | new `auth_service.py`, `main.py` |
| 13 | Chat History (backend endpoint) | P1 | `database.py`, `main.py` |

**What to deliver:**
- #1: Fix SQL injection in `search_history`, remove hardcoded API key, fix CORS `["*"]`, fix timing-attack in `verify_admin` (use `hmac.compare_digest`)
- #2: Add `users` table (id, email, password_hash, name, created_at); add `user_id` FK to `documents` and `chat_history`
- #3: `POST /auth/register`, `POST /auth/login`, `GET /auth/me` with bcrypt + JWT; protect `/query` and `/documents/upload`
- #13: `GET /history/sessions` endpoint listing sessions by `session_id`

> **Girish unblocks everyone** — no auth-gated work can start until #3 is done.

---

### Raj Kumar — RAG Pipeline
**Role: ML/RAG Engineer | Milestone 2**

| # | Ticket | Priority | Files |
|---|--------|----------|-------|
| 6 | Fix Chunking | P0 | `documents.py` |
| 7 | Fix Retrieval | P0 | `rag.py` |
| 8 | Fix Document Lifecycle | P1 | `documents.py`, `Upload.jsx` |
| 9 | Ingest Sample Documents | P1 | `docs/` folder, `documents.py` |

**What to deliver:**
- #6: Fix step bug — change `chunk_size` to `chunk_size - overlap`
- #7: Fix prompt injection (use `system` param in Claude API call), cap `top_k` at 20, add error handling for API failures
- #8: Call `collection.delete()` in ChromaDB on document delete; fix sort order (newest first); refresh list after upload
- #9: Create/find 3–5 sample technical docs, write seed script, verify queries return relevant results

> Works in parallel with Girish during M1. Pull Girish's `database.py` before starting `documents.py`.

---

### Soundhar — Frontend Auth + Routing + Document Management + Settings
**Role: Frontend Auth & Routing | Milestones 1–3**

| # | Ticket | Priority | Files |
|---|--------|----------|-------|
| 4 | Authentication Frontend | P0 | new `Login.jsx`, new `Register.jsx`, `api.js` |
| 5 | Page Structure | P0 | `App.jsx` (React Router rewrite) |
| 14 | Document Management Page | P1 | `Upload.jsx` (redesign) |
| 15 | User Settings | P1 | new `Settings.jsx`, `api.js` |

**What to deliver:**
- #4: Login/Register pages; store JWT in `localStorage`; add `Authorization: Bearer` header to all API calls; redirect to `/login` when unauthenticated
- #5: React Router setup — public routes `/`, `/login`, `/register`; private routes `/chat`, `/documents`, `/settings`
- #14: Redesign `Upload.jsx` — table with name/size/chunks/date, drag-drop upload, delete with confirmation
- #15: Settings page — update display name, change password, logout button

> Wait for Girish's #3 before starting #4. Land router shell in #5 before touching Chat/Upload content to avoid conflicts.

---

### Sharmila — Chat UI & Error Handling
**Role: Chat UX & Public Pages | Milestones 3–4**

| # | Ticket | Priority | Files |
|---|--------|----------|-------|
| 11 | Fix Chat Bugs | P0 | `Chat.jsx`, `runtime.js` |
| 12 | Chat UI Polish | P1 | `Chat.jsx`, `App.css` |
| 16 | Public Landing Page | P1 | new `Landing.jsx` |
| 17 | Error Handling & Loading States | P1 | components, `App.css` |

**What to deliver:**
- #11: Fix reversed message order, "Sources: undefined", missing auto-scroll, empty message blocking, disable send while loading; fix `{ question }` → `{ message }` mismatch in `runtime.js`
- #12 (maps to botree-demo Tab 2): Typing indicator, welcome state with suggested questions (2×2 grid), message timestamps, copy button on AI responses, markdown rendering via existing `markdown-text.jsx`
- #16: Landing page — product description, feature cards, CTA to sign up/log in (no backend dependency, can start any time)
- #17: Loading skeletons during API calls, toast notifications for success/error, error boundary in `App.jsx`

> Wait for Girish's api.js route fix (#1) before starting #11. #16 can start immediately.

---

### Sri Karthik — Source Citations + Polish + Testing
**Role: Integration, Polish & QA | Milestones 2–4**

| # | Ticket | Priority | Files |
|---|--------|----------|-------|
| 10 | Source Citations | P1 | `rag.py`, `runtime.js`, `Chat.jsx` |
| 18 | Responsive Design | P2 | `App.css`, component Tailwind classes |
| 19 | Help Documentation | P2 | new `Help.jsx` |
| 20 | Final Testing & Demo Prep | P0 | All files |

**What to deliver:**
- #10: Modify `rag.py` to return `{ filename, chunk_content (≤200 chars), relevance_score }` per source; render numbered source cards below AI answers (botree-demo `.ai-source-card` style)
- #18: Mobile breakpoints — collapsible sidebar, stacked chat layout, touch-friendly inputs
- #19: AI-generated help docs ("How to upload", "How to ask questions", "Supported file types") at `/help`
- #20: Full E2E test — register → login → upload → ask question → verify sources → view history → settings → logout

> Coordinate source object shape with Raj Kumar at M1 start (agree on `{ filename, chunk_content, relevance_score }` before anyone codes).

---

## Dependency Timeline

```
MILESTONE 1 — Foundation (9:30–11:00)
─────────────────────────────────────────────────────────────────────
Girish:      #1 Fix Bugs → #2 DB Schema → #3 Auth Backend  ← CRITICAL PATH
Raj Kumar:   #6 Fix Chunking  (parallel, no auth dependency)
Soundhar:    Planning + awaiting Girish #3
Sharmila:    #16 Landing Page  (no dependency, start immediately)
Sri Karthik: Align source shape with Raj Kumar (5-min sync)

SYNC 1: Girish finishes #3 → Soundhar starts #4, Sharmila starts #11

MILESTONE 2 — RAG Pipeline (11:00–12:30)
─────────────────────────────────────────────────────────────────────
Girish:      #13 Chat History backend endpoint
Raj Kumar:   #7 Fix Retrieval → #8 Doc Lifecycle → #9 Ingest Docs
Soundhar:    #4 Auth Frontend → #5 Page Structure
Sharmila:    #11 Fix Chat Bugs → #12 Chat UI Polish (start)
Sri Karthik: awaiting Raj Kumar #7 → #10 Source Citations

SYNC 2: Raj Kumar finishes #7 → Sri Karthik starts #10

LUNCH (12:30–1:00)

MILESTONE 3 — Chat UI & Polish (1:00–2:30)
─────────────────────────────────────────────────────────────────────
Soundhar:    #14 Doc Management → #15 Settings
Sharmila:    #12 Chat UI Polish (complete)
Sri Karthik: #10 Source Citations → integrates with Sharmila's Chat
Girish:      Support + review
Raj Kumar:   Support testing

MILESTONE 4 — Final Polish (2:30–4:00)
─────────────────────────────────────────────────────────────────────
Sharmila:    #17 Error Handling & Loading States
Sri Karthik: #18 Responsive → #19 Help Docs → #20 Final Testing
Girish:      Support
Raj Kumar:   Support
Soundhar:    Support

INTEGRATION & DEMO (4:00–5:00)
─────────────────────────────────────────────────────────────────────
Full E2E run by Sri Karthik, all members fix blockers, 5-min demo each
```

---

## Key Sync Points

| # | Who → Who | Trigger |
|---|-----------|---------|
| 1 | Girish → Soundhar | `/auth/register` + `/auth/login` routes live |
| 2 | Girish → Sharmila | `/query` route mismatch fixed in `api.js` |
| 3 | Raj Kumar ↔ Sri Karthik | Agree on source object shape at M1 start |
| 4 | Soundhar → Sharmila | React Router shell landed (route declarations only) |
| 5 | Raj Kumar → all | Pull updated `database.py` from Girish before editing `documents.py` |

---

## Files Owned by Member

| Member | Files |
|--------|-------|
| Girish | `backend/app/database.py`, `backend/app/auth.py`, `backend/app/config.py`, `backend/app/main.py`, new `backend/app/auth_service.py` |
| Raj Kumar | `backend/app/documents.py`, `backend/app/rag.py`, `docs/` |
| Soundhar | `frontend/src/Login.jsx` (new), `frontend/src/Register.jsx` (new), `frontend/src/App.jsx`, `frontend/src/Upload.jsx`, `frontend/src/Settings.jsx` (new), `frontend/src/api.js` |
| Sharmila | `frontend/src/Chat.jsx`, `frontend/src/runtime.js`, `frontend/src/Landing.jsx` (new), `frontend/src/App.css` |
| Sri Karthik | `backend/app/rag.py` (source shape — coordinate with Raj Kumar), `frontend/src/runtime.js` (source rendering), `frontend/src/components/ui/` (toast/skeleton), `frontend/src/Help.jsx` (new), `frontend/src/App.css` |

---

## End-to-End Verification Checklist (#20)

- [ ] `make dev` — backend starts on `http://localhost:8000`
- [ ] `npm run dev` — frontend starts on `http://localhost:3000`
- [ ] Navigate to `/` → Landing page renders with CTA
- [ ] Click Sign Up → Register with email + password
- [ ] Login → redirected to `/chat`
- [ ] Go to `/documents` → Upload a PDF
- [ ] Return to `/chat` → Ask a question about the uploaded doc
- [ ] Answer renders with numbered source cards (filename + excerpt)
- [ ] Chat history sidebar shows the session; click to reload
- [ ] Go to `/settings` → Update display name → Logout → redirected to `/login`
- [ ] `cd backend && make test` → all tests pass
- [ ] `cd backend && make lint` → no ruff errors
- [ ] Mobile layout: sidebar collapses, chat stacks correctly

---

## Branch & Commit Conventions

```bash
# Branch naming
BOT-{ticket-number}/{member-name}/{short-desc}
# Examples:
BOT-1/girish/fix-critical-bugs
BOT-6/rajkumar/fix-chunking
BOT-4/soundhar/auth-frontend
BOT-11/sharmila/fix-chat-bugs
BOT-10/srikarthik/source-citations

# Commit format
type(scope): description
# Examples:
fix(db): parameterize search_history query
feat(auth): add JWT login endpoint
fix(rag): separate system prompt from user input
feat(chat): add typing indicator and welcome state
```

---

## Evaluation Criteria

| Criteria | Weight |
|----------|--------|
| Working Application (register, login, upload, chat, sources) | 30% |
| Code Quality (no hardcoded secrets, parameterized SQL, error handling) | 20% |
| UI / UX (clean, responsive, loading states, botree-demo target) | 20% |
| RAG Quality (relevant answers, proper source citations, chunking) | 15% |
| Completeness (milestones done, chat history, settings, help docs) | 15% |
