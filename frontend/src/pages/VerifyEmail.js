import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { Key, Lock, ShieldAlert, ArrowRight, UserCheck, RefreshCw } from 'lucide-react';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve initial values from router state
  const initialEmail = location.state?.email || '';
  const initialMessage = location.state?.message || 'Please enter the verification code sent to your email.';

  const [email, setEmail] = useState(initialEmail);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(initialMessage);
  const [submitting, setSubmitting] = useState(false);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your email address');
      return;
    }
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await api.post('/api/auth/verify-otp', {
        email,
        otp: otpCode
      });
      
      // Navigate back to login page on success and display a status message
      navigate('/login', { 
        state: { 
          successMessage: res.data.message || 'Email verified successfully! Please sign in with your password.' 
        } 
      });
    } catch (err) {
      setError(typeof err === 'string' ? err : err.response?.data?.message || err.message || 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setError('Please enter your email address to resend the code');
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await api.post('/api/auth/resend-otp', { email });
      setSuccess(res.data.message || 'A new verification code has been sent!');
    } catch (err) {
      setError(typeof err === 'string' ? err : err.response?.data?.message || err.message || 'Failed to resend code');
    } finally {
      setSubmitting(false);
    }
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
            <Key size={28} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Verify Your Email
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Confirm your identity by entering the 6-digit OTP verification code.
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
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          {/* Email input field - editable if not provided in routing state */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Email Address
            </label>
            <input
              type="email"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!initialEmail}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Verification Code (6-digit OTP)
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                maxLength={6}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 pl-11 text-center font-mono text-lg tracking-[0.5em] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
            disabled={submitting}
          >
            <span>{submitting ? 'Verifying...' : 'Verify Email'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 mt-6">
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={submitting}
            className="flex items-center justify-center gap-2 w-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer text-sm"
          >
            <RefreshCw size={16} className={submitting ? 'animate-spin' : ''} />
            <span>Resend Verification Code</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-center text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer focus:outline-none mt-2"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
