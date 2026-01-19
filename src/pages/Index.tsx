"use client";

import React from 'react';
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ScriptCard from "@/components/ScriptCard";
import NewScriptModal from "@/components/NewScriptModal";
import ProductionStats from "@/components/ProductionStats";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter, Plus } from 'lucide-react';

const Index = () => {
  const scripts = [
    {
      title: "The Neon Horizon",
      author: "Alex Rivers",
      status: "In Progress" as const,
      lastModified: "2 hours ago",
      genre: "Sci-Fi"
    },
    {
      title: "Silent Echoes",
      author: "Alex Rivers",
      status: "Draft" as const,
      lastModified: "1 day ago",
      genre: "Thriller"
    },
    {
      title: "Midnight in Paris",
      author: "Alex Rivers",
      status: "Final" as const,
      lastModified: "1 week ago",
      genre: "Romance"
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Script Library</h1>
                <p className="text-muted-foreground mt-1">Manage and edit your screenplays in one place.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter size={16} />
                  Filter
                </Button>
                <NewScriptModal />
              </div>
            </header>

            <ProductionStats />

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="all">All Scripts</TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="shared">Shared</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
              </TabsList>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scripts.map((script, index) => (
                  <ScriptCard key={index} {...script} />
                ))}
                
                <NewScriptModal>
                  <button className="border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 text-muted-foreground hover:text-primary hover:border-primary transition-all group min-h-[200px]">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3 group-hover:bg-primary/10">
                      <Plus className="group-hover:text-primary" />
                    </div>
                    <span className="font-medium text-sm">Add New Script</span>
                  </button>
                </NewScriptModal>
              </div>
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