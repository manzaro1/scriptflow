import React, { useState } from "react";
import type { ScriptBlock, AITool, AIAnalysisResult } from "../types";
import { analyzeScript } from "../utils/ai";

const TOOLS: { key: AITool; label: string; description: string }[] = [
  {
    key: "doctor",
    label: "Script Doctor",
    description: "Analyze pacing, dialogue, and structure",
  },
  {
    key: "tone",
    label: "Tone Analyzer",
    description: "Identify mood shifts and emotional arcs",
  },
  {
    key: "plotHoles",
    label: "Plot Hole Detector",
    description: "Find inconsistencies and logic gaps",
  },
];

interface AIToolsPanelProps {
  blocks: ScriptBlock[];
  apiKey?: string;
  addToast?: (text: string, type: "success" | "error" | "info") => void;
}

export default function AIToolsPanel({ blocks, apiKey, addToast }: AIToolsPanelProps) {
  const [activeTool, setActiveTool] = useState<AITool | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async (tool: AITool) => {
    if (blocks.length < 2) {
      setError("Write at least a few blocks before analyzing.");
      return;
    }

    setActiveTool(tool);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const analysis = await analyzeScript(blocks, tool, apiKey);
      setResult(analysis);
      addToast?.("Analysis complete!", "success");
    } catch (err: any) {
      setError(err.message || "Analysis failed");
      addToast?.(err.message || "Analysis failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {TOOLS.map((tool) => (
          <button
            key={tool.key}
            onClick={() => handleRun(tool.key)}
            disabled={loading}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              padding: "10px 12px",
              borderRadius: 8,
              border:
                activeTool === tool.key
                  ? "2px solid #7c3aed"
                  : "1px solid #e5e7eb",
              backgroundColor:
                activeTool === tool.key ? "#f5f3ff" : "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
              {tool.label}
            </span>
            <span style={{ fontSize: 11, color: "#6b7280" }}>
              {tool.description}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div
          style={{
            fontSize: 11,
            color: "#dc2626",
            backgroundColor: "#fef2f2",
            padding: "6px 8px",
            borderRadius: 4,
          }}
        >
          {error}
        </div>
      )}

      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: 16,
            color: "#6b7280",
            fontSize: 12,
          }}
        >
          Analyzing script...
        </div>
      )}

      {result && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            maxHeight: 350,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              padding: "8px 10px",
              backgroundColor: "#f0fdf4",
              borderRadius: 6,
              fontSize: 12,
              color: "#166534",
              fontWeight: 500,
            }}
          >
            {result.summary}
          </div>
          {result.items.map((item, i) => (
            <div
              key={i}
              style={{
                padding: "8px 10px",
                backgroundColor: "#fafafa",
                borderRadius: 6,
                border: "1px solid #f3f4f6",
              }}
            >
              <div
                style={{ fontSize: 12, fontWeight: 600, color: "#111827", marginBottom: 2 }}
              >
                {item.title}
                {item.blockIndex !== undefined && (
                  <span
                    style={{
                      fontSize: 10,
                      color: "#9ca3af",
                      marginLeft: 6,
                    }}
                  >
                    Block #{item.blockIndex}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.4 }}>
                {item.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
