"use client";

import React, { useState } from 'react';
import { AlertTriangle, Sparkles, MessageSquare, Check, BrainCircuit } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { showSuccess } from "@/utils/toast";
import { motion, AnimatePresence } from "framer-motion";

interface DialogueFeedbackProps {
  characterName: string;
  dialogue: string;
  consistencyScore: number;
}

const DialogueFeedback = ({ characterName, dialogue, consistencyScore }: DialogueFeedbackProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const isLowConsistency = consistencyScore < 70;

  const suggestions = [
    `"I must find the blueprints, no matter the cost." (More driven)`,
    `"The deal is off. I'm taking what's mine." (More aggressive, aligns with Antagonist role)`,
    `"This wasn't the plan, but I'll adapt." (More stoic, aligns with KAI's profile)`,
  ];

  const handleApplySuggestion = (suggestion: string) => {
    showSuccess(`Applied suggestion: "${suggestion.substring(0, 30)}..."`);
    setShowSuggestions(false);
  };

  return (
    <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-6 w-6 p-0 absolute -left-8 top-1/2 -translate-y-1/2 transition-opacity ${
            isLowConsistency ? 'opacity-100 text-red-500 hover:bg-red-500/10' : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:bg-muted'
          }`}
          title={isLowConsistency ? "Consistency Alert" : "AI Suggestions"}
        >
          {isLowConsistency ? <AlertTriangle size={14} /> : <Sparkles size={14} />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 space-y-3">
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-2 border-b pb-2">
            <BrainCircuit size={16} className="text-primary" />
            <h4 className="text-sm font-bold">AI Narrative Analysis</h4>
          </div>

          {isLowConsistency && (
            <div className="flex items-start gap-2 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-400">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <p>
                **Consistency Alert:** This line scores low (68%). It contradicts {characterName}'s core motivation (Revenge) defined in their DNA profile.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-muted-foreground">Suggestions</p>
            {suggestions.map((s, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs transition-colors ${
                  index === 0 ? 'bg-primary/5 border-primary/20' : 'bg-muted/50 border-border'
                }`}
              >
                <MessageSquare size={14} className="shrink-0 mt-0.5 text-primary" />
                <p className="flex-1 leading-relaxed">{s}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30"
                  onClick={() => handleApplySuggestion(s)}
                >
                  <Check size={14} />
                </Button>
              </div>
            ))}
          </div>
        </motion.div>
      </PopoverContent>
    </Popover>
  );
};

export default DialogueFeedback;
