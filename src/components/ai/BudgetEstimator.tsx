"use client";

import React, { useState } from 'react';
import { DollarSign, Loader2, TrendingUp, MapPin, Users, Clapperboard, Wand2, Package, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { aiPrompt } from "@/utils/ai-client";
import { showError } from "@/utils/toast";

interface ScriptBlock {
  id: string;
  type: string;
  content: string;
}

interface BudgetCategory {
  category: string;
  lowEstimate: number;
  highEstimate: number;
  notes: string;
  icon: string;
}

interface BudgetData {
  totalLow: number;
  totalHigh: number;
  currency: string;
  budgetTier: string;
  categories: BudgetCategory[];
  warnings: string[];
  assumptions: string;
}

interface BudgetEstimatorProps {
  blocks: ScriptBlock[];
  sceneCount: number;
  castCount: number;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Locations': <MapPin size={14} className="text-blue-500" />,
  'Cast & Talent': <Users size={14} className="text-violet-500" />,
  'Crew': <Clapperboard size={14} className="text-amber-500" />,
  'VFX & Post': <Wand2 size={14} className="text-pink-500" />,
  'Props & Wardrobe': <Package size={14} className="text-orange-500" />,
  'Equipment': <Clapperboard size={14} className="text-teal-500" />,
};

const formatCurrency = (num: number) => {
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num}`;
};

const BudgetEstimator = ({ blocks, sceneCount, castCount }: BudgetEstimatorProps) => {
  const [estimating, setEstimating] = useState(false);
  const [budget, setBudget] = useState<BudgetData | null>(null);

  const estimate = async () => {
    if (blocks.length === 0) {
      showError("No script content to analyze.");
      return;
    }

    setEstimating(true);
    setBudget(null);

    const scriptText = blocks.map(b => `[${b.type}] ${b.content}`).join('\n');

    const { text, error } = await aiPrompt(
      `You are an experienced film production budget estimator. Analyze this screenplay and provide a rough budget estimate.

Script has ${sceneCount} scenes and ${castCount} cast members.

Analyze the script for:
- Number and type of locations (interior vs exterior, special locations)
- VFX requirements (mentions of explosions, CGI, special effects, supernatural elements)
- Stunt requirements
- Period piece elements (if any)
- Night shoots
- Cast size and roles
- Props and wardrobe complexity

Return a JSON object with:
- "totalLow": minimum total budget in USD
- "totalHigh": maximum total budget in USD
- "currency": "USD"
- "budgetTier": one of "Micro-Budget" (<$500K), "Low-Budget" ($500K-$5M), "Mid-Budget" ($5M-$20M), "High-Budget" ($20M-$80M), "Blockbuster" ($80M+)
- "categories": array of { "category": name, "lowEstimate": number, "highEstimate": number, "notes": brief note, "icon": category name }
  Categories must include: "Locations", "Cast & Talent", "Crew", "VFX & Post", "Props & Wardrobe", "Equipment"
- "warnings": array of strings noting cost risks (e.g. "Multiple night exterior scenes will increase lighting costs")
- "assumptions": 1-2 sentences about key assumptions made

Return ONLY valid JSON, no markdown fences.`,
      scriptText,
      0.4
    );

    setEstimating(false);

    if (error) {
      showError(error === 'NO_API_KEY' ? 'Set up your API key in Settings > AI' : error);
      return;
    }

    try {
      const parsed = JSON.parse(text.trim());
      setBudget(parsed);
    } catch {
      showError("Failed to parse budget estimate.");
    }
  };

  if (!budget && !estimating) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center space-y-3">
          <DollarSign size={32} className="mx-auto text-green-500" />
          <h3 className="font-semibold text-sm">AI Budget Estimator</h3>
          <p className="text-xs text-muted-foreground">
            Get a rough production budget estimate based on your script's locations, cast, VFX needs, and complexity.
          </p>
          <Button onClick={estimate} className="gap-2">
            <TrendingUp size={14} />
            Estimate Budget
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (estimating) {
    return (
      <Card>
        <CardContent className="p-6 flex flex-col items-center justify-center gap-2">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Analyzing production costs...</p>
        </CardContent>
      </Card>
    );
  }

  if (!budget) return null;

  const maxCategory = Math.max(...budget.categories.map(c => c.highEstimate));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <DollarSign size={14} className="text-green-500" />
            Budget Estimate
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{budget.budgetTier}</Badge>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={estimate}>
              Re-estimate
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Range */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Estimated Total</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-green-700 dark:text-green-400">{formatCurrency(budget.totalLow)}</span>
            <span className="text-muted-foreground">—</span>
            <span className="text-2xl font-black text-green-700 dark:text-green-400">{formatCurrency(budget.totalHigh)}</span>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          {budget.categories.map((cat, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {CATEGORY_ICONS[cat.category] || <DollarSign size={14} />}
                  <span className="text-xs font-semibold">{cat.category}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(cat.lowEstimate)} — {formatCurrency(cat.highEstimate)}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
                  style={{ width: `${(cat.highEstimate / maxCategory) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">{cat.notes}</p>
            </div>
          ))}
        </div>

        {/* Warnings */}
        {budget.warnings?.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Cost Risks</p>
            {budget.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground">{w}</p>
              </div>
            ))}
          </div>
        )}

        {/* Assumptions */}
        <p className="text-[9px] text-muted-foreground italic border-t pt-2">
          {budget.assumptions}
        </p>
      </CardContent>
    </Card>
  );
};

export default BudgetEstimator;
