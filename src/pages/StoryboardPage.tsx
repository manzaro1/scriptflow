"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Film,
  Camera,
  RefreshCw,
  ArrowLeft,
  Download,
  Wand2,
  Image,
  Copy,
  Check,
  Users,
  MapPin,
  Palette,
  Clock,
  Volume2,
  Edit,
  Trash2,
  Play,
  Loader2,
  FileText,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { api } from "@/lib/api";
import type { StoryboardOutput, StoryboardScene, StoryboardShot, CharacterConsistencySheet, EnvironmentLock } from "@/types/storyboard";

const ASPECT_RATIOS = [
  { id: '2.39:1', name: '2.39:1 (Anamorphic)', width: 1920, height: 800 },
  { id: '1.85:1', name: '1.85:1 (Flat)', width: 1920, height: 1038 },
  { id: '16:9', name: '16:9 (HD)', width: 1920, height: 1080 },
];

const StoryboardPage = () => {
  const { scriptId } = useParams<{ scriptId: string }>();
  const navigate = useNavigate();
  
  const [scripts, setScripts] = useState<any[]>([]);
  const [storyboards, setStoryboards] = useState<any[]>([]);
  const [storyboard, setStoryboard] = useState<StoryboardOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('storyboard');
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set());
  const [regeneratingShots, setRegeneratingShots] = useState<Set<string>>(new Set());

  // Fetch scripts list on mount (when no scriptId)
  useEffect(() => {
    if (!scriptId) {
      fetchScripts();
    } else {
      fetchStoryboard();
    }
  }, [scriptId]);

  const fetchScripts = async () => {
    setLoading(true);
    try {
      const scriptData = await api.getScripts();
      setScripts(scriptData || []);
      
      // Fetch storyboards for each script
      const token = localStorage.getItem('scriptflow_token');
      const sbPromises = (scriptData || []).map(async (s: any) => {
        try {
          const res = await fetch(`/api/storyboard/${s.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            return { scriptId: s.id, storyboards: data };
          }
        } catch {}
        return { scriptId: s.id, storyboards: [] };
      });
      
      const sbResults = await Promise.all(sbPromises);
      const sbMap = new Map(sbResults.map(r => [r.scriptId, r.storyboards]));
      setStoryboards(sbMap as any);
    } catch (err) {
      console.error('Failed to fetch scripts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStoryboard = async () => {
    if (!scriptId) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/storyboard/${scriptId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('scriptflow_token')}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          // Get the most recent storyboard
          const latest = data[0];
          setStoryboard(typeof latest.data === 'string' ? JSON.parse(latest.data) : latest.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch storyboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStoryboard = async () => {
    if (!scriptId) return;
    
    setIsRegenerating(true);
    const toastId = showLoading("Generating storyboard with NVIDIA AI...");
    
    try {
      const res = await fetch('/api/storyboard/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('scriptflow_token')}`
        },
        body: JSON.stringify({
          scriptId,
          config: {
            aspectRatio: '2.39:1',
            style: 'cinematic',
            detailLevel: 'comprehensive'
          }
        })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate storyboard');
      }
      
      const data = await res.json();
      setStoryboard(data);
      showSuccess(`Generated ${data.totalScenes} scenes with ${data.totalShots} shots`);
    } catch (err: any) {
      showError(err.message || 'Failed to generate storyboard');
    } finally {
      dismissToast(toastId);
      setIsRegenerating(false);
    }
  };

  const handleRegenerateShot = async (shotId: string) => {
    setRegeneratingShots(prev => new Set(prev).add(shotId));
    
    try {
      // Find the shot to regenerate
      const shot = storyboard?.storyboard
        ?.flatMap(s => s.shots || [])
        .find((sh: StoryboardShot) => sh.id === shotId);
      
      if (!shot) throw new Error('Shot not found');
      
      // Call NVIDIA image generation
      const res = await fetch('/api/storyboard/regenerate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('scriptflow_token')}`
        },
        body: JSON.stringify({ shotId, prompt: shot.imagePrompt })
      });
      
      if (!res.ok) throw new Error('Failed to regenerate image');
      
      const { imageUrl } = await res.json();
      
      // Update the shot with new image URL
      setStoryboard(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          storyboard: prev.storyboard?.map(scene => ({
            ...scene,
            shots: scene.shots?.map(sh => 
              sh.id === shotId ? { ...sh, imageUrl } : sh
            )
          }))
        };
      });
      
      showSuccess('Image regenerated');
    } catch (err: any) {
      showError(err.message || 'Failed to regenerate');
    } finally {
      setRegeneratingShots(prev => {
        const next = new Set(prev);
        next.delete(shotId);
        return next;
      });
    }
  };

  const copyPrompt = async (prompt: string, shotId: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(shotId);
      setTimeout(() => setCopiedPrompt(null), 2000);
      showSuccess('Prompt copied');
    } catch {
      showError('Failed to copy');
    }
  };

  const exportStoryboard = (format: 'json' | 'pdf') => {
    if (!storyboard) return;
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(storyboard, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `storyboard_${scriptId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('JSON exported');
    } else {
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

  const toggleScene = (sceneId: string) => {
    setExpandedScenes(prev => {
      const next = new Set(prev);
      if (next.has(sceneId)) next.delete(sceneId);
      else next.add(sceneId);
      return next;
    });
  };

  // Script Selection View (when no scriptId)
  if (!scriptId) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8">
              <header className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Wand2 className="w-8 h-8 text-orange-500" />
                    Storyboards
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Generate AI-powered production blueprints for your scripts
                  </p>
                </div>
              </header>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : scripts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">No Scripts Yet</h2>
                  <p className="text-muted-foreground mb-4">
                    Create a script first to generate a storyboard
                  </p>
                  <Button onClick={() => navigate('/editor')}>
                    Create Script
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scripts.map((script) => {
                    const scriptStoryboards = (storyboards as any)?.get?.(script.id) || [];
                    const hasStoryboard = scriptStoryboards.length > 0;
                    
                    return (
                      <Card 
                        key={script.id}
                        className="hover:border-primary/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/storyboard/${script.id}`)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg line-clamp-1">{script.title}</CardTitle>
                            {hasStoryboard && (
                              <Badge variant="secondary" className="ml-2">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Generated
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {script.author || 'No author'}
                          </p>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              {hasStoryboard 
                                ? `${scriptStoryboards[0]?.data?.totalScenes || 0} scenes • ${scriptStoryboards[0]?.data?.totalShots || 0} shots`
                                : 'No storyboard yet'
                              }
                            </div>
                            <Button variant="ghost" size="sm">
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          {/* Header */}
          <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                      <Wand2 className="w-6 h-6 text-orange-500" />
                      Storyboard
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {storyboard?.scriptTitle || 'Production Blueprint'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportStoryboard('json')}>
                    <Download className="w-4 h-4 mr-2" />
                    Export JSON
                  </Button>
                  <Button 
                    onClick={handleGenerateStoryboard}
                    disabled={isRegenerating}
                    className="bg-gradient-to-r from-orange-600 to-amber-600"
                  >
                    {isRegenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {storyboard ? 'Regenerate' : 'Generate'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Content - Landscape Layout */}
          <div className="h-[calc(100vh-120px)] overflow-hidden">
            {!storyboard ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto">
                    <Film className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-xl font-bold">No Storyboard Yet</h2>
                  <p className="text-muted-foreground max-w-md">
                    Generate a production blueprint with scene breakdowns, shot lists, and AI image prompts.
                  </p>
                  <Button 
                    onClick={handleGenerateStoryboard}
                    className="bg-gradient-to-r from-orange-600 to-amber-600"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Storyboard
                  </Button>
                </div>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <div className="px-6 py-2 border-b bg-card/30">
                  <TabsList>
                    <TabsTrigger value="storyboard">Storyboard</TabsTrigger>
                    <TabsTrigger value="characters">Characters</TabsTrigger>
                    <TabsTrigger value="environments">Environments</TabsTrigger>
                    <TabsTrigger value="execution">Execution</TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="flex-1">
                  {/* Storyboard Tab - Landscape Grid */}
                  <TabsContent value="storyboard" className="p-6 m-0">
                    <div className="space-y-6">
                      {/* Stats */}
                      <div className="grid grid-cols-4 gap-4">
                        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                          <CardContent className="p-4">
                            <div className="text-3xl font-black text-blue-500">{storyboard.totalScenes}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-widest">Scenes</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
                          <CardContent className="p-4">
                            <div className="text-3xl font-black text-orange-500">{storyboard.totalShots}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-widest">Shots</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
                          <CardContent className="p-4">
                            <div className="text-3xl font-black text-green-500">{storyboard.estimatedDuration}s</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-widest">Duration</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
                          <CardContent className="p-4">
                            <div className="text-3xl font-black text-purple-500">{storyboard.characterSheet?.length || 0}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-widest">Characters</div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Scenes Grid - Landscape */}
                      <div className="space-y-4">
                        {storyboard.storyboard?.map((scene: StoryboardScene) => (
                          <Card key={scene.id} className="overflow-hidden">
                            <div 
                              className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer"
                              onClick={() => toggleScene(scene.id)}
                            >
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="font-mono">SC {scene.sceneNumber}</Badge>
                                <span className="font-bold">{scene.slugline}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{scene.shots?.length || 0} shots</Badge>
                                <Badge variant="outline">{scene.mood}</Badge>
                              </div>
                            </div>

                            {expandedScenes.has(scene.id) && (
                              <div className="p-4 space-y-4">
                                {/* Shot Grid - Landscape */}
                                <div className="grid grid-cols-2 gap-4">
                                  {scene.shots?.map((shot: StoryboardShot) => (
                                    <div 
                                      key={shot.id}
                                      className="border rounded-xl overflow-hidden bg-card hover:border-primary/50 transition-colors"
                                    >
                                      {/* Image Placeholder */}
                                      <div className="aspect-[2.39/1] bg-gradient-to-br from-muted to-muted/50 relative">
                                        {shot.imageUrl ? (
                                          <img 
                                            src={shot.imageUrl} 
                                            alt={shot.description}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center">
                                            <Image className="w-12 h-12 text-muted-foreground/50" />
                                          </div>
                                        )}
                                        <Badge className="absolute top-2 left-2" variant="secondary">
                                          {shot.shotNumber}
                                        </Badge>
                                      </div>

                                      {/* Shot Info */}
                                      <div className="p-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <Badge className={getShotTypeColor(shot.shotType)}>
                                              {shot.shotType}
                                            </Badge>
                                            <Badge variant="outline">{shot.cameraMovement}</Badge>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              className="h-7 w-7"
                                              onClick={() => copyPrompt(shot.imagePrompt, shot.id)}
                                            >
                                              {copiedPrompt === shot.id ? (
                                                <Check className="w-3 h-3 text-green-500" />
                                              ) : (
                                                <Copy className="w-3 h-3" />
                                              )}
                                            </Button>
                                            <Button 
                                              variant="ghost" 
                                              size="icon"
                                              className="h-7 w-7"
                                              onClick={() => handleRegenerateShot(shot.id)}
                                              disabled={regeneratingShots.has(shot.id)}
                                            >
                                              {regeneratingShots.has(shot.id) ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                              ) : (
                                                <RefreshCw className="w-3 h-3" />
                                              )}
                                            </Button>
                                          </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                          {shot.description}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          <Clock className="w-3 h-3" />
                                          {shot.duration}s
                                          <span className="mx-1">•</span>
                                          <span>{shot.lens}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Continuity Notes */}
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
                          </Card>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Characters Tab */}
                  <TabsContent value="characters" className="p-6 m-0">
                    <div className="grid grid-cols-2 gap-4">
                      {storyboard.characterSheet?.map((char: CharacterConsistencySheet) => (
                        <Card key={char.id}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{char.name}</CardTitle>
                              <Badge variant="outline">{char.id}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {char.gender}, {char.age} • {char.bodyType}
                            </p>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Skin:</span>
                                <p>{char.skinTone}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Hair:</span>
                                <p>{char.hairstyle}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Clothing:</span>
                                <p>{char.clothing}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Face:</span>
                                <p className="line-clamp-2">{char.faceDescription}</p>
                              </div>
                            </div>
                            <div className="p-2 bg-muted/50 rounded text-xs font-mono">
                              {char.consistencyPrompt}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Environments Tab */}
                  <TabsContent value="environments" className="p-6 m-0">
                    <div className="grid grid-cols-2 gap-4">
                      {storyboard.environmentSetup?.map((env: EnvironmentLock) => (
                        <Card key={env.id}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{env.locationStyle}</CardTitle>
                              <Badge variant="outline">{env.timeOfDay}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{env.weather}</p>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Lighting:</span>
                                <p>{env.lighting}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Architecture:</span>
                                <p>{env.architecture}</p>
                              </div>
                            </div>
                            <div className="flex gap-1 mt-2">
                              {env.colorPalette?.map((color, i) => (
                                <div
                                  key={i}
                                  className="w-6 h-6 rounded border"
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Execution Tab */}
                  <TabsContent value="execution" className="p-6 m-0 space-y-4">
                    {/* Remotion Config */}
                    {storyboard.executionPlan?.remotionConfig && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Play className="w-5 h-5 text-orange-500" />
                            Remotion Configuration
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">FPS:</span>
                              <span className="ml-2 font-mono">{storyboard.executionPlan.remotionConfig.fps}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Frames:</span>
                              <span className="ml-2 font-mono">{storyboard.executionPlan.remotionConfig.durationInFrames}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Width:</span>
                              <span className="ml-2 font-mono">{storyboard.executionPlan.remotionConfig.width}px</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Height:</span>
                              <span className="ml-2 font-mono">{storyboard.executionPlan.remotionConfig.height}px</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Image Commands */}
                    {storyboard.executionPlan?.imageGenerationCommands && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Camera className="w-5 h-5 text-blue-500" />
                            Image Generation Commands ({storyboard.executionPlan.imageGenerationCommands.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-64">
                            <div className="space-y-2">
                              {storyboard.executionPlan.imageGenerationCommands.map((cmd, i) => (
                                <div key={i} className="p-2 bg-muted/50 rounded text-xs font-mono">
                                  <div className="text-orange-500 font-bold">{cmd.shotId}</div>
                                  <div className="text-muted-foreground truncate">{cmd.prompt}</div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    )}

                    {/* Tool Suggestions */}
                    {storyboard.executionPlan?.toolSuggestions && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Wand2 className="w-5 h-5 text-green-500" />
                            Tool Suggestions
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            {storyboard.executionPlan.toolSuggestions.map((tool, i) => (
                              <div key={i} className="p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold">{tool.tool}</span>
                                  <Badge variant="outline">{tool.purpose}</Badge>
                                </div>
                                {tool.githubRepo && (
                                  <a href={tool.githubRepo} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                                    {tool.githubRepo}
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StoryboardPage;
