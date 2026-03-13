"use client";

import React, { useState } from 'react';
import { Users, Loader2, ArrowLeft, Sparkles } from 'lucide-react';
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

interface CastingProfile {
  archetype: string;
  ageRange: string;
  physicalDescription: string;
  personality: string;
  actorComparisons: string[];
  castingNotes: string;
}

interface CastingSuggestionsProps {
  blocks: ScriptBlock[];
  characters: string[];
}

const CastingSuggestions = ({ blocks, characters }: CastingSuggestionsProps) => {
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [profile, setProfile] = useState<CastingProfile | null>(null);
  const [cache, setCache] = useState<Record<string, CastingProfile>>({});

  const analyzeCharacter = async (name: string) => {
    setSelectedChar(name);

    if (cache[name]) {
      setProfile(cache[name]);
      return;
    }

    setAnalyzing(true);
    setProfile(null);

    const charDialogue = blocks
      .reduce((acc, b, i) => {
        if (b.type === 'character' && b.content.toUpperCase() === name.toUpperCase()) {
          const nextBlock = blocks[i + 1];
          if (nextBlock && nextBlock.type === 'dialogue') {
            acc.push(nextBlock.content);
          }
        }
        return acc;
      }, [] as string[]);

    const charActions = blocks
      .filter(b => b.type === 'action' && b.content.toUpperCase().includes(name.toUpperCase()))
      .map(b => b.content);

    const { text, error } = await aiPrompt(
      `You are an expert Hollywood casting director. Analyze this character and provide casting suggestions.

Character name: ${name}
Their dialogue lines: ${charDialogue.join(' | ') || 'None found'}
Action lines mentioning them: ${charActions.join(' | ') || 'None found'}

Return a JSON object with:
- "archetype": the character archetype (e.g. "The Reluctant Hero", "Femme Fatale", "Wise Mentor")
- "ageRange": suggested age range (e.g. "30-45")
- "physicalDescription": suggested physical characteristics based on their role
- "personality": key personality traits inferred from dialogue and actions
- "actorComparisons": array of 3 real actor names whose style fits this character (e.g. ["Oscar Isaac", "Pedro Pascal", "Dev Patel"])
- "castingNotes": brief professional casting notes for auditions

Return ONLY valid JSON object, no markdown fences.`,
      `Analyze character: ${name}`,
      0.6
    );

    setAnalyzing(false);

    if (error) {
      showError(error === 'NO_API_KEY' ? 'Set up your API key in Settings > AI' : error);
      return;
    }

    try {
      const parsed = JSON.parse(text.trim());
      setProfile(parsed);
      setCache(prev => ({ ...prev, [name]: parsed }));
    } catch {
      showError("Failed to parse casting results.");
    }
  };

  if (characters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <Users size={32} className="text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No characters in script yet.</p>
      </div>
    );
  }

  if (!selectedChar) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-orange-500" />
          <h3 className="text-xs font-black uppercase tracking-widest">Casting</h3>
        </div>
        <p className="text-xs text-muted-foreground">Select a character to get AI casting suggestions:</p>
        <div className="space-y-2">
          {characters.map(name => (
            <button
              key={name}
              className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors flex items-center gap-3"
              onClick={() => analyzeCharacter(name)}
            >
              <div className="h-9 w-9 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-xs font-bold text-orange-700 dark:text-orange-400">
                {name.substring(0, 2)}
              </div>
              <div>
                <span className="text-sm font-semibold">{name}</span>
                {cache[name] && (
                  <p className="text-[10px] text-muted-foreground">{cache[name].archetype}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setSelectedChar(null); setProfile(null); }}>
          <ArrowLeft size={14} />
        </Button>
        <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-xs font-bold text-orange-700 dark:text-orange-400">
          {selectedChar.substring(0, 2)}
        </div>
        <h3 className="text-xs font-black uppercase tracking-widest">{selectedChar}</h3>
      </div>

      {analyzing && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {profile && !analyzing && (
        <ScrollArea className="max-h-[500px]">
          <div className="space-y-4">
            <div className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles size={12} className="text-orange-500" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Archetype</p>
              </div>
              <p className="text-sm font-semibold">{profile.archetype}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="border rounded-lg p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Age Range</p>
                <p className="text-sm font-semibold">{profile.ageRange}</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Physical</p>
                <p className="text-xs">{profile.physicalDescription}</p>
              </div>
            </div>

            <div className="border rounded-lg p-3 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Personality</p>
              <p className="text-xs">{profile.personality}</p>
            </div>

            <div className="border rounded-lg p-3 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Think Actors Like</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.actorComparisons?.map((actor, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{actor}</Badge>
                ))}
              </div>
            </div>

            <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Casting Notes</p>
              <p className="text-xs italic">{profile.castingNotes}</p>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="w-full h-8 text-xs"
              onClick={() => analyzeCharacter(selectedChar)}
            >
              Re-analyze
            </Button>
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default CastingSuggestions;
