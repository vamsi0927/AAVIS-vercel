import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  Image as ImageIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import aiAssistantImg from '../../assets/ai-assistant.jpg';
import { useAppContext } from '../../context/AppContext';
import { SAMPLE_PRODUCTS } from '../../data/sampleProducts';
import { useChartData, ChartDataPoint } from '../../hooks/useChartData';
import { TrendSummaryCard } from '../../components/dashboard/TrendSummaryCard';
import { DayDetailsPanel } from '../../components/dashboard/DayDetailsPanel';

// --- Color helpers ---
const BAR_COLOR_EMPTY = 'rgba(255,255,255,0.06)';
const BAR_COLOR_GHOST = 'rgba(255,255,255,0.02)';
const getBarColor = (score: number, isEmpty: boolean, isGhost?: boolean) => {
  if (isGhost) return BAR_COLOR_GHOST;
  if (isEmpty || score === 0) return BAR_COLOR_EMPTY;
  if (score >= 80) return '#22c55e';
  if (score >= 60) return 'url(#aavisGradient)';
  if (score >= 40) return '#eab308';
  return '#ef4444';
};

// --- Custom Tooltip ---
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  const data: ChartDataPoint = payload[0]?.payload;
  if (!data) return null;
  return (
    <div className="bg-navy-800 border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[160px]">
      <p className="text-content-secondary text-xs font-bold mb-2 uppercase tracking-wider">
        {data.rawDate instanceof Date && !isNaN(data.rawDate.getTime())
          ? data.rawDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
          : data.day}
      </p>
      {data.isGhost ? (
        <p className="text-content-secondary text-sm">Before signup</p>
      ) : data.isEmpty ? (
        <p className="text-content-secondary text-sm">No scans</p>
      ) : (
        <>
          <p className="text-white font-black text-2xl leading-none">{data.score}</p>
          <p className="text-content-secondary text-xs mt-1 font-bold">Avg Health Score</p>
          <div className="mt-2 pt-2 border-t border-white/5 text-xs text-content-secondary font-bold">
            {data.scans} scan{data.scans !== 1 ? 's' : ''}
          </div>
        </>
      )}
    </div>
  );
};

export function HealthDashboard() {
  const navigate = useNavigate();
  const { scans } = useAppContext();
  const chartRef = useRef<HTMLDivElement>(null);

  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  // Scroll chart to right (present) end
  const chartScrollRef = useRef<HTMLDivElement>(null);
  const scrollToPresent = useCallback(() => {
    if (chartScrollRef.current) {
      chartScrollRef.current.scrollTo({ left: 999999, behavior: 'smooth' });
    }
  }, []);

  // Day details panel
  const [selectedDay, setSelectedDay] = useState<ChartDataPoint | null>(null);
  const [isDayPanelOpen, setIsDayPanelOpen] = useState(false);

  // Chart data — single range from first scan to today
  const { chartData, stats, dateRangeText } = useChartData(scans, timeRange);

  // Auto-scroll to present when chart data loads or range changes
  useEffect(() => {
    if (chartData.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(scrollToPresent, 100);
    }
  }, [timeRange, chartData.length, scrollToPresent]);

  const hasNoData = chartData.every(d => d.isEmpty);

  // Existing stats for the right column (rolling 7/30 days)
  const scansInRange = useMemo(() => scans.filter(s => {
    const d = new Date(s.date);
    const ms = timeRange === 'week' ? 7 * 86400000 : 30 * 86400000;
    return (Date.now() - d.getTime()) <= ms;
  }), [scans, timeRange]);

  const avgScore = useMemo(() =>
    scansInRange.length > 0
      ? Math.round(scansInRange.reduce((a, s) => a + s.score, 0) / scansInRange.length)
      : 0,
    [scansInRange]
  );

  let weeklyGrade = '-';
  if (scansInRange.length > 0) {
    if (avgScore >= 75) weeklyGrade = 'A';
    else if (avgScore >= 60) weeklyGrade = 'B';
    else if (avgScore >= 40) weeklyGrade = 'C';
    else weeklyGrade = 'D';
  }

  const streak = useMemo(() => {
    if (scans.length === 0) return 0;
    const dates = scans.map(s => new Date(s.date).toDateString());
    const uniqueDates = Array.from(new Set(dates)).map(d => new Date(d));
    uniqueDates.sort((a, b) => b.getTime() - a.getTime());
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (!dates.includes(today) && !dates.includes(yesterday)) return 0;
    let s = 1;
    let current = uniqueDates[0];
    for (let i = 1; i < uniqueDates.length; i++) {
      const diff = Math.ceil(Math.abs(current.getTime() - uniqueDates[i].getTime()) / 86400000);
      if (diff === 1) { s++; current = uniqueDates[i]; } else break;
    }
    return s;
  }, [scans]);

  const hazardousScans = scansInRange.filter(s => s.verdict === 'hazardous');
  const hazardousCount = hazardousScans.length;
  const productsAvoided = hazardousCount;
  const avoidedItems = hazardousScans.map(s => {
    const warning = s.warnings?.[0] || 'Flagged Additive';
    const prodName = s.product?.name || 'Product';
    return `${prodName} (${warning})`;
  });

  let quoteText = "Every journey starts with a single scan. Start today! 🌱";
  if (streak >= 1 && streak <= 6) quoteText = `You've been eating consciously for ${streak} days. Your body is noticing! 💚`;
  else if (streak >= 7 && streak <= 13) quoteText = "One full week of conscious eating! You're building a real habit 🔥";
  else if (streak >= 14 && streak <= 29) quoteText = `${streak} days of eating consciously — you're unstoppable! 💪`;
  else if (streak >= 30) quoteText = `${streak} days! You're an inspiration to everyone around you 🏆`;

  return (
    <div className="flex flex-col h-full bg-navy-900 pb-24 overflow-y-auto no-scrollbar">
      <header className="pt-safe pt-8 px-6 pb-4 sticky top-0 bg-navy-900/90 backdrop-blur-md z-10">
        <h1 className="text-3xl font-display font-bold">Health</h1>
      </header>

      <div className="px-6 space-y-6 md:space-y-0 md:grid md:grid-cols-12 md:gap-8 md:max-w-7xl md:mx-auto md:w-full md:px-8">

        {/* Left Column */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-6 mb-6 md:mb-0">

          {/* Trend Summary Card */}
          {!hasNoData && (
            <TrendSummaryCard stats={stats} timeRange={timeRange} />
          )}

          {/* Main Chart Card */}
          <div ref={chartRef} className="glass-card border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-[80px] pointer-events-none" />

            {/* Chart Header */}
            <div className="flex flex-col gap-4 mb-6 relative z-10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-display font-bold text-white">Health Score History</h3>
                  <p className="text-xs text-content-secondary mt-0.5 font-medium">
                    Track how your average scan scores evolve over time
                  </p>
                  <p className="text-xs text-brand-primary font-bold mt-1">{dateRangeText}</p>
                </div>

                {/* View Toggle + Present button */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={scrollToPresent}
                    title="Scroll to present"
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white/5 border border-white/10 text-content-secondary hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1"
                  >
                    Present ▶
                  </button>
                  <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
                    <button
                      onClick={() => setTimeRange('week')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${
                        timeRange === 'week'
                          ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                          : 'text-content-secondary hover:text-white hover:bg-white/5'
                      }`}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => setTimeRange('month')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${
                        timeRange === 'month'
                          ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                          : 'text-content-secondary hover:text-white hover:bg-white/5'
                      }`}
                    >
                      Month
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Y-axis label */}
            <div className="relative">
              <div
                className="absolute -left-2 top-1/2 text-[9px] text-content-secondary font-bold uppercase tracking-widest pointer-events-none"
                style={{
                  transform: 'translateX(-100%) translateY(-50%) rotate(-90deg)',
                  transformOrigin: 'right center',
                  whiteSpace: 'nowrap',
                }}
              >
                Avg Health Score
              </div>

              <div className="h-56 w-full pl-1 overflow-x-auto no-scrollbar scroll-smooth" ref={chartScrollRef}>
                {hasNoData ? (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                    <Activity className="w-10 h-10 text-content-secondary opacity-20" />
                    <p className="text-content-secondary text-sm font-bold">No scans recorded yet.</p>
                    <p className="text-content-secondary text-xs opacity-60">Start scanning products to see your health trend here.</p>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={timeRange}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="h-full min-w-[600px] w-full"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={chartData}
                          margin={{ top: 20, right: 4, left: -16, bottom: 10 }}
                          onClick={(data) => {
                            if (data?.activePayload?.[0]) {
                              const pt = data.activePayload[0].payload as ChartDataPoint;
                              if (!pt.isEmpty) {
                                setSelectedDay(pt);
                                setIsDayPanelOpen(true);
                              }
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <defs>
                            <linearGradient id="aavisGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#818cf8" />
                              <stop offset="100%" stopColor="#6366f1" />
                            </linearGradient>
                          </defs>

                          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />

                          <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3b8', fontSize: 10, fontWeight: 600 }}
                            dy={8}
                            interval="preserveStartEnd"
                          />

                          <YAxis
                            domain={[0, 100]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3b8', fontSize: 10, fontWeight: 600 }}
                            tickCount={5}
                          />

                          <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 12 }}
                          />

                          {/* Average reference line */}
                          {stats.average > 0 && (
                            <ReferenceLine
                              y={stats.average}
                              stroke="#818cf8"
                              strokeWidth={1.5}
                              strokeDasharray="5 3"
                              label={{
                                value: `Avg: ${stats.average}`,
                                position: 'insideTopRight',
                                fill: '#818cf8',
                                fontSize: 10,
                                fontWeight: 700,
                              }}
                            />
                          )}

                          <Bar
                            dataKey="score"
                            radius={[8, 8, 8, 8]}
                            maxBarSize={28}
                            isAnimationActive
                            animationDuration={600}
                            animationEasing="ease-out"
                            minPointSize={4}
                          >
                            <LabelList
                              dataKey="score"
                              position="top"
                              style={{ fontSize: 9, fontWeight: 700, fill: '#9ca3b8' }}
                              formatter={(v: number) => v === 0 ? '' : v}
                            />
                            {chartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={getBarColor(entry.score, entry.isEmpty, entry.isGhost)}
                                fillOpacity={entry.isGhost ? 0.2 : entry.isEmpty ? 0.4 : 1}
                              />
                            ))}
                          </Bar>



                        </ComposedChart>
                      </ResponsiveContainer>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>

          {/* Ask AI Navigation */}
          <button
            onClick={() => navigate('/dashboard/chat')}
            className="bg-navy-800 rounded-2xl p-4 flex items-center justify-center text-center gap-3 hover:bg-navy-700 transition-colors shadow-lg shadow-black/20"
          >
            <div className="w-10 h-10 rounded-full bg-navy-800 flex items-center justify-center overflow-hidden border border-brand-primary/30">
              <img src={aiAssistantImg} alt="AI" className="w-full h-full object-cover" />
            </div>
            <span className="text-sm font-medium text-white">Ask AI Nutritionist</span>
          </button>

          {/* Grade Breakdown */}
          <div className="glass-card border border-white/5 rounded-2xl p-5">
            <h3 className="font-semibold mb-4 text-white">What your grade means</h3>
            <div className="space-y-2">
              {[
                { grade: 'A', icon: '🟢', label: 'Excellent', range: '75–100', color: '#22c55e' },
                { grade: 'B', icon: '🔵', label: 'Good', range: '60–74', color: '#6366f1' },
                { grade: 'C', icon: '🟡', label: 'Needs Work', range: '40–59', color: '#f59e0b' },
                { grade: 'D', icon: '🔴', label: 'Poor', range: 'below 40', color: '#ef4444' },
              ].map((row) => {
                const isCurrent = weeklyGrade === row.grade || (weeklyGrade === 'F' && row.grade === 'D');
                return (
                  <div
                    key={row.grade}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all ${isCurrent ? 'bg-white/5 shadow-md' : 'opacity-70'}`}
                    style={{ borderLeft: isCurrent ? `4px solid ${row.color}` : '4px solid transparent' }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold w-6 text-center" style={{ color: row.color }}>{row.grade}</span>
                      <span className="text-sm">{row.icon}</span>
                      <span className="text-sm font-medium text-white">{row.label}</span>
                    </div>
                    <span className="text-xs text-content-secondary font-medium">{row.range}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-content-secondary mt-5 text-center">Scan more products daily to improve your grade</p>
          </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-6">
          {/* Streak & Grade */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card border border-brand-caution/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <div className="text-3xl mb-1">🔥</div>
              <div className="text-4xl font-display font-bold text-white leading-none mb-1">{streak}</div>
              <div className="text-sm font-medium text-white">Day Streak</div>
              <div className="text-xs text-brand-safe font-medium mt-1">{streak === 0 ? 'Start today 💪' : 'Keep it going!'}</div>
            </div>
            <div className="glass-card border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold mb-2 ${
                weeklyGrade === 'A' ? 'bg-[#22c55e] text-white' :
                weeklyGrade === 'B' ? 'bg-[#6366f1] text-white' :
                weeklyGrade === 'C' ? 'bg-[#f59e0b] text-white' :
                weeklyGrade === 'D' ? 'bg-[#ef4444] text-white' :
                'bg-navy-700 text-content-secondary'
              }`}>{weeklyGrade}</div>
              <div className="text-sm font-medium text-white">{timeRange === 'week' ? 'This Week' : 'This Month'}</div>
              <div className="text-[10px] text-content-secondary mt-0.5 font-medium">Based on your scans</div>
            </div>
          </div>

          {/* Motivational Quote */}
          <div className="glass-card rounded-2xl p-5 border border-white/5 flex items-center gap-4">
            <div className="text-3xl flex-shrink-0">🔥</div>
            <p className="text-sm italic text-white/90 leading-relaxed font-medium">"{quoteText}"</p>
          </div>

          {/* Products Avoided */}
          <div className="glass-card border border-brand-safe/30 rounded-2xl p-5 flex flex-col relative overflow-hidden">
            <h2 className="text-sm font-medium text-brand-safe uppercase tracking-wider mb-1">Harmful Products Avoided ✋</h2>
            {productsAvoided === 0 ? (
              <p className="text-sm text-brand-safe/80 mt-2">Scan products to track what you're avoiding</p>
            ) : (
              <>
                <div className="flex items-baseline gap-2 mb-1 mt-2">
                  <span className="text-5xl font-display font-bold text-brand-safe leading-none">{productsAvoided}</span>
                  <span className="text-xs font-medium text-brand-safe/80 max-w-[150px] leading-tight">
                    products you chose not to buy {timeRange === 'week' ? 'this week' : 'this month'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {avoidedItems.map((item, i) => (
                    <span key={i} className="px-3 py-1 bg-brand-safe/10 border border-brand-safe/30 rounded-full text-[10px] uppercase tracking-wider font-bold text-brand-safe">
                      {item.includes('Sugar') ? '⚠️' : '🚨'} {item}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Flagged Count */}
          <div className="glass-card border border-white/5 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-content-secondary">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider font-medium">Flagged {timeRange === 'week' ? 'This Week' : 'This Month'}</span>
            </div>
            <div className="text-2xl font-display font-bold text-brand-hazardous">{hazardousCount}</div>
          </div>

          {/* Hazardous Products List */}
          {hazardousScans.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-content-primary">Hazardous Products Consumed</h3>
              <div className="space-y-3">
                {hazardousScans.map((scan) => {
                  const product = scan.product || SAMPLE_PRODUCTS.find(p => p.id === scan.productId);
                  if (!product) return null;
                  return (
                    <button
                      key={scan.id}
                      onClick={() => navigate(`/result/${scan.id}`)}
                      className="w-full bg-navy-800 hover:bg-navy-700 transition-colors rounded-2xl p-4 border border-brand-hazardous/30 flex items-center gap-4 text-left"
                    >
                      <div className="w-10 h-10 bg-navy-900 rounded-xl flex items-center justify-center text-xl border border-navy-600 flex-shrink-0 overflow-hidden">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : product.imageEmoji ? (
                          <span>{product.imageEmoji}</span>
                        ) : (
                          <ImageIcon className="w-5 h-5 text-content-secondary/50" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-content-primary truncate">{product.name}</h4>
                        <p className="text-xs text-brand-hazardous truncate">{scan.warnings[0] || 'Hazardous additives detected'}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Day Details Panel */}
      <DayDetailsPanel
        isOpen={isDayPanelOpen}
        onClose={() => setIsDayPanelOpen(false)}
        data={selectedDay}
      />
    </div>
  );
}