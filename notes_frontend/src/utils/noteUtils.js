// PUBLIC_INTERFACE
export function debounce(fn, waitMs) {
  /** Debounce a function call. */
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), waitMs);
  };
}

// PUBLIC_INTERFACE
export function normalizeTagsFromInput(raw) {
  /** Parse a comma-separated tag input into normalized unique tags. */
  const parts = (raw || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.replace(/^#/, "").toLowerCase());

  return Array.from(new Set(parts));
}

// PUBLIC_INTERFACE
export function snippetFromBody(body, maxLen = 120) {
  /** Create a short one-line snippet from note body. */
  const text = (body || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1)}…`;
}
