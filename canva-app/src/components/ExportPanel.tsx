import React, { useState } from "react";
import type { ScriptBlock } from "../types";

interface Props {
  blocks: ScriptBlock[];
}

type ExportFormat = "text" | "fdx" | "pdf";

function blocksToPlainText(blocks: ScriptBlock[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "slugline":
          return `\n${b.content.toUpperCase()}\n`;
        case "action":
          return `${b.content}\n`;
        case "character":
          return `\n${"".padStart(20)}${b.content.toUpperCase()}`;
        case "parenthetical":
          return `${"".padStart(15)}(${b.content})`;
        case "dialogue":
          return `${"".padStart(10)}${b.content}\n`;
        case "transition":
          return `\n${"".padStart(55)}${b.content.toUpperCase()}\n`;
        default:
          return b.content;
      }
    })
    .join("\n");
}

function blocksToFDX(blocks: ScriptBlock[]): string {
  const typeMap: Record<string, string> = {
    slugline: "Scene Heading",
    action: "Action",
    character: "Character",
    dialogue: "Dialogue",
    parenthetical: "Parenthetical",
    transition: "Transition",
  };

  const paras = blocks
    .map((b) => {
      const t = typeMap[b.type] || "Action";
      const escaped = b.content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return `    <Paragraph Type="${t}">\n      <Text>${escaped}</Text>\n    </Paragraph>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<FinalDraft DocumentType="Script" Template="No" Version="5">
  <Content>
${paras}
  </Content>
</FinalDraft>`;
}

function blocksToHTMLForPrint(blocks: ScriptBlock[]): string {
  const styles: Record<string, string> = {
    slugline: "text-transform:uppercase;font-weight:bold;margin-top:24px;",
    action: "margin:12px 0;",
    character: "text-align:center;text-transform:uppercase;margin-top:18px;font-weight:600;",
    parenthetical: "text-align:center;font-style:italic;",
    dialogue: "text-align:center;max-width:60%;margin:0 auto;",
    transition: "text-align:right;text-transform:uppercase;margin-top:18px;",
  };

  const body = blocks
    .map((b) => `<p style="${styles[b.type] || ""}">${b.content}</p>`)
    .join("\n");

  return `<!DOCTYPE html><html><head><style>
body{font-family:'Courier New',monospace;font-size:12pt;max-width:8.5in;margin:1in auto;line-height:1.5;}
@media print{body{margin:0;}}
</style></head><body>${body}</body></html>`;
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportPanel({ blocks }: Props) {
  const [exported, setExported] = useState<string | null>(null);

  const handleExport = (format: ExportFormat) => {
    setExported(null);
    try {
      switch (format) {
        case "text": {
          download("script.txt", blocksToPlainText(blocks), "text/plain");
          break;
        }
        case "fdx": {
          download("script.fdx", blocksToFDX(blocks), "application/xml");
          break;
        }
        case "pdf": {
          const html = blocksToHTMLForPrint(blocks);
          const win = window.open("", "_blank");
          if (win) {
            win.document.write(html);
            win.document.close();
            setTimeout(() => win.print(), 300);
          }
          break;
        }
      }
      setExported(format);
      setTimeout(() => setExported(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const formats: { key: ExportFormat; label: string; desc: string; icon: string }[] = [
    { key: "text", label: "Plain Text", desc: "Formatted .txt screenplay", icon: "📄" },
    { key: "fdx", label: "Final Draft (FDX)", desc: "Industry-standard screenplay format", icon: "🎬" },
    { key: "pdf", label: "Print / PDF", desc: "Opens print dialog for PDF save", icon: "🖨️" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>
        Export Script
      </h3>
      <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>
        Export your screenplay in different formats.
      </p>

      {formats.map((f) => (
        <button
          key={f.key}
          onClick={() => handleExport(f.key)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            backgroundColor: exported === f.key ? "#f0fdf4" : "#fff",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span style={{ fontSize: 20 }}>{f.icon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{f.label}</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>{f.desc}</div>
          </div>
        </button>
      ))}

      {exported && (
        <div style={{ fontSize: 11, color: "#166534", textAlign: "center" }}>
          ✓ Exported successfully
        </div>
      )}
    </div>
  );
}
