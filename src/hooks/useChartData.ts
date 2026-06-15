import { useMemo } from 'react';
import { ScanResult } from '../lib/types';

export interface ChartDataPoint {
  day: string;
  score: number;
  scans: number;
  isEmpty: boolean;
  isGhost?: boolean;
  rawDate: Date;
  scansData: ScanResult[];
}

export interface ChartStats {
  average: number;
  highest: number;
  lowest: number;
  median: number;
  consistency: number;
  totalScans: number;
  safeCount: number;
  cautionCount: number;
  hazardousCount: number;
  bestDay: { day: string; score: number } | null;
  worstDay: { day: string; score: number } | null;
  comparisonToPrevious: number | null;
}

const calculateMedian = (arr: number[]) => {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};

export function useChartData(
  allScans: ScanResult[],
  timeRange: 'week' | 'month'
) {
  // End of today
  const todayMs = useMemo(() => new Date().setHours(23, 59, 59, 999), []);

  // End of current week (Saturday)
  const endOfCurrentWeek = useMemo(() => {
    const d = new Date();
    const dow = d.getDay(); // 0=Sun, 6=Sat
    const daysUntilSaturday = 6 - dow;
    d.setDate(d.getDate() + daysUntilSaturday);
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);

  // Start = earliest scan date (proxy for signup). Fallback to today.
  const signupDate = useMemo(() => {
    if (allScans.length === 0) return new Date();
    const validScans = allScans.filter(s => s.date && !isNaN(new Date(s.date).getTime()));
    if (validScans.length === 0) return new Date();
    const d = new Date(Math.min(...validScans.map(s => new Date(s.date).getTime())));
    d.setHours(0, 0, 0, 0);
    return d;
  }, [allScans]);

  const chartData = useMemo((): ChartDataPoint[] => {
    const data: ChartDataPoint[] = [];

    if (timeRange === 'week') {
      // Find the Sunday of the signup week
      const startCursor = new Date(signupDate);
      startCursor.setDate(startCursor.getDate() - startCursor.getDay());
      startCursor.setHours(0, 0, 0, 0);

      // Loop from that Sunday to the end of the current week (Saturday)
      const cursor = new Date(startCursor);
      
      while (cursor.getTime() <= endOfCurrentWeek.getTime()) {
        const dStr = cursor.toDateString();
        const isGhost = cursor.getTime() < signupDate.getTime();
        const isFuture = cursor.getTime() > todayMs;
        
        const scansOnDay = (isGhost || isFuture)
          ? []
          : allScans.filter(s => new Date(s.date).toDateString() === dStr);

        const avgScore =
          scansOnDay.length > 0
            ? Math.round(scansOnDay.reduce((acc, s) => acc + s.score, 0) / scansOnDay.length)
            : 0;

        data.push({
          day: `${cursor.toLocaleDateString(undefined, { month: 'short' })} ${cursor.getDate()}`,
          score: avgScore,
          scans: scansOnDay.length,
          isEmpty: scansOnDay.length === 0,
          isGhost: isGhost || isFuture, // Reusing ghost style for future dates too so they are faded
          rawDate: new Date(cursor),
          scansData: scansOnDay,
        });

        cursor.setDate(cursor.getDate() + 1);
      }
    } else {
      // Month view: one bar per calendar month from signup month → current month + 6 months
      const cursor = new Date(signupDate.getFullYear(), signupDate.getMonth(), 1);
      
      const endMonthLimit = new Date();
      endMonthLimit.setMonth(endMonthLimit.getMonth() + 6);
      endMonthLimit.setDate(1);
      endMonthLimit.setHours(0, 0, 0, 0);

      while (cursor.getTime() <= endMonthLimit.getTime()) {
        const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
        const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);
        
        // Don't include scans from future days in the current month/future months
        const effectiveEnd = monthEnd.getTime() > todayMs ? new Date(todayMs) : monthEnd;

        const scansInMonth = allScans.filter(s => {
          const t = new Date(s.date).getTime();
          return t >= monthStart.getTime() && t <= effectiveEnd.getTime();
        });

        const avgScore =
          scansInMonth.length > 0
            ? Math.round(scansInMonth.reduce((acc, s) => acc + s.score, 0) / scansInMonth.length)
            : 0;

        data.push({
          day: monthStart.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
          score: avgScore,
          scans: scansInMonth.length,
          isEmpty: scansInMonth.length === 0,
          isGhost: monthStart.getTime() > todayMs,
          rawDate: new Date(monthStart),
          scansData: scansInMonth,
        });

        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    return data;
  }, [allScans, timeRange, signupDate, todayMs, endOfCurrentWeek]);

  // Stats across ALL scans
  const stats = useMemo(() => {
    const scores = allScans.map(s => s.score);
    const avg =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
    const highest = scores.length > 0 ? Math.max(...scores) : 0;
    const lowest = scores.length > 0 ? Math.min(...scores) : 0;
    const median = calculateMedian(scores);

    const activePeriods = chartData.filter(d => !d.isEmpty && !d.isGhost).length;
    const totalPeriods = chartData.filter(d => !d.isGhost).length;
    const consistency =
      totalPeriods > 0
        ? Math.round((activePeriods / totalPeriods) * 100)
        : 0;

    const safeCount = allScans.filter(s => s.verdict === 'safe').length;
    const cautionCount = allScans.filter(s => s.verdict === 'caution').length;
    const hazardousCount = allScans.filter(
      s => s.verdict === 'hazardous'
    ).length;

    const daysWithData = chartData.filter(d => !d.isEmpty && !d.isGhost);
    const sortedByScore = [...daysWithData].sort((a, b) => b.score - a.score);
    const bestDay =
      sortedByScore.length > 0
        ? { day: sortedByScore[0].day, score: sortedByScore[0].score }
        : null;
    const worstDay =
      sortedByScore.length > 0
        ? {
            day: sortedByScore[sortedByScore.length - 1].day,
            score: sortedByScore[sortedByScore.length - 1].score,
          }
        : null;

    return {
      average: avg,
      highest,
      lowest,
      median,
      consistency,
      totalScans: allScans.length,
      safeCount,
      cautionCount,
      hazardousCount,
      bestDay,
      worstDay,
      comparisonToPrevious: null,
    } as ChartStats;
  }, [allScans, chartData]);

  // Date range label
  const dateRangeText = useMemo(() => {
    if (allScans.length === 0) return 'No scan history yet';
    if (isNaN(signupDate.getTime())) return 'Present';
    const start = signupDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${start} – Present`;
  }, [signupDate, allScans.length]);

  return { chartData, stats, dateRangeText };
}
