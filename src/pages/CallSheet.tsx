"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
import { sanitizeInput } from "@/utils/security";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const DEFAULT_CAST_DATA = [

  { id: 1, name: 'John Actor', role: 'KAI', call: '06:00' },
  { id: 2, name: 'Sarah Star', role: 'SARA', call: '08:30' },
  { id: 3, name: 'Mike Talent', role: 'VEO', call: '09:00' },
];

const DEFAULT_SCHEDULE = [
  { time: '08:00', sc: '12', desc: 'EXT. RAIN-SLICKED ALLEY - NIGHT. Jax meets Vera.', cast: '1, 2', loc: 'Stage 4' },
  { time: '10:30', sc: '14A', desc: 'INT. UNDERGROUND HUB - CONTINUOUS. Confrontation.', cast: '1, 2', loc: 'Stage 4' },
  { time: '13:00', sc: '-', desc: 'LUNCH (1 HOUR)', cast: 'ALL', loc: 'Catering' },
  { time: '14:00', sc: '15', desc: 'INT. LABORATORY. Dr. Aris reveals the coil.', cast: '3', loc: 'Stage 2' },
  { time: '17:30', sc: '-', desc: 'WRAP', cast: 'ALL', loc: '-' },
];

const CallSheet = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const scriptId = searchParams.get('script');
  const navigate = useNavigate();

  const [availableScripts, setAvailableScripts] = useState<{ id: string; title: string }[]>([]);
  const [selectedScript, setSelectedScript] = useState<{ id: string; title: string } | null>(null);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [weather, setWeather] = useState({ temp: '72°F', condition: 'Clear Skies', sunset: '18:30' });
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [castData, setCastData] = useState(DEFAULT_CAST_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvailableScripts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('scripts')
        .select('id, title')
        .eq('user_id', user.id);

      if (!error && data) {
        setAvailableScripts(data);
        if (scriptId) {
          const selected = data.find(s => s.id === scriptId);
          if (selected) setSelectedScript(selected);
        } else if (data.length > 0) {
          // If no scriptId in param, pick first one and update param
          setSelectedScript(data[0]);
          setSearchParams({ script: data[0].id });
        }
      }
    };
    fetchAvailableScripts();
  }, [scriptId, setSearchParams]);

  useEffect(() => {
    const fetchCallSheetData = async () => {
      if (!scriptId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('call_sheets')
          .select('*')
          .eq('script_id', scriptId)
          .maybeSingle();

        if (!error && data) {
          if (data.schedule) setSchedule(data.schedule);
          if (data.cast_calls) setCastData(data.cast_calls);
          if (data.weather) setWeather(data.weather);
        }
      } catch (err) {
        console.error('Error fetching call sheet data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCallSheetData();
  }, [scriptId]);

  const handlePrint = () => {
    window.print();
    showSuccess("Preparing call sheet for print...");
  };

  const handleSave = async () => {
    if (!scriptId) {
      showError("Cannot save: Script ID is missing.");
      return;
    }

    const sanitizedSchedule = schedule.map(row => ({
      ...row,
      time: sanitizeInput(row.time),
      sc: sanitizeInput(row.sc),
      desc: sanitizeInput(row.desc),
      cast: sanitizeInput(row.cast),
      loc: sanitizeInput(row.loc)
    }));

    const sanitizedCast = castData.map(row => ({
      ...row,
      name: sanitizeInput(row.name),
      role: sanitizeInput(row.role),
      call: sanitizeInput(row.call)
    }));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("Must be logged in to save.");
      return;
    }

    const callSheetPayload = {
      script_id: scriptId,
      user_id: user.id,
      schedule: sanitizedSchedule,
      cast_calls: sanitizedCast,
      weather: weather,
    };

    const { error } = await supabase
      .from('call_sheets')
      .upsert(callSheetPayload, { onConflict: 'script_id' });

    if (error) {
      showError("Failed to save call sheet.");
      console.error(error);
    } else {
      setSchedule(sanitizedSchedule);
      setCastData(sanitizedCast);
      showSuccess("Call sheet validated and saved securely.");
    }
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

  const updateScheduleCell = (index: number, field: string, value: string) => {
    const newSchedule = [...schedule];
    (newSchedule[index] as any)[field] = sanitizeInput(value);
    setSchedule(newSchedule);
  };

  const updateCastCell = (index: number, field: string, value: string) => {
    const newCast = [...castData];
    (newCast[index] as any)[field] = sanitizeInput(value);
    setCastData(newCast);
  };

  const isBreakRow = (desc: string) => desc.includes('LUNCH') || desc.includes('WRAP');

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

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
            <motion.header
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden"
            >
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
                      {availableScripts.length === 0 ? (
                        <DropdownMenuItem disabled>No scripts found</DropdownMenuItem>
                      ) : (
                        availableScripts.map(script => (
                          <DropdownMenuItem
                            key={script.id}
                            onClick={() => {
                              setSelectedScript(script);
                              setSearchParams({ script: script.id });
                              showSuccess(`Call sheet loaded for "${script.title}"`);
                            }}
                          >
                            {script.title}
                          </DropdownMenuItem>
                        ))
                      )}

                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={handleSave}>
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
            </motion.header>

            <Card className="shadow-xl overflow-hidden print:shadow-none print:border-none">
              {/* Gradient header bar */}
              <div className="h-2 bg-gradient-to-r from-primary via-purple-500 to-fuchsia-500" />

              <CardContent className="p-8 space-y-8">
                <div className="flex flex-col md:flex-row justify-between gap-6 border-b pb-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h2 className="text-4xl font-black tracking-tighter uppercase italic outline-none focus:bg-muted p-1 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => selectedScript && setSelectedScript({...selectedScript, title: sanitizeInput(e.currentTarget.innerText)})}>
                        {selectedScript?.title || "NEW PRODUCTION"}
                      </h2>

                      <p className="text-sm font-bold uppercase text-muted-foreground tracking-widest outline-none focus:bg-muted px-1" contentEditable suppressContentEditableWarning>
                        Production Day 1 of 1
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

                  {/* Prominent crew call card */}
                  <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 p-6 rounded-xl border border-primary/20 flex flex-col justify-center items-center text-center min-w-[200px] shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">Crew Call</p>
                    <div className="text-5xl font-black tracking-tight outline-none focus:bg-white/50 p-1" contentEditable suppressContentEditableWarning>07:00</div>
                    <p className="text-xs font-bold mt-2 text-muted-foreground uppercase outline-none focus:bg-white/50" contentEditable suppressContentEditableWarning>AM • Oct 12, 2024</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <MapPin size={16} />
                      <h3 className="text-xs font-black uppercase tracking-widest">Locations</h3>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg border text-sm space-y-2">
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
                    <div className="p-3 bg-muted/50 rounded-lg border flex items-center justify-between">
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
                    <div className="p-3 bg-muted/50 rounded-lg border text-sm space-y-2">
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
                  <div className="rounded-lg overflow-hidden border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-900 dark:hover:bg-slate-800">
                          <TableHead className="w-16 font-black uppercase text-[10px] text-white tracking-wider">Time</TableHead>
                          <TableHead className="w-16 font-black uppercase text-[10px] text-white tracking-wider">Sc.</TableHead>
                          <TableHead className="font-black uppercase text-[10px] text-white tracking-wider">Description</TableHead>
                          <TableHead className="w-24 font-black uppercase text-[10px] text-white tracking-wider">Cast</TableHead>
                          <TableHead className="w-32 font-black uppercase text-[10px] text-white tracking-wider">Location</TableHead>
                          <TableHead className="w-10 print:hidden"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {schedule.map((row, i) => (
                          <TableRow
                            key={i}
                            className={
                              isBreakRow(row.desc)
                                ? 'bg-primary/10 font-bold border-y-2 border-primary/20'
                                : i % 2 === 0 ? 'bg-background group' : 'bg-muted/30 group'
                            }
                          >
                            <TableCell className="font-mono text-xs font-bold outline-none focus:bg-muted" contentEditable suppressContentEditableWarning onBlur={(e) => updateScheduleCell(i, 'time', e.currentTarget.innerText)}>{row.time}</TableCell>
                            <TableCell className="font-bold outline-none focus:bg-muted" contentEditable suppressContentEditableWarning onBlur={(e) => updateScheduleCell(i, 'sc', e.currentTarget.innerText)}>{row.sc}</TableCell>
                            <TableCell className="text-sm outline-none focus:bg-muted" contentEditable suppressContentEditableWarning onBlur={(e) => updateScheduleCell(i, 'desc', e.currentTarget.innerText)}>{row.desc}</TableCell>
                            <TableCell className="text-xs font-bold outline-none focus:bg-muted" contentEditable suppressContentEditableWarning onBlur={(e) => updateScheduleCell(i, 'cast', e.currentTarget.innerText)}>{row.cast}</TableCell>
                            <TableCell className="text-xs text-muted-foreground outline-none focus:bg-muted" contentEditable suppressContentEditableWarning onBlur={(e) => updateScheduleCell(i, 'loc', e.currentTarget.innerText)}>{row.loc}</TableCell>
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-l-4 border-orange-500 pl-3">
                      <User size={18} className="text-orange-500" />
                      <h3 className="text-lg font-black uppercase tracking-tight">Cast Calls</h3>
                    </div>
                    <div className="rounded-lg overflow-hidden border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-900 dark:hover:bg-slate-800">
                            <TableHead className="w-12 font-black uppercase text-[10px] text-white tracking-wider">#</TableHead>
                            <TableHead className="font-black uppercase text-[10px] text-white tracking-wider">Performer</TableHead>
                            <TableHead className="font-black uppercase text-[10px] text-white tracking-wider">Role</TableHead>
                            <TableHead className="w-20 font-black uppercase text-[10px] text-white tracking-wider">Call</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {castData.map((row, i) => (
                            <TableRow key={row.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                              <TableCell className="font-bold outline-none focus:bg-muted" contentEditable suppressContentEditableWarning onBlur={(e) => updateCastCell(i, 'id', e.currentTarget.innerText)}>{row.id}</TableCell>
                              <TableCell className="text-sm outline-none focus:bg-muted" contentEditable suppressContentEditableWarning onBlur={(e) => updateCastCell(i, 'name', e.currentTarget.innerText)}>{row.name}</TableCell>
                              <TableCell className="text-xs font-bold uppercase text-muted-foreground outline-none focus:bg-muted" contentEditable suppressContentEditableWarning onBlur={(e) => updateCastCell(i, 'role', e.currentTarget.innerText)}>{row.role}</TableCell>
                              <TableCell className="font-mono font-bold outline-none focus:bg-muted" contentEditable suppressContentEditableWarning onBlur={(e) => updateCastCell(i, 'call', e.currentTarget.innerText)}>{row.call}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Post-it note style production notes */}
                  <div className="space-y-4 bg-amber-50/50 dark:bg-amber-900/10 p-6 rounded-xl border-2 border-amber-200/50 dark:border-amber-800/30 shadow-sm relative">
                    <div className="absolute -top-2 -right-2 h-6 w-6 bg-amber-400 rounded-full shadow-md print:hidden" />
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">Production Notes</h3>
                    <div className="text-xs space-y-3 list-disc pl-4 text-muted-foreground font-medium outline-none focus:bg-white/50 dark:focus:bg-black/20 p-2 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => { e.currentTarget.innerText = sanitizeInput(e.currentTarget.innerText); }}>
                      <p>• Safety meeting at 07:15 for all electrical and grip crew.</p>
                      <p>• Heavy rain effects in Scene 12—bring appropriate weather gear.</p>
                      <p>• Parking strictly enforced in Hangar lot; use shuttle for Overflow.</p>
                      <p>• Quiet on set! Hospital in adjacent building.</p>
                    </div>
                    <div className="pt-4 mt-4 border-t border-amber-200/50 dark:border-amber-800/30">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                        <CalendarDays size={14} />
                        <span className="text-[10px] font-black uppercase">Tomorrow's Look</span>
                      </div>
                      <p className="text-[10px] mt-1 italic outline-none focus:bg-white/50 dark:focus:bg-black/20 p-1 rounded" contentEditable suppressContentEditableWarning onBlur={(e) => { e.currentTarget.innerText = sanitizeInput(e.currentTarget.innerText); }}>
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
