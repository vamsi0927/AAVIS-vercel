import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, User, Scan, Activity, BookOpen, History } from 'lucide-react';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-navy-800/90 backdrop-blur-md border-t border-navy-600 pb-safe pt-2 px-2 z-50">
      <div className="flex justify-between items-center pb-2 relative max-w-md mx-auto">
        <NavLink
          to="/home"
          className={({ isActive }) =>
          `flex flex-col items-center p-2 flex-1 transition-colors ${isActive ? 'text-brand-primary' : 'text-content-secondary hover:text-content-primary'}`
          }>
          <Home className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium hidden sm:block">Home</span>
        </NavLink>

        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
          `flex flex-col items-center p-2 flex-1 transition-colors ${isActive ? 'text-brand-primary' : 'text-content-secondary hover:text-content-primary'}`
          }>
          <Activity className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium hidden sm:block">Health</span>
        </NavLink>

        {/* Elevated Scan Button with History Tab underneath */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <div className="absolute -top-10">
            <button
              onClick={() => navigate('/scan')}
              className={`bg-brand-primary hover:bg-brand-primary/90 text-white p-3 rounded-full shadow-[0_4px_20px_rgba(99,102,241,0.5)] transition-transform active:scale-95 ${location.pathname === '/scan' ? 'scale-110' : ''}`}>
              <Scan className="w-6 h-6" />
            </button>
          </div>
          <NavLink
            to="/history"
            className={({ isActive }) =>
            `flex flex-col items-center p-2 w-full transition-colors ${isActive ? 'text-brand-primary' : 'text-content-secondary hover:text-content-primary'}`
            }>
            <History className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium hidden sm:block">History</span>
          </NavLink>
        </div>

        <NavLink
          to="/education"
          className={({ isActive }) =>
          `flex flex-col items-center p-2 flex-1 transition-colors ${isActive ? 'text-brand-primary' : 'text-content-secondary hover:text-content-primary'}`
          }>
          <BookOpen className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium hidden sm:block">Learn</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
          `flex flex-col items-center p-2 flex-1 transition-colors ${isActive ? 'text-brand-primary' : 'text-content-secondary hover:text-content-primary'}`
          }>
          <User className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium hidden sm:block">Profile</span>
        </NavLink>
      </div>
    </div>
  );
}