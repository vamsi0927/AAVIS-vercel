import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, LayoutGrid, Calendar, Settings, FileText, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

export function WeeklyReport() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-navy-900 pb-24">
      <header className="pt-safe pt-6 px-4 pb-4 flex items-center border-b border-navy-800 bg-navy-900/90 backdrop-blur-md sticky top-0 z-20">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-content-secondary hover:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display font-bold text-lg ml-2">Weekly Summary</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6">
        
        <div className="mb-6">
          <p className="text-content-secondary text-sm">Oct 16 - Oct 22</p>
          <h2 className="text-2xl font-display font-bold text-white mt-1">Your Health Wrap-up</h2>
        </div>

        {/* Big AI Summary Card */}
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-[#2d2d4e] rounded-3xl p-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl"></div>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center border border-brand-primary/30 text-brand-primary">
              <SparklesIcon />
            </div>
            <h3 className="font-bold text-white">AI Health Assessment</h3>
          </div>
          
          <p className="text-sm text-content-primary/90 leading-relaxed">
            You've had a great week! Your sodium intake dropped by 15% compared to last week. However, you scanned 3 products containing <span className="text-brand-hazardous font-medium">Tartrazine (E102)</span>. Try to swap those out for natural alternatives next week.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-navy-800 border border-navy-700 rounded-2xl p-4">
            <div className="text-content-secondary text-xs uppercase tracking-wider mb-2 font-medium">Items Scanned</div>
            <div className="text-3xl font-display font-bold text-white">24</div>
            <div className="text-xs text-brand-safe mt-1">↑ 12% vs last week</div>
          </div>
          <div className="bg-navy-800 border border-navy-700 rounded-2xl p-4">
            <div className="text-content-secondary text-xs uppercase tracking-wider mb-2 font-medium">Average Score</div>
            <div className="text-3xl font-display font-bold text-brand-safe">78</div>
            <div className="text-xs text-brand-safe mt-1">↑ 5 pts vs last week</div>
          </div>
          <div className="bg-navy-800 border border-navy-700 rounded-2xl p-4">
            <div className="text-content-secondary text-xs uppercase tracking-wider mb-2 font-medium">Hazards Avoided</div>
            <div className="text-3xl font-display font-bold text-brand-primary">7</div>
            <div className="text-xs text-content-secondary mt-1">Great job!</div>
          </div>
          <div className="bg-navy-800 border border-navy-700 rounded-2xl p-4">
            <div className="text-content-secondary text-xs uppercase tracking-wider mb-2 font-medium">Sugar Intake</div>
            <div className="text-3xl font-display font-bold text-brand-caution">High</div>
            <div className="text-xs text-brand-caution mt-1">Watch out</div>
          </div>
        </div>

        {/* Top Additives Found */}
        <h3 className="text-sm font-medium text-content-secondary uppercase tracking-wider mb-4 pl-1">
          Most Consumed Additives
        </h3>
        <div className="bg-navy-800 border border-navy-700 rounded-2xl overflow-hidden mb-8">
          {[
            { code: 'E330', name: 'Citric Acid', count: 12, hazard: 'safe' },
            { code: 'E621', name: 'MSG', count: 5, hazard: 'caution' },
            { code: 'E102', name: 'Tartrazine', count: 3, hazard: 'hazardous' },
          ].map((item, i) => (
            <div key={i} className="p-4 flex items-center justify-between border-b border-navy-700 last:border-0">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  item.hazard === 'safe' ? 'bg-brand-safe/20 text-brand-safe' : 
                  item.hazard === 'caution' ? 'bg-brand-caution/20 text-brand-caution' : 
                  'bg-brand-hazardous/20 text-brand-hazardous'
                }`}>{item.code}</span>
                <span className="font-medium text-sm text-white">{item.name}</span>
              </div>
              <span className="text-xs text-content-secondary font-medium">{item.count} items</span>
            </div>
          ))}
        </div>

        <button className="w-full bg-navy-800 hover:bg-navy-700 text-white rounded-xl py-4 font-medium border border-navy-700 transition-colors">
          Share Report
        </button>
      </div>
    </div>
  );
}

// Simple local component for the icon to avoid adding it to the main imports if it's missing
function SparklesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  );
}
