from __future__ import annotations

import json
import uuid
from typing import List, Optional

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.database import delete_all_history, delete_session, get_chat_history, get_history_sessions, init_db, save_chat_message, search_history
from app.documents import ingest_document, list_documents, remove_document
from app.jwt_auth import create_access_token, decode_access_token, hash_password, verify_password
from app.rag import query_documents
from app.users import create_user, get_user_by_email, init_users_table

app = FastAPI(title="BotAssist", version="0.1.0", description="RAG-powered document assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.on_event("startup")
def startup():
    init_db()
    init_users_table()


# --- Auth Helpers ---

security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload


# --- Request / Response Models ---


class SignUpRequest(BaseModel):
    email: str
    name: str
    password: str


class SignInRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict


class QueryRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    top_k: int = 5


class SourceItem(BaseModel):
    filename: str
    chunk_content: str
    relevance_score: Optional[float] = None


class QueryResponse(BaseModel):
    answer: str
    sources: List[SourceItem]
    session_id: str
    chunks_used: int


# --- Routes ---


@app.post("/auth/signup")
def signup(request: SignUpRequest):
    import re
    email = request.email.strip()
    name = request.name.strip()
    password = request.password

    if not email or not name or not password:
        raise HTTPException(status_code=400, detail="All fields are required.")
    if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email):
        raise HTTPException(status_code=400, detail="Invalid email address.")
    if len(name) < 2:
        raise HTTPException(status_code=400, detail="Name must be at least 2 characters.")
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")
    if not re.search(r'[A-Z]', password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter.")
    if not re.search(r'[0-9]', password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number.")

    try:
        password_hash = hash_password(password)
        user = create_user(email, name, password_hash)
        token = create_access_token({"sub": user["email"], "name": user["name"], "id": user["id"]})
        return {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"]}}
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@app.post("/auth/signin")
def signin(request: SignInRequest):
    email = request.email.strip()
    password = request.password

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required.")

    user = get_user_by_email(email)
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token({"sub": user["email"], "name": user["name"], "id": user["id"]})
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"]}}


@app.get("/auth/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {"email": current_user.get("sub"), "name": current_user.get("name"), "id": current_user.get("id")}


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "BotAssist"}


ALLOWED_EXTENSIONS = {".txt", ".md", ".csv"}


@app.post("/documents/upload")
async def upload_document(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload and ingest a document."""
    import os
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")
    try:
        content_bytes = await file.read()
        content = content_bytes.decode("utf-8")
        file_size = len(content_bytes)
        result = ingest_document(file.filename, content, file_size, user_id=current_user["id"])
        return {"message": "Document uploaded successfully", "document": result}
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded text.")
    except Exception:
        raise HTTPException(status_code=500, detail="Upload failed. Please try again.")


@app.get("/documents")
def get_documents(current_user: dict = Depends(get_current_user)):
    """List all ingested documents for the current user."""
    docs = list_documents(user_id=current_user["id"])
    return {"documents": docs, "total": len(docs)}


@app.delete("/documents/{doc_id}")
def delete_document_route(doc_id: int, filename: str, current_user: dict = Depends(get_current_user)):
    """Delete a document by ID, scoped to the current user."""
    success = remove_document(doc_id, filename, user_id=current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted", "id": doc_id}


@app.post("/query", response_model=QueryResponse)
def query(request: QueryRequest, current_user: dict = Depends(get_current_user)):
    """Query documents using RAG, scoped to the current user."""
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    user_id = current_user["id"]
    session_id = request.session_id or str(uuid.uuid4())
    save_chat_message(session_id, "user", request.message, user_id=user_id)

    try:
        result = query_documents(request.message, top_k=request.top_k, user_id=user_id)
    except Exception:
        raise HTTPException(status_code=500, detail="Query failed. Please try again.")

    save_chat_message(session_id, "assistant", result["answer"], json.dumps(result["sources"]), user_id=user_id)

    return QueryResponse(
        answer=result["answer"],
        sources=result["sources"],
        session_id=session_id,
        chunks_used=result["chunks_used"],
    )


@app.get("/chat/{session_id}")
def get_chat(session_id: str, current_user: dict = Depends(get_current_user)):
    """Retrieve chat history for a session, scoped to the current user."""
    history = get_chat_history(session_id, user_id=current_user["id"])
    return {"session_id": session_id, "messages": history}


@app.get("/search")
def search(keyword: str, current_user: dict = Depends(get_current_user)):
    """Search chat history by keyword, scoped to the current user."""
    results = search_history(keyword, user_id=current_user["id"])
    return {"keyword": keyword, "results": results, "total": len(results)}


@app.get("/history/sessions")
def list_sessions(page: int = 1, limit: int = 20, current_user: dict = Depends(get_current_user)):
    """List chat sessions with metadata, paginated, scoped to the current user."""
    sessions, total = get_history_sessions(page=page, limit=limit, user_id=current_user["id"])
    return {"sessions": sessions, "total": total, "page": page, "limit": limit}


@app.delete("/history/sessions/{session_id}")
def delete_session_route(session_id: str, current_user: dict = Depends(get_current_user)):
    """Delete all messages for a specific session, scoped to the current user."""
    deleted = delete_session(session_id, user_id=current_user["id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted", "session_id": session_id}


@app.delete("/history/sessions")
def clear_all_history(current_user: dict = Depends(get_current_user)):
    """Delete all chat history for the current user."""
    count = delete_all_history(user_id=current_user["id"])
    return {"message": "All history cleared", "deleted": count}
