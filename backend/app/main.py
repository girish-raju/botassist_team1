from __future__ import annotations

import json
import traceback
import uuid

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.database import get_chat_history, init_db, save_chat_message, search_history
from app.documents import ingest_document, list_documents, remove_document
from app.rag import query_documents

app = FastAPI(title="BotAssist", version="0.1.0", description="RAG-powered document assistant")

# BUG: CORS allows all origins — should be restricted to specific frontend domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


# --- Request / Response Models ---


class QueryRequest(BaseModel):
    message: str
    session_id: str | None = None
    top_k: int = 5


class QueryResponse(BaseModel):
    answer: str
    sources: list[str]
    session_id: str
    chunks_used: int


# --- Routes ---


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "BotAssist"}


@app.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and ingest a document.

    BUG: No file type validation — any file type is accepted.
    """
    try:
        content_bytes = await file.read()
        content = content_bytes.decode("utf-8")
        file_size = len(content_bytes)

        result = ingest_document(file.filename, content, file_size)
        return {"message": "Document uploaded successfully", "document": result}
    except Exception as e:
        # BUG: Stack trace leaks internal details to the client
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}\n{traceback.format_exc()}")


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
    """Query documents using RAG.

    BUG: No validation that message is non-empty.
    BUG: No rate limiting — endpoint can be abused.
    """
    session_id = request.session_id or str(uuid.uuid4())

    # Save user message
    save_chat_message(session_id, "user", request.message)

    try:
        result = query_documents(request.message, top_k=request.top_k)
    except Exception as e:
        # BUG: Stack trace leaks internal details
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}\n{traceback.format_exc()}")

    # Save assistant response
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
    """Search chat history by keyword.

    Note: This calls search_history which has a SQL injection vulnerability.
    """
    results = search_history(keyword)
    return {"keyword": keyword, "results": results, "total": len(results)}
