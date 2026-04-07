// BotAssist API layer
// BUG: hardcoded API key exposed in frontend code
const API_KEY = "botassist-admin-2024";

const headers = {
  "X-API-Key": API_KEY,
};

// Send a chat message and get AI response
export async function sendMessage(question, sessionId = null) {
  try {
    const body = { question };
    if (sessionId) {
      body.session_id = sessionId;
    }
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    // BUG: swallows the error, returns undefined silently
    console.log("sendMessage failed", err);
  }
}

// Upload a document
export async function uploadDocument(file) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/documents/upload", {
      method: "POST",
      headers: { ...headers },
      body: formData,
    });
    const data = await res.json();
    return data;
  } catch (err) {
    // BUG: swallows the error, returns undefined silently
    console.log("uploadDocument failed", err);
  }
}

// List all uploaded documents
export async function listDocuments() {
  try {
    const res = await fetch("/api/documents", {
      headers: { ...headers },
    });
    const data = await res.json();
    return data;
  } catch (err) {
    // BUG: swallows the error, returns undefined silently
    console.log("listDocuments failed", err);
  }
}

// Delete a document by ID
export async function deleteDocument(documentId) {
  try {
    const res = await fetch(`/api/documents/${documentId}`, {
      method: "DELETE",
      headers: { ...headers },
    });
    const data = await res.json();
    return data;
  } catch (err) {
    // BUG: swallows the error, returns undefined silently
    console.log("deleteDocument failed", err);
  }
}

// Fetch chat history sessions
export async function fetchHistory(page = 1, limit = 20) {
  try {
    const res = await fetch(`/api/history?page=${page}&limit=${limit}`, {
      headers: { ...headers },
    });
    const data = await res.json();
    return data;
  } catch (err) {
    // BUG: swallows the error, returns undefined silently
    console.log("fetchHistory failed", err);
  }
}

// Fetch messages for a specific session
export async function fetchSessionMessages(sessionId) {
  try {
    const res = await fetch(`/api/history/${sessionId}`, {
      headers: { ...headers },
    });
    const data = await res.json();
    return data;
  } catch (err) {
    // BUG: swallows the error, returns undefined silently
    console.log("fetchSessionMessages failed", err);
  }
}
