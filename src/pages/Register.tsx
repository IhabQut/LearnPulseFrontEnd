import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Eye, EyeOff, UserPlus, Sparkles, GraduationCap, BookOpenCheck } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { user, register, loading, error, clearError } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'professor'>('student');
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
    const success = await register(name, email, password, role);
    if (success) navigate('/', { replace: true });
  };

  const isFormValid = name.trim().length > 0 && email.includes('@') && password.length >= 6;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>

      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 rounded-full opacity-20 animate-pulse" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', top: '-10%', right: '-5%' }} />
        <div className="absolute w-80 h-80 rounded-full opacity-15 animate-pulse" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', bottom: '-8%', left: '-3%', animationDelay: '1s' }} />
        <div className="absolute w-64 h-64 rounded-full opacity-10 animate-pulse" style={{ background: 'radial-gradient(circle, #10b981, transparent)', top: '50%', left: '15%', animationDelay: '2s' }} />
      </div>

      {/* Register Card */}
      <div className="relative z-10 w-full max-w-md mx-4">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Join Learn Pulse</h1>
          <p className="text-slate-400 mt-2 text-sm">Create your account and start your journey.</p>
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

            {/* Role Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    background: role === 'student' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(15, 23, 42, 0.4)',
                    border: role === 'student' ? '1.5px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(148, 163, 184, 0.1)',
                    color: role === 'student' ? '#93c5fd' : '#94a3b8',
                  }}
                >
                  <GraduationCap className="w-6 h-6" />
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('professor')}
                  className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    background: role === 'professor' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(15, 23, 42, 0.4)',
                    border: role === 'professor' ? '1.5px solid rgba(139, 92, 246, 0.5)' : '1px solid rgba(148, 163, 184, 0.1)',
                    color: role === 'professor' ? '#c4b5fd' : '#94a3b8',
                  }}
                >
                  <BookOpenCheck className="w-6 h-6" />
                  Professor
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="register-name" className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
              <input
                id="register-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                maxLength={100}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200 text-sm"
                style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.15)' }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.15)'}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="register-email" className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <input
                id="register-email"
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
              <label htmlFor="register-password" className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
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
              {password.length > 0 && password.length < 6 && (
                <p className="mt-1.5 text-xs" style={{ color: '#f87171' }}>Password must be at least 6 characters</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold text-white text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: loading ? 'rgba(139, 92, 246, 0.5)' : 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
              }}
              onMouseEnter={(e) => { if (!loading) (e.target as HTMLElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'translateY(0)'; }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create Account
                </>
              )}
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center mt-6 mb-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(148, 163, 184, 0.15)' }} />
            <span className="px-4 text-xs text-slate-500">Already have an account?</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(148, 163, 184, 0.15)' }} />
          </div>

          {/* Login Link */}
          <Link
            to="/login"
            className="block text-center py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200"
            style={{ color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.15)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)'; e.currentTarget.style.color = '#e2e8f0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.15)'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            Sign in instead
          </Link>

        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-xs text-slate-600">
          Your data is encrypted and securely stored
        </p>

      </div>
    </div>
  );
}
