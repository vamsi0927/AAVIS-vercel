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

  // Earliest scan date = signup anchor. Fallback to today if no scans.
  const signupDate = useMemo(() => {
    if (allScans.length === 0) return new Date();
    const timestamps = allScans.map(s => new Date(s.date).getTime());
    const d = new Date(Math.min(...timestamps));
    d.setHours(0, 0, 0, 0);
    return d;
  }, [allScans]);

  // Build chart data: weekly or monthly buckets from signupDate → today
  const chartData = useMemo((): ChartDataPoint[] => {
    if (allScans.length === 0) return [];
    const data: ChartDataPoint[] = [];

    if (timeRange === 'week') {
      // Snap signupDate back to the Monday of that week
      const firstDay = new Date(signupDate);
      const dow = firstDay.getDay(); // 0=Sun, 1=Mon...
      const snapBack = dow === 0 ? 6 : dow - 1; // days to subtract to reach Monday
      firstDay.setDate(firstDay.getDate() - snapBack);
      firstDay.setHours(0, 0, 0, 0);

      const cursor = new Date(firstDay);

      while (cursor <= today) {
        const weekStart = new Date(cursor);
        const weekEnd = new Date(cursor);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const effectiveEnd = weekEnd > today ? today : weekEnd;

        const scansInBucket = allScans.filter(s => {
          const t = new Date(s.date).getTime();
          return t >= weekStart.getTime() && t <= effectiveEnd.getTime();
        });

        const avgScore = scansInBucket.length > 0
          ? Math.round(scansInBucket.reduce((acc, s) => acc + s.score, 0) / scansInBucket.length)
          : 0;

        data.push({
          day: weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          score: avgScore,
          scans: scansInBucket.length,
          isEmpty: scansInBucket.length === 0,
          rawDate: new Date(weekStart),
          scansData: scansInBucket,
        });

        cursor.setDate(cursor.getDate() + 7);
      }

    } else {
      // Monthly buckets from the first calendar month of signupDate → today
      const cursor = new Date(signupDate.getFullYear(), signupDate.getMonth(), 1);

      while (cursor <= today) {
        const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
        const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);

        const effectiveEnd = monthEnd > today ? today : monthEnd;

        const scansInBucket = allScans.filter(s => {
          const t = new Date(s.date).getTime();
          return t >= monthStart.getTime() && t <= effectiveEnd.getTime();
        });

        const avgScore = scansInBucket.length > 0
          ? Math.round(scansInBucket.reduce((acc, s) => acc + s.score, 0) / scansInBucket.length)
          : 0;

        data.push({
          day: monthStart.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
          score: avgScore,
          scans: scansInBucket.length,
          isEmpty: scansInBucket.length === 0,
          rawDate: new Date(monthStart),
          scansData: scansInBucket,
        });

        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    return data;
  }, [allScans, timeRange, signupDate, today]);

  // Stats calculated over all scans
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

  // Date range label: "<signup date> – Present"
  const dateRangeText = useMemo(() => {
    if (allScans.length === 0) return 'No scan history yet';
    const start = signupDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${start} – Present`;
  }, [signupDate, allScans.length]);

  return { chartData, stats, dateRangeText };
}
