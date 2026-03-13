"use client";

import React, { useState } from 'react';
import { Loader2, Globe, Copy, Download, Check, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { aiPrompt } from "@/utils/ai-client";
import { showError, showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";

interface ScriptBlock {
  id: string;
  type: string;
  content: string;
}

const LANGUAGES = [
  { code: 'es', label: 'Spanish', native: 'Espanol' },
  { code: 'fr', label: 'French', native: 'Francais' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'zh', label: 'Mandarin', native: 'Chinese' },
  { code: 'ja', label: 'Japanese', native: 'Japanese' },
  { code: 'ko', label: 'Korean', native: 'Korean' },
  { code: 'pt', label: 'Portuguese', native: 'Portugues' },
  { code: 'it', label: 'Italian', native: 'Italiano' },
  { code: 'hi', label: 'Hindi', native: 'Hindi' },
  { code: 'ar', label: 'Arabic', native: 'Arabic' },
];

const BLOCK_STYLES: Record<string, string> = {
  slugline: 'uppercase font-bold text-amber-700 dark:text-amber-400',
  action: '',
  character: 'uppercase font-bold text-violet-700 dark:text-violet-400',
  dialogue: 'ml-4',
  parenthetical: 'italic ml-6 text-muted-foreground',
  transition: 'uppercase font-bold text-right text-amber-700 dark:text-amber-400',
};

interface TranslationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  blocks: ScriptBlock[];
  scriptTitle: string;
  onApplyTranslation: (newBlocks: ScriptBlock[]) => void;
}

const TranslationModal = ({ isOpen, onOpenChange, blocks, scriptTitle, onApplyTranslation }: TranslationModalProps) => {
  const [language, setLanguage] = useState<string>('');
  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState<ScriptBlock[]>([]);
  const [progress, setProgress] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  const translate = async () => {
    if (!language) {
      showError("Select a target language.");
      return;
    }

    if (blocks.length === 0) {
      showError("No script content to translate.");
      return;
    }

    setTranslating(true);
    setTranslated([]);
    setProgress(0);

    const lang = LANGUAGES.find(l => l.code === language);

    // Translate in chunks to handle large scripts
    const chunkSize = 30;
    const chunks: ScriptBlock[][] = [];
    for (let i = 0; i < blocks.length; i += chunkSize) {
      chunks.push(blocks.slice(i, i + chunkSize));
    }

    const allTranslated: ScriptBlock[] = [];

    for (let c = 0; c < chunks.length; c++) {
      const chunk = chunks[c];
      const chunkText = chunk.map(b => `[${b.id}:${b.type}] ${b.content}`).join('\n');

      const { text, error } = await aiPrompt(
        `You are a professional screenplay translator. Translate the following screenplay blocks to ${lang?.label}.

RULES:
- Preserve ALL block types exactly (slugline, action, character, dialogue, parenthetical, transition)
- Preserve block IDs exactly as given
- Character NAMES should remain in their original language (they are proper nouns)
- Slugline location prefixes (INT./EXT.) should remain in English
- Translate all dialogue, action descriptions, and parentheticals
- Maintain the dramatic tone and intent of the original

Return a JSON array of translated blocks. Each block: { "id": "original_id", "type": "original_type", "content": "translated content" }

Return ONLY valid JSON array, no markdown fences.`,
        chunkText,
        0.3
      );

      if (error) {
        setTranslating(false);
        showError(error === 'NO_API_KEY' ? 'Set up your API key in Settings > AI' : error);
        return;
      }

      try {
        const parsed = JSON.parse(text.trim());
        if (Array.isArray(parsed)) {
          allTranslated.push(...parsed);
        }
      } catch {
        setTranslating(false);
        showError("Failed to parse translation chunk.");
        return;
      }

      setProgress(Math.round(((c + 1) / chunks.length) * 100));
    }

    setTranslated(allTranslated);
    setTranslating(false);
  };

  const handleApply = () => {
    setShowConfirm(true);
  };

  const confirmApply = () => {
    onApplyTranslation(translated);
    setShowConfirm(false);
    showSuccess("Translation applied!");
    onOpenChange(false);
  };

  const handleExport = () => {
    const data = {
      title: `${scriptTitle} (${LANGUAGES.find(l => l.code === language)?.label})`,
      language: language,
      blocks: translated,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scriptTitle}_${language}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess("Translation exported!");
  };

  const handleCopy = () => {
    const text = translated.map(b => {
      if (b.type === 'slugline') return `\n${b.content.toUpperCase()}\n`;
      if (b.type === 'character') return `\n\t\t\t${b.content.toUpperCase()}`;
      if (b.type === 'dialogue') return `\t${b.content}`;
      if (b.type === 'parenthetical') return `\t\t(${b.content})`;
      if (b.type === 'transition') return `\n\t\t\t\t\t${b.content.toUpperCase()}`;
      return b.content;
    }).join('\n');
    navigator.clipboard.writeText(text);
    showSuccess("Translated script copied!");
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Globe size={18} className="text-teal-500" />
              Translate Script
            </DialogTitle>
            <DialogDescription>
              Translate your entire screenplay while preserving formatting and character names.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Language Selection */}
            <div className="flex items-center gap-3">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.label} ({lang.native})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Badge variant="outline" className="text-xs">
                {blocks.length} blocks
              </Badge>

              {translated.length === 0 && (
                <Button onClick={translate} disabled={!language || translating} className="gap-2 ml-auto">
                  {translating ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
                  {translating ? 'Translating...' : 'Translate'}
                </Button>
              )}
            </div>

            {/* Progress */}
            {translating && (
              <div className="space-y-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground text-center">{progress}% complete</p>
              </div>
            )}

            {/* Preview */}
            {translated.length > 0 && !translating && (
              <>
                <div className="border rounded-lg">
                  <div className="px-3 py-2 border-b bg-muted/30">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Preview — {LANGUAGES.find(l => l.code === language)?.label}
                    </p>
                  </div>
                  <ScrollArea className="max-h-[300px] p-4">
                    <div className="font-mono text-[11px] space-y-1">
                      {translated.map((b, i) => (
                        <p key={i} className={cn('leading-relaxed', BLOCK_STYLES[b.type])}>
                          {b.content}
                        </p>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="flex justify-between pt-2 border-t">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
                      <Copy size={12} /> Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5 text-xs">
                      <Download size={12} /> Export JSON
                    </Button>
                  </div>
                  <Button size="sm" onClick={handleApply} className="gap-1.5 text-xs">
                    <Check size={12} /> Apply Translation
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              Replace Script Content?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will replace all script content with the {LANGUAGES.find(l => l.code === language)?.label} translation. Your original text will be lost unless you save or export it first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApply}>Apply Translation</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TranslationModal;
