import React, { useMemo } from "react";
import type { ScriptBlock, ElementType } from "../types";

interface Props {
  blocks: ScriptBlock[];
}

export default function ScriptStats({ blocks }: Props) {
  const stats = useMemo(() => {
    const totalWords = blocks.reduce(
      (sum, b) => sum + b.content.split(/\s+/).filter(Boolean).length,
      0
    );
    const sceneCount = blocks.filter((b) => b.type === "slugline").length;
    const dialogueBlocks = blocks.filter((b) => b.type === "dialogue").length;
    const actionBlocks = blocks.filter((b) => b.type === "action").length;
    const characters = new Set(
      blocks
        .filter((b) => b.type === "character")
        .map((b) => b.content.trim().toUpperCase())
    );
    // ~250 words per screenplay page
    const estPages = Math.max(1, Math.round(totalWords / 250));
    // ~1 min per page
    const estMinutes = estPages;

    const typeCounts: Partial<Record<ElementType, number>> = {};
    blocks.forEach((b) => {
      typeCounts[b.type] = (typeCounts[b.type] || 0) + 1;
    });

    return {
      totalBlocks: blocks.length,
      totalWords,
      sceneCount,
      dialogueBlocks,
      actionBlocks,
      characterCount: characters.size,
      estPages,
      estMinutes,
      typeCounts,
    };
  }, [blocks]);

  const statItems = [
    { label: "Total Blocks", value: stats.totalBlocks, icon: "📦" },
    { label: "Total Words", value: stats.totalWords.toLocaleString(), icon: "📝" },
    { label: "Scenes", value: stats.sceneCount, icon: "🎬" },
    { label: "Characters", value: stats.characterCount, icon: "👤" },
    { label: "Dialogue Lines", value: stats.dialogueBlocks, icon: "💬" },
    { label: "Action Lines", value: stats.actionBlocks, icon: "🎭" },
    { label: "Est. Pages", value: stats.estPages, icon: "📄" },
    { label: "Est. Runtime", value: `${stats.estMinutes} min`, icon: "⏱️" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>
        Script Statistics
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
        }}
      >
        {statItems.map((s) => (
          <div
            key={s.label}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              backgroundColor: "#fafafa",
            }}
          >
            <div style={{ fontSize: 11, color: "#6b7280" }}>
              {s.icon} {s.label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginTop: 2 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Block type breakdown */}
      <div style={{ marginTop: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
          Block Type Breakdown
        </div>
        {Object.entries(stats.typeCounts).map(([type, count]) => {
          const pct = stats.totalBlocks > 0 ? (count! / stats.totalBlocks) * 100 : 0;
          return (
            <div key={type} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ fontSize: 11, color: "#374151", width: 90, textTransform: "capitalize" }}>
                {type}
              </div>
              <div
                style={{
                  flex: 1,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#f3f4f6",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    backgroundColor: "#7c3aed",
                    borderRadius: 4,
                  }}
                />
              </div>
              <div style={{ fontSize: 10, color: "#9ca3af", width: 24, textAlign: "right" }}>
                {count}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
