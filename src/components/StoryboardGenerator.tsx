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

const MOCK_STORYBOARD_DATA = [
  {
    id: '1',
    shot: 'C.U',
    cameraAngle: 'Normal Angle',
    subjectAngle: 'Normal Angle',
    visual: 'a man carrying a wood in the forest',
    audio: 'him singing',
    sound: 'birds',
    transition: 'fade in',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop'
  },
  {
    id: '2',
    shot: 'W.S',
    cameraAngle: 'Low Angle',
    subjectAngle: 'Profile',
    visual: 'A futuristic city skyline flickering with purple neon',
    audio: 'Humming of engines',
    sound: 'Electrical crackle',
    transition: 'Cut to',
    imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2670&auto=format&fit=crop'
  }
];

const AI_MODELS = [
  { id: 'gemini-pro', name: 'Gemini Pro Vision', provider: 'Google' },
  { id: 'dalle-3', name: 'DALL-E 3', provider: 'OpenAI' },
  { id: 'stable-diffusion-xl', name: 'Stable Diffusion XL', provider: 'Stability AI' },
  { id: 'midjourney-v6', name: 'Midjourney v6', provider: 'Discord/API' },
];

const StoryboardGenerator = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-pro');
  const [apiKey, setApiKey] = useState("");
  const [storyboardData, setStoryboardData] = useState(MOCK_STORYBOARD_DATA);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowResult(true);
      showSuccess(`Storyboard generated using ${AI_MODELS.find(m => m.id === selectedModel)?.name}`);
    }, 2500);
  };

  const handleRegenerateShot = (id: string, newPrompt?: string) => {
    setStoryboardData(prev => prev.map(row => {
      if (row.id === id) {
        // In a real app, this would call the selected AI API with the prompt
        return { 
          ...row, 
          visual: newPrompt || row.visual,
          imageUrl: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?auto=format&fit=crop&q=80&w=800`
        };
      }
      return row;
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={showResult ? "sm:max-w-[95vw] max-h-[90vh] overflow-y-auto" : "sm:max-w-[600px]"}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-purple-600 text-white p-1.5 rounded-lg">
              <Sparkles size={18} />
            </div>
            <DialogTitle>{showResult ? "Active Shooting Plan" : "AI Storyboard Configuration"}</DialogTitle>
          </div>
          <DialogDescription>
            Configure your AI engine and image generation parameters.
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
                  <p className="text-[10px] text-muted-foreground">Each model has a unique cinematic style and prompt interpretation.</p>
                </div>

                <div className="p-6 border-2 border-dashed rounded-xl bg-muted/30 flex flex-col items-center gap-3 text-center">
                  <Layout size={32} className="text-muted-foreground/40" />
                  <div>
                    <h4 className="text-sm font-bold">Extraction Ready</h4>
                    <p className="text-xs text-muted-foreground">"The Neon Horizon" draft will be parsed for 12 shots.</p>
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
                    <Button variant="outline" onClick={() => showSuccess("API Key validated")}>Link</Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Leave blank to use ScriptFlow shared credits (limited). Use your own key for unlimited high-res generation.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Cpu size={14} className="text-purple-600" />
                    Model: {AI_MODELS.find(m => m.id === selectedModel)?.name}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Settings size={14} className="text-purple-600" />
                    Res: 2048 x 1024 (Cinematic)
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold" onClick={() => setShowResult(false)}>
                  Modify Config
                </Button>
              </div>
              <StoryboardView data={storyboardData} onRegenerateShot={handleRegenerateShot} />
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center w-full">
          {showResult ? (
            <div className="flex justify-between w-full">
              <Button variant="outline" onClick={() => setShowResult(false)} className="gap-2">
                <History size={16} />
                Reset Board
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <Download size={16} />
                  Export PDF
                </Button>
                <Button className="gap-2">
                  <Share2 size={16} />
                  Share Plan
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="bg-purple-600 hover:bg-purple-700 gap-2 min-w-[160px]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Powering AI Engine...
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