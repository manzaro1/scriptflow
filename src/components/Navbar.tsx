"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Search, Bell, User, Plus, Menu } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NewScriptModal from "./NewScriptModal";
import { ModeToggle } from "./ModeToggle";
import SidebarContent from "./SidebarContent";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { showSuccess, showError } from "@/utils/toast";

interface NavbarProps {
  onSearch?: (query: string) => void;
}

const Navbar = ({ onSearch }: NavbarProps) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('isAuthenticated');
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      showSuccess("Logged out successfully");
    } catch (error: any) {
      showError(error.message || "Failed to log out");
    }
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex h-16 items-center px-4 md:px-6 gap-2 md:gap-4">
        {/* Mobile Menu Trigger */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-4">
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center gap-2">
                  <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
                    <Film size={18} />
                  </div>
                  ScriptFlow
                </SheetTitle>
              </SheetHeader>
              <SidebarContent onItemClick={() => setIsMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        <div 
          className="flex items-center gap-2 font-bold text-lg md:text-xl md:mr-8 cursor-pointer shrink-0" 
          onClick={() => navigate('/dashboard')}
        >
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-lg">
            <Film size={20} />
          </div>
          <span className="hidden xs:inline">ScriptFlow</span>
        </div>
        
        <div className="flex-1 flex items-center max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search scripts by title or author..." 
            className="pl-10 bg-muted/50 border-none focus-visible:ring-1 h-9 md:h-10"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1 md:gap-4 ml-auto">
          <div className="hidden sm:block">
            <ModeToggle />
          </div>
          
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Bell size={20} />
          </Button>
          
          <div className="tour-new-script hidden xs:block">
            <NewScriptModal>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus size={16} />
                <span className="hidden lg:inline">New Script</span>
              </Button>
            </NewScriptModal>
          </div>
          
          <div className="tour-profile">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 rounded-full p-0 border">
                  <div className="h-full w-full rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                    <User size={18} className="text-secondary-foreground" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  Profile & Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="sm:hidden">
                  <div className="flex items-center justify-between w-full">
                    <span>Theme</span>
                    <ModeToggle />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;