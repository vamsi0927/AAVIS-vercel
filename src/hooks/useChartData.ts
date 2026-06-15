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

export interface ChartPeriodInfo {
  dateRangeText: string;
  isCurrentPeriod: boolean;
}

const calculateMedian = (arr: number[]) => {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};

export function useChartData(
  allScans: ScanResult[],
  timeRange: 'week' | 'month',
  timeOffset: number
) {
  // Derive date bounds purely from offset — no async, no loading state needed
  const currentBounds = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (timeRange === 'week') {
      // "end" = today minus (offset * 7) days
      const end = new Date(today);
      end.setDate(today.getDate() - timeOffset * 7);
      // "start" = 6 days before end
      const start = new Date(end);
      start.setDate(end.getDate() - 6);

      // Previous period
      const prevEnd = new Date(start);
      prevEnd.setDate(start.getDate() - 1);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevEnd.getDate() - 6);

      return { start, end, prevStart, prevEnd };
    } else {
      // Month: find the target calendar month
      const target = new Date(today.getFullYear(), today.getMonth() - timeOffset, 1);
      const start = new Date(target.getFullYear(), target.getMonth(), 1);
      // End of that month
      const end = new Date(target.getFullYear(), target.getMonth() + 1, 0);
      // Clamp end to today if current month
      if (timeOffset === 0 && end > today) end.setTime(today.getTime());

      const prevEnd = new Date(start);
      prevEnd.setDate(0); // last day of previous month
      const prevStart = new Date(prevEnd.getFullYear(), prevEnd.getMonth(), 1);

      return { start, end, prevStart, prevEnd };
    }
  }, [timeRange, timeOffset]);

  // Filter scans that fall within the current period
  const currentScans = useMemo(() => {
    const startMs = currentBounds.start.getTime();
    // End of day for end date
    const endMs = new Date(currentBounds.end).setHours(23, 59, 59, 999);
    return allScans.filter(s => {
      const t = new Date(s.date).getTime();
      return t >= startMs && t <= endMs;
    });
  }, [allScans, currentBounds]);

  // Filter scans for previous period (for comparison)
  const previousScans = useMemo(() => {
    const startMs = currentBounds.prevStart.getTime();
    const endMs = new Date(currentBounds.prevEnd).setHours(23, 59, 59, 999);
    return allScans.filter(s => {
      const t = new Date(s.date).getTime();
      return t >= startMs && t <= endMs;
    });
  }, [allScans, currentBounds]);

  // Build chart data points
  const chartData = useMemo(() => {
    const data: ChartDataPoint[] = [];

    if (timeRange === 'week') {
      for (let i = 0; i < 7; i++) {
        const d = new Date(currentBounds.start);
        d.setDate(currentBounds.start.getDate() + i);
        const dStr = d.toDateString();

        const scansOnDay = currentScans.filter(s => new Date(s.date).toDateString() === dStr);
        const avgScore = scansOnDay.length > 0
          ? Math.round(scansOnDay.reduce((acc, s) => acc + s.score, 0) / scansOnDay.length)
          : 0;

        data.push({
          day: d.toLocaleDateString(undefined, { weekday: 'short' }),
          score: avgScore,
          scans: scansOnDay.length,
          isEmpty: scansOnDay.length === 0,
          rawDate: new Date(d),
          scansData: scansOnDay,
        });
      }
    } else {
      const daysInMonth = new Date(currentBounds.start.getFullYear(), currentBounds.start.getMonth() + 1, 0).getDate();
      const today = new Date();
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(currentBounds.start.getFullYear(), currentBounds.start.getMonth(), i);
        // Don't render future days
        if (d > today) break;
        const dStr = d.toDateString();

        const scansOnDay = currentScans.filter(s => new Date(s.date).toDateString() === dStr);
        const avgScore = scansOnDay.length > 0
          ? Math.round(scansOnDay.reduce((acc, s) => acc + s.score, 0) / scansOnDay.length)
          : 0;

        data.push({
          day: i.toString(),
          score: avgScore,
          scans: scansOnDay.length,
          isEmpty: scansOnDay.length === 0,
          rawDate: new Date(d),
          scansData: scansOnDay,
        });
      }
    }

    return data;
  }, [currentScans, currentBounds, timeRange]);

  // Stats
  const stats = useMemo(() => {
    const scores = currentScans.map(s => s.score);
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    const prevScores = previousScans.map(s => s.score);
    const prevAvg = prevScores.length > 0 ? Math.round(prevScores.reduce((a, b) => a + b, 0) / prevScores.length) : 0;

    const highest = scores.length > 0 ? Math.max(...scores) : 0;
    const lowest = scores.length > 0 ? Math.min(...scores) : 0;
    const median = calculateMedian(scores);

    const activeDays = chartData.filter(d => !d.isEmpty).length;
    const consistency = chartData.length > 0 ? Math.round((activeDays / chartData.length) * 100) : 0;

    const safeCount = currentScans.filter(s => s.verdict === 'safe').length;
    const cautionCount = currentScans.filter(s => s.verdict === 'caution').length;
    const hazardousCount = currentScans.filter(s => s.verdict === 'hazardous').length;

    const daysWithData = chartData.filter(d => !d.isEmpty);
    let bestDay = null;
    let worstDay = null;
    if (daysWithData.length > 0) {
      const sorted = [...daysWithData].sort((a, b) => b.score - a.score);
      bestDay = { day: sorted[0].day, score: sorted[0].score };
      worstDay = { day: sorted[sorted.length - 1].day, score: sorted[sorted.length - 1].score };
    }

    const comparison = (prevScores.length > 0 && scores.length > 0) ? avg - prevAvg : null;

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
      comparisonToPrevious: comparison,
    } as ChartStats;
  }, [currentScans, previousScans, chartData]);

  // Period info text
  const periodInfo = useMemo(() => {
    let text = '';
    if (timeRange === 'week') {
      const sDate = currentBounds.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const eDate = currentBounds.end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      text = `${sDate} – ${eDate}`;
    } else {
      text = currentBounds.start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
    return { dateRangeText: text, isCurrentPeriod: timeOffset === 0 };
  }, [currentBounds, timeRange, timeOffset]);

  return { chartData, stats, periodInfo };
}
