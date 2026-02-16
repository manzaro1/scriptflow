"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Clock, CheckCircle2 } from 'lucide-react';
import { motion } from "framer-motion";

interface ProductionStatsProps {
  totalScripts: number;
  totalFinished: number;
  totalCollaborators?: number;
  totalPages?: number;
}

const ProductionStats = ({
  totalScripts = 0,
  totalFinished = 0,
  totalCollaborators = 5,
  totalPages = 0
}: ProductionStatsProps) => {
  const stats = [
    { label: 'Total Scripts', value: totalScripts.toString(), icon: FileText, color: 'text-blue-600', accent: 'bg-blue-500', bgIcon: 'bg-blue-500/10' },
    { label: 'Collaborators', value: totalCollaborators.toString(), icon: Users, color: 'text-purple-600', accent: 'bg-purple-500', bgIcon: 'bg-purple-500/10' },
    { label: 'Total Pages', value: totalPages > 0 ? totalPages.toString() : '--', icon: Clock, color: 'text-amber-600', accent: 'bg-amber-500', bgIcon: 'bg-amber-500/10' },
    { label: 'Finished', value: totalFinished.toString(), icon: CheckCircle2, color: 'text-green-600', accent: 'bg-green-500', bgIcon: 'bg-green-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
        >
          <Card className="relative overflow-hidden">
            {/* Color-coded top accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${stat.accent}`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
              <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</CardTitle>
              <div className={`h-9 w-9 rounded-lg ${stat.bgIcon} flex items-center justify-center`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight">{stat.value}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default ProductionStats;
