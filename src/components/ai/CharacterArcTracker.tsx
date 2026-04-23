"use client";

import React, { useState } from 'react';
import { Activity, Loader2, User } from 'lucide-react';
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
      `You are a character development analyst. Your job is to track how characters evolve emotionally throughout a screenplay.

TASK: Analyze the emotional journey of each character across scenes. For each character, identify key emotional beats - moments where their feelings, goals, or conflicts shift.

For each character, return a JSON object with:
- "character": the character's name
- "arc": array of 3-6 emotional beat points, each with:
  - "scene": the scene heading (e.g., "INT. OFFICE - DAY")
  - "emotion": primary emotion (happy, sad, angry, fearful, determined, confused, hopeful, desperate)
  - "intensity": 0-100 how intense this moment is
  - "goal": what the character wants in this moment
  - "conflict": what's stopping them
- "summary": one sentence describing their overall emotional journey

EXAMPLE OUTPUT:
[{"character":"JOHN","arc":[{"scene":"INT. OFFICE - DAY","emotion":"determined","intensity":75,"goal":"Get the promotion","conflict":"Rival colleague competing"}],"summary":"John's confidence grows as he overcomes professional obstacles."}]

CRITICAL: Return ONLY valid JSON array. No markdown fences.`,
      scriptText,
      0.5
    );

    setAnalyzing(false);

    if (error) {
      showError(error === 'NO_API_KEY' ? 'Set up your API key in Settings > AI' : error);
      return;
    }

    const parsed = extractJSONFromResponse(text);
    if (Array.isArray(parsed)) {
      setArcs(parsed);
      if (parsed.length > 0) setSelectedChar(parsed[0].character);
    } else {
      console.error('[CharacterArcTracker] Failed to parse:', text?.substring(0, 200));
      showError("Failed to parse character arc data. Please try again.");
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
