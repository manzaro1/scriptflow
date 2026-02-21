"use client";

import React, { useState } from 'react';
import { AlertTriangle, Sparkles, MessageSquare, Check, BrainCircuit, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { showError } from "@/utils/toast";
import { callAIFunction, hasGeminiKey } from "@/utils/ai";
import NoApiKeyPrompt from "@/components/NoApiKeyPrompt";
import { motion } from "framer-motion";

interface ScriptBlock {
  id: string;
  type: string;
  content: string;
}

interface Suggestion {
  text: string;
  note: string;
}

interface FeedbackResult {
  score: number;
  feedback: string;
  suggestions: Suggestion[];
}

interface DialogueFeedbackProps {
  characterName: string;
  dialogue: string;
  scriptBlocks: ScriptBlock[];
  blockIndex: number;
  onApplySuggestion: (text: string) => void;
}

const DialogueFeedback = ({ characterName, dialogue, scriptBlocks, blockIndex, onApplySuggestion }: DialogueFeedbackProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FeedbackResult | null>(null);

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !result && !loading) {
      await fetchFeedback();
    }
  };

  const fetchFeedback = async () => {
    if (!hasGeminiKey()) return;

    setLoading(true);
    const startIdx = Math.max(0, blockIndex - 5);
    const endIdx = Math.min(scriptBlocks.length, blockIndex + 6);
    const surroundingBlocks = scriptBlocks.slice(startIdx, endIdx);

    const { data, error } = await callAIFunction<FeedbackResult>('ai-dialogue-feedback', {
      dialogue,
      characterName,
      surroundingBlocks,
    });

    setLoading(false);

    if (error || !data) {
      if (error !== 'NO_API_KEY') {
        showError(error || "Analysis failed");
      }
      return;
    }

    setResult(data);
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const progressColor = (score: number) => {
    if (score >= 80) return '[&>div]:bg-green-500';
    if (score >= 60) return '[&>div]:bg-amber-500';
    return '[&>div]:bg-red-500';
  };

  if (!hasGeminiKey()) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:bg-muted transition-opacity"
            title="AI Suggestions"
          >
            <Sparkles size={14} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3">
          <NoApiKeyPrompt compact />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-6 w-6 p-0 transition-opacity ${
            result && result.score < 70
              ? 'opacity-100 text-red-500 hover:bg-red-500/10'
              : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:bg-muted'
          }`}
          title="AI Dialogue Analysis"
        >
          {result && result.score < 70 ? <AlertTriangle size={14} /> : <Sparkles size={14} />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 space-y-3">
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-2 border-b pb-2">
            <BrainCircuit size={16} className="text-primary" />
            <h4 className="text-sm font-bold">AI Dialogue Analysis</h4>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 py-6">
              <Loader2 size={16} className="animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Analyzing dialogue...</span>
            </div>
          )}

          {result && !loading && (
            <>
              {/* Score */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Consistency Score</span>
                  <span className={`text-sm font-bold ${scoreColor(result.score)}`}>{result.score}%</span>
                </div>
                <Progress value={result.score} className={`h-1.5 ${progressColor(result.score)}`} />
              </div>

              {/* Feedback */}
              <div className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${
                result.score < 70
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                  : 'bg-muted/50 border-border text-muted-foreground'
              }`}>
                {result.score < 70 && <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
                <p className="leading-relaxed">{result.feedback}</p>
              </div>

              {/* Suggestions */}
              {result.suggestions?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Suggestions</p>
                  {result.suggestions.map((s, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs transition-colors ${
                        i === 0 ? 'bg-primary/5 border-primary/20' : 'bg-muted/50 border-border'
                      }`}
                    >
                      <MessageSquare size={14} className="shrink-0 mt-0.5 text-primary" />
                      <div className="flex-1">
                        <p className="leading-relaxed">"{s.text}"</p>
                        {s.note && <p className="text-[10px] text-muted-foreground mt-1">— {s.note}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30"
                        onClick={() => {
                          onApplySuggestion(s.text);
                          setOpen(false);
                          setResult(null);
                        }}
                        title="Apply this suggestion"
                      >
                        <Check size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Re-analyze button */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => { setResult(null); fetchFeedback(); }}
              >
                Re-analyze
              </Button>
            </>
          )}
        </motion.div>
      </PopoverContent>
    </Popover>
  );
};

export default DialogueFeedback;
