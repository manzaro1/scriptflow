"use client";

import React, { useState } from 'react';
import { 
  Sparkles, 
  Loader2, 
  ArrowRight, 
  Layout,
  History,
  Download,
  Share2,
  Key,
  Film,
  FileJson,
  FileText,
  Monitor
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showSuccess, showLoading, dismissToast, showError } from "@/utils/toast";
import StoryboardView, { StoryboardRow } from "./StoryboardView";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ScriptBlock {
  id: string;
  type: string;
  content: string;
}

interface StoryboardGeneratorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  scriptBlocks: ScriptBlock[];
  scriptTitle: string;
}

const AI_MODELS = [
  { id: 'gemini-pro-vision', name: 'Gemini 1.5 Pro (Vision)', provider: 'Google' },
  { id: 'dalle-3-cinematic', name: 'DALL-E 3 (Cinematic)', provider: 'OpenAI' },
  { id: 'flux-1-pro', name: 'Flux.1 Pro (Narrative)', provider: 'Black Forest' },
];

const ASPECT_RATIOS = [
  { id: '2.39:1', name: '2.39:1 (Anamorphic Scope)' },
  { id: '1.85:1', name: '1.85:1 (Flat Cinematic)' },
  { id: '16:9', name: '16:9 (HD / Digital)' },
];

const StoryboardGenerator = ({ isOpen, onOpenChange, scriptBlocks, scriptTitle }: StoryboardGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-pro-vision');
  const [aspectRatio, setAspectRatio] = useState<'2.39:1' | '1.85:1' | '16:9'>('2.39:1');
  const [apiKey, setApiKey] = useState("");
  const [storyboardData, setStoryboardData] = useState<StoryboardRow[]>([]);

  const extractCinematicData = (): StoryboardRow[] => {
    const extracted: StoryboardRow[] = [];
    let currentSlug = "INT. UNKNOWN - DAY";
    let shotCount = 1;

    const getLightingFromSlug = (slug: string) => {
      if (slug.toUpperCase().includes('NIGHT')) return 'Chiaroscuro / Neon Low Light';
      if (slug.toUpperCase().includes('EXT.')) return 'Natural High Contrast';
      return 'Diffused Practical Lighting';
    };

    const getColorGradeFromSlug = (slug: string) => {
      if (slug.toUpperCase().includes('NIGHT')) return 'Teal & Orange / Cyberpunk';
      if (slug.toUpperCase().includes('EXT.')) return 'Warm Golden Hour / Desaturated';
      return 'Neutral Cinematic';
    };

    scriptBlocks.forEach((block, index) => {
      if (block.type === 'slugline') {
        currentSlug = block.content;
      }

      if (block.type === 'action') {
        const context = scriptBlocks.slice(index + 1, index + 5);
        const dialogueBeat = context.find(b => b.type === 'dialogue')?.content || '[Ambient Action]';
        
        const shotTypes = ['W.S', 'M.S', 'C.U', 'O.T.S', 'E.C.U'];
        const movements = ['Static / Locked', 'Slow Dolly In', 'Lateral Tracking Shot', 'Handheld / Shaky', 'Crane Down'];
        const angles = ['Normal Angle', 'Low Angle', 'High Angle', 'Dutch Angle'];
        const emotions = ['Tense', 'Melancholic', 'Suspenseful', 'Hopeful', 'Aggressive'];
        const lenses = ['14mm Ultra-Wide', '24mm Wide', '35mm Narrative', '50mm Prime', '85mm Portrait'];

        const isCloseUp = block.content.toLowerCase().match(/face|eyes|small|glowing|hand/);
        const isWide = block.content.toLowerCase().match(/skyline|city|room|landscape/);

        const currentShotType = isCloseUp ? 'C.U' : (isWide ? 'W.S' : shotTypes[index % shotTypes.length]);
        const currentLens = isCloseUp ? '85mm Portrait' : (isWide ? '14mm Ultra-Wide' : lenses[index % lenses.length]);

        extracted.push({
          id: block.id,
          sceneTitle: currentSlug,
          shotNumber: shotCount.toString().padStart(2, '0'),
          shotType: currentShotType,
          cameraAngle: angles[index % angles.length],
          movement: movements[index % movements.length],
          lens: currentLens,
          emotion: emotions[index % emotions.length],
          lighting: getLightingFromSlug(currentSlug),
          colorGrade: getColorGradeFromSlug(currentSlug),
          blockingNotes: `Actor enters from ${index % 2 === 0 ? 'Camera Left' : 'Camera Right'}. Maintain focus on foreground elements. Primary eye-line directed at mid-frame.`,
          visualPrompt: `High-end cinematography, ${block.content}. lens: ${currentLens}. aspect: ${aspectRatio}. ${getColorGradeFromSlug(currentSlug)} palette. ${getLightingFromSlug(currentSlug)} lighting. Emotional tone: ${emotions[index % emotions.length]}. [Character Seed: Narrative Consistenty Active]`,
          audioTag: dialogueBeat,
          sfx: block.content.toLowerCase().includes('rain') ? 'Rain / Atmospheric Patter' : 'Dynamic Foley',
          transition: index === 0 ? 'FADE IN' : 'CUT TO',
          imageUrl: `https://images.unsplash.com/photo-${1550000000000 + (index * 123456)}?auto=format&fit=crop&q=80&w=1200`
        });
        shotCount++;
      }
    });

    return extracted.slice(0, 15);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const data = extractCinematicData();
      setStoryboardData(data);
      setIsGenerating(false);
      setShowResult(true);
      showSuccess(`Production Blueprint forged with ${aspectRatio} masking.`);
    }, 2000);
  };

  const handleExport = async (format: 'json' | 'pdf') => {
    const toastId = showLoading(`Exporting Master Blueprint (${format.toUpperCase()})...`);
    
    try {
      if (format === 'json') {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(storyboardData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${scriptTitle.replace(/\s+/g, '_')}_Blueprint.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      } else {
        const element = document.getElementById('storyboard-blueprint');
        if (!element) throw new Error("Storyboard element not found");
        
        const canvas = await html2canvas(element, {
          useCORS: true,
          scale: 2,
          backgroundColor: '#050505'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${scriptTitle.replace(/\s+/g, '_')}_Master_Production_Blueprint.pdf`);
      }
      
      dismissToast(toastId);
      showSuccess("Export complete.");
    } catch (error) {
      dismissToast(toastId);
      showError("Export failed.");
    }
  };

  const handleRegenerateShot = (id: string, newPrompt?: string) => {
    setStoryboardData(prev => prev.map(row => row.id === id ? { ...row, imageUrl: undefined } : row));

    setTimeout(() => {
      setStoryboardData(prev => prev.map(row => {
        if (row.id === id) {
          return { 
            ...row, 
            visualPrompt: newPrompt || row.visualPrompt,
            imageUrl: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 10000000)}?auto=format&fit=crop&q=80&w=1200`
          };
        }
        return row;
      }));
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={showResult ? "sm:max-w-[98vw] max-h-[95vh] overflow-y-auto bg-black border-white/10 p-0" : "sm:max-w-[600px] bg-white"}>
        {!showResult && (
          <DialogHeader className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-orange-600 text-white p-1.5 rounded-lg shadow-lg">
                <Sparkles size={18} />
              </div>
              <DialogTitle>Forge Technical Blueprint</DialogTitle>
            </div>
            <DialogDescription>
              Configure the cinematic parameters for your shot-by-shot extraction.
            </DialogDescription>
          </DialogHeader>
        )}

        <div className={showResult ? "p-0" : "p-6 py-0"}>
          {!showResult ? (
            <Tabs defaultValue="optics" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="optics" className="gap-2">
                  <Monitor size={14} />
                  Optics & Frame
                </TabsTrigger>
                <TabsTrigger value="engine" className="gap-2">
                  <Key size={14} />
                  Engine Config
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="optics" className="space-y-6 pb-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Target Aspect Ratio</Label>
                    <Select value={aspectRatio} onValueChange={(v: any) => setAspectRatio(v)}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASPECT_RATIOS.map(ratio => (
                          <SelectItem key={ratio.id} value={ratio.id}>{ratio.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Lens Simulation</Label>
                    <Select defaultValue="anamorphic">
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select Lens Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="anamorphic">Anamorphic (Oval Bokeh)</SelectItem>
                        <SelectItem value="spherical">Spherical (Natural)</SelectItem>
                        <SelectItem value="vintage">Vintage / 70s Glass</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-8 border rounded-2xl bg-muted/30 text-center border-dashed border-primary/20">
                  <Film size={32} className="mx-auto mb-4 text-orange-500/50" />
                  <h4 className="font-bold">Production: "{scriptTitle}"</h4>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-2">
                    Extracting {scriptBlocks.filter(b => b.type === 'action').length} shots with focal length heuristics
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="engine" className="space-y-4 pb-6">
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Model Pipeline</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map(model => (
                        <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="custom-key" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Provider API Key</Label>
                  <Input 
                    id="custom-key" 
                    type="password" 
                    placeholder="Enter key for HD generation..." 
                    className="h-11"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="p-8">
              <StoryboardView 
                title={scriptTitle} 
                data={storyboardData} 
                aspectRatio={aspectRatio}
                onRegenerateShot={handleRegenerateShot} 
              />
            </div>
          )}
        </div>

        <DialogFooter className={showResult ? "sticky bottom-0 bg-black/90 backdrop-blur border-t border-white/10 p-5 px-10 z-50 flex justify-between items-center" : "p-6 border-t"}>
          {showResult ? (
            <>
              <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => setShowResult(false)}>
                <History className="mr-2 h-4 w-4" />
                Refine Optics
              </Button>
              <div className="flex gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="bg-transparent text-white border-white/20 hover:bg-white/10">
                      <Download className="mr-2 h-4 w-4" />
                      Export Package
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-black border-white/10 text-white">
                    <DropdownMenuItem onClick={() => handleExport('json')} className="hover:bg-white/10 cursor-pointer gap-2">
                      <FileJson size={14} className="text-blue-400" />
                      JSON Structure
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('pdf')} className="hover:bg-white/10 cursor-pointer gap-2">
                      <FileText size={14} className="text-orange-400" />
                      PDF Blueprint
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button className="bg-orange-600 hover:bg-orange-700 font-bold px-8" onClick={() => showSuccess("Distribution link generated.")}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Distribute to Crew
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="bg-orange-600 hover:bg-orange-700 h-11 min-w-[200px] font-bold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Extracting Production Data...
                  </>
                ) : (
                  <>
                    Forge Cinematic Blueprint
                    <ArrowRight size={18} className="ml-2" />
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StoryboardGenerator;