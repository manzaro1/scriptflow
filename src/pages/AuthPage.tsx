"use client";

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from "@/integrations/supabase/client";

const AuthPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary))',
                  },
                },
              },
            }}
            theme="light"
            providers={['google', 'github']}
            redirectTo={window.location.origin + '/dashboard'}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;