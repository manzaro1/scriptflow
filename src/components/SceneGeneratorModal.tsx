"use client";

import React, { useState } from 'react';
import { Wand2, Loader2, Plus, RotateCcw, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { showError, showSuccess } from "@/utils/toast";
import { aiPrompt } from "@/utils/ai-client";
import { loadAIConfig } from "@/utils/ai-providers";
import { cn } from "@/lib/utils";

interface ScriptBlock {
  id: string;
  type: string;
  content: string;
}

interface SceneGeneratorModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  existingCharacters: string[];
  onInsert: (blocks: ScriptBlock[]) => void;
}

const TONES = ['Dramatic', 'Comedy', 'Thriller', 'Horror', 'Sci-Fi', 'Romance', 'Action', 'Mystery', 'Noir', 'Surreal'];
const SCENE_LENGTHS = [
  { value: 'short', label: 'Short (5-10 blocks)' },
  { value: 'medium', label: 'Medium (10-20 blocks)' },
  { value: 'long', label: 'Long (20-35 blocks)' },
];

const typeColors: Record<string, string> = {
  slugline: 'text-amber-600 bg-amber-500/10',
  character: 'text-purple-600 bg-purple-500/10',
  dialogue: 'text-blue-600 bg-blue-500/10',
  parenthetical: 'text-purple-400 bg-purple-400/10',
  action: 'text-muted-foreground bg-muted',
  transition: 'text-amber-500 bg-amber-500/10',
};

const SceneGeneratorModal = ({ isOpen, onOpenChange, existingCharacters, onInsert }: SceneGeneratorModalProps) => {
  const [premise, setPremise] = useState('');
  const [tone, setTone] = useState('Dramatic');
  const [sceneLength, setSceneLength] = useState('medium');
  const [selectedChars, setSelectedChars] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatedBlocks, setGeneratedBlocks] = useState<ScriptBlock[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [mode, setMode] = useState<'premise' | 'outline'>('premise');
  const [outline, setOutline] = useState('');

  const toggleChar = (char: string) => {
    setSelectedChars(prev => prev.includes(char) ? prev.filter(c => c !== char) : [...prev, char]);
  };

  const handleGenerate = async () => {
    const config = loadAIConfig();
    if (!config.apiKey && config.provider !== 'custom') {
      showError("Set up your API key in Settings > AI");
      return;
    }

    const input = mode === 'premise' ? premise : outline;
    if (!input.trim()) {
      showError(mode === 'premise' ? "Enter a scene premise first" : "Enter an outline first");
      return;
    }

    setGenerating(true);
    setGeneratedBlocks([]);

    const lengthGuide = sceneLength === 'short' ? '5-10' : sceneLength === 'medium' ? '10-20' : '20-35';
    const charInstruction = selectedChars.length > 0
      ? `Feature these characters: ${selectedChars.join(', ')}.`
      : existingCharacters.length > 0
        ? `Available characters: ${existingCharacters.join(', ')}. Use any that fit.`
        : '';

    const prompt = mode === 'premise'
      ? `Scene premise: ${input.trim()}`
      : `Generate a scene from this outline:\n${input.trim()}`;

    const { text, error } = await aiPrompt(
      `You are an expert screenwriter. Generate a properly formatted screenplay scene.
Tone: ${tone}
${charInstruction}
Target length: ${lengthGuide} blocks.

Return a JSON array of blocks where each has:
- "id": unique string
- "type": one of "slugline", "action", "character", "dialogue", "parenthetical", "transition"
- "content": the text content

Follow professional screenplay formatting. Start with a slugline.
Return ONLY valid JSON array, no markdown fences.`,
      prompt,
      0.8
    );

    setGenerating(false);

    if (error) {
      showError(error === 'NO_API_KEY' ? "Set up your API key in Settings > AI" : error);
      return;
    }

    try {
      const parsed = JSON.parse(text.trim());
      if (Array.isArray(parsed) && parsed.length > 0) {
        setGeneratedBlocks(parsed);
        setShowPreview(true);
      } else {
        showError("Failed to generate scene");
      }
    } catch {
      showError("Failed to parse generated scene");
    }
  };

  const handleInsert = () => {
    onInsert(generatedBlocks);
    showSuccess(`Inserted ${generatedBlocks.length} blocks into script`);
    handleClose();
  };

  const handleClose = () => {
    setPremise('');
    setOutline('');
    setGeneratedBlocks([]);
    setShowPreview(false);
    setSelectedChars([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn("sm:max-w-[650px]", showPreview && "sm:max-w-[750px]")}>
        {!showPreview ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                  <Wand2 size={18} />
                </div>
                <DialogTitle>Generate Scene</DialogTitle>
              </div>
              <DialogDescription>
                Describe your scene and the AI will generate a fully formatted screenplay scene.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Mode toggle */}
              <div className="flex gap-2">
                <Button
                  variant={mode === 'premise' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('premise')}
                  className="text-xs"
                >
                  From Premise
                </Button>
                <Button
                  variant={mode === 'outline' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('outline')}
                  className="text-xs"
                >
                  From Outline
                </Button>
              </div>

              {mode === 'premise' ? (
                <div className="space-y-2">
                  <Label htmlFor="premise">Scene Premise</Label>
                  <Textarea
                    id="premise"
                    placeholder="e.g. A tense interrogation between detective RILEY and suspect MARCO in a dimly lit room."
                    value={premise}
                    onChange={(e) => setPremise(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="outline">Scene Outline</Label>
                  <Textarea
                    id="outline"
                    placeholder={"1. RILEY enters the room, drops a file on the table\n2. MARCO stays silent, fidgeting\n3. RILEY reveals key evidence\n4. MARCO breaks down and confesses"}
                    value={outline}
                    onChange={(e) => setOutline(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Scene Length</Label>
                  <Select value={sceneLength} onValueChange={setSceneLength}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCENE_LENGTHS.map(l => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {existingCharacters.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Users size={14} />
                    Include Characters
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {existingCharacters.map(c => (
                      <label key={c} className="flex items-center gap-1.5 cursor-pointer">
                        <Checkbox
                          checked={selectedChars.includes(c)}
                          onCheckedChange={() => toggleChar(c)}
                        />
                        <span className="text-xs font-medium">{c}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleGenerate} disabled={generating || !(mode === 'premise' ? premise.trim() : outline.trim())} className="gap-2">
                {generating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                {generating ? 'Generating...' : 'Generate Scene'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wand2 size={18} className="text-blue-600" />
                Generated Scene Preview
              </DialogTitle>
              <DialogDescription>
                {generatedBlocks.length} blocks generated. Review and insert into your script.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[400px] border rounded-lg bg-white p-6">
              <div className="font-screenplay text-[11pt] leading-normal space-y-0 text-black">
                {generatedBlocks.map((block) => {
                  const style = (() => {
                    switch (block.type) {
                      case 'slugline': return 'uppercase font-bold mt-6 mb-2';
                      case 'character': return 'uppercase font-bold mt-4 mb-0 ml-[2.2in] mr-[1.4in]';
                      case 'dialogue': return 'mb-3 ml-[1in] mr-[1.5in]';
                      case 'parenthetical': return 'italic mb-0 ml-[1.6in] mr-[2in]';
                      case 'transition': return 'uppercase font-bold mt-4 mb-3 text-right';
                      case 'action': return 'mb-3';
                      default: return 'mb-2';
                    }
                  })();

                  return (
                    <div key={block.id} className="flex items-start gap-2">
                      <Badge variant="outline" className={cn("text-[8px] font-bold uppercase shrink-0 mt-0.5 w-12 justify-center", typeColors[block.type])}>
                        {block.type === 'slugline' ? 'SCN' : block.type === 'parenthetical' ? 'PAR' : block.type.substring(0, 4).toUpperCase()}
                      </Badge>
                      <p className={cn("flex-1", style)}>{block.content}</p>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowPreview(false)} className="gap-2">
                <RotateCcw size={14} />
                Regenerate
              </Button>
              <Button onClick={handleInsert} className="gap-2">
                <Plus size={16} />
                Insert into Script
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SceneGeneratorModal;
