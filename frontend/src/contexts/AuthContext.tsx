import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import {
  setApiAuth,
  apiLogin,
  apiRegister,
  apiLogout,
  apiGetMe,
  recoverPassword as apiRecoverPassword,
} from '../services/api';
import type { UserProfile } from '../types/auth';

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  isOAuthConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  recoverPassword: (email: string) => Promise<{ error?: string; message?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOAuthConfigured, setIsOAuthConfigured] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Detect Google OAuth configuration
    setIsOAuthConfigured(Boolean(import.meta.env.VITE_ENABLE_GOOGLE_OAUTH === 'true' || isSupabaseConfigured));

    if (isSupabaseConfigured && supabase) {
      // Direct client Supabase session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!isMounted) return;
        if (session?.user) {
          const u: UserProfile = {
            id: session.user.id,
            email: session.user.email!,
            full_name: session.user.user_metadata?.full_name,
            avatar_url: session.user.user_metadata?.avatar_url,
            created_at: session.user.created_at,
          };
          setUser(u);
          setToken(session.access_token);
          setApiAuth(session.access_token, session.user.id);
        } else {
          setUser(null);
          setToken(null);
          setApiAuth(null, null);
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!isMounted) return;
        if (session?.user) {
          const u: UserProfile = {
            id: session.user.id,
            email: session.user.email!,
            full_name: session.user.user_metadata?.full_name,
            avatar_url: session.user.user_metadata?.avatar_url,
            created_at: session.user.created_at,
          };
          setUser(u);
          setToken(session.access_token);
          setApiAuth(session.access_token, session.user.id);
        } else {
          setUser(null);
          setToken(null);
          setApiAuth(null, null);
        }
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    } else {
      // Backend Supabase / API Token Session Restoration
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('festiva_token') : null;
      if (storedToken) {
        apiGetMe()
          .then((me) => {
            if (!isMounted) return;
            const u: UserProfile = {
              id: me.id,
              email: me.email,
              full_name: me.full_name,
              created_at: new Date().toISOString(),
            };
            setUser(u);
            setToken(storedToken);
            setApiAuth(storedToken, me.id);
            setLoading(false);
          })
          .catch(() => {
            if (!isMounted) return;
            setUser(null);
            setToken(null);
            setApiAuth(null, null);
            setLoading(false);
          });
      } else {
        setUser(null);
        setToken(null);
        setApiAuth(null, null);
        setLoading(false);
      }

      return () => {
        isMounted = false;
      };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        let friendlyError = error.message;
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          friendlyError = 'Invalid email or password. Please verify your credentials and try again.';
        } else if (error.message.toLowerCase().includes('email not confirmed')) {
          friendlyError = 'Please verify your email address to sign in.';
        }
        return { error: friendlyError };
      }
      if (data.session && data.user) {
        const u: UserProfile = {
          id: data.user.id,
          email: data.user.email!,
          full_name: data.user.user_metadata?.full_name,
          avatar_url: data.user.user_metadata?.avatar_url,
          created_at: data.user.created_at,
        };
        setUser(u);
        setToken(data.session.access_token);
        setApiAuth(data.session.access_token, data.user.id);
      }
      return {};
    }

    // Backend Supabase authentication
    try {
      const res = await apiLogin(email, password);
      if (res.user) {
        const u: UserProfile = {
          id: res.user.id,
          email: res.user.email,
          full_name: res.user.full_name,
          created_at: res.user.created_at || new Date().toISOString(),
        };
        setUser(u);
        setToken(res.access_token || null);
        setApiAuth(res.access_token || null, res.user.id);
      }
      return {};
    } catch (err: any) {
      return { error: err.message || 'Login failed. Please verify your credentials.' };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) {
        let friendlyError = error.message;
        if (error.message.toLowerCase().includes('already registered')) {
          friendlyError = 'An account with this email already exists. Please sign in instead.';
        }
        return { error: friendlyError };
      }
      if (data.session && data.user) {
        const u: UserProfile = {
          id: data.user.id,
          email: data.user.email!,
          full_name: data.user.user_metadata?.full_name || fullName,
          avatar_url: data.user.user_metadata?.avatar_url,
          created_at: data.user.created_at,
        };
        setUser(u);
        setToken(data.session.access_token);
        setApiAuth(data.session.access_token, data.user.id);
      }
      return {};
    }

    // Backend Supabase registration
    try {
      const res = await apiRegister(email, password, fullName);
      if (res.user) {
        const u: UserProfile = {
          id: res.user.id,
          email: res.user.email,
          full_name: res.user.full_name || fullName,
          created_at: res.user.created_at || new Date().toISOString(),
        };
        setUser(u);
        setToken(res.access_token || null);
        setApiAuth(res.access_token || null, res.user.id);
      }
      return {};
    } catch (err: any) {
      return { error: err.message || 'Registration failed. Please check your details.' };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // pass
      }
    }
    try {
      await apiLogout();
    } catch {
      // pass
    }
    setUser(null);
    setToken(null);
    setApiAuth(null, null);
  }, []);

  const recoverPassword = useCallback(async (email: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/login?reset=true`,
      });
      if (error) {
        return { error: error.message };
      }
      return { message: `Password recovery email sent to ${email}. Please check your inbox.` };
    }
    try {
      const res = await apiRecoverPassword(email);
      return { message: res.message || `Password recovery email sent to ${email}. Please check your inbox.` };
    } catch (err: any) {
      return { error: err.message || `Unable to send password recovery instructions.` };
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      return { error: error?.message };
    }
    return { error: 'Google OAuth provider is configured through the Supabase Dashboard.' };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user),
        isDemoMode: false,
        isOAuthConfigured,
        signIn,
        signUp,
        signOut,
        recoverPassword,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
