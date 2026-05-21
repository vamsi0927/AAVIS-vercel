import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Droplets, Plus, Minus, Trophy, GlassWater } from 'lucide-react';
import { motion } from 'framer-motion';

export function WaterTracker() {
  const navigate = useNavigate();
  const [glasses, setGlasses] = useState(3);
  const goal = 8;
  const percentage = Math.min(100, (glasses / goal) * 100);

  const handleAdd = () => {
    setGlasses(prev => prev + 1);
  };

  const handleRemove = () => {
    setGlasses(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="flex flex-col h-full bg-navy-900 pb-24">
      <header className="pt-safe pt-6 px-4 pb-4 flex items-center border-b border-navy-800">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-content-secondary hover:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display font-bold text-lg ml-2">Hydration</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-8 flex flex-col items-center">
        
        {/* Progress Ring */}
        <div className="relative w-64 h-64 mb-10 flex justify-center items-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              className="text-navy-800 stroke-current"
              strokeWidth="8"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
            ></circle>
            <motion.circle
              className="text-blue-500 stroke-current"
              strokeWidth="8"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              initial={{ strokeDasharray: "251.2", strokeDashoffset: "251.2" }}
              animate={{ strokeDashoffset: 251.2 - (251.2 * percentage) / 100 }}
              transition={{ duration: 1, ease: "easeOut" }}
            ></motion.circle>
          </svg>
          
          <div className="absolute flex flex-col items-center justify-center text-center">
            <Droplets className="w-8 h-8 text-blue-500 mb-2" />
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-display font-bold text-white">{glasses}</span>
              <span className="text-xl text-content-secondary">/ {goal}</span>
            </div>
            <span className="text-xs text-content-secondary uppercase tracking-widest mt-1">Glasses</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 mb-12">
          <button
            onClick={handleRemove}
            disabled={glasses === 0}
            className="w-14 h-14 rounded-full bg-navy-800 border border-navy-700 flex items-center justify-center text-white disabled:opacity-50 disabled:active:scale-100 transition-transform active:scale-95"
          >
            <Minus className="w-6 h-6" />
          </button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAdd}
            className="w-20 h-20 rounded-full bg-blue-500 hover:bg-blue-400 flex items-center justify-center text-white shadow-[0_0_30px_rgba(59,130,246,0.4)] border-4 border-navy-900"
          >
            <Plus className="w-8 h-8" />
          </motion.button>

          <button
            onClick={() => setGlasses(goal)}
            className="w-14 h-14 rounded-full bg-navy-800 border border-navy-700 flex items-center justify-center text-blue-400 hover:bg-navy-700 transition-transform active:scale-95"
          >
            <Trophy className="w-5 h-5" />
          </button>
        </div>

        {/* Today's Log */}
        <div className="w-full max-w-sm">
          <h3 className="text-sm font-medium text-content-secondary uppercase tracking-wider mb-4">Today's Log</h3>
          <div className="bg-navy-800 border border-navy-700 rounded-2xl p-4">
            {glasses === 0 ? (
              <p className="text-center text-sm text-content-secondary py-4">No water logged yet today.</p>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: glasses }).map((_, i) => (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={i}
                    className="w-10 h-10 bg-blue-500/20 rounded-xl border border-blue-500/30 flex items-center justify-center"
                  >
                    <GlassWater className="w-5 h-5 text-blue-400" />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
