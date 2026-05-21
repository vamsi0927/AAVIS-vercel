import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, RefreshCw, Zap, BookOpen, AlertCircle } from 'lucide-react';
import { generateEducationalContent, FoodMythData } from '../../lib/geminiAnalysis';
import { motion, AnimatePresence } from 'framer-motion';

export function FoodMyths() {
  const navigate = useNavigate();
  const [mythData, setMythData] = useState<FoodMythData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFact = async () => {
    setIsLoading(true);
    try {
      const result = await generateEducationalContent();
      setMythData(result);
    } catch (err) {
      setMythData({
        myth: "Is sea salt healthier than table salt?",
        fact: "No, sea salt and table salt contain the same amount of sodium by weight. Table salt is just more refined."
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFact();
  }, []);

  return (
    <div className="flex flex-col h-full bg-navy-900 pb-24 relative overflow-hidden">
      {/* Background ambient glowing blobs */}
      <div className="absolute top-[-10%] left-[-20%] w-[80vw] h-[80vw] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-20%] w-[80vw] h-[80vw] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <header className="pt-safe pt-6 px-4 pb-4 flex items-center justify-between border-b border-white/5 sticky top-0 bg-navy-900/90 backdrop-blur-md z-20">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-content-secondary hover:text-white transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-display font-bold text-lg ml-2 text-white">Myths vs Facts</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 flex flex-col items-center justify-center relative z-10">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-brand-primary/20"></div>
                <div className="absolute inset-0 rounded-full border-t-2 border-brand-primary animate-spin"></div>
                <Zap className="w-8 h-8 text-brand-primary animate-pulse" />
              </div>
              <p className="text-content-secondary font-semibold text-sm">AI is debunking a myth...</p>
            </motion.div>
          ) : (
            mythData && (
              <motion.div 
                key="content"
                initial={{ opacity: 0, y: 20, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-md glass-card backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-[0_0_50px_rgba(99,102,241,0.15)] relative overflow-hidden"
              >
                {/* Glowing subtle card core */}
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-brand-primary/20 rounded-full blur-[40px] pointer-events-none"></div>

                <div className="flex items-center gap-2 mb-6">
                  <span className="bg-brand-primary/20 border border-brand-primary/30 text-brand-primary text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> AI Fact Check
                  </span>
                </div>

                {/* The Myth */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-hazardous flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> Commonly Believed Myth
                  </span>
                  <h2 className="text-2xl font-display font-extrabold text-white leading-snug">
                    {mythData.myth}
                  </h2>
                </div>

                {/* Glowing Laser Divider */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-brand-primary/50 to-transparent my-6" />

                {/* The Fact / Debunking */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-safe flex items-center gap-1">
                    🟢 The Reality
                  </span>
                  <div className="text-base text-content-primary/95 leading-relaxed font-semibold bg-white/5 rounded-2xl p-5 border border-white/5 shadow-inner">
                    {mythData.fact}
                  </div>
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>

        <button 
          onClick={fetchFact}
          disabled={isLoading}
          className="mt-8 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-full px-8 py-4 font-bold flex items-center gap-2.5 shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/40 transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          Bust Next Myth
        </button>
      </div>
    </div>
  );
}
