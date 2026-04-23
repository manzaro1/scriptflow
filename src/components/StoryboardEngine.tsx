"use client";

import React, { useState, useCallback, useMemo } from 'react';
import {
  Film,
  Users,
  MapPin,
  Camera,
  Play,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Sparkles,
  Clock,
  Music,
  Volume2,
  Palette,
  Wand2,
  Layers,
  Settings,
  Info,
  AlertCircle,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { showSuccess, showLoading, dismissToast, showError } from "@/utils/toast";
import type { StoryboardOutput, StoryboardScene, StoryboardShot, CharacterConsistencySheet, EnvironmentLock } from "@/types/storyboard";

interface ScriptBlock {
  id: string;
  type: string;
  content: string;
}

interface StoryboardEngineProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  scriptBlocks: ScriptBlock[];
  scriptTitle: string;
  scriptId: string | null;
}

const AI_MODELS = [
  { id: 'qwen/qwen3-235b-a22b', name: 'NVIDIA Qwen 3 235B (Default)', provider: 'NVIDIA' },
  { id: 'nvidia/llama-3.1-nemotron-70b', name: 'NVIDIA Nemotron 70B', provider: 'NVIDIA' },
  { id: 'google/gemini-2.5-pro', name: 'Google Gemini 2.5 Pro', provider: 'Google' },
  { id: 'openai/gpt-4o', name: 'OpenAI GPT-4o', provider: 'OpenAI' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Anthropic Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'custom', name: 'Custom (Bring Your Own Key)', provider: 'Custom' },
];

const ASPECT_RATIOS = [
  { id: '2.39:1', name: '2.39:1 (Anamorphic Scope)', width: 1920, height: 800 },
  { id: '1.85:1', name: '1.85:1 (Flat Cinematic)', width: 1920, height: 1038 },
  { id: '16:9', name: '16:9 (HD / Digital)', width: 1920, height: 1080 },
  { id: '4:3', name: '4:3 (Classic)', width: 1440, height: 1080 },
  { id: '9:16', name: '9:16 (Vertical/TikTok)', width: 1080, height: 1920 },
];

const STYLE_PRESETS = [
  { id: 'cinematic', name: 'Cinematic Film', desc: 'Christopher Nolan / Roger Deakins style' },
  { id: 'documentary', name: 'Documentary', desc: 'Natural, vérité, handheld' },
  { id: 'commercial', name: 'Commercial', desc: 'High production value, clean' },
  { id: 'social-media', name: 'Social Media', desc: 'Vertical, quick cuts, dynamic' },
];

const DETAIL_LEVELS = [
  { id: 'basic', name: 'Basic', desc: 'Essential shots only' },
  { id: 'detailed', name: 'Detailed', desc: 'Multiple angles per scene' },
  { id: 'comprehensive', name: 'Comprehensive', desc: 'Full production blueprint' },
];

const StoryboardEngine = ({
  isOpen,
  onOpenChange,
  scriptBlocks,
  scriptTitle,
  scriptId,
}: StoryboardEngineProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [storyboardData, setStoryboardData] = useState<StoryboardOutput | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set());
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  // Config
  const [aspectRatio, setAspectRatio] = useState<'2.39:1' | '1.85:1' | '16:9' | '4:3' | '9:16'>('2.39:1');
  const [style, setStyle] = useState<'cinematic' | 'documentary' | 'commercial' | 'social-media'>('cinematic');
  const [detailLevel, setDetailLevel] = useState<'basic' | 'detailed' | 'comprehensive'>('comprehensive');

  // Get auth token
  const getToken = useCallback(() => {
    try {
      const stored = localStorage.getItem('scriptflow_token');
      return stored || '';
    } catch {
      return '';
    }
  }, []);

  const handleGenerate = async () => {
    if (!scriptId) {
      showError("Cannot generate storyboard: Script ID is missing.");
      return;
    }

    setIsGenerating(true);
    const toastId = showLoading("Generating comprehensive production blueprint...");

    try {
      const token = getToken();
      const res = await fetch('/api/storyboard/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          scriptBlocks,
          scriptTitle,
          scriptId,
          config: {
            aspectRatio,
            style,
            detailLevel,
            includeAnimationPlan: true,
            includeExecutionPlan: true,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate storyboard');
      }

      const data = await res.json();
      setStoryboardData(data);
      showSuccess(`Production blueprint generated: ${data.totalScenes} scenes, ${data.totalShots} shots`);
    } catch (error: any) {
      console.error('[StoryboardEngine] Error:', error);
      showError(error.message || 'Failed to generate storyboard');
    } finally {
      dismissToast(toastId);
      setIsGenerating(false);
    }
  };

  const toggleScene = (sceneId: string) => {
    setExpandedScenes((prev) => {
      const next = new Set(prev);
      if (next.has(sceneId)) {
        next.delete(sceneId);
      } else {
        next.add(sceneId);
      }
      return next;
    });
  };

  const copyPrompt = async (prompt: string, shotId: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(shotId);
      setTimeout(() => setCopiedPrompt(null), 2000);
      showSuccess('Prompt copied to clipboard');
    } catch {
      showError('Failed to copy');
    }
  };

  const exportStoryboard = async (format: 'json' | 'pdf') => {
    if (!storyboardData) return;

    if (format === 'json') {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(storyboardData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `${scriptTitle.replace(/\s+/g, '_')}_Storyboard.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      showSuccess('JSON exported');
    } else {
      // For PDF, we'd need to use a library like jspdf
      showError('PDF export coming soon');
    }
  };

  const getShotTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'wide': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      'medium': 'bg-green-500/10 text-green-400 border-green-500/30',
      'close-up': 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      'extreme-close-up': 'bg-red-500/10 text-red-400 border-red-500/30',
      'drone': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      'tracking': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      'over-shoulder': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      'pov': 'bg-pink-500/10 text-pink-400 border-pink-500/30',
    };
    return colors[type] || 'bg-gray-500/10 text-gray-400 border-gray-500/30';
  };

  const getMotionIcon = (motion: string) => {
    if (motion.includes('zoom')) return '🔍';
    if (motion.includes('pan')) return '↔️';
    if (motion.includes('dolly')) return '🚶';
    if (motion.includes('parallax')) return '🌊';
    if (motion === 'static') return '📌';
    return '🎬';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={storyboardData ? "max-w-[95vw] max-h-[90vh] overflow-y-auto" : "max-w-[700px]"}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-2 rounded-xl shadow-lg">
              <Wand2 size={20} />
            </div>
            <div>
              <DialogTitle className="text-xl">AI Video Production Engine</DialogTitle>
              <DialogDescription>
                Transform script → storyboard → image prompts → animation plan → video pipeline
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!storyboardData ? (
          // Configuration Panel
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Aspect Ratio
                </label>
                <Select value={aspectRatio} onValueChange={(v: any) => setAspectRatio(v)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASPECT_RATIOS.map((ratio) => (
                      <SelectItem key={ratio.id} value={ratio.id}>
                        {ratio.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Style
                </label>
                <Select value={style} onValueChange={(v: any) => setStyle(v)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STYLE_PRESETS.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Detail Level
                </label>
                <Select value={detailLevel} onValueChange={(v: any) => setDetailLevel(v)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DETAIL_LEVELS.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview Card */}
            <div className="p-6 border rounded-2xl bg-gradient-to-br from-orange-500/5 to-amber-500/5 border-dashed border-orange-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-lg">{scriptTitle}</h4>
                  <p className="text-sm text-muted-foreground">
                    {scriptBlocks.length} blocks • {STYLE_PRESETS.find(s => s.id === style)?.desc}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-orange-500">
                    {aspectRatio}
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">
                    {DETAIL_LEVELS.find(d => d.id === detailLevel)?.name} Detail
                  </p>
                </div>
              </div>
            </div>

            {/* Features List */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Users size={18} className="text-orange-500 mt-0.5" />
                <div>
                  <p className="text-sm font-bold">Character Consistency</p>
                  <p className="text-xs text-muted-foreground">
                    Lock character appearance across all shots
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <MapPin size={18} className="text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-bold">Environment Lock</p>
                  <p className="text-xs text-muted-foreground">
                    Maintain visual continuity in locations
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Camera size={18} className="text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-bold">AI Image Prompts</p>
                  <p className="text-xs text-muted-foreground">
                    Ready-to-use prompts for image generation
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Play size={18} className="text-purple-500 mt-0.5" />
                <div>
                  <p className="text-sm font-bold">Animation Plan</p>
                  <p className="text-xs text-muted-foreground">
                    Motion and timing for each shot
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Results Panel
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between border-b px-2">
              <TabsList className="h-12">
                <TabsTrigger value="overview" className="gap-2">
                  <Layers size={14} />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="characters" className="gap-2">
                  <Users size={14} />
                  Characters ({storyboardData.characterSheet?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="environments" className="gap-2">
                  <MapPin size={14} />
                  Environments
                </TabsTrigger>
                <TabsTrigger value="storyboard" className="gap-2">
                  <Film size={14} />
                  Storyboard
                </TabsTrigger>
                <TabsTrigger value="execution" className="gap-2">
                  <Settings size={14} />
                  Execution
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => exportStoryboard('json')}>
                  <Download size={14} className="mr-1" />
                  Export JSON
                </Button>
                <Button size="sm" onClick={handleGenerate} disabled={isGenerating}>
                  <RefreshCw size={14} className={cn("mr-1", isGenerating && "animate-spin")} />
                  Regenerate
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              {/* Overview Tab */}
              <TabsContent value="overview" className="p-6 space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20">
                    <div className="text-3xl font-black text-orange-500">
                      {storyboardData.totalScenes}
                    </div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">Scenes</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                    <div className="text-3xl font-black text-blue-500">
                      {storyboardData.totalShots}
                    </div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">Shots</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                    <div className="text-3xl font-black text-green-500">
                      {Math.floor(storyboardData.estimatedDuration / 60)}:{String(storyboardData.estimatedDuration % 60).padStart(2, '0')}
                    </div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">Duration</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                    <div className="text-3xl font-black text-purple-500">
                      {storyboardData.characterSheet?.length || 0}
                    </div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">Characters</div>
                  </div>
                </div>

                {/* Color Grading & Music */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <Palette size={16} className="text-orange-500" />
                      <span className="font-bold">Color Grading</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {storyboardData.colorGradingStyle || 'Standard cinematic'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <Music size={16} className="text-blue-500" />
                      <span className="font-bold">Music Suggestions</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {storyboardData.musicSuggestions?.map((m, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {m}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Characters Tab */}
              <TabsContent value="characters" className="p-6">
                <div className="space-y-4">
                  {storyboardData.characterSheet?.map((char: CharacterConsistencySheet) => (
                    <div key={char.id} className="p-4 rounded-xl border bg-card">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-lg">{char.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {char.gender}, {char.age} • {char.bodyType}
                          </p>
                        </div>
                        <Badge variant="outline">{char.id}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Face:</span>
                          <p>{char.faceDescription}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Skin Tone:</span>
                          <p>{char.skinTone}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Hairstyle:</span>
                          <p>{char.hairstyle}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Clothing:</span>
                          <p>{char.clothing}</p>
                        </div>
                      </div>

                      {char.uniqueTraits?.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <span className="text-xs text-muted-foreground uppercase">Unique Traits:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {char.uniqueTraits.map((trait, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {trait}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t">
                        <span className="text-xs text-muted-foreground uppercase">Consistency Prompt:</span>
                        <div className="mt-1 p-2 bg-muted/50 rounded text-xs font-mono">
                          {char.consistencyPrompt}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Environments Tab */}
              <TabsContent value="environments" className="p-6">
                <div className="space-y-4">
                  {storyboardData.environmentSetup?.map((env: EnvironmentLock) => (
                    <div key={env.id} className="p-4 rounded-xl border bg-card">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold">{env.locationStyle}</h4>
                          <p className="text-sm text-muted-foreground">
                            {env.timeOfDay} • {env.weather}
                          </p>
                        </div>
                        <Badge variant="outline">{env.id}</Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Lighting:</span>
                          <p>{env.lighting}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Architecture:</span>
                          <p>{env.architecture}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Color Palette:</span>
                          <div className="flex gap-1 mt-1">
                            {env.colorPalette?.map((color, i) => (
                              <div
                                key={i}
                                className="w-5 h-5 rounded border"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {env.backgroundElements?.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <span className="text-xs text-muted-foreground uppercase">Background Elements:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {env.backgroundElements.map((el, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {el}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Storyboard Tab */}
              <TabsContent value="storyboard" className="p-4">
                <div className="space-y-4">
                  {storyboardData.storyboard?.map((scene: StoryboardScene) => (
                    <div key={scene.id} className="border rounded-xl overflow-hidden">
                      {/* Scene Header */}
                      <button
                        onClick={() => toggleScene(scene.id)}
                        className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted/70 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {expandedScenes.has(scene.id) ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                          <div className="text-left">
                            <div className="font-bold">{scene.slugline}</div>
                            <div className="text-sm text-muted-foreground">
                              {scene.shots?.length || 0} shots • {scene.mood}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline">Scene {scene.sceneNumber}</Badge>
                      </button>

                      {/* Scene Content */}
                      {expandedScenes.has(scene.id) && (
                        <div className="p-4 space-y-4">
                          {scene.directorNotes && (
                            <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                              <div className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">
                                Director's Notes
                              </div>
                              <p className="text-sm">{scene.directorNotes}</p>
                            </div>
                          )}

                          {/* Shots */}
                          <div className="space-y-3">
                            {scene.shots?.map((shot: StoryboardShot) => (
                              <div key={shot.id} className="p-4 rounded-lg border bg-card">
                                <div className="flex items-start gap-4">
                                  {/* Shot Number */}
                                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-black">
                                    {shot.shotNumber}
                                  </div>

                                  {/* Shot Details */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge className={getShotTypeColor(shot.shotType)}>
                                        {shot.shotType}
                                      </Badge>
                                      <Badge variant="outline">
                                        {shot.cameraMovement}
                                      </Badge>
                                      <Badge variant="outline">
                                        {shot.lens}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock size={12} />
                                        {shot.duration}s
                                      </span>
                                    </div>

                                    <p className="text-sm mb-2">{shot.description}</p>

                                    {shot.detailedAction && (
                                      <p className="text-xs text-muted-foreground mb-3">
                                        {shot.detailedAction}
                                      </p>
                                    )}

                                    {/* Image Prompt */}
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                          AI Image Prompt
                                        </span>
                                        <button
                                          onClick={() => copyPrompt(shot.imagePrompt, shot.id)}
                                          className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1"
                                        >
                                          {copiedPrompt === shot.id ? (
                                            <>
                                              <Check size={12} />
                                              Copied
                                            </>
                                          ) : (
                                            <>
                                              <Copy size={12} />
                                              Copy
                                            </>
                                          )}
                                        </button>
                                      </div>
                                      <p className="text-xs font-mono leading-relaxed">
                                        {shot.imagePrompt}
                                      </p>
                                    </div>

                                    {/* Audio & Atmosphere */}
                                    <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                                      <div>
                                        <span className="text-muted-foreground">Mood:</span>
                                        <span className="ml-1">{shot.mood}</span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Emotion:</span>
                                        <span className="ml-1">{shot.emotion}</span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Lighting:</span>
                                        <span className="ml-1">{shot.lighting}</span>
                                      </div>
                                    </div>

                                    {shot.soundEffects?.length > 0 && (
                                      <div className="mt-2 flex items-center gap-2">
                                        <Volume2 size={12} className="text-muted-foreground" />
                                        <div className="flex flex-wrap gap-1">
                                          {shot.soundEffects.map((sfx, i) => (
                                            <Badge key={i} variant="secondary" className="text-[10px]">
                                              {sfx}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {scene.continuityNotes && (
                            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                              <div className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-1">
                                Continuity Notes
                              </div>
                              <p className="text-sm">{scene.continuityNotes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Execution Tab */}
              <TabsContent value="execution" className="p-6 space-y-6">
                {/* Remotion Config */}
                {storyboardData.executionPlan?.remotionConfig && (
                  <div className="p-4 rounded-xl border bg-card">
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      <Play size={16} className="text-orange-500" />
                      Remotion Configuration
                    </h4>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">FPS:</span>
                        <span className="ml-2 font-mono">
                          {storyboardData.executionPlan.remotionConfig.fps}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Frames:</span>
                        <span className="ml-2 font-mono">
                          {storyboardData.executionPlan.remotionConfig.durationInFrames}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Width:</span>
                        <span className="ml-2 font-mono">
                          {storyboardData.executionPlan.remotionConfig.width}px
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Height:</span>
                        <span className="ml-2 font-mono">
                          {storyboardData.executionPlan.remotionConfig.height}px
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Image Generation Commands */}
                {storyboardData.executionPlan?.imageGenerationCommands?.length > 0 && (
                  <div className="p-4 rounded-xl border bg-card">
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      <Camera size={16} className="text-blue-500" />
                      Image Generation Commands ({storyboardData.executionPlan.imageGenerationCommands.length})
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {storyboardData.executionPlan.imageGenerationCommands.slice(0, 5).map((cmd, i) => (
                        <div key={i} className="p-2 bg-muted/50 rounded text-xs font-mono">
                          <div className="text-orange-500 font-bold">{cmd.shotId}</div>
                          <div className="text-muted-foreground truncate">{cmd.prompt}</div>
                        </div>
                      ))}
                      {storyboardData.executionPlan.imageGenerationCommands.length > 5 && (
                        <div className="text-xs text-muted-foreground text-center pt-2">
                          +{storyboardData.executionPlan.imageGenerationCommands.length - 5} more commands
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tool Suggestions */}
                {storyboardData.executionPlan?.toolSuggestions?.length > 0 && (
                  <div className="p-4 rounded-xl border bg-card">
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      <Settings size={16} className="text-green-500" />
                      Tool Suggestions
                    </h4>
                    <div className="space-y-3">
                      {storyboardData.executionPlan.toolSuggestions.map((tool, i) => (
                        <div key={i} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold">{tool.tool}</span>
                            <Badge variant="outline">{tool.purpose}</Badge>
                          </div>
                          {tool.githubRepo && (
                            <a
                              href={tool.githubRepo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline"
                            >
                              {tool.githubRepo}
                            </a>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">{tool.notes}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Animation Plan Summary */}
                {storyboardData.animationPlan?.length > 0 && (
                  <div className="p-4 rounded-xl border bg-card">
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      <Wand2 size={16} className="text-purple-500" />
                      Animation Plan Summary
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Keyframes:</span>
                        <span className="ml-2 font-mono">
                          {storyboardData.animationPlan.reduce((acc, a) => acc + (a.keyframes?.length || 0), 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Transitions:</span>
                        <span className="ml-2">
                          {Array.from(new Set(storyboardData.animationPlan.map(a => a.transition))).join(', ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Motion Types:</span>
                        <span className="ml-2">
                          {Array.from(new Set(storyboardData.animationPlan.map(a => a.motionType))).join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}

        {/* Footer */}
        {!storyboardData && (
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !scriptId}
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 min-w-[200px]"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} className="mr-2" />
                  Generate Blueprint
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StoryboardEngine;
