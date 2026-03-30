/**
 * Notes API client.
 *
 * Backend base URL must be provided via environment variable:
 * - REACT_APP_NOTES_API_BASE_URL (e.g. "http://localhost:3001")
 *
 * If not set, defaults to "http://localhost:3001".
 */

const DEFAULT_BASE_URL = "http://localhost:3001";

function getBaseUrl() {
  const raw = process.env.REACT_APP_NOTES_API_BASE_URL || DEFAULT_BASE_URL;
  return raw.replace(/\/+$/, "");
}

async function parseJsonSafe(res) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  const text = await res.text();
  return { message: text };
}

async function requestJson(path, options = {}) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path}`;

  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
  } catch (err) {
    // Network errors (CORS, offline, DNS)
    throw new Error(`Network error calling API at ${baseUrl}. ${err?.message || err}`);
  }

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    const msg =
      (data && (data.error || data.message)) || `Request failed (${res.status})`;
    const error = new Error(msg);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

// PUBLIC_INTERFACE
export async function listNotes({ q = "", tag = "" } = {}) {
  /** List/search notes.
   *
   * Tries common endpoint patterns:
   * - GET /notes?q=...&tag=...
   * - GET /notes/search?q=...&tag=...
   */
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (tag) params.set("tag", tag);

  const qs = params.toString() ? `?${params.toString()}` : "";

  try {
    return await requestJson(`/notes${qs}`, { method: "GET" });
  } catch (err) {
    // Fallback to /notes/search if /notes doesn't support q/tag
    if (err?.status === 404) {
      return requestJson(`/notes/search${qs}`, { method: "GET" });
    }
    throw err;
  }
}

// PUBLIC_INTERFACE
export async function getNote(noteId) {
  /** Fetch one note by id: GET /notes/:id */
  return requestJson(`/notes/${encodeURIComponent(noteId)}`, { method: "GET" });
}

// PUBLIC_INTERFACE
export async function createNote(payload) {
  /** Create note: POST /notes */
  return requestJson(`/notes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// PUBLIC_INTERFACE
export async function updateNote(noteId, payload) {
  /** Update note: PUT /notes/:id */
  return requestJson(`/notes/${encodeURIComponent(noteId)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// PUBLIC_INTERFACE
export async function deleteNote(noteId) {
  /** Delete note: DELETE /notes/:id */
  return requestJson(`/notes/${encodeURIComponent(noteId)}`, { method: "DELETE" });
}

// PUBLIC_INTERFACE
export async function addTag(noteId, tag) {
  /** Add tag: POST /notes/:id/tags with {tag} (fallback: POST /notes/:id/tags/:tag) */
  try {
    return await requestJson(`/notes/${encodeURIComponent(noteId)}/tags`, {
      method: "POST",
      body: JSON.stringify({ tag }),
    });
  } catch (err) {
    if (err?.status === 404) {
      return requestJson(
        `/notes/${encodeURIComponent(noteId)}/tags/${encodeURIComponent(tag)}`,
        { method: "POST" }
      );
    }
    throw err;
  }
}

// PUBLIC_INTERFACE
export async function removeTag(noteId, tag) {
  /** Remove tag: DELETE /notes/:id/tags/:tag (fallback: DELETE /notes/:id/tags with {tag}) */
  try {
    return await requestJson(
      `/notes/${encodeURIComponent(noteId)}/tags/${encodeURIComponent(tag)}`,
      { method: "DELETE" }
    );
  } catch (err) {
    if (err?.status === 404) {
      return requestJson(`/notes/${encodeURIComponent(noteId)}/tags`, {
        method: "DELETE",
        body: JSON.stringify({ tag }),
      });
    }
    throw err;
  }
}
