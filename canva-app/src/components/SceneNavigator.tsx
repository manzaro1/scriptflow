import React from "react";
import type { ScriptBlock } from "../types";

interface SceneNavigatorProps {
  blocks: ScriptBlock[];
  onSceneClick: (blockId: string) => void;
  focusedBlockId: string | null;
}

export default function SceneNavigator({
  blocks,
  onSceneClick,
  focusedBlockId,
}: SceneNavigatorProps) {
  const scenes = blocks
    .map((block, index) => ({ block, index }))
    .filter((item) => item.block.type === "slugline");

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
      </div>
      {scenes.map((scene, i) => {
        const isActive = focusedBlockId === scene.block.id;
        // Count blocks until next slugline
        const nextSceneIdx =
          i + 1 < scenes.length ? scenes[i + 1].index : blocks.length;
        const blockCount = nextSceneIdx - scene.index;

        return (
          <button
            key={scene.block.id}
            onClick={() => onSceneClick(scene.block.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 8px",
              borderRadius: 6,
              border: "none",
              backgroundColor: isActive ? "#ede9fe" : "transparent",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
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
        );
      })}
    </div>
  );
}
