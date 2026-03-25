import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

export const LoginPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const isConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'your_supabase_project_url';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConfigured) {
      setError('Supabase is not configured. Please set the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setError('Check your email for the confirmation link.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/');
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        setError('Network error: Failed to connect to Supabase. Please check your internet connection or verify that your Supabase project is active and the URL is correct.');
      } else {
        setError(err.message || `Failed to ${isSignUp ? 'sign up' : 'log in'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-white">
            N
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-text-primary">
            {isSignUp ? 'Create an account' : 'Welcome back'}
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            {isSignUp ? 'Sign up for NexusEdu' : 'Sign in to your NexusEdu account'}
          </p>
        </div>

        {!isConfigured && (
          <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-800 border border-yellow-200">
            <strong>Configuration Missing:</strong> You need to set your Supabase environment variables in the settings menu before you can sign in.
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          {error && (
            <div className={`rounded-md p-4 text-sm border ${error.includes('Check your email') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary placeholder-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary placeholder-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading} disabled={!isConfigured}>
            {isSignUp ? 'Sign up' : 'Sign in'}
          </Button>
          
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-sm text-primary hover:underline"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
