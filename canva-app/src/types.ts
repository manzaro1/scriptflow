export type ElementType =
  | "action"
  | "character"
  | "dialogue"
  | "slugline"
  | "parenthetical"
  | "transition"
  // YouTube
  | "hook"
  | "intro"
  | "body"
  | "cta"
  // Podcast
  | "segment"
  | "adread"
  | "outro"
  // TikTok/Reel
  | "visualcue"
  | "voiceover";

export type ScriptMode = "screenplay" | "youtube" | "podcast" | "tiktok";

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

export interface StoryboardFrame {
  sceneIndex: number;
  slugline: string;
  description: string;
  visualPrompt: string;
  blocks: ScriptBlock[];
  status: "pending" | "generating" | "ready" | "inserted";
}
