"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, FileText, MoreVertical } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface ScriptCardProps {
  title: string;
  author: string;
  status: 'Draft' | 'Final' | 'In Progress';
  lastModified: string;
  genre: string;
}

const ScriptCard = ({ title, author, status, lastModified, genre }: ScriptCardProps) => {
  const statusColors = {
    'Draft': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Final': 'bg-green-100 text-green-800 border-green-200',
    'In Progress': 'bg-blue-100 text-blue-800 border-blue-200'
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg group-hover:text-primary transition-colors">{title}</CardTitle>
            <CardDescription>by {author}</CardDescription>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical size={16} />
          </Button>
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
  );
};

export default ScriptCard;