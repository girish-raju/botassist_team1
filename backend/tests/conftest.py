import os
import tempfile

import pytest

from app.config import settings


@pytest.fixture
def temp_db():
    """Provide a temporary SQLite database for testing."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        temp_path = f.name

    original_path = settings.SQLITE_DB_PATH
    settings.SQLITE_DB_PATH = temp_path

    from app.database import init_db

    init_db()

    yield temp_path

    settings.SQLITE_DB_PATH = original_path
    os.unlink(temp_path)


@pytest.fixture
def sample_text():
    """Provide sample text for document ingestion tests."""
    return (
        "Artificial intelligence (AI) is intelligence demonstrated by machines, "
        "as opposed to natural intelligence displayed by animals including humans. "
        "AI research has been defined as the field of study of intelligent agents, "
        "which refers to any system that perceives its environment and takes actions "
        "that maximize its chance of achieving its goals. The term 'artificial intelligence' "
        "had previously been used to describe machines that mimic and display human cognitive "
        "skills that are associated with the human mind, such as learning and problem-solving."
    )
