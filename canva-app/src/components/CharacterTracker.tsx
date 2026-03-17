import React, { useMemo } from "react";
import type { ScriptBlock } from "../types";

interface Props {
  blocks: ScriptBlock[];
  onBlockClick?: (blockId: string) => void;
}

interface CharacterInfo {
  name: string;
  dialogueCount: number;
  sceneAppearances: number;
  firstAppearanceId: string;
  wordCount: number;
}

export default function CharacterTracker({ blocks, onBlockClick }: Props) {
  const characters = useMemo(() => {
    const map = new Map<string, CharacterInfo>();
    const scenesPerChar = new Map<string, Set<number>>();
    let currentScene = 0;

    blocks.forEach((b, i) => {
      if (b.type === "slugline") currentScene++;

      if (b.type === "character") {
        const name = b.content.trim().toUpperCase();
        if (!map.has(name)) {
          map.set(name, {
            name,
            dialogueCount: 0,
            sceneAppearances: 0,
            firstAppearanceId: b.id,
            wordCount: 0,
          });
          scenesPerChar.set(name, new Set());
        }
        scenesPerChar.get(name)!.add(currentScene);

        // Count dialogue for this character (next dialogue block)
        const next = blocks[i + 1];
        if (next && next.type === "dialogue") {
          const info = map.get(name)!;
          info.dialogueCount++;
          info.wordCount += next.content.split(/\s+/).filter(Boolean).length;
        }
      }
    });

    scenesPerChar.forEach((scenes, name) => {
      const info = map.get(name);
      if (info) info.sceneAppearances = scenes.size;
    });

    return Array.from(map.values()).sort(
      (a, b) => b.dialogueCount - a.dialogueCount
    );
  }, [blocks]);

  if (characters.length === 0) {
    return (
      <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: 24 }}>
        No characters found. Add CHARACTER blocks to your script.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>
        Characters ({characters.length})
      </h3>

      {characters.map((c) => (
        <div
          key={c.name}
          onClick={() => onBlockClick?.(c.firstAppearanceId)}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            cursor: onBlockClick ? "pointer" : "default",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
            {c.name}
          </div>
          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 6,
              fontSize: 11,
              color: "#6b7280",
            }}
          >
            <span>🎬 {c.sceneAppearances} scene{c.sceneAppearances !== 1 ? "s" : ""}</span>
            <span>💬 {c.dialogueCount} line{c.dialogueCount !== 1 ? "s" : ""}</span>
            <span>📝 {c.wordCount} word{c.wordCount !== 1 ? "s" : ""}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
