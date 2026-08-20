import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Menu, X, Sun, Moon, LogOut, GraduationCap, BookOpen, Shield, LayoutDashboard, MessageSquare } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const SidebarLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const closeBtnRef = useRef(null);

  // Close mobile sidebar on route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Handle ESC key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  // Focus close button when mobile drawer expands
  useEffect(() => {
    if (mobileOpen && closeBtnRef.current) {
      closeBtnRef.current.focus();
    }
  }, [mobileOpen]);

  if (!user || location.pathname === '/login') return <>{children}</>;

  const getDashboardPath = () => {
    if (user.role === 'STUDENT') return '/student';
    if (user.role === 'TEACHER') return '/teacher';
    if (user.role === 'ADMIN') return '/admin';
    return '/';
  };

  const getRoleIcon = () => {
    switch (user.role) {
      case 'ADMIN':
        return <Shield size={14} className="text-amber-500" />;
      case 'TEACHER':
        return <BookOpen size={14} className="text-emerald-500" />;
      default:
        return <GraduationCap size={14} className="text-indigo-500" />;
    }
  };

  const getInitials = () => {
    const first = user.firstName ? user.firstName.charAt(0) : '';
    const last = user.lastName ? user.lastName.charAt(0) : '';
    return (first + last).toUpperCase() || 'U';
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      path: getDashboardPath(),
      icon: <LayoutDashboard size={20} />
    }
  ];

  if (user && (user.role === 'STUDENT' || user.role === 'TEACHER')) {
    navigationItems.push({
      name: 'Materials',
      path: '/materials',
      icon: <BookOpen size={20} />
    });
    navigationItems.push({
      name: 'Chat & Doubts',
      path: '/chat',
      icon: <MessageSquare size={20} />
    });
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 border-r border-slate-800 dark:bg-slate-950 dark:border-slate-900">
      {/* Brand Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-800 dark:border-slate-900">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
             Santhosh
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest -mt-0.5">
               CoursesManagement
            </p>
          </div>
        </div>
        <button
          ref={closeBtnRef}
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* User profile details */}
      <div className="p-6 border-b border-slate-800 dark:border-slate-900 bg-slate-900/50 dark:bg-slate-950/50">
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-extrabold flex items-center justify-center shrink-0">
            {getInitials()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold truncate text-white">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider
            ${user.role === 'ADMIN' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
              user.role === 'TEACHER' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
              'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
            }`}
          >
            {getRoleIcon()}
            <span>{user.role}</span>
          </span>

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 dark:bg-slate-900 dark:hover:bg-slate-850 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      {/* Main navigation list */}
      <nav className="flex-1 px-4 py-6 space-y-1.5" aria-label="Main Navigation">
        {navigationItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.name}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500
                ${isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 dark:hover:bg-slate-900/60'
                }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout Trigger */}
      <div className="p-4 border-t border-slate-800 dark:border-slate-900">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-250">
      
      {/* Mobile Top Header */}
      <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800 dark:bg-slate-950 dark:border-slate-900 shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <GraduationCap size={24} className="text-indigo-400" />
          <span className="font-extrabold tracking-tight">Santhosh</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -mr-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-expanded={mobileOpen}
          aria-label="Open navigation menu"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* Mobile Sidebar overlay */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!mobileOpen}
      >
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" 
          onClick={() => setMobileOpen(false)}
        />
        
        <aside 
          className={`fixed inset-y-0 left-0 w-80 max-w-[85vw] z-50 transition-transform duration-300 ease-out ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <SidebarContent />
        </aside>
      </div>

      {/* Desktop Permanent Side panel */}
      <aside className="hidden lg:block w-72 shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Page Content area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default SidebarLayout;
