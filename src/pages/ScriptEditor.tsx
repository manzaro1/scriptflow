"use client";

import React, { useState, useRef, useEffect } from 'react';
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
  Edit2
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
import { showSuccess, showLoading, dismissToast } from "@/utils/toast";
import CharacterProfileModal from "@/components/CharacterProfileModal";
import CharacterChat from "@/components/CharacterChat";
import ProductionOverseer from "@/components/ProductionOverseer";
import ShareScriptModal from "@/components/ShareScriptModal";
import StoryboardGenerator from "@/components/StoryboardGenerator";
import RenameScriptModal from "@/components/RenameScriptModal";
import { cn } from "@/lib/utils";

type ElementType = 'action' | 'character' | 'dialogue' | 'slugline' | 'parenthetical';

interface ScriptBlock {
  id: string;
  type: ElementType;
  content: string;
}

const ScriptEditor = () => {
  const [showRightPanel, setShowRightPanel] = useState<'comments' | 'ai' | null>(null);
  const [aiTab, setAiTab] = useState<string>("overseer");
  const [activeCharChat, setActiveCharChat] = useState<string | null>(null);
  const [isStoryboardOpen, setIsStoryboardOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [scriptTitle, setScriptTitle] = useState("The Neon Horizon");
  
  // Block-based state management
  const [blocks, setBlocks] = useState<ScriptBlock[]>([
    { id: '1', type: 'slugline', content: 'EXT. SKYLINE - NIGHT' },
    { id: '2', type: 'action', content: 'Rain hammers against the metallic skin of the city. Neon signs flicker in shades of bruised purple and electric cyan.' },
    { id: '3', type: 'character', content: 'KAI' },
    { id: '4', type: 'parenthetical', content: 'to himself' },
    { id: '5', type: 'dialogue', content: "This wasn't part of the deal." },
    { id: '6', type: 'action', content: 'Kai pulls a small, glowing COIL from his pocket. It pulses with a rhythmic, golden light.' },
  ]);
  
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const blockRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const block = blocks[index];

    if (e.key === 'Tab') {
      e.preventDefault();
      const types: ElementType[] = ['action', 'character', 'parenthetical', 'dialogue', 'slugline'];
      const nextType = types[(types.indexOf(block.type) + 1) % types.length];
      const newBlocks = [...blocks];
      newBlocks[index] = { ...block, type: nextType };
      setBlocks(newBlocks);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      let nextType: ElementType = 'action';
      
      if (block.type === 'slugline') nextType = 'action';
      else if (block.type === 'character') nextType = 'dialogue';
      else if (block.type === 'dialogue') nextType = 'action';
      else if (block.type === 'parenthetical') nextType = 'dialogue';

      const newId = Math.random().toString(36).substr(2, 9);
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, { id: newId, type: nextType, content: '' });
      setBlocks(newBlocks);
      setFocusedBlockId(newId);
    }

    if (e.key === 'Backspace' && block.content === '' && blocks.length > 1) {
      e.preventDefault();
      const prevBlockId = blocks[index - 1]?.id;
      const newBlocks = blocks.filter((_, i) => i !== index);
      setBlocks(newBlocks);
      if (prevBlockId) setFocusedBlockId(prevBlockId);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>, index: number) => {
    const content = e.currentTarget.innerText;
    const newBlocks = [...blocks];
    let type = newBlocks[index].type;

    const upperContent = content.toUpperCase();
    if (upperContent.startsWith('INT.') || upperContent.startsWith('EXT.')) {
      type = 'slugline';
    }

    newBlocks[index] = { ...newBlocks[index], content, type };
    setBlocks(newBlocks);
  };

  const handleCharacterClick = (char: string) => {
    setActiveCharChat(char);
    setShowRightPanel('ai');
    setAiTab('chat');
  };

  const handleExport = (format: 'pdf' | 'docx') => {
    const toastId = showLoading(`Generating ${format.toUpperCase()}...`);
    setTimeout(() => {
      dismissToast(toastId);
      showSuccess(`Script exported as ${format.toUpperCase()}`);
    }, 1000);
  };

  const getBlockStyles = (type: ElementType) => {
    const base = "outline-none transition-all duration-150 min-h-[1.5em] focus:bg-primary/5 rounded px-1";
    switch (type) {
      case 'character': return cn(base, "text-center uppercase font-bold w-[50%] mx-auto mb-1 mt-6");
      case 'dialogue': return cn(base, "text-center w-[65%] mx-auto mb-4");
      case 'parenthetical': return cn(base, "text-center w-[40%] mx-auto italic text-sm mb-1 before:content-['('] after:content-[')']");
      case 'slugline': return cn(base, "uppercase font-bold mb-4 mt-8");
      default: return cn(base, "mb-4 text-left");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#F9F9F9]">
      <header className="h-14 border-b bg-white flex items-center px-4 justify-between shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft size={20} />
          </Button>
          <div className="h-4 w-px bg-border" />
          <div className="flex flex-col group cursor-pointer" onClick={() => setIsRenameModalOpen(true)}>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold">{scriptTitle}</span>
              <Edit2 size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Draft 3</span>
              {focusedBlockId && (
                <Badge variant="outline" className="bg-primary/5 text-primary text-[9px] font-bold uppercase py-0 px-1.5 h-4 border-primary/20">
                  {blocks.find(b => b.id === focusedBlockId)?.type} Mode
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 text-purple-600 border-purple-200 bg-purple-50 hover:bg-purple-100 h-8"
            onClick={() => setIsStoryboardOpen(true)}
          >
            <Sparkles size={16} />
            <span className="hidden sm:inline">AI Storyboard</span>
          </Button>

          <Button 
            variant={showRightPanel === 'ai' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="gap-2 h-8"
            onClick={() => {
              setShowRightPanel(showRightPanel === 'ai' ? null : 'ai');
              setAiTab('overseer');
            }}
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-8">
                <Download size={16} />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('pdf')} className="gap-2">
                <FileDown size={14} className="text-red-500" />
                Download as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('docx')} className="gap-2">
                <FileDown size={14} className="text-blue-500" />
                Download as DOCX
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="sm" className="gap-2 h-8" onClick={() => showSuccess("Script saved successfully")}>
            <Save size={16} />
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
        />

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/80 backdrop-blur border px-3 py-1.5 rounded-full shadow-lg text-[10px] text-muted-foreground font-medium">
          <Info size={12} className="text-primary" />
          TAB to cycle • ENTER for smart transition • BACKSPACE to delete empty
        </div>

        <aside className="w-64 border-r bg-white hidden lg:flex flex-col shrink-0">
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
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cast / DNA</h3>
              <CharacterProfileModal />
            </div>
            <div className="flex flex-col gap-2">
              {['KAI', 'SARA', 'VEO', 'DR. ARIS'].map(char => (
                <button 
                  key={char} 
                  onClick={() => handleCharacterClick(char)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                    activeCharChat === char && showRightPanel === 'ai' && aiTab === 'chat'
                      ? 'bg-purple-50 border-purple-200 text-purple-700' 
                      : 'hover:bg-muted border-transparent'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <UserCircle2 size={14} />
                    {char}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-12 flex justify-center bg-gray-100">
          <div className="w-[850px] min-h-[1100px] bg-white shadow-xl p-[80px] font-['Courier_Prime',Courier,monospace] text-[12pt] leading-tight cursor-text">
            <div className="text-center mb-12 uppercase">
              <h1 className="text-2xl font-bold">{scriptTitle.toUpperCase()}</h1>
              <p className="mt-2 text-sm">Written by</p>
              <p className="mt-1">Alex Rivers</p>
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
                  {block.content}
                </div>
              ))}
            </div>
          </div>
        </main>

        {showRightPanel && (
          <aside className="w-80 border-l bg-white flex flex-col shrink-0 animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm">Production Intelligence</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowRightPanel(null)}>
                <X size={16} />
              </Button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <Tabs value={aiTab} onValueChange={setAiTab} className="h-full flex flex-col">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-10 px-4">
                  <TabsTrigger value="overseer" className="text-xs h-8">Overseer</TabsTrigger>
                  <TabsTrigger value="chat" className="text-xs h-8" disabled={!activeCharChat}>
                    Actor Chat
                  </TabsTrigger>
                </TabsList>
                <div className="flex-1 overflow-hidden">
                  <TabsContent value="overseer" className="mt-0 h-full p-4 overflow-y-auto">
                    <ProductionOverseer />
                  </TabsContent>
                  <TabsContent value="chat" className="mt-0 h-full p-4">
                    {activeCharChat && <CharacterChat characterName={activeCharChat} />}
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </aside>
        )}
      </div>

      <RenameScriptModal 
        isOpen={isRenameModalOpen}
        onOpenChange={setIsRenameModalOpen}
        currentTitle={scriptTitle}
        onRename={setScriptTitle}
      />
    </div>
  );
};

export default ScriptEditor;