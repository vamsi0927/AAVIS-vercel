import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {
  ChevronLeft,
  RefreshCcw,
  Zap,
  BookOpen,
  CheckCircle2,
  XCircle,
  Share2,
  ExternalLink,
} from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { getThemeColors } from '../lib/theme';
import { DEFAULT_MYTHS } from '../data/defaultMyths';
import { loadLocalPrefs, saveLocalPrefs } from '../lib/storage';

const DID_YOU_KNOW_FACTS = [
  "Honey should not be given to infants under one year because of botulism risk.",
  "MSG is considered safe by the FDA when consumed within acceptable limits.",
  "Carrots are rich in vitamin A, but eating lots of them won't give you perfect night vision.",
  "Microwaving food does not significantly destroy its nutrients compared to other cooking methods.",
  "Brown eggs are not nutritionally superior to white eggs; shell color just depends on the breed of the hen.",
  "Drinking eight glasses of water a day is a guideline, but fluid needs vary based on diet, activity, and climate.",
  "Eating late at night doesn't automatically make you gain weight; it's total daily calorie intake that matters."
];

export default function FoodMythsScreen({ navigation }: any) {
  const { theme } = useAppContext();
  const colors = getThemeColors(theme);
  const isDark = theme === 'dark';

  const [mythData, setMythData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [guess, setGuess] = useState<'fact' | 'fiction' | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [didYouKnow, setDidYouKnow] = useState(DID_YOU_KNOW_FACTS[0]);
  const seenQuestionsRef = useRef<Set<string>>(new Set());

  // Session Stats
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionWrong, setSessionWrong] = useState(0);
  
  const sessionTotal = sessionCorrect + sessionWrong;
  const accuracy = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0;

  const rotateDidYouKnow = () => {
    const randomFact = DID_YOU_KNOW_FACTS[Math.floor(Math.random() * DID_YOU_KNOW_FACTS.length)];
    setDidYouKnow(randomFact);
  };

  const fetchFact = () => {
    const prefs = loadLocalPrefs();
    const mythsCompleted = prefs.mythsCompletedCount ?? 0;
    
    if (mythsCompleted >= DEFAULT_MYTHS.length) {
      setQuestionCount(mythsCompleted);
      setIsLoading(false);
      return;
    }

    if (mythData) {
      seenQuestionsRef.current.add(mythData.myth);
      const newCount = mythsCompleted + 1;
      saveLocalPrefs({ mythsCompletedCount: newCount });
      
      if (newCount >= DEFAULT_MYTHS.length) {
        setQuestionCount(newCount);
        setIsLoading(false);
        return;
      }
    }
    
    setIsLoading(true);
    setGuess(null);
    rotateDidYouKnow();
    
    const unseen = DEFAULT_MYTHS.filter(m => !seenQuestionsRef.current.has(m.myth));
    const nextMyth = unseen.length > 0 ? unseen[0] : DEFAULT_MYTHS[mythsCompleted % DEFAULT_MYTHS.length];
    
    setMythData(nextMyth);
    setQuestionCount(mythsCompleted);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchFact();
  }, []);

  const handleGuess = (userGuess: 'fact' | 'fiction') => {
    setGuess(userGuess);
    const isCorrect = (userGuess === 'fiction');
    if (isCorrect) {
      setSessionCorrect(prev => prev + 1);
    } else {
      setSessionWrong(prev => prev + 1);
    }
  };

  const handleResetSession = () => {
    setSessionCorrect(0);
    setSessionWrong(0);
  };

  const handleResetProgression = () => {
    saveLocalPrefs({ mythsCompletedCount: 0 });
    seenQuestionsRef.current.clear();
    setSessionCorrect(0);
    setSessionWrong(0);
    setQuestionCount(0);
    setMythData(DEFAULT_MYTHS[0]);
    setGuess(null);
  };

  const handleShare = async () => {
    if (!mythData) return;
    try {
      await Share.share({
        message: `Food Myth checked on Aavis!\n\nMyth: ${mythData.myth}\n\nFact: ${mythData.fact || mythData.explanation}\n\nChecked via Aavis App!`,
      });
    } catch (err) {
      console.log('Error sharing', err);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: isDark ? '#080914' : '#ffffff' }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
            <ChevronLeft color={colors.textPrimary} size={22} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Myths vs Facts</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Stats Row */}
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statsInfo}>
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Correct</Text>
              <Text style={[styles.statValue, { color: colors.brandSafe }]}>{sessionCorrect}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Wrong</Text>
              <Text style={[styles.statValue, { color: colors.brandHazardous }]}>{sessionWrong}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Accuracy</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{accuracy}%</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleResetSession} style={styles.resetButton}>
            <RefreshCcw color={colors.textSecondary} size={16} />
          </TouchableOpacity>
        </View>

        {/* Main Quiz Section */}
        {questionCount >= DEFAULT_MYTHS.length ? (
          <View style={[styles.quizCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: colors.brandPrimary + '22' }]}>
              <CheckCircle2 color={colors.brandPrimary} size={40} />
            </View>
            <Text style={[styles.caughtUpTitle, { color: colors.textPrimary }]}>You're all caught up!</Text>
            <Text style={[styles.caughtUpText, { color: colors.textSecondary }]}>
              You've answered all available myth checks. Great job building your nutrition literacy!
            </Text>
            <View style={styles.caughtUpActions}>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.brandPrimary }]}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.btnText}>Return Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: colors.border }]}
                onPress={handleResetProgression}
              >
                <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>Reset and Restart</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.brandPrimary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading next myth...</Text>
          </View>
        ) : (
          mythData && (
            <View style={[styles.quizCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.tag, { backgroundColor: colors.brandPrimary + '15', borderColor: colors.brandPrimary + '30' }]}>
                  <BookOpen color={colors.brandPrimary} size={12} />
                  <Text style={[styles.tagText, { color: colors.brandPrimary }]}>Fact Check</Text>
                </View>
                {guess && (
                  <TouchableOpacity onPress={handleShare} style={[styles.shareButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                    <Share2 color={colors.textSecondary} size={16} />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={[styles.mythText, { color: colors.textPrimary }]}>
                {mythData.myth}
              </Text>

              {!guess ? (
                <View style={styles.optionsContainer}>
                  <Text style={[styles.promptText, { color: colors.textSecondary }]}>Is this a fact or fiction?</Text>
                  <View style={styles.optionsRow}>
                    <TouchableOpacity
                      style={[styles.optionButton, { backgroundColor: colors.brandSafe + '15', borderColor: colors.brandSafe + '30' }]}
                      onPress={() => handleGuess('fact')}
                    >
                      <Text style={styles.emojiIcon}>✅</Text>
                      <Text style={[styles.optionText, { color: colors.brandSafe }]}>Fact</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.optionButton, { backgroundColor: colors.brandHazardous + '15', borderColor: colors.brandHazardous + '30' }]}
                      onPress={() => handleGuess('fiction')}
                    >
                      <Text style={styles.emojiIcon}>❌</Text>
                      <Text style={[styles.optionText, { color: colors.brandHazardous }]}>Fiction</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.feedbackContainer}>
                  <View style={styles.feedbackRow}>
                    {guess === 'fiction' ? (
                      <>
                        <View style={[styles.feedbackIconBox, { backgroundColor: colors.brandSafe + '20' }]}>
                          <CheckCircle2 color={colors.brandSafe} size={22} />
                        </View>
                        <View>
                          <Text style={[styles.feedbackTitle, { color: colors.brandSafe }]}>Spot on!</Text>
                          <Text style={[styles.feedbackSub, { color: colors.textSecondary }]}>You correctly identified it as a myth.</Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={[styles.feedbackIconBox, { backgroundColor: colors.brandHazardous + '20' }]}>
                          <XCircle color={colors.brandHazardous} size={22} />
                        </View>
                        <View>
                          <Text style={[styles.feedbackTitle, { color: colors.brandHazardous }]}>Actually, that's a myth!</Text>
                          <Text style={[styles.feedbackSub, { color: colors.textSecondary }]}>It is a common misconception.</Text>
                        </View>
                      </>
                    )}
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  <View style={styles.realityContainer}>
                    <View style={styles.realityHeader}>
                      <Zap color={colors.brandSafe} size={14} />
                      <Text style={[styles.realityTitle, { color: colors.brandSafe }]}>The Reality</Text>
                    </View>
                    <Text style={[styles.realityText, { color: colors.textPrimary }]}>
                      {mythData.explanation || mythData.fact}
                    </Text>

                    {/* Sources */}
                    {mythData.sources && mythData.sources.length > 0 && (
                      <View style={styles.sourcesContainer}>
                        <Text style={[styles.sourcesLabel, { color: colors.textSecondary }]}>Sources</Text>
                        <View style={styles.sourcesRow}>
                          {mythData.sources.map((src: any, idx: number) => (
                            <TouchableOpacity
                              key={idx}
                              style={[styles.sourcePill, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: colors.border }]}
                              onPress={() => src.url && Linking.openURL(src.url)}
                              disabled={!src.url}
                            >
                              <Text style={[styles.sourceText, { color: colors.textPrimary }]}>{src.name}</Text>
                              {src.url && <ExternalLink color={colors.textSecondary} size={10} style={{ marginLeft: 4 }} />}
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: colors.brandPrimary, marginTop: 20 }]}
                    onPress={fetchFact}
                  >
                    <Text style={styles.btnText}>Next Question →</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )
        )}

        {/* Did You Know Banner */}
        <View style={[styles.didYouKnowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.bulbEmoji}>💡</Text>
          <View style={styles.didYouKnowInfo}>
            <Text style={[styles.didYouKnowTitle, { color: colors.brandPrimary }]}>Did you know?</Text>
            <Text style={[styles.didYouKnowText, { color: colors.textPrimary }]}>{didYouKnow}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  statsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  statDivider: {
    width: 1,
    height: 30,
    marginHorizontal: 12,
  },
  resetButton: {
    padding: 8,
  },
  quizCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 24,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  shareButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mythText: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 30,
    marginBottom: 24,
  },
  optionsContainer: {
    marginTop: 10,
  },
  promptText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  emojiIcon: {
    fontSize: 16,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '800',
  },
  feedbackContainer: {
    marginTop: 10,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  feedbackIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  feedbackSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 20,
  },
  realityContainer: {
    marginTop: 4,
  },
  realityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  realityTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  realityText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
  },
  sourcesContainer: {
    marginTop: 16,
  },
  sourcesLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sourcesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  sourceText: {
    fontSize: 11,
    fontWeight: '600',
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  caughtUpTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  caughtUpText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  caughtUpActions: {
    gap: 12,
  },
  secondaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
  },
  didYouKnowCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bulbEmoji: {
    fontSize: 22,
  },
  didYouKnowInfo: {
    flex: 1,
  },
  didYouKnowTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  didYouKnowText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    opacity: 0.85,
  },
});
