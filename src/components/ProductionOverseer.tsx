"use client";

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Target,
  TrendingUp,
  TrendingDown,
  BrainCircuit,
  Eye,
  Flame,
  Zap,
  ListChecks,
  RefreshCw,
  Loader2,
  Lightbulb,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { showError } from "@/utils/toast";
import { callAIFunction, hasGeminiKey } from "@/utils/ai";
import NoApiKeyPrompt from "@/components/NoApiKeyPrompt";

interface ScriptBlock {
  id: string;
  type: string;
  content: string;
}

interface CharacterAnalysis {
  name: string;
  score: number;
  status: string;
  trend: string;
  note: string;
}

interface AnalysisResult {
  characters: CharacterAnalysis[];
  pacing: {
    tension: number;
    emotionalPayoff: number;
    subplotConvergence: number;
    overallRhythm: string;
  };
  observations: { type: string; text: string }[];
  requirements: { text: string; completed: boolean }[];
}

interface ProductionOverseerProps {
  blocks: ScriptBlock[];
}

const ProductionOverseer = ({ blocks }: ProductionOverseerProps) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const fetchAnalysis = async () => {
    if (!hasGeminiKey() || blocks.length < 2) return;

    setLoading(true);
    const { data, error } = await callAIFunction<AnalysisResult>('ai-script-analysis', {
      blocks,
    });
    setLoading(false);

    if (error) {
      if (error !== 'NO_API_KEY') {
        showError(error);
      }
      return;
    }

    if (data) {
      setAnalysis(data);
    }
  };

  // Auto-analyze on first mount if key is available
  useEffect(() => {
    if (hasGeminiKey() && blocks.length >= 2 && !analysis) {
      fetchAnalysis();
    }
  }, []);

  if (!hasGeminiKey()) {
    return <NoApiKeyPrompt />;
  }

  const statusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('strong') || s.includes('on track')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (s.includes('needs work') || s.includes('off')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  };

  const trendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp size={10} className="text-green-500" />;
    if (trend === 'down') return <TrendingDown size={10} className="text-red-500" />;
    return <Activity size={10} className="text-muted-foreground" />;
  };

  const obsIcon = (type: string) => {
    if (type === 'strength') return <CheckCircle2 size={12} className="text-green-500 shrink-0 mt-0.5" />;
    if (type === 'warning') return <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />;
    return <Lightbulb size={12} className="text-blue-500 shrink-0 mt-0.5" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye size={18} className="text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Overseer</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[10px] gap-1.5"
          onClick={fetchAnalysis}
          disabled={loading}
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          {loading ? 'Analyzing' : 'Analyze'}
        </Button>
      </div>

      {loading && !analysis && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 size={24} className="animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Analyzing your screenplay...</p>
        </div>
      )}

      {!analysis && !loading && (
        <div className="text-center py-8">
          <BrainCircuit size={24} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">Click "Analyze" to get AI-powered insights on your script.</p>
        </div>
      )}

      {analysis && (
        <Tabs defaultValue="intelligence" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger value="intelligence" className="text-[10px] uppercase font-bold tracking-tight">Intelligence</TabsTrigger>
            <TabsTrigger value="climax" className="text-[10px] uppercase font-bold tracking-tight">Pacing</TabsTrigger>
          </TabsList>

          <TabsContent value="intelligence" className="mt-4 space-y-4">
            {/* Characters */}
            <Card className="border-primary/20 bg-primary/5 shadow-none">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-2 text-primary">
                  <BrainCircuit size={16} />
                  <CardTitle className="text-sm">Character Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-4">
                  {analysis.characters?.map((char) => (
                    <div key={char.name} className="space-y-1.5">
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-2">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black ${statusColor(char.status)}`}>
                            {char.name[0]}
                          </div>
                          <span className="text-xs font-bold">{char.name}</span>
                          <Badge variant="secondary" className={`text-[9px] h-3.5 px-1 ${statusColor(char.status)}`}>
                            {char.status}
                          </Badge>
                          {trendIcon(char.trend)}
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground">{char.score}%</span>
                      </div>
                      <Progress value={char.score} className="h-1.5" />
                      {char.note && (
                        <p className="text-[10px] text-muted-foreground leading-tight pl-8">{char.note}</p>
                      )}
                    </div>
                  ))}
                  {(!analysis.characters || analysis.characters.length === 0) && (
                    <p className="text-xs text-muted-foreground text-center py-2">No characters detected</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Observations */}
            {analysis.observations?.length > 0 && (
              <Card className="shadow-none">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb size={16} className="text-blue-500" />
                    <CardTitle className="text-sm">Observations</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <ScrollArea className="max-h-[160px] pr-2">
                    <div className="space-y-2">
                      {analysis.observations.map((obs, i) => (
                        <div key={i} className="flex gap-2 items-start text-[11px] leading-tight">
                          {obsIcon(obs.type)}
                          <span>{obs.text}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="climax" className="mt-4 space-y-4">
            {/* Pacing Metrics */}
            <Card className="border-orange-500/20 bg-orange-500/5 shadow-none">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <Flame size={16} />
                  <CardTitle className="text-sm">Pacing Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                {[
                  { label: 'Narrative Tension', value: analysis.pacing?.tension || 0, color: 'bg-gradient-to-r from-orange-500 to-amber-500' },
                  { label: 'Emotional Payoff', value: analysis.pacing?.emotionalPayoff || 0, color: 'bg-gradient-to-r from-purple-500 to-violet-500' },
                  { label: 'Subplot Convergence', value: analysis.pacing?.subplotConvergence || 0, color: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
                ].map((metric) => (
                  <div key={metric.label} className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                      <span>{metric.label}</span>
                      <span>{metric.value}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${metric.color}`} style={{ width: `${metric.value}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Rhythm */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="shadow-none border-dashed bg-muted/20">
                <CardContent className="p-3 text-center">
                  <Target size={14} className="mx-auto mb-1 text-muted-foreground" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Rhythm</p>
                  <p className="text-lg font-bold">{analysis.pacing?.overallRhythm || '—'}</p>
                </CardContent>
              </Card>
              <Card className="shadow-none border-dashed bg-muted/20">
                <CardContent className="p-3 text-center">
                  <Activity size={14} className="mx-auto mb-1 text-muted-foreground" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Characters</p>
                  <p className="text-lg font-bold">{analysis.characters?.length || 0}</p>
                </CardContent>
              </Card>
            </div>

            {/* Requirements */}
            {analysis.requirements?.length > 0 && (
              <Card className="border-blue-500/20 shadow-none">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <ListChecks size={16} />
                    <CardTitle className="text-sm">Story Milestones</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <ScrollArea className="max-h-[120px] pr-4">
                    <div className="space-y-2">
                      {analysis.requirements.map((req, i) => (
                        <div key={i} className="flex gap-2 items-start text-[11px] leading-tight">
                          {req.completed ? (
                            <CheckCircle2 size={12} className="text-green-500 shrink-0 mt-0.5" />
                          ) : (
                            <Zap size={12} className="text-muted-foreground shrink-0 mt-0.5" />
                          )}
                          <span className={req.completed ? "text-muted-foreground line-through" : "text-foreground font-medium"}>
                            {req.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </motion.div>
  );
};

export default ProductionOverseer;
