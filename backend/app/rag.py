import anthropic

from app.config import settings
from app.documents import search_documents

# Initialize Anthropic client
client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


def generate_answer(query: str, context_chunks: list[dict]) -> str:
    """Generate an answer using Claude with retrieved context.

    BUG: No error handling — if the API call fails, the exception propagates unhandled.
    BUG: Prompt injection — user query and context are combined in a single user message
         with no separation or sanitization, allowing malicious context to override instructions.
    """
    context_text = "\n\n---\n\n".join([chunk["content"] for chunk in context_chunks])

    # BUG: user query and retrieved context in a single message enables prompt injection
    # A malicious document could contain "Ignore previous instructions..." and alter behavior
    message = client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": f"""Based on the following context, answer the question. If the context doesn't contain relevant information, say so.

Context:
{context_text}

Question: {query}

Provide a clear, concise answer based on the context above.""",
            }
        ],
    )

    return message.content[0].text


def query_documents(query: str, top_k: int = 5) -> dict:
    """Retrieve relevant chunks and generate an answer.

    BUG: top_k is not bounded — a caller can pass an arbitrarily large value,
         potentially retrieving the entire collection and sending a huge prompt to Claude.
    """
    # BUG: no upper bound check on top_k — should cap at a reasonable max (e.g., 20)
    relevant_chunks = search_documents(query, top_k=top_k)

    if not relevant_chunks:
        return {
            "answer": "I couldn't find any relevant information in the uploaded documents.",
            "sources": [],
            "chunks_used": 0,
        }

    answer = generate_answer(query, relevant_chunks)

    sources = list({chunk["metadata"].get("filename", "unknown") for chunk in relevant_chunks})

    return {
        "answer": answer,
        "sources": sources,
        "chunks_used": len(relevant_chunks),
    }
