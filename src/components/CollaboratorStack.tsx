"use client";

import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";

interface CollaboratorStackProps {
  scriptId?: string;
}

const CollaboratorStack = ({ scriptId }: CollaboratorStackProps) => {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<any[]>([]);

  useEffect(() => {
    if (scriptId) {
      api.getScriptCollaborators(scriptId)
        .then(setCollaborators)
        .catch(() => {});
    }
  }, [scriptId]);

  if (!user) return null;

  const initials = user.email?.substring(0, 2).toUpperCase() || '??';

  return (
    <div className="flex -space-x-2 overflow-hidden items-center px-2">
      <TooltipProvider>
        {/* Current user */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative group cursor-pointer">
              <Avatar className="h-7 w-7 border-2 border-background ring-2 ring-primary/30 transition-all">
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

        {/* Collaborators */}
        {collaborators.map((collab) => {
          const collabInitials = collab.email?.substring(0, 2).toUpperCase() || '??';
          return (
            <Tooltip key={collab.id}>
              <TooltipTrigger asChild>
                <div className="relative group cursor-pointer">
                  <Avatar className="h-7 w-7 border-2 border-background transition-all">
                    <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-bold">
                      {collabInitials}
                    </AvatarFallback>
                  </Avatar>
                  {collab.status === 'active' && (
                    <div className="absolute bottom-0 right-0 h-2 w-2 bg-green-500 rounded-full border border-white" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px] font-bold py-1 px-2">
                <p>{collab.email} ({collab.role})</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>

      {collaborators.length > 0 && <div className="ml-4 h-6 w-px bg-border" />}
    </div>
  );
};

export default CollaboratorStack;
