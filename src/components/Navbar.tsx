"use client";

import React from 'react';
import { Film, Search, Bell, User, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Navbar = () => {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex h-16 items-center px-6 gap-4">
        <div className="flex items-center gap-2 font-bold text-xl mr-8">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
            <Film size={20} />
          </div>
          <span>ScriptFlow</span>
        </div>
        
        <div className="flex-1 flex items-center max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search scripts, scenes, characters..." 
            className="pl-10 bg-muted/50 border-none focus-visible:ring-1"
          />
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <Button variant="ghost" size="icon">
            <Bell size={20} />
          </Button>
          <Button variant="outline" className="hidden sm:flex items-center gap-2">
            <Plus size={18} />
            New Script
          </Button>
          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center border">
            <User size={18} className="text-secondary-foreground" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;