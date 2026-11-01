import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sparkles, Mail, Lock, User, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CelebrationRibbon } from '../components/ui/CelebrationRibbon';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = loginSchema.extend({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  confirm_password: z.string(),
}).refine(data => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ['confirm_password'],
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

function AuthPage({ mode }: { mode: 'login' | 'signup' | 'forgot-password' }) {
  const navigate = useNavigate();
  const { signIn, signUp, recoverPassword, signInWithGoogle, isDemoMode, isOAuthConfigured } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const schema = mode === 'login'
    ? loginSchema
    : mode === 'signup'
    ? signupSchema
    : forgotPasswordSchema;

  const { register, handleSubmit, formState: { errors } } = useForm<any>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      if (mode === 'login') {
        const result = await signIn(data.email, data.password);
        if (result?.error) {
          setError(result.error);
        } else {
          navigate('/dashboard');
        }
      } else if (mode === 'signup') {
        const result = await signUp(data.email, data.password, data.full_name);
        if (result?.error) {
          setError(result.error);
        } else {
          navigate('/dashboard');
        }
      } else if (mode === 'forgot-password') {
        const result = await recoverPassword(data.email);
        if (result?.error) {
          setError(result.error);
        } else {
          setSuccessMessage(result.message || 'Password recovery instructions have been sent to your email.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithGoogle();
      if (result?.error) setError(result.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-[var(--background)] text-[var(--text-primary)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3">
            <CelebrationRibbon variant="logo" className="text-[var(--accent)]" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Festiva AI
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            {mode === 'login'
              ? 'Welcome back to your celebration studio'
              : mode === 'signup'
              ? 'Start planning extraordinary celebrations'
              : 'Recover access to your celebration account'}
          </p>
        </div>

        <Card className="border-[var(--border)] shadow-soft">
          <CardContent className="p-7">
            {/* Clear Demo Studio Indicator */}
            {isDemoMode && (
              <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-left flex items-start gap-2.5">
                <span className="text-base flex-shrink-0">🎭</span>
                <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  <p className="font-semibold text-[var(--text-primary)]">Demo Studio Active</p>
                  <p className="mt-0.5">
                    Operating in simulated sandbox mode. Records are kept in memory and are not permanently saved to a remote cloud database without Supabase configuration.
                  </p>
                </div>
              </div>
            )}

            {/* Google OAuth (Rendered ONLY if provider configuration is available) */}
            {mode !== 'forgot-password' && (
              <>
                {isOAuthConfigured ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handleGoogle}
                    isLoading={loading}
                    className="w-full justify-center mb-5 font-medium"
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </Button>
                ) : (
                  <div className="mb-4 text-center">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] text-[10px] text-[var(--text-muted)] font-mono">
                      OAuth Providers: Configured via Supabase
                    </span>
                  </div>
                )}

                <div className="relative flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-[var(--border)]" />
                  <span className="text-[var(--text-secondary)] text-xs font-medium uppercase tracking-wider">
                    {isOAuthConfigured ? 'or email' : 'Sign In With Email'}
                  </span>
                  <div className="flex-1 h-px bg-[var(--border)]" />
                </div>
              </>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {mode === 'signup' && (
                <Input
                  label="Full Name"
                  placeholder="e.g. Priya Sharma"
                  leftIcon={<User className="w-4 h-4" />}
                  error={(errors as any).full_name?.message}
                  {...register('full_name')}
                />
              )}

              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message as string}
                {...register('email')}
              />

              {mode !== 'forgot-password' && (
                <>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--text-secondary)]">Password</span>
                      {mode === 'login' && (
                        <Link
                          to="/auth/forgot-password"
                          className="text-xs text-[var(--primary)] hover:underline font-medium"
                        >
                          Forgot password?
                        </Link>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        leftIcon={<Lock className="w-4 h-4" />}
                        error={errors.password?.message as string}
                        {...register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {mode === 'signup' && (
                    <Input
                      label="Confirm Password"
                      type="password"
                      placeholder="••••••••"
                      leftIcon={<Lock className="w-4 h-4" />}
                      error={(errors as any).confirm_password?.message}
                      {...register('confirm_password')}
                    />
                  )}
                </>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={loading}
                className="w-full justify-center mt-2 font-medium"
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                {mode === 'login'
                  ? 'Sign In'
                  : mode === 'signup'
                  ? 'Create Free Account'
                  : 'Send Password Reset Link'}
              </Button>
            </form>

            <div className="text-center text-xs text-[var(--text-secondary)] mt-6 pt-5 border-t border-[var(--border)]">
              {mode === 'login' ? (
                <>
                  Don't have an account yet?{' '}
                  <Link to="/auth/signup" className="text-[var(--primary)] hover:underline font-semibold">
                    Sign up free
                  </Link>
                </>
              ) : mode === 'signup' ? (
                <>
                  Already have an account?{' '}
                  <Link to="/auth/login" className="text-[var(--primary)] hover:underline font-semibold">
                    Sign in
                  </Link>
                </>
              ) : (
                <Link to="/auth/login" className="inline-flex items-center gap-1.5 text-[var(--primary)] hover:underline font-medium">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export function LoginPage() { return <AuthPage mode="login" />; }
export function SignupPage() { return <AuthPage mode="signup" />; }
export function ForgotPasswordPage() { return <AuthPage mode="forgot-password" />; }
