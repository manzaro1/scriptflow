"use client";

import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  Star, 
  Clock, 
  Archive,
  FolderOpen
} from 'lucide-react';
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: FileText, label: 'My Scripts' },
  { icon: Star, label: 'Favorites' },
  { icon: Users, label: 'Collaborations' },
  { icon: FolderOpen, label: 'Projects' },
];

const Sidebar = () => {
  return (
    <div className="w-64 border-r h-[calc(100vh-64px)] hidden md:flex flex-col p-4 gap-6 bg-muted/20">
      <div className="space-y-1">
        <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Main Menu</p>
        {menuItems.map((item) => (
          <button
            key={item.label}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors",
              item.active 
                ? "bg-primary text-primary-foreground font-medium" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Library</p>
        <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Clock size={18} />
          Recent
        </button>
        <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Archive size={18} />
          Archive
        </button>
      </div>

      <div className="mt-auto pt-6 border-t">
        <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Settings size={18} />
          Settings
        </button>
      </div>
    </div>
  );
};

export default Sidebar;