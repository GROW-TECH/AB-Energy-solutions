import React, { useState } from 'react';
import { 
  Lock, User, ArrowRight, ShieldCheck, Eye, EyeOff, 
  AlertCircle, Loader2, KeyRound 
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { getApiUrl } from '../../utils/apiUrl';

interface LoginViewProps {
  onLoginSuccess: (defaultTab: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { login } = useCrm();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Please enter both your username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const result = await login(username.trim(), password);

    setIsLoading(false);

    if (result.success && result.defaultTab) {
      onLoginSuccess(result.defaultTab);
    } else {
      setErrorMessage(result.error || 'Invalid credentials. Please verify your username and password.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1324] text-slate-100 flex flex-col justify-center items-center p-4 font-sans">
      {/* Centered Single Card Container */}
      <div className="w-full max-w-md">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-3 bg-white rounded-xl mb-3 shadow-md flex items-center justify-center">
            <img
              src={getApiUrl('/logo.png')}
              alt="AB Energy Solutions"
              className="h-14 w-auto object-contain"
            />
          </div>
          <h1 className="text-sm font-bold text-slate-300 tracking-wider uppercase">
            AB Energy Solutions
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Solar CRM &amp; Business OS</p>
        </div>

        {/* Clean, Non-Glowing Professional Login Card */}
        <div className="bg-[#111C35] border border-slate-700/80 rounded-xl p-6 sm:p-7 shadow-xl">
          <div className="mb-5 pb-4 border-b border-slate-700/60">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>Sign In to Workspace</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your credentials to access your account.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg flex items-start gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input - Clean solid border without neon glowing ring */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Username or Login ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  disabled={isLoading}
                  autoComplete="username"
                  placeholder="Enter username"
                  className="w-full bg-[#080E1C] border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-500 transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Input - Clean solid border without neon glowing ring */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[10px] text-slate-400">Encrypted</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  placeholder="Enter password"
                  className="w-full bg-[#080E1C] border border-slate-700 rounded-lg pl-9 pr-10 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-500 transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Clean Solid Button (No neon drop-shadow glow) */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-xs text-slate-400 text-center mt-5">
          © 2026 AB Energy Solutions. All rights reserved.
        </p>
      </div>
    </div>
  );
};
