import React, { useState, useMemo } from "react";
import type { ScriptBlock, StoryboardFrame } from "../types";
import { groupBlocksIntoScenes } from "../utils/script-helpers";
import { generateVisualDescription } from "../utils/ai";

interface StoryboardPanelProps {
  blocks: ScriptBlock[];
  apiKey?: string;
  addToast: (text: string, type: "success" | "error" | "info") => void;
}

export default function StoryboardPanel({
  blocks,
  apiKey,
  addToast,
}: StoryboardPanelProps) {
  const scenes = useMemo(() => groupBlocksIntoScenes(blocks), [blocks]);

  const [frames, setFrames] = useState<StoryboardFrame[]>(() =>
    scenes.map((scene, i) => ({
      sceneIndex: i,
      slugline: scene.blocks[0]?.content || `Scene ${i + 1}`,
      description: scene.blocks
        .filter((b) => b.type === "action" || b.type === "body")
        .map((b) => b.content)
        .join(" ")
        .substring(0, 200),
      visualPrompt: "",
      blocks: scene.blocks,
      status: "pending" as const,
    }))
  );

  const [generatingAll, setGeneratingAll] = useState(false);

  const handleGenerateVisual = async (idx: number) => {
    setFrames((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, status: "generating" } : f))
    );
    try {
      const visual = await generateVisualDescription(frames[idx].blocks, apiKey);
      setFrames((prev) =>
        prev.map((f, i) =>
          i === idx ? { ...f, visualPrompt: visual, status: "ready" } : f
        )
      );
    } catch (err: any) {
      setFrames((prev) =>
        prev.map((f, i) => (i === idx ? { ...f, status: "pending" } : f))
      );
      addToast(err.message || "Failed to generate visual", "error");
    }
  };

  const handleGenerateAll = async () => {
    setGeneratingAll(true);
    for (let i = 0; i < frames.length; i++) {
      if (frames[i].status !== "ready") {
        await handleGenerateVisual(i);
      }
    }
    setGeneratingAll(false);
    addToast("All visuals generated!", "success");
  };

  const handleInsertFrame = async (frame: StoryboardFrame) => {
    try {
      const canvaDesign = (window as any).__canva_design__;
      if (canvaDesign?.addPage) {
        await canvaDesign.addPage({
          title: frame.slugline,
          elements: [
            {
              type: "text",
              children: [frame.slugline.toUpperCase()],
              top: 40,
              left: 40,
              width: 500,
              fontSize: 24,
              fontWeight: "bold",
            },
            {
              type: "text",
              children: [frame.description || ""],
              top: 100,
              left: 40,
              width: 500,
              fontSize: 14,
            },
            ...(frame.visualPrompt
              ? [
                  {
                    type: "text" as const,
                    children: [`[Visual: ${frame.visualPrompt}]`],
                    top: 250,
                    left: 40,
                    width: 500,
                    fontSize: 12,
                  },
                ]
              : []),
          ],
        });
        setFrames((prev) =>
          prev.map((f) =>
            f.sceneIndex === frame.sceneIndex ? { ...f, status: "inserted" } : f
          )
        );
        addToast(`Page created: ${frame.slugline}`, "success");
      } else {
        const text = `${frame.slugline}\n\n${frame.description}\n\nVisual: ${frame.visualPrompt}`;
        await navigator.clipboard.writeText(text);
        addToast("Copied to clipboard (Canva SDK not available)", "info");
      }
    } catch (err: any) {
      addToast(err.message || "Insert failed", "error");
    }
  };

  const handleInsertAll = async () => {
    for (const frame of frames) {
      await handleInsertFrame(frame);
    }
  };

  if (scenes.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "#6b7280", padding: 32, fontSize: 12 }}>
        Write some scenes first to generate a storyboard.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
          Storyboard
        </div>
        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
          Generate visual descriptions for each scene and insert as Canva pages.
        </div>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={handleGenerateAll}
          disabled={generatingAll}
          style={{
            ...primaryBtnStyle,
            opacity: generatingAll ? 0.6 : 1,
            cursor: generatingAll ? "not-allowed" : "pointer",
          }}
        >
          {generatingAll ? "Generating..." : "Generate All Visuals"}
        </button>
        <button onClick={handleInsertAll} style={secondaryBtnStyle}>
          Insert All Pages
        </button>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxHeight: 400,
          overflowY: "auto",
        }}
      >
        {frames.map((frame, i) => (
          <div key={i} style={frameCardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>
                <span style={{ color: "#d97706", marginRight: 6 }}>#{i + 1}</span>
                {frame.slugline}
              </div>
              {frame.status === "inserted" && (
                <span style={{ fontSize: 9, color: "#059669", fontWeight: 600 }}>
                  INSERTED
                </span>
              )}
            </div>

            {frame.description && (
              <div style={{ fontSize: 10, color: "#6b7280", lineHeight: 1.4 }}>
                {frame.description}
              </div>
            )}

            {frame.visualPrompt && (
              <div
                style={{
                  fontSize: 10,
                  color: "#7c3aed",
                  backgroundColor: "#f5f3ff",
                  padding: "6px 8px",
                  borderRadius: 4,
                  lineHeight: 1.4,
                }}
              >
                {frame.visualPrompt}
              </div>
            )}

            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
              <button
                onClick={() => handleGenerateVisual(i)}
                disabled={frame.status === "generating"}
                style={{
                  ...smallBtnStyle,
                  opacity: frame.status === "generating" ? 0.5 : 1,
                }}
              >
                {frame.status === "generating"
                  ? "Generating..."
                  : frame.visualPrompt
                  ? "Regenerate"
                  : "Generate Visual"}
              </button>
              <button
                onClick={() => handleInsertFrame(frame)}
                style={{ ...smallBtnStyle, backgroundColor: "#059669", color: "#fff" }}
              >
                Insert Page
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const primaryBtnStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#fff",
  backgroundColor: "#7c3aed",
  padding: "6px 12px",
  borderRadius: 6,
  border: "none",
};

const secondaryBtnStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: "#374151",
  backgroundColor: "#f3f4f6",
  padding: "6px 12px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  cursor: "pointer",
};

const frameCardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  backgroundColor: "#fff",
};

const smallBtnStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: "#374151",
  backgroundColor: "#f3f4f6",
  padding: "4px 8px",
  borderRadius: 4,
  border: "none",
  cursor: "pointer",
};
