"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Music, Volume2, Video } from 'lucide-react';

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

const StoryboardView = ({ data }: { data: StoryboardRow[] }) => {
  return (
    <div className="bg-[#1A1A1A] text-white p-8 rounded-xl shadow-2xl overflow-x-auto">
      <div className="flex flex-col items-center mb-10 border-b border-white/10 pb-6">
        <h1 className="text-4xl font-bold tracking-tighter uppercase mb-2">Film Title</h1>
        <h2 className="text-6xl font-black tracking-widest uppercase text-white/90">Shooting Plan</h2>
      </div>

      <Table className="border-collapse">
        <TableHeader>
          <TableRow className="border-b-0 hover:bg-transparent">
            <TableHead className="bg-[#F57C00] text-white uppercase font-bold text-center h-14 border border-white/20">Shots</TableHead>
            <TableHead className="bg-[#F57C00] text-white uppercase font-bold text-center h-14 border border-white/20">Camera Angle</TableHead>
            <TableHead className="bg-[#F57C00] text-white uppercase font-bold text-center h-14 border border-white/20">Subject Angle</TableHead>
            <TableHead className="bg-[#F57C00] text-white uppercase font-bold text-center h-14 border border-white/20 w-[300px]">Visual</TableHead>
            <TableHead className="bg-[#F57C00] text-white uppercase font-bold text-center h-14 border border-white/20">Audio</TableHead>
            <TableHead className="bg-[#F57C00] text-white uppercase font-bold text-center h-14 border border-white/20">Sound</TableHead>
            <TableHead className="bg-[#F57C00] text-white uppercase font-bold text-center h-14 border border-white/20">Transition</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id} className="hover:bg-white/5 border-b-0">
              <TableCell className="text-center border border-white/20 p-4 font-medium uppercase">{row.shot}</TableCell>
              <TableCell className="text-center border border-white/20 p-4">{row.cameraAngle}</TableCell>
              <TableCell className="text-center border border-white/20 p-4">{row.subjectAngle}</TableCell>
              <TableCell className="border border-white/20 p-4">
                <div className="flex flex-col gap-3">
                  {row.imageUrl ? (
                    <img 
                      src={row.imageUrl} 
                      alt="Storyboard shot" 
                      className="w-full h-32 object-cover rounded border border-white/10"
                    />
                  ) : (
                    <div className="w-full h-32 bg-white/5 rounded border border-dashed border-white/20 flex items-center justify-center">
                      <ImageIcon className="text-white/20" size={32} />
                    </div>
                  )}
                  <p className="text-xs text-center text-white/70 italic">{row.visual}</p>
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
                <Badge variant="outline" className="text-white border-white/20 uppercase text-[10px]">
                  {row.transition}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {/* Empty rows to match style */}
          {[...Array(3)].map((_, i) => (
            <TableRow key={`empty-${i}`} className="border-b-0 h-24">
              <TableCell className="border border-white/20"></TableCell>
              <TableCell className="border border-white/20"></TableCell>
              <TableCell className="border border-white/20"></TableCell>
              <TableCell className="border border-white/20"></TableCell>
              <TableCell className="border border-white/20"></TableCell>
              <TableCell className="border border-white/20"></TableCell>
              <TableCell className="border border-white/20"></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default StoryboardView;