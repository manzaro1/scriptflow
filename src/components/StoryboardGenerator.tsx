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
  Cpu,
  Film
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showSuccess, showLoading, dismissToast } from "@/utils/toast";
import StoryboardView, { StoryboardRow } from "./StoryboardView";

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

const StoryboardGenerator = ({ isOpen, onOpenChange, scriptBlocks, scriptTitle }: StoryboardGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-pro-vision');
  const [apiKey, setApiKey] = useState("");
  const [storyboardData, setStoryboardData] = useState<StoryboardRow[]>([]);

  const extractCinematicData = (): StoryboardRow[] => {
    const extracted: StoryboardRow[] = [];
    let currentSlug = "INT. UNKNOWN - DAY";
    let shotCount = 1;

    // Analyze environment lighting from slugline
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
        // Look for emotional context in following dialogue or parentheticals
        const context = scriptBlocks.slice(index + 1, index + 5);
        const emotionBlock = context.find(b => b.type === 'parenthetical' || b.type === 'dialogue');
        const dialogueBeat = context.find(b => b.type === 'dialogue')?.content || '[Ambient Action]';
        
        const shotTypes = ['W.S', 'M.S', 'C.U', 'O.T.S', 'E.C.U'];
        const angles = ['Normal Angle', 'Low Angle', 'High Angle', 'Dutch Angle'];
        const emotions = ['Tense', 'Melancholic', 'Suspenseful', 'Hopeful', 'Aggressive'];

        // Determine specific cinematic parameters based on block keywords
        const isCloseUp = block.content.toLowerCase().match(/face|eyes|small|glowing|hand/);
        const isWide = block.content.toLowerCase().match(/skyline|city|room|landscape/);

        extracted.push({
          id: block.id,
          shotNumber: shotCount.toString().padStart(2, '0'),
          shotType: isCloseUp ? 'C.U' : (isWide ? 'W.S' : shotTypes[index % shotTypes.length]),
          cameraAngle: angles[index % angles.length],
          emotion: emotions[index % emotions.length],
          lighting: getLightingFromSlug(currentSlug),
          colorGrade: getColorGradeFromSlug(currentSlug),
          visualPrompt: `High-end cinematography, ${block.content}. shot on 35mm anamorphic. ${getColorGradeFromSlug(currentSlug)} palette. ${getLightingFromSlug(currentSlug)} lighting. Narrative focal point.`,
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
      showSuccess(`Cinematic blueprint extracted from script dynamics.`);
    }, 2000);
  };

  const handleDownload = () => {
    const toastId = showLoading("Exporting Production Blueprint...");
    
    // Simulate generation of a PDF/Structured package
    setTimeout(() => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(storyboardData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `${scriptTitle.replace(/\s+/g, '_')}_Storyboard_Package.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      dismissToast(toastId);
      showSuccess("Production package downloaded successfully.");
    }, 1500);
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
              <DialogTitle>AI Storyboard Engine</DialogTitle>
            </div>
            <DialogDescription>
              Extract exact shots, cinematic lighting, and emotional cues from your script blocks.
            </DialogDescription>
          </DialogHeader>
        )}

        <div className={showResult ? "p-0" : "p-6 py-0"}>
          {!showResult ? (
            <Tabs defaultValue="engine" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="engine" className="gap-2">
                  <Film size={14} />
                  Narrative Parser
                </TabsTrigger>
                <TabsTrigger value="keys" className="gap-2">
                  <Key size={14} />
                  Engine Keys
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="engine" className="space-y-6 pb-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Generation Model</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map(model => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name} — {model.provider}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-8 border rounded-2xl bg-muted/30 text-center">
                  <Layout size={32} className="mx-auto mb-4 text-muted-foreground/50" />
                  <h4 className="font-bold">Source: "{scriptTitle}"</h4>
                  <p className="text-xs text-muted-foreground mt-2">
                    Analyzing {scriptBlocks.length} blocks to extract a sequence of {scriptBlocks.filter(b => b.type === 'action').length} visual shots.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="keys" className="space-y-4 pb-6">
                <div className="space-y-3">
                  <Label htmlFor="custom-key" className="text-xs font-bold uppercase tracking-widest">Provider API Key</Label>
                  <Input 
                    id="custom-key" 
                    type="password" 
                    placeholder="Enter key for high-res generation..." 
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
                onRegenerateShot={handleRegenerateShot} 
              />
            </div>
          )}
        </div>

        <DialogFooter className={showResult ? "sticky bottom-0 bg-black/90 backdrop-blur border-t border-white/10 p-4 px-8 z-50 flex justify-between items-center" : "p-6 border-t"}>
          {showResult ? (
            <>
              <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => setShowResult(false)}>
                <History className="mr-2 h-4 w-4" />
                Refine Parameters
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" className="bg-transparent text-white border-white/20 hover:bg-white/10" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Package
                </Button>
                <Button className="bg-orange-600 hover:bg-orange-700 font-bold" onClick={() => showSuccess("Distribution link generated.")}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share with Crew
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="bg-orange-600 hover:bg-orange-700 h-11 min-w-[200px]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Parsing Script...
                  </>
                ) : (
                  <>
                    Forge Production Plan
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