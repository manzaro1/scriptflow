"use client";

import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Music, Volume2, RefreshCw, Edit3, Check, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showSuccess } from "@/utils/toast";

interface StoryboardRow {
  id: string;
  shot: string;
  cameraAngle: string;
  subjectAngle: string;
  visual: string;
  audio: string;
  sound: string;
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
    setEditPrompt(row.visual);
  };

  const handleSaveEdit = (id: string) => {
    onRegenerateShot(id, editPrompt);
    setEditingId(null);
    showSuccess("Prompt updated. Regenerating shot...");
  };

  return (
    <div className="bg-[#1A1A1A] text-white p-8 rounded-xl shadow-2xl overflow-x-auto">
      <div className="flex flex-col items-center mb-10 border-b border-white/10 pb-6 text-center">
        <h1 className="text-4xl font-bold tracking-tighter uppercase mb-2">{title || "Untitled Production"}</h1>
        <h2 className="text-6xl font-black tracking-widest uppercase text-white/90">Shooting Plan</h2>
      </div>

      <Table className="border-collapse">
        <TableHeader>
          <TableRow className="border-b-0 hover:bg-transparent">
            <TableHead className="bg-[#F57C00] text-white uppercase font-bold text-center h-14 border border-white/20">Shots</TableHead>
            <TableHead className="bg-[#F57C00] text-white uppercase font-bold text-center h-14 border border-white/20">Camera Angle</TableHead>
            <TableHead className="bg-[#F57C00] text-white uppercase font-bold text-center h-14 border border-white/20">Subject Angle</TableHead>
            <TableHead className="bg-[#F57C00] text-white uppercase font-bold text-center h-14 border border-white/20 w-[350px]">Visual / AI Prompt</TableHead>
            <TableHead className="bg-[#F57C00] text-white uppercase font-bold text-center h-14 border border-white/20">Audio</TableHead>
            <TableHead className="bg-[#F57C00] text-white uppercase font-bold text-center h-14 border border-white/20">Sound</TableHead>
            <TableHead className="bg-[#F57C00] text-white uppercase font-bold text-center h-14 border border-white/20">Transition</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id} className="hover:bg-white/5 border-b-0 group">
              <TableCell className="text-center border border-white/20 p-4 font-medium uppercase">{row.shot}</TableCell>
              <TableCell className="text-center border border-white/20 p-4">{row.cameraAngle}</TableCell>
              <TableCell className="text-center border border-white/20 p-4">{row.subjectAngle}</TableCell>
              <TableCell className="border border-white/20 p-4 relative">
                <div className="flex flex-col gap-3">
                  <div className="relative group/img">
                    {row.imageUrl ? (
                      <img 
                        src={row.imageUrl} 
                        key={row.imageUrl}
                        alt="Storyboard shot" 
                        className="w-full h-40 object-cover rounded border border-white/10 transition-opacity duration-300"
                      />
                    ) : (
                      <div className="w-full h-40 bg-white/5 rounded border border-dashed border-white/20 flex items-center justify-center">
                        <RefreshCw className="text-white/20 animate-spin" size={32} />
                      </div>
                    )}
                    <button 
                      onClick={() => onRegenerateShot(row.id)}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 p-1.5 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity z-10"
                      title="Regenerate Image"
                    >
                      <RefreshCw size={14} className="text-white" />
                    </button>
                  </div>
                  
                  {editingId === row.id ? (
                    <div className="flex gap-2">
                      <Input 
                        value={editPrompt} 
                        onChange={(e) => setEditPrompt(e.target.value)}
                        className="bg-white/10 border-white/20 text-xs h-8 text-white focus:ring-orange-500"
                        placeholder="Describe the new visual..."
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:bg-green-500/20" onClick={() => handleSaveEdit(row.id)}>
                        <Check size={14} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-500/20" onClick={() => setEditingId(null)}>
                        <X size={14} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-white/70 italic flex-1 leading-relaxed">{row.visual}</p>
                      <button 
                        onClick={() => handleStartEdit(row)}
                        className="text-white/40 hover:text-white transition-colors p-1"
                      >
                        <Edit3 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center border border-white/20 p-4">
                <div className="flex items-center justify-center gap-2">
                  <Music size={14} className="text-white/40" />
                  <span className="text-sm">{row.audio}</span>
                </div>
              </TableCell>
              <TableCell className="text-center border border-white/20 p-4">
                <div className="flex items-center justify-center gap-2">
                  <Volume2 size={14} className="text-white/40" />
                  <span className="text-sm">{row.sound}</span>
                </div>
              </TableCell>
              <TableCell className="text-center border border-white/20 p-4 font-medium">
                <Badge variant="outline" className="text-white border-white/20 uppercase text-[10px] bg-white/5">
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