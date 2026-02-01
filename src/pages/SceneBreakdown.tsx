"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { 
  FileSearch, 
  MapPin, 
  Users, 
  Package, 
  ChevronRight, 
  ArrowLeft,
  Download,
  Printer,
  Sparkles,
  Info,
  Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";

interface ScriptBlock {
  id: string;
  type: 'action' | 'character' | 'dialogue' | 'slugline' | 'parenthetical';
  content: string;
}

const SceneBreakdown = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const scriptId = searchParams.get('script');

  const [scriptTitle, setScriptTitle] = useState("Loading Script...");
  const [blocks, setBlocks] = useState<ScriptBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScript = async () => {
      if (!scriptId) {
        showError("No script selected for breakdown.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('scripts')
        .select('title, content')
        .eq('id', scriptId)
        .single();

      if (error) {
        showError("Failed to load script content.");
        console.error(error);
      } else if (data) {
        setScriptTitle(data.title);
        setBlocks(data.content as ScriptBlock[]);
      }
      setLoading(false);
    };

    fetchScript();
  }, [scriptId]);

  const breakdown = useMemo(() => {
    const scenes: any[] = [];
    let currentScene: any = null;

    blocks.forEach((block) => {
      if (block.type === 'slugline') {
        if (currentScene) scenes.push(currentScene);
        currentScene = {
          id: block.id,
          location: block.content,
          cast: new Set(),
          props: new Set(),
          elements: []
        };
      }

      if (currentScene) {
        if (block.type === 'character') {
          currentScene.cast.add(block.content);
        }
        
        // Simple "AI" Extraction logic for props (looking for all-caps words in action blocks)
        if (block.type === 'action') {
          const words = block.content.match(/[A-Z]{2,}/g);
          if (words) {
            words.forEach((word: string) => {
              if (word !== 'EXT' && word !== 'INT' && word !== 'DAY' && word !== 'NIGHT' && word !== 'CONTINUOUS') {
                currentScene.props.add(word);
              }
            });
          }
        }
      }
    });

    if (currentScene) scenes.push(currentScene);
    return scenes;
  }, [blocks]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const totalCast = new Set(breakdown.flatMap(s => Array.from(s.cast))).size;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                  <ArrowLeft size={20} />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Scene Breakdown</h1>
                  <p className="text-muted-foreground mt-1">Automated production analysis for "{scriptTitle}"</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => showSuccess("Breakdown exported as PDF")}>
                  <Printer size={16} />
                  Print
                </Button>
                <Button size="sm" className="gap-2 bg-purple-600 hover:bg-purple-700">
                  <Sparkles size={16} />
                  Sync to Call Sheet
                </Button>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="md:col-span-1 bg-muted/30 border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Info size={14} />
                    Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold">{breakdown.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Scenes</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {totalCast}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Cast Members</p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                      <Sparkles size={12} />
                      <span className="text-[10px] font-black uppercase">AI Extraction</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Automatically identifying props and elements from narrative context.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="md:col-span-3 space-y-4">
                {breakdown.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">No scenes found in script.</div>
                ) : (
                  breakdown.map((scene, index) => (
                    <Card key={scene.id} className="group hover:border-primary/50 transition-colors">
                      <CardHeader className="p-4 bg-muted/50 border-b flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <CardTitle className="text-sm font-bold uppercase tracking-tight">{scene.location}</CardTitle>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-background">Scene {index + 1}</Badge>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                          <div className="p-4 space-y-3">
                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                              <Users size={16} />
                              <h4 className="text-[10px] font-black uppercase tracking-widest">Cast Needed</h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {Array.from(scene.cast).map((actor: any) => (
                                <Badge key={actor} variant="secondary" className="font-bold">{actor}</Badge>
                              ))}
                              {scene.cast.size === 0 && <span className="text-xs text-muted-foreground italic">No cast identified</span>}
                            </div>
                          </div>
                          <div className="p-4 space-y-3">
                            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                              <Package size={16} />
                              <h4 className="text-[10px] font-black uppercase tracking-widest">Props / Set Items</h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {Array.from(scene.props).map((prop: any) => (
                                <Badge key={prop} variant="outline" className="border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                                  {prop}
                                </Badge>
                              ))}
                              {scene.props.size === 0 && <span className="text-xs text-muted-foreground italic">No props identified</span>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SceneBreakdown;