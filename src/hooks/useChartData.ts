import { useMemo } from 'react';
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
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};

export function useChartData(
  allScans: ScanResult[],
  timeRange: 'week' | 'month'
) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);

  // Earliest scan date = effective "signup date" for chart purposes
  const earliestDate = useMemo(() => {
    if (allScans.length === 0) {
      // Default: 7 days ago if no scans
      const d = new Date();
      d.setDate(d.getDate() - 6);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    const timestamps = allScans.map(s => new Date(s.date).getTime());
    const d = new Date(Math.min(...timestamps));
    d.setHours(0, 0, 0, 0);
    return d;
  }, [allScans]);

  // Build chart data points
  const chartData = useMemo((): ChartDataPoint[] => {
    const data: ChartDataPoint[] = [];

    if (timeRange === 'week') {
      // Show each individual day from earliest scan to today
      const cursor = new Date(earliestDate);
      cursor.setHours(0, 0, 0, 0);

      while (cursor <= today) {
        const dStr = cursor.toDateString();
        const scansOnDay = allScans.filter(s => new Date(s.date).toDateString() === dStr);
        const avgScore = scansOnDay.length > 0
          ? Math.round(scansOnDay.reduce((a, s) => a + s.score, 0) / scansOnDay.length)
          : 0;

        data.push({
          day: cursor.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          score: avgScore,
          scans: scansOnDay.length,
          isEmpty: scansOnDay.length === 0,
          rawDate: new Date(cursor),
          scansData: scansOnDay,
        });

        cursor.setDate(cursor.getDate() + 1);
      }
    } else {
      // Month view: one bar per calendar month from earliest → today
      const cursor = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);

      while (cursor <= today) {
        const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
        const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);

        const label = monthStart.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });

        const scansInMonth = allScans.filter(s => {
          const t = new Date(s.date).getTime();
          return t >= monthStart.getTime() && t <= Math.min(monthEnd.getTime(), today.getTime());
        });
        const avgScore = scansInMonth.length > 0
          ? Math.round(scansInMonth.reduce((a, s) => a + s.score, 0) / scansInMonth.length)
          : 0;

        data.push({
          day: label,
          score: avgScore,
          scans: scansInMonth.length,
          isEmpty: scansInMonth.length === 0,
          rawDate: new Date(monthStart),
          scansData: scansInMonth,
        });

        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    return data;
  }, [allScans, timeRange, earliestDate, today]);

  // Stats over ALL scans in the visible range
  const stats = useMemo(() => {
    const scores = allScans.map(s => s.score);
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const highest = scores.length > 0 ? Math.max(...scores) : 0;
    const lowest = scores.length > 0 ? Math.min(...scores) : 0;
    const median = calculateMedian(scores);

    const activePeriods = chartData.filter(d => !d.isEmpty).length;
    const consistency = chartData.length > 0 ? Math.round((activePeriods / chartData.length) * 100) : 0;

    const safeCount = allScans.filter(s => s.verdict === 'safe').length;
    const cautionCount = allScans.filter(s => s.verdict === 'caution').length;
    const hazardousCount = allScans.filter(s => s.verdict === 'hazardous').length;

    const daysWithData = chartData.filter(d => !d.isEmpty);
    const sortedByScore = [...daysWithData].sort((a, b) => b.score - a.score);
    const bestDay = sortedByScore.length > 0 ? { day: sortedByScore[0].day, score: sortedByScore[0].score } : null;
    const worstDay = sortedByScore.length > 0 ? { day: sortedByScore[sortedByScore.length - 1].day, score: sortedByScore[sortedByScore.length - 1].score } : null;

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

  // Date range text
  const dateRangeText = useMemo(() => {
    const start = earliestDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const end = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    if (allScans.length === 0) return 'No scan history yet';
    return `${start} – ${end}`;
  }, [earliestDate, allScans.length]);

  return { chartData, stats, dateRangeText };
}
