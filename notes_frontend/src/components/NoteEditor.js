import React, { useEffect, useMemo, useState } from "react";
import { normalizeTagsFromInput } from "../utils/noteUtils";

function tagClassByIndex(i) {
  const variants = ["tagPillCyan", "tagPillPink", "tagPillYellow", "tagPillGreen"];
  return variants[i % variants.length];
}

/**
 * Note editor: edit title/body, manage tags, save/delete.
 */
export default function NoteEditor({
  mode, // "view" | "new"
  note,
  saving,
  deleting,
  onSave,
  onDelete,
  onCancelNew,
  onAddTag,
  onRemoveTag,
}) {
  const initialTitle = useMemo(() => (note?.title || ""), [note]);
  const initialBody = useMemo(() => (note?.body || note?.content || ""), [note]);
  const initialTags = useMemo(() => (Array.isArray(note?.tags) ? note.tags : []), [note]);

  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    setTitle(initialTitle);
    setBody(initialBody);
    setTagInput("");
  }, [initialTitle, initialBody, note?.id]);

  const tags = initialTags;

  const canDelete = mode !== "new" && note?.id != null;

  const handleSave = () => {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle && !trimmedBody) {
      onSave?.({ title: "Untitled", body: "" });
      return;
    }

    onSave?.({
      title: trimmedTitle || "Untitled",
      body: trimmedBody,
    });
  };

  const handleAddTagsFromInput = async () => {
    const newTags = normalizeTagsFromInput(tagInput);
    if (newTags.length === 0) return;

    // Add sequentially to keep backend simple & show deterministic errors
    for (const t of newTags) {
      // eslint-disable-next-line no-await-in-loop
      await onAddTag?.(t);
    }
    setTagInput("");
  };

  return (
    <section className="panel" aria-label="Note editor">
      <div className="panelHeader">
        <div className="brand">
          <h2 className="brandTitle">{mode === "new" ? "New Note" : "Note"}</h2>
          <span className="badge">{mode === "new" ? "DRAFT" : `ID ${note?.id ?? "—"}`}</span>
        </div>

        <div className="rowWrap right">
          {mode === "new" ? (
            <button className="btn btnSmall btnGhost" onClick={onCancelNew} disabled={saving || deleting}>
              Cancel
            </button>
          ) : null}

          <button className="btn btnSmall btnPrimary" onClick={handleSave} disabled={saving || deleting}>
            {saving ? "Saving…" : "Save"}
          </button>

          <button className="btn btnSmall btnDanger" onClick={onDelete} disabled={!canDelete || saving || deleting}>
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      <div className="content">
        {!note && mode !== "new" ? (
          <div className="emptyState">
            <p className="h2">Select a note</p>
            <p className="smallText">Or create a new one in the left panel.</p>
          </div>
        ) : (
          <div className="stack">
            <div className="stack">
              <span className="label">Title</span>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled"
                aria-label="Note title"
              />
            </div>

            <div className="stack">
              <span className="label">Body</span>
              <textarea
                className="textarea"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write something retro-futuristic…"
                aria-label="Note body"
              />
            </div>

            <div className="stack">
              <div className="rowWrap">
                <span className="label">Tags</span>
                <span className="smallText">comma-separated</span>
              </div>

              <div className="row">
                <input
                  className="input"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="e.g. work, ideas, todo"
                  aria-label="Add tags"
                  onKeyDown={(e) => (e.key === "Enter" ? handleAddTagsFromInput() : null)}
                />
                <button className="btn btnSmall" onClick={handleAddTagsFromInput} disabled={!note?.id}>
                  Add
                </button>
              </div>

              <div className="tagRow" aria-label="Current tags">
                {tags.length === 0 ? (
                  <span className="smallText">No tags yet.</span>
                ) : (
                  tags.map((t, i) => (
                    <button
                      key={`${note?.id}-${t}`}
                      className={`tagPill ${tagClassByIndex(i)}`}
                      onClick={() => onRemoveTag?.(t)}
                      disabled={!note?.id}
                      aria-label={`Remove tag ${t}`}
                      title="Click to remove"
                      type="button"
                    >
                      #{t} <span className="srOnly">(remove)</span>
                    </button>
                  ))
                )}
              </div>

              {note?.createdAt || note?.updatedAt ? (
                <div className="smallText">
                  {note?.createdAt ? (
                    <span className="mono">Created: {new Date(note.createdAt).toLocaleString()}</span>
                  ) : null}
                  {note?.createdAt && note?.updatedAt ? <span className="mono"> · </span> : null}
                  {note?.updatedAt ? (
                    <span className="mono">Updated: {new Date(note.updatedAt).toLocaleString()}</span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
