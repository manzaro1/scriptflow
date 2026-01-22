"use client";

import React, { useState } from 'react';
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
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
  CalendarDays,
  ChevronDown,
  Sparkles,
  Loader2,
  Save,
  Plus,
  Trash2
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";

const SCRIPTS = [
  { id: "1", title: "The Neon Horizon" },
  { id: "2", title: "Silent Echoes" },
  { id: "3", title: "Midnight in Paris" },
  { id: "5", title: "The Last Heist" }
];

const MOCK_CAST_DATA = [
  { id: 1, name: 'John Actor', role: 'KAI', call: '06:00' },
  { id: 2, name: 'Sarah Star', role: 'SARA', call: '08:30' },
  { id: 3, name: 'Mike Talent', role: 'VEO', call: '09:00' },
  { id: 4, name: 'Elena Pro', role: 'DR. ARIS', call: '13:30' },
];

const INITIAL_SCHEDULE = [
  { time: '08:00', sc: '12', desc: 'EXT. SKYLINE - NIGHT. Kai watches the rain.', cast: '1', loc: 'Stage 4' },
  { time: '10:30', sc: '14A', desc: 'INT. HANGAR - DAY. Arrival of the shipment.', cast: '1, 2, 4', loc: 'Stage 4' },
  { time: '13:00', sc: '-', desc: 'LUNCH (1 HOUR)', cast: 'ALL', loc: 'Catering' },
  { time: '14:00', sc: '15', desc: 'INT. LABORATORY. Dr. Aris reveals the coil.', cast: '4, 5', loc: 'Stage 2' },
  { time: '17:30', sc: '-', desc: 'WRAP', cast: 'ALL', loc: '-' },
];

const CallSheet = () => {
  const [selectedScript, setSelectedScript] = useState(SCRIPTS[0]);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [weather, setWeather] = useState({ temp: '72°F', condition: 'Clear Skies', sunset: '18:30' });
  const [schedule, setSchedule] = useState(INITIAL_SCHEDULE);
  const [castData, setCastData] = useState(MOCK_CAST_DATA);

  const handlePrint = () => {
    window.print();
    showSuccess("Preparing call sheet for print...");
  };

  const handleAIWeatherSync = () => {
    setIsFetchingWeather(true);
    const toastId = showLoading("AI analyzing location forecast...");
    
    setTimeout(() => {
      setWeather({
        temp: `${Math.floor(Math.random() * (85 - 65) + 65)}°F`,
        condition: ['Partly Cloudy', 'Sunny', 'Light Breeze', 'Clear Skies'][Math.floor(Math.random() * 4)],
        sunset: '18:42'
      });
      setIsFetchingWeather(false);
      dismissToast(toastId);
      showSuccess("Weather data synchronized via AI forecast engine.");
    }, 2000);
  };

  const addScheduleRow = () => {
    setSchedule([...schedule, { time: '00:00', sc: 'NEW', desc: 'Click to edit description...', cast: '-', loc: '-' }]);
    showSuccess("New schedule line added.");
  };

  const removeScheduleRow = (index: number) => {
    setSchedule(schedule.filter((_, i) => i !== index));
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
        <main className="flex-1 p-6 md:p-8 overflow-y-auto print:bg-white print:p-0">
          <div className="max-w-5xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Call Sheets</h1>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Script:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2 font-bold h-7">
                        {selectedScript.title}
                        <ChevronDown size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuLabel>Select Project</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {SCRIPTS.map(script => (
                        <DropdownMenuItem 
                          key={script.id} 
                          onClick={() => {
                            setSelectedScript(script);
                            showSuccess(`Call sheet loaded for "${script.title}"`);
                          }}
                        >
                          {script.title}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => showSuccess("Call sheet saved.")}>
                  <Save size={16} />
                  Save
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

            <Card className="shadow-xl border-t-8 border-t-primary print:shadow-none print:border-none">
              <CardContent className="p-8 space-y-8">
                <div className="flex flex-col md:flex-row justify-between gap-6 border-b pb-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h2 className="text-4xl font-black tracking-tighter uppercase italic outline-none focus:bg-muted p-1 rounded" contentEditable suppressContentEditableWarning>
                        {selectedScript.title}
                      </h2>
                      <p className="text-sm font-bold uppercase text-muted-foreground tracking-widest outline-none focus:bg-muted px-1" contentEditable suppressContentEditableWarning>
                        Production Day 12 of 35
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Director</p>
                        <p className="font-bold outline-none focus:bg-muted" contentEditable suppressContentEditableWarning>Alex Rivers</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Producer</p>
                        <p className="font-bold outline-none focus:bg-muted" contentEditable suppressContentEditableWarning>Sarah Chen</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg flex flex-col justify-center items-center text-center min-w-[180px]">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Crew Call</p>
                    <div className="text-4xl font-black outline-none focus:bg-white/50 p-1" contentEditable suppressContentEditableWarning>07:00</div>
                    <p className="text-xs font-bold mt-1 text-muted-foreground uppercase outline-none focus:bg-white/50" contentEditable suppressContentEditableWarning>AM • Oct 12, 2024</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <MapPin size={16} />
                      <h3 className="text-xs font-black uppercase tracking-widest">Locations</h3>
                    </div>
                    <div className="p-3 bg-muted/50 rounded border text-sm space-y-2">
                      <div className="outline-none focus:bg-white p-1 rounded" contentEditable suppressContentEditableWarning>
                        <p className="font-bold">Stage 4 - Neon Studio</p>
                        <p className="text-xs text-muted-foreground">123 Production Way, Culver City</p>
                      </div>
                      <div className="pt-2 border-t outline-none focus:bg-white p-1 rounded" contentEditable suppressContentEditableWarning>
                        <p className="font-bold">Emergency Hospital</p>
                        <p className="text-xs text-muted-foreground">St. Jude Medical Center (2.4 miles)</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-primary">
                        <CloudSun size={16} />
                        <h3 className="text-xs font-black uppercase tracking-widest">Weather</h3>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-primary hover:bg-primary/10 print:hidden"
                        onClick={handleAIWeatherSync}
                        disabled={isFetchingWeather}
                      >
                        {isFetchingWeather ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      </Button>
                    </div>
                    <div className="p-3 bg-muted/50 rounded border flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-black">{weather.temp}</p>
                        <p className="text-xs font-bold uppercase">{weather.condition}</p>
                      </div>
                      <div className="text-right text-[10px] font-bold uppercase text-muted-foreground">
                        <p>Sunrise: 06:45</p>
                        <p>Sunset: {weather.sunset}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <Phone size={16} />
                      <h3 className="text-xs font-black uppercase tracking-widest">Key Contacts</h3>
                    </div>
                    <div className="p-3 bg-muted/50 rounded border text-sm space-y-2">
                      <div className="flex justify-between outline-none focus:bg-white p-1 rounded" contentEditable suppressContentEditableWarning>
                        <span>1st AD: Mike Miller</span>
                        <span className="font-mono font-bold">555-0123</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t outline-none focus:bg-white p-1 rounded" contentEditable suppressContentEditableWarning>
                        <span>Production Mgr</span>
                        <span className="font-mono font-bold">555-9876</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-l-4 border-primary pl-3">
                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-primary" />
                      <h3 className="text-lg font-black uppercase tracking-tight">Shooting Schedule</h3>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={addScheduleRow} 
                      className="print:hidden h-7 gap-1 px-2"
                    >
                      <Plus size={14} />
                      Add Line
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted hover:bg-muted">
                        <TableHead className="w-16 font-bold uppercase text-[10px]">Time</TableHead>
                        <TableHead className="w-16 font-bold uppercase text-[10px]">Sc.</TableHead>
                        <TableHead className="font-bold uppercase text-[10px]">Description</TableHead>
                        <TableHead className="w-24 font-bold uppercase text-[10px]">Cast</TableHead>
                        <TableHead className="w-32 font-bold uppercase text-[10px]">Location</TableHead>
                        <TableHead className="w-10 print:hidden"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedule.map((row, i) => (
                        <TableRow key={i} className={row.desc.includes('LUNCH') ? 'bg-primary/5 font-bold' : 'group'}>
                          <TableCell className="font-mono text-xs outline-none focus:bg-muted" contentEditable suppressContentEditableWarning>{row.time}</TableCell>
                          <TableCell className="font-bold outline-none focus:bg-muted" contentEditable suppressContentEditableWarning>{row.sc}</TableCell>
                          <TableCell className="text-sm outline-none focus:bg-muted" contentEditable suppressContentEditableWarning>{row.desc}</TableCell>
                          <TableCell className="text-xs font-bold outline-none focus:bg-muted" contentEditable suppressContentEditableWarning>{row.cast}</TableCell>
                          <TableCell className="text-xs text-muted-foreground outline-none focus:bg-muted" contentEditable suppressContentEditableWarning>{row.loc}</TableCell>
                          <TableCell className="text-right print:hidden">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeScheduleRow(i)}
                            >
                              <Trash2 size={12} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

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
                        {castData.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-bold outline-none focus:bg-muted" contentEditable suppressContentEditableWarning>{row.id}</TableCell>
                            <TableCell className="text-sm outline-none focus:bg-muted" contentEditable suppressContentEditableWarning>{row.name}</TableCell>
                            <TableCell className="text-xs font-bold uppercase text-muted-foreground outline-none focus:bg-muted" contentEditable suppressContentEditableWarning>{row.role}</TableCell>
                            <TableCell className="font-mono font-bold outline-none focus:bg-muted" contentEditable suppressContentEditableWarning>{row.call}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="space-y-4 bg-muted/20 p-6 rounded-xl border-2 border-dashed border-muted">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Production Notes</h3>
                    <div className="text-xs space-y-3 list-disc pl-4 text-muted-foreground font-medium outline-none focus:bg-white p-2 rounded" contentEditable suppressContentEditableWarning>
                      <p>• Safety meeting at 07:15 for all electrical and grip crew.</p>
                      <p>• Heavy rain effects in Scene 12—bring appropriate weather gear.</p>
                      <p>• Parking strictly enforced in Hangar lot; use shuttle for Overflow.</p>
                      <p>• Quiet on set! Hospital in adjacent building.</p>
                    </div>
                    <div className="pt-4 mt-4 border-t border-muted">
                      <div className="flex items-center gap-2 text-primary">
                        <CalendarDays size={14} />
                        <span className="text-[10px] font-black uppercase">Tomorrow's Look</span>
                      </div>
                      <p className="text-[10px] mt-1 italic outline-none focus:bg-white p-1 rounded" contentEditable suppressContentEditableWarning>
                        Scene 16-19: Night exterior car chase sequence. Prep vehicles for 14:00.
                      </p>
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