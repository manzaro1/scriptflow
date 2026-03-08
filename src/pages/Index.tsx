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
import { Filter, SearchX, Loader2, RefreshCw, Film, Plus, Sparkles, ArrowRight, FileText, BrainCircuit, Clapperboard } from 'lucide-react';
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
  const { user, session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [scripts, setScripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [genreFilter, setGenreFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [totalCollaborators, setTotalCollaborators] = useState(0);

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user || !session) {
    return null;
  }

  const fetchScripts = useCallback(async (showSkeleton = true) => {
    if (!user || !session) return;

    if (showSkeleton) setLoading(true);

    try {
      const { data: scriptData, error: scriptError } = await supabase
        .from('scripts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (scriptError) {
        console.error("[Dashboard] Supabase Error:", scriptError.message, scriptError.details);
        showError("Failed to load scripts. Please try again.");
      } else if (scriptData) {
        setScripts(scriptData);
        setTotalCollaborators(0);
      }
    } catch (err) {
      console.error("[Dashboard] Unexpected error:", err);
      showError("An unexpected error occurred while loading your library.");
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  useEffect(() => {
    if (user && session) fetchScripts();
  }, [user, session, fetchScripts]);

  const filteredScripts = useMemo(() => {
    return scripts.filter(script => {
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "recent" && script.status !== 'Archived') ||
        (activeTab === "shared" && script.user_id !== user?.id) ||
        (activeTab === "archived" && script.status === 'Archived');

      const matchesGenre = genreFilter === "all" || script.genre === genreFilter;
      const matchesSearch =
        script.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        script.author.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesGenre && matchesSearch;
    });
  }, [scripts, activeTab, genreFilter, searchQuery, user?.id]);

  const stats = useMemo(() => {
    const finished = scripts.filter(s => s.status === 'Final').length;
    const pages = scripts.reduce((acc, s) => {
      const content = Array.isArray(s.content) ? s.content : [];
      return acc + Math.max(1, Math.ceil(content.length / 15));
    }, 0);

    return {
      total: scripts.length,
      finished,
      pages
    };
  }, [scripts]);

  const genres = ["all", ...new Set(scripts.map(s => s.genre))];

  const handleRename = async (id: string, newTitle: string) => {
    const sanitizedTitle = sanitizeInput(newTitle);
    const { error } = await supabase
      .from('scripts')
      .update({ title: sanitizedTitle, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      showError("Failed to rename script.");
    } else {
      setScripts(prev => prev.map(s => s.id === id ? { ...s, title: sanitizedTitle } : s));
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('scripts').delete().eq('id', id);
    if (error) {
      showError("Failed to delete script.");
    } else {
      setScripts(prev => prev.filter(s => s.id !== id));
    }
  };

  // New user welcome / onboarding screen
  const isNewUser = !loading && scripts.length === 0;

  if (isNewUser) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar onSearch={setSearchQuery} />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            <div className="max-w-3xl mx-auto pt-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center space-y-6"
              >
                <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-xl shadow-primary/25">
                  <Film className="h-10 w-10 text-white" />
                </div>

                <div className="space-y-3">
                  <h1 className="text-4xl font-black tracking-tight">
                    Welcome to ScriptFlow
                    {user?.user_metadata?.first_name ? `, ${user.user_metadata.first_name}` : ''}!
                  </h1>
                  <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Your professional screenwriting studio is ready. Create your first screenplay to get started.
                  </p>
                </div>

                <div className="pt-4">
                  <NewScriptModal onComplete={() => fetchScripts(false)}>
                    <Button size="lg" className="h-14 px-8 text-lg font-bold gap-3 shadow-xl shadow-primary/25">
                      <Plus size={22} />
                      Create Your First Script
                      <ArrowRight size={20} />
                    </Button>
                  </NewScriptModal>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16"
              >
                {[
                  {
                    icon: FileText,
                    title: "Write",
                    description: "Industry-standard screenplay editor with proper formatting, scene headers, and character names.",
                    color: "text-blue-600",
                    bg: "bg-blue-500/10"
                  },
                  {
                    icon: BrainCircuit,
                    title: "Analyze",
                    description: "AI monitors character consistency, pacing, and narrative tension in real-time as you write.",
                    color: "text-purple-600",
                    bg: "bg-purple-500/10"
                  },
                  {
                    icon: Clapperboard,
                    title: "Produce",
                    description: "Generate call sheets, scene breakdowns, and storyboards directly from your script.",
                    color: "text-orange-600",
                    bg: "bg-orange-500/10"
                  },
                ].map((feature, i) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                    className="p-6 rounded-xl border bg-card text-center space-y-3"
                  >
                    <div className={`h-12 w-12 rounded-xl ${feature.bg} flex items-center justify-center mx-auto`}>
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="font-bold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="mt-12 text-center"
              >
                <p className="text-xs text-muted-foreground">
                  Press <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">Tab</kbd> in the editor to cycle block types &middot; <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">Enter</kbd> for new block &middot; Type <span className="font-mono">INT.</span> or <span className="font-mono">EXT.</span> for scene headings
                </p>
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
            <motion.header
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 tour-scripts-header"
            >
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Script Library</h1>
                <p className="text-muted-foreground mt-1">Manage and edit your screenplays in one place.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fetchScripts(false)}
                  disabled={loading}
                  className="h-8 w-8"
                >
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter size={16} />
                      Genre: {genreFilter.charAt(0).toUpperCase() + genreFilter.slice(1)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Filter by Genre</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={genreFilter} onValueChange={setGenreFilter}>
                      {genres.map(genre => (
                        <DropdownMenuRadioItem key={genre} value={genre}>
                          {genre.charAt(0).toUpperCase() + genre.slice(1)}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="tour-new-script">
                  <NewScriptModal onComplete={() => fetchScripts(false)} />
                </div>
              </div>
            </motion.header>

            <div className="tour-stats">
              <ProductionStats
                totalScripts={stats.total}
                totalFinished={stats.finished}
                totalPages={stats.pages}
                totalCollaborators={totalCollaborators}
              />
            </div>

            <Tabs defaultValue="all" className="w-full tour-tabs" onValueChange={setActiveTab}>
              <div className="flex items-center justify-between mb-6">
                <TabsList>
                  <TabsTrigger value="all">All Scripts</TabsTrigger>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                  <TabsTrigger value="shared">Shared</TabsTrigger>
                  <TabsTrigger value="archived">Archived</TabsTrigger>
                </TabsList>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <ScriptCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredScripts.length > 0 ? (
                <AnimatePresence mode="popLayout">
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
                </AnimatePresence>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl bg-muted/10"
                >
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <SearchX className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">No matches found</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                    Try adjusting your search or filter criteria, or create a new script.
                  </p>
                  <NewScriptModal onComplete={() => fetchScripts(false)}>
                    <Button className="mt-6 gap-2">
                      <Plus size={16} />
                      Create New Script
                    </Button>
                  </NewScriptModal>
                </motion.div>
              )}
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
