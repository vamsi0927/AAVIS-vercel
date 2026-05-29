import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from
  'recharts';
import { Activity, AlertTriangle, ChevronLeft, TrendingUp } from 'lucide-react';
import { HistoryRow } from '../../components/HistoryRow';
import { supabase } from '../../lib/supabaseClient';
import aiAssistantImg from '../../assets/ai-assistant.jpg';
import { useAppContext } from '../../context/AppContext';
import { SAMPLE_PRODUCTS } from '../../data/sampleProducts';
export function HealthDashboard() {
  const navigate = useNavigate();
  const { scans } = useAppContext();
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  // Filter scans based on selected timeRange (7 days vs 30 days)
  const scansInRange = scans.filter(s => {
    const scanDate = new Date(s.date);
    const today = new Date();
    const isWithinRange = timeRange === 'week' 
      ? (today.getTime() - scanDate.getTime()) <= (7 * 24 * 60 * 60 * 1000)
      : (today.getTime() - scanDate.getTime()) <= (30 * 24 * 60 * 60 * 1000);
    return isWithinRange;
  });

  // Calculate dynamic average score for range
  const avgScore = scansInRange.length > 0
    ? Math.round(scansInRange.reduce((acc, s) => acc + s.score, 0) / scansInRange.length)
    : 0;

  // Calculate grade based on avgScore
  let weeklyGrade = '-';
  if (scansInRange.length > 0) {
    if (avgScore >= 75) weeklyGrade = 'A';
    else if (avgScore >= 60) weeklyGrade = 'B';
    else if (avgScore >= 40) weeklyGrade = 'C';
    else weeklyGrade = 'D';
  }

  // Calculate streak from scan dates
  let streak = 0;
  if (scans.length > 0) {
    const dates = scans.map(s => new Date(s.date).toDateString());
    const uniqueDates = Array.from(new Set(dates)).map(d => new Date(d));
    uniqueDates.sort((a, b) => b.getTime() - a.getTime()); // descending order
    
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    const hasScanTodayOrYesterday = dates.includes(today) || dates.includes(yesterday);
    if (hasScanTodayOrYesterday) {
      streak = 1;
      let current = uniqueDates[0];
      for (let i = 1; i < uniqueDates.length; i++) {
        const diffTime = Math.abs(current.getTime() - uniqueDates[i].getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streak++;
          current = uniqueDates[i];
        } else {
          break;
        }
      }
    }
  }

  // Calculate hazardous counts and list avoided items dynamically for range
  const hazardousScans = scansInRange.filter((s) => s.verdict === 'hazardous');
  const hazardousCount = hazardousScans.length;
  const productsAvoided = hazardousScans.length;
  const avoidedItems = hazardousScans.map(s => {
    const warning = s.warnings?.[0] || 'Flagged Additive';
    const prodName = s.product?.name || 'Product';
    return `${prodName} (${warning})`;
  });

  // Calculate dynamic weekly/monthly chartData
  let chartData: { day: string; score: number }[] = [];

  if (timeRange === 'week') {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d);
    }
    chartData = days.map(d => {
      const dateStr = d.toLocaleDateString(undefined, { weekday: 'short' });
      const scansOnDay = scans.filter(s => {
        const scanDate = new Date(s.date);
        return scanDate.toDateString() === d.toDateString();
      });
      const avgScoreOnDay = scansOnDay.length > 0
        ? Math.round(scansOnDay.reduce((acc, s) => acc + s.score, 0) / scansOnDay.length)
        : 0;
      return { day: dateStr, score: avgScoreOnDay };
    });
  } else {
    // Group into 4 weeks of the last 30 days
    const weeks = [
      { label: 'Wk 4', minDays: 22, maxDays: 30 },
      { label: 'Wk 3', minDays: 15, maxDays: 21 },
      { label: 'Wk 2', minDays: 8, maxDays: 14 },
      { label: 'Wk 1', minDays: 0, maxDays: 7 }
    ];
    chartData = weeks.map(w => {
      const scansInWeek = scans.filter(s => {
        const scanDate = new Date(s.date);
        const diffTime = Math.abs(new Date().getTime() - scanDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= w.minDays && diffDays <= w.maxDays;
      });
      const avgScoreInWeek = scansInWeek.length > 0
        ? Math.round(scansInWeek.reduce((acc, s) => acc + s.score, 0) / scansInWeek.length)
        : 0;
      return { day: w.label, score: avgScoreInWeek };
    });
  }

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
        
        {/* Left Column: Toggle, Chart, Ask AI, Grade Breakdown */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-6 mb-6 md:mb-0">
          {/* Toggle */}
          <div className="flex bg-navy-800 p-1 rounded-xl">
            <button
              onClick={() => setTimeRange('week')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${timeRange === 'week' ? 'bg-navy-600 text-white shadow-sm' : 'text-content-secondary hover:text-content-primary'}`}>

              This Week
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${timeRange === 'month' ? 'bg-navy-600 text-white shadow-sm' : 'text-content-secondary hover:text-content-primary'}`}>

              This Month
            </button>
          </div>

          {/* Chart */}
          <div className="bg-navy-800 border border-navy-700 rounded-2xl p-5">
            <h3 className="font-semibold mb-6 text-content-primary">
              Score Trend
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 0,
                    right: 0,
                    left: -20,
                    bottom: 0
                  }}>

                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: '#9ca3b8',
                      fontSize: 12
                    }}
                    dy={10} />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: '#9ca3b8',
                      fontSize: 12
                    }} />

                  <Tooltip
                    cursor={{
                      fill: '#2a2f45'
                    }}
                    contentStyle={{
                      backgroundColor: '#1f2335',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#f4f5fb'
                    }} />

                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) =>
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.score >= 75 ?
                            '#22c55e' :
                            entry.score >= 40 ?
                              '#f59e0b' :
                              '#ef4444'
                        } />

                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ask AI Navigation */}
          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={() => navigate('/dashboard/chat')}
              className="bg-navy-800 rounded-2xl p-4 flex items-center justify-center text-center gap-3 hover:bg-navy-700 transition-colors shadow-lg shadow-black/20"
            >
              <div className="w-10 h-10 rounded-full bg-navy-800 flex items-center justify-center overflow-hidden border border-brand-primary/30">
                <img src={aiAssistantImg} alt="AI" className="w-full h-full object-cover" />
              </div>
              <span className="text-sm font-medium text-white">Ask AI Nutritionist</span>
            </button>
          </div>

          {/* SECTION 5: Weekly Grade Breakdown */}
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
                    className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                      isCurrent ? 'bg-white/5 shadow-md' : 'opacity-70'
                    }`}
                    style={{ borderLeft: isCurrent ? `4px solid ${row.color}` : '4px solid transparent' }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold w-6 text-center" style={{ color: row.color }}>
                        {row.grade}
                      </span>
                      <span className="text-sm">{row.icon}</span>
                      <span className="text-sm font-medium text-white">{row.label}</span>
                    </div>
                    <span className="text-xs text-content-secondary font-medium">{row.range}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-content-secondary mt-5 text-center">
              Scan more products daily to improve your grade
            </p>
          </div>
        </div>

        {/* Right Column: Streak, Grade, Quote, Avoided, Flagged Count, Hazardous List */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-6">
          {/* SECTION 1: Streak and Grade */}
          <div className="grid grid-cols-2 gap-4">
            {/* Card 1 — Scan Streak */}
            <div className="glass-card border border-brand-caution/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <div className="text-3xl mb-1">🔥</div>
              <div className="text-4xl font-display font-bold text-white leading-none mb-1">
                {streak}
              </div>
              <div className="text-sm font-medium text-white">Day Streak</div>
              <div className="text-xs text-brand-safe font-medium mt-1">
                {streak === 0 ? "Start today 💪" : "Keep it going!"}
              </div>
            </div>

            {/* Card 2 — Weekly Grade */}
            <div className="glass-card border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold mb-2 ${
                  weeklyGrade === 'A' ? 'bg-[#22c55e] text-white' :
                  weeklyGrade === 'B' ? 'bg-[#6366f1] text-white' :
                  weeklyGrade === 'C' ? 'bg-[#f59e0b] text-white' :
                  weeklyGrade === 'D' ? 'bg-[#ef4444] text-white' :
                  'bg-navy-700 text-content-secondary'
                }`}>
                {weeklyGrade}
              </div>
              <div className="text-sm font-medium text-white">{timeRange === 'week' ? 'This Week' : 'This Month'}</div>
              <div className="text-[10px] text-content-secondary mt-0.5 font-medium">Based on your scans</div>
            </div>
          </div>

          {/* SECTION 3: Motivational Quote Card */}
          <div className="glass-card rounded-2xl p-5 border border-white/5 flex items-center gap-4">
            <div className="text-3xl flex-shrink-0">🔥</div>
            <p className="text-sm italic text-white/90 leading-relaxed font-medium">
              "{quoteText}"
            </p>
          </div>

          {/* SECTION 2: Products Avoided */}
          <div className="glass-card border border-brand-safe/30 rounded-2xl p-5 flex flex-col relative overflow-hidden">
            <h2 className="text-sm font-medium text-brand-safe uppercase tracking-wider mb-1">
              Harmful Products Avoided ✋
            </h2>

            {productsAvoided === 0 ? (
              <p className="text-sm text-brand-safe/80 mt-2">Scan products to track what you're avoiding</p>
            ) : (
              <>
                <div className="flex items-baseline gap-2 mb-1 mt-2">
                  <span className="text-5xl font-display font-bold text-brand-safe leading-none">
                    {productsAvoided}
                  </span>
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

          {/* Flagged Card */}
          <div className="glass-card border border-white/5 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-content-secondary">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider font-medium">
                Flagged {timeRange === 'week' ? 'This Week' : 'This Month'}
              </span>
            </div>
            <div className="text-2xl font-display font-bold text-brand-hazardous">
              {hazardousCount}
            </div>
          </div>

          {/* Hazardous Products List */}
          {hazardousScans.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-content-primary">
                Hazardous Products Consumed
              </h3>
              <div className="space-y-3">
                {hazardousScans.map((scan) => {
                  const product = scan.product || SAMPLE_PRODUCTS.find(
                    (p) => p.id === scan.productId
                  );
                  if (!product) return null;
                  return (
                    <button
                      key={scan.id}
                      onClick={() => navigate(`/result/${scan.id}`)}
                      className="w-full bg-navy-800 hover:bg-navy-700 transition-colors rounded-2xl p-4 border border-brand-hazardous/30 flex items-center gap-4 text-left">

                      <div className="w-10 h-10 bg-navy-900 rounded-xl flex items-center justify-center text-xl border border-navy-600 flex-shrink-0">
                        {product.imageEmoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-content-primary truncate">
                          {product.name}
                        </h4>
                        <p className="text-xs text-brand-hazardous truncate">
                          {scan.warnings[0] || 'Hazardous additives detected'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>);

}