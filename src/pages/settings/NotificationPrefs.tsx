import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
const PREFS = [
  {
    key: 'dailyTips' as const,
    label: 'Daily Tips',
    desc: 'Get a healthy eating tip every morning'
  },
  {
    key: 'scanReminders' as const,
    label: 'Scan Reminders',
    desc: 'Reminders to scan products before buying'
  },
  {
    key: 'productAlerts' as const,
    label: 'Product Alerts',
    desc: 'Alerts when a recall affects a product you scanned'
  },
  {
    key: 'weeklyReport' as const,
    label: 'Weekly Health Summary',
    desc: 'Receive your diagnostic report digest at the end of the week'
  },
  {
    key: 'mealReminders' as const,
    label: 'Meal Time Alerts',
    desc: 'Get reminders to log hydration and monitor snacks'
  },
  {
    key: 'healthAlerts' as const,
    label: 'Critical Ingredient Warnings',
    desc: 'Instant notifications when high-hazard ingredients match your conditions'
  }
];

export function NotificationPrefsSettings() {
  const navigate = useNavigate();
  const { notificationPrefs, updateNotificationPrefs } = useAppContext();
  const toggle = (key: keyof typeof notificationPrefs) => {
    updateNotificationPrefs({
      ...notificationPrefs,
      [key]: !notificationPrefs[key]
    });
  };
  return (
    <div className="flex flex-col h-full bg-navy-900 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-20 right-0 w-72 h-72 bg-brand-secondary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <header className="pt-safe pt-6 px-4 pb-4 flex items-center bg-navy-900/90 backdrop-blur-md sticky top-0 z-20 border-b border-white/5">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-content-secondary hover:text-white rounded-xl bg-white/5 border border-white/5 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-black text-lg ml-3 text-white">Notification Preferences</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 relative z-10">
        <div className="glass-card border border-white/5 rounded-3xl overflow-hidden shadow-lg">
          {PREFS.map((pref, idx) => {
            const isOn = notificationPrefs[pref.key];
            return (
              <div
                key={pref.key}
                onClick={() => toggle(pref.key)}
                className={`flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors ${idx !== PREFS.length - 1 ? 'border-b border-white/5' : ''}`}>
                
                <div className="flex-1 pr-4">
                  <h3 className="font-bold text-sm text-content-primary">{pref.label}</h3>
                  <p className="text-xs text-content-secondary mt-1 leading-relaxed">
                    {pref.desc}
                  </p>
                </div>
                <div
                  className={`w-12 h-6 rounded-full p-1 transition-colors flex-shrink-0 ${isOn ? 'bg-brand-primary' : 'bg-navy-900 border border-white/5'}`}>
                  
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${isOn ? 'translate-x-6' : 'translate-x-0'}`} />
                  
                </div>
              </div>);

          })}
        </div>
      </div>
    </div>);
}