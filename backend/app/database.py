from __future__ import annotations

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
            user_id INTEGER NOT NULL DEFAULT 0,
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
            user_id INTEGER NOT NULL DEFAULT 0,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            sources TEXT,
            created_at TEXT NOT NULL
        )
        """
    )

    # Migrate existing tables that may be missing the user_id column
    for table in ("documents", "chat_history"):
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0")
        except Exception:
            pass  # column already exists

    conn.commit()
    conn.close()


def save_document(filename: str, content: str, chunk_count: int, file_size: int, user_id: int = 0) -> int:
    """Save a document record to the database."""
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    cursor.execute(
        "INSERT INTO documents (user_id, filename, content, chunk_count, uploaded_at, file_size) VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, filename, content, chunk_count, now, file_size),
    )
    conn.commit()
    doc_id = cursor.lastrowid
    conn.close()
    return doc_id


def get_all_documents(user_id: int = 0) -> list[dict]:
    """Return all documents for a user."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, filename, chunk_count, uploaded_at, file_size FROM documents WHERE user_id = ?",
        (user_id,),
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def delete_document(doc_id: int, user_id: int = 0) -> bool:
    """Delete a document by ID scoped to user. Returns True if a row was deleted."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM documents WHERE id = ? AND user_id = ?", (doc_id, user_id))
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted


def save_chat_message(session_id: str, role: str, content: str, sources: str | None = None, user_id: int = 0) -> int:
    """Save a chat message to history."""
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    cursor.execute(
        "INSERT INTO chat_history (user_id, session_id, role, content, sources, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, session_id, role, content, sources, now),
    )
    conn.commit()
    msg_id = cursor.lastrowid
    conn.close()
    return msg_id


def get_chat_history(session_id: str, user_id: int = 0) -> list[dict]:
    """Retrieve chat history for a session scoped to user."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, role, content, sources, created_at FROM chat_history WHERE session_id = ? AND user_id = ? ORDER BY created_at ASC",
        (session_id, user_id),
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def delete_session(session_id: str, user_id: int = 0) -> bool:
    """Delete all messages for a session scoped to user. Returns True if any rows were deleted."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM chat_history WHERE session_id = ? AND user_id = ?", (session_id, user_id))
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted


def delete_all_history(user_id: int = 0) -> int:
    """Delete all chat history for a user. Returns number of rows deleted."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM chat_history WHERE user_id = ?", (user_id,))
    conn.commit()
    count = cursor.rowcount
    conn.close()
    return count


def search_history(keyword: str, user_id: int = 0) -> list[dict]:
    """Search chat history by keyword scoped to user."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, session_id, role, content, created_at FROM chat_history WHERE user_id = ? AND content LIKE ? ORDER BY created_at DESC",
        (user_id, f"%{keyword}%"),
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_history_sessions(page: int = 1, limit: int = 20, user_id: int = 0) -> tuple[list[dict], int]:
    """Return paginated list of chat sessions for a user."""
    conn = get_connection()
    cursor = conn.cursor()
    offset = (page - 1) * limit

    cursor.execute(
        """
        SELECT
            session_id,
            MIN(created_at) AS created_at,
            COUNT(*) AS message_count,
            MIN(CASE WHEN role = 'user' THEN content END) AS first_user_message,
            MAX(CASE WHEN role = 'user' THEN content END) AS last_message
        FROM chat_history
        WHERE user_id = ?
        GROUP BY session_id
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
        """,
        (user_id, limit, offset),
    )
    rows = cursor.fetchall()

    cursor.execute("SELECT COUNT(DISTINCT session_id) AS total FROM chat_history WHERE user_id = ?", (user_id,))
    total = cursor.fetchone()["total"]

    conn.close()
    return [dict(row) for row in rows], total
