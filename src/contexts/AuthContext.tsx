import React, { 
  createContext, useContext, useEffect, useState, useRef 
} from 'react';
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

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

const PROFILE_CACHE_KEY = 'nexusedu_profile_cache';
const SESSION_CACHE_KEY = 'nexusedu_session_cache';

function getCachedProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCachedProfile(p: Profile | null) {
  try {
    if (p) {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(p));
    } else {
      localStorage.removeItem(PROFILE_CACHE_KEY);
    }
  } catch {}
}

export const AuthProvider: React.FC<{ 
  children: React.ReactNode 
}> = ({ children }) => {
  // Start with cached profile so UI renders immediately
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(
    getCachedProfile()
  );
  // Start loading as FALSE if we have a cached profile
  // so the app renders immediately from cache
  const [isLoading, setIsLoading] = useState(
    getCachedProfile() === null
  );
  const mountedRef = useRef(true);

  const fetchProfileOnce = async (
    userId: string
  ): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        console.error('fetchProfile error:', error.message);
        return null;
      }
      return data as Profile;
    } catch (e) {
      console.error('fetchProfile exception:', e);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (!mountedRef.current) return;
    const currentUser = user;
    if (!currentUser) return;
    const fresh = await fetchProfileOnce(currentUser.id);
    if (fresh && mountedRef.current) {
      setProfile(fresh);
      setCachedProfile(fresh);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    // Hard timeout — no matter what happens,
    // isLoading becomes false after 5 seconds maximum
    const hardTimeout = setTimeout(() => {
      if (mountedRef.current) {
        console.warn('Auth hard timeout — forcing isLoading=false');
        setIsLoading(false);
      }
    }, 5000);

    const initAuth = async () => {
      try {
        // This gets the session from localStorage — very fast
        // (does NOT make a network request on most browsers)
        const { data: { session }, error } =
          await supabase.auth.getSession();

        if (!mountedRef.current) return;

        if (error) {
          console.error('getSession error:', error.message);
          clearTimeout(hardTimeout);
          setIsLoading(false);
          return;
        }

        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Try to fetch fresh profile
          // but do NOT block the loading state on it
          fetchProfileOnce(currentUser.id).then(fresh => {
            if (fresh && mountedRef.current) {
              setProfile(fresh);
              setCachedProfile(fresh);
            }
          });
        } else {
          // No session — clear cache
          setCachedProfile(null);
          setProfile(null);
        }
      } catch (e) {
        console.error('initAuth exception:', e);
      } finally {
        clearTimeout(hardTimeout);
        if (mountedRef.current) setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(
        async (_event, newSession) => {
          if (!mountedRef.current) return;

          setSession(newSession);
          const newUser = newSession?.user ?? null;
          setUser(newUser);

          if (newUser) {
            fetchProfileOnce(newUser.id).then(fresh => {
              if (fresh && mountedRef.current) {
                setProfile(fresh);
                setCachedProfile(fresh);
              }
            });
          } else {
            setProfile(null);
            setCachedProfile(null);
          }

          setIsLoading(false);
        }
      );

    return () => {
      mountedRef.current = false;
      clearTimeout(hardTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setCachedProfile(null);
      localStorage.removeItem(SESSION_CACHE_KEY);
      await Promise.race([
        supabase.auth.signOut(),
        // If signOut hangs for 5 seconds, force it
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('signOut timeout')), 5000)
        )
      ]);
    } catch (e) {
      console.warn('signOut issue (forcing anyway):', e);
    } finally {
      // Always clear state regardless of Supabase response
      setSession(null);
      setUser(null);
      setProfile(null);
      setCachedProfile(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      profile,
      isLoading,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
