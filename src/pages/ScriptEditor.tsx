"use client";

import React, { useState, useRef, useEffect } from 'react';
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
  Loader2
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

type ElementType = 'action' | 'character' | 'dialogue' | 'slugline' | 'parenthetical';

interface ScriptBlock {
  id: string;
  type: ElementType;
  content: string;
}

const ScriptEditor = () => {
  const [searchParams] = useSearchParams();
  const scriptId = searchParams.get('id');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState<'comments' | 'ai' | null>(null);
  const [aiTab, setAiTab] = useState<string>("overseer");
  const [activeCharChat, setActiveCharChat] = useState<string | null>(null);
  const [isStoryboardOpen, setIsStoryboardOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModal] = useState(false);
  
  const [scriptTitle, setScriptTitle] = useState("");
  const [scriptAuthor, setScriptAuthor] = useState("");
  const [blocks, setBlocks] = useState<ScriptBlock[]>([]);
  
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const blockRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const fetchScript = async () => {
      if (!scriptId) return;
      
      const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .eq('id', scriptId)
        .single();
      
      if (error) {
        showError("Failed to load script");
      } else if (data) {
        setScriptTitle(data.title);
        setScriptAuthor(data.author);
        
        const loadedContent = Array.isArray(data.content) && data.content.length > 0 
          ? data.content 
          : [{ id: '1', type: 'slugline', content: 'EXT. NEW SCENE - DAY' }];
        
        setBlocks(loadedContent);
      }
      setLoading(false);
    };

    fetchScript();
  }, [scriptId]);

  useEffect(() => {
    if (focusedBlockId && blockRefs.current[focusedBlockId]) {
      const element = blockRefs.current[focusedBlockId];
      element?.focus();
      
      const range = document.createRange();
      const sel = window.getSelection();
      if (element?.childNodes.length) {
        range.setStart(element.childNodes[0], element.innerText.length);
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }, [focusedBlockId]);

  const handleSave = async () => {
    if (!scriptId) return;
    setSaving(true);
    const toastId = showLoading("Saving changes...");

    // Sanitize all content before sending to database
    const sanitizedBlocks = blocks.map(block => ({
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

    if (error) {
      showError("Save failed");
    } else {
      showSuccess("Script saved securely");
    }
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
    const block = blocks[index];

    if (e.key === 'Tab') {
      e.preventDefault();
      const types: ElementType[] = ['action', 'character', 'parenthetical', 'dialogue', 'slugline'];
      const currentIndex = types.indexOf(block.type);
      const nextType = types[(currentIndex + 1) % types.length];
      
      const newBlocks = [...blocks];
      newBlocks[index] = { ...block, type: nextType };
      setBlocks(newBlocks);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const nextType = getNextBlockType(block.type);
      const newId = Math.random().toString(36).substr(2, 9);
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, { id: newId, type: nextType, content: '' });
      setBlocks(newBlocks);
      setFocusedBlockId(newId);
      return;
    }

    if (e.key === 'Backspace' && block.content === '' && blocks.length > 1) {
      e.preventDefault();
      const prevBlockId = blocks[index - 1]?.id;
      const newBlocks = blocks.filter((_, i) => i !== index);
      setBlocks(newBlocks);
      if (prevBlockId) setFocusedBlockId(prevBlockId);
      return;
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>, index: number) => {
    let content = e.currentTarget.innerText;
    const newBlocks = [...blocks];
    let type = newBlocks[index].type;

    const upperContent = content.toUpperCase();
    if (upperContent.startsWith('INT.') || upperContent.startsWith('EXT.')) {
      type = 'slugline';
    } else if (content.length > 0 && content.length < 20 && content.toUpperCase() === content) {
      type = 'character';
    } else if (content.startsWith('(') && content.endsWith(')')) {
      type = 'parenthetical';
    } else if (newBlocks[index - 1]?.type === 'character' || newBlocks[index - 1]?.type === 'parenthetical') {
      type = 'dialogue';
    } else if (type !== 'slugline' && type !== 'character' && type !== 'parenthetical' && type !== 'dialogue') {
      type = 'action';
    }

    if (type === 'slugline' || type === 'character') {
      content = content.toUpperCase();
    }
    
    newBlocks[index] = { ...newBlocks[index], content, type };
    setBlocks(newBlocks);
  };

  const getBlockStyles = (type: ElementType) => {
    const base = "outline-none transition-all duration-150 min-h-[1.5em] focus:bg-primary/5 rounded px-1 whitespace-pre-wrap";
    switch (type) {
      case 'character': return cn(base, "text-center uppercase font-bold w-[50%] mx-auto mb-1 mt-6");
      case 'dialogue': return cn(base, "text-center w-[65%] mx-auto mb-4 relative group");
      case 'parenthetical': return cn(base, "text-center w-[40%] mx-auto italic text-sm mb-1 before:content-['('] after:content-[')']");
      case 'slugline': return cn(base, "uppercase font-bold mb-4 mt-8");
      default: return cn(base, "mb-4 text-left");
    }
  };

  const renderBlockContent = (block: ScriptBlock) => {
    if (block.type === 'parenthetical') {
      return block.content.replace(/^\(|\)$/g, '');
    }
    return block.content;
  };

  const getCharacterForDialogue = (index: number): string => {
    for (let i = index - 1; i >= 0; i--) {
      if (blocks[i].type === 'character') return blocks[i].content;
      if (blocks[i].type === 'slugline' || blocks[i].type === 'action') break;
    }
    return 'UNKNOWN';
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const pageCount = Math.max(1, Math.ceil(blocks.length / 15));

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <header className="h-14 border-b bg-background flex items-center px-4 justify-between shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft size={20} />
          </Button>
          <div className="h-4 w-px bg-border" />
          <div className="flex flex-col group cursor-pointer" onClick={() => setIsRenameModal(true)}>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold">{scriptTitle || "Untitled"}</span>
              <Edit2 size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Draft</span>
              {focusedBlockId && (
                <Badge variant="outline" className="bg-primary/5 text-primary text-[9px] font-bold uppercase py-0 px-1.5 h-4 border-primary/20">
                  {blocks.find(b => b.id === focusedBlockId)?.type} Mode
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CollaboratorStack />

          <div className="hidden lg:flex items-center gap-1.5 px-3 h-8 bg-muted rounded-md border mr-2">
            <Files size={14} className="text-muted-foreground" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{pageCount} {pageCount === 1 ? 'Page' : 'Pages'}</span>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 text-purple-600 border-purple-200 bg-purple-50 h-8"
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
          
          <ShareScriptModal>
            <Button variant="outline" size="sm" className="gap-2 h-8">
              <Share2 size={16} />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </ShareScriptModal>

          <Button size="sm" className="gap-2 h-8" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span className="hidden sm:inline">Save</span>
          </Button>
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

        <aside className="w-64 border-r bg-background hidden lg:flex flex-col shrink-0">
          <div className="p-4 border-b">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Scene Navigator</h3>
            <div className="space-y-1">
              {blocks.filter(b => b.type === 'slugline').map((b, i) => (
                <div 
                  key={b.id} 
                  className="text-xs p-2 rounded cursor-pointer hover:bg-muted text-muted-foreground truncate"
                  onClick={() => setFocusedBlockId(b.id)}
                >
                  {b.content || `Scene ${i+1}`}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-12 flex justify-center bg-muted/30">
          <div className="w-[850px] min-h-[1100px] bg-white dark:bg-slate-50 text-black shadow-xl p-[80px] font-['Courier_Prime',monospace] text-[12pt] leading-tight cursor-text relative">
            <div className="text-center mb-12 uppercase">
              <h1 className="text-2xl font-bold outline-none focus:bg-primary/5 rounded px-2" contentEditable suppressContentEditableWarning onBlur={(e) => setScriptTitle(sanitizeInput(e.currentTarget.innerText))}>{scriptTitle.toUpperCase()}</h1>
              <p className="mt-2 text-sm">Written by</p>
              <p className="mt-1 outline-none focus:bg-primary/5 rounded px-2 min-w-[100px] inline-block" contentEditable suppressContentEditableWarning onBlur={(e) => setScriptAuthor(sanitizeInput(e.currentTarget.innerText))}>{scriptAuthor}</p>
            </div>

            <div className="space-y-0">
              {blocks.map((block, index) => (
                <div
                  key={block.id}
                  ref={el => blockRefs.current[block.id] = el}
                  contentEditable
                  suppressContentEditableWarning
                  className={getBlockStyles(block.type)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onInput={(e) => handleInput(e, index)}
                  onFocus={() => setFocusedBlockId(block.id)}
                >
                  {renderBlockContent(block)}
                  {block.type === 'dialogue' && (
                    <DialogueFeedback 
                      characterName={getCharacterForDialogue(index)}
                      dialogue={block.content}
                      consistencyScore={95} 
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>

        {showRightPanel === 'ai' && (
          <aside className="w-80 border-l bg-background flex flex-col shrink-0">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm">Production Intelligence</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowRightPanel(null)}>
                <X size={16} />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <ProductionOverseer />
            </div>
          </aside>
        )}
      </div>

      <RenameScriptModal 
        isOpen={isRenameModalOpen}
        onOpenChange={setIsRenameModal}
        currentTitle={scriptTitle}
        onRename={(title) => setScriptTitle(sanitizeInput(title))}
      />
    </div>
  );
};

export default ScriptEditor;