"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Film, 
  Sparkles, 
  BrainCircuit, 
  Zap, 
  CheckCircle2, 
  Users, 
  ArrowRight,
  ShieldCheck,
  Globe,
  Star
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020817] text-slate-900 dark:text-slate-50 selection:bg-primary selection:text-primary-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-lg">
              <Film size={22} />
            </div>
            <span className="tracking-tight">ScriptFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#ai" className="hover:text-primary transition-colors">AI Intelligence</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>Login</Button>
            <Button onClick={() => navigate('/dashboard')} className="shadow-md">Get Started Free</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border-primary/20 animate-fade-in">
              The Future of Screenwriting is Here
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] text-slate-900 dark:text-white">
              Don't just write. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Architect Production.</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              The world's first AI-integrated scriptwriting platform that transforms your narrative into technical blueprints, storyboards, and production intelligence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button size="lg" className="h-14 px-8 text-lg font-bold gap-2 shadow-xl shadow-primary/20" onClick={() => navigate('/dashboard')}>
                Start Writing for Free
                <ArrowRight size={20} />
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold">
                Watch Demo
              </Button>
            </div>
            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-green-500" />
                No Credit Card Required
              </div>
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-blue-500" />
                Collaborate Anywhere
              </div>
            </div>
          </div>

          {/* Editor Preview */}
          <div className="mt-20 relative max-w-5xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-20" />
            <div className="relative bg-background border rounded-2xl shadow-2xl overflow-hidden aspect-[16/10]">
              <div className="bg-muted/50 border-b p-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="mx-auto bg-background px-4 py-1 rounded text-[10px] font-mono text-muted-foreground">scriptflow.app/editor/neon-horizon</div>
              </div>
              <div className="p-12 font-['Courier_Prime',monospace] text-slate-800 dark:text-slate-200">
                <p className="uppercase font-bold mb-8">EXT. SKYLINE - NIGHT</p>
                <p className="mb-4">Rain hammers against the metallic skin of the city. Neon signs flicker in shades of bruised purple and electric cyan.</p>
                <div className="text-center w-[50%] mx-auto mb-1 mt-6 font-bold">KAI</div>
                <p className="text-center w-[65%] mx-auto mb-4">This wasn't part of the deal. We had an agreement.</p>
                <p className="mb-4">Kai pulls a small, glowing COIL from his pocket. It pulses with a rhythmic, golden light.</p>
              </div>
              {/* Floating AI UI overlay */}
              <div className="absolute right-8 top-32 w-64 bg-background/95 backdrop-blur border rounded-xl shadow-2xl p-4 space-y-3 animate-bounce-subtle">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <Sparkles size={14} />
                  AI Intelligence
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  "KAI's dialogue in this scene is 92% consistent with established Persona DNA. Suggesting more aggressive tone for Scene 14."
                </p>
                <div className="h-1 bg-primary/20 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[92%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Tools for the Modern Visionary</h2>
            <p className="text-muted-foreground">Beyond text editing. We've built an engine that understands your story and prepares it for the lens.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-slate-50/50 dark:bg-[#020817] border-none shadow-none hover:translate-y-[-4px] transition-transform">
              <CardHeader>
                <div className="bg-primary/10 text-primary w-12 h-12 flex items-center justify-center rounded-xl mb-4">
                  <BrainCircuit size={24} />
                </div>
                <CardTitle>Character DNA Sync</CardTitle>
                <CardDescription className="text-sm">Define deep character profiles. Our AI monitors every line of dialogue to ensure behavioral consistency across your entire draft.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-slate-50/50 dark:bg-[#020817] border-none shadow-none hover:translate-y-[-4px] transition-transform">
              <CardHeader>
                <div className="bg-purple-500/10 text-purple-600 w-12 h-12 flex items-center justify-center rounded-xl mb-4">
                  <Sparkles size={24} />
                </div>
                <CardTitle>AI Storyboard Engine</CardTitle>
                <CardDescription className="text-sm">Instantly convert your action lines into high-fidelity cinematic blueprints. Visualize your lighting, camera angles, and color palettes.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-slate-50/50 dark:bg-[#020817] border-none shadow-none hover:translate-y-[-4px] transition-transform">
              <CardHeader>
                <div className="bg-orange-500/10 text-orange-600 w-12 h-12 flex items-center justify-center rounded-xl mb-4">
                  <Zap size={24} />
                </div>
                <CardTitle>Live Production Sheets</CardTitle>
                <CardDescription className="text-sm">Generate industry-standard call sheets that update in real-time. Sync weather data via AI and manage your crew calls effortlessly.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground">Start for free and upgrade as your production scales.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Free Tier */}
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl">Hobbyist</CardTitle>
                <CardDescription>Perfect for starting your journey.</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-black">$0</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {[
                    "1 Active Script Project",
                    "Standard Script Editor",
                    "Basic Call Sheets",
                    "PDF Export"
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 size={16} className="text-green-500" />
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full h-11" onClick={() => navigate('/dashboard')}>Get Started</Button>
              </CardFooter>
            </Card>

            {/* Pro Tier */}
            <Card className="border-primary border-2 shadow-2xl scale-105 z-10 bg-background relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-primary text-primary-foreground px-4 py-1 text-[10px] font-black uppercase tracking-widest">Most Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  Production Pro
                  <Star size={16} className="text-yellow-500 fill-yellow-500" />
                </CardTitle>
                <CardDescription>Everything needed for serious creators.</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-black">$19</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {[
                    "Unlimited Projects",
                    "AI Character DNA Intelligence",
                    "AI Storyboard Generation (50/mo)",
                    "Pro Production Blueprint Export",
                    "Advanced Collaboration Tools",
                    "Custom Watermarking"
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 size={16} className="text-primary font-bold" />
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full h-11 font-bold shadow-lg shadow-primary/20" onClick={() => navigate('/dashboard')}>Go Pro Now</Button>
              </CardFooter>
            </Card>

            {/* Studio Tier */}
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl">Studio</CardTitle>
                <CardDescription>For full production houses.</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-black">$49</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {[
                    "Everything in Pro",
                    "Unlimited AI Storyboarding",
                    "Dedicated Production Overseer",
                    "Team Permissions Management",
                    "Priority Technical Support",
                    "SSO & API Access"
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 size={16} className="text-green-500" />
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full h-11" onClick={() => navigate('/dashboard')}>Contact Sales</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t bg-slate-50 dark:bg-[#020817]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-lg">
              <Film size={20} className="text-primary" />
              <span>ScriptFlow</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Empowering the next generation of filmmakers with production intelligence and AI-driven narrative tools.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-sm">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Editor</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">AI Storyboard</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Call Sheets</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-sm">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-sm">Join the Newsletter</h4>
            <div className="flex gap-2">
              <input type="email" placeholder="email@example.com" className="bg-background border rounded px-3 py-2 text-sm w-full outline-none focus:ring-1 ring-primary" />
              <Button size="sm">Join</Button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-12 mt-12 border-t text-center text-xs text-muted-foreground">
          © 2024 ScriptFlow AI. All rights reserved. Made for visionaries.
        </div>
      </footer>
    </div>
  );
};

export default Landing;