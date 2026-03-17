export type Tier = "free" | "pro";

export interface FeatureFlag {
  id: string;
  label: string;
  tier: Tier;
}

export const FEATURES: FeatureFlag[] = [
  { id: "undo", label: "Undo/Redo", tier: "free" },
  { id: "templates", label: "Script Templates", tier: "free" },
  { id: "findReplace", label: "Find & Replace", tier: "free" },
  { id: "dragReorder", label: "Scene Reorder", tier: "free" },
  { id: "export", label: "Export Scripts", tier: "pro" },
  { id: "storyboard", label: "Storyboard Mode", tier: "pro" },
  { id: "aiTools", label: "AI Writing Tools", tier: "pro" },
  { id: "youtubeMode", label: "YouTube Mode", tier: "pro" },
  { id: "podcastMode", label: "Podcast Mode", tier: "pro" },
  { id: "tiktokMode", label: "TikTok/Reel Mode", tier: "pro" },
];

const STORAGE_KEY = "scriptflow_tier";

export function getUserTier(): Tier {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val === "pro") return "pro";
  } catch {
    /* ignore */
  }
  return "free";
}

export function setUserTier(tier: Tier): void {
  try {
    localStorage.setItem(STORAGE_KEY, tier);
  } catch {
    /* ignore */
  }
}

export function canAccess(featureId: string, tier: Tier): boolean {
  const feature = FEATURES.find((f) => f.id === featureId);
  if (!feature) return true;
  if (feature.tier === "free") return true;
  return tier === "pro";
}
