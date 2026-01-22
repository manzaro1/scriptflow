"use client";

import React from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Target, 
  TrendingUp,
  BrainCircuit,
  Eye,
  Flame,
  Zap,
  ListChecks
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

const ProductionOverseer = () => {
  const characters = [
    { name: 'KAI', score: 92, status: 'On Track', trend: 'stable' },
    { name: 'SARA', score: 68, status: 'Off Hook', trend: 'down', alert: 'Dialogue contradicts motivation in Scene 12' },
  ];

  const climaxMetrics = [
    { label: 'Narrative Tension', value: 78, color: 'bg-orange-500' },
    { label: 'Emotional Payoff', value: 45, color: 'bg-purple-500' },
    { label: 'Subplot Convergence', value: 62, color: 'bg-blue-500' },
  ];

  const requirements = [
    { text: "Establish the 'Point of No Return' by Scene 25", completed: true },
    { text: "Escalate Antagonist pressure to peak in Scene 32", completed: false },
    { text: "Resolve the 'Father' subplot before the final confrontation", completed: false },
    { text: "Plant the 'Hidden Asset' clue in Act 2", completed: true },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye size={18} className="text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Production Overseer</h3>
        </div>
        <Badge variant="outline" className="animate-pulse bg-green-50 text-green-700 border-green-200">
          Live Analysis
        </Badge>
      </div>

      <Tabs defaultValue="climax" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-9">
          <TabsTrigger value="intelligence" className="text-[10px] uppercase font-bold tracking-tight">Intelligence</TabsTrigger>
          <TabsTrigger value="climax" className="text-[10px] uppercase font-bold tracking-tight">Climax Engine</TabsTrigger>
        </TabsList>

        <TabsContent value="intelligence" className="mt-4 space-y-4">
          <Card className="border-primary/20 bg-primary/5 shadow-none">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-2 text-primary">
                <BrainCircuit size={16} />
                <CardTitle className="text-sm">Character DNA Tracking</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-4">
                {characters.map((mon) => (
                  <div key={mon.name} className="space-y-1.5">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{mon.name}</span>
                        <Badge 
                          variant="secondary" 
                          className={`text-[9px] h-3.5 px-1 ${
                            mon.status === 'Off Hook' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {mon.status}
                        </Badge>
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">{mon.score}% Consistency</span>
                    </div>
                    <Progress value={mon.score} className="h-1.5" />
                    {mon.alert && (
                      <div className="flex items-start gap-1.5 mt-1 text-[10px] text-red-600 bg-red-50 p-1.5 rounded border border-red-100">
                        <AlertTriangle size={10} className="shrink-0 mt-0.5" />
                        <span>{mon.alert}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="climax" className="mt-4 space-y-4">
          <Card className="border-orange-500/20 bg-orange-500/5 shadow-none">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-2 text-orange-600">
                <Flame size={16} />
                <CardTitle className="text-sm">Climax Trajectory</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              {climaxMetrics.map((metric) => (
                <div key={metric.label} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                    <span>{metric.label}</span>
                    <span>{metric.value}%</span>
                  </div>
                  <Progress value={metric.value} className="h-1.5" indicatorClassName={metric.color} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 shadow-none">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-2 text-blue-600">
                <ListChecks size={16} />
                <CardTitle className="text-sm">Climax Requirements</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ScrollArea className="h-[120px] pr-4">
                <div className="space-y-2">
                  {requirements.map((req, i) => (
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
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-2 gap-3">
        <Card className="shadow-none border-dashed bg-muted/20">
          <CardContent className="p-3 text-center">
            <Target size={14} className="mx-auto mb-1 text-muted-foreground" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Flow</p>
            <p className="text-lg font-bold">Good</p>
          </CardContent>
        </Card>
        <Card className="shadow-none border-dashed bg-muted/20">
          <CardContent className="p-3 text-center">
            <Activity size={14} className="mx-auto mb-1 text-muted-foreground" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Pacing</p>
            <p className="text-lg font-bold">Fast</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductionOverseer;