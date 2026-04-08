// BotAssist API layer

async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch (_) {}
    throw new Error(detail);
  }
  return res.json();
}

// Send a chat message and get AI response
export async function sendMessage(message, sessionId = null) {
  const body = { message };
  if (sessionId) body.session_id = sessionId;
  return apiFetch("/api/query", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// Upload a document
export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/documents/upload", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch (_) {}
    throw new Error(detail);
  }
  return res.json();
}

// List all uploaded documents
export async function listDocuments() {
  return apiFetch("/api/documents");
}

// Delete a document by ID and filename
export async function deleteDocument(documentId, filename) {
  const params = filename ? `?filename=${encodeURIComponent(filename)}` : "";
  return apiFetch(`/api/documents/${documentId}${params}`, { method: "DELETE" });
}

// Fetch paginated chat history sessions
export async function fetchHistory(page = 1, limit = 20) {
  return apiFetch(`/api/history/sessions?page=${page}&limit=${limit}`);
}

// Fetch messages for a specific session
export async function fetchSessionMessages(sessionId) {
  return apiFetch(`/api/chat/${encodeURIComponent(sessionId)}`);
}

// Search chat history
export async function searchHistory(keyword) {
  return apiFetch(`/api/search?keyword=${encodeURIComponent(keyword)}`);
}

// Delete a single session
export async function deleteSession(sessionId) {
  return apiFetch(`/api/history/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE' });
}

// Clear all history
export async function clearAllHistory() {
  return apiFetch('/api/history/sessions', { method: 'DELETE' });
}
