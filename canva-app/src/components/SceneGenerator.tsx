import React, { useState } from "react";
import type { ScriptBlock, ScriptMode } from "../types";
import { generateScene, type AIProvider } from "../utils/ai";
import { extractCharacters } from "../utils/script-helpers";

const TONES = [
  "Dramatic",
  "Comedy",
  "Thriller",
  "Horror",
  "Sci-Fi",
  "Romance",
  "Action",
  "Mystery",
  "Noir",
  "Surreal",
];

const SCENE_LENGTHS = [
  { value: "short", label: "Short (5-10)" },
  { value: "medium", label: "Medium (10-20)" },
  { value: "long", label: "Long (20-35)" },
];

interface SceneGeneratorProps {
  apiKey?: string;
  provider?: AIProvider;
  existingBlocks: ScriptBlock[];
  onInsert: (blocks: ScriptBlock[]) => void;
  addToast?: (text: string, type: "success" | "error" | "info") => void;
  mode?: ScriptMode;
}

export default function SceneGenerator({
  apiKey,
  provider = "pollinations",
  existingBlocks,
  onInsert,
  addToast,
  mode = "screenplay",
}: SceneGeneratorProps) {
  const [premise, setPremise] = useState("");
  const [tone, setTone] = useState("Dramatic");
  const [sceneLength, setSceneLength] = useState("medium");
  const [generating, setGenerating] = useState(false);
  const [generatedBlocks, setGeneratedBlocks] = useState<ScriptBlock[]>([]);
  const [error, setError] = useState<string | null>(null);

  const existingChars = extractCharacters(existingBlocks);

  const handleGenerate = async () => {
    if (!premise.trim()) {
      setError("Enter a scene premise.");
      return;
    }

    setGenerating(true);
    setError(null);
    setGeneratedBlocks([]);

    try {
      const blocks = await generateScene(
        premise,
        tone,
        sceneLength,
        existingChars,
        apiKey,
        mode,
        provider
      );
      setGeneratedBlocks(blocks);
      addToast?.("Scene generated!", "success");
    } catch (err: any) {
      setError(err.message || "Generation failed");
      addToast?.(err.message || "Generation failed", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleInsert = () => {
    onInsert(generatedBlocks);
    setGeneratedBlocks([]);
    setPremise("");
  };

  const TYPE_COLORS: Record<string, string> = {
    slugline: "#d97706",
    action: "#6b7280",
    character: "#7c3aed",
    dialogue: "#2563eb",
    parenthetical: "#a78bfa",
    transition: "#f59e0b",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={labelStyle}>Scene Premise</label>
        <textarea
          value={premise}
          onChange={(e) => setPremise(e.target.value)}
          placeholder="A tense interrogation between detective RILEY and suspect MARCO..."
          rows={3}
          style={textareaStyle}
        />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={labelStyle}>Tone</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            style={selectStyle}
          >
            {TONES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={labelStyle}>Length</label>
          <select
            value={sceneLength}
            onChange={(e) => setSceneLength(e.target.value)}
            style={selectStyle}
          >
            {SCENE_LENGTHS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {existingChars.length > 0 && (
        <div>
          <label style={labelStyle}>Characters in script</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
            {existingChars.map((c) => (
              <span key={c} style={chipStyle}>
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div style={errorStyle}>{error}</div>
      )}

      <button
        onClick={handleGenerate}
        disabled={generating || !premise.trim()}
        style={{
          ...buttonStyle,
          backgroundColor: generating ? "#9ca3af" : "#7c3aed",
          cursor: generating ? "not-allowed" : "pointer",
        }}
      >
        {generating ? "Generating..." : "Generate Scene"}
      </button>

      {generatedBlocks.length > 0 && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600 }}>
              Preview ({generatedBlocks.length} blocks)
            </span>
            <button onClick={handleInsert} style={insertButtonStyle}>
              Insert into Script
            </button>
          </div>
          <div
            style={{
              maxHeight: 250,
              overflowY: "auto",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              padding: 8,
              backgroundColor: "#fafafa",
            }}
          >
            {generatedBlocks.map((block) => (
              <div
                key={block.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 4,
                  padding: "2px 0",
                }}
              >
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    color: TYPE_COLORS[block.type] || "#6b7280",
                    textTransform: "uppercase",
                    minWidth: 28,
                    flexShrink: 0,
                  }}
                >
                  {block.type.substring(0, 4)}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "'Courier Prime', monospace",
                    flex: 1,
                    ...(block.type === "slugline"
                      ? { fontWeight: 700, textTransform: "uppercase" as const }
                      : {}),
                    ...(block.type === "character"
                      ? { fontWeight: 700, textTransform: "uppercase" as const }
                      : {}),
                    ...(block.type === "parenthetical"
                      ? { fontStyle: "italic" }
                      : {}),
                  }}
                >
                  {block.content}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#374151",
};

const textareaStyle: React.CSSProperties = {
  fontSize: 12,
  padding: 8,
  borderRadius: 6,
  border: "1px solid #d1d5db",
  resize: "none",
  fontFamily: "inherit",
  outline: "none",
};

const selectStyle: React.CSSProperties = {
  fontSize: 12,
  padding: "6px 8px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  backgroundColor: "#fff",
  outline: "none",
};

const chipStyle: React.CSSProperties = {
  fontSize: 10,
  padding: "2px 6px",
  borderRadius: 4,
  backgroundColor: "#ede9fe",
  color: "#7c3aed",
  fontWeight: 600,
};

const errorStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#dc2626",
  backgroundColor: "#fef2f2",
  padding: "6px 8px",
  borderRadius: 4,
};

const buttonStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#fff",
  padding: "8px 16px",
  borderRadius: 6,
  border: "none",
};

const insertButtonStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#fff",
  backgroundColor: "#059669",
  padding: "4px 10px",
  borderRadius: 4,
  border: "none",
  cursor: "pointer",
};
