"use client";

import React from 'react';
import { KeyRound } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

interface NoApiKeyPromptProps {
  compact?: boolean;
}

const NoApiKeyPrompt = ({ compact = false }: NoApiKeyPromptProps) => {
  const navigate = useNavigate();

  if (compact) {
    return (
      <button
        onClick={() => navigate('/profile?tab=ai')}
        className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-primary transition-colors"
      >
        <KeyRound size={12} />
        <span>Set up AI key</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
        <KeyRound size={20} className="text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-semibold">AI features require an API key</p>
        <p className="text-xs text-muted-foreground mt-1">
          Add your Google Gemini API key in Settings to enable AI-powered writing assistance.
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="gap-2 mt-1"
        onClick={() => navigate('/profile?tab=ai')}
      >
        <KeyRound size={14} />
        Go to Settings
      </Button>
    </div>
  );
};

export default NoApiKeyPrompt;
