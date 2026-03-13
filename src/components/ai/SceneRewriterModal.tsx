"use client";

import React, { useState } from 'react';
import { Loader2, Copy, Plus, RefreshCw, Palette, Gauge, Eye } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { aiPrompt } from "@/utils/ai-client";
import { showError, showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";

interface ScriptBlock {
  id: string;
  type: string;
  content: string;
}

interface Alternative {
  label: string;
  description: string;
  blocks: ScriptBlock[];
}

interface SceneRewriterModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  blocks: ScriptBlock[];
  focusedBlockId: string | null;
  onInsertScene: (newBlocks: ScriptBlock[]) => void;
}

const BLOCK_STYLES: Record<string, string> = {
  slugline: 'uppercase font-bold',
  action: '',
  character: 'uppercase font-bold ml-[2.2in] mr-[1.4in]',
  dialogue: 'ml-[1in] mr-[1.5in]',
  parenthetical: 'italic ml-[1.6in] mr-[2in]',
  transition: 'uppercase font-bold text-right',
};

const SceneRewriterModal = ({ isOpen, onOpenChange, blocks, focusedBlockId, onInsertScene }: SceneRewriterModalProps) => {
  const [generating, setGenerating] = useState(false);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [activeAlt, setActiveAlt] = useState('0');
  const [selectedScene, setSelectedScene] = useState<string>('');

  // Extract scenes (slugline to next slugline)
  const scenes: { label: string; startIdx: number; endIdx: number }[] = [];
  blocks.forEach((b, i) => {
    if (b.type === 'slugline') {
      if (scenes.length > 0) {
        scenes[scenes.length - 1].endIdx = i - 1;
      }
      scenes.push({ label: b.content, startIdx: i, endIdx: blocks.length - 1 });
    }
  });

  // Auto-select scene based on focused block
  const getAutoSelectedScene = () => {
    if (selectedScene) return selectedScene;
    if (!focusedBlockId) return scenes[0]?.label || '';
    const focusIdx = blocks.findIndex(b => b.id === focusedBlockId);
    for (let i = scenes.length - 1; i >= 0; i--) {
      if (focusIdx >= scenes[i].startIdx) return scenes[i].label;
    }
    return scenes[0]?.label || '';
  };

  const currentSceneLabel = getAutoSelectedScene();
  const currentScene = scenes.find(s => s.label === currentSceneLabel);
  const sceneBlocks = currentScene ? blocks.slice(currentScene.startIdx, currentScene.endIdx + 1) : [];

  const generateAlternatives = async () => {
    if (sceneBlocks.length === 0) {
      showError("No scene selected.");
      return;
    }

    setGenerating(true);
    setAlternatives([]);

    const sceneText = sceneBlocks.map(b => `[${b.type}] ${b.content}`).join('\n');

    const { text, error } = await aiPrompt(
      `You are an expert screenwriter. Rewrite the following scene in 3 different ways.

Create these 3 alternatives:
1. "Different Tone" - Same story beats but with a dramatically different emotional tone (e.g., if dramatic, make it lighter; if comedic, add tension)
2. "Different Pacing" - Same story but restructured for different pacing (e.g., if slow burn, make it rapid-fire; or vice versa)
3. "Different POV" - Same events but from a different character's perspective, or with a different character driving the scene

For each alternative, return properly formatted screenplay blocks.

Return a JSON array of exactly 3 objects, each with:
- "label": the alternative name ("Different Tone", "Different Pacing", "Different POV")
- "description": 1 sentence describing what changed
- "blocks": array of { "id": "unique_id", "type": "slugline|action|character|dialogue|parenthetical|transition", "content": "text" }

Use random alphanumeric IDs (9 chars). Return ONLY valid JSON array, no markdown fences.`,
      sceneText,
      0.85
    );

    setGenerating(false);

    if (error) {
      showError(error === 'NO_API_KEY' ? 'Set up your API key in Settings > AI' : error);
      return;
    }

    try {
      const parsed = JSON.parse(text.trim());
      if (Array.isArray(parsed) && parsed.length > 0) {
        setAlternatives(parsed);
        setActiveAlt('0');
      }
    } catch {
      showError("Failed to parse alternatives.");
    }
  };

  const handleCopy = (alt: Alternative) => {
    const text = alt.blocks.map(b => {
      if (b.type === 'slugline') return `\n${b.content.toUpperCase()}\n`;
      if (b.type === 'character') return `\n\t\t\t${b.content.toUpperCase()}`;
      if (b.type === 'dialogue') return `\t${b.content}`;
      if (b.type === 'parenthetical') return `\t\t(${b.content})`;
      if (b.type === 'transition') return `\n\t\t\t\t\t${b.content.toUpperCase()}`;
      return b.content;
    }).join('\n');
    navigator.clipboard.writeText(text);
    showSuccess("Scene copied to clipboard!");
  };

  const handleInsert = (alt: Alternative) => {
    const newBlocks = alt.blocks.map(b => ({
      ...b,
      id: Math.random().toString(36).substr(2, 9),
    }));
    onInsertScene(newBlocks);
    showSuccess("Scene inserted into your script!");
    onOpenChange(false);
  };

  const ALT_ICONS = [
    <Palette size={14} key="tone" />,
    <Gauge size={14} key="pace" />,
    <Eye size={14} key="pov" />,
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[900px] max-h-[85vh] p-0 gap-0">
        <DialogHeader className="p-4 pb-3 border-b">
          <DialogTitle className="text-base">Scene Rewriter</DialogTitle>
          <DialogDescription className="flex items-center gap-3">
            Get 3 AI alternative versions of your scene
            <Select value={currentSceneLabel} onValueChange={setSelectedScene}>
              <SelectTrigger className="h-7 w-auto text-xs">
                <SelectValue placeholder="Select scene" />
              </SelectTrigger>
              <SelectContent>
                {scenes.map((s, i) => (
                  <SelectItem key={i} value={s.label} className="text-xs">
                    Scene {i + 1}: {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(85vh - 120px)' }}>
          {/* Left: Original */}
          <div className="w-[45%] border-r flex flex-col">
            <div className="px-4 py-2 border-b bg-muted/30">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Original Scene</p>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="font-mono text-[11px] space-y-1">
                {sceneBlocks.map((b, i) => (
                  <p key={i} className={cn('leading-relaxed', BLOCK_STYLES[b.type])}>
                    {b.content}
                  </p>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right: Alternatives */}
          <div className="w-[55%] flex flex-col">
            {alternatives.length === 0 && !generating && (
              <div className="flex flex-col items-center justify-center flex-1 gap-3">
                <p className="text-sm text-muted-foreground text-center px-8">
                  Generate 3 alternative versions of this scene with different tone, pacing, and perspective.
                </p>
                <Button onClick={generateAlternatives} className="gap-2">
                  <RefreshCw size={14} />
                  Generate Alternatives
                </Button>
              </div>
            )}

            {generating && (
              <div className="flex flex-col items-center justify-center flex-1 gap-2">
                <Loader2 size={24} className="animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Rewriting your scene 3 ways...</p>
              </div>
            )}

            {alternatives.length > 0 && !generating && (
              <>
                <Tabs value={activeAlt} onValueChange={setActiveAlt} className="flex flex-col flex-1">
                  <div className="px-4 py-2 border-b bg-muted/30">
                    <TabsList className="h-8 w-full grid grid-cols-3">
                      {alternatives.map((alt, i) => (
                        <TabsTrigger key={i} value={String(i)} className="text-[10px] uppercase font-bold gap-1 h-7">
                          {ALT_ICONS[i]}
                          <span className="hidden sm:inline">{alt.label}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {alternatives.map((alt, i) => (
                    <TabsContent key={i} value={String(i)} className="flex-1 mt-0 flex flex-col">
                      <div className="px-4 py-2 border-b">
                        <p className="text-xs text-muted-foreground">{alt.description}</p>
                      </div>
                      <ScrollArea className="flex-1 p-4">
                        <div className="font-mono text-[11px] space-y-1">
                          {alt.blocks.map((b, j) => (
                            <p key={j} className={cn('leading-relaxed', BLOCK_STYLES[b.type])}>
                              {b.content}
                            </p>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="px-4 py-3 border-t flex justify-between">
                        <Button variant="outline" size="sm" onClick={() => handleCopy(alt)} className="gap-1.5 text-xs">
                          <Copy size={12} /> Copy to Clipboard
                        </Button>
                        <Button size="sm" onClick={() => handleInsert(alt)} className="gap-1.5 text-xs">
                          <Plus size={12} /> Insert as New Scene
                        </Button>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                <div className="px-4 py-2 border-t">
                  <Button variant="ghost" size="sm" onClick={generateAlternatives} className="gap-1.5 text-xs w-full">
                    <RefreshCw size={12} /> Regenerate All
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SceneRewriterModal;
