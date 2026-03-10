"use client";

import React, { useState } from 'react';
import { Activity, Loader2, User } from 'lucide-react';
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

interface ArcPoint {
  scene: string;
  emotion: string;
  intensity: number; // 0-100
  goal: string;
  conflict: string;
}

interface CharacterArc {
  character: string;
  arc: ArcPoint[];
  summary: string;
}

interface CharacterArcTrackerProps {
  blocks: ScriptBlock[];
  characters: string[];
}

const EMOTION_COLORS: Record<string, string> = {
  happy: '#22c55e',
  sad: '#3b82f6',
  angry: '#ef4444',
  fearful: '#f59e0b',
  determined: '#8b5cf6',
  confused: '#6b7280',
  hopeful: '#14b8a6',
  desperate: '#f97316',
};

const CharacterArcTracker = ({ blocks, characters }: CharacterArcTrackerProps) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [arcs, setArcs] = useState<CharacterArc[]>([]);
  const [selectedChar, setSelectedChar] = useState<string | null>(null);

  const analyze = async () => {
    if (characters.length === 0) {
      showError("No characters found in script.");
      return;
    }

    setAnalyzing(true);

    const scriptText = blocks.map((b, i) => `[${b.type}] ${b.content}`).join('\n');
    const charList = characters.slice(0, 8).join(', ');

    const { text, error } = await aiPrompt(
      `You are a character development analyst. Analyze the emotional arcs of these characters: ${charList}

For each character, identify 3-6 key emotional beats across the script. Return a JSON array where each item has:
- "character": character name
- "arc": array of { "scene": scene heading, "emotion": one of happy/sad/angry/fearful/determined/confused/hopeful/desperate, "intensity": 0-100, "goal": what they want, "conflict": what blocks them }
- "summary": 1-sentence arc summary

Return ONLY valid JSON array, no markdown fences.`,
      scriptText,
      0.5
    );

    setAnalyzing(false);

    if (error) {
      showError(error === 'NO_API_KEY' ? 'Set up your API key in Settings > AI' : error);
      return;
    }

    try {
      const parsed = JSON.parse(text.trim());
      if (Array.isArray(parsed)) {
        setArcs(parsed);
        if (parsed.length > 0) setSelectedChar(parsed[0].character);
      }
    } catch {
      showError("Failed to parse character arc data.");
    }
  };

  const selectedArc = arcs.find(a => a.character === selectedChar);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-violet-600" />
          <h3 className="text-xs font-black uppercase tracking-widest">Character Arcs</h3>
        </div>
        <Button size="sm" onClick={analyze} disabled={analyzing} className="h-7 text-xs gap-1.5">
          {analyzing ? <Loader2 size={12} className="animate-spin" /> : <Activity size={12} />}
          {analyzing ? 'Tracking...' : arcs.length ? 'Re-track' : 'Track Arcs'}
        </Button>
      </div>

      {arcs.length === 0 && !analyzing && (
        <p className="text-xs text-muted-foreground text-center py-8">
          Track how your characters evolve emotionally across scenes. Visualize their goals, conflicts, and development.
        </p>
      )}

      {arcs.length > 0 && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {arcs.map(a => (
              <button
                key={a.character}
                onClick={() => setSelectedChar(a.character)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                  selectedChar === a.character
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <User size={10} />
                {a.character}
              </button>
            ))}
          </div>

          {selectedArc && (
            <ScrollArea className="max-h-[450px]">
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground italic">{selectedArc.summary}</p>

                {/* Arc visualization */}
                <div className="relative py-4">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
                  {selectedArc.arc.map((point, i) => {
                    const color = EMOTION_COLORS[point.emotion] || '#6b7280';
                    return (
                      <div key={i} className="relative pl-8 pb-4 last:pb-0">
                        <div
                          className="absolute left-1 top-1 w-5 h-5 rounded-full border-2 bg-background flex items-center justify-center"
                          style={{ borderColor: color }}
                        >
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        </div>
                        <div className="border rounded-lg p-3 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground truncate">{point.scene}</p>
                            <Badge variant="outline" className="text-[9px] shrink-0" style={{ color, borderColor: color }}>
                              {point.emotion}
                            </Badge>
                          </div>
                          {/* Intensity bar */}
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${point.intensity}%`, backgroundColor: color }}
                            />
                          </div>
                          <p className="text-[10px]"><strong>Goal:</strong> {point.goal}</p>
                          <p className="text-[10px]"><strong>Conflict:</strong> {point.conflict}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          )}
        </>
      )}
    </div>
  );
};

export default CharacterArcTracker;
