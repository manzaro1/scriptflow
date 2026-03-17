export type ElementType =
  | "action"
  | "character"
  | "dialogue"
  | "slugline"
  | "parenthetical"
  | "transition";

export interface ScriptBlock {
  id: string;
  type: ElementType;
  content: string;
}

export type AITool = "doctor" | "tone" | "plotHoles";

export interface AIAnalysisResult {
  summary: string;
  items: Array<{
    title: string;
    description: string;
    blockIndex?: number;
  }>;
}
