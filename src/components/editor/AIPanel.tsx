"use client";

import React from 'react';
import { BrainCircuit, MessageSquare, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import ProductionOverseer from "@/components/ProductionOverseer";
import CharacterChat from "@/components/CharacterChat";

interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  aiTab: string;
  setAiTab: (tab: string) => void;
  uniqueCharacters: string[];
  activeCharChat: string | null;
  setActiveCharChat: (char: string | null) => void;
  blocks: any[];
}

const AIPanel = ({
  isOpen,
  onClose,
  aiTab,
  setAiTab,
  uniqueCharacters,
  activeCharChat,
  setActiveCharChat,
  blocks
}: AIPanelProps) => {
  if (!isOpen) return null;

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 360, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="border-l bg-background flex flex-col shrink-0 overflow-hidden"
    >
      <div className="p-3 border-b flex items-center justify-between">
        <Tabs value={aiTab} onValueChange={setAiTab} className="w-full">
          <div className="flex items-center justify-between">
            <TabsList className="h-8">
              <TabsTrigger value="overseer" className="text-[10px] uppercase font-bold px-3 h-7">
                <BrainCircuit size={12} className="mr-1.5" />
                Overseer
              </TabsTrigger>
              <TabsTrigger value="chat" className="text-[10px] uppercase font-bold px-3 h-7">
                <MessageSquare size={12} className="mr-1.5" />
                Character
              </TabsTrigger>
            </TabsList>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X size={14} />
            </Button>
          </div>
        </Tabs>
      </div>
      <div className="flex-1 overflow-y-auto">
        {aiTab === 'overseer' && (
          <div className="p-4">
            <ProductionOverseer blocks={blocks} />
          </div>
        )}
        {aiTab === 'chat' && (
          <div className="h-full">
            {uniqueCharacters.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <p className="text-sm text-muted-foreground">No characters in script yet.</p>
              </div>
            ) : !activeCharChat ? (
              <div className="p-4 space-y-2">
                <p className="text-xs font-bold uppercase text-muted-foreground mb-3">Select character:</p>
                {uniqueCharacters.map(name => (
                  <button
                    key={name}
                    className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors flex items-center gap-2"
                    onClick={() => setActiveCharChat(name)}
                  >
                    <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xs font-bold text-purple-700 dark:text-purple-400">
                      {name.substring(0, 2)}
                    </div>
                    <span className="text-sm font-semibold">{name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <CharacterChat
                characterName={activeCharChat}
                scriptBlocks={blocks}
                onBack={() => setActiveCharChat(null)}
              />
            )}
          </div>
        )}
      </div>
    </motion.aside>
  );
};

export default AIPanel;