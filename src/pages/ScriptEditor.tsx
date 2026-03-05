"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  X,
  Sparkles,
  BrainCircuit,
  Share2,
  Edit2,
  Files,
  Loader2,
  Lock,
  Hash,
  Wand2,
  MessageSquare
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showLoading, dismissToast, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeInput } from "@/utils/security";
import CharacterChat from "@/components/CharacterChat";
import ProductionOverseer from "@/components/ProductionOverseer";
import ShareScriptModal from "@/components/ShareScriptModal";
import StoryboardGenerator from "@/components/StoryboardGenerator";
import RenameScriptModal from "@/components/RenameScriptModal";
import DialogueFeedback from "@/components/DialogueFeedback";
import CollaboratorStack from "@/components/CollaboratorStack";
import SceneGeneratorModal from "@/components/SceneGeneratorModal";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { hasGeminiKey, callAIFunction } from "@/utils/ai";

type ElementType = 'action' | 'character' | 'dialogue' | 'slugline' | 'parenthetical' | 'transition';

interface ScriptBlock {
  id: string;
  type: ElementType;
  content: string;
}

const ScriptEditor = () => {
  const [searchParams] = useSearchParams();
  const scriptId = searchParams.get('id');
  const { user: authUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState<'comments' | 'ai' | null>(null);
  const [aiTab, setAiTab] = useState<string>("overseer");
  const [activeCharChat, setActiveCharChat] = useState<string | null>(null);
  const [isStoryboardOpen, setIsStoryboardOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isSceneGenOpen, setIsSceneGenOpen] = useState(false);

  // AI Autocomplete state
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [suggestionBlockId, setSuggestionBlockId] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [scriptTitle, setScriptTitle] = useState("");
  const [scriptAuthor, setScriptAuthor] = useState("");
  const [blocks, setBlocks] = useState<ScriptBlock[]>([]);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  // Track which block needs auto-focus after a structural change (Enter/Backspace)
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);
  const blockRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  // Mutable ref that always holds the latest blocks without triggering re-renders
  const blocksRef = useRef<ScriptBlock[]>([]);

  // Keep blocksRef in sync whenever blocks state changes
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    const fetchScript = async () => {
      if (!scriptId || !authUser) return;

      const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .eq('id', scriptId)
        .single();

      if (error) {
        showError("Failed to load script or access denied.");
      } else if (data) {
        setScriptTitle(data.title);
        setScriptAuthor(data.author);

        if (data.user_id !== authUser.id) {
          const { data: collaborator } = await supabase
            .from('script_collaborators')
            .select('role')
            .eq('script_id', scriptId)
            .eq('user_id', authUser.id)
            .single();

          if (!collaborator || collaborator.role === 'viewer') {
            setIsReadOnly(true);
          }
        }

        const rawContent = Array.isArray(data.content) && data.content.length > 0
          ? data.content
          : [{ id: '1', type: 'slugline', content: 'EXT. NEW SCENE - DAY' }];

        const loadedContent = rawContent.map((block: ScriptBlock) => ({
          ...block,
          content: sanitizeInput(block.content)
        }));

        setBlocks(loadedContent);
      }
      setLoading(false);
    };

    fetchScript();
  }, [scriptId, authUser]);

  // Focus management: only runs when a structural change (Enter/Backspace) sets pendingFocusId
  useEffect(() => {
    if (pendingFocusId && blockRefs.current[pendingFocusId] && !isReadOnly) {
      const element = blockRefs.current[pendingFocusId];
      element?.focus();

      const range = document.createRange();
      const sel = window.getSelection();
      if (element && element.childNodes.length) {
        range.setStart(element.childNodes[0], element.innerText.length);
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);
      } else if (element) {
        range.setStart(element, 0);
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      setPendingFocusId(null);
    }
  }, [pendingFocusId, blocks, isReadOnly]);

  const handleSave = async () => {
    if (!scriptId || isReadOnly) return;
    setSaving(true);
    const toastId = showLoading("Saving changes...");

    // Flush latest DOM content into blocksRef before saving
    flushAllBlockContent();

    const sanitizedBlocks = blocksRef.current.map(block => ({
      ...block,
      content: sanitizeInput(block.content)
    }));

    const { error } = await supabase
      .from('scripts')
      .update({
        content: sanitizedBlocks,
        title: sanitizeInput(scriptTitle),
        author: sanitizeInput(scriptAuthor),
        updated_at: new Date().toISOString()
      })
      .eq('id', scriptId);

    dismissToast(toastId);
    setSaving(false);
    setHasUnsaved(false);

    if (error) {
      showError("Save failed");
    } else {
      showSuccess("Script saved securely");
    }
  };

  const markUnsaved = () => setHasUnsaved(true);

  /** Read the current DOM text from all block refs and sync into blocksRef */
  const flushAllBlockContent = () => {
    const updated = blocksRef.current.map(block => {
      const el = blockRefs.current[block.id];
      if (el) {
        return { ...block, content: el.innerText };
      }
      return block;
    });
    blocksRef.current = updated;
    setBlocks(updated);
  };

  /** Read a single block's DOM text and update blocksRef (no React state update) */
  const syncBlockFromDOM = (blockId: string) => {
    const el = blockRefs.current[blockId];
    if (!el) return;
    const content = el.innerText;
    blocksRef.current = blocksRef.current.map(b =>
      b.id === blockId ? { ...b, content } : b
    );
  };

  const getNextBlockType = (currentType: ElementType): ElementType => {
    // Enter always creates a new action block — user can change type with Tab
    return 'action';
  };

  /** AI Autocomplete: fetch a suggestion from Gemini */
  const triggerAutocomplete = useCallback(async () => {
    if (isReadOnly || !focusedBlockId || !hasGeminiKey()) return;

    // Sync current block from DOM first
    syncBlockFromDOM(focusedBlockId);
    const currentIndex = blocksRef.current.findIndex(b => b.id === focusedBlockId);
    if (currentIndex === -1) return;

    setAiLoading(true);
    setSuggestionBlockId(focusedBlockId);
    setAiSuggestion(null);

    const { data, error } = await callAIFunction('ai-autocomplete', {
      blocks: blocksRef.current,
      currentBlockIndex: currentIndex,
    });

    setAiLoading(false);

    if (error === 'NO_API_KEY') {
      showError("Set up your Gemini API key in Settings > AI");
      setSuggestionBlockId(null);
      return;
    }
    if (error || !data?.suggestion) {
      showError(error || "Autocomplete failed");
      setSuggestionBlockId(null);
      return;
    }

    setAiSuggestion(data.suggestion);
  }, [focusedBlockId, isReadOnly]);

  /** Accept the AI suggestion into the current block */
  const acceptSuggestion = useCallback(() => {
    if (!aiSuggestion || !suggestionBlockId) return;

    const el = blockRefs.current[suggestionBlockId];
    if (el) {
      const current = el.innerText;
      const separator = current.trim().length > 0 ? ' ' : '';
      el.innerText = current + separator + aiSuggestion;
      syncBlockFromDOM(suggestionBlockId);
      markUnsaved();
    }

    setAiSuggestion(null);
    setSuggestionBlockId(null);
  }, [aiSuggestion, suggestionBlockId]);

  const dismissSuggestion = useCallback(() => {
    setAiSuggestion(null);
    setSuggestionBlockId(null);
    setAiLoading(false);
  }, []);

  /** Insert generated scene blocks at the current cursor position */
  const insertGeneratedBlocks = useCallback((newBlocks: ScriptBlock[]) => {
    const currentIndex = focusedBlockId
      ? blocksRef.current.findIndex(b => b.id === focusedBlockId)
      : blocksRef.current.length - 1;

    const insertAt = currentIndex + 1;
    const updated = [
      ...blocksRef.current.slice(0, insertAt),
      ...newBlocks,
      ...blocksRef.current.slice(insertAt),
    ];
    blocksRef.current = updated;
    setBlocks(updated);
    markUnsaved();

    if (newBlocks.length > 0) {
      setPendingFocusId(newBlocks[0].id);
    }
  }, [focusedBlockId]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (isReadOnly) return;
    const block = blocksRef.current[index];
    if (!block) return;

    // Ctrl+J / Cmd+J: trigger AI autocomplete
    if (e.key === 'j' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      triggerAutocomplete();
      return;
    }

    // Escape: dismiss AI suggestion
    if (e.key === 'Escape' && (aiSuggestion || aiLoading)) {
      e.preventDefault();
      dismissSuggestion();
      return;
    }

    if (e.key === 'Tab') {
      // If AI suggestion is showing, Tab accepts it
      if (aiSuggestion && suggestionBlockId === block.id) {
        e.preventDefault();
        acceptSuggestion();
        return;
      }

      e.preventDefault();
      // Flush content from DOM first
      syncBlockFromDOM(block.id);
      const types: ElementType[] = ['action', 'character', 'parenthetical', 'dialogue', 'slugline', 'transition'];
      const currentIndex = types.indexOf(block.type);
      const nextType = types[(currentIndex + 1) % types.length];

      const updated = blocksRef.current.map((b, i) =>
        i === index ? { ...b, type: nextType } : b
      );
      blocksRef.current = updated;
      setBlocks(updated);
      markUnsaved();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      // Flush current block content from DOM
      syncBlockFromDOM(block.id);
      const nextType = getNextBlockType(block.type);
      const newId = Math.random().toString(36).substr(2, 9);
      const newBlocks = [...blocksRef.current];
      newBlocks.splice(index + 1, 0, { id: newId, type: nextType, content: '' });
      blocksRef.current = newBlocks;
      setBlocks(newBlocks);
      setPendingFocusId(newId);
      markUnsaved();
      return;
    }

    if (e.key === 'Backspace') {
      const el = blockRefs.current[block.id];
      const content = el?.innerText || '';
      if (content === '' && blocksRef.current.length > 1) {
        e.preventDefault();
        const focusTargetId = blocksRef.current[index - 1]?.id || blocksRef.current[index + 1]?.id;
        delete blockRefs.current[block.id];
        const newBlocks = blocksRef.current.filter((_, i) => i !== index);
        blocksRef.current = newBlocks;
        setBlocks(newBlocks);
        if (focusTargetId) setPendingFocusId(focusTargetId);
        markUnsaved();
        return;
      }
    }
  };

  /** onBlur: sync content from DOM to state, detect type from content */
  const handleBlur = (index: number) => {
    if (isReadOnly) return;
    const block = blocksRef.current[index];
    if (!block) return;

    const el = blockRefs.current[block.id];
    if (!el) return;

    let content = el.innerText;
    let type = block.type;

    // Auto-detect sluglines from INT./EXT. prefix and transitions from common patterns
    const upperContent = content.toUpperCase().trim();
    if (upperContent.startsWith('INT.') || upperContent.startsWith('EXT.')) {
      type = 'slugline';
    } else if (
      upperContent === 'CUT TO:' ||
      upperContent === 'FADE OUT.' ||
      upperContent === 'FADE IN:' ||
      upperContent === 'SMASH CUT TO:' ||
      upperContent === 'MATCH CUT TO:' ||
      upperContent === 'DISSOLVE TO:' ||
      upperContent.endsWith('CUT TO:')
    ) {
      type = 'transition';
    }

    // Auto-uppercase for sluglines, character names, and transitions
    if (type === 'slugline' || type === 'character' || type === 'transition') {
      content = content.toUpperCase();
      el.innerText = content;
    }

    const updated = blocksRef.current.map((b, i) =>
      i === index ? { ...b, content, type } : b
    );
    blocksRef.current = updated;
    setBlocks(updated);
    markUnsaved();
  };

  const getBlockStyles = (type: ElementType, isFocused: boolean) => {
    const base = "outline-none transition-colors duration-150 min-h-[1.5em] rounded whitespace-pre-wrap font-screenplay text-[12pt] leading-normal relative";
    const editClass = isReadOnly ? "" : "focus:bg-primary/5";
    const focusBorder = isFocused && !isReadOnly ? "border-l-2" : "border-l-2 border-transparent";

    // Industry-standard screenplay format (relative to the 6in text area inside 1.5in + 1in margins):
    // Character name: centered, ~3.7in from page left = ~2.2in from text left, narrow block
    // Dialogue: ~1in from text left, ~3.5in wide
    // Parenthetical: ~1.5in from text left, ~2.5in wide
    // Slugline: full width, left-aligned, ALL CAPS
    // Action: full width, left-aligned
    // Transition: right-aligned, ALL CAPS
    switch (type) {
      case 'character':
        return cn(base, editClass, focusBorder, isFocused && "border-l-film-violet",
          "uppercase font-bold mb-0 mt-6",
          "ml-[2.2in] mr-[1.4in] text-left");
      case 'dialogue':
        return cn(base, editClass, focusBorder, isFocused && "border-l-blue-500",
          "mb-4 relative group",
          "ml-[1in] mr-[1.5in] text-left");
      case 'parenthetical':
        return cn(base, editClass, focusBorder, isFocused && "border-l-purple-400",
          "italic mb-0",
          "ml-[1.6in] mr-[2in] text-left");
      case 'slugline':
        return cn(base, editClass, focusBorder, isFocused && "border-l-film-amber",
          "uppercase font-bold mb-4 mt-8 text-left");
      case 'transition':
        return cn(base, editClass, focusBorder, isFocused && "border-l-amber-500",
          "uppercase font-bold mb-4 mt-4 text-right");
      default: // action
        return cn(base, editClass, focusBorder, isFocused && "border-l-muted-foreground/30",
          "mb-4 text-left");
    }
  };

  const getBlockTypeLabel = (type: ElementType) => {
    const labels: Record<ElementType, { label: string; color: string }> = {
      slugline: { label: 'SCENE', color: 'text-amber-600 bg-amber-500/10' },
      character: { label: 'CHAR', color: 'text-purple-600 bg-purple-500/10' },
      dialogue: { label: 'DIAL', color: 'text-blue-600 bg-blue-500/10' },
      parenthetical: { label: 'PAREN', color: 'text-purple-400 bg-purple-400/10' },
      action: { label: 'ACTION', color: 'text-muted-foreground bg-muted' },
      transition: { label: 'TRANS', color: 'text-amber-500 bg-amber-500/10' },
    };
    return labels[type];
  };

  const getCharacterForDialogue = (index: number): string => {
    const currentBlocks = blocksRef.current;
    for (let i = index - 1; i >= 0; i--) {
      if (currentBlocks[i].type === 'character') return currentBlocks[i].content;
      if (currentBlocks[i].type === 'slugline' || currentBlocks[i].type === 'action') break;
    }
    return 'UNKNOWN';
  };

  const sceneSlugs = useMemo(() => blocks.filter(b => b.type === 'slugline'), [blocks]);
  const uniqueCharacters = useMemo(() => [...new Set(blocks.filter(b => b.type === 'character').map(b => b.content))], [blocks]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary" size={32} />
          <span className="text-sm text-muted-foreground">Loading script...</span>
        </div>
      </div>
    );
  }

  const pageCount = Math.max(1, Math.ceil(blocks.length / 15));

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Toolbar */}
      <header className="h-14 border-b bg-background flex items-center px-4 justify-between shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft size={20} />
          </Button>

          <div className="h-5 w-px bg-border" />

          <div className="flex flex-col group cursor-pointer" onClick={() => !isReadOnly && setIsRenameModalOpen(true)}>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold">{scriptTitle || "Untitled"}</span>
              {!isReadOnly && <Edit2 size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
              {isReadOnly && <Lock size={12} className="text-muted-foreground" />}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{isReadOnly ? 'Read Only' : 'Draft'}</span>
              {focusedBlockId && !isReadOnly && (
                <Badge variant="outline" className={`text-[9px] font-bold uppercase py-0 px-1.5 h-4 ${getBlockTypeLabel(blocks.find(b => b.id === focusedBlockId)?.type || 'action').color}`}>
                  {getBlockTypeLabel(blocks.find(b => b.id === focusedBlockId)?.type || 'action').label}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <CollaboratorStack />

          <div className="hidden lg:flex items-center gap-1.5 px-3 h-8 bg-muted rounded-md border mr-1">
            <Files size={14} className="text-muted-foreground" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{pageCount} {pageCount === 1 ? 'Page' : 'Pages'}</span>
          </div>

          <div className="h-5 w-px bg-border hidden lg:block" />

          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-8 bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:from-purple-500/20 hover:to-fuchsia-500/20"
            onClick={() => setIsStoryboardOpen(true)}
          >
            <Sparkles size={16} />
            <span className="hidden sm:inline">AI Storyboard</span>
          </Button>

          {!isReadOnly && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-8 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:from-blue-500/20 hover:to-cyan-500/20"
              onClick={() => setIsSceneGenOpen(true)}
            >
              <Wand2 size={16} />
              <span className="hidden sm:inline">Generate Scene</span>
            </Button>
          )}

          <Button
            variant={showRightPanel === 'ai' ? 'secondary' : 'ghost'}
            size="sm"
            className="gap-2 h-8"
            onClick={() => setShowRightPanel(showRightPanel === 'ai' ? null : 'ai')}
          >
            <BrainCircuit size={16} />
            <span className="hidden sm:inline">Overseer</span>
          </Button>

          <div className="h-5 w-px bg-border hidden sm:block" />

          <ShareScriptModal scriptId={scriptId || ''}>
            <Button variant="outline" size="sm" className="gap-2 h-8">
              <Share2 size={16} />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </ShareScriptModal>

          {!isReadOnly && (
            <Button
              size="sm"
              className={cn(
                "gap-2 h-8 font-semibold",
                hasUnsaved
                  ? "bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/20"
                  : ""
              )}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span className="hidden sm:inline">{hasUnsaved ? 'Save*' : 'Save'}</span>
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <StoryboardGenerator
          isOpen={isStoryboardOpen}
          onOpenChange={setIsStoryboardOpen}
          scriptBlocks={blocks}
          scriptTitle={scriptTitle}
          scriptId={scriptId}
        />

        {/* Scene Navigator */}
        <aside className="w-64 border-r bg-background hidden lg:flex flex-col shrink-0">
          <div className="p-4 border-b">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Hash size={12} />
              Scene Navigator
            </h3>
            <div className="space-y-0.5">
              {sceneSlugs.map((b, i) => {
                const sceneCharCount = (() => {
                  const blockIndex = blocks.indexOf(b);
                  const chars = new Set<string>();
                  for (let j = blockIndex + 1; j < blocks.length; j++) {
                    if (blocks[j].type === 'slugline') break;
                    if (blocks[j].type === 'character') chars.add(blocks[j].content);
                  }
                  return chars.size;
                })();

                return (
                  <button
                    key={b.id}
                    className={cn(
                      "text-xs p-2.5 rounded-lg cursor-pointer w-full text-left transition-all duration-200 flex items-center gap-2",
                      focusedBlockId === b.id
                        ? "bg-primary/10 text-primary font-semibold"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => {
                      setFocusedBlockId(b.id);
                      blockRefs.current[b.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                  >
                    <span className="font-mono text-[10px] font-bold text-muted-foreground w-5 shrink-0">{i + 1}</span>
                    <span className="truncate flex-1">{b.content || `Scene ${i + 1}`}</span>
                    {sceneCharCount > 0 && (
                      <span className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0">{sceneCharCount}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Screenplay Page */}
        <main className="flex-1 overflow-y-auto p-8 md:p-12 flex justify-center bg-muted/30">
          <div className={cn(
            "w-[8.5in] min-h-[11in] bg-white text-black shadow-xl relative",
            "py-[1in] font-screenplay text-[12pt] leading-normal",
            isReadOnly ? "cursor-default" : "cursor-text"
          )}
          style={{ paddingLeft: '1.5in', paddingRight: '1in' }}
          >
            {/* Page number */}
            <div className="absolute top-6 right-[1in] text-[10pt] text-gray-400 font-screenplay">1.</div>

            {/* Title block */}
            <div className="text-center mb-12 uppercase">
              <h1
                className={cn("text-2xl font-bold rounded px-2 outline-none", !isReadOnly && "focus:bg-violet-50")}
                contentEditable={!isReadOnly}
                suppressContentEditableWarning
                dir="ltr"
                style={{ direction: 'ltr', unicodeBidi: 'embed' }}
                onBlur={(e) => {
                  if (!isReadOnly) {
                    setScriptTitle(sanitizeInput(e.currentTarget.innerText));
                    markUnsaved();
                  }
                }}
              >
                {scriptTitle.toUpperCase()}
              </h1>
              <p className="mt-2 text-sm">Written by</p>
              <p
                className={cn("mt-1 rounded px-2 min-w-[100px] inline-block outline-none", !isReadOnly && "focus:bg-violet-50")}
                contentEditable={!isReadOnly}
                suppressContentEditableWarning
                dir="ltr"
                style={{ direction: 'ltr', unicodeBidi: 'embed' }}
                onBlur={(e) => {
                  if (!isReadOnly) {
                    setScriptAuthor(sanitizeInput(e.currentTarget.innerText));
                    markUnsaved();
                  }
                }}
              >
                {scriptAuthor}
              </p>
            </div>

            {/* Script blocks */}
            <div className="space-y-0">
              {blocks.map((block, index) => (
                <div key={block.id} className="relative">
                  {/* Subtle type label on focus */}
                  {focusedBlockId === block.id && !isReadOnly && (
                    <div className="absolute -left-[1.3in] top-0 text-[8px] font-bold uppercase tracking-wider text-muted-foreground/40 select-none">
                      {block.type}
                    </div>
                  )}
                  <div
                    ref={el => {
                      blockRefs.current[block.id] = el;
                      // Set initial content only once when the element is first mounted
                      if (el && el.dataset.initialized !== 'true') {
                        el.innerText = block.content;
                        el.dataset.initialized = 'true';
                      }
                    }}
                    contentEditable={!isReadOnly}
                    suppressContentEditableWarning
                    dir="ltr"
                    className={getBlockStyles(block.type, focusedBlockId === block.id)}
                    style={{ direction: 'ltr', unicodeBidi: 'embed', textAlign: block.type === 'transition' ? 'right' : 'left' }}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onBlur={() => handleBlur(index)}
                    onFocus={() => setFocusedBlockId(block.id)}
                  />
                  {block.type === 'dialogue' && !isReadOnly && (
                    <div className="absolute -left-8 top-1/2 -translate-y-1/2">
                      <DialogueFeedback
                        characterName={getCharacterForDialogue(index)}
                        dialogue={block.content}
                        scriptBlocks={blocks}
                        blockIndex={index}
                        onApplySuggestion={(text) => {
                          const el = blockRefs.current[block.id];
                          if (el) {
                            el.innerText = text;
                            syncBlockFromDOM(block.id);
                            setBlocks([...blocksRef.current]);
                            markUnsaved();
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* AI Autocomplete ghost text */}
                  {suggestionBlockId === block.id && (aiLoading || aiSuggestion) && (
                    <div className="pl-2 mt-0.5 select-none pointer-events-none">
                      {aiLoading && !aiSuggestion && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                          <Loader2 size={12} className="animate-spin" />
                          <span className="italic">Thinking...</span>
                        </div>
                      )}
                      {aiSuggestion && (
                        <div className="text-[12pt] font-screenplay text-muted-foreground/40 italic leading-normal">
                          {aiSuggestion}
                          <span className="ml-2 text-[9px] font-sans not-italic text-muted-foreground/50 bg-muted px-1.5 py-0.5 rounded">
                            Tab to accept · Esc to dismiss
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* AI Right Panel */}
        <AnimatePresence>
          {showRightPanel === 'ai' && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="border-l bg-background flex flex-col shrink-0 overflow-hidden"
            >
              <div className="p-3 border-b flex items-center justify-between">
                <Tabs value={aiTab} onValueChange={setAiTab} className="w-full">
                  <div className="flex items-center justify-between">
                    <TabsList className="h-8">
                      <TabsTrigger value="overseer" className="text-[10px] uppercase font-bold px-3 h-7">
                        <BrainCircuit size={12} className="mr-1.5" />
                        Overseer
                      </TabsTrigger>
                      <TabsTrigger value="chat" className="text-[10px] uppercase font-bold px-3 h-7">
                        <MessageSquare size={12} className="mr-1.5" />
                        Character
                      </TabsTrigger>
                    </TabsList>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowRightPanel(null)}>
                      <X size={14} />
                    </Button>
                  </div>
                </Tabs>
              </div>
              <div className="flex-1 overflow-y-auto">
                {aiTab === 'overseer' && (
                  <div className="p-4">
                    <ProductionOverseer blocks={blocks} />
                  </div>
                )}
                {aiTab === 'chat' && (
                  <div className="h-full">
                    {(() => {
                      if (uniqueCharacters.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                            <p className="text-sm text-muted-foreground">No characters in script yet. Add character blocks to chat with them.</p>
                          </div>
                        );
                      }
                      if (!activeCharChat) {
                        return (
                          <div className="p-4 space-y-2">
                            <p className="text-xs font-bold uppercase text-muted-foreground mb-3">Select a character to chat with:</p>
                            {uniqueCharacters.map(name => (
                              <button
                                key={name}
                                className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors flex items-center gap-2"
                                onClick={() => setActiveCharChat(name)}
                              >
                                <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xs font-bold text-purple-700 dark:text-purple-400">
                                  {name.substring(0, 2)}
                                </div>
                                <span className="text-sm font-semibold">{name}</span>
                              </button>
                            ))}
                          </div>
                        );
                      }
                      return (
                        <CharacterChat
                          characterName={activeCharChat}
                          scriptBlocks={blocks}
                          onBack={() => setActiveCharChat(null)}
                        />
                      );
                    })()}
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <SceneGeneratorModal
        isOpen={isSceneGenOpen}
        onOpenChange={setIsSceneGenOpen}
        existingCharacters={uniqueCharacters}
        onInsert={insertGeneratedBlocks}
      />

      <RenameScriptModal
        isOpen={isRenameModalOpen}
        onOpenChange={setIsRenameModalOpen}
        currentTitle={scriptTitle}
        onRename={(title) => {
          setScriptTitle(sanitizeInput(title));
          markUnsaved();
        }}
      />
    </div>
  );
};

export default ScriptEditor;
