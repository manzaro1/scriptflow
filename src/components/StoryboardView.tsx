"use client";

import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Music,
  Volume2,
  RefreshCw,
  Edit3,
  Check,
  X,
  Camera,
  Palette,
  Heart,
  Move,
  Maximize2,
  Minimize2,
  Info,
  Layers,
  Focus
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface StoryboardRow {
  id: string;
  sceneTitle: string;
  shotNumber: string;
  shotType: string;
  shotCategory?: string;
  cameraAngle: string;
  movement: string;
  lens: string;
  visualPrompt: string;
  blockingNotes: string;
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
  aspectRatio: '2.39:1' | '1.85:1' | '16:9';
  onRegenerateShot: (id: string, newPrompt?: string) => void;
}

const StoryboardView = ({ title, data, aspectRatio, onRegenerateShot }: StoryboardViewProps) => {
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

  // Group shots by Scene Title
  const groupedData = useMemo(() => {
    const groups: { [key: string]: StoryboardRow[] } = {};
    data.forEach(row => {
      if (!groups[row.sceneTitle]) groups[row.sceneTitle] = [];
      groups[row.sceneTitle].push(row);
    });
    return groups;
  }, [data]);

  const getAspectClass = () => {
    switch (aspectRatio) {
      case '2.39:1': return 'aspect-[2.39/1]';
      case '1.85:1': return 'aspect-[1.85/1]';
      default: return 'aspect-video';
    }
  };

  return (
    <div id="storyboard-blueprint" className="bg-[#050505] text-white p-10 rounded-2xl shadow-2xl border border-white/5 overflow-x-auto min-w-[1400px]">
      <div className="flex flex-col items-center mb-16 border-b border-white/10 pb-10 text-center">
        <div className="flex items-center gap-3 bg-orange-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 shadow-lg shadow-orange-600/20">
          <Layers size={14} />
          Master Technical Blueprint
        </div>
        <h1 className="text-6xl font-black tracking-tighter uppercase mb-3 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">{title}</h1>
        <div className="flex items-center gap-6 text-white/30 text-xs font-mono uppercase tracking-widest">
          <span>Format: {aspectRatio} Anamorphic</span>
          <span className="h-1 w-1 bg-white/20 rounded-full" />
          <span>Extraction Mode: High Fidelity</span>
          <span className="h-1 w-1 bg-white/20 rounded-full" />
          <span>Color Managed Pipeline</span>
        </div>
      </div>

      <div className="space-y-12">
        {Object.entries(groupedData).map(([sceneTitle, shots], sceneIndex) => (
          <motion.div
            key={sceneTitle}
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: sceneIndex * 0.1 }}
          >
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="h-10 w-1 bg-orange-600 rounded-full" />
              <div>
                <h3 className="text-sm font-black text-orange-500 uppercase tracking-widest">Location / Slugline</h3>
                <h2 className="text-xl font-bold font-mono">{sceneTitle}</h2>
              </div>
              <Badge variant="outline" className="ml-auto bg-white/5 border-white/20 text-white/40 uppercase text-[10px] px-3">
                {shots.length} Technical Shots
              </Badge>
            </div>

            <Table className="border-collapse">
              <TableHeader>
                <TableRow className="border-b-0 hover:bg-transparent sticky top-0 z-10">
                  <TableHead className="bg-[#0A0A0A] text-white/40 uppercase text-[9px] font-black tracking-[0.2em] text-center h-12 border border-white/10 w-20">Shot</TableHead>
                  <TableHead className="bg-[#0A0A0A] text-white/40 uppercase text-[9px] font-black tracking-[0.2em] h-12 border border-white/10 w-44">Optics & Motion</TableHead>
                  <TableHead className="bg-[#0A0A0A] text-white/40 uppercase text-[9px] font-black tracking-[0.2em] h-12 border border-white/10 w-[550px]">Composition & Blocking</TableHead>
                  <TableHead className="bg-[#0A0A0A] text-white/40 uppercase text-[9px] font-black tracking-[0.2em] h-12 border border-white/10">Audio Dynamics</TableHead>
                  <TableHead className="bg-[#0A0A0A] text-white/40 uppercase text-[9px] font-black tracking-[0.2em] h-12 border border-white/10">Atmospherics</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shots.map((row) => (
                  <TableRow key={row.id} className="hover:bg-white/[0.01] border-b-0 group transition-all duration-300">
                    <TableCell className="text-center border border-white/10 p-6 font-mono text-2xl text-orange-500 font-black align-top">
                      {row.shotNumber}
                    </TableCell>
                    
                    <TableCell className="border border-white/10 p-6 align-top">
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="text-[10px] bg-orange-600/10 border-orange-500/30 text-orange-500 w-full justify-center py-1.5 font-black">
                            {row.shotType}
                          </Badge>
                          {row.shotCategory && (
                            <Badge variant="outline" className="text-[8px] bg-blue-600/10 border-blue-500/30 text-blue-400 w-full justify-center py-0.5 font-bold uppercase tracking-widest">
                              {row.shotCategory}
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-2 mt-2">
                          <div className="flex items-center gap-2 text-[10px] text-white/50 uppercase font-bold tracking-tight">
                            <Camera size={12} className="text-orange-500" />
                            {row.lens} Lens
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-white/50 uppercase font-bold tracking-tight">
                            <Move size={12} className="text-blue-500" />
                            {row.movement}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-white/50 uppercase font-bold tracking-tight">
                            <Heart size={12} className="text-pink-500" />
                            {row.emotion}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="border border-white/10 p-6 align-top">
                      <div className="flex flex-col gap-6">
                        <div className={cn(
                          "relative group/img bg-[#111] rounded-lg border border-white/10 overflow-hidden shadow-2xl transition-all duration-500 group-hover:border-orange-500/50",
                          getAspectClass()
                        )}>
                          {row.imageUrl ? (
                            <>
                              <img
                                src={row.imageUrl}
                                alt="Production Shot"
                                className="w-full h-full object-cover transition-all duration-1000 group-hover/img:scale-105"
                              />
                              {/* Cinematic vignette overlay */}
                              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                              <RefreshCw className="text-orange-500 animate-spin" size={32} />
                              <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em]">Processing Visuals...</span>
                            </div>
                          )}
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-end p-4">
                            <button 
                              onClick={() => onRegenerateShot(row.id)}
                              className="bg-orange-600 hover:bg-orange-700 p-2 rounded-full transition-all shadow-xl"
                              title="Regenerate Frame"
                            >
                              <RefreshCw size={16} className="text-white" />
                            </button>
                          </div>

                          <div className="absolute top-4 left-4 bg-black/80 backdrop-blur px-3 py-1 rounded-sm text-[8px] font-black uppercase tracking-widest border border-white/10 text-orange-500">
                            {row.lighting}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-[9px] font-black text-white/20 uppercase tracking-widest">
                              <Palette size={10} className="text-blue-500" />
                              Visual Directives
                            </div>
                            {editingId === row.id ? (
                              <div className="flex gap-2 p-2 bg-white/5 rounded-lg border border-white/20 animate-in fade-in zoom-in duration-200">
                                <Input 
                                  value={editPrompt} 
                                  onChange={(e) => setEditPrompt(e.target.value)}
                                  className="bg-black/50 border-white/10 text-xs h-9 text-white focus:ring-orange-500"
                                  placeholder="Update shot parameters..."
                                  autoFocus
                                />
                                <Button size="icon" variant="ghost" className="h-9 w-9 text-green-500" onClick={() => handleSaveEdit(row.id)}>
                                  <Check size={18} />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-4 group/text">
                                <p className="text-[11px] text-white/70 leading-relaxed font-mono italic">
                                  {row.visualPrompt}
                                </p>
                                <button onClick={() => handleStartEdit(row)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-white/10 rounded">
                                  <Edit3 size={12} className="text-orange-500" />
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="p-4 bg-white/[0.03] rounded-lg border border-white/5 space-y-2">
                            <div className="flex items-center gap-2 text-[9px] font-black text-white/20 uppercase tracking-widest">
                              <Info size={10} className="text-orange-500" />
                              Blocking / Director's Notes
                            </div>
                            <p className="text-[11px] text-white/50 leading-relaxed border-l-2 border-orange-600/30 pl-3">
                              {row.blockingNotes}
                            </p>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="border border-white/10 p-8 align-top">
                      <div className="space-y-6">
                        <div className="flex gap-4">
                          <Music size={16} className="text-orange-500 shrink-0" />
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Dialogue Beat</span>
                            <p className="text-xs font-serif italic text-white/80 leading-relaxed">
                              "{row.audioTag}"
                            </p>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-white/5 space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] border-white/10 uppercase bg-white/5 text-white/40">{row.transition}</Badge>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="border border-white/10 p-8 align-top">
                      <div className="flex flex-col gap-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[9px] font-black text-white/20 uppercase tracking-widest">
                            <Volume2 size={12} className="text-blue-400" />
                            Sound Design
                          </div>
                          <span className="text-[10px] font-bold text-white/60">{row.sfx}</span>
                        </div>
                        <div className="p-3 bg-blue-500/5 rounded border border-blue-500/10">
                          <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest mb-1">Grade Note</p>
                          <p className="text-[10px] text-white/50 italic">Maintain {row.colorGrade} saturation for mood continuity.</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default StoryboardView;