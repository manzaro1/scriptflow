"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Download,
  X,
  Sparkles,
  FileDown,
  BrainCircuit,
  UserCircle2,
  Share2,
  Info,
  Edit2,
  Files,
  Loader2,
  Lock,
  Hash
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showLoading, dismissToast, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeInput } from "@/utils/security";
import CharacterProfileModal from "@/components/CharacterProfileModal";
import CharacterChat from "@/components/CharacterChat";
import ProductionOverseer from "@/components/ProductionOverseer";
import ShareScriptModal from "@/components/ShareScriptModal";
import StoryboardGenerator from "@/components/StoryboardGenerator";
import RenameScriptModal from "@/components/RenameScriptModal";
import DialogueFeedback from "@/components/DialogueFeedback";
import CollaboratorStack from "@/components/CollaboratorStack";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

type ElementType = 'action' | 'character' | 'dialogue' | 'slugline' | 'parenthetical';

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
  const [isRenameModalOpen, setIsRenameModal] = useState(false);

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
    switch (currentType) {
      case 'slugline':
      case 'action':
        return 'character';
      case 'character':
        return 'dialogue';
      case 'dialogue':
      case 'parenthetical':
        return 'action';
      default:
        return 'action';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (isReadOnly) return;
    const block = blocksRef.current[index];
    if (!block) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      // Flush content from DOM first
      syncBlockFromDOM(block.id);
      const types: ElementType[] = ['action', 'character', 'parenthetical', 'dialogue', 'slugline'];
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

    // Auto-detect type from content
    const trimmed = content.trim();
    const upperContent = content.toUpperCase();
    if (upperContent.startsWith('INT.') || upperContent.startsWith('EXT.')) {
      type = 'slugline';
    } else if (trimmed.length > 0 && trimmed.length < 25 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
      type = 'character';
    } else if (content.startsWith('(') && content.endsWith(')')) {
      type = 'parenthetical';
    } else if (blocksRef.current[index - 1]?.type === 'character' || blocksRef.current[index - 1]?.type === 'parenthetical') {
      type = 'dialogue';
    } else if (type !== 'slugline' && type !== 'character' && type !== 'parenthetical' && type !== 'dialogue') {
      type = 'action';
    }

    // Auto-uppercase for sluglines and character names
    if (type === 'slugline' || type === 'character') {
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
    const base = "outline-none transition-colors duration-150 min-h-[1.5em] rounded px-2 whitespace-pre-wrap font-screenplay text-[12pt] leading-[1] relative";
    const editClass = isReadOnly ? "" : "focus:bg-primary/5";
    const focusBorder = isFocused && !isReadOnly ? "border-l-2" : "border-l-2 border-transparent";

    switch (type) {
      case 'character':
        return cn(base, editClass, focusBorder, isFocused && "border-l-film-violet",
          "uppercase font-bold mb-1 mt-6",
          "pl-[3.7in] pr-[1in] w-full text-left");
      case 'dialogue':
        return cn(base, editClass, focusBorder, isFocused && "border-l-blue-500",
          "mb-4 relative group",
          "pl-[2.5in] pr-[2in] w-full text-left");
      case 'parenthetical':
        return cn(base, editClass, focusBorder, isFocused && "border-l-purple-400",
          "italic text-sm mb-1",
          "pl-[3.1in] pr-[2.3in] w-full text-left");
      case 'slugline':
        return cn(base, editClass, focusBorder, isFocused && "border-l-film-amber",
          "uppercase font-bold mb-4 mt-8");
      default:
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

  const sceneSlugs = blocks.filter(b => b.type === 'slugline');

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

          <div className="flex flex-col group cursor-pointer" onClick={() => !isReadOnly && setIsRenameModal(true)}>
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
            "py-[1in] font-screenplay text-[12pt] leading-[1]",
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
                    ref={el => { blockRefs.current[block.id] = el; }}
                    contentEditable={!isReadOnly}
                    suppressContentEditableWarning
                    className={getBlockStyles(block.type, focusedBlockId === block.id)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onBlur={() => handleBlur(index)}
                    onFocus={() => setFocusedBlockId(block.id)}
                    dangerouslySetInnerHTML={{ __html: block.content }}
                  />
                  {block.type === 'dialogue' && !isReadOnly && (
                    <div className="absolute -left-8 top-1/2 -translate-y-1/2">
                      <DialogueFeedback
                        characterName={getCharacterForDialogue(index)}
                        dialogue={block.content}
                        consistencyScore={95}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Overseer Panel */}
        <AnimatePresence>
          {showRightPanel === 'ai' && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="border-l bg-background flex flex-col shrink-0 overflow-hidden"
            >
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold text-sm">Production Intelligence</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowRightPanel(null)}>
                  <X size={16} />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <ProductionOverseer />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <RenameScriptModal
        isOpen={isRenameModalOpen}
        onOpenChange={setIsRenameModal}
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
