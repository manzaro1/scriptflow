import type { ElementType, ScriptMode } from "../types";

export interface ModeConfig {
  label: string;
  description: string;
  elementTypes: ElementType[];
  typeCycle: ElementType[];
  typeLabels: Record<string, string>;
  typeColors: Record<string, string>;
  typeStyles: Record<string, React.CSSProperties>;
  defaultBlockType: ElementType;
  defaultBlockContent: string;
  shouldUpperCase: (type: ElementType) => boolean;
  autoDetect: (content: string, current: ElementType) => ElementType;
  aiPromptPrefix: string;
}

export const MODE_CONFIGS: Record<ScriptMode, ModeConfig> = {
  screenplay: {
    label: "Screenplay",
    description: "Professional film & TV scripts",
    elementTypes: ["slugline", "action", "character", "dialogue", "parenthetical", "transition"],
    typeCycle: ["action", "character", "parenthetical", "dialogue", "slugline", "transition"],
    typeLabels: {
      slugline: "SCN", action: "ACT", character: "CHAR",
      dialogue: "DLG", parenthetical: "PAR", transition: "TRNS",
    },
    typeColors: {
      slugline: "#d97706", action: "#6b7280", character: "#7c3aed",
      dialogue: "#2563eb", parenthetical: "#a78bfa", transition: "#f59e0b",
    },
    typeStyles: {
      slugline: { textTransform: "uppercase", fontWeight: 700 },
      action: {},
      character: { textTransform: "uppercase", fontWeight: 700, textAlign: "center" },
      dialogue: { paddingLeft: 24, paddingRight: 16 },
      parenthetical: { fontStyle: "italic", paddingLeft: 32, paddingRight: 32 },
      transition: { textTransform: "uppercase", fontWeight: 700, textAlign: "right" },
    },
    defaultBlockType: "slugline",
    defaultBlockContent: "EXT. NEW SCENE - DAY",
    shouldUpperCase: (type) => type === "slugline" || type === "character" || type === "transition",
    autoDetect: (content, current) => {
      const upper = content.toUpperCase().trim();
      if (upper.startsWith("INT.") || upper.startsWith("EXT.")) return "slugline";
      if (upper.match(/^(CUT TO:|FADE (IN|OUT).|SMASH CUT TO:)$/)) return "transition";
      return current;
    },
    aiPromptPrefix: "You are an expert screenwriter. Generate a properly formatted screenplay scene.",
  },

  youtube: {
    label: "YouTube",
    description: "YouTube video scripts",
    elementTypes: ["hook", "intro", "body", "cta", "action", "character", "dialogue", "transition"],
    typeCycle: ["hook", "intro", "body", "dialogue", "cta", "action", "transition"],
    typeLabels: {
      hook: "HOOK", intro: "INTR", body: "BODY", cta: "CTA",
      action: "ACT", character: "CHAR", dialogue: "DLG", transition: "TRNS",
    },
    typeColors: {
      hook: "#ef4444", intro: "#3b82f6", body: "#6b7280", cta: "#f59e0b",
      action: "#9ca3af", character: "#7c3aed", dialogue: "#2563eb", transition: "#d97706",
    },
    typeStyles: {
      hook: { fontWeight: 700, color: "#ef4444" },
      intro: { fontWeight: 600 },
      body: {},
      cta: { fontWeight: 700, fontStyle: "italic" },
      action: { fontStyle: "italic" },
      character: { textTransform: "uppercase", fontWeight: 700 },
      dialogue: { paddingLeft: 16 },
      transition: { textTransform: "uppercase", fontWeight: 600 },
    },
    defaultBlockType: "hook",
    defaultBlockContent: "Hey everyone! In this video...",
    shouldUpperCase: (type) => type === "character" || type === "transition",
    autoDetect: (_content, current) => current,
    aiPromptPrefix: "You are a YouTube script expert. Generate a well-structured YouTube video script with a compelling hook, clear intro, engaging body sections, and a strong call-to-action.",
  },

  podcast: {
    label: "Podcast",
    description: "Podcast episode scripts",
    elementTypes: ["intro", "segment", "character", "dialogue", "adread", "outro", "action"],
    typeCycle: ["intro", "segment", "dialogue", "character", "adread", "outro", "action"],
    typeLabels: {
      intro: "INTR", segment: "SEG", character: "HOST",
      dialogue: "TALK", adread: "AD", outro: "OUT", action: "NOTE",
    },
    typeColors: {
      intro: "#3b82f6", segment: "#7c3aed", character: "#059669",
      dialogue: "#6b7280", adread: "#f59e0b", outro: "#ef4444", action: "#9ca3af",
    },
    typeStyles: {
      intro: { fontWeight: 600 },
      segment: { fontWeight: 700, textTransform: "uppercase" },
      character: { fontWeight: 700, textTransform: "uppercase" },
      dialogue: { paddingLeft: 16 },
      adread: { fontStyle: "italic", backgroundColor: "#fffbeb", padding: "2px 4px", borderRadius: 2 },
      outro: { fontWeight: 600 },
      action: { fontStyle: "italic", color: "#9ca3af" },
    },
    defaultBlockType: "intro",
    defaultBlockContent: "Welcome to the show!",
    shouldUpperCase: (type) => type === "segment" || type === "character",
    autoDetect: (_content, current) => current,
    aiPromptPrefix: "You are a podcast script writer. Generate a well-structured podcast episode script with an engaging intro, clear segments, natural dialogue, ad read placements, and a memorable outro.",
  },

  tiktok: {
    label: "TikTok/Reel",
    description: "Short-form video scripts",
    elementTypes: ["hook", "visualcue", "voiceover", "body", "cta", "transition"],
    typeCycle: ["hook", "visualcue", "voiceover", "body", "cta", "transition"],
    typeLabels: {
      hook: "HOOK", visualcue: "VIS", voiceover: "VO",
      body: "BODY", cta: "CTA", transition: "CUT",
    },
    typeColors: {
      hook: "#ef4444", visualcue: "#8b5cf6", voiceover: "#3b82f6",
      body: "#6b7280", cta: "#f59e0b", transition: "#d97706",
    },
    typeStyles: {
      hook: { fontWeight: 700 },
      visualcue: { fontStyle: "italic", color: "#8b5cf6" },
      voiceover: { paddingLeft: 16 },
      body: {},
      cta: { fontWeight: 700 },
      transition: { textTransform: "uppercase", fontWeight: 600, textAlign: "right" },
    },
    defaultBlockType: "hook",
    defaultBlockContent: "Wait, you need to see this...",
    shouldUpperCase: (type) => type === "transition",
    autoDetect: (_content, current) => current,
    aiPromptPrefix: "You are a viral TikTok/Reel script expert. Generate a short, punchy script optimized for 15-60 seconds. Start with an attention-grabbing hook in the first 2 seconds, use visual cues for on-screen action, voiceover for narration, and end with a strong call-to-action.",
  },
};

/** Get the mode config, falling back to screenplay */
export function getModeConfig(mode: ScriptMode): ModeConfig {
  return MODE_CONFIGS[mode] || MODE_CONFIGS.screenplay;
}
