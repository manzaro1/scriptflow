"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ScriptCard from "@/components/ScriptCard";
import NewScriptModal from "@/components/NewScriptModal";
import ProductionStats from "@/components/ProductionStats";
import OnboardingTour from "@/components/OnboardingTour";
import ScriptCardSkeleton from "@/components/ScriptCardSkeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter, SearchX, RefreshCw, Film, Plus, ArrowRight, FileText, BrainCircuit, Clapperboard } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { showError } from '@/utils/toast';
import { sanitizeInput } from '@/utils/security';
import { motion, AnimatePresence } from "framer-motion";

const Index = () => {
  const { user, session } = useAuth();
  const [scripts, setScripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [genreFilter, setGenreFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchScripts = useCallback(async (showSkeleton = true) => {
    if (!user) return;
    if (showSkeleton) setLoading(true);

    try {
      const { data: scriptData, error: scriptError } = await supabase
        .from('scripts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (scriptError) {
        console.error("[Dashboard] Error:", scriptError);
        showError("Failed to load scripts.");
      } else {
        setScripts(scriptData || []);
      }
    } catch (err) {
      console.error("[Dashboard] Error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchScripts();
  }, [user, fetchScripts]);

  const filteredScripts = useMemo(() => {
    if (!Array.isArray(scripts)) return [];
    return scripts.filter(script => {
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "recent" && script.status !== 'Archived') ||
        (activeTab === "shared" && script.user_id !== user?.id) ||
        (activeTab === "archived" && script.status === 'Archived');

      const matchesGenre = genreFilter === "all" || script.genre === genreFilter;
      const matchesSearch =
        (script.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (script.author || "").toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesGenre && matchesSearch;
    });
  }, [scripts, activeTab, genreFilter, searchQuery, user?.id]);

  const stats = useMemo(() => {
    if (!Array.isArray(scripts)) return { total: 0, finished: 0, pages: 0 };
    const finished = scripts.filter(s => s.status === 'Final').length;
    const pages = scripts.reduce((acc, s) => {
      const content = Array.isArray(s.content) ? s.content : [];
      return acc + Math.max(1, Math.ceil(content.length / 15));
    }, 0);

    return { total: scripts.length, finished, pages };
  }, [scripts]);

  const genres = ["all", ...new Set(scripts.map(s => s.genre).filter(Boolean))];

  const handleRename = async (id: string, newTitle: string) => {
    const sanitizedTitle = sanitizeInput(newTitle);
    const { error } = await supabase
      .from('scripts')
      .update({ title: sanitizedTitle, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) showError("Failed to rename.");
    else fetchScripts(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('scripts').delete().eq('id', id);
    if (error) showError("Failed to delete.");
    else fetchScripts(false);
  };

  const isNewUser = !loading && scripts.length === 0;

  if (isNewUser) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar onSearch={setSearchQuery} />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            <div className="max-w-3xl mx-auto pt-12">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
                <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-xl">
                  <Film className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-4xl font-black">Welcome to ScriptFlow!</h1>
                <p className="text-lg text-muted-foreground">Create your first screenplay to get started.</p>
                <div className="pt-4">
                  <NewScriptModal onComplete={() => fetchScripts(false)}>
                    <Button size="lg" className="h-14 px-8 text-lg font-bold gap-3 shadow-xl">
                      <Plus size={22} /> Create Your First Script <ArrowRight size={20} />
                    </Button>
                  </NewScriptModal>
                </div>
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <OnboardingTour />
      <Navbar onSearch={setSearchQuery} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 tour-scripts-header">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Script Library</h1>
                <p className="text-muted-foreground mt-1">Manage and edit your screenplays.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => fetchScripts(false)} disabled={loading}>
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">Filter Genre</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Genre</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={genreFilter} onValueChange={setGenreFilter}>
                      {genres.map(genre => (
                        <DropdownMenuRadioItem key={genre} value={genre}>{genre}</DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <NewScriptModal onComplete={() => fetchScripts(false)} />
              </div>
            </header>
            <ProductionStats totalScripts={stats.total} totalFinished={stats.finished} totalPages={stats.pages} />
            <Tabs defaultValue="all" onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="shared">Shared</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
              </TabsList>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => <ScriptCardSkeleton key={i} />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredScripts.map((script) => (
                    <ScriptCard
                      key={script.id}
                      id={script.id}
                      title={script.title}
                      author={script.author}
                      status={script.status as any}
                      genre={script.genre}
                      lastModified={new Date(script.updated_at).toLocaleDateString()}
                      onRename={handleRename}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;