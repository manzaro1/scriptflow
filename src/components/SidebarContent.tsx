"use client";

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Star,
  Clock,
  Archive,
  FolderOpen,
  ClipboardList,
  FileSearch,
  Wand2
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface SidebarContentProps {
  onItemClick?: () => void;
}

const SidebarContent = ({ onItemClick }: SidebarContentProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'My Scripts', path: '/dashboard' },
    { icon: FileSearch, label: 'Scene Breakdown', path: '/breakdown' },
    { icon: Wand2, label: 'Storyboard', path: '/storyboard' },
    { icon: ClipboardList, label: 'Call Sheets', path: '/call-sheet' },
    { icon: Star, label: 'Favorites', path: '/dashboard' },
    { icon: Users, label: 'Collaborations', path: '/profile' },
    { icon: FolderOpen, label: 'Projects', path: '/dashboard' },
  ];

  const isActive = (path: string) => {
    if (path === '/storyboard') {
      return location.pathname.startsWith('/storyboard');
    }
    return location.pathname === path;
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    if (onItemClick) onItemClick();
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="space-y-1">
        <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3">Main Menu</p>
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => handleNavigate(item.path)}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-200 relative group",
              isActive(item.path)
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {/* Animated active indicator bar */}
            {isActive(item.path) && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full" />
            )}
            <item.icon size={18} className={isActive(item.path) ? "text-primary" : "group-hover:text-foreground"} />
            {item.label}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3">Library</p>
        <button
          onClick={() => handleNavigate('/dashboard')}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
        >
          <Clock size={18} />
          Recent
        </button>
        <button
          onClick={() => handleNavigate('/dashboard')}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
        >
          <Archive size={18} />
          Archive
        </button>
      </div>

      <div className="mt-auto pt-6 border-t">
        <button
          onClick={() => handleNavigate('/profile')}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-200 relative",
            isActive('/profile') ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {isActive('/profile') && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full" />
          )}
          <Settings size={18} />
          Settings
        </button>
      </div>
    </div>
  );
};

export default SidebarContent;
