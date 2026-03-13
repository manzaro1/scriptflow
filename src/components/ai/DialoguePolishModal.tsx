"use client";

import React, { useState } from 'react';
import { Loader2, Copy, Check, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { aiPrompt } from "@/utils/ai-client";
import { showError, showSuccess } from "@/utils/toast";

interface ScriptBlock {
  id: string;
  type: string;
  content: string;
}

interface PolishedBlock {
  original: string;
  polished: string;
  blockIndex: number;
}

interface DialoguePolishModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  blocks: ScriptBlock[];
  onApply: (updates: { blockIndex: number; newContent: string }[]) => void;
}

const STYLES = [
  { id: 'tarantino', label: 'Tarantino', desc: 'Snappy, pop-culture laden, tension through mundane conversation' },
  { id: 'sorkin', label: 'Sorkin', desc: 'Rapid-fire walk-and-talk, witty, overlapping rhythm' },
  { id: 'nolan', label: 'Nolan', desc: 'Cerebral, exposition-heavy, philosophical undertones' },
  { id: 'coen', label: 'Coen Bros', desc: 'Dry humor, quirky cadence, darkly comic' },
  { id: 'anderson', label: 'Wes Anderson', desc: 'Deadpan delivery, whimsical, formally polite' },
  { id: 'mamet', label: 'Mamet', desc: 'Staccato, aggressive, repetitive rhythms' },
  { id: 'cody', label: 'Diablo Cody', desc: 'Slang-heavy, irreverent, distinctly modern voice' },
];

const DialoguePolishModal = ({ isOpen, onOpenChange, blocks, onApply }: DialoguePolishModalProps) => {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [polishing, setPolishing] = useState(false);
  const [results, setResults] = useState<PolishedBlock[]>([]);
  const [applied, setApplied] = useState(false);

  const dialogueBlocks = blocks
    .map((b, i) => ({ ...b, originalIndex: i }))
    .filter(b => b.type === 'dialogue');

  const polish = async () => {
    if (!selectedStyle) {
      showError("Select a writing style first.");
      return;
    }

    if (dialogueBlocks.length === 0) {
      showError("No dialogue found in your script.");
      return;
    }

    setPolishing(true);
    setResults([]);
    setApplied(false);

    const style = STYLES.find(s => s.id === selectedStyle);
    const dialogueText = dialogueBlocks.map(b => `[${b.originalIndex}] ${b.content}`).join('\n');

    const { text, error } = await aiPrompt(
      `You are a dialogue specialist channeling the writing style of ${style?.label}.
Style description: ${style?.desc}

Rewrite the following dialogue lines in this writer's distinctive voice. Keep the same meaning and plot points, but transform the cadence, word choice, and rhythm to match the style.

Return a JSON array where each item has:
- "blockIndex": the original block index number
- "original": the original dialogue text
- "polished": the rewritten dialogue in ${style?.label}'s style

Return ONLY valid JSON array, no markdown fences.`,
      dialogueText,
      0.8
    );

    setPolishing(false);

    if (error) {
      showError(error === 'NO_API_KEY' ? 'Set up your API key in Settings > AI' : error);
      return;
    }

    try {
      const parsed = JSON.parse(text.trim());
      if (Array.isArray(parsed)) {
        setResults(parsed);
      }
    } catch {
      showError("Failed to parse polished dialogue.");
    }
  };

  const handleApply = () => {
    const updates = results.map(r => ({
      blockIndex: r.blockIndex,
      newContent: r.polished,
    }));
    onApply(updates);
    setApplied(true);
    showSuccess("Dialogue updated!");
  };

  const handleCopy = () => {
    const text = results.map(r => `ORIGINAL: ${r.original}\nPOLISHED: ${r.polished}`).join('\n\n');
    navigator.clipboard.writeText(text);
    showSuccess("Polished dialogue copied!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles size={18} className="text-purple-500" />
            Dialogue Polish
          </DialogTitle>
          <DialogDescription>
            Rewrite your dialogue in a famous writer's style. {dialogueBlocks.length} dialogue block{dialogueBlocks.length !== 1 ? 's' : ''} found.
          </DialogDescription>
        </DialogHeader>

        {/* Style Selector */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select Style</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STYLES.map(style => (
              <button
                key={style.id}
                className={`p-2 rounded-lg border text-left transition-all ${
                  selectedStyle === style.id
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedStyle(style.id)}
              >
                <p className="text-xs font-semibold">{style.label}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-2">{style.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {results.length === 0 && !polishing && (
          <div className="flex justify-center pt-4">
            <Button onClick={polish} disabled={!selectedStyle || polishing} className="gap-2">
              <Sparkles size={14} />
              Polish Dialogue
            </Button>
          </div>
        )}

        {polishing && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Channeling {STYLES.find(s => s.id === selectedStyle)?.label}...
            </p>
          </div>
        )}

        {results.length > 0 && !polishing && (
          <>
            <ScrollArea className="max-h-[350px]">
              <div className="space-y-3">
                {results.map((r, i) => (
                  <div key={i} className="border rounded-lg p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[9px] font-bold uppercase text-muted-foreground mb-1">Original</p>
                        <p className="text-xs text-muted-foreground">{r.original}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase text-purple-600 mb-1">
                          {STYLES.find(s => s.id === selectedStyle)?.label} Style
                        </p>
                        <p className="text-xs font-medium">{r.polished}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-between pt-2 border-t">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={polish} className="gap-1.5">
                  <Sparkles size={12} /> Re-polish
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
                  <Copy size={12} /> Copy
                </Button>
              </div>
              <Button size="sm" onClick={handleApply} disabled={applied} className="gap-1.5">
                {applied ? <Check size={12} /> : <Sparkles size={12} />}
                {applied ? 'Applied!' : 'Apply to Script'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DialoguePolishModal;
