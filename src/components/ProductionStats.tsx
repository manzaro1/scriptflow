"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Clock, CheckCircle2 } from 'lucide-react';

const stats = [
  { label: 'Total Scripts', value: '12', icon: FileText, color: 'text-blue-600' },
  { label: 'Collaborators', value: '5', icon: Users, color: 'text-purple-600' },
  { label: 'Total Pages', value: '428', icon: Clock, color: 'text-orange-600' },
  { label: 'Finished', value: '3', icon: CheckCircle2, color: 'text-green-600' },
];

const ProductionStats = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">{stat.label}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProductionStats;