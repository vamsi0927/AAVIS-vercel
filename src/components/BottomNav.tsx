import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, History, User, Scan, Activity } from 'lucide-react';
export function BottomNav() {
  const navigate = useNavigate();
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-navy-800/90 backdrop-blur-md border-t border-navy-600 pb-safe pt-2 px-4 z-50">
      <div className="flex justify-between items-center pb-2 relative">
        <NavLink
          to="/home"
          className={({ isActive }) =>
          `flex flex-col items-center p-2 w-16 transition-colors ${isActive ? 'text-brand-primary' : 'text-content-secondary hover:text-content-primary'}`
          }>
          
          <Home className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Home</span>
        </NavLink>

        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
          `flex flex-col items-center p-2 w-16 transition-colors ${isActive ? 'text-brand-primary' : 'text-content-secondary hover:text-content-primary'}`
          }>
          
          <Activity className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Health</span>
        </NavLink>

        {/* Elevated Scan Button */}
        <div className="w-16 flex justify-center">
          <button
            onClick={() => navigate('/scan')}
            className="absolute -top-6 bg-brand-primary hover:bg-brand-primary/90 text-white p-4 rounded-full shadow-[0_4px_20px_rgba(99,102,241,0.5)] transition-transform active:scale-95 border-4 border-navy-900">
            
            <Scan className="w-7 h-7" />
          </button>
        </div>

        <NavLink
          to="/history"
          className={({ isActive }) =>
          `flex flex-col items-center p-2 w-16 transition-colors ${isActive ? 'text-brand-primary' : 'text-content-secondary hover:text-content-primary'}`
          }>
          
          <History className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">History</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
          `flex flex-col items-center p-2 w-16 transition-colors ${isActive ? 'text-brand-primary' : 'text-content-secondary hover:text-content-primary'}`
          }>
          
          <User className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Profile</span>
        </NavLink>
      </div>
    </div>);

}