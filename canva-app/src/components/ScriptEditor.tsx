import React, { useState, useRef, useEffect, useCallback } from "react";
import type { ElementType, ScriptBlock } from "../types";
import {
  createBlock,
  defaultBlocks,
  nextBlockType,
  autoDetectType,
  shouldUpperCase,
} from "../utils/script-helpers";
import ScriptBlockItem from "./ScriptBlockItem";

interface ScriptEditorProps {
  blocks: ScriptBlock[];
  onBlocksChange: (blocks: ScriptBlock[]) => void;
  focusedBlockId: string | null;
  onFocusedBlockChange: (id: string | null) => void;
}

export default function ScriptEditor({
  blocks,
  onBlocksChange,
  focusedBlockId,
  onFocusedBlockChange,
}: ScriptEditorProps) {
  const blockRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const blocksRef = useRef<ScriptBlock[]>(blocks);
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    if (pendingFocusId && blockRefs.current[pendingFocusId]) {
      const el = blockRefs.current[pendingFocusId];
      el?.focus();
      setPendingFocusId(null);
    }
  }, [pendingFocusId, blocks]);

  const syncBlockFromDOM = (id: string) => {
    const el = blockRefs.current[id];
    if (el) {
      blocksRef.current = blocksRef.current.map((b) =>
        b.id === id ? { ...b, content: el.innerText } : b
      );
    }
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      const block = blocksRef.current[index];

      // Tab: cycle block type
      if (e.key === "Tab") {
        e.preventDefault();
        const newType = nextBlockType(block.type);
        const updated = blocksRef.current.map((b, i) =>
          i === index ? { ...b, type: newType } : b
        );
        onBlocksChange(updated);
        return;
      }

      // Enter: new block below
      if (e.key === "Enter") {
        e.preventDefault();
        syncBlockFromDOM(block.id);
        const newBlock = createBlock("action", "");
        const newBlocks = [...blocksRef.current];
        newBlocks.splice(index + 1, 0, newBlock);
        onBlocksChange(newBlocks);
        setPendingFocusId(newBlock.id);
        return;
      }

      // Backspace on empty: remove block
      if (
        e.key === "Backspace" &&
        !blockRefs.current[block.id]?.innerText &&
        blocksRef.current.length > 1
      ) {
        e.preventDefault();
        const targetId =
          blocksRef.current[index - 1]?.id || blocksRef.current[index + 1]?.id;
        onBlocksChange(blocksRef.current.filter((_, i) => i !== index));
        if (targetId) setPendingFocusId(targetId);
      }
    },
    [onBlocksChange]
  );

  const handleBlur = useCallback(
    (index: number) => {
      const block = blocksRef.current[index];
      const el = blockRefs.current[block.id];
      if (!el) return;

      let content = el.innerText;
      let type = autoDetectType(content, block.type);

      if (shouldUpperCase(type)) {
        content = content.toUpperCase();
        el.innerText = content;
      }

      onBlocksChange(
        blocksRef.current.map((b, i) =>
          i === index ? { ...b, content, type } : b
        )
      );
    },
    [onBlocksChange]
  );

  const handleFocus = useCallback(
    (index: number) => {
      onFocusedBlockChange(blocksRef.current[index]?.id ?? null);
    },
    [onFocusedBlockChange]
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: 8,
        backgroundColor: "#fff",
        borderRadius: 8,
        border: "1px solid #e5e7eb",
        maxHeight: 400,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 4,
          padding: "0 4px",
        }}
      >
        <span style={{ fontSize: 10, color: "#6b7280" }}>
          {blocks.length} block{blocks.length !== 1 ? "s" : ""} | Tab to cycle
          type | Enter for new block
        </span>
      </div>
      {blocks.map((block, index) => (
        <ScriptBlockItem
          key={block.id}
          block={block}
          index={index}
          isFocused={focusedBlockId === block.id}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onInput={() => {}}
          blockRef={(el) => {
            blockRefs.current[block.id] = el;
          }}
        />
      ))}
    </div>
  );
}
