import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> 
  = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    // Retry up to 3 times with 2 second gaps
    // This handles Supabase cold starts gracefully
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (error) {
          console.error(
            `Profile fetch attempt ${attempt} failed:`, error
          );
          if (attempt < 3) {
            await new Promise(r => setTimeout(r, 2000));
            continue;
          }
        } else if (data) {
          setProfile(data as Profile);
          return;
        }
      } catch (e) {
        console.error(`Profile fetch attempt ${attempt} exception:`, e);
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }
    // All 3 attempts failed
    // Try to read from localStorage cache as last resort
    const cached = localStorage.getItem('nexusedu_profile_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setProfile(parsed as Profile);
        console.warn('Using cached profile due to Supabase error');
      } catch (e) {
        console.error('Failed to parse cached profile');
      }
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    await fetchProfile(user.id);
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = 
          await supabase.auth.getSession();
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (e) {
        console.error('Auth init error:', e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    // No artificial timeout — let it wait properly
    initAuth();

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          localStorage.removeItem('nexusedu_profile_cache');
        }
        setIsLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Cache the profile whenever it changes
  useEffect(() => {
    if (profile) {
      localStorage.setItem(
        'nexusedu_profile_cache', 
        JSON.stringify(profile)
      );
    }
  }, [profile]);

  const signOut = async () => {
    try {
      localStorage.removeItem('nexusedu_profile_cache');
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Sign out error:', e);
      // Force sign out even if Supabase is unreachable
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, user, profile, isLoading, signOut, refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
