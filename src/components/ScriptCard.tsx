"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  FileText, 
  MoreVertical, 
  Trash2, 
  Copy, 
  Share2,
  ExternalLink,
  Edit2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { showSuccess } from "@/utils/toast";
import RenameScriptModal from "./RenameScriptModal";

interface ScriptCardProps {
  id: string;
  title: string;
  author: string;
  status: 'Draft' | 'Final' | 'In Progress';
  lastModified: string;
  genre: string;
  onRename?: (id: string, newTitle: string) => void;
  onDelete?: (id: string) => void;
}

const ScriptCard = ({ id, title, author, status, lastModified, genre, onRename, onDelete }: ScriptCardProps) => {
  const navigate = useNavigate();
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  
  const statusColors = {
    'Draft': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Final': 'bg-green-100 text-green-800 border-green-200',
    'In Progress': 'bg-blue-100 text-blue-800 border-blue-200'
  };

  const handleAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    if (action === 'Deleting' && onDelete) {
      onDelete(id);
    } else {
      showSuccess(`${action}ing "${title}"...`);
    }
  };

  return (
    <>
      <Card 
        className="hover:shadow-md transition-shadow cursor-pointer group relative"
        onClick={() => navigate('/editor')}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-lg group-hover:text-primary transition-colors">{title}</CardTitle>
              <CardDescription>by {author}</CardDescription>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                >
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/editor')}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Editor
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsRenameModalOpen(true); }}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => handleAction(e as any, 'Duplicating')}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => handleAction(e as any, 'Sharing')}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => handleAction(e as any, 'Deleting')}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap mb-4">
            <Badge variant="secondary" className="font-normal">{genre}</Badge>
            <Badge className={`font-normal border ${statusColors[status]}`} variant="outline">
              {status}
            </Badge>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar size={14} />
              <span>Modified {lastModified}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span>120 pages</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0 flex justify-between">
          <div className="flex items-center text-xs text-muted-foreground">
            <FileText size={12} className="mr-1" />
            PDF, DOCX
          </div>
          <Button variant="link" size="sm" className="px-0 h-auto">Open Editor</Button>
        </CardFooter>
      </Card>

      <RenameScriptModal 
        isOpen={isRenameModalOpen}
        onOpenChange={setIsRenameModalOpen}
        currentTitle={title}
        onRename={(newTitle) => onRename?.(id, newTitle)}
      />
    </>
  );
};

export default ScriptCard;