import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../api/auth';
import { config } from '../config';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await loginApi({ email, password });
      login(response.token, response.user);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string, quickPassword: string) => {
    setError('');
    setIsLoading(true);

    try {
      const response = await loginApi({ email: quickEmail, password: quickPassword });
      login(response.token, response.user);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quick login failed');
    } finally {
      setIsLoading(false);
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
          <p className="text-dark-400">Sign in to manage your relationships</p>
        </div>

        {/* Login card */}
        <div className="bg-dark-900/80 backdrop-blur-xl border border-dark-700 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dark-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-warm-500 focus:border-transparent transition-all"
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dark-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-warm-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-warm-500 to-warm-600 hover:from-warm-400 hover:to-warm-500 text-white font-semibold rounded-lg shadow-lg shadow-warm-500/25 focus:outline-none focus:ring-2 focus:ring-warm-500 focus:ring-offset-2 focus:ring-offset-dark-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
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
              <p className="text-xs text-dark-500 text-center mb-3 flex items-center justify-center gap-2">
                <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Dev Mode: Quick Login
              </p>
              <div className="grid grid-cols-3 gap-2">
                <QuickLoginButton
                  label="Admin"
                  email="admin@keepwarm.com"
                  password="admin123"
                  color="amber"
                  onLogin={handleQuickLogin}
                  disabled={isLoading}
                />
                <QuickLoginButton
                  label="Alice"
                  subtitle="Seller"
                  email="alice@keepwarm.com"
                  password="seller123"
                  color="blue"
                  onLogin={handleQuickLogin}
                  disabled={isLoading}
                />
                <QuickLoginButton
                  label="Bob"
                  subtitle="Seller"
                  email="bob@keepwarm.com"
                  password="seller123"
                  color="violet"
                  onLogin={handleQuickLogin}
                  disabled={isLoading}
                />
              </div>
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
  color: 'amber' | 'blue' | 'violet';
  onLogin: (email: string, password: string) => void;
  disabled: boolean;
}) {
  const colorClasses = {
    amber: 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50 text-amber-400',
    blue: 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50 text-blue-400',
    violet: 'bg-violet-500/10 border-violet-500/30 hover:bg-violet-500/20 hover:border-violet-500/50 text-violet-400',
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

