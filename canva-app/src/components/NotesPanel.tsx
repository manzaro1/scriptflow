import React, { useState, useCallback } from "react";
import type { ScriptBlock } from "../types";

interface Props {
  blocks: ScriptBlock[];
  notes: Record<string, string>;
  onNotesChange: (notes: Record<string, string>) => void;
  onBlockClick?: (blockId: string) => void;
}

const STORAGE_KEY = "scriptflow_notes";

export function loadNotes(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveNotes(notes: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {}
}

export default function NotesPanel({ blocks, notes, onNotesChange, onBlockClick }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const sluglines = blocks.filter((b) => b.type === "slugline");
  const notedBlockIds = Object.keys(notes).filter((id) => notes[id]?.trim());

  const handleAdd = useCallback(
    (blockId: string) => {
      setEditingId(blockId);
      setDraft(notes[blockId] || "");
    },
    [notes]
  );

  const handleSave = useCallback(() => {
    if (!editingId) return;
    const updated = { ...notes };
    if (draft.trim()) {
      updated[editingId] = draft.trim();
    } else {
      delete updated[editingId];
    }
    onNotesChange(updated);
    saveNotes(updated);
    setEditingId(null);
    setDraft("");
  }, [editingId, draft, notes, onNotesChange]);

  const handleDelete = useCallback(
    (blockId: string) => {
      const updated = { ...notes };
      delete updated[blockId];
      onNotesChange(updated);
      saveNotes(updated);
    },
    [notes, onNotesChange]
  );

  const getBlockLabel = (blockId: string) => {
    const b = blocks.find((bl) => bl.id === blockId);
    if (!b) return `Block ${blockId}`;
    const label = b.content.length > 40 ? b.content.slice(0, 40) + "…" : b.content;
    return `[${b.type.toUpperCase()}] ${label}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>
        Script Notes
      </h3>
      <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>
        Add notes and annotations to scenes and blocks.
      </p>

      {/* Add note to a scene */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
          Add Note to Scene
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {sluglines.length === 0 && (
            <div style={{ fontSize: 11, color: "#9ca3af" }}>No scenes found.</div>
          )}
          {sluglines.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 8px",
                borderRadius: 6,
                border: "1px solid #f3f4f6",
                fontSize: 11,
              }}
            >
              <span
                onClick={() => onBlockClick?.(s.id)}
                style={{ cursor: "pointer", color: "#374151", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {s.content}
              </span>
              <button
                onClick={() => handleAdd(s.id)}
                style={{
                  fontSize: 10,
                  color: "#7c3aed",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {notes[s.id] ? "Edit" : "+ Note"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Editing */}
      {editingId && (
        <div style={{ padding: 10, borderRadius: 8, border: "1px solid #7c3aed", backgroundColor: "#faf5ff" }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>
            {getBlockLabel(editingId)}
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            style={{
              width: "100%",
              fontSize: 12,
              padding: 8,
              borderRadius: 6,
              border: "1px solid #d1d5db",
              resize: "vertical",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
            placeholder="Type your note..."
            autoFocus
          />
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button onClick={handleSave} style={saveBtnStyle}>Save</button>
            <button onClick={() => setEditingId(null)} style={cancelBtnStyle}>Cancel</button>
          </div>
        </div>
      )}

      {/* Existing notes */}
      {notedBlockIds.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
            All Notes ({notedBlockIds.length})
          </div>
          {notedBlockIds.map((id) => (
            <div
              key={id}
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #fde68a",
                backgroundColor: "#fffbeb",
                marginBottom: 6,
              }}
            >
              <div
                style={{ fontSize: 10, color: "#92400e", cursor: "pointer" }}
                onClick={() => onBlockClick?.(id)}
              >
                {getBlockLabel(id)}
              </div>
              <div style={{ fontSize: 12, color: "#374151", marginTop: 4 }}>
                {notes[id]}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button
                  onClick={() => handleAdd(id)}
                  style={{ fontSize: 10, color: "#7c3aed", background: "none", border: "none", cursor: "pointer" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(id)}
                  style={{ fontSize: 10, color: "#dc2626", background: "none", border: "none", cursor: "pointer" }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const saveBtnStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#fff",
  backgroundColor: "#7c3aed",
  padding: "4px 12px",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
};

const cancelBtnStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#6b7280",
  backgroundColor: "#f9fafb",
  padding: "4px 12px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  cursor: "pointer",
};
