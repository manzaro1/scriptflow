"use client";

import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Music, Volume2, RefreshCw, Edit3, Check, X, Camera } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showSuccess } from "@/utils/toast";

interface StoryboardRow {
  id: string;
  shotNumber: string;
  shotType: string;
  cameraAngle: string;
  visualPrompt: string;
  audioTag: string;
  sfx: string;
  transition: string;
  imageUrl?: string;
}

interface StoryboardViewProps {
  title: string;
  data: StoryboardRow[];
  onRegenerateShot: (id: string, newPrompt?: string) => void;
}

const StoryboardView = ({ title, data, onRegenerateShot }: StoryboardViewProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");

  const handleStartEdit = (row: StoryboardRow) => {
    setEditingId(row.id);
    setEditPrompt(row.visualPrompt);
  };

  const handleSaveEdit = (id: string) => {
    onRegenerateShot(id, editPrompt);
    setEditingId(null);
    showSuccess("Re-forging shot with updated visual parameters...");
  };

  return (
    <div className="bg-[#0A0A0A] text-white p-8 rounded-2xl shadow-2xl border border-white/5 overflow-x-auto">
      <div className="flex flex-col items-center mb-12 border-b border-white/10 pb-8 text-center">
        <div className="bg-orange-600 px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] mb-4">Production Blueprint</div>
        <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">{title}</h1>
        <p className="text-white/40 text-sm font-mono tracking-widest uppercase">Standard Multi-Column Shooting Plan</p>
      </div>

      <Table className="border-collapse min-w-[1200px]">
        <TableHeader>
          <TableRow className="border-b-0 hover:bg-transparent">
            <TableHead className="bg-[#111] text-white/50 uppercase text-[10px] font-black tracking-widest text-center h-12 border border-white/10 w-16">No.</TableHead>
            <TableHead className="bg-[#111] text-white/50 uppercase text-[10px] font-black tracking-widest text-center h-12 border border-white/10 w-32">Technicals</TableHead>
            <TableHead className="bg-[#111] text-white/50 uppercase text-[10px] font-black tracking-widest text-center h-12 border border-white/10 w-[400px]">Visual Composition / AI Prompt</TableHead>
            <TableHead className="bg-[#111] text-white/50 uppercase text-[10px] font-black tracking-widest text-center h-12 border border-white/10">Audio / Script Tag</TableHead>
            <TableHead className="bg-[#111] text-white/50 uppercase text-[10px] font-black tracking-widest text-center h-12 border border-white/10">Sound / SFX</TableHead>
            <TableHead className="bg-[#111] text-white/50 uppercase text-[10px] font-black tracking-widest text-center h-12 border border-white/10 w-24">Transition</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id} className="hover:bg-white/[0.02] border-b-0 group transition-colors">
              <TableCell className="text-center border border-white/10 p-4 font-mono text-orange-500 font-bold">{row.shotNumber}</TableCell>
              <TableCell className="border border-white/10 p-4">
                <div className="flex flex-col gap-1 items-center">
                  <Badge variant="outline" className="text-[10px] bg-white/5 border-white/20 text-white w-full justify-center">{row.shotType}</Badge>
                  <div className="flex items-center gap-1.5 text-[9px] text-white/40 uppercase font-bold tracking-tighter mt-1">
                    <Camera size={10} />
                    {row.cameraAngle}
                  </div>
                </div>
              </TableCell>
              <TableCell className="border border-white/10 p-4">
                <div className="flex flex-col gap-4">
                  <div className="relative group/img aspect-video bg-[#111] rounded-lg border border-white/10 overflow-hidden">
                    {row.imageUrl ? (
                      <img 
                        src={row.imageUrl} 
                        key={row.imageUrl}
                        alt="AI Generation" 
                        className="w-full h-full object-cover transition-all duration-700 group-hover/img:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <RefreshCw className="text-orange-500/50 animate-spin" size={32} />
                      </div>
                    )}
                    <button 
                      onClick={() => onRegenerateShot(row.id)}
                      className="absolute bottom-3 right-3 bg-black/80 hover:bg-orange-600 p-2 rounded-full opacity-0 group-hover/img:opacity-100 transition-all z-10 transform translate-y-2 group-hover/img:translate-y-0 shadow-xl"
                      title="Regenerate from current prompt"
                    >
                      <RefreshCw size={14} className="text-white" />
                    </button>
                  </div>
                  
                  {editingId === row.id ? (
                    <div className="flex gap-2 p-2 bg-white/5 rounded-lg border border-white/10 animate-in fade-in zoom-in duration-200">
                      <Input 
                        value={editPrompt} 
                        onChange={(e) => setEditPrompt(e.target.value)}
                        className="bg-black/50 border-white/20 text-xs h-9 text-white focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Re-describe the visual composition..."
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-9 w-9 text-green-500 hover:bg-green-500/10 shrink-0" onClick={() => handleSaveEdit(row.id)}>
                        <Check size={16} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-9 w-9 text-red-500 hover:bg-red-500/10 shrink-0" onClick={() => setEditingId(null)}>
                        <X size={16} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3 px-1">
                      <p className="text-[11px] text-white/60 leading-relaxed font-mono italic">
                        <span className="text-orange-500/50 mr-2 uppercase not-italic font-bold tracking-tighter">[VISUAL PROMPT]</span>
                        {row.visualPrompt}
                      </p>
                      <button 
                        onClick={() => handleStartEdit(row)}
                        className="text-white/20 hover:text-orange-500 transition-colors p-1 bg-white/5 rounded"
                      >
                        <Edit3 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="border border-white/10 p-6 align-top">
                <div className="flex gap-3">
                  <Music size={14} className="text-orange-500 shrink-0 mt-1" />
                  <p className="text-xs font-serif leading-relaxed text-white/80 border-l border-white/10 pl-3">
                    {row.audioTag}
                  </p>
                </div>
              </TableCell>
              <TableCell className="border border-white/10 p-6 align-top">
                <div className="flex gap-3">
                  <Volume2 size={14} className="text-blue-400 shrink-0 mt-1" />
                  <p className="text-[10px] uppercase font-bold tracking-widest text-white/50">
                    {row.sfx}
                  </p>
                </div>
              </TableCell>
              <TableCell className="text-center border border-white/10 p-4 align-middle">
                <Badge variant="outline" className="text-white border-white/10 uppercase text-[9px] bg-white/5 px-2 py-0.5 font-black">
                  {row.transition}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default StoryboardView;