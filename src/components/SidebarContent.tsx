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
  FileSearch
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
    { icon: ClipboardList, label: 'Call Sheets', path: '/call-sheet' },
    { icon: Star, label: 'Favorites', path: '/dashboard' },
    { icon: Users, label: 'Collaborations', path: '/profile' },
    { icon: FolderOpen, label: 'Projects', path: '/dashboard' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleNavigate = (path: string) => {
    navigate(path);
    if (onItemClick) onItemClick();
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="space-y-1">
        <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Main Menu</p>
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => handleNavigate(item.path)}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors",
              isActive(item.path)
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
        <button 
          onClick={() => handleNavigate('/dashboard')}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Clock size={18} />
          Recent
        </button>
        <button 
          onClick={() => handleNavigate('/dashboard')}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Archive size={18} />
          Archive
        </button>
      </div>

      <div className="mt-auto pt-6 border-t">
        <button 
          onClick={() => handleNavigate('/profile')}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors",
            isActive('/profile') ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Settings size={18} />
          Settings
        </button>
      </div>
    </div>
  );
};

export default SidebarContent;