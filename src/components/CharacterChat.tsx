"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles, BrainCircuit, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  role: 'user' | 'character';
  content: string;
  timestamp: Date;
}

const CharacterChat = ({ characterName }: { characterName: string }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'character',
      content: `Hello. I am ${characterName}. I can feel my scenes coming to life. How can I help you sharpen my voice today?`,
      timestamp: new Date()
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

  const simulateCharacterResponse = async (userMessageContent: string) => {
    setIsResponding(true);
    
    // --- Conceptual Supabase Edge Function Call ---
    // In a real implementation, this would be:
    // const { data, error } = await supabase.functions.invoke('chat-with-character', { body: { userMessageContent, characterName } });
    
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000)); // Simulate network delay
    
    const responses = [
      `As ${characterName}, I feel that my current dialogue in Scene 4 is too soft. I would be more aggressive there.`,
      "That decision doesn't align with my motivation. I'm here for revenge, not for reconciliation.",
      "The way you wrote that action line makes me feel vulnerable. Is that intentional?",
      "I like where this is going, but my nationality would influence the slang I use here."
    ];
    
    const charMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'character',
      content: responses[Math.floor(Math.random() * responses.length)],
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, charMessage]);
    setIsResponding(false);
  };

  const handleSend = () => {
    if (!input.trim() || isResponding) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = input;
    setInput('');
    
    simulateCharacterResponse(messageToSend);
  };

  return (
    <div className="flex flex-col h-full bg-white border rounded-xl overflow-hidden shadow-sm">
      <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Avatar className="h-8 w-8 border">
              <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">{characterName.substring(0,2)}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-green-500 h-2.5 w-2.5 rounded-full border-2 border-white" />
          </div>
          <div>
            <p className="text-sm font-bold">{characterName}</p>
            <Badge variant="outline" className="text-[10px] h-4 px-1 text-purple-600 border-purple-200">AI Actor Mode</Badge>
          </div>
        </div>
        <BrainCircuit size={16} className="text-muted-foreground" />
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-none' 
                  : 'bg-muted rounded-tl-none border'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isResponding && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm bg-muted rounded-tl-none border flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-purple-600" />
                <span className="text-muted-foreground italic">Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t bg-white">
        <div className="flex gap-2">
          <Input 
            placeholder={`Ask ${characterName} about their feelings...`} 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="text-xs h-9"
            disabled={isResponding}
          />
          <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend} disabled={!input.trim() || isResponding}>
            {isResponding ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CharacterChat;