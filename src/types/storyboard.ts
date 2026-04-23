// Comprehensive Storyboard Types for AI Video Production Engine

export interface CharacterConsistencySheet {
  id: string;
  name: string;
  gender: string;
  age: string;
  faceDescription: string; // VERY detailed
  skinTone: string;
  hairstyle: string;
  clothing: string;
  bodyType: string;
  uniqueTraits: string[];
  consistencyPrompt: string; // Exact prompt to repeat for image generation
}

export interface EnvironmentLock {
  id: string;
  locationStyle: string; // e.g., "African village, modern city, classroom"
  lighting: string; // e.g., "golden hour, night, fluorescent indoor"
  weather: string;
  backgroundElements: string[];
  architecture: string;
  colorPalette: string[];
  timeOfDay: string;
}

export interface StoryboardShot {
  id: string;
  sceneNumber: number;
  shotNumber: string; // e.g., "1A", "1B", "2A"
  shotType: 'wide' | 'medium' | 'close-up' | 'extreme-close-up' | 'drone' | 'tracking' | 'over-shoulder' | 'pov';
  cameraMovement: 'static' | 'pan-left' | 'pan-right' | 'dolly-in' | 'dolly-out' | 'handheld' | 'crane' | 'steadicam' | 'tracking';
  description: string;
  detailedAction: string;
  
  // Image prompt - CRITICAL for AI generation
  imagePrompt: string;
  
  // Character references (IDs from CharacterConsistencySheet)
  characters: string[];
  
  // Environment reference
  environment: string;
  
  // Technical specs
  duration: number; // in seconds
  lens: string; // e.g., "35mm", "50mm", "85mm"
  aspectRatio: '2.39:1' | '1.85:1' | '16:9' | '4:3' | '9:16';
  
  // Animation plan
  motionType: 'zoom-in' | 'zoom-out' | 'parallax' | 'camera-pan' | 'character-movement' | 'static' | 'ken-burns';
  motionIntensity: 'subtle' | 'moderate' | 'dramatic';
  transition: string; // e.g., "cut", "dissolve", "fade", "wipe"
  
  // Atmosphere
  mood: string;
  emotion: string;
  colorGrade: string;
  lighting: string;
  
  // Audio
  backgroundMusicSuggestion?: string;
  soundEffects: string[];
  dialogue: string;
  
  // Output tracking
  imageUrl?: string;
  status: 'pending' | 'generating' | 'ready' | 'error';
}

export interface StoryboardScene {
  id: string;
  sceneNumber: number;
  slugline: string; // e.g., "INT. VILLAGE HUT - DAY"
  location: string;
  timeOfDay: string;
  mood: string;
  shots: StoryboardShot[];
  
  // Scene-level notes
  directorNotes: string;
  continuityNotes: string;
}

export interface AnimationPlan {
  shotId: string;
  duration: number;
  motionType: string;
  motionDescription: string;
  keyframes: {
    time: number; // percentage 0-100
    description: string;
  }[];
  transition: string;
  audioSync?: {
    beatTime: number;
    action: string;
  }[];
}

export interface ExecutionPlan {
  // Remotion timeline config
  remotionConfig?: {
    fps: number;
    durationInFrames: number;
    width: number;
    height: number;
  };
  
  // Image generation commands
  imageGenerationCommands: {
    shotId: string;
    prompt: string;
    aspectRatio: string;
    negativePrompt?: string;
  }[];
  
  // Animation commands
  animationCommands: {
    shotId: string;
    tool: 'remotion' | 'heygen' | 'd-id' | 'runway' | 'pika';
    command: string;
    params: Record<string, any>;
  }[];
  
  // Tool suggestions
  toolSuggestions: {
    purpose: string;
    tool: string;
    githubRepo?: string;
    notes: string;
  }[];
}

export interface StoryboardOutput {
  // Metadata
  scriptTitle: string;
  generatedAt: string;
  totalScenes: number;
  totalShots: number;
  estimatedDuration: number; // in seconds
  
  // Core output
  characterSheet: CharacterConsistencySheet[];
  environmentSetup: EnvironmentLock[];
  storyboard: StoryboardScene[];
  
  // Animation plans
  animationPlan: AnimationPlan[];
  
  // Execution
  executionPlan: ExecutionPlan;
  
  // Optional enhancements
  colorGradingStyle: string;
  musicSuggestions: string[];
  soundDesignNotes: string[];
}

export interface StoryboardGeneratorConfig {
  aspectRatio: '2.39:1' | '1.85:1' | '16:9' | '4:3' | '9:16';
  style: 'cinematic' | 'documentary' | 'commercial' | 'social-media';
  detailLevel: 'basic' | 'detailed' | 'comprehensive';
  includeAnimationPlan: boolean;
  includeExecutionPlan: boolean;
  targetPlatform?: 'youtube' | 'instagram' | 'tiktok' | 'film-festival' | 'tv';
}
