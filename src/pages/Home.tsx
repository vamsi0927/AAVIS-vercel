import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scan,
  ChevronRight,
  Clock,
  Search as SearchIcon,
  Bell,
  Settings as SettingsIcon
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SAMPLE_PRODUCTS } from '../data/sampleProducts';
import { PersonalizedInsights } from '../components/PersonalizedInsights';
import { motion } from 'framer-motion';
import logoImg from '../assets/logo.png';

export function Home() {
  const navigate = useNavigate();
  const { profile, scans } = useAppContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const recentScans = scans.slice(0, 3);
  
  // Determine overall status based on recent verdicts
  let overallVerdict: 'safe' | 'caution' | 'hazardous' = 'safe';
  
  if (scans.length > 0) {
    const hazardousCount = scans.filter(s => s.verdict === 'hazardous').length;
    const cautionCount = scans.filter(s => s.verdict === 'caution').length;
    
    if (hazardousCount > 0 || cautionCount > scans.length / 2) {
      overallVerdict = 'hazardous';
    } else if (cautionCount > 0) {
      overallVerdict = 'caution';
    }
  }
  const greeting = profile.name ? `Hello, ${profile.name}` : 'Hello there';
  return (
    <div ref={containerRef} className="flex flex-col h-full bg-navy-900 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-brand-primary/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-20 left-0 w-72 h-72 bg-brand-secondary/5 rounded-full blur-[100px]" />

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 relative z-10">
        {/* Header */}
        <header className="pt-safe pt-8 px-6 pb-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="Aavis Logo" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-xl font-display font-black text-white leading-none mb-0.5">
                  Aavis
                </h1>
                <p className="text-[10px] text-content-secondary uppercase tracking-[0.15em] font-bold">
                  AI Nutritionist
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/search')}
                aria-label="Search"
                className="p-2.5 text-content-secondary hover:text-white rounded-xl bg-white/5 border border-white/5 transition-colors">
                <SearchIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/notifications')}
                aria-label="Notifications"
                className="p-2.5 text-content-secondary hover:text-white rounded-xl bg-white/5 border border-white/5 transition-colors">
                <Bell className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/settings')}
                aria-label="Settings"
                className="p-2.5 text-content-secondary hover:text-white rounded-xl bg-white/5 border border-white/5 transition-colors">
                <SettingsIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-4">
            <h2 className="text-2xl font-display font-bold text-white mb-1">
              {greeting} 👋
            </h2>
            <p className="text-content-secondary text-sm">
              Your daily health dashboard overview.
            </p>
          </div>
        </header>

        {/* Daily Status Card */}
        <div className="px-6 mb-6">
          <div className={`glass-card rounded-3xl p-5 border relative overflow-hidden flex flex-col ${
            overallVerdict === 'safe' ? 'border-brand-safe/20' :
            overallVerdict === 'caution' ? 'border-brand-caution/20' :
            'border-brand-hazardous/20'
          }`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-6 -mt-6" />

            <h3 className="text-[10px] font-bold text-content-secondary uppercase tracking-widest mb-3">
              Is this right for me?
            </h3>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-navy-900 border border-white/5 shadow-inner shrink-0">
                <span className="text-2xl">{scans[0]?.product?.imageEmoji || '🍽️'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-white truncate">
                  {scans[0]?.product?.name || 'Scan to Start'}
                </p>
                <p className="text-xs text-content-secondary line-clamp-2 mt-0.5 leading-relaxed">
                  {scans[0]?.dietAdvice || 'Check hidden ingredients & food score customized for your profile.'}
                </p>
              </div>
            </div>
            
            {scans.length > 0 && (
              <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
                <span className="text-[10px] text-content-secondary font-semibold uppercase tracking-wider">
                  Based on recent scan
                </span>
                <span className="text-[10px] text-brand-primary font-bold hover:underline cursor-pointer" onClick={() => navigate(`/result/${scans[0].id}`)}>
                  View Report
                </span>
              </div>
            )}
          </div>
        </div>


        {/* Personalized Insights */}
        <div className="px-6 mb-6">
          <PersonalizedInsights />
        </div>

        {/* New Quick Links */}
        <div className="px-6 mb-6">
          <button 
            onClick={() => navigate('/education/myths')}
            className="w-full glass-card glass-card-hover rounded-2xl p-4 flex items-center gap-3 text-left transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-lg">🤔</div>
            <div>
              <span className="text-sm font-bold text-white block">Discover Food Myths</span>
              <span className="text-xs text-content-secondary mt-0.5 block">Learn what's hidden on standard labels</span>
            </div>
            <ChevronRight className="w-5 h-5 text-content-secondary ml-auto" />
          </button>
        </div>

      {/* Recent Scans */}
      <div className="px-6 flex-1">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-lg font-display font-bold">Recent Scans</h3>
          {scans.length > 0 &&
          <button
            onClick={() => navigate('/history')}
            className="text-sm text-brand-primary font-medium flex items-center">
            
              See all <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          }
        </div>

        {scans.length === 0 ?
        <div className="bg-navy-800/50 rounded-2xl p-6 border border-navy-700/50 text-center border-dashed">
            <Clock className="w-8 h-8 text-navy-600 mx-auto mb-3" />
            <p className="text-content-secondary text-sm">No recent scans.</p>
          </div> :

        <div className="space-y-3">
            {recentScans.map((scan) => {
            const product = scan.product || SAMPLE_PRODUCTS.find(
              (p) => p.id === scan.productId
            );
            if (!product) return null;
            const date = new Date(scan.date);
            const isToday = date.toDateString() === new Date().toDateString();
            const dateStr = isToday ?
            'Today' :
            date.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric'
            });
            return (
              <button
                key={scan.id}
                onClick={() => navigate(`/result/${scan.id}`)}
                className="w-full bg-navy-800 hover:bg-navy-700 transition-colors rounded-2xl p-4 border border-navy-700 flex items-center gap-4 text-left">
                
                  <div className="w-12 h-12 bg-navy-900 rounded-xl flex items-center justify-center text-2xl border border-navy-600">
                    {product.imageEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-content-primary truncate">
                      {product.name}
                    </h4>
                    <p className="text-xs text-content-secondary truncate">
                      {product.brand} • {dateStr}
                    </p>
                  </div>
                    <span
                    className={`text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-md ${scan.verdict === 'safe' ? 'bg-brand-safe/20 text-brand-safe' : scan.verdict === 'caution' ? 'bg-brand-caution/20 text-brand-caution' : 'bg-brand-hazardous/20 text-brand-hazardous'}`}>
                    
                      {scan.verdict}
                    </span>
                </button>);

          })}
          </div>
        }
      </div>
      </div>

      {/* Floating AI Nutritionist Button */}
      <motion.button
        drag
        dragConstraints={containerRef}
        dragElastic={0.1}
        dragMomentum={false}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/dashboard/chat')}
        className="absolute bottom-28 right-6 z-50 w-14 h-14 bg-gradient-to-tr from-brand-primary to-purple-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)] border-2 border-white/10 touch-none cursor-grab active:cursor-grabbing"
      >
        <span className="text-2xl">🤖</span>
      </motion.button>
    </div>
  );
}