"use client";

import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const ScriptCardSkeleton = () => {
  return (
    <Card className="h-[200px] relative overflow-hidden bg-muted/10">
      {/* Shimmer strip */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer" />
      <CardHeader className="pb-3 pt-5">
        <div className="flex justify-between items-start">
          <div className="space-y-2.5">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 flex-wrap mb-4">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScriptCardSkeleton;
