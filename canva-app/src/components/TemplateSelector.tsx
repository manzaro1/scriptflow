import React from "react";
import type { ScriptBlock, ScriptMode } from "../types";
import { getTemplatesForMode } from "../utils/templates";

interface TemplateSelectorProps {
  mode: ScriptMode;
  onSelect: (blocks: ScriptBlock[]) => void;
}

export default function TemplateSelector({ mode, onSelect }: TemplateSelectorProps) {
  const templates = getTemplatesForMode(mode);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
          Choose a Template
        </div>
        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
          Start with a pre-built script structure, or write from scratch.
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.blocks())}
            style={cardStyle}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>
              {t.name}
            </div>
            <div style={{ fontSize: 10, color: "#6b7280" }}>
              {t.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 2,
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  backgroundColor: "#fff",
  cursor: "pointer",
  textAlign: "left",
  transition: "border-color 0.15s",
};
