"use client";

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Loader2, 
  ArrowRight, 
  Layout,
  History,
  Download,
  Share2,
  Settings,
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
  { id: 'gemini-pro', name: 'Gemini Pro Vision', provider: 'Google' },
  { id: 'dalle-3', name: 'DALL-E 3', provider: 'OpenAI' },
  { id: 'stable-diffusion-xl', name: 'Stable Diffusion XL', provider: 'Stability AI' },
  { id: 'midjourney-v6', name: 'Midjourney v6', provider: 'Discord/API' },
];

const StoryboardGenerator = ({ isOpen, onOpenChange, scriptBlocks, scriptTitle }: StoryboardGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-pro');
  const [apiKey, setApiKey] = useState("");
  const [storyboardData, setStoryboardData] = useState<any[]>([]);

  // Function to extract shots from script blocks
  const extractShotsFromScript = () => {
    const shots: any[] = [];
    let currentScene = "";
    
    scriptBlocks.forEach((block, index) => {
      if (block.type === 'slugline') {
        currentScene = block.content;
      }
      
      // Every action block or slugline can be a shot
      if (block.type === 'action' || block.type === 'slugline') {
        const shotTypes = ['W.S', 'M.S', 'C.U', 'E.C.U', 'O.T.S'];
        const angles = ['Normal Angle', 'Low Angle', 'High Angle', 'Dutch Angle'];
        
        shots.push({
          id: block.id,
          shot: shotTypes[index % shotTypes.length],
          cameraAngle: angles[index % angles.length],
          subjectAngle: 'Normal Angle',
          visual: block.content || (block.type === 'slugline' ? "Establishing shot of " + block.content : "General action scene"),
          audio: 'Ambient',
          sound: block.type === 'slugline' ? 'Atmospheric' : 'Action foley',
          transition: index === 0 ? 'Fade In' : 'Cut To',
          imageUrl: `https://images.unsplash.com/photo-${1550000000000 + index}?auto=format&fit=crop&q=80&w=800`
        });
      }
    });

    // Limit to first 10 shots for performance in demo
    return shots.slice(0, 10);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const extracted = extractShotsFromScript();
      setStoryboardData(extracted);
      setIsGenerating(false);
      setShowResult(true);
      showSuccess(`Shooting plan forged for "${scriptTitle}"`);
    }, 2000);
  };

  const handleRegenerateShot = (id: string, newPrompt?: string) => {
    // Set image to null briefly to show loading state in view
    setStoryboardData(prev => prev.map(row => row.id === id ? { ...row, imageUrl: undefined } : row));

    setTimeout(() => {
      setStoryboardData(prev => prev.map(row => {
        if (row.id === id) {
          return { 
            ...row, 
            visual: newPrompt || row.visual,
            imageUrl: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?auto=format&fit=crop&q=80&w=800`
          };
        }
        return row;
      }));
    }, 800);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={showResult ? "sm:max-w-[95vw] max-h-[95vh] overflow-y-auto" : "sm:max-w-[600px]"}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-purple-600 text-white p-1.5 rounded-lg">
              <Sparkles size={18} />
            </div>
            <DialogTitle>{showResult ? "Active Shooting Plan" : "AI Storyboard Configuration"}</DialogTitle>
          </div>
          <DialogDescription>
            {showResult 
              ? `Dynamic shooting plan for "${scriptTitle}" generated using ${AI_MODELS.find(m => m.id === selectedModel)?.name}.`
              : "Configure your AI engine and image generation parameters for this script."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!showResult ? (
            <Tabs defaultValue="model" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="model" className="gap-2">
                  <Cpu size={14} />
                  Engine Selection
                </TabsTrigger>
                <TabsTrigger value="api" className="gap-2">
                  <Key size={14} />
                  API Management
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="model" className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Preferred AI Model</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map(model => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name} ({model.provider})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                    Selected: {AI_MODELS.find(m => m.id === selectedModel)?.provider} Proprietary Engine
                  </p>
                </div>

                <div className="p-6 border-2 border-dashed rounded-xl bg-muted/30 flex flex-col items-center gap-3 text-center">
                  <Layout size={32} className="text-muted-foreground/40" />
                  <div>
                    <h4 className="text-sm font-bold">Flow Analysis Ready</h4>
                    <p className="text-xs text-muted-foreground">
                      "{scriptTitle}" draft contains {scriptBlocks.length} blocks. 
                      Initial shooting plan will extract approximately {scriptBlocks.filter(b => b.type === 'action' || b.type === 'slugline').length} shots.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="api" className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">Custom API Key (Optional)</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="api-key" 
                      type="password" 
                      placeholder="sk-..." 
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <Button variant="outline" onClick={() => showSuccess("API Key validated for " + AI_MODELS.find(m => m.id === selectedModel)?.provider)}>Link</Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Link your own API key to bypass rate limits and enable high-fidelity {selectedModel.includes('dalle') ? 'DALL-E' : 'Vision'} features.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2 bg-muted/50 p-2 rounded-lg border border-dashed">
                <div className="flex items-center gap-6 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                    <Cpu size={14} className="text-purple-600" />
                    Engine: {AI_MODELS.find(m => m.id === selectedModel)?.name}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Settings size={14} className="text-purple-600" />
                    Format: Cinematic (2:1)
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-black hover:bg-purple-100 hover:text-purple-700" onClick={() => setShowResult(false)}>
                  Reconfigure Engine
                </Button>
              </div>
              <StoryboardView title={scriptTitle} data={storyboardData} onRegenerateShot={handleRegenerateShot} />
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center w-full">
          {showResult ? (
            <div className="flex justify-between w-full">
              <Button variant="outline" onClick={() => setShowResult(false)} className="gap-2">
                <History size={16} />
                Re-Forge Plan
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <Download size={16} />
                  Export Blueprint
                </Button>
                <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
                  <Share2 size={16} />
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
                className="bg-purple-600 hover:bg-purple-700 gap-2 min-w-[180px]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Extracting Scene DNA...
                  </>
                ) : (
                  <>
                    Forge Shooting Plan
                    <ArrowRight size={16} />
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