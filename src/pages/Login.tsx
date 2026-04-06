import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { showError } from '@/utils/toast';

const GOOGLE_CLIENT_ID = '279400588866-7r2i1pece4qa8t59i5pb1ne20qpo4uol.apps.googleusercontent.com';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const handleGoogleResponse = useCallback(async (response: { credential: string }) => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle(response.credential);
      navigate('/dashboard');
    } catch (err: any) {
      showError(err.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  }, [signInWithGoogle, navigate]);

  useEffect(() => {
    const initGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
        const btn = document.getElementById('google-signin-btn');
        if (btn) {
          window.google.accounts.id.renderButton(btn, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'continue_with',
          });
        }
      }
    };

    // If already loaded (e.g. navigated back), just re-init
    if (window.google) {
      initGoogle();
      return;
    }

    // Load Google Identity Services script once
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
    }
  }, [handleGoogleResponse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      showError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-xl shadow-lg border">
        <h1 className="text-2xl font-bold text-center">
          {isSignUp ? 'Create Account' : 'Login'}
        </h1>

        {/* Google Sign-In */}
        <div className="space-y-4">
          <div
            id="google-signin-btn"
            className="flex justify-center"
          />
          {googleLoading && (
            <p className="text-center text-sm text-muted-foreground">Signing in with Google...</p>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary hover:underline"
          >
            {isSignUp ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
