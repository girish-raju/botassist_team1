import chromadb

from app.config import settings
from app.database import delete_document, get_all_documents, save_document

# Initialize ChromaDB client
chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
collection = chroma_client.get_or_create_collection(name="botassist_docs")


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Split text into overlapping chunks."""
    chunks = []
    step = chunk_size - overlap
    for i in range(0, len(text), step):
        chunk = text[i : i + chunk_size]
        if chunk.strip():
            chunks.append(chunk.strip())
    return chunks


def ingest_document(filename: str, content: str, file_size: int) -> dict:
    """Ingest a document: chunk it, store in ChromaDB, and save metadata to SQLite."""
    chunks = chunk_text(content)

    # Store chunks in ChromaDB
    if chunks:
        ids = [f"{filename}_chunk_{i}" for i in range(len(chunks))]
        collection.add(documents=chunks, ids=ids, metadatas=[{"filename": filename, "chunk_index": i} for i in range(len(chunks))])

    # Save to SQLite
    doc_id = save_document(filename, content, len(chunks), file_size)

    return {
        "id": doc_id,
        "filename": filename,
        "chunk_count": len(chunks),
        "file_size": file_size,
    }


def list_documents() -> list[dict]:
    """List all ingested documents, newest first."""
    docs = get_all_documents()
    docs.sort(key=lambda d: d["uploaded_at"], reverse=True)
    return docs


def remove_document(doc_id: int, filename: str) -> bool:
    """Remove a document from SQLite and delete its chunks from ChromaDB."""
    try:
        collection.delete(where={"filename": filename})
    except Exception:
        pass  # ChromaDB delete is best-effort; proceed with DB deletion
    return delete_document(doc_id)


def search_documents(query: str, top_k: int = 5) -> list[dict]:
    """Search for relevant document chunks using ChromaDB similarity search."""
    results = collection.query(query_texts=[query], n_results=top_k)

    if not results or not results["documents"] or not results["documents"][0]:
        return []

    matched = []
    for i, doc in enumerate(results["documents"][0]):
        metadata = results["metadatas"][0][i] if results["metadatas"] else {}
        distance = results["distances"][0][i] if results["distances"] else None
        matched.append({"content": doc, "metadata": metadata, "distance": distance})

    return matched
