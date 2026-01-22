"use client";

import React from 'react';
import { Briefcase, MapPin, Clock, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const JOBS = [
  { title: "Senior AI Researcher", location: "Remote / LA", type: "Full-time", department: "Engineering" },
  { title: "Product Designer", location: "Remote", type: "Full-time", department: "Design" },
  { title: "Technical Writer", location: "London / Remote", type: "Contract", department: "Content" },
  { title: "Community Manager", location: "Remote", type: "Full-time", department: "Marketing" },
];

const Careers = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <header className="text-center space-y-6 mb-20">
          <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary">
            Join the Revolution
          </Badge>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight">Build the Future of Cinema.</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We're looking for passionate individuals to help us redefine the screenwriting and production landscape.
          </p>
        </header>

        <div className="space-y-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Briefcase className="text-primary" />
            Open Positions
          </h2>
          <div className="grid gap-4">
            {JOBS.map((job) => (
              <div key={job.title} className="group border rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between hover:border-primary/50 hover:bg-muted/20 transition-all cursor-pointer">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">{job.department}</p>
                  <h3 className="text-xl font-bold">{job.title}</h3>
                  <div className="flex gap-4 text-sm text-muted-foreground pt-1">
                    <span className="flex items-center gap-1.5"><MapPin size={14} /> {job.location}</span>
                    <span className="flex items-center gap-1.5"><Clock size={14} /> {job.type}</span>
                  </div>
                </div>
                <Button variant="ghost" className="mt-4 md:mt-0 group-hover:translate-x-1 transition-transform gap-2">
                  Apply Now
                  <ArrowRight size={16} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Careers;