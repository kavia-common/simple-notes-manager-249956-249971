import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import NotesSidebar from "./components/NotesSidebar";
import NoteEditor from "./components/NoteEditor";
import Toast from "./components/Toast";
import {
  addTag,
  createNote,
  deleteNote,
  getNote,
  listNotes,
  removeTag,
  updateNote,
} from "./api/notesApi";
import { debounce } from "./utils/noteUtils";

function getApiBaseUrlForDisplay() {
  const raw = process.env.REACT_APP_NOTES_API_BASE_URL || "http://localhost:3001";
  return raw.replace(/\/+$/, "");
}

// PUBLIC_INTERFACE
function App() {
  /** Notes Manager UI (retro themed). */
  const apiBaseUrl = useMemo(() => getApiBaseUrlForDisplay(), []);

  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [searchValue, setSearchValue] = useState("");
  const [tagValue, setTagValue] = useState("");

  const [loadingList, setLoadingList] = useState(false);
  const [loadingNote, setLoadingNote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editorMode, setEditorMode] = useState("view"); // "view" | "new"
  const [currentNote, setCurrentNote] = useState(null);

  const [toast, setToast] = useState(null);

  const lastListRequestRef = useRef(0);

  const showToast = useCallback((kind, title, message) => {
    setToast({ kind, title, message });
  }, []);

  const refreshList = useCallback(
    async ({ q = searchValue, tag = tagValue } = {}) => {
      const reqId = Date.now();
      lastListRequestRef.current = reqId;
      setLoadingList(true);

      try {
        const data = await listNotes({ q, tag });

        // If a later request already started, ignore this result.
        if (lastListRequestRef.current !== reqId) return;

        const items = Array.isArray(data) ? data : data?.notes || [];
        setNotes(items);

        // Keep selection if still exists
        if (selectedId != null && !items.some((n) => String(n.id) === String(selectedId))) {
          setSelectedId(null);
          setCurrentNote(null);
        }
      } catch (err) {
        showToast("error", "List failed", err.message || "Unable to load notes.");
      } finally {
        if (lastListRequestRef.current === reqId) setLoadingList(false);
      }
    },
    [searchValue, tagValue, selectedId, showToast]
  );

  const debouncedRefresh = useMemo(
    () =>
      debounce((q, tag) => {
        refreshList({ q, tag });
      }, 350),
    [refreshList]
  );

  useEffect(() => {
    refreshList({ q: "", tag: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openNote = useCallback(
    async (id) => {
      setSelectedId(id);
      setEditorMode("view");
      setLoadingNote(true);

      try {
        const data = await getNote(id);
        // Common shapes: {note: {...}} or direct note
        const noteObj = data?.note || data;
        setCurrentNote(noteObj);
      } catch (err) {
        setCurrentNote(null);
        showToast("error", "Open failed", err.message || "Unable to open note.");
      } finally {
        setLoadingNote(false);
      }
    },
    [showToast]
  );

  const handleNew = useCallback(() => {
    setEditorMode("new");
    setSelectedId(null);
    setCurrentNote({ title: "", body: "", tags: [] });
  }, []);

  const handleCancelNew = useCallback(() => {
    setEditorMode("view");
    setCurrentNote(null);
  }, []);

  const handleSave = useCallback(
    async ({ title, body }) => {
      setSaving(true);
      try {
        if (editorMode === "new") {
          const data = await createNote({ title, body });
          const created = data?.note || data;
          showToast("ok", "Saved", "New note created.");
          setEditorMode("view");
          setSelectedId(created?.id ?? null);
          setCurrentNote(created);
        } else if (currentNote?.id != null) {
          const data = await updateNote(currentNote.id, { title, body });
          const updated = data?.note || data;
          showToast("ok", "Saved", "Note updated.");
          setCurrentNote(updated);
        }
        await refreshList();
      } catch (err) {
        showToast("error", "Save failed", err.message || "Unable to save note.");
      } finally {
        setSaving(false);
      }
    },
    [currentNote, editorMode, refreshList, showToast]
  );

  const handleDelete = useCallback(async () => {
    if (!currentNote?.id) return;

    // Lightweight confirmation (no modal)
    // eslint-disable-next-line no-alert
    const ok = window.confirm("Delete this note? This cannot be undone.");
    if (!ok) return;

    setDeleting(true);
    try {
      await deleteNote(currentNote.id);
      showToast("ok", "Deleted", "Note removed.");
      setCurrentNote(null);
      setSelectedId(null);
      await refreshList();
    } catch (err) {
      showToast("error", "Delete failed", err.message || "Unable to delete note.");
    } finally {
      setDeleting(false);
    }
  }, [currentNote, refreshList, showToast]);

  const handleAddTag = useCallback(
    async (tag) => {
      if (!currentNote?.id) return;

      const existing = Array.isArray(currentNote.tags) ? currentNote.tags : [];
      if (existing.map((t) => String(t).toLowerCase()).includes(String(tag).toLowerCase())) {
        showToast("ok", "Tag", `#${tag} already present.`);
        return;
      }

      setSaving(true);
      try {
        const data = await addTag(currentNote.id, tag);
        const updated = data?.note || data;

        // If backend returns only a status, fallback to refetch
        if (updated && updated.id != null) {
          setCurrentNote(updated);
        } else {
          const refetched = await getNote(currentNote.id);
          setCurrentNote(refetched?.note || refetched);
        }

        await refreshList();
      } catch (err) {
        showToast("error", "Tag failed", err.message || "Unable to add tag.");
      } finally {
        setSaving(false);
      }
    },
    [currentNote, refreshList, showToast]
  );

  const handleRemoveTag = useCallback(
    async (tag) => {
      if (!currentNote?.id) return;

      setSaving(true);
      try {
        const data = await removeTag(currentNote.id, tag);
        const updated = data?.note || data;

        if (updated && updated.id != null) {
          setCurrentNote(updated);
        } else {
          const refetched = await getNote(currentNote.id);
          setCurrentNote(refetched?.note || refetched);
        }

        await refreshList();
      } catch (err) {
        showToast("error", "Tag failed", err.message || "Unable to remove tag.");
      } finally {
        setSaving(false);
      }
    },
    [currentNote, refreshList, showToast]
  );

  const editorHeaderSubtitle = useMemo(() => {
    if (loadingNote) return "Loading note…";
    if (editorMode === "new") return "Draft";
    if (!currentNote) return "No note selected";
    return "Edit & tag";
  }, [loadingNote, editorMode, currentNote]);

  return (
    <div className="App">
      <div className="shell">
        <NotesSidebar
          loading={loadingList}
          notes={notes}
          selectedId={selectedId}
          searchValue={searchValue}
          tagValue={tagValue}
          onChangeSearch={(v) => {
            setSearchValue(v);
            debouncedRefresh(v, tagValue);
          }}
          onChangeTag={(v) => {
            setTagValue(v);
            debouncedRefresh(searchValue, v);
          }}
          onSelect={(id) => openNote(id)}
          onNew={handleNew}
          apiBaseUrl={apiBaseUrl}
        />

        <section className="panel" aria-label="Editor panel wrapper">
          <div className="panelHeader">
            <div className="brand">
              <h2 className="brandTitle">Editor</h2>
              <span className="badge">{editorHeaderSubtitle}</span>
            </div>
            <div className="metaRow">
              <button
                className="btn btnSmall"
                onClick={() => refreshList({ q: searchValue, tag: tagValue })}
                disabled={loadingList}
                title="Refresh list"
              >
                Refresh
              </button>
              <span className="smallText">
                <span className="mono">{notes.length}</span> notes
              </span>
            </div>
          </div>

          <div className="content">
            {loadingNote ? (
              <div className="emptyState">
                <p className="h2">Loading…</p>
                <p className="smallText">Fetching note details.</p>
              </div>
            ) : (
              <NoteEditor
                mode={editorMode}
                note={currentNote}
                saving={saving}
                deleting={deleting}
                onSave={handleSave}
                onDelete={handleDelete}
                onCancelNew={handleCancelNew}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
              />
            )}
          </div>
        </section>
      </div>

      <Toast
        kind={toast?.kind}
        title={toast?.title}
        message={toast?.message}
        onClose={toast ? () => setToast(null) : null}
      />
    </div>
  );
}

export default App;
