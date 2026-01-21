"use client";

import React, { useState } from 'react';
import { 
  Sparkles, 
  Loader2, 
  ArrowRight, 
  Layout,
  History,
  Download,
  Share2
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
import { showSuccess, showError } from "@/utils/toast";
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
  },
  {
    id: '3',
    shot: 'M.S',
    cameraAngle: 'High Angle',
    subjectAngle: 'Frontal',
    visual: 'KAI looks at the glowing COIL in his hand',
    audio: 'Breathless whisper',
    sound: 'Pulsing synth',
    transition: 'Dissolve',
    imageUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2670&auto=format&fit=crop'
  }
];

const StoryboardGenerator = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate AI extraction and generation
    setTimeout(() => {
      setIsGenerating(false);
      setShowResult(true);
      showSuccess("Storyboard generated with Gemini AI Engine");
    }, 3000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={showResult ? "sm:max-w-[95vw] max-h-[90vh] overflow-y-auto" : "sm:max-w-[500px]"}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-purple-600 text-white p-1.5 rounded-lg">
              <Sparkles size={18} />
            </div>
            <DialogTitle>{showResult ? "Generated Shooting Plan" : "AI Storyboard Generator"}</DialogTitle>
          </div>
          <DialogDescription>
            {showResult 
              ? "AI has extracted shot details and generated visual boards based on your script." 
              : "Our AI engine will break down your script into shots, angles, and visual descriptions."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {!showResult ? (
            <div className="space-y-6 text-center">
              <div className="p-10 border-2 border-dashed rounded-xl bg-muted/30 flex flex-col items-center gap-4">
                <Layout size={48} className="text-muted-foreground/40" />
                <div>
                  <h4 className="font-bold">Ready for extraction</h4>
                  <p className="text-sm text-muted-foreground">Using current draft of "The Neon Horizon"</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-[10px] font-bold uppercase text-primary mb-1">Model</p>
                  <p className="text-sm font-medium">Gemini Pro Vision</p>
                </div>
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-[10px] font-bold uppercase text-primary mb-1">Style</p>
                  <p className="text-sm font-medium">Cinematic Realism</p>
                </div>
              </div>
            </div>
          ) : (
            <StoryboardView data={MOCK_STORYBOARD_DATA} />
          )}
        </div>

        <DialogFooter className="flex justify-between items-center w-full">
          {showResult ? (
            <div className="flex justify-between w-full">
              <Button variant="outline" onClick={() => setShowResult(false)} className="gap-2">
                <History size={16} />
                Regenerate
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
                className="bg-purple-600 hover:bg-purple-700 gap-2 min-w-[140px]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Analyzing Script...
                  </>
                ) : (
                  <>
                    Forge Storyboard
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