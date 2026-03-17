import type { ElementType, ScriptBlock, ScriptMode } from "../types";
import { getModeConfig } from "./mode-config";

export function createBlock(
  type: ElementType = "action",
  content = ""
): ScriptBlock {
  return {
    id: Math.random().toString(36).substring(2, 11),
    type,
    content,
  };
}

export function defaultBlocks(mode: ScriptMode = "screenplay"): ScriptBlock[] {
  const config = getModeConfig(mode);
  return [createBlock(config.defaultBlockType, config.defaultBlockContent)];
}

export function nextBlockType(
  current: ElementType,
  mode: ScriptMode = "screenplay"
): ElementType {
  const cycle = getModeConfig(mode).typeCycle;
  const idx = cycle.indexOf(current);
  if (idx === -1) return cycle[0];
  return cycle[(idx + 1) % cycle.length];
}

export function autoDetectType(
  content: string,
  currentType: ElementType,
  mode: ScriptMode = "screenplay"
): ElementType {
  return getModeConfig(mode).autoDetect(content, currentType);
}

export function shouldUpperCase(
  type: ElementType,
  mode: ScriptMode = "screenplay"
): boolean {
  return getModeConfig(mode).shouldUpperCase(type);
}

export function extractCharacters(blocks: ScriptBlock[]): string[] {
  const chars = new Set<string>();
  blocks.forEach((b) => {
    if (b.type === "character" && b.content.trim()) {
      chars.add(b.content.trim().toUpperCase());
    }
  });
  return Array.from(chars).sort();
}

export function formatBlockForExport(block: ScriptBlock): string {
  const content =
    shouldUpperCase(block.type) ? block.content.toUpperCase() : block.content;

  switch (block.type) {
    case "slugline":
      return `\n${content}\n`;
    case "character":
      return `\n                    ${content}`;
    case "dialogue":
      return `          ${content}`;
    case "parenthetical":
      return `               (${content})`;
    case "transition":
      return `\n                                        ${content}\n`;
    // YouTube / Podcast / TikTok types - simple formatting
    case "hook":
      return `\n[HOOK] ${content}`;
    case "intro":
      return `\n[INTRO] ${content}`;
    case "body":
      return `\n${content}`;
    case "cta":
      return `\n[CTA] ${content}`;
    case "segment":
      return `\n--- ${content.toUpperCase()} ---`;
    case "adread":
      return `\n[AD] ${content}`;
    case "outro":
      return `\n[OUTRO] ${content}`;
    case "visualcue":
      return `\n(Visual: ${content})`;
    case "voiceover":
      return `\n  VO: ${content}`;
    case "action":
    default:
      return `\n${content}`;
  }
}

export function blocksToPlainText(blocks: ScriptBlock[]): string {
  return blocks.map(formatBlockForExport).join("\n");
}

// Scene grouping for storyboard and drag-reorder

export interface SceneGroup {
  sluglineIndex: number;
  blocks: ScriptBlock[];
}

export function groupBlocksIntoScenes(blocks: ScriptBlock[]): SceneGroup[] {
  const groups: SceneGroup[] = [];
  let current: SceneGroup | null = null;

  blocks.forEach((block, i) => {
    if (block.type === "slugline" || block.type === "hook" || block.type === "intro" || block.type === "segment") {
      if (current) groups.push(current);
      current = { sluglineIndex: i, blocks: [block] };
    } else if (current) {
      current.blocks.push(block);
    } else {
      // Blocks before first scene heading
      current = { sluglineIndex: -1, blocks: [block] };
    }
  });

  if (current) groups.push(current);
  return groups;
}

export function flattenSceneGroups(groups: SceneGroup[]): ScriptBlock[] {
  return groups.flatMap((g) => g.blocks);
}
