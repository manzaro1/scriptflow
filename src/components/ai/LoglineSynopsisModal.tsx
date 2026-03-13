"use client";

import React, { useState } from 'react';
import { Loader2, Copy, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { aiPrompt } from "@/utils/ai-client";
import { showError, showSuccess } from "@/utils/toast";

interface ScriptBlock {
  id: string;
  type: string;
  content: string;
}

interface LoglineSynopsisModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  blocks: ScriptBlock[];
  scriptTitle: string;
}

const LoglineSynopsisModal = ({ isOpen, onOpenChange, blocks, scriptTitle }: LoglineSynopsisModalProps) => {
  const [generating, setGenerating] = useState(false);
  const [logline, setLogline] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);

  const generate = async () => {
    if (blocks.length === 0) {
      showError("No script content to analyze.");
      return;
    }

    setGenerating(true);

    const scriptText = blocks.map(b => `[${b.type}] ${b.content}`).join('\n');

    const { text, error } = await aiPrompt(
      `You are an expert screenwriter and pitch specialist. Generate a logline and synopsis for this screenplay.

Title: "${scriptTitle}"

Return a JSON object with:
- "logline": a compelling 1-sentence logline (25-35 words) that captures the protagonist, their goal, the conflict, and the stakes
- "synopsis": a 3-5 sentence synopsis paragraph covering the beginning, middle, and end of the story

The logline should be marketable and hook-driven. The synopsis should read like a professional pitch document.

Return ONLY valid JSON, no markdown fences.`,
      scriptText,
      0.7
    );

    setGenerating(false);

    if (error) {
      showError(error === 'NO_API_KEY' ? 'Set up your API key in Settings > AI' : error);
      return;
    }

    try {
      const parsed = JSON.parse(text.trim());
      setLogline(parsed.logline || '');
      setSynopsis(parsed.synopsis || '');
      setHasGenerated(true);
    } catch {
      showError("Failed to parse results.");
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showSuccess(`${label} copied!`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            Logline & Synopsis Generator
          </DialogTitle>
          <DialogDescription>
            Generate a professional logline and synopsis from your script.
          </DialogDescription>
        </DialogHeader>

        {!hasGenerated && !generating && (
          <div className="py-8 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              AI will analyze your screenplay and generate a marketable logline and a concise synopsis.
            </p>
            <Button onClick={generate} className="gap-2">
              Generate
            </Button>
          </div>
        )}

        {generating && (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Crafting your pitch...</p>
          </div>
        )}

        {hasGenerated && !generating && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Logline</label>
                <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => copyText(logline, 'Logline')}>
                  <Copy size={10} /> Copy
                </Button>
              </div>
              <Textarea
                value={logline}
                onChange={(e) => setLogline(e.target.value)}
                className="resize-none text-sm min-h-[60px]"
                placeholder="Your logline will appear here..."
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Synopsis</label>
                <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => copyText(synopsis, 'Synopsis')}>
                  <Copy size={10} /> Copy
                </Button>
              </div>
              <Textarea
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                className="resize-none text-sm min-h-[120px]"
                placeholder="Your synopsis will appear here..."
              />
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" size="sm" onClick={generate} className="gap-1.5">
                <RefreshCw size={12} /> Regenerate
              </Button>
              <Button size="sm" onClick={() => { copyText(`LOGLINE: ${logline}\n\nSYNOPSIS: ${synopsis}`, 'Logline & Synopsis'); }}>
                Copy Both
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LoglineSynopsisModal;
