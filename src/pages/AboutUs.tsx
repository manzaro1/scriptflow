"use client";

import React from 'react';
import { Film, Sparkles, Target, Heart } from 'lucide-react';
import Navbar from "@/components/Navbar";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="space-y-12">
          <header className="text-center space-y-4">
            <div className="bg-primary/10 text-primary w-16 h-16 flex items-center justify-center rounded-2xl mx-auto mb-6">
              <Film size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">Our Story</h1>
            <p className="text-xl text-muted-foreground">
              Empowering visionaries to bridge the gap between imagination and production.
            </p>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-primary font-bold uppercase tracking-wider text-sm">
                <Target size={18} />
                Our Mission
              </div>
              <p className="text-muted-foreground leading-relaxed">
                ScriptFlow was born out of a simple observation: the gap between writing a screenplay and actually shooting it is too wide. We built this platform to give writers the tools of a production designer and a cinematographer, all powered by intelligent AI.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-purple-600 font-bold uppercase tracking-wider text-sm">
                <Sparkles size={18} />
                Our Vision
              </div>
              <p className="text-muted-foreground leading-relaxed">
                We envision a future where every creator, regardless of budget, has access to world-class production intelligence. By automating the technical overhead, we allow storytellers to focus on what matters most: the story.
              </p>
            </div>
          </section>

          <section className="bg-muted/30 border rounded-3xl p-12 text-center space-y-6">
            <Heart className="mx-auto text-red-500 fill-red-500" size={32} />
            <h2 className="text-2xl font-bold">Built for Creators, by Creators</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our team consists of filmmakers, developers, and AI researchers who are passionate about the intersection of technology and art. We're based in Los Angeles, but our community is global.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;