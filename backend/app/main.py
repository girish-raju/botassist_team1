from __future__ import annotations

import json
import uuid
from typing import List, Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.database import delete_all_history, delete_session, get_chat_history, get_history_sessions, init_db, save_chat_message, search_history
from app.documents import ingest_document, list_documents, remove_document
from app.rag import query_documents

app = FastAPI(title="BotAssist", version="0.1.0", description="RAG-powered document assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type"],
)


@app.on_event("startup")
def startup():
    init_db()


# --- Request / Response Models ---


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


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "BotAssist"}


ALLOWED_EXTENSIONS = {".txt", ".md", ".csv"}


@app.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and ingest a document."""
    import os
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")
    try:
        content_bytes = await file.read()
        content = content_bytes.decode("utf-8")
        file_size = len(content_bytes)
        result = ingest_document(file.filename, content, file_size)
        return {"message": "Document uploaded successfully", "document": result}
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded text.")
    except Exception:
        raise HTTPException(status_code=500, detail="Upload failed. Please try again.")


@app.get("/documents")
def get_documents():
    """List all ingested documents."""
    docs = list_documents()
    return {"documents": docs, "total": len(docs)}


@app.delete("/documents/{doc_id}")
def delete_document_route(doc_id: int, filename: str):
    """Delete a document by ID.

    BUG: No authentication required — anyone can delete documents.
    """
    success = remove_document(doc_id, filename)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted", "id": doc_id}


@app.post("/query", response_model=QueryResponse)
def query(request: QueryRequest):
    """Query documents using RAG."""
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    session_id = request.session_id or str(uuid.uuid4())
    save_chat_message(session_id, "user", request.message)

    try:
        result = query_documents(request.message, top_k=request.top_k)
    except Exception:
        raise HTTPException(status_code=500, detail="Query failed. Please try again.")

    save_chat_message(session_id, "assistant", result["answer"], json.dumps(result["sources"]))

    return QueryResponse(
        answer=result["answer"],
        sources=result["sources"],
        session_id=session_id,
        chunks_used=result["chunks_used"],
    )


@app.get("/chat/{session_id}")
def get_chat(session_id: str):
    """Retrieve chat history for a session."""
    history = get_chat_history(session_id)
    return {"session_id": session_id, "messages": history}


@app.get("/search")
def search(keyword: str):
    """Search chat history by keyword."""
    results = search_history(keyword)
    return {"keyword": keyword, "results": results, "total": len(results)}


@app.get("/history/sessions")
def list_sessions(page: int = 1, limit: int = 20):
    """List chat sessions with metadata, paginated."""
    sessions, total = get_history_sessions(page=page, limit=limit)
    return {"sessions": sessions, "total": total, "page": page, "limit": limit}


@app.delete("/history/sessions/{session_id}")
def delete_session_route(session_id: str):
    """Delete all messages for a specific session."""
    deleted = delete_session(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted", "session_id": session_id}


@app.delete("/history/sessions")
def clear_all_history():
    """Delete all chat history."""
    count = delete_all_history()
    return {"message": "All history cleared", "deleted": count}
