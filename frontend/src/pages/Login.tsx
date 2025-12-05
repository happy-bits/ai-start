import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { useLogin, login as loginApi } from '../api/auth';
import { apiClient } from '../api/client';
import { ErrorMessage, LoadingSpinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { config } from '../config';
import { getErrorMessage } from '../utils';
import { formInputBase, formInputBorderNormal, formLabel, cn } from '../utils/styles';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Health check function
async function checkHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) {
    throw new Error('Backend is not responding');
  }
  return response.json();
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const loginMutation = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Check backend health status
  const { data: healthData } = useQuery({
    queryKey: ['health'],
    queryFn: checkHealth,
    refetchInterval: 500, // Check every 0.5 seconds
    retry: 1,
    enabled: config.developerTools, // Only check if developer tools are enabled
  });

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
      const response = await loginMutation.mutateAsync({ email: quickEmail, password: quickPassword });
      login(response.token, response.user);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err) || 'Quick login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-warm-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-warm-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-warm-400 to-warm-600 mb-4 shadow-lg shadow-warm-500/25">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C9 5 7 8 7 11c0 2.5 1.5 4.5 3.5 5.5L9 22h6l-1.5-5.5C15.5 15.5 17 13.5 17 11c0-3-2-6-5-9zm0 4c1.5 2 2.5 4 2.5 5.5 0 1.5-1 2.5-2.5 2.5s-2.5-1-2.5-2.5C9.5 10 10.5 8 12 6z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">KeepWarm</h1>
        </div>

        {/* Login card */}
        <div className="bg-dark-900/80 backdrop-blur-xl border border-dark-700 rounded-2xl p-8 shadow-2xl">
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
              className="w-full py-3 px-4 bg-gradient-to-r from-warm-500 to-warm-600 hover:from-warm-400 hover:to-warm-500 text-white font-semibold rounded-lg shadow-lg shadow-warm-500/25 focus:outline-none focus:ring-2 focus:ring-warm-500 focus:ring-offset-2 focus:ring-offset-dark-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                <p className="text-xs text-dark-500">
                  Developer tools
                </p>
                {/* Backend status indicator */}
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      healthData?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-xs text-dark-400">
                    {healthData?.status === 'ok' ? 'Backend online' : 'Backend offline'}
                  </span>
                </div>
              </div>
              
              {/* Credentials Display */}
              <div className="mb-4 space-y-1.5">
                <div className="bg-dark-800/50 rounded px-2.5 py-1.5 text-xs">
                  <span className="text-dark-400 font-medium">Admin:</span>{' '}
                  <span className="text-warm-400 select-all">admin@keepwarm.com</span> / <span className="text-warm-400 select-all">admin123</span>
                </div>
                <div className="bg-dark-800/50 rounded px-2.5 py-1.5 text-xs">
                  <span className="text-dark-400 font-medium">Maria:</span>{' '}
                  <span className="text-warm-400 select-all">maria@sellmore.se</span> / <span className="text-warm-400 select-all">seller123</span>
                </div>
                <div className="bg-dark-800/50 rounded px-2.5 py-1.5 text-xs">
                  <span className="text-dark-400 font-medium">Lars:</span>{' '}
                  <span className="text-warm-400 select-all">lars@hotmail.com</span> / <span className="text-warm-400 select-all">seller123</span>
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
                className="w-full mt-3 py-2 px-3 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 text-red-400 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
      className={`${colorClasses[color]} border rounded-lg p-2 text-center transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <p className="font-medium text-sm">{label}</p>
      {subtitle && <p className="text-xs opacity-70">{subtitle}</p>}
    </button>
  );
}

