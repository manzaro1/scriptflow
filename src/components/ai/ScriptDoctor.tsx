"use client";

import React, { useState } from 'react';
import { Stethoscope, Loader2, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { aiPrompt } from "@/utils/ai-client";
import { showError } from "@/utils/toast";
import { extractJSONFromResponse } from "@/utils/json-extract";

interface ScriptBlock {
  id: string;
  type: string;
  content: string;
}

interface DiagnosticItem {
  category: string;
  severity: 'high' | 'medium' | 'low';
  issue: string;
  suggestion: string;
  blockIndex?: number;
}

interface ScriptDoctorProps {
  blocks: ScriptBlock[];
  onApplyFix?: (blockIndex: number, newContent: string) => void;
}

const SEVERITY_COLORS = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const ScriptDoctor = ({ blocks, onApplyFix }: ScriptDoctorProps) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const runAnalysis = async () => {
    if (blocks.length === 0) {
      showError("No script content to analyze.");
      return;
    }

    setAnalyzing(true);
    setDiagnostics([]);

    const scriptText = blocks.map((b, i) => `[${i}:${b.type}] ${b.content}`).join('\n');

    const { text, error } = await aiPrompt(
      `You are a professional screenplay DOCTOR - a specialist who diagnoses and treats screenplay problems.

YOUR EXPERTISE:
- Plot structure and story logic
- Pacing and rhythm issues
- Dialogue authenticity and impact
- Character consistency and development
- Format and industry standards

TASK: Examine this screenplay and identify specific, actionable issues. For each issue:
- Pinpoint the exact problem
- Explain WHY it's a problem
- Suggest a concrete fix

Return a JSON array of diagnostics. Each item must have:
- "category": one of "plot", "pacing", "dialogue", "format", "character"
- "severity": "high" (blocks story), "medium" (weakens impact), or "low" (polish needed)
- "issue": one-sentence problem description
- "suggestion": specific actionable fix the writer can apply
- "blockIndex": the block number where the issue occurs (if applicable)

EXAMPLE OUTPUT:
[{"category":"dialogue","severity":"medium","issue":"Dialogue feels on-the-nose","suggestion":"Add subtext - what does the character WANT but not say?","blockIndex":5}]

CRITICAL: Return ONLY valid JSON array. No markdown fences, no explanation.`,
      scriptText,
      0.4
    );

    setAnalyzing(false);
    setHasRun(true);

    if (error) {
      showError(error === 'NO_API_KEY' ? 'Set up your API key in Settings > AI' : error);
      return;
    }

    const parsed = extractJSONFromResponse(text);
    if (Array.isArray(parsed)) {
      setDiagnostics(parsed);
    } else {
      console.error('[ScriptDoctor] Failed to parse:', text?.substring(0, 200));
      showError("Failed to parse analysis results. Please try again.");
    }
  };

  const highCount = diagnostics.filter(d => d.severity === 'high').length;
  const medCount = diagnostics.filter(d => d.severity === 'medium').length;
  const lowCount = diagnostics.filter(d => d.severity === 'low').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope size={16} className="text-emerald-600" />
          <h3 className="text-xs font-black uppercase tracking-widest">Script Doctor</h3>
        </div>
        <Button size="sm" onClick={runAnalysis} disabled={analyzing} className="h-7 text-xs gap-1.5">
          {analyzing ? <Loader2 size={12} className="animate-spin" /> : <Stethoscope size={12} />}
          {analyzing ? 'Analyzing...' : hasRun ? 'Re-analyze' : 'Analyze Script'}
        </Button>
      </div>

      {!hasRun && !analyzing && (
        <p className="text-xs text-muted-foreground text-center py-8">
          Run a comprehensive analysis to find plot holes, pacing issues, dialogue quality problems, and format violations.
        </p>
      )}

      {hasRun && diagnostics.length === 0 && !analyzing && (
        <div className="text-center py-8 space-y-2">
          <CheckCircle2 size={32} className="mx-auto text-green-500" />
          <p className="text-sm font-medium">Script looks great!</p>
          <p className="text-xs text-muted-foreground">No major issues found.</p>
        </div>
      )}

      {diagnostics.length > 0 && (
        <>
          <div className="flex gap-2">
            {highCount > 0 && <Badge className={SEVERITY_COLORS.high}>{highCount} High</Badge>}
            {medCount > 0 && <Badge className={SEVERITY_COLORS.medium}>{medCount} Medium</Badge>}
            {lowCount > 0 && <Badge className={SEVERITY_COLORS.low}>{lowCount} Low</Badge>}
          </div>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-2">
              {diagnostics.map((d, i) => (
                <div
                  key={i}
                  className="border rounded-lg p-3 space-y-2 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <AlertTriangle size={14} className={d.severity === 'high' ? 'text-red-500 shrink-0 mt-0.5' : d.severity === 'medium' ? 'text-amber-500 shrink-0 mt-0.5' : 'text-blue-500 shrink-0 mt-0.5'} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold">{d.issue}</p>
                        <div className="flex gap-1.5 mt-1">
                          <Badge variant="outline" className="text-[9px]">{d.category}</Badge>
                          <Badge className={`text-[9px] ${SEVERITY_COLORS[d.severity]}`}>{d.severity}</Badge>
                        </div>
                      </div>
                    </div>
                    {expandedIdx === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                  {expandedIdx === i && (
                    <div className="pl-6 pt-2 border-t">
                      <p className="text-xs text-muted-foreground">{d.suggestion}</p>
                      {d.blockIndex !== undefined && (
                        <p className="text-[10px] text-muted-foreground mt-1">Block #{d.blockIndex}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
};

export default ScriptDoctor;
