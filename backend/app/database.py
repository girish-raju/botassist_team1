import sqlite3
from datetime import datetime, timezone

from app.config import settings


def get_connection() -> sqlite3.Connection:
    """Get a connection to the SQLite database."""
    conn = sqlite3.connect(settings.SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initialize the database with required tables."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            content TEXT NOT NULL,
            chunk_count INTEGER DEFAULT 0,
            uploaded_at TEXT NOT NULL,
            file_size INTEGER DEFAULT 0
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            sources TEXT,
            created_at TEXT NOT NULL
        )
        """
    )

    conn.commit()
    conn.close()


def save_document(filename: str, content: str, chunk_count: int, file_size: int) -> int:
    """Save a document record to the database."""
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    cursor.execute(
        "INSERT INTO documents (filename, content, chunk_count, uploaded_at, file_size) VALUES (?, ?, ?, ?, ?)",
        (filename, content, chunk_count, now, file_size),
    )
    conn.commit()
    doc_id = cursor.lastrowid
    conn.close()
    return doc_id


def get_all_documents() -> list[dict]:
    """Return all documents from the database."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, filename, chunk_count, uploaded_at, file_size FROM documents")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def delete_document(doc_id: int) -> bool:
    """Delete a document by ID. Returns True if a row was deleted."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted


def save_chat_message(session_id: str, role: str, content: str, sources: str | None = None) -> int:
    """Save a chat message to history."""
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    cursor.execute(
        "INSERT INTO chat_history (session_id, role, content, sources, created_at) VALUES (?, ?, ?, ?, ?)",
        (session_id, role, content, sources, now),
    )
    conn.commit()
    msg_id = cursor.lastrowid
    conn.close()
    return msg_id


def get_chat_history(session_id: str) -> list[dict]:
    """Retrieve chat history for a session."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, role, content, sources, created_at FROM chat_history WHERE session_id = ? ORDER BY created_at ASC",
        (session_id,),
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def search_history(keyword: str) -> list[dict]:
    """Search chat history by keyword.

    BUG: Uses f-string interpolation instead of parameterized query — SQL injection vulnerability.
    """
    conn = get_connection()
    cursor = conn.cursor()
    # BUG: SQL injection — keyword is interpolated directly into the query
    query = f"SELECT id, session_id, role, content, created_at FROM chat_history WHERE content LIKE '%{keyword}%' ORDER BY created_at DESC"
    cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
