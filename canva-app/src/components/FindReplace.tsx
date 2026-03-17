import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { ScriptBlock } from "../types";

interface FindReplaceProps {
  blocks: ScriptBlock[];
  onBlocksChange: (blocks: ScriptBlock[]) => void;
  onHighlightBlock: (blockId: string | null) => void;
  visible: boolean;
  onClose: () => void;
}

export default function FindReplace({
  blocks,
  onBlocksChange,
  onHighlightBlock,
  visible,
  onClose,
}: FindReplaceProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [currentIdx, setCurrentIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const matchIndices = useMemo(() => {
    if (!searchTerm) return [];
    const lower = searchTerm.toLowerCase();
    return blocks
      .map((b, i) => (b.content.toLowerCase().includes(lower) ? i : -1))
      .filter((i) => i !== -1);
  }, [blocks, searchTerm]);

  // Focus input when opened
  useEffect(() => {
    if (visible) inputRef.current?.focus();
  }, [visible]);

  // Highlight current match
  useEffect(() => {
    if (matchIndices.length > 0 && currentIdx < matchIndices.length) {
      onHighlightBlock(blocks[matchIndices[currentIdx]]?.id ?? null);
    } else {
      onHighlightBlock(null);
    }
  }, [matchIndices, currentIdx, blocks, onHighlightBlock]);

  // Reset index when search changes
  useEffect(() => {
    setCurrentIdx(0);
  }, [searchTerm]);

  const goNext = useCallback(() => {
    if (matchIndices.length === 0) return;
    setCurrentIdx((prev) => (prev + 1) % matchIndices.length);
  }, [matchIndices]);

  const goPrev = useCallback(() => {
    if (matchIndices.length === 0) return;
    setCurrentIdx((prev) =>
      prev === 0 ? matchIndices.length - 1 : prev - 1
    );
  }, [matchIndices]);

  const handleReplace = useCallback(() => {
    if (matchIndices.length === 0 || !searchTerm) return;
    const idx = matchIndices[currentIdx];
    const block = blocks[idx];
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const newContent = block.content.replace(regex, replaceTerm);
    onBlocksChange(
      blocks.map((b, i) => (i === idx ? { ...b, content: newContent } : b))
    );
  }, [blocks, matchIndices, currentIdx, searchTerm, replaceTerm, onBlocksChange]);

  const handleReplaceAll = useCallback(() => {
    if (!searchTerm) return;
    const regex = new RegExp(
      searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "gi"
    );
    onBlocksChange(
      blocks.map((b) => ({
        ...b,
        content: b.content.replace(regex, replaceTerm),
      }))
    );
  }, [blocks, searchTerm, replaceTerm, onBlocksChange]);

  const handleClose = useCallback(() => {
    setSearchTerm("");
    setReplaceTerm("");
    onHighlightBlock(null);
    onClose();
  }, [onClose, onHighlightBlock]);

  if (!visible) return null;

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex", gap: 4, alignItems: "center", flex: 1 }}>
        <input
          ref={inputRef}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Find..."
          style={inputStyle}
        />
        <input
          value={replaceTerm}
          onChange={(e) => setReplaceTerm(e.target.value)}
          placeholder="Replace..."
          style={inputStyle}
        />
      </div>
      <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
        <span style={{ fontSize: 9, color: "#6b7280", minWidth: 30, textAlign: "center" }}>
          {matchIndices.length > 0
            ? `${currentIdx + 1}/${matchIndices.length}`
            : searchTerm
            ? "0"
            : ""}
        </span>
        <button onClick={goPrev} style={btnStyle} title="Previous">
          &#9650;
        </button>
        <button onClick={goNext} style={btnStyle} title="Next">
          &#9660;
        </button>
        <button onClick={handleReplace} style={btnStyle} title="Replace">
          R
        </button>
        <button onClick={handleReplaceAll} style={btnStyle} title="Replace All">
          RA
        </button>
        <button onClick={handleClose} style={btnStyle} title="Close">
          ×
        </button>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 8px",
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: 6,
};

const inputStyle: React.CSSProperties = {
  fontSize: 11,
  padding: "4px 6px",
  border: "1px solid #d1d5db",
  borderRadius: 4,
  outline: "none",
  flex: 1,
  minWidth: 0,
};

const btnStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: "#374151",
  backgroundColor: "#e5e7eb",
  border: "none",
  borderRadius: 3,
  padding: "3px 6px",
  cursor: "pointer",
  lineHeight: 1,
};
