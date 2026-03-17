import React, { useState, useCallback, useEffect, useMemo } from "react";
import type { ScriptBlock, ScriptMode } from "../../types";
import { defaultBlocks, groupBlocksIntoScenes, flattenSceneGroups } from "../../utils/script-helpers";
import { getUserTier, setUserTier, type Tier } from "../../utils/pricing";
import useHistory from "../../hooks/useHistory";
import ScriptEditor from "../../components/ScriptEditor";
import SceneGenerator from "../../components/SceneGenerator";
import AIToolsPanel from "../../components/AIToolsPanel";
import InsertToDesign from "../../components/InsertToDesign";
import SceneNavigator from "../../components/SceneNavigator";
import DocumentImport from "../../components/DocumentImport";
import Toast, { type ToastMessage } from "../../components/Toast";
import TemplateSelector from "../../components/TemplateSelector";
import FindReplace from "../../components/FindReplace";
import StoryboardPanel from "../../components/StoryboardPanel";
import ExportPanel from "../../components/ExportPanel";
import CharacterTracker from "../../components/CharacterTracker";
import ScriptStats from "../../components/ScriptStats";
import FeatureGate from "../../components/FeatureGate";

type Tab = "write" | "generate" | "ai" | "import" | "insert" | "storyboard";

const TABS: { key: Tab; label: string; proFeature?: string }[] = [
  { key: "write", label: "Write" },
  { key: "generate", label: "Generate" },
  { key: "ai", label: "AI Tools", proFeature: "aiTools" },
  { key: "storyboard", label: "Storyboard", proFeature: "storyboard" },
  { key: "import", label: "Import" },
  { key: "insert", label: "Insert" },
];

const MODES: { key: ScriptMode; label: string; proFeature?: string }[] = [
  { key: "screenplay", label: "Screenplay" },
  { key: "youtube", label: "YouTube", proFeature: "youtubeMode" },
  { key: "podcast", label: "Podcast", proFeature: "podcastMode" },
  { key: "tiktok", label: "TikTok", proFeature: "tiktokMode" },
];

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>("write");
  const [mode, setMode] = useState<ScriptMode>("screenplay");
  const { blocks, setBlocks, undo, redo, canUndo, canRedo } = useHistory(defaultBlocks(mode));
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [tier, setTier] = useState<Tier>(getUserTier);

  // Toast system
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = useCallback(
    (text: string, type: ToastMessage["type"] = "info") => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, text, type }]);
    },
    []
  );
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Find & Replace
  const [findReplaceVisible, setFindReplaceVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedBlockId, setHighlightedBlockId] = useState<string | null>(null);

  // Collapsible sections in Write tab
  const [showStats, setShowStats] = useState(false);
  const [showCharacters, setShowCharacters] = useState(false);

  // Check if blocks are just the default single empty block (for template selector)
  const isEmptyScript = useMemo(() => {
    return blocks.length === 1 && !blocks[0].content.trim();
  }, [blocks]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Redo
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
      }
      // Find
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setFindReplaceVisible(true);
      }
      // Escape to close find
      if (e.key === "Escape") {
        setFindReplaceVisible(false);
        setSearchTerm("");
        setHighlightedBlockId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  const handleUpgrade = useCallback(() => {
    setUserTier("pro");
    setTier("pro");
    addToast("Upgraded to Pro! All features unlocked.", "success");
  }, [addToast]);

  const handleModeChange = useCallback(
    (newMode: ScriptMode) => {
      setMode(newMode);
      addToast(`Switched to ${newMode} mode`, "info");
    },
    [addToast]
  );

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
        return [
          ...prev.slice(0, insertAt),
          ...newBlocks,
          ...prev.slice(insertAt),
        ];
      });
      setActiveTab("write");
    },
    [focusedBlockId, setBlocks]
  );

  const handleImportBlocks = useCallback(
    (newBlocks: ScriptBlock[]) => {
      setBlocks((prev) => [...prev, ...newBlocks]);
      setActiveTab("write");
    },
    [setBlocks]
  );

  const handleTemplateSelect = useCallback(
    (templateBlocks: ScriptBlock[]) => {
      setBlocks(templateBlocks);
      addToast("Template loaded!", "success");
    },
    [setBlocks, addToast]
  );

  const handleSceneClick = useCallback((blockId: string) => {
    setFocusedBlockId(blockId);
    setActiveTab("write");
  }, []);

  const handleSceneReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      const scenes = groupBlocksIntoScenes(blocks);
      if (fromIndex < 0 || fromIndex >= scenes.length) return;
      if (toIndex < 0 || toIndex >= scenes.length) return;
      const moved = scenes.splice(fromIndex, 1)[0];
      scenes.splice(toIndex, 0, moved);
      setBlocks(flattenSceneGroups(scenes));
      addToast(`Scene moved`, "info");
    },
    [blocks, setBlocks, addToast]
  );

  const handleFindReplaceBlocksChange = useCallback(
    (newBlocks: ScriptBlock[]) => {
      setBlocks(newBlocks);
    },
    [setBlocks]
  );

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
        {tier === "pro" && (
          <span style={proBadgeStyle}>PRO</span>
        )}
      </div>

      {/* Mode selector */}
      <div style={modeSelectorStyle}>
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => {
              if (m.proFeature && tier !== "pro") {
                addToast(`${m.label} mode requires Pro`, "info");
                return;
              }
              handleModeChange(m.key);
            }}
            style={{
              ...modeButtonStyle,
              backgroundColor: mode === m.key ? "#7c3aed" : "#f3f4f6",
              color: mode === m.key ? "#fff" : "#374151",
              opacity: m.proFeature && tier !== "pro" ? 0.5 : 1,
            }}
          >
            {m.label}
            {m.proFeature && tier !== "pro" && (
              <span style={{ fontSize: 7, marginLeft: 2, opacity: 0.7 }}>PRO</span>
            )}
          </button>
        ))}
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
            {/* Toolbar */}
            <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
              <button
                disabled={!canUndo}
                onClick={undo}
                style={{
                  ...toolbarBtnStyle,
                  opacity: canUndo ? 1 : 0.4,
                  cursor: canUndo ? "pointer" : "default",
                }}
                title="Undo (Ctrl+Z)"
              >
                Undo
              </button>
              <button
                disabled={!canRedo}
                onClick={redo}
                style={{
                  ...toolbarBtnStyle,
                  opacity: canRedo ? 1 : 0.4,
                  cursor: canRedo ? "pointer" : "default",
                }}
                title="Redo (Ctrl+Y)"
              >
                Redo
              </button>
              <div style={{ width: 1, height: 16, backgroundColor: "#e5e7eb" }} />
              <button
                onClick={() => setFindReplaceVisible(!findReplaceVisible)}
                style={toolbarBtnStyle}
                title="Find & Replace (Ctrl+F)"
              >
                Find
              </button>
              <div style={{ width: 1, height: 16, backgroundColor: "#e5e7eb" }} />
              <button
                onClick={() => setShowStats(!showStats)}
                style={{
                  ...toolbarBtnStyle,
                  backgroundColor: showStats ? "#ede9fe" : "#f3f4f6",
                }}
              >
                Stats
              </button>
              <button
                onClick={() => setShowCharacters(!showCharacters)}
                style={{
                  ...toolbarBtnStyle,
                  backgroundColor: showCharacters ? "#ede9fe" : "#f3f4f6",
                }}
              >
                Characters
              </button>
            </div>

            {/* Find & Replace bar */}
            <FindReplace
              blocks={blocks}
              onBlocksChange={handleFindReplaceBlocksChange}
              onHighlightBlock={(id) => {
                setHighlightedBlockId(id);
                if (id) {
                  setSearchTerm(
                    (document.querySelector<HTMLInputElement>(
                      'input[placeholder="Find..."]'
                    )?.value) || ""
                  );
                } else {
                  setSearchTerm("");
                }
              }}
              visible={findReplaceVisible}
              onClose={() => {
                setFindReplaceVisible(false);
                setSearchTerm("");
                setHighlightedBlockId(null);
              }}
            />

            {/* Template selector when script is empty */}
            {isEmptyScript && (
              <TemplateSelector mode={mode} onSelect={handleTemplateSelect} />
            )}

            {/* Stats panel (collapsible) */}
            {showStats && <ScriptStats blocks={blocks} />}

            {/* Characters panel (collapsible) */}
            {showCharacters && (
              <CharacterTracker
                blocks={blocks}
                onBlockClick={(id) => {
                  setFocusedBlockId(id);
                }}
              />
            )}

            {/* Scene navigator with drag-reorder */}
            <SceneNavigator
              blocks={blocks}
              onSceneClick={handleSceneClick}
              focusedBlockId={focusedBlockId}
              onReorder={handleSceneReorder}
            />

            {/* Script editor */}
            <ScriptEditor
              blocks={blocks}
              onBlocksChange={setBlocks}
              focusedBlockId={focusedBlockId}
              onFocusedBlockChange={setFocusedBlockId}
              mode={mode}
              searchTerm={searchTerm}
              highlightedBlockId={highlightedBlockId}
            />
          </div>
        )}

        {activeTab === "generate" && (
          <SceneGenerator
            apiKey={undefined}
            existingBlocks={blocks}
            onInsert={handleInsertGeneratedBlocks}
            addToast={addToast}
            mode={mode}
          />
        )}

        {activeTab === "ai" && (
          <FeatureGate featureId="aiTools" tier={tier} onUpgrade={handleUpgrade}>
            <AIToolsPanel blocks={blocks} apiKey={undefined} addToast={addToast} />
          </FeatureGate>
        )}

        {activeTab === "storyboard" && (
          <FeatureGate featureId="storyboard" tier={tier} onUpgrade={handleUpgrade}>
            <StoryboardPanel
              blocks={blocks}
              apiKey={undefined}
              addToast={addToast}
            />
          </FeatureGate>
        )}

        {activeTab === "import" && (
          <DocumentImport
            apiKey={undefined}
            onImport={handleImportBlocks}
            addToast={addToast}
          />
        )}

        {activeTab === "insert" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <InsertToDesign blocks={blocks} />
            <div style={{ height: 1, backgroundColor: "#e5e7eb" }} />
            <FeatureGate featureId="export" tier={tier} onUpgrade={handleUpgrade}>
              <ExportPanel blocks={blocks} />
            </FeatureGate>
          </div>
        )}
      </div>

      {/* Toast notifications */}
      <Toast messages={toasts} onDismiss={dismissToast} />
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

const proBadgeStyle: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 800,
  color: "#fff",
  backgroundColor: "#7c3aed",
  padding: "2px 8px",
  borderRadius: 10,
  letterSpacing: 1,
};

const modeSelectorStyle: React.CSSProperties = {
  display: "flex",
  gap: 4,
  padding: "8px 16px",
  borderBottom: "1px solid #f3f4f6",
};

const modeButtonStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  padding: "4px 10px",
  borderRadius: 20,
  border: "none",
  cursor: "pointer",
  transition: "background-color 0.15s",
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

const toolbarBtnStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: "#374151",
  backgroundColor: "#f3f4f6",
  border: "1px solid #e5e7eb",
  borderRadius: 4,
  padding: "3px 8px",
  cursor: "pointer",
};
