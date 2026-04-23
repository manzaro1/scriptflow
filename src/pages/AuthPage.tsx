"use client";

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Button } from '@/components/ui/button';

const AuthPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

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
          <CardTitle className="text-2xl">Production Intelligence</CardTitle>
          <CardDescription>
            Sign in to access your script library and AI tools.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" onClick={() => navigate('/login')}>
            Sign In / Create Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
