import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Activity, ChevronRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { ChartDataPoint } from '../../hooks/useChartData';
import { useNavigate } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: ChartDataPoint | null;
}

export function DayDetailsPanel({ isOpen, onClose, data }: Props) {
  const navigate = useNavigate();

  if (!data) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-navy-900 border-l border-white/10 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand-primary" />
                  {data.rawDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </h2>
                <p className="text-content-secondary text-sm mt-1">
                  Average Score: <span className="text-white font-bold">{data.score}</span> &bull; {data.scans} Scans
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {data.scansData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-content-secondary">
                  <Activity className="w-12 h-12 mb-4 opacity-20" />
                  <p>No scans recorded for this day.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.scansData.map((scan) => {
                    const isSafe = scan.verdict === 'safe';
                    const isCaution = scan.verdict === 'caution';
                    
                    return (
                      <div 
                        key={scan.id}
                        onClick={() => navigate(`/history`)} // Navigate to history or detailed view
                        className="glass-card rounded-2xl p-4 border border-white/5 hover:bg-white/5 transition-colors cursor-pointer group flex items-center gap-4"
                      >
                        <div className="w-12 h-12 rounded-xl bg-black/20 overflow-hidden flex-shrink-0">
                          {scan.product?.image_url || scan.product?.thumbnail_url ? (
                            <img 
                              src={scan.product.thumbnail_url || scan.product.image_url} 
                              alt={scan.product.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/5 text-content-secondary">
                              <Activity className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-bold break-words whitespace-normal">{scan.product?.name || 'Unknown Product'}</h4>
                          <p className="text-content-secondary text-xs break-words whitespace-normal">{scan.product?.brand || 'Unknown Brand'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs font-bold flex items-center gap-1 ${
                              isSafe ? 'text-green-400' : isCaution ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {isSafe ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                              {scan.score}
                            </span>
                            <span className="text-[10px] text-content-secondary uppercase tracking-wider">
                              {scan.verdict}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-content-secondary group-hover:text-white transition-colors" />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
