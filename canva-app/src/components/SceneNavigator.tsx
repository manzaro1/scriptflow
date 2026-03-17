import React, { useState, useRef } from "react";
import type { ScriptBlock } from "../types";

interface SceneNavigatorProps {
  blocks: ScriptBlock[];
  onSceneClick: (blockId: string) => void;
  focusedBlockId: string | null;
  onReorder?: (fromIndex: number, toIndex: number) => void;
}

export default function SceneNavigator({
  blocks,
  onSceneClick,
  focusedBlockId,
  onReorder,
}: SceneNavigatorProps) {
  const scenes = blocks
    .map((block, index) => ({ block, index }))
    .filter((item) => item.block.type === "slugline");

  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent, i: number) => {
    dragRef.current = i;
    setDragIdx(i);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(i));
  };

  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverIdx(i);
  };

  const handleDragLeave = () => {
    setOverIdx(null);
  };

  const handleDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    const fromIdx = dragRef.current;
    if (fromIdx !== null && fromIdx !== toIdx && onReorder) {
      onReorder(fromIdx, toIdx);
    }
    setDragIdx(null);
    setOverIdx(null);
    dragRef.current = null;
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setOverIdx(null);
    dragRef.current = null;
  };

  if (scenes.length === 0) {
    return (
      <div style={{ fontSize: 11, color: "#9ca3af", padding: "8px 0" }}>
        No scenes yet. Add a slugline to get started.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div
        style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}
      >
        Scenes ({scenes.length})
        {onReorder && (
          <span style={{ fontWeight: 400, marginLeft: 6, fontSize: 9 }}>
            drag to reorder
          </span>
        )}
      </div>
      {scenes.map((scene, i) => {
        const isActive = focusedBlockId === scene.block.id;
        const nextSceneIdx =
          i + 1 < scenes.length ? scenes[i + 1].index : blocks.length;
        const blockCount = nextSceneIdx - scene.index;
        const isDragging = dragIdx === i;
        const isOver = overIdx === i && dragIdx !== i;

        return (
          <div
            key={scene.block.id}
            draggable={!!onReorder}
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, i)}
            onDragEnd={handleDragEnd}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 8px",
              borderRadius: 6,
              border: isOver
                ? "2px solid #7c3aed"
                : "2px solid transparent",
              backgroundColor: isActive ? "#ede9fe" : "transparent",
              cursor: onReorder ? "grab" : "pointer",
              opacity: isDragging ? 0.4 : 1,
              transition: "border-color 0.15s, opacity 0.15s",
            }}
          >
            {onReorder && (
              <span
                style={{
                  fontSize: 10,
                  color: "#9ca3af",
                  cursor: "grab",
                  userSelect: "none",
                }}
              >
                ⠿
              </span>
            )}
            <button
              onClick={() => onSceneClick(scene.block.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flex: 1,
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                textAlign: "left",
                padding: 0,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#d97706",
                  minWidth: 16,
                }}
              >
                {i + 1}
              </span>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#111827",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {scene.block.content || "Untitled Scene"}
                </div>
                <div style={{ fontSize: 9, color: "#9ca3af" }}>
                  {blockCount} block{blockCount !== 1 ? "s" : ""}
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
