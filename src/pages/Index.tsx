"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ScriptCard from "@/components/ScriptCard";
import NewScriptModal from "@/components/NewScriptModal";
import ProductionStats from "@/components/ProductionStats";
import OnboardingTour from "@/components/OnboardingTour";
import ScriptCardSkeleton from "@/components/ScriptCardSkeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter, SearchX, Loader2, RefreshCw } from 'lucide-react';
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
import { ensureSampleScriptExists } from "@/utils/script-seeder";
import { showError } from '@/utils/toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import RuleVersioning from '@/components/RuleVersioning';
import RuleAccessControl from '@/components/RuleAccessControl';
import RuleValidation from '@/components/RuleValidation';
import { Settings, ShieldAlert } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const [scripts, setScripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [genreFilter, setGenreFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [totalCollaborators, setTotalCollaborators] = useState(0);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch a default rule ID for the versioning component
    const fetchDefaultRule = async () => {
      const { data } = await supabase.from('ai_rules').select('id').limit(1).single();
      if (data) setSelectedRuleId(data.id);
    };
    fetchDefaultRule();
  }, []);

  const fetchScripts = useCallback(async (showSkeleton = true) => {
    if (!user) return;
    
    if (showSkeleton) setLoading(true);
    
    try {
      // 1. Fetch Scripts and Collaborators
      const { data: scriptData, error: scriptError } = await supabase
        .from('scripts')
        .select('*, script_collaborators(user_id)') 
        .order('updated_at', { ascending: false });
      
      if (scriptError) {
        console.error("Error fetching scripts:", scriptError);
        showError("Failed to load scripts from database.");
      } else if (scriptData) {
        setScripts(scriptData);
        
        // 2. Calculate unique collaborators
        const collaboratorIds = new Set<string>();
        scriptData.forEach(script => {
          if (script.script_collaborators && Array.isArray(script.script_collaborators)) {
            script.script_collaborators.forEach((collab: { user_id: string | null }) => {
              if (collab.user_id && collab.user_id !== user.id) {
                collaboratorIds.add(collab.user_id);
              }
            });
          }
        });
        setTotalCollaborators(collaboratorIds.size);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const initializeDashboard = async () => {
      if (!user) return;
      
      setIsSeeding(true);
      const userName = user.user_metadata?.first_name || user.email?.split('@')[0] || 'Anonymous';
      
      // Attempt to ensure sample script exists
      const created = await ensureSampleScriptExists(user.id, userName);
      setIsSeeding(false);
      
      // Fetch scripts (if we just created one, this will catch it)
      fetchScripts();
    };

    initializeDashboard();
  }, [user, fetchScripts]);

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
    const { error } = await supabase
      .from('scripts')
      .update({ title: newTitle, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setScripts(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('scripts').delete().eq('id', id);
    if (!error) {
      setScripts(prev => prev.filter(s => s.id !== id));
    }
  };

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
            </header>

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
                  <TabsTrigger value="ai-rules" className="gap-2">
                    <Settings className="h-4 w-4" />
                    AI Rule Engine
                  </TabsTrigger>
                </TabsList>
              </div>
              
              {activeTab === "ai-rules" ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <RuleAccessControl />
                      <RuleValidation />
                    </div>
                    <div>
                      {selectedRuleId && (
                        <RuleVersioning
                          ruleId={selectedRuleId}
                          onRevert={(content) => console.log("Reverted to:", content)}
                        />
                      )}
                      
                      <Card className="mt-6 border-primary/20 bg-primary/5">
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-primary" />
                            <CardTitle>Architecture Status</CardTitle>
                          </div>
                          <CardDescription>SaaS-enhanced security and reliability monitoring.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Rule Hardening</span>
                            <span className="text-green-500 font-medium">ENABLED</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Hallucination Filter</span>
                            <span className="text-green-500 font-medium">ACTIVE</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Audit Logging</span>
                            <span className="text-green-500 font-medium">SYNCHRONIZED</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {(loading || isSeeding) ? (

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <ScriptCardSkeleton key={i} />
                      ))}
                    </div>
                  ) : filteredScripts.length > 0 ? (
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
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl bg-muted/10">
                      <SearchX className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No scripts found</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        Click "Create New" to start your first screenplay.
                      </p>
                    </div>
                  )}
                </>
              )}
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;