import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scan,
  ChevronRight,
  Clock,
  Search as SearchIcon,

  Settings as SettingsIcon,
  Sparkles,
  ScanLine,
  ArrowRight,
  Activity,
  Search,
  ShieldCheck,
  Heart,
  AlertTriangle,
  Image as ImageIcon,
  Camera
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SAMPLE_PRODUCTS } from '../data/sampleProducts';
import { PersonalizedInsights } from '../components/PersonalizedInsights';
import { motion, AnimatePresence } from 'framer-motion';
import logoImg from '../assets/logo.png';


export function Home() {
  const navigate = useNavigate();
  const { profile, scans } = useAppContext();
  const [showPermModal, setShowPermModal] = useState(false);

  useEffect(() => {
    const checkWebPermissions = () => {
      try {
        const seen = localStorage.getItem('aavis_perms_requested');
        if (!seen) {
          setTimeout(() => setShowPermModal(true), 800);
        }
      } catch (_) {}
    };
    checkWebPermissions();
  }, []);

  const handleAllowWebPermissions = async () => {
    localStorage.setItem('aavis_perms_requested', '1');
    setShowPermModal(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.warn('Camera access request denied or failed:', err);
    }
  };

  const handleDenyWebPermissions = () => {
    localStorage.setItem('aavis_perms_requested', '1');
    setShowPermModal(false);
  };
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const recentScans = scans.slice(0, 2);
  
  // Calculate dynamic stats
  const totalScans = scans.length;
  const avgScore = totalScans > 0
    ? Math.round(scans.reduce((acc, s) => acc + s.score, 0) / totalScans)
    : 0;

  let streak = 0;
  if (scans.length > 0) {
    const dates = scans.map(s => new Date(s.date).toDateString());
    const uniqueDates = Array.from(new Set(dates)).map(d => new Date(d));
    uniqueDates.sort((a, b) => b.getTime() - a.getTime());
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (dates.includes(today) || dates.includes(yesterday)) {
      streak = 1;
      let current = uniqueDates[0];
      for (let i = 1; i < uniqueDates.length; i++) {
        const diffDays = Math.ceil(Math.abs(current.getTime() - uniqueDates[i].getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streak++;
          current = uniqueDates[i];
        } else {
          break;
        }
      }
    }
  }

  const hazardousCount = scans.filter(s => s.verdict === 'hazardous').length;

  // Determine overall status based on recent verdicts
  let overallVerdict: 'safe' | 'caution' | 'hazardous' = 'safe';
  
  if (scans.length > 0) {
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

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 relative z-10">
        {/* Header */}
        <header className="pt-safe pt-8 px-6 pb-6 md:max-w-7xl md:mx-auto md:w-full md:px-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="Aavis Logo" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-xl font-display font-black text-white leading-none">
                  Aavis
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button data-testid='btn-home-2'
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
              Scan, analyze, and make healthier choices today.
            </p>
          </div>
        </header>
        
        {/* SaaS Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 md:px-8 md:max-w-7xl md:mx-auto md:w-full mb-6">
          <div className="glass-card rounded-2xl p-4 border border-white/5 bg-navy-800/40">
            <span className="text-[10px] text-content-secondary uppercase tracking-widest font-bold block">Average Score</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-2xl font-black ${avgScore >= 75 ? 'text-brand-safe' : avgScore >= 40 ? 'text-brand-caution' : 'text-brand-hazardous'}`}>
                {avgScore}
              </span>
              <span className="text-xs text-content-secondary">/ 100</span>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-4 border border-white/5 bg-navy-800/40">
            <span className="text-[10px] text-content-secondary uppercase tracking-widest font-bold block">Daily Streak</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-orange-400">{streak}</span>
              <span className="text-xs text-content-secondary font-semibold">days 🔥</span>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-4 border border-white/5 bg-navy-800/40">
            <span className="text-[10px] text-content-secondary uppercase tracking-widest font-bold block">Total Scans</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-brand-primary">{totalScans}</span>
              <span className="text-xs text-content-secondary font-semibold">products</span>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-4 border border-white/5 bg-navy-800/40">
            <span className="text-[10px] text-content-secondary uppercase tracking-widest font-bold block">Hazardous Flagged</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-brand-hazardous">{hazardousCount}</span>
              <span className="text-xs text-content-secondary font-semibold">avoided ⚠️</span>
            </div>
          </div>
        </div>

        <div className="md:grid md:grid-cols-12 md:gap-8 md:max-w-7xl md:mx-auto md:w-full md:px-8">
          
          {/* Left Column: Daily Status Card & Insights */}
          <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-6 mb-6 md:mb-0">
            {/* Daily Status Card */}
            <div className="px-6 md:px-0">
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
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-navy-900 border border-white/5 shadow-inner shrink-0 overflow-hidden">
                    {scans[0]?.product?.imageUrl ? (
                      <img src={scans[0].product.imageUrl} alt={scans[0].product.name} className="w-full h-full object-cover" />
                    ) : (
                      scans[0]?.product?.imageEmoji ? (
                        <span className="text-2xl">{scans[0].product.imageEmoji}</span>
                      ) : (
                        <ImageIcon className="w-6 h-6 text-content-secondary/50" />
                      )
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-white break-words whitespace-normal">
                      {scans[0]?.product?.name || 'Scan to Start'}
                    </p>
                    <p className="text-xs text-content-secondary break-words whitespace-normal mt-0.5 leading-relaxed">
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

            {/* New Quick Links */}
            <div className="px-6 md:px-0">
              <h3 className="text-lg font-display font-bold mb-4 hidden md:block">Quick Tools</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-3">
                <button data-testid='btn-home-3' 
                  onClick={() => navigate('/education/myths')}
                  className="w-full glass-card glass-card-hover rounded-2xl p-4 flex items-center gap-3 text-left transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-lg shrink-0">🤔</div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-bold text-white block break-words whitespace-normal">Discover Food Myths</span>
                    <span className="text-xs text-content-secondary mt-0.5 block break-words whitespace-normal">Learn what's hidden on standard labels</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-content-secondary ml-auto shrink-0" />
                </button>

                <button data-testid='btn-home-4' 
                  onClick={() => navigate('/dashboard/water')}
                  className="w-full glass-card glass-card-hover rounded-2xl p-4 flex items-center gap-3 text-left transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-lg shrink-0">💧</div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-bold text-white block break-words whitespace-normal">Water Tracker</span>
                    <span className="text-xs text-content-secondary mt-0.5 block break-words whitespace-normal">Log and track daily hydration</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-content-secondary ml-auto shrink-0" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Quick Links & Recent Scans */}
          <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-6">
            {/* Recent Scans (Moved from Left Column) */}
            <div className="px-6 md:px-0">
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-lg font-display font-bold">Recent Scans</h3>
                {scans.length > 0 &&
                <button data-testid='btn-home-5'
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

              <div className="grid grid-cols-1 gap-3">
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
                    <button data-testid='btn-home-6'
                      key={scan.id}
                      onClick={() => navigate(`/result/${scan.id}`)}
                      className="w-full bg-navy-800 hover:bg-navy-700 transition-colors rounded-2xl p-4 border border-navy-700 flex items-center gap-4 text-left">
                      
                        <div className="w-12 h-12 bg-navy-900 rounded-xl flex items-center justify-center text-2xl border border-navy-600 overflow-hidden shrink-0">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          ) : product.imageEmoji ? (
                            <span className="text-2xl">{product.imageEmoji}</span>
                          ) : (
                            <ImageIcon className="w-6 h-6 text-content-secondary/50" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-content-primary break-words whitespace-normal">
                            {product.name}
                          </h4>
                          <p className="text-xs text-content-secondary break-words whitespace-normal">
                            {product.brand} • {dateStr}
                          </p>
                        </div>
                          <span
                          className={`text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-md shrink-0 whitespace-nowrap ${scan.verdict === 'safe' ? 'bg-brand-safe/20 text-brand-safe' : scan.verdict === 'caution' ? 'bg-brand-caution/20 text-brand-caution' : 'bg-brand-hazardous/20 text-brand-hazardous'}`}>
                          
                            {scan.verdict}
                          </span>
                      </button>);

                })}
                </div>
              }
            </div>



          </div>

      </div>

      <AnimatePresence>
        {showPermModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-navy-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-navy-900 border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-2xl -mr-8 -mt-8" />
              
              <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-5 mx-auto border border-brand-primary/20">
                <span className="text-3xl">📸</span>
              </div>

              <h3 className="text-xl font-display font-black text-white text-center mb-2">
                Allow Access
              </h3>
              <p className="text-content-secondary text-sm text-center mb-6 leading-relaxed">
                AAVIS needs access to your camera and file library to scan food ingredients and nutrition labels.
              </p>

              <div className="space-y-4 mb-6">
                <div className="flex gap-4 items-start p-3 bg-white/5 rounded-2xl border border-white/5">
                  <div className="p-2 bg-brand-safe/10 rounded-xl text-brand-safe shrink-0 border border-brand-safe/20">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white leading-tight">Camera</h4>
                    <p className="text-[11px] text-content-secondary mt-0.5">Scan food labels in real time using your camera.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start p-3 bg-white/5 rounded-2xl border border-white/5">
                  <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary shrink-0 border border-brand-primary/20">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white leading-tight">Gallery / Files</h4>
                    <p className="text-[11px] text-content-secondary mt-0.5">Upload existing screenshots or photos of food labels.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleAllowWebPermissions}
                  className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg transition-colors text-sm"
                >
                  Allow Access
                </button>
                <button
                  onClick={handleDenyWebPermissions}
                  className="w-full bg-transparent hover:bg-white/5 text-content-secondary hover:text-white font-bold py-3.5 px-4 rounded-2xl transition-colors text-sm"
                >
                  Deny
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
  );
}