"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, ArrowRight, Mail, Lock, User, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showSuccess } from "@/utils/toast";

const AuthPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      localStorage.setItem('isAuthenticated', 'true');
      showSuccess(activeTab === 'login' ? "Welcome back! Loading your scripts..." : "Account created! Starting your free trial.");
      navigate('/dashboard');
    }, 1500);
  };

  const LoginForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="login-email" type="email" placeholder="you@scriptflow.app" className="pl-10" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="login-password" type="password" placeholder="••••••••" className="pl-10" required />
        </div>
      </div>
      <Button type="submit" className="w-full h-11 gap-2" disabled={isLoading}>
        {isLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <>
            Sign In
            <ArrowRight size={18} />
          </>
        )}
      </Button>
      <Button variant="link" className="w-full text-sm">Forgot Password?</Button>
    </form>
  );

  const SignupForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Full Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="signup-name" placeholder="Alex Rivers" className="pl-10" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="signup-email" type="email" placeholder="you@scriptflow.app" className="pl-10" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="signup-password" type="password" placeholder="••••••••" className="pl-10" required />
        </div>
      </div>
      <Button type="submit" className="w-full h-11 gap-2" disabled={isLoading}>
        {isLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <>
            Create Account (Free)
            <ArrowRight size={18} />
          </>
        )}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        By signing up, you agree to our <a href="/terms" className="underline hover:text-primary">Terms</a> and <a href="/privacy" className="underline hover:text-primary">Privacy Policy</a>.
      </p>
    </form>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 font-black text-2xl">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg shadow-lg">
              <Film size={24} />
            </div>
            <span className="tracking-tight">ScriptFlow</span>
          </div>
          <CardTitle className="text-2xl">Welcome to Production Intelligence</CardTitle>
          <CardDescription>
            {activeTab === 'login' 
              ? "Sign in to access your script library and AI tools."
              : "Start your free account and begin architecting your next film."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            <TabsContent value="signup">
              <SignupForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;