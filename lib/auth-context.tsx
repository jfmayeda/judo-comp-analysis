'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAllowlisted: boolean | null;
  isAdmin: boolean | null;
  isFamily: boolean | null;
  linkedAthleteIds: string[];
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAllowlisted: null,
  isAdmin: null,
  isFamily: null,
  linkedAthleteIds: [],
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAllowlisted, setIsAllowlisted] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isFamily, setIsFamily] = useState<boolean | null>(null);
  const [linkedAthleteIds, setLinkedAthleteIds] = useState<string[]>([]);
  const supabase = getSupabaseClient();

  const checkAllowlist = async (userId: string, userEmail: string | undefined) => {
    if (!userEmail) {
      setIsAllowlisted(false);
      setIsAdmin(false);
      setIsFamily(false);
      setLinkedAthleteIds([]);
      return;
    }

    try {
      // Check if user is a coach
      const { data, error } = await supabase
        .from('coach_allowlist')
        .select('is_admin')
        .eq('email', userEmail.toLowerCase())
        .maybeSingle() as { data: { is_admin: boolean } | null; error: any };

      if (error) {
        console.error('Error checking allowlist:', error);
        setIsAllowlisted(false);
        setIsAdmin(false);
      } else if (data) {
        // User is a coach
        setIsAllowlisted(true);
        setIsAdmin(data.is_admin);
        setIsFamily(false);
        setLinkedAthleteIds([]);
        return;
      } else {
        setIsAllowlisted(false);
        setIsAdmin(false);
      }

      // Check if user is family (only if not a coach)
      const { data: familyData, error: familyError } = await supabase
        .from('family_access')
        .select('athlete_id')
        .eq('email', userEmail.toLowerCase());

      if (familyError) {
        console.error('Error checking family access:', familyError);
        setIsFamily(false);
        setLinkedAthleteIds([]);
      } else if (familyData && familyData.length > 0) {
        // User is family with access to athlete(s)
        setIsFamily(true);
        setLinkedAthleteIds(familyData.map((row: any) => row.athlete_id));
      } else {
        // User is neither coach nor family
        setIsFamily(false);
        setLinkedAthleteIds([]);
      }
    } catch (error) {
      console.error('Error checking allowlist:', error);
      setIsAllowlisted(false);
      setIsAdmin(false);
      setIsFamily(false);
      setLinkedAthleteIds([]);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          await checkAllowlist(currentSession.user.id, currentSession.user.email);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          await checkAllowlist(newSession.user.id, newSession.user.email);
        } else {
          setIsAllowlisted(null);
          setIsAdmin(null);
          setIsFamily(null);
          setLinkedAthleteIds([]);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setIsAllowlisted(null);
      setIsAdmin(null);
      setIsFamily(null);
      setLinkedAthleteIds([]);
      
      // Clear offline cache on logout for user isolation
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
        try {
          const messageChannel = new MessageChannel();
          messageChannel.port1.onmessage = () => {
            console.log('Cache cleared on logout');
          };
          navigator.serviceWorker.controller.postMessage(
            { type: 'CLEAR_CACHE' },
            [messageChannel.port2]
          );
        } catch (cacheError) {
          console.error('Failed to clear cache on logout:', cacheError);
        }
      }
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAllowlisted, isAdmin, isFamily, linkedAthleteIds, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
