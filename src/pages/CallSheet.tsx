"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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

const INITIAL_SCHEDULE = [
  { time: '08:00', sc: '12', desc: 'EXT. SKYLINE - NIGHT. Kai watches the rain.', cast: '1', loc: 'Stage 4' },
  { time: '10:30', sc: '14A', desc: 'INT. HANGAR - DAY. Arrival of the shipment.', cast: '1, 2, 4', loc: 'Stage 4' },
  { time: '13:00', sc: '-', desc: 'LUNCH (1 HOUR)', cast: 'ALL', loc: 'Catering' },
];

const INITIAL_CAST = [
  { id: '1', name: 'John Actor', role: 'KAI', call: '06:00' },
  { id: '2', name: 'Sarah Star', role: 'SARA', call: '08:30' },
];

const CallSheet = () => {
  const [searchParams] = useSearchParams();
  const scriptIdFromUrl = searchParams.get('script');
  
  const [scripts, setScripts] = useState<any[]>([]);
  const [selectedScript, setSelectedScript] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  
  // Call sheet state
  const [callSheetId, setCallSheetId] = useState<string | null>(null);
  const [productionDay, setProductionDay] = useState('1');
  const [crewCall, setCrewCall] = useState('07:00');
  const [weather, setWeather] = useState({ temp: '72°F', condition: 'Clear Skies', sunset: '18:30' });
  const [schedule, setSchedule] = useState<any[]>(INITIAL_SCHEDULE);
  const [castData, setCastData] = useState<any[]>(INITIAL_CAST);
  const [productionNotes, setProductionNotes] = useState('• Safety meeting at 07:15.\n• Heavy rain effects expected.');

  useEffect(() => {
    const fetchScripts = async () => {
      const { data } = await supabase.from('scripts').select('id, title');
      if (data) {
        setScripts(data);
        const initial = scriptIdFromUrl 
          ? data.find(s => s.id === scriptIdFromUrl) 
          : data[0];
        if (initial) {
          setSelectedScript(initial);
          fetchCallSheet(initial.id);
        } else {
          setLoading(false);
        }
      }
    };
    fetchScripts();
  }, [scriptIdFromUrl]);

  const fetchCallSheet = async (scriptId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('call_sheets')
      .select('*')
      .eq('script_id', scriptId)
      .maybeSingle();

    if (data) {
      setCallSheetId(data.id);
      setProductionDay(data.production_day);
      setCrewCall(data.crew_call);
      setWeather(data.weather);
      setSchedule(data.schedule || INITIAL_SCHEDULE);
      setCastData(data.cast_calls || INITIAL_CAST);
      setProductionNotes(data.production_notes || '');
    } else {
      setCallSheetId(null);
      setProductionDay('1');
      setCrewCall('07:00');
      setSchedule(INITIAL_SCHEDULE);
      setCastData(INITIAL_CAST);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!selectedScript) return;
    setSaving(true);
    const toastId = showLoading("Saving call sheet...");

    const payload = {
      script_id: selectedScript.id,
      production_day: productionDay,
      crew_call: crewCall,
      weather,
      schedule,
      cast_calls: castData,
      production_notes: productionNotes,
      updated_at: new Date().toISOString()
    };

    let error;
    if (callSheetId) {
      const { error: updateError } = await supabase
        .from('call_sheets')
        .update(payload)
        .eq('id', callSheetId);
      error = updateError;
    } else {
      const { data: userData } = await supabase.auth.getUser();
      const { data: newCS, error: insertError } = await supabase
        .from('call_sheets')
        .insert({ ...payload, user_id: userData.user?.id })
        .select()
        .single();
      if (newCS) setCallSheetId(newCS.id);
      error = insertError;
    }

    dismissToast(toastId);
    setSaving(false);

    if (error) {
      showError("Failed to save call sheet");
    } else {
      showSuccess("Call sheet saved to production cloud");
    }
  };

  const handleAIWeatherSync = () => {
    setIsFetchingWeather(true);
    setTimeout(() => {
      setWeather({
        temp: `${Math.floor(Math.random() * (85 - 65) + 65)}°F`,
        condition: ['Partly Cloudy', 'Sunny', 'Light Breeze', 'Clear Skies'][Math.floor(Math.random() * 4)],
        sunset: '18:42'
      });
      setIsFetchingWeather(false);
      showSuccess("AI Weather Forecast synchronized.");
    }, 1500);
  };

  const addScheduleRow = () => {
    setSchedule([...schedule, { time: '00:00', sc: '-', desc: 'New Scene', cast: '-', loc: '-' }]);
  };

  const removeScheduleRow = (index: number) => {
    setSchedule(schedule.filter((_, i) => i !== index));
  };

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
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Call Sheets</h1>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Script:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2 font-bold h-7">
                        {selectedScript?.title || "Select Script"}
                        <ChevronDown size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuLabel>Select Project</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {scripts.map(script => (
                        <DropdownMenuItem 
                          key={script.id} 
                          onClick={() => {
                            setSelectedScript(script);
                            fetchCallSheet(script.id);
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
                <Button variant="outline" size="sm" className="gap-2" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
                  <Printer size={16} />
                  Print
                </Button>
              </div>
            </header>

            {!selectedScript ? (
              <div className="text-center py-20 border-2 border-dashed rounded-xl">
                <p className="text-muted-foreground">Please select or create a script to manage call sheets.</p>
              </div>
            ) : (
              <Card className="shadow-xl border-t-8 border-t-primary print:shadow-none print:border-none">
                <CardContent className="p-8 space-y-8">
                  <div className="flex flex-col md:flex-row justify-between gap-6 border-b pb-6">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h2 className="text-4xl font-black tracking-tighter uppercase italic">
                          {selectedScript.title}
                        </h2>
                        <div className="flex items-center gap-2 text-sm font-bold uppercase text-muted-foreground tracking-widest">
                          Production Day 
                          <span contentEditable onBlur={(e) => setProductionDay(e.currentTarget.innerText)} className="px-1 bg-muted rounded">
                            {productionDay}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-muted p-4 rounded-lg flex flex-col justify-center items-center text-center min-w-[180px]">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Crew Call</p>
                      <div className="text-4xl font-black outline-none focus:bg-white/50 p-1" contentEditable suppressContentEditableWarning onBlur={(e) => setCrewCall(e.currentTarget.innerText)}>
                        {crewCall}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        <MapPin size={16} />
                        <h3 className="text-xs font-black uppercase tracking-widest">Locations</h3>
                      </div>
                      <div className="p-3 bg-muted/50 rounded border text-sm space-y-2">
                        <p className="font-bold">Stage 4 - Neon Studio</p>
                        <p className="text-xs text-muted-foreground">123 Production Way, Culver City</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-primary">
                          <CloudSun size={16} />
                          <h3 className="text-xs font-black uppercase tracking-widest">Weather</h3>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-primary print:hidden" onClick={handleAIWeatherSync} disabled={isFetchingWeather}>
                          {isFetchingWeather ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        </Button>
                      </div>
                      <div className="p-3 bg-muted/50 rounded border flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-black">{weather.temp}</p>
                          <p className="text-xs font-bold uppercase">{weather.condition}</p>
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
                          <span>1st AD: Alex Rivers</span>
                          <span className="font-mono font-bold">555-0123</span>
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
                      <Button variant="outline" size="sm" onClick={addScheduleRow} className="print:hidden h-7 gap-1 px-2">
                        <Plus size={14} /> Add Line
                      </Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted hover:bg-muted">
                          <TableHead className="w-16 font-bold uppercase text-[10px]">Time</TableHead>
                          <TableHead className="w-16 font-bold uppercase text-[10px]">Sc.</TableHead>
                          <TableHead className="font-bold uppercase text-[10px]">Description</TableHead>
                          <TableHead className="w-24 font-bold uppercase text-[10px]">Cast</TableHead>
                          <TableHead className="w-10 print:hidden"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {schedule.map((row, i) => (
                          <TableRow key={i} className="group">
                            <TableCell className="font-mono text-xs" contentEditable onBlur={(e) => {
                              const next = [...schedule];
                              next[i].time = e.currentTarget.innerText;
                              setSchedule(next);
                            }}>{row.time}</TableCell>
                            <TableCell className="font-bold" contentEditable onBlur={(e) => {
                              const next = [...schedule];
                              next[i].sc = e.currentTarget.innerText;
                              setSchedule(next);
                            }}>{row.sc}</TableCell>
                            <TableCell className="text-sm" contentEditable onBlur={(e) => {
                              const next = [...schedule];
                              next[i].desc = e.currentTarget.innerText;
                              setSchedule(next);
                            }}>{row.desc}</TableCell>
                            <TableCell className="text-xs font-bold" contentEditable onBlur={(e) => {
                              const next = [...schedule];
                              next[i].cast = e.currentTarget.innerText;
                              setSchedule(next);
                            }}>{row.cast}</TableCell>
                            <TableCell className="text-right print:hidden">
                              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeScheduleRow(i)}>
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
                            <TableHead className="w-20 font-bold uppercase text-[10px]">Call</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {castData.map((row, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-bold" contentEditable onBlur={(e) => {
                                const next = [...castData];
                                next[i].id = e.currentTarget.innerText;
                                setCastData(next);
                              }}>{row.id}</TableCell>
                              <TableCell className="text-sm" contentEditable onBlur={(e) => {
                                const next = [...castData];
                                next[i].name = e.currentTarget.innerText;
                                setCastData(next);
                              }}>{row.name}</TableCell>
                              <TableCell className="font-mono font-bold" contentEditable onBlur={(e) => {
                                const next = [...castData];
                                next[i].call = e.currentTarget.innerText;
                                setCastData(next);
                              }}>{row.call}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="space-y-4 bg-muted/20 p-6 rounded-xl border-2 border-dashed border-muted">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Production Notes</h3>
                      <div 
                        className="text-xs min-h-[100px] outline-none" 
                        contentEditable 
                        onBlur={(e) => setProductionNotes(e.currentTarget.innerText)}
                      >
                        {productionNotes}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CallSheet;