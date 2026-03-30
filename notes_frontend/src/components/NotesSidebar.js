import React from "react";
import { snippetFromBody } from "../utils/noteUtils";

function tagClassByIndex(i) {
  const variants = ["tagPillCyan", "tagPillPink", "tagPillYellow", "tagPillGreen"];
  return variants[i % variants.length];
}

/**
 * Sidebar: search, tag filter, list of notes.
 */
export default function NotesSidebar({
  loading,
  notes,
  selectedId,
  searchValue,
  tagValue,
  onChangeSearch,
  onChangeTag,
  onSelect,
  onNew,
  apiBaseUrl,
}) {
  return (
    <section className="panel" aria-label="Notes sidebar">
      <div className="panelHeader">
        <div className="brand">
          <h1 className="brandTitle">Simple Notes</h1>
          <span className="badge">RETRO</span>
        </div>
        <button className="btn btnSmall btnPrimary" onClick={onNew}>
          + New
        </button>
      </div>

      <div className="content">
        <div className="stack" style={{ marginBottom: 12 }}>
          <div className="stack">
            <span className="label">Search</span>
            <input
              className="input"
              value={searchValue}
              onChange={(e) => onChangeSearch(e.target.value)}
              placeholder="Find by title/body…"
              aria-label="Search notes"
            />
            <div className="smallText">
              Tip: type then pause. <span className="kbd">Enter</span> refreshes immediately.
            </div>
          </div>

          <div className="stack">
            <span className="label">Tag</span>
            <input
              className="input"
              value={tagValue}
              onChange={(e) => onChangeTag(e.target.value)}
              placeholder="Filter by tag (e.g. work)"
              aria-label="Filter notes by tag"
            />
          </div>

          <div className="smallText">
            API:{" "}
            <a className="linkLike" href={apiBaseUrl} target="_blank" rel="noreferrer">
              {apiBaseUrl}
            </a>
          </div>
        </div>

        <div className="hr" />

        {loading ? (
          <div className="emptyState">
            <p className="h2">Loading…</p>
            <p className="smallText">Summoning your notes from the neon void.</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="emptyState">
            <p className="h2">No notes</p>
            <p className="smallText">Create one with “New”.</p>
          </div>
        ) : (
          <div className="noteList" role="list" aria-label="Notes list">
            {notes.map((n) => {
              const active = String(n.id) === String(selectedId);
              const tags = Array.isArray(n.tags) ? n.tags : [];
              const title = n.title || "Untitled";
              const body = n.body || n.content || "";

              return (
                <div
                  key={n.id}
                  className={`noteCard ${active ? "noteCardActive" : ""}`}
                  role="listitem"
                  tabIndex={0}
                  onClick={() => onSelect(n.id)}
                  onKeyDown={(e) => (e.key === "Enter" ? onSelect(n.id) : null)}
                  aria-label={`Open note ${title}`}
                >
                  <p className="noteTitle">{title}</p>
                  <p className="noteSnippet">{snippetFromBody(body)}</p>

                  <div className="noteMeta">
                    <div className="tagRow" aria-label="Note tags">
                      {tags.slice(0, 4).map((t, i) => (
                        <span key={`${n.id}-${t}`} className={`tagPill ${tagClassByIndex(i)}`}>
                          #{t}
                        </span>
                      ))}
                      {tags.length > 4 ? <span className="tagPill">+{tags.length - 4}</span> : null}
                    </div>
                    <span className="smallText mono">{n.updatedAt ? new Date(n.updatedAt).toLocaleDateString() : ""}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
