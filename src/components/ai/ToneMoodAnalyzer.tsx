"use client";

import React, { useState } from 'react';
import { Palette, Loader2 } from 'lucide-react';
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

interface SceneAnalysis {
  scene: string;
  mood: string;
  tension: number; // 0-100
  pacing: 'slow' | 'medium' | 'fast';
  color: string; // hex color representing mood
  notes: string;
}

interface ToneMoodAnalyzerProps {
  blocks: ScriptBlock[];
}

const PACING_LABELS = {
  slow: { label: 'Slow', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
  medium: { label: 'Medium', color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' },
  fast: { label: 'Fast', color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' },
};

const ToneMoodAnalyzer = ({ blocks }: ToneMoodAnalyzerProps) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [scenes, setScenes] = useState<SceneAnalysis[]>([]);

  const analyze = async () => {
    const sluglines = blocks.filter(b => b.type === 'slugline');
    if (sluglines.length === 0) {
      showError("No scenes found in script.");
      return;
    }

    setAnalyzing(true);

    const scriptText = blocks.map(b => `[${b.type}] ${b.content}`).join('\n');

    const { text, error } = await aiPrompt(
      `You are a cinematographer and director analyzing the emotional texture of a screenplay.

TASK: For each scene in this screenplay, determine:
1. The MOOD - what emotional atmosphere does this scene create?
2. TENSION LEVEL - how much dramatic tension/suspense is present?
3. PACING - how fast or slow does this scene feel?
4. COLOR PALETTE - what colors would visually represent this scene's mood?

Return a JSON array where each item has:
- "scene": the scene heading (e.g., "INT. OFFICE - DAY")
- "mood": 1-2 words describing the emotional atmosphere (e.g., "Tense", "Romantic", "Eerie", "Hopeful", "Desperate", "Peaceful")
- "tension": 0-100 (0 = calm, 100 = maximum suspense)
- "pacing": "slow" (contemplative), "medium" (steady), or "fast" (rapid, urgent)
- "color": hex color that represents the mood (warm colors for positive, cool for negative, dark for intense)
- "notes": one sentence explaining WHY this scene has this tone

EXAMPLE OUTPUT:
[{"scene":"INT. OFFICE - DAY","mood":"Tense","tension":75,"pacing":"fast","color":"#ef4444","notes":"High stakes confrontation creates urgency."}]

CRITICAL: Return ONLY valid JSON array. No markdown fences.`,
      scriptText,
      0.4
    );

    setAnalyzing(false);

    if (error) {
      showError(error === 'NO_API_KEY' ? 'Set up your API key in Settings > AI' : error);
      return;
    }

    const parsed = extractJSONFromResponse(text);
    if (Array.isArray(parsed)) {
      setScenes(parsed);
    } else {
      console.error('[ToneMoodAnalyzer] Failed to parse:', text?.substring(0, 200));
      showError("Failed to parse tone analysis. Please try again.");
    }
  };

  const avgTension = scenes.length > 0 ? Math.round(scenes.reduce((a, s) => a + (s.tension || 0), 0) / scenes.length) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette size={16} className="text-pink-600" />
          <h3 className="text-xs font-black uppercase tracking-widest">Tone & Mood</h3>
        </div>
        <Button size="sm" onClick={analyze} disabled={analyzing} className="h-7 text-xs gap-1.5">
          {analyzing ? <Loader2 size={12} className="animate-spin" /> : <Palette size={12} />}
          {analyzing ? 'Analyzing...' : scenes.length ? 'Re-analyze' : 'Analyze Tone'}
        </Button>
      </div>

      {scenes.length === 0 && !analyzing && (
        <p className="text-xs text-muted-foreground text-center py-8">
          Analyze the emotional tone of each scene. See mood, tension levels, and pacing visualized across your script.
        </p>
      )}

      {scenes.length > 0 && (
        <>
          {/* Tension heatmap bar */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Tension Map (avg: {avgTension}%)</p>
            <div className="flex gap-0.5 h-6 rounded overflow-hidden">
              {scenes.map((s, i) => (
                <div
                  key={i}
                  className="flex-1 transition-all hover:opacity-80 relative group"
                  style={{ backgroundColor: s.color || '#6b7280' }}
                  title={`${s.scene}: ${s.mood} (${s.tension}%)`}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[9px] px-1.5 py-0.5 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {s.mood} — {s.tension}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          <ScrollArea className="max-h-[420px]">
            <div className="space-y-2">
              {scenes.map((s, i) => {
                const pacing = PACING_LABELS[s.pacing] || PACING_LABELS.medium;
                return (
                  <div key={i} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color || '#6b7280' }} />
                        <p className="text-[10px] font-bold uppercase text-muted-foreground truncate">{s.scene}</p>
                      </div>
                      <Badge variant="outline" className="text-[9px] shrink-0">{s.mood}</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[9px] text-muted-foreground">Tension</span>
                          <span className="text-[9px] font-bold">{s.tension}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${s.tension}%`,
                              backgroundColor: s.tension > 70 ? '#ef4444' : s.tension > 40 ? '#f59e0b' : '#22c55e'
                            }}
                          />
                        </div>
                      </div>
                      <Badge className={`text-[9px] ${pacing.color}`}>{pacing.label}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{s.notes}</p>
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

export default ToneMoodAnalyzer;
