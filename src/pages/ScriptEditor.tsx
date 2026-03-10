"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { showSuccess, showLoading, dismissToast, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeInput } from "@/utils/security";
import RenameScriptModal from "@/components/RenameScriptModal";
import StoryboardGenerator from "@/components/StoryboardGenerator";
import SceneGeneratorModal from "@/components/SceneGeneratorModal";
import EditorToolbar from "@/components/editor/EditorToolbar";
import SceneNavigator from "@/components/editor/SceneNavigator";
import AIPanel from "@/components/editor/AIPanel";
import ScriptBlockItem from "@/components/editor/ScriptBlockItem";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
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
  const [showRightPanel, setShowRightPanel] = useState<'ai' | null>(null);
  const [aiTab, setAiTab] = useState<string>("overseer");
  const [activeCharChat, setActiveCharChat] = useState<string | null>(null);
  const [isStoryboardOpen, setIsStoryboardOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isSceneGenOpen, setIsSceneGenOpen] = useState(false);

  // AI state
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [suggestionBlockId, setSuggestionBlockId] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [scriptTitle, setScriptTitle] = useState("");
  const [scriptAuthor, setScriptAuthor] = useState("");
  const [blocks, setBlocks] = useState<ScriptBlock[]>([]);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);
  const blockRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const blocksRef = useRef<ScriptBlock[]>([]);

  useEffect(() => { blocksRef.current = blocks; }, [blocks]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowRightPanel(prev => prev === 'ai' ? null : 'ai');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const fetchScript = async () => {
      if (!scriptId || !authUser) return;
      const { data, error } = await supabase.from('scripts').select('*').eq('id', scriptId).single();
      if (error) { showError("Failed to load script."); } 
      else if (data) {
        setScriptTitle(data.title);
        setScriptAuthor(data.author);
        if (data.user_id !== authUser.id) {
          const { data: collab } = await supabase.from('script_collaborators').select('role').eq('script_id', scriptId).eq('user_id', authUser.id).single();
          if (!collab || collab.role === 'viewer') setIsReadOnly(true);
        }
        const rawContent = Array.isArray(data.content) && data.content.length > 0 ? data.content : [{ id: '1', type: 'slugline', content: 'EXT. NEW SCENE - DAY' }];
        setBlocks(rawContent.map((b: any) => ({ ...b, content: sanitizeInput(b.content) })));
      }
      setLoading(false);
    };
    fetchScript();
  }, [scriptId, authUser]);

  useEffect(() => {
    if (pendingFocusId && blockRefs.current[pendingFocusId] && !isReadOnly) {
      const el = blockRefs.current[pendingFocusId];
      el?.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      if (el && el.childNodes.length) { range.setStart(el.childNodes[0], el.innerText.length); range.collapse(true); sel?.removeAllRanges(); sel?.addRange(range); }
      setPendingFocusId(null);
    }
  }, [pendingFocusId, blocks, isReadOnly]);

  const handleSave = async () => {
    if (!scriptId || isReadOnly) return;
    setSaving(true);
    const toastId = showLoading("Saving...");
    const updated = blocksRef.current.map(b => ({ ...b, content: blockRefs.current[b.id]?.innerText || b.content }));
    const { error } = await supabase.from('scripts').update({ content: updated, title: sanitizeInput(scriptTitle), author: sanitizeInput(scriptAuthor), updated_at: new Date().toISOString() }).eq('id', scriptId);
    dismissToast(toastId);
    setSaving(false);
    if (!error) { setHasUnsaved(false); showSuccess("Saved"); }
  };

  const syncBlockFromDOM = (id: string) => {
    const el = blockRefs.current[id];
    if (el) blocksRef.current = blocksRef.current.map(b => b.id === id ? { ...b, content: el.innerText } : b);
  };

  const triggerAutocomplete = useCallback(async () => {
    if (isReadOnly || !focusedBlockId) return;
    syncBlockFromDOM(focusedBlockId);
    const idx = blocksRef.current.findIndex(b => b.id === focusedBlockId);
    setAiLoading(true); setSuggestionBlockId(focusedBlockId);
    const { data, error } = await callAIFunction('ai-autocomplete', { blocks: blocksRef.current, currentBlockIndex: idx });
    setAiLoading(false);
    if (data?.suggestion) setAiSuggestion(data.suggestion);
  }, [focusedBlockId, isReadOnly]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (isReadOnly) return;
    const block = blocksRef.current[index];
    if (e.key === 'j' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); triggerAutocomplete(); return; }
    if (e.key === 'Tab') {
      e.preventDefault();
      if (aiSuggestion) {
        const el = blockRefs.current[block.id];
        if (el) { el.innerText += (el.innerText.trim() ? ' ' : '') + aiSuggestion; setAiSuggestion(null); }
        return;
      }
      const types: ElementType[] = ['action', 'character', 'parenthetical', 'dialogue', 'slugline', 'transition'];
      const nextType = types[(types.indexOf(block.type) + 1) % types.length];
      const updated = blocksRef.current.map((b, i) => i === index ? { ...b, type: nextType } : b);
      setBlocks(updated); setHasUnsaved(true); return;
    }
    if (e.key === 'Enter') {
      e.preventDefault(); syncBlockFromDOM(block.id);
      const newId = Math.random().toString(36).substr(2, 9);
      const newBlocks = [...blocksRef.current];
      newBlocks.splice(index + 1, 0, { id: newId, type: 'action', content: '' });
      setBlocks(newBlocks); setPendingFocusId(newId); setHasUnsaved(true); return;
    }
    if (e.key === 'Backspace' && !blockRefs.current[block.id]?.innerText && blocksRef.current.length > 1) {
      e.preventDefault(); const tid = blocksRef.current[index - 1]?.id || blocksRef.current[index + 1]?.id;
      setBlocks(blocksRef.current.filter((_, i) => i !== index)); if (tid) setPendingFocusId(tid); setHasUnsaved(true);
    }
  };

  const handleBlur = (index: number) => {
    if (isReadOnly) return;
    const block = blocksRef.current[index];
    const el = blockRefs.current[block.id];
    if (!el) return;
    let content = el.innerText; let type = block.type;
    const upper = content.toUpperCase().trim();
    if (upper.startsWith('INT.') || upper.startsWith('EXT.')) type = 'slugline';
    else if (upper.match(/^(CUT TO:|FADE (IN|OUT).|SMASH CUT TO:)$/)) type = 'transition';
    if (['slugline', 'character', 'transition'].includes(type)) { content = content.toUpperCase(); el.innerText = content; }
    setBlocks(blocksRef.current.map((b, i) => i === index ? { ...b, content, type } : b));
    setHasUnsaved(true);
  };

  const pageCount = Math.max(1, Math.ceil(blocks.length / 15));
  const sceneSlugs = useMemo(() => blocks.filter(b => b.type === 'slugline'), [blocks]);
  const uniqueCharacters = useMemo(() => [...new Set(blocks.filter(b => b.type === 'character').map(b => b.content))], [blocks]);

  // Auto-save with debounce
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hasUnsaved || !scriptId || isReadOnly) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      const updated = blocksRef.current.map(b => ({ ...b, content: blockRefs.current[b.id]?.innerText || b.content }));
      const { error } = await supabase.from('scripts').update({ content: updated, title: sanitizeInput(scriptTitle), author: sanitizeInput(scriptAuthor), updated_at: new Date().toISOString() }).eq('id', scriptId);
      if (!error) setHasUnsaved(false);
    }, 3000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [hasUnsaved, scriptId, isReadOnly, scriptTitle, scriptAuthor]);

  if (!scriptId) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold">No script selected</p>
          <p className="text-sm text-muted-foreground">Open a script from your dashboard to start editing.</p>
          <a href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">Go to Dashboard</a>
        </div>
      </div>
    );
  }

  if (loading) return <div className="h-screen w-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <EditorToolbar 
        scriptId={scriptId} scriptTitle={scriptTitle} scriptAuthor={scriptAuthor} isReadOnly={isReadOnly}
        pageCount={pageCount} hasUnsaved={hasUnsaved} saving={saving} user={authUser}
        focusedBlockType={blocks.find(b => b.id === focusedBlockId)?.type}
        onSave={handleSave} onRenameClick={() => setIsRenameModalOpen(true)}
        onStoryboardClick={() => setIsStoryboardOpen(true)} onGenerateSceneClick={() => setIsSceneGenOpen(true)}
        onOverseerClick={() => setShowRightPanel(showRightPanel === 'ai' ? null : 'ai')} showOverseer={showRightPanel === 'ai'}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <SceneNavigator blocks={blocks} sceneSlugs={sceneSlugs} focusedBlockId={focusedBlockId} onSceneClick={(id) => { setFocusedBlockId(id); blockRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} />

        <main className="flex-1 overflow-y-auto p-8 md:p-12 flex justify-center bg-muted/30">
          <div className="w-[8.5in] min-h-[11in] bg-white text-black shadow-xl py-[1in] font-screenplay text-[12pt] screenplay-page" style={{ paddingLeft: '1.5in', paddingRight: '1in' }}>
            <div className="absolute top-6 right-[1in] text-[10pt] text-gray-400">1.</div>
            <div className="text-center mb-12 uppercase">
              <h1 className={cn("text-2xl font-bold rounded px-2 outline-none", !isReadOnly && "focus:bg-violet-50")} contentEditable={!isReadOnly} suppressContentEditableWarning onBlur={(e) => { if (!isReadOnly) { setScriptTitle(sanitizeInput(e.currentTarget.innerText)); setHasUnsaved(true); } }}>{scriptTitle.toUpperCase()}</h1>
              <p className="mt-2 text-sm">Written by</p>
              <p className={cn("mt-1 rounded px-2 min-w-[100px] inline-block outline-none", !isReadOnly && "focus:bg-violet-50")} contentEditable={!isReadOnly} suppressContentEditableWarning onBlur={(e) => { if (!isReadOnly) { setScriptAuthor(sanitizeInput(e.currentTarget.innerText)); setHasUnsaved(true); } }}>{scriptAuthor}</p>
            </div>
            {blocks.map((block, i) => (
              <ScriptBlockItem
                key={block.id} block={block} index={i} isReadOnly={isReadOnly} isFocused={focusedBlockId === block.id}
                blockRef={el => { blockRefs.current[block.id] = el; if (el && el.dataset.initialized !== 'true') { el.innerText = block.content; el.dataset.initialized = 'true'; } }}
                onKeyDown={(e) => handleKeyDown(e, i)} onInput={() => setHasUnsaved(true)} onBlur={() => handleBlur(i)} onFocus={() => { setFocusedBlockId(block.id); setAiSuggestion(null); }}
                getCharacterName={() => { for (let j = i-1; j>=0; j--) { if (blocks[j].type === 'character') return blocks[j].content; if (['slugline', 'action'].includes(blocks[j].type)) break; } return 'UNKNOWN'; }}
                onApplySuggestion={(t) => { const el = blockRefs.current[block.id]; if (el) { el.innerText = t; syncBlockFromDOM(block.id); setBlocks([...blocksRef.current]); setHasUnsaved(true); } }}
                aiLoading={aiLoading} aiSuggestion={aiSuggestion} isSuggestionTarget={suggestionBlockId === block.id} scriptBlocks={blocks}
              />
            ))}
          </div>
        </main>

        <AnimatePresence>
          <AIPanel isOpen={showRightPanel === 'ai'} onClose={() => setShowRightPanel(null)} aiTab={aiTab} setAiTab={setAiTab} uniqueCharacters={uniqueCharacters} activeCharChat={activeCharChat} setActiveCharChat={setActiveCharChat} blocks={blocks} />
        </AnimatePresence>
      </div>

      <SceneGeneratorModal isOpen={isSceneGenOpen} onOpenChange={setIsSceneGenOpen} existingCharacters={uniqueCharacters} onInsert={(nb) => { const idx = blocks.findIndex(b => b.id === focusedBlockId); const ins = idx === -1 ? blocks.length : idx + 1; const upd = [...blocks.slice(0, ins), ...nb, ...blocks.slice(ins)]; setBlocks(upd); setHasUnsaved(true); if (nb.length) setPendingFocusId(nb[0].id); }} />
      <StoryboardGenerator isOpen={isStoryboardOpen} onOpenChange={setIsStoryboardOpen} scriptBlocks={blocks} scriptTitle={scriptTitle} scriptId={scriptId} />
      <RenameScriptModal isOpen={isRenameModalOpen} onOpenChange={setIsRenameModalOpen} currentTitle={scriptTitle} onRename={(t) => { setScriptTitle(sanitizeInput(t)); setHasUnsaved(true); }} />
    </div>
  );
};

export default ScriptEditor;