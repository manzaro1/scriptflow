import { useState, useRef, useCallback } from "react";
import type { ScriptBlock } from "../types";

interface UseHistoryReturn {
  blocks: ScriptBlock[];
  setBlocks: (blocks: ScriptBlock[] | ((prev: ScriptBlock[]) => ScriptBlock[])) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export default function useHistory(
  initialBlocks: ScriptBlock[],
  maxEntries = 50
): UseHistoryReturn {
  const [blocks, setBlocksInternal] = useState<ScriptBlock[]>(initialBlocks);
  const historyRef = useRef<ScriptBlock[][]>([initialBlocks]);
  const indexRef = useRef(0);

  const setBlocks = useCallback(
    (update: ScriptBlock[] | ((prev: ScriptBlock[]) => ScriptBlock[])) => {
      setBlocksInternal((prev) => {
        const next = typeof update === "function" ? update(prev) : update;

        // Skip if identical reference
        if (next === prev) return prev;

        // Truncate redo entries beyond current position
        historyRef.current = historyRef.current.slice(0, indexRef.current + 1);

        // Push new snapshot
        historyRef.current.push(next);

        // Trim oldest if exceeding max
        if (historyRef.current.length > maxEntries) {
          historyRef.current.shift();
        } else {
          indexRef.current++;
        }

        return next;
      });
    },
    [maxEntries]
  );

  const undo = useCallback(() => {
    if (indexRef.current > 0) {
      indexRef.current--;
      setBlocksInternal(historyRef.current[indexRef.current]);
    }
  }, []);

  const redo = useCallback(() => {
    if (indexRef.current < historyRef.current.length - 1) {
      indexRef.current++;
      setBlocksInternal(historyRef.current[indexRef.current]);
    }
  }, []);

  return {
    blocks,
    setBlocks,
    undo,
    redo,
    canUndo: indexRef.current > 0,
    canRedo: indexRef.current < historyRef.current.length - 1,
  };
}
