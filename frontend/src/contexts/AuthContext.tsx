import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { setApiAuth, recoverPassword as apiRecoverPassword } from '../services/api';
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

// Demo user for when Supabase is not configured
const DEMO_USER: UserProfile = {
  id: 'demo-user-001',
  email: 'demo@festiva.ai',
  full_name: 'Demo User',
  created_at: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOAuthConfigured, setIsOAuthConfigured] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      // Auto-login with demo user in demo mode
      setUser(DEMO_USER);
      setToken('demo-token-001');
      setApiAuth('demo-token-001', DEMO_USER.id);
      setIsOAuthConfigured(false);
      setLoading(false);
      return;
    }

    // Supabase is configured; detect Google OAuth configuration
    setIsOAuthConfigured(Boolean(import.meta.env.VITE_ENABLE_GOOGLE_OAUTH === 'true' || isSupabaseConfigured));

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
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

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      setUser(DEMO_USER);
      setToken('demo-token-001');
      setApiAuth('demo-token-001', DEMO_USER.id);
      return {};
    }
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
    if (data.session) {
      setToken(data.session.access_token);
      setApiAuth(data.session.access_token, data.user?.id);
    }
    return {};
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured || !supabase) {
      const demoUser = { ...DEMO_USER, email, full_name: fullName };
      setUser(demoUser);
      setToken('demo-token-001');
      setApiAuth('demo-token-001', demoUser.id);
      return {};
    }
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
    if (data.session) {
      setToken(data.session.access_token);
      setApiAuth(data.session.access_token, data.user?.id);
    }
    return {};
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setUser(null);
      setToken(null);
      setApiAuth(null, null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
    setApiAuth(null, null);
  }, []);

  const recoverPassword = useCallback(async (email: string) => {
    if (!isSupabaseConfigured || !supabase) {
      try {
        const res = await apiRecoverPassword(email);
        return { message: res.message || `Password recovery simulated for ${email}.` };
      } catch (err: any) {
        return { message: `Password recovery simulated for ${email} in Demo Studio Mode.` };
      }
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/login?reset=true`,
    });
    if (error) {
      return { error: error.message };
    }
    return { message: `Password recovery email sent to ${email}. Please check your inbox.` };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setUser(DEMO_USER);
      setToken('demo-token-001');
      setApiAuth('demo-token-001', DEMO_USER.id);
      return {};
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    return { error: error?.message };
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated: Boolean(user),
      isDemoMode: !isSupabaseConfigured,
      isOAuthConfigured,
      signIn,
      signUp,
      signOut,
      recoverPassword,
      signInWithGoogle,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
