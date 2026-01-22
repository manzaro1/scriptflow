"use client";

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  color: string;
}

const MOCK_COLLABORATORS: Collaborator[] = [
  { id: '1', name: 'John Director', color: 'bg-blue-500', avatar: 'https://i.pravatar.cc/150?u=john' },
  { id: '2', name: 'Sarah Producer', color: 'bg-green-500', avatar: 'https://i.pravatar.cc/150?u=sarah' },
  { id: '3', name: 'Mike Intern', color: 'bg-orange-500' },
];

const CollaboratorStack = () => {
  return (
    <div className="flex -space-x-2 overflow-hidden items-center px-2">
      <TooltipProvider>
        {MOCK_COLLABORATORS.map((user) => (
          <Tooltip key={user.id}>
            <TooltipTrigger asChild>
              <div className="relative group cursor-pointer">
                <Avatar className="h-7 w-7 border-2 border-background ring-2 ring-transparent group-hover:ring-primary/30 transition-all">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className={`${user.color} text-white text-[10px] font-bold`}>
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 h-2 w-2 bg-green-500 rounded-full border border-white" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px] font-bold py-1 px-2">
              <p>{user.name} is viewing</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
      
      <div className="ml-4 h-6 w-px bg-border" />
    </div>
  );
};

export default CollaboratorStack;