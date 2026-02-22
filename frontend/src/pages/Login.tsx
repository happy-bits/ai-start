import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { login as loginApi, useLogin } from '../api/auth';
import { apiClient } from '../api/client';

import { ErrorMessage, LoadingSpinner } from '../components/ui';
import { config } from '../config';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils';
import { cn, formInputBase, formInputBorderNormal, formLabel } from '../utils/styles';

const API_BASE = import.meta.env.VITE_API_URL || '';

// In dev, connect directly to backend to avoid Vite proxy SSE issues
const HEALTH_STREAM_URL = import.meta.env.DEV
  ? 'http://localhost:3000/health/stream'
  : `${API_BASE}/health/stream`;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const loginMutation = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Backend health status via SSE - server sends heartbeat every 10s, reconnect every 2s when down
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);
  useEffect(() => {
    if (!config.developerTools) return;
    const eventSource = new EventSource(HEALTH_STREAM_URL);
    eventSource.onopen = () => setIsBackendOnline(true);
    eventSource.addEventListener('heartbeat', () => setIsBackendOnline(true));
    eventSource.onerror = () => {
      setIsBackendOnline(false);
      // EventSource auto-reconnects (retry: 2000 from server)
    };
    return () => eventSource.close();
  }, []);

  const handleResetDatabase = async () => {
    setIsResetting(true);
    setError('');
    setResetSuccess(false);

    try {
      // Log in as admin
      const response = await loginApi({ email: 'admin@keepwarm.com', password: 'admin123' });
      apiClient.setToken(response.token);

      // Reset the database
      await apiClient.post('/api/dev/reset');

      // Log out
      await apiClient.post('/auth/logout').catch(() => {});
      apiClient.setToken(null);

      setResetSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err) || 'Could not reset database');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await loginMutation.mutateAsync({ email, password });
      login(response.token, response.user);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err) || 'Login failed');
    }
  };

  const handleQuickLogin = async (quickEmail: string, quickPassword: string) => {
    setError('');

    try {
      const response = await loginMutation.mutateAsync({
        email: quickEmail,
        password: quickPassword,
      });
      login(response.token, response.user);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err) || 'Quick login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 wild-bg">
      {/* Floating orbs - wild psychedelic background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#ff00ff]/20 rounded-full blur-3xl animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#00fff5]/20 rounded-full blur-3xl animate-[float_10s_ease-in-out_infinite_reverse]" />
        <div className="absolute top-2/3 left-1/4 w-64 h-64 bg-[#b8ff00]/15 rounded-full blur-3xl animate-[float_12s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 right-1/3 w-48 h-48 bg-[#ff6b00]/25 rounded-full blur-3xl animate-[float_6s_ease-in-out_infinite_reverse]" />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-[#bf00ff]/10 rounded-full blur-3xl animate-[spin-slow_20s_linear_infinite]" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo and title - wild neon style */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ff00ff] via-[#ff6b00] to-[#00fff5] mb-4 shadow-[0_0_30px_rgba(255,0,255,0.5),0_0_60px_rgba(0,255,245,0.3)] animate-[wiggle_3s_ease-in-out_infinite]"
            aria-hidden="true"
          >
            <svg className="w-10 h-10 text-white drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <title>KeepWarm logo</title>
              <path d="M12 2C9 5 7 8 7 11c0 2.5 1.5 4.5 3.5 5.5L9 22h6l-1.5-5.5C15.5 15.5 17 13.5 17 11c0-3-2-6-5-9zm0 4c1.5 2 2.5 4 2.5 5.5 0 1.5-1 2.5-2.5 2.5s-2.5-1-2.5-2.5C9.5 10 10.5 8 12 6z" />
            </svg>
          </div>
          <h1 className="text-4xl font-[family-name:var(--font-family-display)] text-transparent bg-clip-text bg-gradient-to-r from-[#ff00ff] via-[#ff6b00] to-[#00fff5] mb-2 [text-shadow:0_0_30px_rgba(255,0,255,0.5)]">
            KeepWarm
          </h1>
          <p className="text-[#00fff5]/80 text-sm font-medium">Let&apos;s get WILD 🔥</p>
        </div>

        {/* Login card - neon border glow */}
        <div className="bg-dark-900/90 backdrop-blur-xl border-2 border-[#ff00ff]/40 rounded-2xl p-8 shadow-[0_0_40px_rgba(255,0,255,0.2),inset_0_0_40px_rgba(0,255,245,0.05)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <ErrorMessage error={error} />

            <div>
              <label htmlFor="email" className={cn(formLabel, 'mb-2')}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(formInputBase.replace('py-2.5', 'py-3'), formInputBorderNormal)}
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className={cn(formLabel, 'mb-2')}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(formInputBase.replace('py-2.5', 'py-3'), formInputBorderNormal)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#ff00ff] via-[#ff6b00] to-[#00fff5] hover:opacity-90 text-white font-bold rounded-lg shadow-[0_0_20px_rgba(255,0,255,0.5),0_0_40px_rgba(0,255,107,0.3)] focus:outline-none focus:ring-2 focus:ring-[#ff00ff] focus:ring-offset-2 focus:ring-offset-dark-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Developer Tools: Quick Login */}
          {config.developerTools && (
            <div className="mt-6 pt-6 border-t border-dark-700">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-dark-500">Developer tools</p>
                {/* Backend status indicator */}
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isBackendOnline === true ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-xs text-dark-400">
                    {isBackendOnline === true ? 'Backend online' : 'Backend offline'}
                  </span>
                </div>
              </div>

              {/* Credentials Display */}
              <div className="mb-4 space-y-1.5">
                <div className="bg-dark-800/50 rounded px-2.5 py-1.5 text-xs">
                  <span className="text-dark-400 font-medium">Admin:</span>{' '}
                  <span className="text-warm-400 select-all">admin@keepwarm.com</span> /{' '}
                  <span className="text-warm-400 select-all">admin123</span>
                </div>
                <div className="bg-dark-800/50 rounded px-2.5 py-1.5 text-xs">
                  <span className="text-dark-400 font-medium">Maria:</span>{' '}
                  <span className="text-warm-400 select-all">maria@sellmore.se</span> /{' '}
                  <span className="text-warm-400 select-all">seller123</span>
                </div>
                <div className="bg-dark-800/50 rounded px-2.5 py-1.5 text-xs">
                  <span className="text-dark-400 font-medium">Lars:</span>{' '}
                  <span className="text-warm-400 select-all">lars@hotmail.com</span> /{' '}
                  <span className="text-warm-400 select-all">seller123</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <QuickLoginButton
                  label="Admin"
                  email="admin@keepwarm.com"
                  password="admin123"
                  color="warm"
                  onLogin={handleQuickLogin}
                  disabled={loginMutation.isPending || isResetting}
                />
                <QuickLoginButton
                  label="Maria"
                  subtitle="Seller"
                  email="maria@sellmore.se"
                  password="seller123"
                  color="warm"
                  onLogin={handleQuickLogin}
                  disabled={loginMutation.isPending || isResetting}
                />
                <QuickLoginButton
                  label="Lars"
                  subtitle="Seller"
                  email="lars@hotmail.com"
                  password="seller123"
                  color="warm"
                  onLogin={handleQuickLogin}
                  disabled={loginMutation.isPending || isResetting}
                />
              </div>

              {/* Reset Database */}
              <button
                type="button"
                onClick={handleResetDatabase}
                disabled={loginMutation.isPending || isResetting}
                aria-label="Reset database to initial state"
                className="w-full mt-3 py-2 px-3 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 text-red-400 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {isResetting ? 'Resetting...' : 'Reset database'}
              </button>

              {resetSuccess && (
                <div className="bg-warm-500/10 border border-warm-500/20 text-warm-400 px-4 py-3 rounded-lg text-sm mt-3">
                  Database has been reset!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Quick login button component for developer tools
function QuickLoginButton({
  label,
  subtitle,
  email,
  password,
  color,
  onLogin,
  disabled,
}: {
  label: string;
  subtitle?: string;
  email: string;
  password: string;
  color: 'warm';
  onLogin: (email: string, password: string) => void;
  disabled: boolean;
}) {
  const colorClasses = {
    warm: 'bg-warm-500/10 border-warm-500/30 hover:bg-warm-500/20 hover:border-warm-500/50 text-warm-400',
  };

  return (
    <button
      type="button"
      onClick={() => onLogin(email, password)}
      disabled={disabled}
      aria-label={`Quick login as ${label}${subtitle ? ` (${subtitle})` : ''}`}
      className={`${colorClasses[color]} border rounded-lg p-2 text-center transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <p className="font-medium text-sm">{label}</p>
      {subtitle && <p className="text-xs opacity-70">{subtitle}</p>}
    </button>
  );
}
