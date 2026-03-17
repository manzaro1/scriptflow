import type { ElementType, ScriptBlock } from "../types";

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

export function defaultBlocks(): ScriptBlock[] {
  return [createBlock("slugline", "EXT. NEW SCENE - DAY")];
}

const TYPE_CYCLE: ElementType[] = [
  "action",
  "character",
  "parenthetical",
  "dialogue",
  "slugline",
  "transition",
];

export function nextBlockType(current: ElementType): ElementType {
  const idx = TYPE_CYCLE.indexOf(current);
  return TYPE_CYCLE[(idx + 1) % TYPE_CYCLE.length];
}

export function autoDetectType(
  content: string,
  currentType: ElementType
): ElementType {
  const upper = content.toUpperCase().trim();
  if (upper.startsWith("INT.") || upper.startsWith("EXT.")) return "slugline";
  if (upper.match(/^(CUT TO:|FADE (IN|OUT).|SMASH CUT TO:)$/))
    return "transition";
  return currentType;
}

export function shouldUpperCase(type: ElementType): boolean {
  return type === "slugline" || type === "character" || type === "transition";
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
    case "action":
    default:
      return `\n${content}`;
  }
}

export function blocksToPlainText(blocks: ScriptBlock[]): string {
  return blocks.map(formatBlockForExport).join("\n");
}
