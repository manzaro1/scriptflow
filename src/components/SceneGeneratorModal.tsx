"use client";

import React, { useState } from 'react';
import { Wand2, Loader2, Plus, RotateCcw } from 'lucide-react';
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
import { showError, showSuccess } from "@/utils/toast";
import { callAIFunction, hasGeminiKey } from "@/utils/ai";
import NoApiKeyPrompt from "@/components/NoApiKeyPrompt";
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

const TONES = ['Dramatic', 'Comedy', 'Thriller', 'Horror', 'Sci-Fi', 'Romance', 'Action', 'Mystery'];

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
  const [generating, setGenerating] = useState(false);
  const [generatedBlocks, setGeneratedBlocks] = useState<ScriptBlock[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerate = async () => {
    if (!premise.trim()) {
      showError("Enter a scene premise first");
      return;
    }

    setGenerating(true);
    setGeneratedBlocks([]);

    const { data, error } = await callAIFunction('ai-generate-scene', {
      premise: premise.trim(),
      tone,
      existingCharacters,
    });

    setGenerating(false);

    if (error === 'NO_API_KEY') {
      showError("Set up your Gemini API key in Settings > AI");
      return;
    }
    if (error || !data?.blocks?.length) {
      showError(error || "Failed to generate scene");
      return;
    }

    setGeneratedBlocks(data.blocks);
    setShowPreview(true);
  };

  const handleInsert = () => {
    onInsert(generatedBlocks);
    showSuccess(`Inserted ${generatedBlocks.length} blocks into script`);
    handleClose();
  };

  const handleClose = () => {
    setPremise('');
    setGeneratedBlocks([]);
    setShowPreview(false);
    onOpenChange(false);
  };

  if (!hasGeminiKey()) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[450px]">
          <NoApiKeyPrompt />
        </DialogContent>
      </Dialog>
    );
  }

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
              <div className="space-y-2">
                <Label htmlFor="premise">Scene Premise</Label>
                <Textarea
                  id="premise"
                  placeholder="e.g. A tense interrogation between detective RILEY and suspect MARCO in a dimly lit room. MARCO knows more than he's letting on."
                  value={premise}
                  onChange={(e) => setPremise(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>

              <div className="flex items-end gap-4">
                <div className="space-y-2 flex-1">
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
                {existingCharacters.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Characters in script</Label>
                    <div className="flex flex-wrap gap-1">
                      {existingCharacters.slice(0, 6).map(c => (
                        <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                      ))}
                      {existingCharacters.length > 6 && (
                        <Badge variant="outline" className="text-[10px]">+{existingCharacters.length - 6}</Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleGenerate} disabled={generating || !premise.trim()} className="gap-2">
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
