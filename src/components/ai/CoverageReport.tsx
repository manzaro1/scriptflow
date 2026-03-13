"use client";

import React, { useState, useRef } from 'react';
import { FileText, Loader2, Printer, Copy, Star } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { aiPrompt } from "@/utils/ai-client";
import { showError, showSuccess } from "@/utils/toast";

interface ScriptBlock {
  id: string;
  type: string;
  content: string;
}

interface CoverageData {
  title: string;
  genre: string;
  premise: string;
  structure: {
    actOne: string;
    actTwo: string;
    actThree: string;
  };
  characters: {
    name: string;
    assessment: string;
    strength: number;
  }[];
  dialogueQuality: number;
  dialogueNotes: string;
  theme: string;
  marketability: number;
  overallRating: number;
  recommend: 'PASS' | 'CONSIDER' | 'RECOMMEND';
  synopsis: string;
  strengths: string[];
  weaknesses: string[];
}

interface CoverageReportProps {
  blocks: ScriptBlock[];
  scriptTitle?: string;
}

const RECOMMEND_COLORS = {
  PASS: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CONSIDER: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  RECOMMEND: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const CoverageReport = ({ blocks, scriptTitle }: CoverageReportProps) => {
  const [generating, setGenerating] = useState(false);
  const [coverage, setCoverage] = useState<CoverageData | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const generateCoverage = async () => {
    if (blocks.length === 0) {
      showError("No script content to analyze.");
      return;
    }

    setGenerating(true);
    setCoverage(null);

    const scriptText = blocks.map((b, i) => `[${b.type}] ${b.content}`).join('\n');

    const { text, error } = await aiPrompt(
      `You are a professional Hollywood script reader. Generate a comprehensive coverage report for this screenplay.

Return a JSON object with:
- "title": the script title (infer from content or use "${scriptTitle || 'Untitled'}")
- "genre": primary genre
- "premise": 1-2 sentence premise/logline
- "structure": { "actOne": "brief act 1 summary", "actTwo": "brief act 2 summary", "actThree": "brief act 3 summary" }
- "characters": array of { "name": "character name", "assessment": "brief character analysis", "strength": 1-100 }
- "dialogueQuality": 1-100 rating
- "dialogueNotes": brief notes on dialogue quality
- "theme": main thematic elements
- "marketability": 1-10 rating
- "overallRating": 1-10 rating
- "recommend": one of "PASS", "CONSIDER", "RECOMMEND"
- "synopsis": 3-5 sentence plot synopsis
- "strengths": array of 2-4 key strengths
- "weaknesses": array of 2-4 areas for improvement

Be honest but constructive. Return ONLY valid JSON, no markdown fences.`,
      scriptText,
      0.5
    );

    setGenerating(false);

    if (error) {
      showError(error === 'NO_API_KEY' ? 'Set up your API key in Settings > AI' : error);
      return;
    }

    try {
      const parsed = JSON.parse(text.trim());
      setCoverage(parsed);
    } catch {
      showError("Failed to parse coverage report.");
    }
  };

  const handlePrint = () => {
    if (!reportRef.current) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html><head><title>Coverage Report - ${coverage?.title}</title>
        <style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:20px;color:#222}
        h1{font-size:24px;border-bottom:2px solid #333;padding-bottom:8px}
        h2{font-size:16px;color:#555;margin-top:24px;text-transform:uppercase;letter-spacing:1px}
        .badge{display:inline-block;padding:4px 12px;border-radius:4px;font-weight:bold;font-size:14px}
        .recommend{background:#22c55e;color:white}.consider{background:#f59e0b;color:white}.pass{background:#ef4444;color:white}
        .rating{font-size:32px;font-weight:bold}.meta{color:#666;font-size:14px}
        ul{padding-left:20px}li{margin-bottom:4px}
        .bar{height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden}.bar-fill{height:100%;border-radius:4px}
        </style></head><body>${reportRef.current.innerHTML}</body></html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleCopy = () => {
    if (!coverage) return;
    const text = `COVERAGE REPORT: ${coverage.title}
Genre: ${coverage.genre}
Recommendation: ${coverage.recommend}
Overall Rating: ${coverage.overallRating}/10
Marketability: ${coverage.marketability}/10

PREMISE: ${coverage.premise}

SYNOPSIS: ${coverage.synopsis}

STRUCTURE:
Act I: ${coverage.structure.actOne}
Act II: ${coverage.structure.actTwo}
Act III: ${coverage.structure.actThree}

CHARACTERS:
${coverage.characters.map(c => `- ${c.name}: ${c.assessment}`).join('\n')}

DIALOGUE: ${coverage.dialogueQuality}/100 — ${coverage.dialogueNotes}

THEME: ${coverage.theme}

STRENGTHS: ${coverage.strengths.join(', ')}
WEAKNESSES: ${coverage.weaknesses.join(', ')}`;

    navigator.clipboard.writeText(text);
    showSuccess("Coverage report copied!");
  };

  const ratingColor = (val: number, max: number) => {
    const pct = val / max;
    if (pct >= 0.7) return 'bg-green-500';
    if (pct >= 0.4) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-violet-500" />
          <h3 className="text-xs font-black uppercase tracking-widest">Coverage</h3>
        </div>
        <Button size="sm" onClick={generateCoverage} disabled={generating} className="h-7 text-xs gap-1.5">
          {generating ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
          {generating ? 'Generating...' : coverage ? 'Regenerate' : 'Generate Coverage'}
        </Button>
      </div>

      {!coverage && !generating && (
        <p className="text-xs text-muted-foreground text-center py-8">
          Generate a professional Hollywood-style coverage report with ratings, synopsis, character analysis, and marketability assessment.
        </p>
      )}

      {generating && (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Reading your script...</p>
        </div>
      )}

      {coverage && !generating && (
        <ScrollArea className="max-h-[550px]">
          <div ref={reportRef} className="space-y-4">
            {/* Header */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold">{coverage.title}</p>
                  <p className="text-xs text-muted-foreground">{coverage.genre}</p>
                </div>
                <Badge className={`text-xs font-bold ${RECOMMEND_COLORS[coverage.recommend]}`}>
                  {coverage.recommend}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center border rounded p-2">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Overall</p>
                  <p className="text-lg font-black">{coverage.overallRating}<span className="text-xs text-muted-foreground">/10</span></p>
                </div>
                <div className="text-center border rounded p-2">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Market</p>
                  <p className="text-lg font-black">{coverage.marketability}<span className="text-xs text-muted-foreground">/10</span></p>
                </div>
              </div>
            </div>

            {/* Premise */}
            <div className="border rounded-lg p-3 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Premise</p>
              <p className="text-xs">{coverage.premise}</p>
            </div>

            {/* Synopsis */}
            <div className="border rounded-lg p-3 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Synopsis</p>
              <p className="text-xs">{coverage.synopsis}</p>
            </div>

            {/* Structure */}
            <div className="border rounded-lg p-3 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Structure</p>
              {['actOne', 'actTwo', 'actThree'].map((act, i) => (
                <div key={act} className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground">Act {i + 1}</p>
                  <p className="text-xs">{coverage.structure[act as keyof typeof coverage.structure]}</p>
                  {i < 2 && <Separator className="my-1" />}
                </div>
              ))}
            </div>

            {/* Characters */}
            <div className="border rounded-lg p-3 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Characters</p>
              {coverage.characters?.map((c, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">{c.name}</p>
                    <span className="text-[10px] text-muted-foreground">{c.strength}%</span>
                  </div>
                  <div className="bar h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${ratingColor(c.strength, 100)}`} style={{ width: `${c.strength}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{c.assessment}</p>
                </div>
              ))}
            </div>

            {/* Dialogue */}
            <div className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Dialogue Quality</p>
                <span className="text-xs font-bold">{coverage.dialogueQuality}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${ratingColor(coverage.dialogueQuality, 100)}`} style={{ width: `${coverage.dialogueQuality}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground">{coverage.dialogueNotes}</p>
            </div>

            {/* Theme */}
            <div className="border rounded-lg p-3 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Theme</p>
              <p className="text-xs">{coverage.theme}</p>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-2 gap-2">
              <div className="border rounded-lg p-3 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-green-600">Strengths</p>
                {coverage.strengths?.map((s, i) => (
                  <p key={i} className="text-[10px] flex items-start gap-1">
                    <Star size={10} className="text-green-500 shrink-0 mt-0.5" />
                    {s}
                  </p>
                ))}
              </div>
              <div className="border rounded-lg p-3 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">Weaknesses</p>
                {coverage.weaknesses?.map((w, i) => (
                  <p key={i} className="text-[10px] flex items-start gap-1">
                    <span className="text-red-400 shrink-0">-</span>
                    {w}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4 pt-3 border-t">
            <Button size="sm" variant="outline" onClick={handlePrint} className="flex-1 h-8 text-xs gap-1.5">
              <Printer size={12} /> Print
            </Button>
            <Button size="sm" variant="outline" onClick={handleCopy} className="flex-1 h-8 text-xs gap-1.5">
              <Copy size={12} /> Copy
            </Button>
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default CoverageReport;
