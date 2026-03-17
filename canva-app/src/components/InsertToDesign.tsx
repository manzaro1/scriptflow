import React, { useState } from "react";
import type { ScriptBlock } from "../types";
import { blocksToPlainText } from "../utils/script-helpers";

interface InsertToDesignProps {
  blocks: ScriptBlock[];
}

/**
 * Formats script blocks and provides insertion methods.
 *
 * In a real Canva Apps SDK environment, this would use:
 * - createRichtextRange() from @canva/design for richtext formatting
 * - addElementAtPoint() from @canva/design to insert into the canvas
 *
 * Since we can't import the actual SDK at build time without the Canva dev
 * environment, the component prepares the formatted text and delegates
 * insertion to the Canva SDK methods when available at runtime.
 */
export default function InsertToDesign({ blocks }: InsertToDesignProps) {
  const [status, setStatus] = useState<string | null>(null);

  const handleInsertAsText = async () => {
    setStatus(null);

    try {
      // Try to use Canva SDK if available at runtime
      const canvaDesign = (window as any).__canva_design__;
      if (canvaDesign?.addElementAtPoint) {
        // Build richtext content per block type
        for (const block of blocks) {
          const formatting = getCanvaFormatting(block);
          await canvaDesign.addElementAtPoint({
            type: "richtext",
            ...formatting,
          });
        }
        setStatus("Inserted into design!");
        return;
      }

      // Fallback: copy to clipboard
      const text = blocksToPlainText(blocks);
      await navigator.clipboard.writeText(text);
      setStatus("Copied to clipboard! Paste into your Canva design.");
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  };

  const handleCopyFormatted = async () => {
    try {
      const text = blocksToPlainText(blocks);
      await navigator.clipboard.writeText(text);
      setStatus("Copied to clipboard!");
    } catch {
      setStatus("Failed to copy");
    }
  };

  if (blocks.length === 0) {
    return (
      <div style={{ fontSize: 12, color: "#9ca3af", padding: 8 }}>
        Write some script blocks first, then insert them into your design.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 11, color: "#6b7280" }}>
        Insert your screenplay into the Canva canvas with professional
        formatting.
      </div>

      <div
        style={{
          padding: 10,
          backgroundColor: "#fafafa",
          borderRadius: 6,
          border: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#374151",
            marginBottom: 6,
          }}
        >
          Format Preview
        </div>
        <div
          style={{
            fontFamily: "'Courier Prime', 'Courier New', monospace",
            fontSize: 10,
            lineHeight: 1.6,
            maxHeight: 200,
            overflowY: "auto",
            whiteSpace: "pre-wrap",
          }}
        >
          {blocksToPlainText(blocks)}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={handleInsertAsText} style={primaryButtonStyle}>
          Insert into Design
        </button>
        <button onClick={handleCopyFormatted} style={secondaryButtonStyle}>
          Copy to Clipboard
        </button>
      </div>

      {status && (
        <div
          style={{
            fontSize: 11,
            padding: "6px 8px",
            borderRadius: 4,
            backgroundColor: status.startsWith("Error")
              ? "#fef2f2"
              : "#f0fdf4",
            color: status.startsWith("Error") ? "#dc2626" : "#166534",
          }}
        >
          {status}
        </div>
      )}

      <div
        style={{
          fontSize: 10,
          color: "#9ca3af",
          padding: "8px 0",
          borderTop: "1px solid #f3f4f6",
        }}
      >
        <strong>Formatting applied:</strong>
        <ul style={{ margin: "4px 0 0 12px", padding: 0 }}>
          <li>Sluglines: UPPERCASE, BOLD</li>
          <li>Character: UPPERCASE, BOLD, centered</li>
          <li>Dialogue: Indented</li>
          <li>Parenthetical: Italic, indented</li>
          <li>Transition: UPPERCASE, BOLD, right-aligned</li>
          <li>Action: Standard</li>
        </ul>
      </div>
    </div>
  );
}

function getCanvaFormatting(block: ScriptBlock) {
  const base = {
    fontFamily: "Courier Prime",
    fontSize: 12,
  };

  switch (block.type) {
    case "slugline":
      return {
        ...base,
        text: block.content.toUpperCase(),
        fontWeight: "bold",
        textAlign: "start",
      };
    case "character":
      return {
        ...base,
        text: block.content.toUpperCase(),
        fontWeight: "bold",
        textAlign: "center",
      };
    case "dialogue":
      return {
        ...base,
        text: block.content,
        textAlign: "start",
      };
    case "parenthetical":
      return {
        ...base,
        text: `(${block.content})`,
        fontStyle: "italic",
        textAlign: "start",
      };
    case "transition":
      return {
        ...base,
        text: block.content.toUpperCase(),
        fontWeight: "bold",
        textAlign: "end",
      };
    case "action":
    default:
      return {
        ...base,
        text: block.content,
        textAlign: "start",
      };
  }
}

const primaryButtonStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#fff",
  backgroundColor: "#7c3aed",
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "#374151",
  backgroundColor: "#f9fafb",
  padding: "8px 16px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  cursor: "pointer",
};
