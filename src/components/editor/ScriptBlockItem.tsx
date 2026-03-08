"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';
import DialogueFeedback from "@/components/DialogueFeedback";
import { cn } from "@/lib/utils";

interface ScriptBlockItemProps {
  block: any;
  index: number;
  isReadOnly: boolean;
  isFocused: boolean;
  blockRef: (el: HTMLDivElement | null) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onInput: () => void;
  onBlur: () => void;
  onFocus: () => void;
  getCharacterName: () => string;
  onApplySuggestion: (text: string) => void;
  aiLoading: boolean;
  aiSuggestion: string | null;
  isSuggestionTarget: boolean;
  scriptBlocks: any[];
}

const ScriptBlockItem = ({
  block,
  index,
  isReadOnly,
  isFocused,
  blockRef,
  onKeyDown,
  onInput,
  onBlur,
  onFocus,
  getCharacterName,
  onApplySuggestion,
  aiLoading,
  aiSuggestion,
  isSuggestionTarget,
  scriptBlocks
}: ScriptBlockItemProps) => {
  
  const getBlockStyles = (type: string, isFocused: boolean) => {
    const base = "outline-none transition-colors duration-150 min-h-[1.5em] rounded whitespace-pre-wrap font-screenplay text-[12pt] leading-normal relative block w-full";
    const editClass = isReadOnly ? "" : "focus:bg-primary/5";
    const focusBorder = isFocused && !isReadOnly ? "border-l-2" : "border-l-2 border-transparent";

    switch (type) {
      case 'character':
        return cn(base, editClass, focusBorder, isFocused && "border-l-film-violet", "uppercase font-bold mb-0 mt-6 ml-[2.2in] mr-[1.4in] text-left");
      case 'dialogue':
        return cn(base, editClass, focusBorder, isFocused && "border-l-blue-500", "mb-4 relative group ml-[1in] mr-[1.5in] text-left");
      case 'parenthetical':
        return cn(base, editClass, focusBorder, isFocused && "border-l-purple-400", "italic mb-0 ml-[1.6in] mr-[2in] text-left");
      case 'slugline':
        return cn(base, editClass, focusBorder, isFocused && "border-l-film-amber", "uppercase font-bold mb-4 mt-8 text-left");
      case 'transition':
        return cn(base, editClass, focusBorder, isFocused && "border-l-amber-500", "script-block-transition uppercase font-bold mb-4 mt-4 text-right");
      default: // action
        return cn(base, editClass, focusBorder, isFocused && "border-l-muted-foreground/30", "mb-4 text-left");
    }
  };

  return (
    <div className="relative w-full" style={{ direction: 'ltr' }}>
      {isFocused && !isReadOnly && (
        <div className="absolute -left-[1.3in] top-0 text-[8px] font-bold uppercase tracking-wider text-muted-foreground/40 select-none">
          {block.type}
        </div>
      )}
      <div
        ref={blockRef}
        contentEditable={!isReadOnly}
        suppressContentEditableWarning
        dir="ltr"
        spellCheck={false}
        className={getBlockStyles(block.type, isFocused)}
        style={{ 
          direction: 'ltr',
          unicodeBidi: 'plaintext',
          textAlign: 'left'
        } as React.CSSProperties}
        onKeyDown={onKeyDown}
        onInput={onInput}
        onBlur={onBlur}
        onFocus={onFocus}
      />
      {block.type === 'dialogue' && !isReadOnly && (
        <div className="absolute -left-8 top-1/2 -translate-y-1/2">
          <DialogueFeedback
            characterName={getCharacterName()}
            dialogue={block.content}
            scriptBlocks={scriptBlocks}
            blockIndex={index}
            onApplySuggestion={onApplySuggestion}
          />
        </div>
      )}

      {isSuggestionTarget && (aiLoading || aiSuggestion) && (
        <div className="pl-2 mt-0.5 select-none pointer-events-none" style={{ direction: 'ltr' }}>
          {aiLoading && !aiSuggestion && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
              <Loader2 size={12} className="animate-spin" />
              <span className="italic">Thinking...</span>
            </div>
          )}
          {aiSuggestion && (
            <div className="text-[12pt] font-screenplay text-muted-foreground/40 italic leading-normal">
              {aiSuggestion}
              <span className="ml-2 text-[9px] font-sans not-italic text-muted-foreground/50 bg-muted px-1.5 py-0.5 rounded">
                Tab to accept · Esc to dismiss
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScriptBlockItem;