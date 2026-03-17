import React, { useState, useCallback } from "react";
import type { ScriptBlock } from "../../types";
import { defaultBlocks } from "../../utils/script-helpers";
import ScriptEditor from "../../components/ScriptEditor";
import SceneGenerator from "../../components/SceneGenerator";
import AIToolsPanel from "../../components/AIToolsPanel";
import InsertToDesign from "../../components/InsertToDesign";
import SceneNavigator from "../../components/SceneNavigator";
import DocumentImport from "../../components/DocumentImport";
import SettingsPanel from "../../components/SettingsPanel";

type Tab = "write" | "generate" | "ai" | "import" | "insert" | "settings";

const TABS: { key: Tab; label: string }[] = [
  { key: "write", label: "Write" },
  { key: "generate", label: "Generate" },
  { key: "ai", label: "AI Tools" },
  { key: "import", label: "Import" },
  { key: "insert", label: "Insert" },
  { key: "settings", label: "Settings" },
];

const STORAGE_KEY = "scriptflow_canva_apikey";

function loadApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>("write");
  const [blocks, setBlocks] = useState<ScriptBlock[]>(defaultBlocks());
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState(loadApiKey);

  const handleApiKeyChange = useCallback((key: string) => {
    setApiKey(key);
    try {
      if (key) localStorage.setItem(STORAGE_KEY, key);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const handleInsertGeneratedBlocks = useCallback(
    (newBlocks: ScriptBlock[]) => {
      setBlocks((prev) => {
        const idx = focusedBlockId
          ? prev.findIndex((b) => b.id === focusedBlockId)
          : prev.length - 1;
        let insertAt = idx + 1;
        for (let i = idx + 1; i < prev.length; i++) {
          if (prev[i].type === "slugline") {
            insertAt = i;
            break;
          }
          insertAt = i + 1;
        }
        return [...prev.slice(0, insertAt), ...newBlocks, ...prev.slice(insertAt)];
      });
      setActiveTab("write");
    },
    [focusedBlockId]
  );

  const handleImportBlocks = useCallback(
    (newBlocks: ScriptBlock[]) => {
      setBlocks((prev) => [...prev, ...newBlocks]);
      setActiveTab("write");
    },
    []
  );

  const handleSceneClick = useCallback((blockId: string) => {
    setFocusedBlockId(blockId);
    setActiveTab("write");
  }, []);

  // Pass apiKey only if set, otherwise undefined (free tier)
  const aiKey = apiKey || undefined;

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={logoStyle}>SF</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
              ScriptFlow
            </div>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>
              AI-Powered Scriptwriting
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={tabBarStyle}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              ...tabStyle,
              color: activeTab === tab.key ? "#7c3aed" : "#6b7280",
              borderBottom:
                activeTab === tab.key
                  ? "2px solid #7c3aed"
                  : "2px solid transparent",
              fontWeight: activeTab === tab.key ? 700 : 500,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={contentStyle}>
        {activeTab === "write" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SceneNavigator
              blocks={blocks}
              onSceneClick={handleSceneClick}
              focusedBlockId={focusedBlockId}
            />
            <ScriptEditor
              blocks={blocks}
              onBlocksChange={setBlocks}
              focusedBlockId={focusedBlockId}
              onFocusedBlockChange={setFocusedBlockId}
            />
          </div>
        )}

        {activeTab === "generate" && (
          <SceneGenerator
            apiKey={aiKey}
            existingBlocks={blocks}
            onInsert={handleInsertGeneratedBlocks}
          />
        )}

        {activeTab === "ai" && (
          <AIToolsPanel blocks={blocks} apiKey={aiKey} />
        )}

        {activeTab === "import" && (
          <DocumentImport apiKey={aiKey} onImport={handleImportBlocks} />
        )}

        {activeTab === "insert" && <InsertToDesign blocks={blocks} />}

        {activeTab === "settings" && (
          <SettingsPanel apiKey={apiKey} onApiKeyChange={handleApiKeyChange} />
        )}
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  backgroundColor: "#fff",
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 16px",
  borderBottom: "1px solid #f3f4f6",
};

const logoStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  backgroundColor: "#7c3aed",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  fontWeight: 800,
};

const tabBarStyle: React.CSSProperties = {
  display: "flex",
  borderBottom: "1px solid #f3f4f6",
  padding: "0 4px",
  overflowX: "auto",
};

const tabStyle: React.CSSProperties = {
  fontSize: 11,
  padding: "8px 8px",
  border: "none",
  backgroundColor: "transparent",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  padding: 16,
  overflowY: "auto",
};
