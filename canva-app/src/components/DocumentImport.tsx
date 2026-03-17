import React, { useState, useRef } from "react";
import type { ScriptBlock } from "../types";
import { parseDocumentToBlocks } from "../utils/ai";

interface DocumentImportProps {
  apiKey?: string;
  onImport: (blocks: ScriptBlock[]) => void;
}

async function extractTextFromDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => item.str)
      .join(" ");
    pages.push(text);
  }

  return pages.join("\n\n");
}

async function extractTextFromTxt(file: File): Promise<string> {
  return file.text();
}

export default function DocumentImport({
  apiKey,
  onImport,
}: DocumentImportProps) {
  const [status, setStatus] = useState<"idle" | "reading" | "parsing" | "preview">("idle");
  const [rawText, setRawText] = useState("");
  const [parsedBlocks, setParsedBlocks] = useState<ScriptBlock[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setFileName(file.name);
    setStatus("reading");

    try {
      let text = "";
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "docx" || ext === "doc") {
        text = await extractTextFromDocx(file);
      } else if (ext === "pdf") {
        text = await extractTextFromPdf(file);
      } else if (ext === "txt" || ext === "fountain") {
        text = await extractTextFromTxt(file);
      } else {
        setError(`Unsupported file type: .${ext}. Use .docx, .pdf, or .txt`);
        setStatus("idle");
        return;
      }

      if (!text.trim()) {
        setError("The document appears to be empty.");
        setStatus("idle");
        return;
      }

      setRawText(text);
      setStatus("parsing");

      // Use AI to parse into script blocks
      const blocks = await parseDocumentToBlocks(
        text.substring(0, 8000), // Limit to avoid token overflow
        apiKey
      );
      setParsedBlocks(blocks);
      setStatus("preview");
    } catch (err: any) {
      setError(err.message || "Failed to process document");
      setStatus("idle");
    }
  };

  const handleImport = () => {
    onImport(parsedBlocks);
    setParsedBlocks([]);
    setRawText("");
    setFileName(null);
    setStatus("idle");
  };

  const handleCancel = () => {
    setParsedBlocks([]);
    setRawText("");
    setFileName(null);
    setStatus("idle");
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
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
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
          Import Document
        </div>
        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
          Upload a Word (.docx), PDF, or text file. AI will convert it into
          formatted screenplay blocks.
        </div>
      </div>

      {/* File input */}
      <div
        onClick={() => fileRef.current?.click()}
        style={{
          border: "2px dashed #d1d5db",
          borderRadius: 8,
          padding: 20,
          textAlign: "center",
          cursor: "pointer",
          backgroundColor: "#fafafa",
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".docx,.doc,.pdf,.txt,.fountain"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
        <div style={{ fontSize: 20, marginBottom: 4 }}>+</div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          {fileName || "Click to select a file"}
        </div>
        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
          .docx, .pdf, .txt, .fountain
        </div>
      </div>

      {/* Status */}
      {status === "reading" && (
        <div style={statusStyle}>Reading document...</div>
      )}
      {status === "parsing" && (
        <div style={statusStyle}>AI is parsing into screenplay format...</div>
      )}

      {/* Error */}
      {error && (
        <div style={errorStyle}>{error}</div>
      )}

      {/* Preview */}
      {status === "preview" && parsedBlocks.length > 0 && (
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
              Parsed {parsedBlocks.length} blocks
            </span>
          </div>
          <div
            style={{
              maxHeight: 220,
              overflowY: "auto",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              padding: 8,
              backgroundColor: "#fafafa",
            }}
          >
            {parsedBlocks.map((block) => (
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
                    ...(block.type === "slugline" || block.type === "character"
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

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={handleImport} style={importBtnStyle}>
              Import into Script
            </button>
            <button onClick={handleCancel} style={cancelBtnStyle}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const statusStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
  textAlign: "center",
  padding: 12,
};

const errorStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#dc2626",
  backgroundColor: "#fef2f2",
  padding: "6px 8px",
  borderRadius: 4,
};

const importBtnStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#fff",
  backgroundColor: "#7c3aed",
  padding: "8px 16px",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  flex: 1,
};

const cancelBtnStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "#374151",
  backgroundColor: "#f9fafb",
  padding: "8px 16px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  cursor: "pointer",
};
