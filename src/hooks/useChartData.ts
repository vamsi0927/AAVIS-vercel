import { useState, useEffect, useMemo, useCallback } from 'react';
import { getUserScansByDateRange } from '../lib/supabaseService';
import { ScanResult } from '../lib/types';

export interface ChartDataPoint {
  day: string;
  score: number;
  scans: number;
  isEmpty: boolean;
  rawDate: Date;
  scansData: ScanResult[];
}

export interface ChartStats {
  average: number;
  highest: number;
  lowest: number;
  median: number;
  consistency: number; // 0-100%
  totalScans: number;
  safeCount: number;
  cautionCount: number;
  hazardousCount: number;
  bestDay: { day: string; score: number } | null;
  worstDay: { day: string; score: number } | null;
  comparisonToPrevious: number | null; // e.g. +5 or -3
}

export interface ChartPeriodInfo {
  dateRangeText: string;
  isCurrentPeriod: boolean;
}

// Helper to calculate median
const calculateMedian = (arr: number[]) => {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};

export function useChartData(
  userId: string | undefined, 
  timeRange: 'week' | 'month', 
  timeOffset: number
) {
  // Cache stores arrays of scans keyed by period string
  const [scanCache, setScanCache] = useState<Record<string, ScanResult[]>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [currentScans, setCurrentScans] = useState<ScanResult[]>([]);
  const [previousScans, setPreviousScans] = useState<ScanResult[]>([]);

  // Function to fetch or get from cache
  const fetchPeriodScans = useCallback(async (start: Date, end: Date, cacheKey: string) => {
    if (!userId) return [];
    if (scanCache[cacheKey]) {
      return scanCache[cacheKey];
    }
    const dbScans = await getUserScansByDateRange(userId, start, end);
    const convertedScans: ScanResult[] = dbScans.map(s => ({
      id: s.id,
      productId: s.id,
      date: s.created_at,
      product: {
        name: s.product_name,
        brand: s.brand,
        image_url: s.image_url ?? undefined,
      },
      score: s.health_score,
      verdict: s.verdict as any,
      warnings: [],
    }));
    
    setScanCache(prev => ({ ...prev, [cacheKey]: convertedScans }));
    return convertedScans;
  }, [userId, scanCache]);

  // Derive date bounds
  const currentBounds = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (timeRange === 'week') {
      const end = new Date(today);
      end.setDate(today.getDate() - (timeOffset * 7));
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      
      const prevEnd = new Date(start);
      prevEnd.setDate(start.getDate() - 1);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevEnd.getDate() - 6);

      return { start, end, prevStart, prevEnd };
    } else {
      // Month
      const end = new Date(today.getFullYear(), today.getMonth() - timeOffset, today.getDate());
      // If it's not the current month offset 0, we might want the end of the month
      if (timeOffset > 0) {
        end.setDate(new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate()); // last day of that month
      }
      const start = new Date(end.getFullYear(), end.getMonth(), 1);

      const prevEnd = new Date(start);
      prevEnd.setDate(0); // Last day of previous month
      const prevStart = new Date(prevEnd.getFullYear(), prevEnd.getMonth(), 1);

      return { start, end, prevStart, prevEnd };
    }
  }, [timeRange, timeOffset]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const cacheKeyCurr = `${timeRange}-${timeOffset}-curr`;
      const cacheKeyPrev = `${timeRange}-${timeOffset}-prev`;

      const [curr, prev] = await Promise.all([
        fetchPeriodScans(currentBounds.start, currentBounds.end, cacheKeyCurr),
        fetchPeriodScans(currentBounds.prevStart, currentBounds.prevEnd, cacheKeyPrev)
      ]);

      setCurrentScans(curr);
      setPreviousScans(prev);
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [currentBounds, fetchPeriodScans, timeRange, timeOffset]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Chart Data Processing
  const chartData = useMemo(() => {
    let data: ChartDataPoint[] = [];

    if (timeRange === 'week') {
      for (let i = 0; i < 7; i++) {
        const d = new Date(currentBounds.start);
        d.setDate(currentBounds.start.getDate() + i);
        
        const scansOnDay = currentScans.filter(s => new Date(s.date).toDateString() === d.toDateString());
        const avgScoreOnDay = scansOnDay.length > 0
          ? Math.round(scansOnDay.reduce((acc, s) => acc + s.score, 0) / scansOnDay.length)
          : 0;

        data.push({
          day: d.toLocaleDateString(undefined, { weekday: 'short' }),
          score: avgScoreOnDay,
          scans: scansOnDay.length,
          isEmpty: scansOnDay.length === 0,
          rawDate: d,
          scansData: scansOnDay
        });
      }
    } else {
      // Month
      const daysInMonth = new Date(currentBounds.start.getFullYear(), currentBounds.start.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(currentBounds.start.getFullYear(), currentBounds.start.getMonth(), i);
        
        const scansOnDay = currentScans.filter(s => new Date(s.date).toDateString() === d.toDateString());
        const avgScoreOnDay = scansOnDay.length > 0
          ? Math.round(scansOnDay.reduce((acc, s) => acc + s.score, 0) / scansOnDay.length)
          : 0;

        data.push({
          day: i.toString(),
          score: avgScoreOnDay,
          scans: scansOnDay.length,
          isEmpty: scansOnDay.length === 0,
          rawDate: d,
          scansData: scansOnDay
        });
      }
    }

    return data;
  }, [currentScans, currentBounds, timeRange]);

  // Stats Calculation
  const stats = useMemo(() => {
    const scores = currentScans.map(s => s.score);
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    
    const prevScores = previousScans.map(s => s.score);
    const prevAvg = prevScores.length > 0 ? Math.round(prevScores.reduce((a, b) => a + b, 0) / prevScores.length) : 0;

    const highest = scores.length > 0 ? Math.max(...scores) : 0;
    const lowest = scores.length > 0 ? Math.min(...scores) : 0;
    const median = calculateMedian(scores);
    
    // Days with scans / total days
    const activeDays = chartData.filter(d => !d.isEmpty).length;
    const consistency = Math.round((activeDays / chartData.length) * 100);

    const safeCount = currentScans.filter(s => s.verdict === 'safe').length;
    const cautionCount = currentScans.filter(s => s.verdict === 'caution').length;
    const hazardousCount = currentScans.filter(s => s.verdict === 'hazardous').length;

    // Best and Worst Day based on average daily score
    const daysWithData = chartData.filter(d => !d.isEmpty);
    let bestDay = null;
    let worstDay = null;
    if (daysWithData.length > 0) {
      const sortedDays = [...daysWithData].sort((a, b) => b.score - a.score);
      bestDay = { day: sortedDays[0].day, score: sortedDays[0].score };
      worstDay = { day: sortedDays[sortedDays.length - 1].day, score: sortedDays[sortedDays.length - 1].score };
    }

    let comparison = null;
    if (prevScores.length > 0 && scores.length > 0) {
      comparison = avg - prevAvg;
    }

    return {
      average: avg,
      highest,
      lowest,
      median,
      consistency,
      totalScans: currentScans.length,
      safeCount,
      cautionCount,
      hazardousCount,
      bestDay,
      worstDay,
      comparisonToPrevious: comparison
    } as ChartStats;
  }, [currentScans, previousScans, chartData]);

  // Period Info
  const periodInfo = useMemo(() => {
    let text = '';
    if (timeRange === 'week') {
      const sDate = currentBounds.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const eDate = currentBounds.end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      text = `${sDate} – ${eDate}`;
    } else {
      text = currentBounds.start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
    return {
      dateRangeText: text,
      isCurrentPeriod: timeOffset === 0
    };
  }, [currentBounds, timeRange, timeOffset]);

  return {
    chartData,
    stats,
    periodInfo,
    isLoading,
    isError,
    retry: loadData
  };
}
