"use client";

import React, { useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { useAuth } from "@/hooks/use-auth";
import { motion, useInView } from "framer-motion";
import { Loader2 } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

function AnimatedSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  const handleProductClick = (path: string) => {
    if (isAuthenticated) {
      navigate(path);
    } else {
      navigate('/auth');
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-50 selection:bg-primary selection:text-primary-foreground font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-bold text-xl">
            <div className="bg-gradient-to-br from-primary to-purple-600 text-white p-1.5 rounded-lg shadow-lg shadow-primary/25">
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
            {isAuthenticated ? (
              <Button onClick={() => navigate('/dashboard')} className="shadow-md shadow-primary/20">Go to Dashboard</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/auth')}>Login</Button>
                <Button onClick={() => navigate('/auth')} className="shadow-md shadow-primary/20">Get Started Free</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Multi-gradient cinematic background blobs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/8 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-purple-600/8 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative">
          <motion.div
            className="text-center max-w-3xl mx-auto space-y-6"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
              <Badge variant="secondary" className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border-primary/20">
                The Future of Screenwriting is Here
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-7xl font-black tracking-tight leading-[1.08]"
            >
              Don't just write. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-fuchsia-500">
                Architect Production.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="text-xl text-muted-foreground leading-relaxed"
            >
              The world's first AI-integrated scriptwriting platform that transforms your narrative into technical blueprints, storyboards, and production intelligence.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Button
                size="lg"
                className="h-14 px-8 text-lg font-bold gap-2 shadow-xl shadow-primary/25 relative overflow-hidden group"
                onClick={() => handleProductClick('/dashboard')}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isAuthenticated ? 'Open Dashboard' : 'Start Writing for Free'}
                  <ArrowRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-shimmer animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-green-500" />
                No Credit Card Required
              </div>
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-blue-500" />
                Collaborate Anywhere
              </div>
            </motion.div>
          </motion.div>

          {/* Editor Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-20 relative max-w-5xl mx-auto"
          >
            <div className="absolute -inset-1.5 bg-gradient-to-r from-primary via-purple-500 to-fuchsia-500 rounded-2xl blur opacity-20" />
            <div className="relative bg-background border rounded-2xl shadow-2xl overflow-hidden aspect-[16/10]">
              <div className="bg-muted/50 border-b p-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="mx-auto bg-background px-4 py-1 rounded-full text-[10px] font-mono text-muted-foreground border">scriptflow.app/editor/the-final-blueprints</div>
              </div>
              <div className="p-12 font-screenplay text-slate-800 dark:text-slate-200">
                <p className="uppercase font-bold mb-8">EXT. ABANDONED OBSERVATORY - DAWN</p>
                <p className="mb-4">Snow drifts through the shattered dome. Below, the sirens of the Search Teams wail, closer than before.</p>
                <div className="text-center w-[50%] mx-auto mb-1 mt-6 font-bold">ELARA</div>
                <p className="text-center w-[65%] mx-auto mb-1 italic text-sm">(breathless)</p>
                <p className="text-center w-[65%] mx-auto mb-4">Go, Jax. They're nearly at the perimeter. Save yourself.</p>
                <p className="mb-4">Jax reaches out, his hand trembling as he brushes a stray lock of hair from her face. His eyes are fierce, desperate.</p>
                <div className="text-center w-[50%] mx-auto mb-1 mt-6 font-bold">JAX</div>
                <p className="text-center w-[65%] mx-auto mb-4">
                  I didn't come back for the blueprints, Elara. I came back for you.
                  <span className="inline-block w-[2px] h-[1em] bg-primary ml-1 animate-typewriter-cursor align-middle" />
                </p>
                <p className="mb-4">He pulls a silver locket from his tactical vest—the one thing he was supposed to leave behind.</p>
              </div>
              {/* Floating AI UI overlay */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="absolute right-8 top-32 w-64 bg-background/95 backdrop-blur-xl border rounded-xl shadow-2xl p-4 space-y-3"
              >
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                    <Sparkles size={14} />
                    AI Intelligence
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed mt-2">
                    "JAX's dialogue in this scene is 98% consistent with the 'Selfless Protector' DNA. Strong emotional payoff detected in the final act."
                  </p>
                  <div className="h-1.5 bg-primary/20 rounded-full overflow-hidden mt-3">
                    <div className="h-full bg-gradient-to-r from-primary to-purple-500 w-[98%] rounded-full" />
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <motion.h2 variants={fadeInUp} transition={{ duration: 0.5 }} className="text-3xl md:text-5xl font-bold tracking-tight">
              Tools for the Modern Visionary
            </motion.h2>
            <motion.p variants={fadeInUp} transition={{ duration: 0.5 }} className="text-muted-foreground text-lg">
              Beyond text editing. We've built an engine that understands your story and prepares it for the lens.
            </motion.p>
          </AnimatedSection>
          <AnimatedSection className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: BrainCircuit, title: "Character DNA Sync", description: "Define deep character profiles. Our AI monitors every line of dialogue to ensure behavioral consistency across your entire draft.", color: "primary", gradient: "from-primary/10 to-purple-500/10" },
              { icon: Sparkles, title: "AI Storyboard Engine", description: "Instantly convert your action lines into high-fidelity cinematic blueprints. Visualize your lighting, camera angles, and color palettes.", color: "purple-600", gradient: "from-purple-500/10 to-fuchsia-500/10" },
              { icon: Zap, title: "Live Production Sheets", description: "Generate industry-standard call sheets that update in real-time. Sync weather data via AI and manage your crew calls effortlessly.", color: "orange-600", gradient: "from-orange-500/10 to-amber-500/10" },
            ].map((feature, i) => (
              <motion.div key={feature.title} variants={fadeInUp} transition={{ duration: 0.5 }}>
                <Card className="bg-slate-50/50 dark:bg-[#030712] border border-transparent hover:border-primary/20 shadow-none hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 h-full">
                  <CardHeader>
                    <div className={`bg-gradient-to-br ${feature.gradient} text-${feature.color} w-14 h-14 flex items-center justify-center rounded-xl mb-4`}>
                      <feature.icon size={26} />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <motion.h2 variants={fadeInUp} transition={{ duration: 0.5 }} className="text-3xl md:text-5xl font-bold tracking-tight">
              Simple, Transparent Pricing
            </motion.h2>
            <motion.p variants={fadeInUp} transition={{ duration: 0.5 }} className="text-muted-foreground text-lg">
              Start for free and upgrade as your production scales.
            </motion.p>
          </AnimatedSection>
          <AnimatedSection className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Free Tier */}
            <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
              <Card className="border shadow-xl hover:shadow-2xl transition-shadow duration-300">
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
                        <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full h-11" onClick={() => handleProductClick('/dashboard')}>Get Started</Button>
                </CardFooter>
              </Card>
            </motion.div>

            {/* Pro Tier */}
            <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
              <Card className="relative shadow-2xl scale-105 z-10 bg-background border-0 overflow-hidden">
                {/* Gradient border effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-primary via-purple-500 to-fuchsia-500 p-[2px]">
                  <div className="h-full w-full rounded-[10px] bg-background" />
                </div>
                <div className="relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white border-0 px-4 py-1 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/25">Most Popular</Badge>
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
                          <CheckCircle2 size={16} className="text-primary font-bold shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full h-11 font-bold shadow-lg shadow-primary/20" onClick={() => handleProductClick('/dashboard')}>Go Pro Now</Button>
                  </CardFooter>
                </div>
              </Card>
            </motion.div>

            {/* Studio Tier */}
            <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
              <Card className="border shadow-xl hover:shadow-2xl transition-shadow duration-300">
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
                        <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full h-11" onClick={() => handleProductClick('/dashboard')}>Contact Sales</Button>
                </CardFooter>
              </Card>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-slate-50 dark:bg-[#030712] relative">
        {/* Gradient separator line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <AnimatedSection className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <motion.div variants={fadeInUp} transition={{ duration: 0.5 }} className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-lg">
              <Film size={20} className="text-primary" />
              <span>ScriptFlow</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Empowering the next generation of filmmakers with production intelligence and AI-driven narrative tools.
            </p>
          </motion.div>
          <motion.div variants={fadeInUp} transition={{ duration: 0.5 }} className="space-y-4">
            <h4 className="font-bold text-sm">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => handleProductClick('/editor')} className="hover:text-primary transition-colors">Editor</button></li>
              <li><button onClick={() => handleProductClick('/editor')} className="hover:text-primary transition-colors">AI Storyboard</button></li>
              <li><button onClick={() => handleProductClick('/call-sheet')} className="hover:text-primary transition-colors">Call Sheets</button></li>
              <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
            </ul>
          </motion.div>
          <motion.div variants={fadeInUp} transition={{ duration: 0.5 }} className="space-y-4">
            <h4 className="font-bold text-sm">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about-us" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </motion.div>
          <motion.div variants={fadeInUp} transition={{ duration: 0.5 }} className="space-y-4">
            <h4 className="font-bold text-sm">Join the Newsletter</h4>
            <div className="flex gap-2">
              <input type="email" placeholder="email@example.com" className="bg-background border rounded-lg px-3 py-2 text-sm w-full outline-none focus:ring-2 ring-primary/30 transition-shadow" />
              <Button size="sm">Join</Button>
            </div>
          </motion.div>
        </AnimatedSection>
        <div className="max-w-7xl mx-auto px-6 pt-12 mt-12 border-t text-center text-xs text-muted-foreground">
          © 2026 ScriptFlow AI. All rights reserved. Made for visionaries.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
