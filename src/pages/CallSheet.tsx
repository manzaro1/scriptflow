"use client";

import React from 'react';
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Printer, 
  Share2, 
  Download, 
  Clock, 
  MapPin, 
  CloudSun, 
  Phone, 
  User,
  CalendarDays
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { showSuccess } from "@/utils/toast";

const CallSheet = () => {
  const handlePrint = () => {
    window.print();
    showSuccess("Preparing call sheet for print...");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col print:bg-white">
      <div className="print:hidden">
        <Navbar />
      </div>
      <div className="flex flex-1">
        <div className="print:hidden">
          <Sidebar />
        </div>
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-muted/30 print:bg-white print:p-0">
          <div className="max-w-5xl mx-auto space-y-6">
            <header className="flex justify-between items-center print:hidden">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Call Sheets</h1>
                <p className="text-muted-foreground mt-1">Daily production schedules and crew requirements.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => showSuccess("Link shared with crew")}>
                  <Share2 size={16} />
                  Share
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
                  <Printer size={16} />
                  Print
                </Button>
                <Button size="sm" className="gap-2">
                  <Download size={16} />
                  Export PDF
                </Button>
              </div>
            </header>

            {/* Industry Standard Call Sheet */}
            <Card className="shadow-xl border-t-8 border-t-primary print:shadow-none print:border-none">
              <CardContent className="p-8 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between gap-6 border-b pb-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h2 className="text-4xl font-black tracking-tighter uppercase italic">The Neon Horizon</h2>
                      <p className="text-sm font-bold uppercase text-muted-foreground tracking-widest">Production Day 12 of 35</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Director</p>
                        <p className="font-bold">Alex Rivers</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Producer</p>
                        <p className="font-bold">Sarah Chen</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg flex flex-col justify-center items-center text-center min-w-[180px]">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Crew Call</p>
                    <div className="text-4xl font-black">07:00</div>
                    <p className="text-xs font-bold mt-1 text-muted-foreground uppercase">AM • Oct 12, 2024</p>
                  </div>
                </div>

                {/* Key Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <MapPin size={16} />
                      <h3 className="text-xs font-black uppercase tracking-widest">Locations</h3>
                    </div>
                    <div className="p-3 bg-muted/50 rounded border text-sm space-y-2">
                      <div>
                        <p className="font-bold">Stage 4 - Neon Studio</p>
                        <p className="text-xs text-muted-foreground">123 Production Way, Culver City</p>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="font-bold">Emergency Hospital</p>
                        <p className="text-xs text-muted-foreground">St. Jude Medical Center (2.4 miles)</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <CloudSun size={16} />
                      <h3 className="text-xs font-black uppercase tracking-widest">Weather</h3>
                    </div>
                    <div className="p-3 bg-muted/50 rounded border flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-black">72°F</p>
                        <p className="text-xs font-bold uppercase">Clear Skies</p>
                      </div>
                      <div className="text-right text-[10px] font-bold uppercase text-muted-foreground">
                        <p>Sunrise: 06:45</p>
                        <p>Sunset: 18:30</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <Phone size={16} />
                      <h3 className="text-xs font-black uppercase tracking-widest">Key Contacts</h3>
                    </div>
                    <div className="p-3 bg-muted/50 rounded border text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>1st AD: Mike Miller</span>
                        <span className="font-mono font-bold">555-0123</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span>Production Mgr</span>
                        <span className="font-mono font-bold">555-9876</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shooting Schedule */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-l-4 border-primary pl-3">
                    <Clock size={18} className="text-primary" />
                    <h3 className="text-lg font-black uppercase tracking-tight">Shooting Schedule</h3>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted hover:bg-muted">
                        <TableHead className="w-16 font-bold uppercase text-[10px]">Time</TableHead>
                        <TableHead className="w-16 font-bold uppercase text-[10px]">Sc.</TableHead>
                        <TableHead className="font-bold uppercase text-[10px]">Description</TableHead>
                        <TableHead className="w-24 font-bold uppercase text-[10px]">Cast</TableHead>
                        <TableHead className="w-32 font-bold uppercase text-[10px]">Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { time: '08:00', sc: '12', desc: 'EXT. SKYLINE - NIGHT. Kai watches the rain.', cast: '1', loc: 'Stage 4' },
                        { time: '10:30', sc: '14A', desc: 'INT. HANGAR - DAY. Arrival of the shipment.', cast: '1, 2, 4', loc: 'Stage 4' },
                        { time: '13:00', sc: '-', desc: 'LUNCH (1 HOUR)', cast: 'ALL', loc: 'Catering' },
                        { time: '14:00', sc: '15', desc: 'INT. LABORATORY. Dr. Aris reveals the coil.', cast: '4, 5', loc: 'Stage 2' },
                        { time: '17:30', sc: '-', desc: 'WRAP', cast: 'ALL', loc: '-' },
                      ].map((row, i) => (
                        <TableRow key={i} className={row.desc.includes('LUNCH') ? 'bg-primary/5 font-bold' : ''}>
                          <TableCell className="font-mono text-xs">{row.time}</TableCell>
                          <TableCell className="font-bold">{row.sc}</TableCell>
                          <TableCell className="text-sm">{row.desc}</TableCell>
                          <TableCell className="text-xs font-bold">{row.cast}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{row.loc}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Cast Call Times */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-l-4 border-orange-500 pl-3">
                      <User size={18} className="text-orange-500" />
                      <h3 className="text-lg font-black uppercase tracking-tight">Cast Calls</h3>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableHead className="w-12 font-bold uppercase text-[10px]">#</TableHead>
                          <TableHead className="font-bold uppercase text-[10px]">Performer</TableHead>
                          <TableHead className="font-bold uppercase text-[10px]">Role</TableHead>
                          <TableHead className="w-20 font-bold uppercase text-[10px]">Call</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { id: 1, name: 'John Actor', role: 'KAI', call: '06:00' },
                          { id: 2, name: 'Sarah Star', role: 'SARA', call: '08:30' },
                          { id: 4, name: 'Mike Talent', role: 'VEO', call: '09:00' },
                          { id: 5, name: 'Elena Pro', role: 'DR. ARIS', call: '13:30' },
                        ].map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-bold">{row.id}</TableCell>
                            <TableCell className="text-sm">{row.name}</TableCell>
                            <TableCell className="text-xs font-bold uppercase text-muted-foreground">{row.role}</TableCell>
                            <TableCell className="font-mono font-bold">{row.call}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="space-y-4 bg-muted/20 p-6 rounded-xl border-2 border-dashed border-muted">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Production Notes</h3>
                    <ul className="text-xs space-y-3 list-disc pl-4 text-muted-foreground font-medium">
                      <li>Safety meeting at 07:15 for all electrical and grip crew.</li>
                      <li>Heavy rain effects in Scene 12—bring appropriate weather gear.</li>
                      <li>Parking strictly enforced in Hangar lot; use shuttle for Overflow.</li>
                      <li>Quiet on set! Hospital in adjacent building.</li>
                    </ul>
                    <div className="pt-4 mt-4 border-t border-muted">
                      <div className="flex items-center gap-2 text-primary">
                        <CalendarDays size={14} />
                        <span className="text-[10px] font-black uppercase">Tomorrow's Look</span>
                      </div>
                      <p className="text-[10px] mt-1 italic">Scene 16-19: Night exterior car chase sequence. Prep vehicles for 14:00.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CallSheet;