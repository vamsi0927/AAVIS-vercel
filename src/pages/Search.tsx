import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search as SearchIcon, Clock, Sparkles, Loader2, AlertCircle, Database } from 'lucide-react';
import { SAMPLE_PRODUCTS } from '../data/sampleProducts';
import { askGeminiAboutFood, getGeminiErrorMessage } from '../lib/geminiAnalysis';
import { motion, AnimatePresence } from 'framer-motion';
import { searchWithCache, saveSearchResult, getSearchHistory } from '../lib/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';

const SUGGESTED_CHIPS = ['E319', 'TBHQ', 'Trans Fat', 'MSG', 'Aspartame', 'Tartrazine', 'Refined Oil', 'High Fructose Corn Syrup'];

export function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  
  // AI Search State
  const [isSearching, setIsSearching] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search history
  const [recentSearches, setRecentSearches] = useState<{ query: string; ai_response: string; searched_at: string }[]>([]);

  // Load recent searches on mount
  useEffect(() => {
    const userId = localStorage.getItem('aavis_user_id');
    if (userId && isSupabaseConfigured()) {
      getSearchHistory(userId, 8).then(history => {
        setRecentSearches(history);
      });
    }
  }, []);

  // Local product match
  const results = query.trim() ?
    SAMPLE_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.brand.toLowerCase().includes(query.toLowerCase())
    ) : [];

  const handleAskAI = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setQuery(searchQuery);
    setIsSearching(true);
    setAiResult(null);
    setIsCached(false);
    setError(null);

    try {
      const userId = localStorage.getItem('aavis_user_id');

      // 1. Check cache first
      if (userId && isSupabaseConfigured()) {
        const cached = await searchWithCache(userId, searchQuery);
        if (cached) {
          setAiResult(cached.response);
          setIsCached(true);
          setIsSearching(false);
          return;
        }
      }

      // 2. No cache — call Gemini
      const response = await askGeminiAboutFood(searchQuery);
      setAiResult(response);
      setIsCached(false);

      // 3. Save to DB
      if (userId && isSupabaseConfigured()) {
        saveSearchResult(userId, searchQuery, response).catch(console.error);
        // Refresh recent searches
        getSearchHistory(userId, 8).then(history => setRecentSearches(history));
      }
    } catch (err: any) {
      setError(getGeminiErrorMessage(err.message));
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAskAI(query);
    }
  };

  return (
    <div className="flex flex-col h-full bg-navy-900">
      <header className="pt-safe pt-6 px-4 pb-4 flex items-center gap-2 border-b border-navy-800 md:max-w-3xl md:mx-auto md:w-full md:px-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-content-secondary hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-secondary" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search any ingredient, additive, or food..."
            className="w-full bg-navy-800 border border-navy-700 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-content-secondary focus:outline-none focus:border-brand-primary" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:max-w-3xl md:mx-auto md:w-full md:px-8 md:py-4">
        {!query.trim() ? (
          <div>
            {/* Suggested Search Chips */}
            <h3 className="text-sm font-medium text-content-secondary uppercase tracking-wider mb-3">
              Suggested Searches
            </h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {SUGGESTED_CHIPS.map((term) => (
                <button
                  key={term}
                  onClick={() => handleAskAI(term)}
                  className="px-4 py-2 bg-navy-800 border border-navy-700 rounded-full text-sm text-content-secondary hover:text-content-primary hover:bg-navy-700 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>

            {/* Recent Searches from DB */}
            {recentSearches.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-content-secondary uppercase tracking-wider mb-3">
                  Recent Searches
                </h3>
                <div className="space-y-2">
                  {recentSearches.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAskAI(item.query)}
                      className="w-full bg-navy-800 border border-navy-700 rounded-xl px-4 py-3 text-left flex items-center gap-3 hover:bg-navy-700 transition-colors"
                    >
                      <Clock className="w-4 h-4 text-content-secondary flex-shrink-0" />
                      <span className="text-sm text-content-primary capitalize truncate">{item.query}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-2xl p-4 flex gap-3">
               <Sparkles className="w-6 h-6 text-brand-primary flex-shrink-0" />
               <p className="text-sm text-brand-primary/90">
                 <strong className="text-brand-primary">Ask AI:</strong> Search for any ingredient, additive (like E319), or food item to get instant health insights.
               </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Ask AI Action Button */}
            {!isSearching && !aiResult && (
              <button 
                onClick={() => handleAskAI(query)}
                className="w-full bg-gradient-to-r from-brand-primary to-purple-600 hover:opacity-90 text-white rounded-2xl p-4 flex items-center justify-center gap-2 font-bold shadow-lg shadow-purple-500/25 transition-all">
                <Sparkles className="w-5 h-5" />
                Ask AI about "{query}"
              </button>
            )}

            {/* AI Search Loading State */}
            {isSearching && (
              <div className="bg-navy-800 rounded-2xl p-6 border border-navy-700 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-8 h-8 text-brand-primary animate-spin mb-3" />
                <p className="text-content-primary font-medium">Asking AI...</p>
                <p className="text-xs text-content-secondary mt-1">Analyzing health implications</p>
              </div>
            )}

            {/* AI Error State */}
            {error && (
              <div className="bg-brand-hazardous/10 rounded-2xl p-4 border border-brand-hazardous/30">
                <div className="flex items-start gap-3 mb-3">
                  <AlertCircle className="w-5 h-5 text-brand-hazardous flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-brand-hazardous/90">{error}</p>
                </div>
                <button
                  onClick={() => handleAskAI(query)}
                  className="w-full bg-brand-hazardous/20 text-brand-hazardous text-sm font-medium py-2 rounded-xl hover:bg-brand-hazardous/30 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* AI Result */}
            {aiResult && !isSearching && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-navy-800 rounded-2xl p-5 border border-navy-700 relative overflow-hidden">
                
                {/* Cached badge */}
                {isCached && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-navy-700 px-2.5 py-1 rounded-full">
                    <Database className="w-3 h-3 text-content-secondary" />
                    <span className="text-[10px] text-content-secondary font-medium">Cached result</span>
                  </div>
                )}

                <h3 className="font-bold text-lg mb-3 text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-primary" /> AI Insights
                </h3>
                <div className="text-sm text-content-primary/90 leading-relaxed space-y-3 whitespace-pre-wrap">
                  {aiResult}
                </div>

                {/* Search again */}
                <button
                  onClick={() => { setAiResult(null); setIsCached(false); }}
                  className="mt-4 text-xs text-content-secondary hover:text-white underline"
                >
                  Search something else
                </button>
              </motion.div>
            )}

            {/* Local Database Matches */}
            {results.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-content-secondary uppercase tracking-wider mb-3 mt-4">
                  In Your Database
                </h3>
                <div className="space-y-3">
                  {results.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => navigate('/scan')}
                      className="w-full bg-navy-800 hover:bg-navy-700 rounded-2xl p-4 border border-navy-700 flex items-center gap-4 text-left">
                      <div className="w-12 h-12 bg-navy-900 rounded-xl flex items-center justify-center text-2xl border border-navy-600">
                        {p.imageEmoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-content-primary truncate">
                          {p.name}
                        </h4>
                        <p className="text-xs text-content-secondary truncate">
                          {p.brand}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}