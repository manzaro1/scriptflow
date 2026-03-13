"use client";

import React, { useState } from 'react';
import { Search, Loader2, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Link2Off, Clock, User2, MapPin, HelpCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { aiPrompt } from "@/utils/ai-client";
import { showError } from "@/utils/toast";

interface ScriptBlock {
  id: string;
  type: string;
  content: string;
}

interface PlotHole {
  type: 'timeline' | 'character-behavior' | 'setting' | 'unresolved-thread' | 'logic';
  severity: 'critical' | 'warning' | 'info';
  description: string;
  sceneRef: string;
  suggestion: string;
}

interface PlotHoleDetectorProps {
  blocks: ScriptBlock[];
}

const SEVERITY_COLORS = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  'timeline': <Clock size={14} className="shrink-0 mt-0.5" />,
  'character-behavior': <User2 size={14} className="shrink-0 mt-0.5" />,
  'setting': <MapPin size={14} className="shrink-0 mt-0.5" />,
  'unresolved-thread': <Link2Off size={14} className="shrink-0 mt-0.5" />,
  'logic': <HelpCircle size={14} className="shrink-0 mt-0.5" />,
};

const PlotHoleDetector = ({ blocks }: PlotHoleDetectorProps) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [holes, setHoles] = useState<PlotHole[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const runAnalysis = async () => {
    if (blocks.length === 0) {
      showError("No script content to analyze.");
      return;
    }

    setAnalyzing(true);
    setHoles([]);

    const scriptText = blocks.map((b, i) => `[${i}:${b.type}] ${b.content}`).join('\n');

    const { text, error } = await aiPrompt(
      `You are an expert script continuity supervisor. Analyze the following screenplay for plot holes, continuity errors, and logic gaps.

Return a JSON array of issues found. Each item must have:
- "type": one of "timeline", "character-behavior", "setting", "unresolved-thread", "logic"
- "severity": "critical", "warning", or "info"
- "description": clear description of the plot hole or inconsistency
- "sceneRef": which scene(s) the issue relates to (e.g. "Scene 3" or "Scenes 2 & 5")
- "suggestion": specific actionable fix

Look for:
- Timeline contradictions (events out of order, impossible timing)
- Character behavior inconsistencies (acting out of character without motivation)
- Setting contradictions (details that change between scenes)
- Unresolved threads (setups without payoffs, dangling subplots)
- Logic gaps (things that don't make sense, missing cause-effect)

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
        setHoles(parsed);
      }
    } catch {
      showError("Failed to parse analysis results.");
    }
  };

  const criticalCount = holes.filter(h => h.severity === 'critical').length;
  const warningCount = holes.filter(h => h.severity === 'warning').length;
  const infoCount = holes.filter(h => h.severity === 'info').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search size={16} className="text-red-500" />
          <h3 className="text-xs font-black uppercase tracking-widest">Plot Holes</h3>
        </div>
        <Button size="sm" onClick={runAnalysis} disabled={analyzing} className="h-7 text-xs gap-1.5">
          {analyzing ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
          {analyzing ? 'Scanning...' : hasRun ? 'Re-scan' : 'Detect Plot Holes'}
        </Button>
      </div>

      {!hasRun && !analyzing && (
        <p className="text-xs text-muted-foreground text-center py-8">
          Scan your entire script for timeline contradictions, character inconsistencies, unresolved threads, and logic gaps.
        </p>
      )}

      {hasRun && holes.length === 0 && !analyzing && (
        <div className="text-center py-8 space-y-2">
          <CheckCircle2 size={32} className="mx-auto text-green-500" />
          <p className="text-sm font-medium">No plot holes detected!</p>
          <p className="text-xs text-muted-foreground">Your story is consistent and coherent.</p>
        </div>
      )}

      {holes.length > 0 && (
        <>
          <div className="flex gap-2">
            {criticalCount > 0 && <Badge className={SEVERITY_COLORS.critical}>{criticalCount} Critical</Badge>}
            {warningCount > 0 && <Badge className={SEVERITY_COLORS.warning}>{warningCount} Warning</Badge>}
            {infoCount > 0 && <Badge className={SEVERITY_COLORS.info}>{infoCount} Info</Badge>}
          </div>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-2">
              {holes.map((h, i) => (
                <div
                  key={i}
                  className="border rounded-lg p-3 space-y-2 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {TYPE_ICONS[h.type] || <AlertTriangle size={14} className="shrink-0 mt-0.5" />}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold">{h.description}</p>
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-[9px]">{h.type}</Badge>
                          <Badge className={`text-[9px] ${SEVERITY_COLORS[h.severity]}`}>{h.severity}</Badge>
                          <Badge variant="outline" className="text-[9px] text-muted-foreground">{h.sceneRef}</Badge>
                        </div>
                      </div>
                    </div>
                    {expandedIdx === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                  {expandedIdx === i && (
                    <div className="pl-6 pt-2 border-t">
                      <p className="text-xs text-muted-foreground">{h.suggestion}</p>
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

export default PlotHoleDetector;
