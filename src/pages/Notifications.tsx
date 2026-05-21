import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Bell,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Trash2,
  CheckCheck
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function Notifications() {
  const navigate = useNavigate();
  const { notifications, markNotificationAsRead, clearNotifications } = useAppContext();

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return { icon: AlertTriangle, bg: 'bg-brand-hazardous/15 border border-brand-hazardous/20', text: 'text-brand-hazardous' };
      case 'tip':
        return { icon: Lightbulb, bg: 'bg-brand-caution/15 border border-brand-caution/20', text: 'text-brand-caution' };
      case 'report':
        return { icon: TrendingUp, bg: 'bg-brand-primary/15 border border-brand-primary/20', text: 'text-brand-primary' };
      default:
        return { icon: Bell, bg: 'bg-brand-secondary/15 border border-brand-secondary/20', text: 'text-brand-secondary' };
    }
  };

  const handleMarkAllRead = () => {
    notifications.forEach(n => {
      if (!n.read) markNotificationAsRead(n.id);
    });
  };

  return (
    <div className="flex flex-col h-full bg-navy-900 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-20 right-0 w-72 h-72 bg-brand-secondary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <header className="pt-safe pt-6 px-4 pb-4 flex items-center justify-between bg-navy-900/90 backdrop-blur-md sticky top-0 z-20 border-b border-white/5">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-content-secondary hover:text-white rounded-xl bg-white/5 border border-white/5 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-black text-lg ml-3 text-white">Notifications</h1>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              title="Mark all as read"
              className="p-2 text-content-secondary hover:text-brand-primary rounded-xl bg-white/5 border border-white/5 transition-colors">
              <CheckCheck className="w-4 h-4" />
            </button>
            <button
              onClick={clearNotifications}
              title="Clear all notifications"
              className="p-2 text-content-secondary hover:text-red-400 rounded-xl bg-white/5 border border-white/5 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-3 relative z-10">
        {notifications.length === 0 ? (
          <div className="text-center py-20 bg-white/5 border border-white/5 rounded-3xl p-8 glass-card">
            <Bell className="w-12 h-12 text-content-secondary mx-auto mb-3 opacity-60" />
            <p className="text-content-secondary font-bold text-sm">All caught up!</p>
            <p className="text-xs text-content-secondary mt-1 max-w-[200px] mx-auto">
              No new alerts or tips. Scan packages to discover ingredient insights.
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            const { icon: Icon, bg, text } = getIcon(n.type);
            return (
              <div
                key={n.id}
                onClick={() => markNotificationAsRead(n.id)}
                className={`glass-card border rounded-2xl p-4 flex gap-4 transition-all hover:bg-white/5 cursor-pointer ${n.read ? 'border-white/5 opacity-70' : 'border-brand-primary/20 glow-purple/5'}`}>
                
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                  <Icon className={`w-5 h-5 ${text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h4 className="font-bold text-sm text-content-primary flex items-center gap-1.5">
                      {n.title}
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-brand-primary inline-block shrink-0 animate-pulse" />
                      )}
                    </h4>
                    <span className="text-[10px] text-content-secondary font-semibold flex-shrink-0">
                      {n.time}
                    </span>
                  </div>
                  <p className="text-xs text-content-secondary leading-relaxed">
                    {n.body}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}