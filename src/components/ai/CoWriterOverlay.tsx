"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { aiPrompt } from "@/utils/ai-client";
import { loadAIConfig } from "@/utils/ai-providers";

interface ScriptBlock {
  id: string;
  type: string;
  content: string;
}

interface CoWriterOverlayProps {
  blocks: ScriptBlock[];
  focusedBlockId: string | null;
  focusedBlockContent: string;
  characters: string[];
  onAccept: (text: string) => void;
  enabled: boolean;
}

/**
 * Ghost text inline suggestions (like Copilot).
 * Debounced auto-trigger after 2s typing pause.
 * Tab to accept, Escape to dismiss.
 */
const CoWriterOverlay = ({
  blocks,
  focusedBlockId,
  focusedBlockContent,
  characters,
  onAccept,
  enabled,
}: CoWriterOverlayProps) => {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastContentRef = useRef('');

  const clearSuggestion = useCallback(() => {
    setSuggestion(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();
  }, []);

  // Debounced trigger on content change
  useEffect(() => {
    if (!enabled || !focusedBlockId) {
      clearSuggestion();
      return;
    }

    const config = loadAIConfig();
    if (!config.apiKey && config.provider !== 'custom') return;

    // Don't re-trigger if content hasn't changed
    if (focusedBlockContent === lastContentRef.current) return;
    lastContentRef.current = focusedBlockContent;

    // Need at least some content to suggest from
    if (focusedBlockContent.trim().length < 5) {
      clearSuggestion();
      return;
    }

    clearSuggestion();

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      const idx = blocks.findIndex(b => b.id === focusedBlockId);
      const context = blocks.slice(Math.max(0, idx - 5), idx + 1)
        .map(b => `[${b.type}] ${b.content}`)
        .join('\n');

      const currentBlock = blocks[idx];

      const { text, error } = await aiPrompt(
        `You are an AI screenwriting co-writer. Complete the current line naturally in the style of a professional screenplay.
The current block type is: ${currentBlock?.type || 'action'}
Characters in the script: ${characters.join(', ') || 'none yet'}

RULES:
- Continue the CURRENT line only, don't start new lines
- Keep completions short (5-20 words)
- Match the tone and style of the surrounding context
- Return ONLY the completion text, nothing else`,
        `Context:\n${context}\n\nComplete this line: "${focusedBlockContent}"`,
        0.7
      );

      setLoading(false);

      if (!error && text.trim()) {
        setSuggestion(text.trim());
      }
    }, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [focusedBlockContent, focusedBlockId, enabled, blocks, characters, clearSuggestion]);

  // Keyboard handler for Tab (accept) and Escape (dismiss)
  useEffect(() => {
    if (!suggestion) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && suggestion) {
        e.preventDefault();
        onAccept(suggestion);
        setSuggestion(null);
      } else if (e.key === 'Escape') {
        setSuggestion(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [suggestion, onAccept]);

  // Clear on block change
  useEffect(() => {
    clearSuggestion();
  }, [focusedBlockId, clearSuggestion]);

  if (!suggestion && !loading) return null;

  return (
    <span className="pointer-events-none select-none">
      {loading && (
        <span className="text-muted-foreground/30 animate-pulse">···</span>
      )}
      {suggestion && (
        <span className="text-muted-foreground/40 italic">
          {suggestion}
          <span className="text-[9px] ml-2 bg-muted/50 rounded px-1 py-0.5 not-italic text-muted-foreground/50">
            Tab ↵
          </span>
        </span>
      )}
    </span>
  );
};

export default CoWriterOverlay;
