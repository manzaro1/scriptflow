"use client";

import React, { useState, useMemo } from 'react';
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ScriptCard from "@/components/ScriptCard";
import NewScriptModal from "@/components/NewScriptModal";
import ProductionStats from "@/components/ProductionStats";
import OnboardingTour from "@/components/OnboardingTour";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter, Plus, SearchX } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ALL_SCRIPTS = [
  {
    title: "The Neon Horizon",
    author: "Alex Rivers",
    status: "In Progress" as const,
    lastModified: "2 hours ago",
    genre: "Sci-Fi",
    category: "recent"
  },
  {
    title: "Silent Echoes",
    author: "Alex Rivers",
    status: "Draft" as const,
    lastModified: "1 day ago",
    genre: "Thriller",
    category: "recent"
  },
  {
    title: "Midnight in Paris",
    author: "Sarah Chen",
    status: "Final" as const,
    lastModified: "1 week ago",
    genre: "Romance",
    category: "shared"
  },
  {
    title: "Deep Space 9",
    author: "Alex Rivers",
    status: "Draft" as const,
    lastModified: "2 weeks ago",
    genre: "Sci-Fi",
    category: "archived"
  },
  {
    title: "The Last Heist",
    author: "John Doe",
    status: "In Progress" as const,
    lastModified: "3 days ago",
    genre: "Action",
    category: "shared"
  }
];

const Index = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [genreFilter, setGenreFilter] = useState("all");

  const filteredScripts = useMemo(() => {
    return ALL_SCRIPTS.filter(script => {
      const matchesTab = activeTab === "all" || script.category === activeTab;
      const matchesGenre = genreFilter === "all" || script.genre === genreFilter;
      return matchesTab && matchesGenre;
    });
  }, [activeTab, genreFilter]);

  const genres = ["all", ...new Set(ALL_SCRIPTS.map(s => s.genre))];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <OnboardingTour />
      <Navbar />
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
                  <NewScriptModal />
                </div>
              </div>
            </header>

            <div className="tour-stats">
              <ProductionStats />
            </div>

            <Tabs defaultValue="all" className="w-full tour-tabs" onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="all">All Scripts</TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="shared">Shared</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
              </TabsList>
              
              {filteredScripts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredScripts.map((script, index) => (
                    <ScriptCard key={index} {...script} />
                  ))}
                  
                  {activeTab === 'all' && (
                    <NewScriptModal>
                      <button className="border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 text-muted-foreground hover:text-primary hover:border-primary transition-all group min-h-[200px]">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3 group-hover:bg-primary/10">
                          <Plus className="group-hover:text-primary" />
                        </div>
                        <span className="font-medium text-sm">Add New Script</span>
                      </button>
                    </NewScriptModal>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl bg-muted/10">
                  <SearchX className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No scripts found</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    Try adjusting your filters or tabs to find what you're looking for.
                  </p>
                  <Button variant="link" onClick={() => { setGenreFilter('all'); setActiveTab('all'); }} className="mt-2">
                    Clear all filters
                  </Button>
                </div>
              )}
            </Tabs>

            <section className="space-y-4 pt-4">
              <h2 className="text-xl font-semibold">Ready for Production</h2>
              <div className="bg-muted/30 border rounded-xl p-8 flex flex-col items-center justify-center text-center">
                <div className="bg-primary/10 text-primary p-3 rounded-full mb-4">
                  <Plus size={24} />
                </div>
                <h3 className="font-medium">No scripts marked as final yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  Once you finish a draft and mark it as 'Final', it will appear here for easy production access.
                </p>
                <Button variant="outline" className="mt-4" size="sm">Browse Scripts</Button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;