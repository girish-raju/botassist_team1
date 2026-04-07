from app.documents import chunk_text


def test_chunk_text_returns_chunks(sample_text):
    """Test that chunk_text splits text into multiple chunks."""
    chunks = chunk_text(sample_text, chunk_size=100)
    assert len(chunks) > 1
    for chunk in chunks:
        assert len(chunk) <= 100


def test_chunk_text_empty_string():
    """Test that chunk_text handles empty input."""
    chunks = chunk_text("")
    assert chunks == []


def test_chunk_text_small_input():
    """Test that a short string produces a single chunk."""
    chunks = chunk_text("Hello world", chunk_size=500)
    assert len(chunks) == 1
    assert chunks[0] == "Hello world"
