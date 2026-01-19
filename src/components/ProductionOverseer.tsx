"use client";

import React from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Target, 
  TrendingUp,
  BrainCircuit,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const ProductionOverseer = () => {
  const monitors = [
    { name: 'KAI', score: 92, status: 'On Track', trend: 'stable' },
    { name: 'SARA', score: 68, status: 'Off Hook', trend: 'down', alert: 'Dialogue contradicts motivation in Scene 12' },
    { name: 'VEO', score: 85, status: 'Improving', trend: 'up' },
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

      <Card className="border-primary/20 bg-primary/5 shadow-none">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center gap-2 text-primary">
            <BrainCircuit size={16} />
            <CardTitle className="text-sm">Narrative Intelligence</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-4">
            {monitors.map((mon) => (
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