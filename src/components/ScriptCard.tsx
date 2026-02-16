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
  Edit2,
  ClipboardList,
  FileSearch
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
import { motion } from "framer-motion";

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

const genreGradients: Record<string, string> = {
  'Sci-Fi': 'from-cyan-500 to-blue-600',
  'Drama': 'from-purple-500 to-violet-600',
  'Thriller': 'from-red-500 to-orange-600',
  'Comedy': 'from-yellow-400 to-amber-500',
  'Horror': 'from-red-700 to-rose-900',
  'Action': 'from-orange-500 to-red-600',
  'Romance': 'from-pink-500 to-rose-500',
  'Fantasy': 'from-indigo-500 to-purple-600',
};

const statusStyles: Record<string, string> = {
  'Draft': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  'Final': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  'In Progress': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  'Archived': 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800',
};

const ScriptCard = ({ id, title, author, status, lastModified, genre, onRename, onDelete }: ScriptCardProps) => {
  const navigate = useNavigate();
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

  const handleAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    if (action === 'Deleting' && onDelete) {
      onDelete(id);
    } else {
      showSuccess(`${action}ing "${title}"...`);
    }
  };

  const navigateToEditor = () => {
    navigate(`/editor?id=${id}`);
  };

  const navigateToCallSheet = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/call-sheet?script=${id}`);
  };

  const navigateToBreakdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/breakdown?script=${id}`);
  };

  const gradient = genreGradients[genre] || 'from-primary to-purple-600';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden"
          onClick={navigateToEditor}
        >
          {/* Genre-specific color strip */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />

          <CardHeader className="pb-3 pt-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <CardTitle className="text-lg group-hover:text-primary transition-colors">{title}</CardTitle>
                <CardDescription>by {author}</CardDescription>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={navigateToEditor}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Editor
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={navigateToBreakdown}>
                    <FileSearch className="mr-2 h-4 w-4" />
                    Scene Breakdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={navigateToCallSheet}>
                    <ClipboardList className="mr-2 h-4 w-4" />
                    View Call Sheet
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsRenameModalOpen(true); }}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Rename
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
              <Badge className={`font-normal border ${statusStyles[status] || statusStyles['In Progress']}`} variant="outline">
                {status}
              </Badge>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span>Modified {lastModified}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-0 flex justify-end">
            <div className="flex gap-2">
              <Button variant="link" size="sm" className="px-0 h-auto text-xs" onClick={navigateToBreakdown}>Breakdown</Button>
              <span className="text-muted-foreground/30">·</span>
              <Button variant="link" size="sm" className="px-0 h-auto text-xs" onClick={navigateToEditor}>Editor</Button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>

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
