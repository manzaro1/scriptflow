"use client";

import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

const CollaboratorStack = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user);
    });
  }, []);

  if (!user) return null;

  const initials = user.email?.substring(0, 2).toUpperCase() || '??';

  return (
    <div className="flex -space-x-2 overflow-hidden items-center px-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative group cursor-pointer">
              <Avatar className="h-7 w-7 border-2 border-background ring-2 ring-primary/30 transition-all">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 h-2 w-2 bg-green-500 rounded-full border border-white" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px] font-bold py-1 px-2">
            <p>{user.email} (You)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <div className="ml-4 h-6 w-px bg-border" />
    </div>
  );
};

export default CollaboratorStack;