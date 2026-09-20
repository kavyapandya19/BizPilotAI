import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Sparkles, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const res = await login(email, password);

    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl p-8 rounded-2xl z-10 relative">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center shadow-md">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-0">Welcome Back</h1>
          </div>
          <p className="text-slate-500">Sign in to your AI business pilot</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm text-center shadow-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Mail className="h-4 w-4 text-slate-500" />
              <span>Email Address</span>
            </label>

            <div className="relative">

              <input
                type="email"
                required
                className="input-field pl-12 pr-4"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Lock className="h-4 w-4 text-slate-500" />
              <span>Password</span>
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="input-field pl-12 pr-12"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute inset-y-0 right-2 flex w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-brand-500/30"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="flex justify-end mt-2">
              <a
                href="#"
                className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                Forgot password?
              </a>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>


        <div className="mt-8 text-center text-sm text-slate-500">
          Don't have an account? <a href="#" className="text-brand-600 hover:text-brand-700 font-medium transition-colors">Request access</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
