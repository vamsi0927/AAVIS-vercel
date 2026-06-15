import React, { useEffect, useState } from 'react';
import { ChartStats } from '../../hooks/useChartData';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  stats: ChartStats;
  timeRange: 'week' | 'month';
}

// Simple counter animation component
const AnimatedNumber = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;
    
    const duration = 500;
    const startTime = performance.now();
    
    const step = (timestamp: number) => {
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setDisplayValue(Math.floor(start + (end - start) * progress));
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayValue(end);
      }
    };
    requestAnimationFrame(step);
  }, [value]);

  return <span>{displayValue}</span>;
};

export function TrendSummaryCard({ stats, timeRange }: Props) {
  return (
    <div className="bg-navy-800 rounded-3xl p-5 border border-white/5 shadow-lg mb-6 flex flex-col gap-4">
      {/* Top Row: Main averages and comparison */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex flex-col items-center justify-center text-brand-primary">
            <span className="text-xs font-bold uppercase opacity-80">Avg</span>
            <span className="text-xl font-black leading-none">
              <AnimatedNumber value={stats.average} />
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-content-secondary text-sm font-bold">Health Score</span>
            {stats.comparisonToPrevious !== null ? (
              <div className="flex items-center gap-1 mt-0.5 text-xs font-bold">
                {stats.comparisonToPrevious > 0 ? (
                  <span className="text-green-400 flex items-center"><TrendingUp className="w-3 h-3 mr-0.5" /> +{stats.comparisonToPrevious}</span>
                ) : stats.comparisonToPrevious < 0 ? (
                  <span className="text-red-400 flex items-center"><TrendingDown className="w-3 h-3 mr-0.5" /> {stats.comparisonToPrevious}</span>
                ) : (
                  <span className="text-content-secondary flex items-center"><Minus className="w-3 h-3 mr-0.5" /> Unchanged</span>
                )}
                <span className="text-content-secondary opacity-60 ml-1">
                  vs previous {timeRange}
                </span>
              </div>
            ) : (
              <span className="text-xs text-content-secondary opacity-60 mt-0.5">Not enough data to compare</span>
            )}
          </div>
        </div>

        {/* Small stats (Highest, Lowest, Median, Consistency) */}
        <div className="flex flex-wrap gap-4 sm:gap-6 text-sm font-bold w-full sm:w-auto">
          <div className="flex flex-col">
            <span className="text-content-secondary text-xs uppercase opacity-80">Highest</span>
            <span className="text-white"><AnimatedNumber value={stats.highest} /></span>
          </div>
          <div className="flex flex-col">
            <span className="text-content-secondary text-xs uppercase opacity-80">Lowest</span>
            <span className="text-white"><AnimatedNumber value={stats.lowest} /></span>
          </div>
          <div className="flex flex-col">
            <span className="text-content-secondary text-xs uppercase opacity-80">Median</span>
            <span className="text-white"><AnimatedNumber value={stats.median} /></span>
          </div>
          <div className="flex flex-col">
            <span className="text-content-secondary text-xs uppercase opacity-80">Consistency</span>
            <span className="text-brand-primary"><AnimatedNumber value={stats.consistency} />%</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-white/5" />

      {/* Bottom Row: Best/Worst Day and Breakdown */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-6 text-xs">
          <div className="flex flex-col">
            <span className="text-content-secondary uppercase opacity-80 font-bold">Best Day</span>
            {stats.bestDay ? (
              <span className="text-white font-bold">{stats.bestDay.day} &bull; <span className="text-green-400">{stats.bestDay.score}</span></span>
            ) : (
              <span className="text-content-secondary">-</span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-content-secondary uppercase opacity-80 font-bold">Lowest Day</span>
            {stats.worstDay ? (
              <span className="text-white font-bold">{stats.worstDay.day} &bull; <span className="text-red-400">{stats.worstDay.score}</span></span>
            ) : (
              <span className="text-content-secondary">-</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold bg-black/20 rounded-lg px-3 py-1.5 self-start sm:self-auto">
          <span className="text-content-secondary">Total: {stats.totalScans}</span>
          <div className="w-px h-3 bg-white/10" />
          <span className="text-green-400">{stats.safeCount} Safe</span>
          <div className="w-px h-3 bg-white/10" />
          <span className="text-yellow-400">{stats.cautionCount} Ctn</span>
          <div className="w-px h-3 bg-white/10" />
          <span className="text-red-400">{stats.hazardousCount} Haz</span>
        </div>
      </div>
    </div>
  );
}
