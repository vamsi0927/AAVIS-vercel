import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, RefreshCw, Zap, BookOpen, CheckCircle2, XCircle, Share2, RefreshCcw, ExternalLink } from 'lucide-react';
import { FoodMythData } from '../../lib/aiAnalysis';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
import { useRef } from 'react';
import { loadLocalPrefs, saveLocalPrefs } from '../../lib/storage';
import { DEFAULT_MYTHS } from '../../data/defaultMyths';

const DID_YOU_KNOW_FACTS = [
  "Honey should not be given to infants under one year because of botulism risk.",
  "MSG is considered safe by the FDA when consumed within acceptable limits.",
  "Carrots are rich in vitamin A, but eating lots of them won't give you perfect night vision.",
  "Microwaving food does not significantly destroy its nutrients compared to other cooking methods.",
  "Brown eggs are not nutritionally superior to white eggs; shell color just depends on the breed of the hen.",
  "Drinking eight glasses of water a day is a guideline, but fluid needs vary based on diet, activity, and climate.",
  "Eating late at night doesn't automatically make you gain weight; it's total daily calorie intake that matters."
];

export function FoodMyths() {
  const navigate = useNavigate();
  const context = useAppContext();
  
  const [mythData, setMythData] = useState<FoodMythData | null>(null);
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
    
    // Check if user has already completed 5 questions in total across sessions
    if (prefs.mythsCompletedCount >= 5) {
      setQuestionCount(prefs.mythsCompletedCount);
      setIsLoading(false);
      return;
    }

    if (mythData) {
      seenQuestionsRef.current.add(mythData.myth);
      // Save progress to local storage
      const newCount = prefs.mythsCompletedCount + 1;
      saveLocalPrefs({ mythsCompletedCount: newCount });
      
      if (newCount >= 5) {
        setQuestionCount(newCount);
        setIsLoading(false);
        return;
      }
    }
    
    setIsLoading(true);
    setGuess(null);
    rotateDidYouKnow();
    
    // Get next question instantly
    const unseen = DEFAULT_MYTHS.filter(m => !seenQuestionsRef.current.has(m.myth));
    const fallbackList = unseen.length > 0 ? unseen : DEFAULT_MYTHS;
    
    // For deterministic progression across sessions based on count
    const nextMyth = DEFAULT_MYTHS[prefs.mythsCompletedCount % DEFAULT_MYTHS.length];
    
    setMythData(nextMyth);
    setQuestionCount(prefs.mythsCompletedCount); // Sync state with storage
    setIsLoading(false);
  };

  useEffect(() => {
    fetchFact();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleShare = async () => {
    if (!mythData) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Aavis Food Myth Fact Check',
          text: `Myth: ${mythData.myth}\n\nFact: ${mythData.fact}\n\nChecked via Aavis App!`,
        });
      } else {
        await navigator.clipboard.writeText(`Myth: ${mythData.myth}\n\nFact: ${mythData.fact}\n\nChecked via Aavis App!`);
      }
    } catch (err) {
      console.log('Error sharing', err);
    }
  };


  return (
    <div className="flex flex-col h-full bg-navy-900 pb-24 relative overflow-hidden transition-colors duration-300">
      {/* Background ambient glowing blobs */}
      <div className="absolute top-[-10%] left-[-20%] w-[80vw] h-[80vw] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-20%] w-[80vw] h-[80vw] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <header className="pt-safe pt-6 px-4 pb-4 flex items-center justify-between border-b border-white/5 sticky top-0 bg-navy-900/90 backdrop-blur-md z-20">
        <div className="flex items-center">
          <button data-testid='btn-foodmyths-1' onClick={() => navigate(-1)} className="p-2 -ml-2 text-content-secondary hover:text-white transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-display font-bold text-lg ml-2 text-white">Myths vs Facts</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-8 flex flex-col items-center justify-start gap-8 relative z-10 w-full max-w-7xl mx-auto">
        
        {/* Session Stats Header */}
        <div className="w-full lg:w-[60%] max-w-4xl flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4 shrink-0">
          <div className="flex items-center gap-4 text-sm font-medium">
            <div className="flex flex-col">
              <span className="text-content-secondary text-xs">Correct</span>
              <span className="text-brand-safe">{sessionCorrect}</span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex flex-col">
              <span className="text-content-secondary text-xs">Wrong</span>
              <span className="text-brand-hazardous">{sessionWrong}</span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex flex-col">
              <span className="text-content-secondary text-xs">Accuracy</span>
              <span className="text-white">{accuracy}%</span>
            </div>
          </div>
          <button data-testid='btn-foodmyths-2' 
            onClick={handleResetSession}
            className="p-2 text-content-secondary hover:text-white transition-colors"
            title="Reset Session"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-start lg:justify-center gap-8 w-full">
          {/* Main Content Area */}
          <div className="flex flex-col items-center justify-start w-full lg:w-[60%] max-w-4xl flex-1">
            <AnimatePresence mode="wait">
              {questionCount >= 5 ? (
                <motion.div 
                  key="endcard"
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="w-full glass-card bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-10 text-center shadow-[0_0_50px_rgba(99,102,241,0.15)]"
                >
                  <div className="w-20 h-20 bg-brand-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-brand-primary" />
                  </div>
                  <h2 className="text-2xl font-display font-extrabold text-white mb-4">You're all caught up!</h2>
                  <p className="text-content-secondary mb-8 leading-relaxed">
                    You've answered the questions. We'll come back with more myths and facts soon. Great job building your nutrition knowledge!
                  </p>
                  <button data-testid='btn-foodmyths-3' 
                    onClick={() => navigate(-1)}
                    className="w-full sm:w-auto bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl px-8 py-4 font-bold inline-flex items-center justify-center transition-all active:scale-[0.97]"
                  >
                    Return Home
                  </button>
                </motion.div>
              ) : isLoading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center text-center space-y-4 py-20 w-full"
                >
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-brand-primary/20"></div>
                    <div className="absolute inset-0 rounded-full border-t-2 border-brand-primary animate-spin"></div>
                    <Zap className="w-8 h-8 text-brand-primary animate-pulse" />
                  </div>
                  <p className="text-content-secondary font-semibold text-sm">Loading...</p>
                </motion.div>
              ) : (
                mythData && (
                  <motion.div 
                    key="content"
                    initial={{ opacity: 0, y: 20, scale: 0.95 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="w-full glass-card bg-white/5 dark:bg-navy-800/50 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 md:p-8 shadow-[0_0_50px_rgba(99,102,241,0.15)] relative overflow-hidden"
                  >
                    {/* Glowing subtle card core */}
                    <div className="absolute -top-12 -right-12 w-40 h-40 bg-brand-primary/20 rounded-full blur-[40px] pointer-events-none"></div>

                    <div className="flex items-center justify-between gap-2 mb-6">
                      <span className="bg-brand-primary/20 border border-brand-primary/30 text-brand-primary text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" /> Fact Check
                      </span>
                      {guess && (
                        <button data-testid='btn-foodmyths-4' onClick={handleShare} className="p-2 text-content-secondary hover:text-white transition-colors bg-white/5 rounded-full" aria-label="Share">
                          <Share2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* The Myth Question */}
                    <div className="space-y-2">
                      <h2 className="text-2xl md:text-3xl font-display font-extrabold text-white leading-snug">
                        {mythData.myth}
                      </h2>
                    </div>

                    {!guess ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 space-y-4"
                      >
                        <p className="text-sm text-content-secondary font-medium text-center mb-4">What's your answer?</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <button data-testid='btn-foodmyths-5' 
                            onClick={() => handleGuess('fact')}
                            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl py-4 font-bold flex flex-row items-center justify-center gap-3 transition-all active:scale-[0.97]"
                          >
                            <span className="text-xl">✅</span>
                            Yes
                          </button>
                          <button data-testid='btn-foodmyths-6' 
                            onClick={() => handleGuess('fiction')}
                            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl py-4 font-bold flex flex-row items-center justify-center gap-3 transition-all active:scale-[0.97]"
                          >
                            <span className="text-xl">❌</span>
                            No
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="mt-6 overflow-hidden"
                      >
                        {/* Result Feedback */}
                        <div className="mb-6 flex items-center gap-3">
                          {guess === 'fiction' ? (
                            <>
                              <div className="w-10 h-10 rounded-full bg-brand-safe/20 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-6 h-6 text-brand-safe" />
                              </div>
                              <div>
                                <p className="text-brand-safe font-bold">Spot on!</p>
                                <p className="text-xs text-content-secondary">You correctly identified it as a myth.</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-10 h-10 rounded-full bg-brand-hazardous/20 flex items-center justify-center shrink-0">
                                <XCircle className="w-6 h-6 text-brand-hazardous" />
                              </div>
                              <div>
                                <p className="text-brand-hazardous font-bold">Actually, that's a myth!</p>
                                <p className="text-xs text-content-secondary">It's a very common misconception.</p>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Glowing Laser Divider */}
                        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-brand-primary/50 to-transparent my-6" />

                        {/* The Fact / Debunking */}
                        <div className="space-y-4">
                          <span className="text-xs font-bold uppercase tracking-wider text-brand-safe flex items-center gap-1">
                            <Zap className="w-4 h-4" /> The Reality
                          </span>
                          
                          <div className="text-base text-white/90 leading-relaxed font-medium">
                            {mythData.explanation || mythData.fact}
                          </div>
                          
                          {/* Sources */}
                          {mythData.sources && mythData.sources.length > 0 && (
                            <div className="pt-4 space-y-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-content-secondary">Sources</span>
                              <div className="flex flex-wrap gap-2">
                                {mythData.sources.map((src, idx) => (
                                  src.url ? (
                                    <a 
                                      key={idx}
                                      href={src.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-medium text-white transition-colors"
                                    >
                                      {src.name} <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ) : (
                                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-content-secondary">
                                      {src.name}
                                    </span>
                                  )
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-8 flex flex-col gap-3">
                          <button data-testid='btn-foodmyths-7' 
                            onClick={fetchFact}
                            disabled={isLoading}
                            className={`w-full text-white rounded-xl px-6 py-4 font-bold flex items-center justify-center gap-2.5 shadow-lg transition-all active:scale-[0.97]
                              ${isLoading ? 'bg-navy-600 cursor-wait' : 'bg-brand-primary hover:bg-brand-primary/90 shadow-brand-primary/25 hover:shadow-brand-primary/40'}`}
                          >
                            {isLoading ? (
                              <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              'Next Question →'
                            )}
                          </button>
                        </div>

                      </motion.div>
                    )}
                  </motion.div>
                )
              )}
            </AnimatePresence>

            {/* Did you know banner */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={didYouKnow}
              className="mt-6 w-full glass-card bg-brand-accent/5 border border-brand-accent/20 rounded-2xl p-5 flex items-start gap-4"
            >
              <div className="text-2xl shrink-0">💡</div>
              <div>
                <h4 className="text-brand-accent font-bold text-sm mb-1">Did you know?</h4>
                <p className="text-white/80 text-sm leading-relaxed">{didYouKnow}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
