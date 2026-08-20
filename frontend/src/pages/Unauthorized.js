import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const Unauthorized = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (!user) {
      navigate('/login');
    } else {
      switch (user.role) {
        case 'STUDENT':
          navigate('/student');
          break;
        case 'TEACHER':
          navigate('/teacher');
          break;
        case 'ADMIN':
          navigate('/admin');
          break;
        default:
          navigate('/login');
      }
    }
  };

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 transition-colors duration-250 animate-fadeIn">
      {/* Background glow graphics */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[30%] left-[35%] w-[40vw] h-[40vw] rounded-full bg-rose-500/5 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-8 backdrop-blur-md transition-all text-center">
        {/* Shield Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 mb-6 animate-pulse">
          <ShieldAlert size={28} />
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Access Denied
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 mb-8 leading-relaxed">
          You do not have the required permissions to view this resource. This event has been logged for security audit purposes.
        </p>

        <button 
          onClick={handleGoBack} 
          className="flex items-center justify-center gap-2 w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3 px-6 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-md cursor-pointer focus:outline-none"
        >
          <ArrowLeft size={16} />
          <span>Return to Safety</span>
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;
