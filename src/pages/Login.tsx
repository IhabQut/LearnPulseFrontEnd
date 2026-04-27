import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Eye, EyeOff, LogIn, Sparkles } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { user, login, loading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  // Clear errors on mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>

      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 rounded-full opacity-20 animate-pulse" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', top: '-10%', left: '-5%' }} />
        <div className="absolute w-80 h-80 rounded-full opacity-15 animate-pulse" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', bottom: '-8%', right: '-3%', animationDelay: '1s' }} />
        <div className="absolute w-64 h-64 rounded-full opacity-10 animate-pulse" style={{ background: 'radial-gradient(circle, #06b6d4, transparent)', top: '40%', right: '20%', animationDelay: '2s' }} />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Learn Pulse</h1>
          <p className="text-slate-400 mt-2 text-sm">Welcome back! Sign in to continue learning.</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 shadow-2xl border" style={{ background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(20px)', borderColor: 'rgba(148, 163, 184, 0.1)' }}>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Error Alert */}
            {error && (
              <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200 text-sm"
                style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.15)' }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.15)'}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200 text-sm"
                  style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.15)' }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.15)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold text-white text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: loading ? 'rgba(59, 130, 246, 0.5)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
              }}
              onMouseEnter={(e) => { if (!loading) (e.target as HTMLElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'translateY(0)'; }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center mt-6 mb-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(148, 163, 184, 0.15)' }} />
            <span className="px-4 text-xs text-slate-500">New to Learn Pulse?</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(148, 163, 184, 0.15)' }} />
          </div>

          {/* Register Link */}
          <Link
            to="/register"
            className="block text-center py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200"
            style={{ color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.15)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)'; e.currentTarget.style.color = '#e2e8f0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.15)'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            Create an account
          </Link>

        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-xs text-slate-600">
          Secure login powered by JWT authentication
        </p>

      </div>
    </div>
  );
}
