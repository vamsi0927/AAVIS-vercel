import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, History, User, Scan, Activity, Bookmark, Settings, LogOut, Moon, Sun } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import logoImg from '../assets/logo.png';
import { toast } from 'sonner';

export function Sidebar({ className = '' }: { className?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, logout, theme, setTheme } = useAppContext();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
    toast.success('Signed out successfully.');
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    toast.success(`Switched to ${nextTheme === 'dark' ? 'Dark' : 'Light'} Mode!`);
  };

  const menuItems = [
    { to: '/home', icon: Home, label: 'Home' },
    { to: '/dashboard', icon: Activity, label: 'Health' },
    { to: '/scan', icon: Scan, label: 'Scan Label' },
    { to: '/history', icon: History, label: 'History' },
    { to: '/saved', icon: Bookmark, label: 'Saved Products' },
    { to: '/profile', icon: User, label: 'Profile' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className={`w-64 h-full bg-navy-800/60 backdrop-blur-xl border-r border-white/5 flex flex-col justify-between p-6 z-40 shrink-0 ${className}`}>
      <div className="flex flex-col gap-8">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2">
          <img src={logoImg} alt="Aavis Logo" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="text-xl font-display font-black text-white leading-none">
              Aavis
            </h1>
          </div>
        </div>

        {/* User Card */}
        {profile.name && (
          <div className="glass-card bg-white/3 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary text-sm font-bold">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate">{profile.name}</p>
              <p className="text-[10px] text-content-secondary uppercase tracking-widest font-semibold">
                {profile.diet || 'Standard Diet'}
              </p>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || 
              (item.to === '/scan' && location.pathname.startsWith('/scan')) ||
              (item.to === '/dashboard' && location.pathname.startsWith('/dashboard'));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/25 font-bold'
                    : 'text-content-secondary hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium text-content-secondary hover:text-white hover:bg-white/5 transition-all duration-200 w-full text-left"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-5 h-5 text-yellow-400" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-5 h-5 text-indigo-400" />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 w-full text-left"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
