"use client";

import React from 'react';
import { ArrowLeft, Save, Share2, Download, MessageSquare, List, Type, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const ScriptEditor = () => {
  return (
    <div className="h-screen flex flex-col bg-[#F9F9F9]">
      {/* Editor Header */}
      <header className="h-14 border-b bg-white flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft size={20} />
          </Button>
          <div className="h-4 w-px bg-border" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold">The Neon Horizon</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Draft 3 - Rev 1</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-2">
            <Share2 size={16} />
            Collaborate
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download size={16} />
            Export
          </Button>
          <Button size="sm" className="gap-2">
            <Save size={16} />
            Save
          </Button>
        </div>
      </header>

      {/* Editor Main Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Outline Sidebar */}
        <aside className="w-64 border-r bg-white hidden lg:flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Scene Navigator</h3>
              <List size={14} className="text-muted-foreground" />
            </div>
            <div className="space-y-1">
              {['EXT. SKYLINE - NIGHT', 'INT. APARTMENT - CONTINUOUS', 'INT. HALLWAY - LATER', 'EXT. STREET - NIGHT'].map((scene, i) => (
                <div 
                  key={i} 
                  className={`text-xs p-2 rounded cursor-pointer transition-colors ${i === 0 ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'}`}
                >
                  {scene}
                </div>
              ))}
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Characters</h3>
            <div className="flex flex-wrap gap-2">
              {['KAI', 'SARA', 'VEO', 'DR. ARIS'].map(char => (
                <div key={char} className="text-[10px] px-2 py-1 bg-secondary rounded-full font-medium">
                  {char}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* The Script Page */}
        <main className="flex-1 overflow-y-auto p-12 flex justify-center bg-gray-100">
          <div className="w-[850px] min-h-[1100px] bg-white shadow-xl p-[80px] font-['Courier_Prime',Courier,monospace] text-[12pt] leading-tight select-text">
            <div className="text-center mb-12 uppercase">
              <h1 className="text-2xl font-bold">THE NEON HORIZON</h1>
              <p className="mt-2 text-sm">Written by</p>
              <p className="mt-1">Alex Rivers</p>
            </div>

            <div className="space-y-6">
              <div>
                <p className="font-bold uppercase mb-4">EXT. SKYLINE - NIGHT</p>
                <p>Rain hammers against the metallic skin of the city. Neon signs flicker in shades of bruised purple and electric cyan.</p>
              </div>

              <div className="px-[15%] text-center">
                <p className="uppercase font-bold mb-1">KAI</p>
                <p>(to himself)</p>
                <p>This wasn't part of the deal.</p>
              </div>

              <p>Kai pulls a small, glowing COIL from his pocket. It pulses with a rhythmic, golden light.</p>

              <div className="px-[15%] text-center">
                <p className="uppercase font-bold mb-1">VEO (V.O.)</p>
                <p>The deal changed the moment you stepped into Sector 4.</p>
              </div>

              <div>
                <p className="font-bold uppercase mt-8 mb-4">INT. APARTMENT - CONTINUOUS</p>
                <p>Kai kicks the door open. The room is dark, save for the blue light of a dozen floating holographic screens.</p>
              </div>
            </div>
          </div>
        </main>

        {/* Toolbar Sidebar */}
        <aside className="w-14 border-l bg-white flex flex-col items-center py-4 gap-4">
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <Type size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <FileText size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <MessageSquare size={20} />
          </Button>
          <div className="mt-auto">
            <div className="text-[10px] font-bold text-muted-foreground rotate-90 mb-4 whitespace-nowrap">PG 1 / 120</div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ScriptEditor;