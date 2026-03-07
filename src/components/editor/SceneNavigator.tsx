"use client";

import React from 'react';
import { Hash } from 'lucide-react';
import { cn } from "@/lib/utils";

interface SceneNavigatorProps {
  blocks: any[];
  sceneSlugs: any[];
  focusedBlockId: string | null;
  onSceneClick: (id: string) => void;
}

const SceneNavigator = ({ blocks, sceneSlugs, focusedBlockId, onSceneClick }: SceneNavigatorProps) => {
  return (
    <aside className="w-64 border-r bg-background hidden lg:flex flex-col shrink-0">
      <div className="p-4 border-b">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
          <Hash size={12} />
          Scene Navigator
        </h3>
        <div className="space-y-0.5">
          {sceneSlugs.map((b, i) => {
            const sceneCharCount = (() => {
              const blockIndex = blocks.indexOf(b);
              const chars = new Set<string>();
              for (let j = blockIndex + 1; j < blocks.length; j++) {
                if (blocks[j].type === 'slugline') break;
                if (blocks[j].type === 'character') chars.add(blocks[j].content);
              }
              return chars.size;
            })();

            return (
              <button
                key={b.id}
                className={cn(
                  "text-xs p-2.5 rounded-lg cursor-pointer w-full text-left transition-all duration-200 flex items-center gap-2",
                  focusedBlockId === b.id
                    ? "bg-primary/10 text-primary font-semibold"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
                onClick={() => onSceneClick(b.id)}
              >
                <span className="font-mono text-[10px] font-bold text-muted-foreground w-5 shrink-0">{i + 1}</span>
                <span className="truncate flex-1">{b.content || `Scene ${i + 1}`}</span>
                {sceneCharCount > 0 && (
                  <span className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0">{sceneCharCount}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default SceneNavigator;