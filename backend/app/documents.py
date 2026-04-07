import chromadb

from app.config import settings
from app.database import delete_document, get_all_documents, save_document

# Initialize ChromaDB client
chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
collection = chroma_client.get_or_create_collection(name="botassist_docs")


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Split text into overlapping chunks.

    BUG: step uses chunk_size instead of (chunk_size - overlap), so chunks don't actually overlap.
    """
    chunks = []
    # BUG: step should be (chunk_size - overlap) to create overlapping windows
    for i in range(0, len(text), chunk_size):
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
    """List all ingested documents.

    BUG: Sorts by uploaded_at ascending — newest documents appear last instead of first.
    """
    docs = get_all_documents()
    # BUG: should sort descending (reverse=True) so newest docs appear first
    docs.sort(key=lambda d: d["uploaded_at"])
    return docs


def remove_document(doc_id: int, filename: str) -> bool:
    """Remove a document from SQLite.

    BUG: Does not delete the corresponding chunks from ChromaDB, causing orphaned vectors.
    No file type validation is performed on upload either.
    """
    # BUG: Missing ChromaDB deletion — chunks for this document remain as orphans
    # Should do: collection.delete(where={"filename": filename})
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
