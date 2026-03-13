"use client";

import React from 'react';
import {
  ArrowLeft,
  Save,
  Sparkles,
  BrainCircuit,
  Share2,
  Edit2,
  Files,
  Loader2,
  Lock,
  Wand2,
  Zap,
  ChevronDown,
  FileText,
  RefreshCw,
  MessageSquare,
  Globe
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import CollaboratorStack from "@/components/CollaboratorStack";
import ShareScriptModal from "@/components/ShareScriptModal";
import { cn } from "@/lib/utils";

interface EditorToolbarProps {
  scriptId: string | null;
  scriptTitle: string;
  scriptAuthor: string;
  isReadOnly: boolean;
  pageCount: number;
  hasUnsaved: boolean;
  saving: boolean;
  focusedBlockType?: string;
  onSave: () => void;
  onRenameClick: () => void;
  onStoryboardClick: () => void;
  onGenerateSceneClick: () => void;
  onOverseerClick: () => void;
  showOverseer: boolean;
  user: any;
  autocompleteEnabled: boolean;
  onAutocompleteToggle: (enabled: boolean) => void;
  onLoglineClick: () => void;
  onRewriterClick: () => void;
  onPolishClick: () => void;
  onTranslateClick: () => void;
}

const EditorToolbar = ({
  scriptId,
  scriptTitle,
  scriptAuthor,
  isReadOnly,
  pageCount,
  hasUnsaved,
  saving,
  focusedBlockType,
  onSave,
  onRenameClick,
  onStoryboardClick,
  onGenerateSceneClick,
  onOverseerClick,
  showOverseer,
  user,
  autocompleteEnabled,
  onAutocompleteToggle,
  onLoglineClick,
  onRewriterClick,
  onPolishClick,
  onTranslateClick,
}: EditorToolbarProps) => {
  return (
    <header className="h-14 border-b bg-background flex items-center px-4 justify-between shrink-0 z-10 shadow-sm">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft size={20} />
        </Button>

        <div className="h-5 w-px bg-border" />

        <div className="flex flex-col group cursor-pointer" onClick={() => !isReadOnly && onRenameClick()}>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold">{scriptTitle || "Untitled"}</span>
            {!isReadOnly && <Edit2 size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
            {isReadOnly && <Lock size={12} className="text-muted-foreground" />}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{isReadOnly ? 'Read Only' : 'Draft'}</span>
            {focusedBlockType && !isReadOnly && (
              <Badge variant="outline" className="text-[9px] font-bold uppercase py-0 px-1.5 h-4">
                {focusedBlockType}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <CollaboratorStack />

        <div className="hidden lg:flex items-center gap-1.5 px-3 h-8 bg-muted rounded-md border mr-1">
          <Files size={14} className="text-muted-foreground" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{pageCount} {pageCount === 1 ? 'Page' : 'Pages'}</span>
        </div>

        <div className="h-5 w-px bg-border hidden lg:block" />

        <Button
          variant="outline"
          size="sm"
          className="gap-2 h-8 bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:from-purple-500/20 hover:to-fuchsia-500/20"
          onClick={onStoryboardClick}
        >
          <Sparkles size={16} />
          <span className="hidden sm:inline">AI Storyboard</span>
        </Button>

        {!isReadOnly && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-8 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:from-blue-500/20 hover:to-cyan-500/20"
            onClick={onGenerateSceneClick}
          >
            <Wand2 size={16} />
            <span className="hidden sm:inline">Generate Scene</span>
          </Button>
        )}

        {/* AI Tools Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 bg-gradient-to-r from-violet-500/10 to-pink-500/10 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:from-violet-500/20 hover:to-pink-500/20"
            >
              <Wand2 size={14} />
              <span className="hidden sm:inline">AI Tools</span>
              <ChevronDown size={12} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={onLoglineClick} className="gap-2 cursor-pointer">
              <FileText size={14} /> Logline & Synopsis
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onRewriterClick} className="gap-2 cursor-pointer">
              <RefreshCw size={14} /> Scene Rewriter
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPolishClick} className="gap-2 cursor-pointer">
              <MessageSquare size={14} /> Dialogue Polish
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onTranslateClick} className="gap-2 cursor-pointer">
              <Globe size={14} /> Translate Script
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Autocomplete Toggle */}
        {!isReadOnly && (
          <div className="hidden lg:flex items-center gap-1.5 px-2 h-8 bg-muted rounded-md border">
            <Zap size={12} className={autocompleteEnabled ? 'text-amber-500' : 'text-muted-foreground'} />
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Auto</span>
            <Switch
              checked={autocompleteEnabled}
              onCheckedChange={onAutocompleteToggle}
              className="scale-75"
            />
          </div>
        )}

        <Button
          variant={showOverseer ? 'secondary' : 'ghost'}
          size="sm"
          className="gap-2 h-8"
          onClick={onOverseerClick}
        >
          <BrainCircuit size={16} />
          <span className="hidden sm:inline">Overseer</span>
        </Button>

        <div className="h-5 w-px bg-border hidden sm:block" />

        <ShareScriptModal 
          scriptId={scriptId || ''} 
          scriptTitle={scriptTitle} 
          inviterName={user?.user_metadata?.first_name || user?.email}
        >
          <Button variant="outline" size="sm" className="gap-2 h-8">
            <Share2 size={16} />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </ShareScriptModal>

        {!isReadOnly && (
          <Button
            size="sm"
            className={cn(
              "gap-2 h-8 font-semibold",
              hasUnsaved ? "bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/20" : ""
            )}
            onClick={onSave}
            disabled={saving}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span className="hidden sm:inline">{hasUnsaved ? 'Save*' : 'Save'}</span>
          </Button>
        )}
      </div>
    </header>
  );
};

export default EditorToolbar;