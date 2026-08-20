import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { GraduationCap, Mail, Lock, ShieldAlert, ArrowRight, UserCheck, User, CheckSquare, Square } from 'lucide-react';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const passwordCriteria = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccess(location.state.successMessage);
      // Clear navigation state so the message doesn't persist on page refreshes
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isRegister) {
      if (!email || !password || !firstName || !lastName) {
        setError('Please fill in all fields');
        return;
      }
      if (!isPasswordValid) {
        setError('Password does not meet the complexity requirements.');
        return;
      }
    } else {
      if (!email || !password) {
        setError('Please fill in all fields');
        return;
      }
    }
    
    setError('');
    setSuccess('');
    setSubmitting(true);
    
    try {
      if (isRegister) {
        await api.post('/api/auth/register', {
          email,
          password,
          firstName,
          lastName,
          role: 'STUDENT'
        });
        navigate('/verify', { 
          state: { 
            email, 
            message: 'Account created successfully! An OTP verification code has been sent to your email.' 
          } 
        });
      } else {
        const user = await login(email, password);
        if (user.role === 'STUDENT') navigate('/student');
        else if (user.role === 'TEACHER') navigate('/teacher');
        else if (user.role === 'ADMIN') navigate('/admin');
        else navigate('/unauthorized');
      }
    } catch (err) {
      const errMsg = typeof err === 'string' ? err : err.response?.data?.message || err.message || 'Authentication failed';
      setError(errMsg);
      if (errMsg.includes('verify your email') || errMsg.includes('not verified')) {
        navigate('/verify', { 
          state: { 
            email, 
            message: 'Please enter the OTP verification code that was sent to your email.' 
          } 
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = (roleEmail) => {
    setIsRegister(false);
    setEmail(roleEmail);
    setPassword('password');
    setError('');
    setSuccess('');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-12 transition-colors duration-250">
      {/* Background glow graphics */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/10 blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/10 blur-3xl"></div>
      </div>
      
      <div className="relative w-full max-w-md bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-8 backdrop-blur-md transition-all">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 mb-4">
            <GraduationCap size={28} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {isRegister ? 'Register your student credentials to start learning' : 'Sign in to access your secure role-based dashboard'}
          </p>
        </div>

        {/* Success / Error Banners */}
        {error && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-sm mb-6" role="alert">
            <ShieldAlert size={18} className="shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl text-sm mb-6" role="alert">
            <UserCheck size={18} className="shrink-0" />
            <span className="font-semibold">{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegister && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  First Name
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 pl-11 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 pl-11 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 pl-11 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 pl-11 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {isRegister && (
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs transition-all">
                <span className="block font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Password Requirements:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                  {[
                    { key: 'minLength', label: 'Min 8 characters' },
                    { key: 'hasUpper', label: '1 uppercase letter' },
                    { key: 'hasLower', label: '1 lowercase letter' },
                    { key: 'hasNumber', label: '1 number' },
                    { key: 'hasSpecial', label: '1 special character' }
                  ].map((crit) => {
                    const met = passwordCriteria[crit.key];
                    return (
                      <div
                        key={crit.key}
                        className={`flex items-center gap-2 font-semibold transition-colors duration-200 ${
                          met ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-450 dark:text-slate-500'
                        }`}
                      >
                        {met ? (
                          <CheckSquare size={14} className="text-emerald-500 shrink-0" />
                        ) : (
                          <Square size={14} className="text-slate-400 dark:text-slate-650 shrink-0" />
                        )}
                        <span>{crit.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
            disabled={submitting}
          >
            <span>{submitting ? 'Processing...' : isRegister ? 'Register' : 'Sign In'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Toggle Account Action */}
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setSuccess('');
            }}
            className="text-indigo-600 dark:text-indigo-400 font-extrabold hover:underline focus:outline-none cursor-pointer"
          >
            {isRegister ? 'Sign In' : 'Create Student Account'}
          </button>
        </p>

        {/* Quick Credentials shortcut section */}
        {!isRegister && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 text-center mb-4">
              Quick Testing Accounts
            </span>
            <div className="space-y-2.5">
              <button
                onClick={() => handleQuickLogin('student@example.com')}
                className="flex items-center justify-between w-full px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <UserCheck size={14} className="text-indigo-500" />
                  <strong>Student Account</strong>
                </span>
                <span className="text-slate-400 dark:text-slate-500">student@example.com</span>
              </button>
              
              <button
                onClick={() => handleQuickLogin('teacher@example.com')}
                className="flex items-center justify-between w-full px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <UserCheck size={14} className="text-emerald-500" />
                  <strong>Teacher Account</strong>
                </span>
                <span className="text-slate-400 dark:text-slate-500">teacher@example.com</span>
              </button>

              <button
                onClick={() => handleQuickLogin('admin@example.com')}
                className="flex items-center justify-between w-full px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <UserCheck size={14} className="text-amber-500" />
                  <strong>Admin Account</strong>
                </span>
                <span className="text-slate-400 dark:text-slate-500">admin@example.com</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
