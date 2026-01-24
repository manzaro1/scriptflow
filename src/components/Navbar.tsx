"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Search, Bell, User, Plus, Menu } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NewScriptModal from "./NewScriptModal";
import { ModeToggle } from "./ModeToggle";
import SidebarContent from "./SidebarContent";
import { useAuth } from "@/hooks/use-auth";
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
  const { isAuthenticated, user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      showSuccess("Logged out successfully");
      navigate('/');
    } catch (error: any) {
      showError(error.message || "Failed to log out");
    }
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex h-16 items-center px-4 md:px-6 gap-2 md:gap-4">
        {/* Mobile Menu Trigger - only if authenticated */}
        {isAuthenticated && (
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
        )}

        <div 
          className="flex items-center gap-2 font-bold text-lg md:text-xl md:mr-8 cursor-pointer shrink-0" 
          onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
        >
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-lg">
            <Film size={20} />
          </div>
          <span className="hidden xs:inline">ScriptFlow</span>
        </div>
        
        <div className="flex-1 flex items-center max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search scripts..." 
            className="pl-10 bg-muted/50 border-none focus-visible:ring-1 h-9 md:h-10"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1 md:gap-4 ml-auto">
          <div className="hidden sm:block">
            <ModeToggle />
          </div>
          
          {isAuthenticated ? (
            <>
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
                        {user?.user_metadata?.avatar_url ? (
                          <img src={user.user_metadata.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          <User size={18} className="text-secondary-foreground" />
                        )}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.user_metadata?.first_name || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      Profile & Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <Button size="sm" onClick={() => navigate('/auth')}>Sign In</Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;