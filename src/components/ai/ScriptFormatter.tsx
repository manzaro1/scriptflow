"use client";

import React, { useState } from 'react';
import { AlignLeft, Loader2, CheckCircle2, ChevronDown, ChevronUp, Check, ChevronsUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { aiPrompt } from "@/utils/ai-client";
import { showError, showSuccess } from "@/utils/toast";

interface ScriptBlock {
  id: string;
  type: string;
  content: string;
}

interface FormatIssue {
  blockIndex: number;
  currentType: string;
  suggestedType: string;
  issue: string;
  fixedContent: string;
}

interface ScriptFormatterProps {
  blocks: ScriptBlock[];
  onFixBlock?: (blockIndex: number, newType: string, newContent: string) => void;
  onFixAll?: (fixes: { blockIndex: number; newType: string; newContent: string }[]) => void;
}

const ScriptFormatter = ({ blocks, onFixBlock, onFixAll }: ScriptFormatterProps) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [issues, setIssues] = useState<FormatIssue[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [fixedIndices, setFixedIndices] = useState<Set<number>>(new Set());

  const runAnalysis = async () => {
    if (blocks.length === 0) {
      showError("No script content to analyze.");
      return;
    }

    setAnalyzing(true);
    setIssues([]);
    setFixedIndices(new Set());

    const scriptText = blocks.map((b, i) => `[${i}:${b.type}] ${b.content}`).join('\n');

    const { text, error } = await aiPrompt(
      `You are an expert screenplay formatting specialist. Analyze the following script for formatting issues.

Each block is prefixed with [index:type]. Valid types are: action, character, dialogue, slugline, parenthetical, transition.

Return a JSON array of formatting issues. Each item must have:
- "blockIndex": the block number with the issue
- "currentType": the current element type
- "suggestedType": what the type should be (must be one of: action, character, dialogue, slugline, parenthetical, transition)
- "issue": short description of the formatting problem
- "fixedContent": the corrected content text (properly formatted)

Look for:
- Wrong element types (e.g. a slugline typed as action, dialogue as action)
- Character names that should be uppercase
- Scene headings missing INT./EXT. prefix
- Inconsistent character name spelling across the script
- Parentheticals not in proper format
- Transitions not uppercase
- Missing or misplaced elements (dialogue without a character heading)

Return ONLY valid JSON array, no markdown fences. If no issues found, return [].`,
      scriptText,
      0.3
    );

    setAnalyzing(false);
    setHasRun(true);

    if (error) {
      showError(error === 'NO_API_KEY' ? 'Set up your API key in Settings > AI' : error);
      return;
    }

    try {
      const parsed = JSON.parse(text.trim());
      if (Array.isArray(parsed)) {
        setIssues(parsed);
      }
    } catch {
      showError("Failed to parse formatting results.");
    }
  };

  const handleFix = (issue: FormatIssue, idx: number) => {
    if (onFixBlock) {
      onFixBlock(issue.blockIndex, issue.suggestedType, issue.fixedContent);
      setFixedIndices(prev => new Set(prev).add(idx));
      showSuccess("Fixed!");
    }
  };

  const handleFixAll = () => {
    if (onFixAll) {
      const unfixed = issues.filter((_, i) => !fixedIndices.has(i));
      onFixAll(unfixed.map(issue => ({
        blockIndex: issue.blockIndex,
        newType: issue.suggestedType,
        newContent: issue.fixedContent,
      })));
      setFixedIndices(new Set(issues.map((_, i) => i)));
      showSuccess(`Fixed ${unfixed.length} issues!`);
    }
  };

  const unfixedCount = issues.filter((_, i) => !fixedIndices.has(i)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlignLeft size={16} className="text-indigo-500" />
          <h3 className="text-xs font-black uppercase tracking-widest">Formatter</h3>
        </div>
        <Button size="sm" onClick={runAnalysis} disabled={analyzing} className="h-7 text-xs gap-1.5">
          {analyzing ? <Loader2 size={12} className="animate-spin" /> : <AlignLeft size={12} />}
          {analyzing ? 'Checking...' : hasRun ? 'Re-check' : 'Check Formatting'}
        </Button>
      </div>

      {!hasRun && !analyzing && (
        <p className="text-xs text-muted-foreground text-center py-8">
          Analyze your script for formatting issues: wrong element types, inconsistent character names, missing sluglines, and more.
        </p>
      )}

      {hasRun && issues.length === 0 && !analyzing && (
        <div className="text-center py-8 space-y-2">
          <CheckCircle2 size={32} className="mx-auto text-green-500" />
          <p className="text-sm font-medium">Formatting looks perfect!</p>
          <p className="text-xs text-muted-foreground">No formatting issues detected.</p>
        </div>
      )}

      {issues.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {unfixedCount} issue{unfixedCount !== 1 ? 's' : ''} remaining
            </Badge>
            {unfixedCount > 0 && onFixAll && (
              <Button size="sm" variant="outline" onClick={handleFixAll} className="h-7 text-xs gap-1.5">
                <ChevronsUp size={12} />
                Fix All
              </Button>
            )}
          </div>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-2">
              {issues.map((issue, i) => {
                const isFixed = fixedIndices.has(i);
                return (
                  <div
                    key={i}
                    className={`border rounded-lg p-3 space-y-2 transition-colors cursor-pointer ${isFixed ? 'opacity-50 bg-green-50 dark:bg-green-900/10' : 'hover:bg-muted/30'}`}
                    onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        {isFixed ? (
                          <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
                        ) : (
                          <AlignLeft size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold">{issue.issue}</p>
                          <div className="flex gap-1.5 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-[9px]">Block #{issue.blockIndex}</Badge>
                            <Badge variant="outline" className="text-[9px]">{issue.currentType} → {issue.suggestedType}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!isFixed && onFixBlock && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={(e) => { e.stopPropagation(); handleFix(issue, i); }}
                          >
                            <Check size={12} />
                          </Button>
                        )}
                        {expandedIdx === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </div>
                    {expandedIdx === i && (
                      <div className="pl-6 pt-2 border-t space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Suggested fix:</p>
                        <p className="text-xs font-mono bg-muted/50 rounded p-2">{issue.fixedContent}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
};

export default ScriptFormatter;
