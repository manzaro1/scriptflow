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
  Cpu
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
import { showSuccess } from "@/utils/toast";
import StoryboardView from "./StoryboardView";

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
  { id: 'sd-3-ultra', name: 'Stable Diffusion 3 Ultra', provider: 'Stability' },
];

const StoryboardGenerator = ({ isOpen, onOpenChange, scriptBlocks, scriptTitle }: StoryboardGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-pro-vision');
  const [apiKey, setApiKey] = useState("");
  const [storyboardData, setStoryboardData] = useState<any[]>([]);

  // Simulation of the prompt-based extraction logic (Script -> Storyboard Standard JSON)
  const extractStoryboardData = () => {
    const extracted: any[] = [];
    let currentSlug = "";
    let shotCount = 1;

    // Logic: Iterate through blocks and group them into "Visual Units"
    scriptBlocks.forEach((block, index) => {
      if (block.type === 'slugline') {
        currentSlug = block.content;
      }

      if (block.type === 'action') {
        // Find associated dialogue (audio tags) immediately following this action or preceding it
        const associatedDialogue = scriptBlocks
          .slice(index + 1, index + 4)
          .filter(b => b.type === 'dialogue')
          .map(b => b.content)
          .join(" / ");

        const shotTypes = ['W.S', 'M.S', 'C.U', 'E.C.U', 'O.T.S'];
        const angles = ['Normal Angle', 'Low Angle', 'High Angle', 'Dutch Angle', 'Birds Eye'];
        const sfx = ['Atmospheric Hum', 'Action Foley', 'Distant Echo', 'Rhythmic Pulse', 'Mechanical Grind'];

        extracted.push({
          id: block.id,
          shotNumber: shotCount.toString().padStart(2, '0'),
          shotType: shotTypes[index % shotTypes.length],
          cameraAngle: angles[index % angles.length],
          visualPrompt: `Cinematic frame, ${block.content}. Lighting influenced by ${currentSlug}. Professional color grade, 35mm anamorphic lens style, hyper-realistic production design.`,
          audioTag: associatedDialogue || `[Silent / Ambient Narrative]`,
          sfx: block.content.toLowerCase().includes('rain') ? 'Rain FX' : sfx[index % sfx.length],
          transition: index === 0 ? 'FADE IN' : 'CUT TO',
          imageUrl: `https://images.unsplash.com/photo-${1550000000000 + (index * 123456)}?auto=format&fit=crop&q=80&w=1200`
        });
        shotCount++;
      }
    });

    return extracted.slice(0, 12); // Limit for the blueprint display
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate complex parsing time
    setTimeout(() => {
      const data = extractStoryboardData();
      setStoryboardData(data);
      setIsGenerating(false);
      setShowResult(true);
      showSuccess(`Shooting blueprint successfully extracted for "${scriptTitle}"`);
    }, 2500);
  };

  const handleRegenerateShot = (id: string, newPrompt?: string) => {
    // Show loading state by clearing the specific image
    setStoryboardData(prev => prev.map(row => row.id === id ? { ...row, imageUrl: undefined } : row));

    // Simulate API call to image generator with new prompt
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
    }, 1200);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={showResult ? "sm:max-w-[95vw] max-h-[95vh] overflow-y-auto bg-black border-white/10" : "sm:max-w-[600px] bg-white"}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-orange-600 text-white p-1.5 rounded-lg shadow-lg">
              <Sparkles size={18} />
            </div>
            <DialogTitle className={showResult ? "text-white" : ""}>
              {showResult ? "Master Shooting Blueprint" : "Configure AI Storyboard Engine"}
            </DialogTitle>
          </div>
          <DialogDescription className={showResult ? "text-white/60" : ""}>
            {showResult 
              ? `Dynamic shooting plan for "${scriptTitle}" generated via ${AI_MODELS.find(m => m.id === selectedModel)?.name}.`
              : "Set your parameters to extract visual beats, camera technicals, and audio tags from your script draft."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!showResult ? (
            <Tabs defaultValue="engine" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="engine" className="gap-2">
                  <Cpu size={14} />
                  Engine
                </TabsTrigger>
                <TabsTrigger value="keys" className="gap-2">
                  <Key size={14} />
                  API Management
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="engine" className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select Extraction Engine</Label>
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
                  <p className="text-[10px] text-muted-foreground italic">
                    The {AI_MODELS.find(m => m.id === selectedModel)?.provider} model will be used to transform action lines into descriptive visual prompts.
                  </p>
                </div>

                <div className="p-8 border-2 border-dashed rounded-2xl bg-muted/30 flex flex-col items-center gap-4 text-center">
                  <Layout size={40} className="text-muted-foreground/30" />
                  <div>
                    <h4 className="font-bold">Extraction Profile: Professional</h4>
                    <p className="text-xs text-muted-foreground max-w-[280px] mx-auto mt-1">
                      Targeting {scriptBlocks.filter(b => b.type === 'action').length} visual units across {scriptBlocks.filter(b => b.type === 'slugline').length} locations.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="keys" className="space-y-4 py-4">
                <div className="space-y-3">
                  <Label htmlFor="custom-key" className="text-xs font-bold uppercase tracking-widest">Provider API Key</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="custom-key" 
                      type="password" 
                      placeholder="Paste your API key here..." 
                      className="h-11"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <Button variant="outline" className="h-11" onClick={() => showSuccess("API Key linked to session")}>Link</Button>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-3">
                    <div className="bg-blue-500 text-white p-1 rounded h-fit shrink-0">
                      <Key size={12} />
                    </div>
                    <p className="text-[10px] text-blue-700 leading-normal">
                      Connecting your own key enables high-resolution (4K) image generation and removes the 10-shot daily limit.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-6">
              <StoryboardView 
                title={scriptTitle} 
                data={storyboardData} 
                onRegenerateShot={handleRegenerateShot} 
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center w-full">
          {showResult ? (
            <div className="flex justify-between w-full">
              <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => setShowResult(false)}>
                <History className="mr-2 h-4 w-4" />
                Re-Configure
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" className="bg-transparent text-white border-white/20 hover:bg-white/10">
                  <Download className="mr-2 h-4 w-4" />
                  Download Blueprint
                </Button>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Share2 className="mr-2 h-4 w-4" />
                  Distribute to Crew
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="bg-orange-600 hover:bg-orange-700 h-11 min-w-[200px] shadow-lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Forging Blueprint...
                  </>
                ) : (
                  <>
                    Forge Shooting Plan
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