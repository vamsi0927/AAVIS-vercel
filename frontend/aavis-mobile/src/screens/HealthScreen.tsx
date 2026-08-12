import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  FlatList,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import {
  Flame,
  ShieldAlert,
  Shield,
  BarChart2,
  X,
  Package,
  Activity,
  Bot,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { useFocusEffect } from '@react-navigation/native';
import { getThemeColors } from '../lib/theme';
import FloatingAIBubble from '../components/FloatingAIBubble';
import { ScanResult } from '../lib/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_MAX_HEIGHT = 160;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toDateKey(d: Date): string {
  return d.toISOString().split('T')[0];
}

function calculateMedian(arr: number[]) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function calcGrade(avg: number, total: number): string {
  if (total === 0) return '-';
  if (avg >= 75) return 'A';
  if (avg >= 60) return 'B';
  if (avg >= 40) return 'C';
  return 'D';
}

export default function HealthScreen({ navigation }: any) {
  const { theme, scans, loadCloudScans, syncProfileFromCloud } = useAppContext();

  useFocusEffect(
    useCallback(() => {
      loadCloudScans().catch(() => {});
      syncProfileFromCloud().catch(() => {});
    }, [loadCloudScans, syncProfileFromCloud])
  );

  const colors = getThemeColors(theme);
  const isDark = theme === 'dark';

  const [timeRange, setTimeRange] = useState<'Week' | 'Month'>('Week');
  const [selectedDay, setSelectedDay] = useState<any>(null);

  const today = useMemo(() => new Date(), []);

  const signupDate = useMemo(() => {
    if (scans.length === 0) return new Date();
    const valid = scans.filter(s => s.date && !isNaN(new Date(s.date).getTime()));
    if (valid.length === 0) return new Date();
    const minMs = Math.min(...valid.map(s => new Date(s.date).getTime()));
    const d = new Date(minMs);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [scans]);

  // ─── Stats Calculations (matches original useChartData) ──────────────────────
  const periodDays = timeRange === 'Week' ? 7 : 30;

  const periodKeys = useMemo(() => {
    return Array.from({ length: periodDays }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (periodDays - 1 - i));
      return toDateKey(d);
    });
  }, [today, periodDays]);

  const scansByDate = useMemo(() => {
    const map: Record<string, ScanResult[]> = {};
    for (const scan of scans) {
      const k = toDateKey(new Date(scan.date));
      if (!map[k]) map[k] = [];
      map[k].push(scan);
    }
    return map;
  }, [scans]);

  const periodScans = useMemo(() => {
    const keySet = new Set(periodKeys);
    return scans.filter(s => keySet.has(toDateKey(new Date(s.date))));
  }, [scans, periodKeys]);

  // Calculations across all scans (SaaS header dashboard metrics)
  const allStats = useMemo(() => {
    const scores = scans.map(s => s.score);
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const highest = scores.length > 0 ? Math.max(...scores) : 0;
    const lowest = scores.length > 0 ? Math.min(...scores) : 0;
    const median = calculateMedian(scores);

    // active days vs total days
    const eligibleKeys = periodKeys.filter(k => {
      const d = new Date(k);
      d.setHours(0, 0, 0, 0);
      return d.getTime() >= signupDate.getTime();
    });
    const activeDays = eligibleKeys.filter(k => scansByDate[k]?.length > 0).length;
    const consistency = eligibleKeys.length > 0 ? Math.round((activeDays / eligibleKeys.length) * 100) : 0;

    const safeCount = scans.filter(s => s.verdict === 'safe').length;
    const cautionCount = scans.filter(s => s.verdict === 'caution').length;
    const hazardousCount = scans.filter(s => s.verdict === 'hazardous').length;

    // Best and Worst days
    const dayStats = periodKeys.map(k => ({
      day: k,
      score: scansByDate[k]?.length ? Math.round(scansByDate[k].reduce((acc, s) => acc + s.score, 0) / scansByDate[k].length) : 0
    })).filter(d => d.score > 0);

    dayStats.sort((a, b) => b.score - a.score);
    const bestDay = dayStats.length > 0 ? dayStats[0] : null;
    const worstDay = dayStats.length > 0 ? dayStats[dayStats.length - 1] : null;

    return {
      average: avg,
      highest,
      lowest,
      median,
      consistency,
      safeCount,
      cautionCount,
      hazardousCount,
      bestDay,
      worstDay
    };
  }, [scans, periodKeys, scansByDate, periodDays]);

  const streak = useMemo(() => {
    if (!scans.length) return 0;
    const todayKey = toDateKey(today);
    const yestKey = toDateKey(new Date(today.getTime() - 86400000));
    if (!scansByDate[todayKey] && !scansByDate[yestKey]) return 0;
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const k = toDateKey(new Date(today.getTime() - i * 86400000));
      if (scansByDate[k]?.length) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [scans, scansByDate, today]);

  // Avoided products (hazardous products this period)
  const hazardousThisPeriod = useMemo(
    () => periodScans.filter(s => s.verdict === 'hazardous'),
    [periodScans]
  );
  
  const avoidedCount = hazardousThisPeriod.length;

  const avoidedItems = useMemo(() => {
    return hazardousThisPeriod.map(s => {
      const warning = s.warnings?.[0] || 'High Sugar/Sodium';
      const prodName = s.product?.name || 'Product';
      return `${prodName} (${warning})`;
    });
  }, [hazardousThisPeriod]);

  // Chart data
  const chartData = useMemo(() => {
    if (timeRange === 'Week') {
      return periodKeys.map(key => {
        const dayScans = scansByDate[key] ?? [];
        const d = new Date(key);
        const dayAvg = dayScans.length > 0 ? Math.round(dayScans.reduce((acc, s) => acc + s.score, 0) / dayScans.length) : 0;
        return {
          label: DAY_LABELS[d.getDay()],
          score: dayAvg,
          scans: dayScans,
          dateKey: key,
          isEmpty: dayScans.length === 0
        };
      });
    }
    // Monthly: 6 buckets of 5 days
    return Array.from({ length: 6 }, (_, b) => {
      const bucketKeys = periodKeys.slice(b * 5, b * 5 + 5);
      const bucketScans = bucketKeys.flatMap(k => scansByDate[k] ?? []);
      const startDay = new Date(bucketKeys[0]).getDate();
      const bucketAvg = bucketScans.length > 0 ? Math.round(bucketScans.reduce((acc, s) => acc + s.score, 0) / bucketScans.length) : 0;
      return {
        label: `${startDay}`,
        score: bucketAvg,
        scans: bucketScans,
        dateKey: `${bucketKeys[0]} – ${bucketKeys[4]}`,
        isEmpty: bucketScans.length === 0
      };
    });
  }, [timeRange, periodKeys, scansByDate]);

  // Motivational quote
  const quote = useMemo(() => {
    if (streak === 0) return 'Every journey starts with a single scan. Start today! 🌱';
    if (streak < 7)
      return `You've been eating consciously for ${streak} day${streak !== 1 ? 's' : ''}. Your body is noticing! 💚`;
    return "One full week of conscious eating! You're building a real habit 🔥";
  }, [streak]);

  const overallGrade = useMemo(
    () => calcGrade(allStats.average, scans.length),
    [allStats.average, scans.length]
  );

  const getScoreStatusMessage = (score: number) => {
    if (scans.length === 0) return 'No scan history recorded yet';
    if (scans.length < 3) return 'Not enough data to compare';
    if (score >= 75) return 'Excellent metabolic health standard';
    if (score >= 60) return 'Good health profile. Keep upgrading!';
    if (score >= 40) return 'Needs attention. Limit processed foods.';
    return 'Critical profile. Seek fresh, whole ingredients.';
  };

  const getGradeColor = (g: string) => {
    if (g === 'A') return colors.brandSafe;
    if (g === 'B') return colors.brandPrimary;
    if (g === 'C') return colors.brandCaution;
    return colors.brandHazardous;
  };

  const handleBarPress = useCallback((day: any) => setSelectedDay(day), []);

  const styles = getStyles(colors, isDark);

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Health</Text>
        </View>

        {/* ── 1. SaaS Overall Health Score Card (Approved Design) ─────────── */}
        <View style={[styles.mainScoreCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.scoreHeaderRow}>
            <View>
              <Text style={styles.cardHeaderLabel}>AVG SCORE</Text>
              <Text style={[styles.scoreValueText, { color: getGradeColor(overallGrade) }]}>
                {scans.length > 0 ? allStats.average : '--'}
              </Text>
            </View>
            <View style={styles.scoreHeaderDetails}>
              <Text style={[styles.scoreStatusText, { color: colors.textPrimary }]}>
                {getScoreStatusMessage(allStats.average)}
              </Text>
            </View>
          </View>

          {/* Stats Bar */}
          <View style={[styles.metricsBar, { borderTopColor: colors.border }]}>
            <View style={styles.metricsItem}>
              <Text style={styles.metricsValue}>{allStats.highest || '--'}</Text>
              <Text style={styles.metricsLabel}>HIGHEST</Text>
            </View>
            <View style={[styles.metricsDivider, { backgroundColor: colors.border }]} />
            <View style={styles.metricsItem}>
              <Text style={styles.metricsValue}>{allStats.lowest || '--'}</Text>
              <Text style={styles.metricsLabel}>LOWEST</Text>
            </View>
            <View style={[styles.metricsDivider, { backgroundColor: colors.border }]} />
            <View style={styles.metricsItem}>
              <Text style={styles.metricsValue}>{allStats.median || '--'}</Text>
              <Text style={styles.metricsLabel}>MEDIAN</Text>
            </View>
            <View style={[styles.metricsDivider, { backgroundColor: colors.border }]} />
            <View style={styles.metricsItem}>
              <Text style={styles.metricsValue}>{allStats.consistency}%</Text>
              <Text style={styles.metricsLabel}>CONSISTENCY</Text>
            </View>
          </View>

          {/* Day Records */}
          <View style={[styles.dayRecordsRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.recordText, { color: colors.textSecondary }]}>
              Best Day: <Text style={{ color: colors.brandSafe, fontWeight: 'bold' }}>{allStats.bestDay ? `${allStats.bestDay.day} (${allStats.bestDay.score})` : '--'}</Text>
            </Text>
            <Text style={[styles.recordText, { color: colors.textSecondary }]}>
              Lowest Day: <Text style={{ color: colors.brandHazardous, fontWeight: 'bold' }}>{allStats.worstDay ? `${allStats.worstDay.day} (${allStats.worstDay.score})` : '--'}</Text>
            </Text>
          </View>

          {/* Verdict Counts */}
          <View style={[styles.verdictCountsRow, { backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)' }]}>
            <Text style={[styles.verdictCountsText, { color: colors.textPrimary }]}>
              Total: {scans.length}  ·  <Text style={{ color: colors.brandSafe, fontWeight: 'bold' }}>{allStats.safeCount} Safe</Text>  ·  <Text style={{ color: colors.brandCaution, fontWeight: 'bold' }}>{allStats.cautionCount} Ctn</Text>  ·  <Text style={{ color: colors.brandHazardous, fontWeight: 'bold' }}>{allStats.hazardousCount} Haz</Text>
            </Text>
          </View>
        </View>

        {/* ── 2. Time Range Toggle & History Chart ───────────────────────── */}
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.chartHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Health Score History</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Scores per {timeRange === 'Week' ? 'day' : '5-day bucket'}
              </Text>
            </View>

            {/* Time Pill Toggle */}
            <View style={[styles.toggleContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)' }]}>
              {(['Week', 'Month'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.togglePill,
                    timeRange === t ? [styles.pillActive, { backgroundColor: colors.brandPrimary }] : styles.pillInactive,
                  ]}
                  onPress={() => setTimeRange(t)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.pillText,
                      timeRange === t ? styles.pillTextActive : [styles.pillTextInactive, { color: colors.textSecondary }],
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bar Chart View */}
          <View style={styles.barChartContainer}>
            {chartData.map((day, i) => {
              const empty = day.score === 0;
              const fillH = empty ? 0 : Math.max(6, (day.score / 100) * BAR_MAX_HEIGHT);
              
              let barColor = colors.brandPrimary;
              if (!empty) {
                if (day.score >= 80) barColor = colors.brandSafe;
                else if (day.score >= 60) barColor = colors.brandPrimary;
                else if (day.score >= 40) barColor = colors.brandCaution;
                else barColor = colors.brandHazardous;
              }

              const barWidth = Math.floor((SCREEN_WIDTH - 80 - (chartData.length - 1) * 6) / chartData.length);
              
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.barColumn, { width: barWidth }]}
                  onPress={() => !empty && handleBarPress(day)}
                  activeOpacity={empty ? 1 : 0.7}
                >
                  {!empty && <Text style={[styles.barScoreLabel, { color: colors.textSecondary }]}>{day.score}</Text>}
                  <View style={[styles.barTrack, { height: BAR_MAX_HEIGHT, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}>
                    {!empty && (
                      <View style={[styles.barFill, { height: fillH, backgroundColor: barColor }]} />
                    )}
                  </View>
                  <Text style={[styles.barDayLabel, { color: colors.textSecondary }]} numberOfLines={1}>{day.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={[styles.legendRow, { borderTopColor: colors.border }]}>
            {[
              { color: colors.brandSafe, label: '≥80' },
              { color: colors.brandPrimary, label: '60–79' },
              { color: colors.brandCaution, label: '40–59' },
              { color: colors.brandHazardous, label: '<40' },
            ].map(l => (
              <View key={l.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>{l.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 3. Ask AI Nutritionist Banner Card ─────────────────────────── */}
        <TouchableOpacity
          style={[styles.aiBannerCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => navigation.navigate('NutritionChat')}
          activeOpacity={0.85}
        >
          <View style={[styles.aiIconWrapper, { backgroundColor: colors.brandPrimary + '15' }]}>
            <Bot color={colors.brandPrimary} size={24} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.aiBannerTitle, { color: colors.textPrimary }]}>Ask AI Nutritionist</Text>
            <Text style={[styles.aiBannerText, { color: colors.textSecondary }]}>Get instant suggestions & diet adjustments customized for you.</Text>
          </View>
          <ChevronRight color={colors.textSecondary} size={20} />
        </TouchableOpacity>

        {/* ── 4. Grade Explainer Card ────────────────────────────────────── */}
        <View style={[styles.explainerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 12 }]}>What your grade means</Text>
          <View style={styles.explainerList}>
            {[
              { grade: 'A', icon: '🟢', label: 'Excellent', range: '75–100', color: colors.brandSafe },
              { grade: 'B', icon: '🔵', label: 'Good', range: '60–74', color: colors.brandPrimary },
              { grade: 'C', icon: '🟡', label: 'Needs Work', range: '40–59', color: colors.brandCaution },
              { grade: 'D', icon: '🔴', label: 'Poor', range: 'below 40', color: colors.brandHazardous },
            ].map((row) => {
              const isCurrent = overallGrade === row.grade || (overallGrade === '-' && row.grade === 'D');
              return (
                <View
                  key={row.grade}
                  style={[
                    styles.explainerRow,
                    { borderLeftColor: isCurrent ? row.color : 'transparent' },
                    isCurrent && { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }
                  ]}
                >
                  <View style={styles.explainerRowLeft}>
                    <Text style={[styles.gradeTextLabel, { color: row.color }]}>{row.grade}</Text>
                    <Text style={styles.explainerEmoji}>{row.icon}</Text>
                    <Text style={[styles.explainerName, { color: colors.textPrimary }]}>{row.label}</Text>
                  </View>
                  <Text style={[styles.rangeText, { color: colors.textSecondary }]}>{row.range}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── 5. Streak & Weekly Grade (Approved Column layout) ──────────── */}
        <View style={styles.streakGradeRow}>
          {/* Quote Card */}
          <View style={[styles.halfCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.halfIconBox}>
              <Flame color="#fb923c" size={24} />
            </View>
            <Text style={[styles.quoteText, { color: colors.textPrimary }]} numberOfLines={3}>
              "{quote}"
            </Text>
          </View>

          {/* Letter Grade Card */}
          <View style={[styles.halfCard, { backgroundColor: colors.card, borderColor: colors.border, alignItems: 'center' }]}>
            <View style={[styles.largeGradeCircle, { backgroundColor: getGradeColor(overallGrade) }]}>
              <Text style={styles.largeGradeText}>{overallGrade}</Text>
            </View>
            <Text style={[styles.gradeTimeText, { color: colors.textPrimary }]}>
              {timeRange === 'Week' ? 'This Week' : 'This Month'}
            </Text>
            <Text style={[styles.gradeSubText, { color: colors.textSecondary }]}>Based on your scans</Text>
          </View>
        </View>

        {/* ── 6. Harmful Products Avoided Card (Approved layout) ─────────── */}
        <View style={[styles.avoidedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.avoidedTitle, { color: colors.brandSafe }]}>Harmful Products Avoided ✋</Text>
          {avoidedCount === 0 ? (
            <Text style={[styles.avoidedEmptyText, { color: colors.textSecondary }]}>
              Scan products to track what you choose not to consume.
            </Text>
          ) : (
            <View style={styles.avoidedContent}>
              <View style={styles.avoidedStatsRow}>
                <Text style={[styles.avoidedCountBig, { color: colors.brandSafe }]}>{avoidedCount}</Text>
                <Text style={[styles.avoidedStatsSub, { color: colors.textSecondary }]}>
                  products you chose not to buy {timeRange === 'Week' ? 'this week' : 'this month'}
                </Text>
              </View>
              <View style={styles.avoidedChipsWrap}>
                {avoidedItems.map((item, idx) => (
                  <View key={idx} style={[styles.avoidedPill, { backgroundColor: colors.brandSafe + '12', borderColor: colors.brandSafe + '30' }]}>
                    <Text style={[styles.avoidedPillText, { color: colors.brandSafe }]}>
                      ⚠️ {item}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* ── 7. Flagged This Week Card ───────────────────────────────────── */}
        <View style={[styles.flaggedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.flaggedLeft}>
            <AlertTriangle color={colors.brandHazardous} size={18} />
            <Text style={[styles.flaggedLabelText, { color: colors.textSecondary }]}>
              Flagged {timeRange === 'Week' ? 'This Week' : 'This Month'}
            </Text>
          </View>
          <Text style={[styles.flaggedCountBig, { color: colors.brandHazardous }]}>
            {avoidedCount}
          </Text>
        </View>

        {/* ── 8. Hazardous Products Consumed list ─────────────────────────── */}
        {hazardousThisPeriod.length > 0 && (
          <View style={styles.consumedSection}>
            <Text style={[styles.consumedSectionTitle, { color: colors.textPrimary }]}>
              Hazardous Products Consumed
            </Text>
            <View style={styles.consumedList}>
              {hazardousThisPeriod.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.consumedRow, { backgroundColor: colors.card, borderColor: colors.brandHazardous + '30' }]}
                  onPress={() => navigation.navigate('Result', { data: s })}
                  activeOpacity={0.8}
                >
                  <View style={[styles.consumedIconWrapper, { backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.03)' }]}>
                    {s.product?.imageEmoji ? (
                      <Text style={styles.consumedEmoji}>{s.product.imageEmoji}</Text>
                    ) : (
                      <ShieldAlert color={colors.brandHazardous} size={20} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.consumedName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {s.product?.name ?? 'Unknown Product'}
                    </Text>
                    <Text style={[styles.consumedWarning, { color: colors.brandHazardous }]} numberOfLines={1}>
                      {s.warnings?.[0] || 'Hazardous additives detected'}
                    </Text>
                  </View>
                  <View style={[styles.scoreBadgeMini, { backgroundColor: colors.brandHazardous + '15' }]}>
                    <Text style={[styles.scoreBadgeMiniText, { color: colors.brandHazardous }]}>{s.score}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Bottom Spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Day details bottom sheet */}
      <Modal visible={!!selectedDay} transparent animationType="slide" onRequestClose={() => setSelectedDay(null)}>
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheetContainer, { backgroundColor: isDark ? '#111324' : '#ffffff' }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                {selectedDay?.dateKey ? new Date(selectedDay.dateKey).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
              </Text>
              <TouchableOpacity onPress={() => setSelectedDay(null)} style={[styles.sheetClose, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                <X color={colors.textSecondary} size={18} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
              {selectedDay?.scans.length ?? 0} scan{(selectedDay?.scans.length ?? 0) !== 1 ? 's' : ''} · Avg {selectedDay?.score ?? 0}
            </Text>
            
            <FlatList
              data={selectedDay?.scans ?? []}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={[styles.sheetScanRow, { borderBottomColor: colors.border }]}>
                  <View style={styles.sheetScanLeft}>
                    <Text style={[styles.sheetScanName, { color: colors.textPrimary }]} numberOfLines={1}>{item.product?.name ?? 'Product'}</Text>
                    <Text style={[styles.sheetScanVerdict, { color: item.verdict === 'safe' ? colors.brandSafe : item.verdict === 'caution' ? colors.brandCaution : colors.brandHazardous }]}>{item.verdict}</Text>
                  </View>
                  <View style={[styles.sheetScoreBadge, { backgroundColor: (item.score >= 75 ? colors.brandSafe : item.score >= 40 ? colors.brandCaution : colors.brandHazardous) + '15' }]}>
                    <Text style={[styles.sheetScoreText, { color: item.score >= 75 ? colors.brandSafe : item.score >= 40 ? colors.brandCaution : colors.brandHazardous }]}>{item.score}</Text>
                  </View>
                </View>
              )}
              style={styles.sheetList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* Floating AI Bubble */}
      <FloatingAIBubble />
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 110,
    gap: 16,
  },
  header: {
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  mainScoreCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  scoreHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingBottom: 16,
  },
  cardHeaderLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.8,
  },
  scoreValueText: {
    fontSize: 48,
    fontWeight: '900',
    lineHeight: 52,
    marginTop: 2,
  },
  scoreHeaderDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  scoreStatusText: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  metricsBar: {
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  metricsItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricsValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  metricsLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  metricsDivider: {
    width: 1,
    height: 24,
  },
  dayRecordsRow: {
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  recordText: {
    fontSize: 11,
    fontWeight: '600',
  },
  verdictCountsRow: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  verdictCountsText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chartCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  togglePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  pillActive: {
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 1,
  },
  pillInactive: {},
  pillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  pillTextActive: {
    color: '#ffffff',
  },
  pillTextInactive: {},
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: BAR_MAX_HEIGHT + 35,
    paddingBottom: 15,
  },
  barColumn: {
    alignItems: 'center',
  },
  barScoreLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 4,
  },
  barTrack: {
    width: '100%',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
  },
  barDayLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
  },
  legendRow: {
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '700',
  },
  aiBannerCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  aiIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  aiBannerText: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
    paddingRight: 6,
  },
  explainerCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
  },
  explainerList: {
    gap: 6,
  },
  explainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  explainerRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gradeTextLabel: {
    fontSize: 15,
    fontWeight: '900',
    width: 16,
    textAlign: 'center',
  },
  explainerEmoji: {
    fontSize: 12,
  },
  explainerName: {
    fontSize: 13,
    fontWeight: '700',
  },
  rangeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  streakGradeRow: {
    flexDirection: 'row',
    gap: 14,
  },
  halfCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    justifyContent: 'center',
  },
  halfIconBox: {
    marginBottom: 8,
  },
  quoteText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  largeGradeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  largeGradeText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
  },
  gradeTimeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  gradeSubText: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  avoidedCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  avoidedTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  avoidedEmptyText: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
  },
  avoidedContent: {
    marginTop: 10,
  },
  avoidedStatsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  avoidedCountBig: {
    fontSize: 44,
    fontWeight: '900',
  },
  avoidedStatsSub: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    lineHeight: 14,
  },
  avoidedChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  avoidedPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  avoidedPillText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  flaggedCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flaggedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flaggedLabelText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  flaggedCountBig: {
    fontSize: 22,
    fontWeight: '900',
  },
  consumedSection: {
    marginTop: 4,
  },
  consumedSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  consumedList: {
    gap: 10,
  },
  consumedRow: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  consumedIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consumedEmoji: {
    fontSize: 20,
  },
  consumedName: {
    fontSize: 14,
    fontWeight: '800',
  },
  consumedWarning: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  scoreBadgeMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBadgeMiniText: {
    fontSize: 11,
    fontWeight: '900',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '75%',
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 16,
  },
  sheetList: {
    marginTop: 4,
  },
  sheetScanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sheetScanLeft: {
    flex: 1,
    marginRight: 12,
  },
  sheetScanName: {
    fontSize: 14,
    fontWeight: '700',
  },
  sheetScanVerdict: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  sheetScoreBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScoreText: {
    fontSize: 12,
    fontWeight: '900',
  },
});
