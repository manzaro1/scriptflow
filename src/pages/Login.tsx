import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { showError, showSuccess } from '@/utils/toast';
import { api } from '@/lib/api';

const GOOGLE_CLIENT_ID = '279400588866-7r2i1pece4qa8t59i5pb1ne20qpo4uol.apps.googleusercontent.com';

// Add type declarations for Google Sign-In
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleInitialized, setGoogleInitialized] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Define the callback with useCallback to avoid stale closures
  const handleGoogleSignIn = useCallback(async (response: { credential: string }) => {
    setGoogleLoading(true);
    try {
      const result = await api.signInWithGoogle(response.credential);
      
      // Check if user needs to complete profile
      const user = await api.getUser();
      if (user.profile_complete === 0 || user.profile_complete === null) {
        navigate('/profile-setup');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Google sign-in failed';
      showError(errorMsg);
      console.error('Google sign-in error:', err);
    } finally {
      setGoogleLoading(false);
    }
  }, [navigate]);

  // Initialize Google Sign-In when window.google becomes available
  useEffect(() => {
    const initGoogle = () => {
      if (window.google && googleButtonRef.current && !googleInitialized) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleSignIn,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: 'outline',
            size: 'large',
            width: googleButtonRef.current.offsetWidth || 300,
            text: 'continue_with',
          });
          
          setGoogleInitialized(true);
          console.log('Google Sign-In initialized successfully');
        } catch (err) {
          console.error('Failed to initialize Google Sign-In:', err);
        }
      }
    };

    // Check immediately
    initGoogle();

    // Poll for window.google availability (script loads async)
    const interval = setInterval(() => {
      if (window.google && !googleInitialized) {
        initGoogle();
        clearInterval(interval);
      }
    }, 100);

    // Cleanup
    return () => clearInterval(interval);
  }, [handleGoogleSignIn, googleInitialized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        showSuccess('Account created successfully!');
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

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <div ref={googleButtonRef} className="flex justify-center" />

        {googleLoading && (
          <p className="text-center text-sm text-muted-foreground">Signing in with Google...</p>
        )}

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
