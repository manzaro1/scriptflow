"use client";

import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Music, Volume2, RefreshCw, Edit3, Check, X, Camera, Palette, Heart } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showSuccess } from "@/utils/toast";

export interface StoryboardRow {
  id: string;
  shotNumber: string;
  shotType: string;
  cameraAngle: string;
  visualPrompt: string;
  audioTag: string;
  sfx: string;
  transition: string;
  emotion: string;
  colorGrade: string;
  lighting: string;
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
    showSuccess("Re-forging shot with updated cinematic parameters...");
  };

  return (
    <div id="storyboard-blueprint" className="bg-[#0A0A0A] text-white p-8 rounded-2xl shadow-2xl border border-white/5 overflow-x-auto">
      <div className="flex flex-col items-center mb-12 border-b border-white/10 pb-8 text-center">
        <div className="bg-orange-600 px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] mb-4">Production Blueprint</div>
        <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">{title}</h1>
        <p className="text-white/40 text-sm font-mono tracking-widest uppercase">Master Technical Shooting Plan • Shot-by-Shot Analysis</p>
      </div>

      <Table className="border-collapse min-w-[1300px]">
        <TableHeader>
          <TableRow className="border-b-0 hover:bg-transparent">
            <TableHead className="bg-[#111] text-white/50 uppercase text-[10px] font-black tracking-widest text-center h-12 border border-white/10 w-16">No.</TableHead>
            <TableHead className="bg-[#111] text-white/50 uppercase text-[10px] font-black tracking-widest text-center h-12 border border-white/10 w-40">Directives</TableHead>
            <TableHead className="bg-[#111] text-white/50 uppercase text-[10px] font-black tracking-widest text-center h-12 border border-white/10 w-[450px]">Visual Composition / AI Narrative</TableHead>
            <TableHead className="bg-[#111] text-white/50 uppercase text-[10px] font-black tracking-widest text-center h-12 border border-white/10">Audio / Beats</TableHead>
            <TableHead className="bg-[#111] text-white/50 uppercase text-[10px] font-black tracking-widest text-center h-12 border border-white/10">Technical FX</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id} className="hover:bg-white/[0.02] border-b-0 group transition-colors">
              <TableCell className="text-center border border-white/10 p-4 font-mono text-orange-500 font-bold align-top">
                {row.shotNumber}
              </TableCell>
              
              <TableCell className="border border-white/10 p-4 align-top">
                <div className="flex flex-col gap-2">
                  <Badge variant="outline" className="text-[10px] bg-white/5 border-white/20 text-white w-full justify-center py-1">
                    {row.shotType}
                  </Badge>
                  <div className="space-y-1.5 mt-2">
                    <div className="flex items-center gap-2 text-[9px] text-white/40 uppercase font-bold tracking-tighter">
                      <Camera size={10} className="text-orange-500" />
                      {row.cameraAngle}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-white/40 uppercase font-bold tracking-tighter">
                      <Heart size={10} className="text-pink-500" />
                      {row.emotion}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-white/40 uppercase font-bold tracking-tighter">
                      <Palette size={10} className="text-blue-500" />
                      {row.colorGrade}
                    </div>
                  </div>
                </div>
              </TableCell>

              <TableCell className="border border-white/10 p-4 align-top">
                <div className="flex flex-col gap-4">
                  <div className="relative group/img aspect-video bg-[#111] rounded-lg border border-white/10 overflow-hidden shadow-2xl">
                    {row.imageUrl ? (
                      <img 
                        src={row.imageUrl} 
                        key={row.imageUrl}
                        alt="AI Generation" 
                        className="w-full h-full object-cover transition-all duration-700 group-hover/img:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="text-orange-500/50 animate-spin" size={32} />
                        <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Forging Pixels...</span>
                      </div>
                    )}
                    <button 
                      onClick={() => onRegenerateShot(row.id)}
                      className="absolute bottom-3 right-3 bg-black/80 hover:bg-orange-600 p-2 rounded-full opacity-0 group-hover/img:opacity-100 transition-all z-10 transform translate-y-2 group-hover/img:translate-y-0 shadow-xl"
                      title="Regenerate Shot"
                    >
                      <RefreshCw size={14} className="text-white" />
                    </button>
                    <div className="absolute top-3 left-3 bg-black/60 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border border-white/10">
                      {row.lighting}
                    </div>
                  </div>
                  
                  {editingId === row.id ? (
                    <div className="flex gap-2 p-2 bg-white/5 rounded-lg border border-white/10 animate-in fade-in zoom-in duration-200">
                      <Input 
                        value={editPrompt} 
                        onChange={(e) => setEditPrompt(e.target.value)}
                        className="bg-black/50 border-white/20 text-xs h-9 text-white focus:ring-orange-500"
                        placeholder="Re-describe visual parameters..."
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-9 w-9 text-green-500" onClick={() => handleSaveEdit(row.id)}>
                        <Check size={16} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-9 w-9 text-red-500" onClick={() => setEditingId(null)}>
                        <X size={16} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3 px-1">
                      <p className="text-[11px] text-white/60 leading-relaxed font-mono">
                        <span className="text-orange-500/50 mr-2 font-bold">[PROMPT]</span>
                        {row.visualPrompt}
                      </p>
                      <button 
                        onClick={() => handleStartEdit(row)}
                        className="text-white/20 hover:text-orange-500 transition-colors p-1 bg-white/5 rounded shrink-0"
                      >
                        <Edit3 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </TableCell>

              <TableCell className="border border-white/10 p-6 align-top">
                <div className="flex flex-col gap-4">
                  <div className="flex gap-3">
                    <Music size={14} className="text-orange-500 shrink-0 mt-1" />
                    <p className="text-xs font-serif leading-relaxed text-white/80 border-l border-white/10 pl-3">
                      {row.audioTag}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] border-white/10 uppercase bg-white/5">{row.transition}</Badge>
                  </div>
                </div>
              </TableCell>

              <TableCell className="border border-white/10 p-6 align-top">
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2 items-center">
                    <Volume2 size={12} className="text-blue-400" />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">SFX: {row.sfx}</span>
                  </div>
                  <div className="p-2 bg-white/5 rounded border border-white/10">
                    <p className="text-[9px] text-white/40 uppercase font-black leading-tight tracking-widest">Technical Note</p>
                    <p className="text-[10px] text-white/60 mt-1 italic">Maintain {row.colorGrade.toLowerCase()} palette for continuity.</p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default StoryboardView;