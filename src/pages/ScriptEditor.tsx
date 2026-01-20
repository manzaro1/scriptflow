"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Download, 
  MessageSquare, 
  List, 
  X,
  Sparkles,
  Scissors,
  Maximize2,
  FileDown,
  BrainCircuit,
  UserCircle2,
  Share2,
  Info
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

type ElementType = 'action' | 'character' | 'dialogue' | 'slugline' | 'parenthetical';

const ScriptEditor = () => {
  const [showRightPanel, setShowRightPanel] = useState<'comments' | 'ai' | null>(null);
  const [aiTab, setAiTab] = useState<string>("overseer");
  const [activeCharChat, setActiveCharChat] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ text: string; rect: DOMRect | null }>({ text: '', rect: null });
  const [currentType, setCurrentType] = useState<ElementType>('action');
  const editorRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0) {
      const range = sel.getRangeAt(0);
      setSelection({
        text: sel.toString(),
        rect: range.getBoundingClientRect()
      });
    } else {
      setSelection({ text: '', rect: null });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 1. Tab Key Logic (Manual Override & Cycling)
    if (e.key === 'Tab') {
      e.preventDefault();
      const types: ElementType[] = ['action', 'character', 'parenthetical', 'dialogue', 'slugline'];
      const currentIndex = types.indexOf(currentType);
      const nextIndex = (currentIndex + 1) % types.length;
      setCurrentType(types[nextIndex]);
    }

    // 2. Enter Key Logic (Predictive Flow)
    if (e.key === 'Enter') {
      if (currentType === 'slugline') {
        // SLUGLINE -> ACTION
        setTimeout(() => setCurrentType('action'), 0);
      } else if (currentType === 'character') {
        // CHARACTER -> DIALOGUE
        setTimeout(() => setCurrentType('dialogue'), 0);
      } else if (currentType === 'dialogue') {
        // DIALOGUE -> ACTION
        setTimeout(() => setCurrentType('action'), 0);
      }
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.innerText;
    const lines = text.split('\n');
    const lastLine = lines[lines.length - 1].toUpperCase();

    // 4. Pattern Recognition (Auto-Detection)
    if (lastLine.startsWith('INT.') || lastLine.startsWith('EXT.')) {
      if (currentType !== 'slugline') {
        setCurrentType('slugline');
      }
    }
    
    // Suggest character mode if all caps or ends with colon (basic heuristic)
    if (lastLine.length > 2 && lastLine === lines[lines.length - 1] && !lastLine.includes('.') && currentType === 'action') {
       if (lastLine.endsWith(':')) {
         setCurrentType('character');
       }
    }
  };

  const handleCharacterClick = (char: string) => {
    setActiveCharChat(char);
    setShowRightPanel('ai');
    setAiTab('chat');
  };

  const handleAIAction = (action: 'enhance' | 'shorten' | 'expand') => {
    const toastId = showLoading(`AI is ${action}ing your script...`);
    setTimeout(() => {
      dismissToast(toastId);
      showSuccess(`Text successfully ${action}ed!`);
      setSelection({ text: '', rect: null });
    }, 1500);
  };

  const handleExport = (format: 'pdf' | 'docx') => {
    const toastId = showLoading(`Generating ${format.toUpperCase()}...`);
    setTimeout(() => {
      dismissToast(toastId);
      showSuccess(`Script exported as ${format.toUpperCase()}`);
    }, 1000);
  };

  // 3. Visual Translator (Dynamic Styling)
  const getTypeStyles = (type: ElementType) => {
    switch (type) {
      case 'character': 
        return "text-center uppercase font-bold w-[50%] mx-auto mb-1 mt-6 transition-all duration-200";
      case 'dialogue': 
        return "text-center w-[65%] mx-auto mb-4 transition-all duration-200";
      case 'parenthetical': 
        return "text-center w-[40%] mx-auto italic text-sm mb-1 transition-all duration-200 before:content-['('] after:content-[')']";
      case 'slugline': 
        return "uppercase font-bold mb-4 mt-8 transition-all duration-200 border-b border-transparent";
      case 'action':
      default: 
        return "mb-4 text-left transition-all duration-200";
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
          <div className="flex flex-col">
            <span className="text-sm font-semibold">The Neon Horizon</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Draft 3</span>
              {/* 5. User Feedback (Status HUD) */}
              <Badge variant="outline" className="bg-primary/5 text-primary text-[9px] font-bold uppercase py-0 px-1.5 h-4 border-primary/20">
                {currentType} Mode
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1 bg-muted/30 p-1 rounded-lg border mr-2">
            {(['slugline', 'action', 'character', 'parenthetical', 'dialogue'] as ElementType[]).map((t) => (
              <Button 
                key={t}
                variant={currentType === t ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-[9px] px-2 uppercase font-bold tracking-tighter"
                onClick={() => setCurrentType(t)}
              >
                {t}
              </Button>
            ))}
          </div>

          <Button 
            variant={showRightPanel === 'ai' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="gap-2 text-purple-600 h-8"
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
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/80 backdrop-blur border px-3 py-1.5 rounded-full shadow-lg text-[10px] text-muted-foreground font-medium">
          <Info size={12} className="text-primary" />
          Press <kbd className="bg-muted px-1 rounded border">TAB</kbd> to change mode • <kbd className="bg-muted px-1 rounded border">ENTER</kbd> for smart transition
        </div>

        {selection.rect && (
          <div 
            className="fixed z-50 bg-white border shadow-xl rounded-lg flex items-center p-1 gap-1 animate-in fade-in zoom-in duration-200"
            style={{ 
              top: selection.rect.top - 50, 
              left: selection.rect.left + (selection.rect.width / 2) - 100 
            }}
          >
            <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs" onClick={() => handleAIAction('enhance')}>
              <Sparkles size={14} className="text-purple-500" />
              Enhance
            </Button>
            <div className="w-px h-4 bg-border" />
            <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs" onClick={() => handleAIAction('shorten')}>
              <Scissors size={14} className="text-blue-500" />
              Shorten
            </Button>
            <div className="w-px h-4 bg-border" />
            <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs" onClick={() => handleAIAction('expand')}>
              <Maximize2 size={14} className="text-green-500" />
              Expand
            </Button>
          </div>
        )}

        <aside className="w-64 border-r bg-white hidden lg:flex flex-col shrink-0">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Scene Navigator</h3>
              <List size={14} className="text-muted-foreground" />
            </div>
            <div className="space-y-1">
              {['EXT. SKYLINE - NIGHT', 'INT. APARTMENT - CONTINUOUS', 'INT. HALLWAY - LATER', 'EXT. STREET - NIGHT'].map((scene, i) => (
                <div 
                  key={i} 
                  className={`text-xs p-2 rounded cursor-pointer transition-colors ${i === 0 ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'}`}
                >
                  {scene}
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
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    activeCharChat === char && showRightPanel === 'ai' && aiTab === 'chat'
                      ? 'bg-purple-50 border-purple-200 text-purple-700' 
                      : 'hover:bg-muted border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <UserCircle2 size={14} />
                    {char}
                  </div>
                  {char === 'SARA' && <div className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-12 flex justify-center bg-gray-100" onMouseUp={handleMouseUp}>
          <div 
            ref={editorRef}
            contentEditable
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            suppressContentEditableWarning
            className="w-[850px] min-h-[1100px] bg-white shadow-xl p-[80px] font-['Courier_Prime',Courier,monospace] text-[12pt] leading-tight outline-none cursor-text selection:bg-primary/20"
          >
            <div className="text-center mb-12 uppercase" contentEditable={false}>
              <h1 className="text-2xl font-bold">THE NEON HORIZON</h1>
              <p className="mt-2 text-sm">Written by</p>
              <p className="mt-1">Alex Rivers</p>
            </div>

            <div className="space-y-1">
              <div className={getTypeStyles('slugline')}>EXT. SKYLINE - NIGHT</div>
              <div className={getTypeStyles('action')}>
                Rain hammers against the metallic skin of the city. Neon signs flicker in shades of bruised purple and electric cyan.
              </div>

              <div className={getTypeStyles('character')}>KAI</div>
              <div className={getTypeStyles('parenthetical')}>to himself</div>
              <div className={getTypeStyles('dialogue')}>This wasn't part of the deal.</div>

              <div className={getTypeStyles('action')}>
                Kai pulls a small, glowing COIL from his pocket. It pulses with a rhythmic, golden light.
              </div>

              <div className={getTypeStyles('character')}>VEO (V.O.)</div>
              <div className={getTypeStyles('dialogue')}>
                The deal changed the moment you stepped into Sector 4.
              </div>

              <div className={`${getTypeStyles(currentType)} bg-primary/5 ring-1 ring-primary/20 rounded px-1 animate-pulse`}>
                {/* Dynamic styling applies here to the active typing area */}
                [Typing in {currentType.toUpperCase()} mode...]
              </div>
            </div>
          </div>
        </main>

        {showRightPanel && (
          <aside className="w-80 border-l bg-white flex flex-col shrink-0 animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm">
                {showRightPanel === 'comments' ? 'Production Notes' : 'Production Intelligence'}
              </h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowRightPanel(null)}>
                <X size={16} />
              </Button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              {showRightPanel === 'ai' ? (
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
                      {activeCharChat ? (
                        <CharacterChat characterName={activeCharChat} />
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                          <UserCircle2 size={48} className="mb-4 opacity-20" />
                          <p className="text-sm font-medium">Select a character to start chatting</p>
                        </div>
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              ) : (
                <div className="p-4 space-y-4 overflow-y-auto h-full">
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">JD</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-bold">John Director</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">2h ago</span>
                    </div>
                    <p className="text-xs leading-relaxed">
                      Can we make Kai's dialogue here a bit more cryptic? He shouldn't give away the coil yet.
                    </p>
                    <Button variant="link" size="sm" className="h-auto p-0 text-[10px]">Reply</Button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        <aside className="w-14 border-l bg-white flex flex-col items-center py-4 gap-4 shrink-0">
          <Button 
            variant={showRightPanel === 'ai' ? 'secondary' : 'ghost'} 
            size="icon" 
            className="h-10 w-10 text-purple-600"
            onClick={() => {
              setShowRightPanel('ai');
              setAiTab('overseer');
            }}
          >
            <BrainCircuit size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <MessageSquare size={20} />
          </Button>
          <div className="mt-auto">
            <div className="text-[10px] font-bold text-muted-foreground rotate-90 mb-4 whitespace-nowrap">PG 1 / 120</div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ScriptEditor;