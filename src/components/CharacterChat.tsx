"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, BrainCircuit, ArrowLeft, Copy } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/utils/toast";
import { callAIFunction, hasGeminiKey } from "@/utils/ai";
import NoApiKeyPrompt from "@/components/NoApiKeyPrompt";

interface ScriptBlock {
  id: string;
  type: string;
  content: string;
}

interface Message {
  id: string;
  role: 'user' | 'character';
  content: string;
}

interface CharacterChatProps {
  characterName: string;
  scriptBlocks: ScriptBlock[];
  onBack: () => void;
}

const CharacterChat = ({ characterName, scriptBlocks, onBack }: CharacterChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'character',
      content: `I'm ${characterName}. Ask me about my motivations, try new dialogue on me, or let's workshop a scene together.`
    }
  ]);
  const [input, setInput] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Extract this character's dialogue from the script
  const getCharacterDialogue = (): { scene: string; line: string }[] => {
    const dialogueLines: { scene: string; line: string }[] = [];
    let currentScene = 'Unknown Scene';

    for (let i = 0; i < scriptBlocks.length; i++) {
      const block = scriptBlocks[i];
      if (block.type === 'slugline') {
        currentScene = block.content;
      }
      if (block.type === 'character' && block.content.toUpperCase() === characterName.toUpperCase()) {
        // Next block(s) should be their dialogue
        for (let j = i + 1; j < scriptBlocks.length; j++) {
          if (scriptBlocks[j].type === 'dialogue') {
            dialogueLines.push({ scene: currentScene, line: scriptBlocks[j].content });
          } else if (scriptBlocks[j].type !== 'parenthetical') {
            break;
          }
        }
      }
    }
    return dialogueLines;
  };

  const handleSend = async () => {
    if (!input.trim() || isResponding) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    const messageToSend = input;
    setInput('');
    setIsResponding(true);

    const { data, error } = await callAIFunction('ai-character-chat', {
      characterName,
      userMessage: messageToSend,
      characterDialogue: getCharacterDialogue(),
      conversationHistory: updatedMessages.map(m => ({ role: m.role, content: m.content })),
    });

    setIsResponding(false);

    if (error) {
      if (error !== 'NO_API_KEY') {
        showError(error);
      }
      return;
    }

    if (data?.response) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'character',
        content: data.response,
      }]);
    }
  };

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess("Copied to clipboard");
  };

  if (!hasGeminiKey()) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <NoApiKeyPrompt />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b bg-muted/30 flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onBack}>
          <ArrowLeft size={14} />
        </Button>
        <div className="relative">
          <Avatar className="h-7 w-7 border">
            <AvatarFallback className="bg-purple-100 text-purple-700 text-[10px] font-bold">{characterName.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 h-2 w-2 rounded-full border border-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate">{characterName}</p>
          <Badge variant="outline" className="text-[9px] h-3.5 px-1 text-purple-600 border-purple-200">AI Actor</Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[90%] rounded-2xl px-3 py-2 text-xs leading-relaxed group relative ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-none'
                  : 'bg-muted rounded-tl-none border'
              }`}>
                {msg.content}
                {msg.role === 'character' && msg.id !== '1' && (
                  <button
                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-background border shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyMessage(msg.content)}
                    title="Copy to clipboard"
                  >
                    <Copy size={10} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {isResponding && (
            <div className="flex justify-start">
              <div className="max-w-[90%] rounded-2xl px-3 py-2 text-xs bg-muted rounded-tl-none border flex items-center gap-2">
                <Loader2 size={12} className="animate-spin text-purple-600" />
                <span className="text-muted-foreground italic">Thinking in character...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Input
            placeholder={`Talk to ${characterName}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="text-xs h-8"
            disabled={isResponding}
          />
          <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleSend} disabled={!input.trim() || isResponding}>
            {isResponding ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CharacterChat;
