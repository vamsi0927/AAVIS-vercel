import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Share2,
  AlertCircle,
  FileText,
  ListChecks,
  Sparkles,
  AlertTriangle,
  Bookmark,
  Info,
  RotateCcw,
  FileImage,
  Loader2
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { updateScanScore } from '../lib/supabaseService';
import { ADDITIVES_DB } from '../data/additives';
import { SAMPLE_PRODUCTS } from '../data/sampleProducts';
import { toast } from 'sonner';
import {
  classifyIngredient,
  getRiskChipClasses,
  getRiskDotColor,
  getAdditiveCardBorder,
  getAdditiveBadgeClasses,
  type IngredientRiskLevel
} from '../lib/ingredientRisk';
import { computeHealthScore, isBeverage } from '../lib/scoring';
import type { Additive } from '../lib/types';

function IngredientChip({ name, level, explanation, dynamicInfo }: { name: string; level: IngredientRiskLevel; explanation: string; dynamicInfo?: Additive }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Use AI-provided dynamic info if available, otherwise fallback to local classification
  const finalLevel = (dynamicInfo?.hazard as IngredientRiskLevel) || level;
  const finalExplanation = dynamicInfo?.healthExplanation || explanation || dynamicInfo?.function;

  return (
    <div 
      onClick={() => finalExplanation && setIsExpanded(!isExpanded)}
      className={`
        relative flex flex-col transition-all duration-200 cursor-pointer max-w-full
        ${isExpanded ? 'w-full mb-1' : 'shrink'}
      `}
    >
      <div className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors min-w-0
        ${getRiskChipClasses(finalLevel)}
        ${isExpanded ? 'rounded-b-none border-b-0 shadow-lg bg-opacity-30' : 'hover:bg-opacity-20'}
      `}>
        <div className={`w-1.5 h-1.5 rounded-full ${getRiskDotColor(finalLevel)} shrink-0 shadow-sm`} />
        <span className="capitalize break-words flex-1 min-w-0">{name}</span>
        {finalExplanation && (
          <Info className={`w-3.5 h-3.5 shrink-0 ml-2 opacity-40 transition-transform ${isExpanded ? 'rotate-180 opacity-100' : ''}`} />
        )}
      </div>
      
      {isExpanded && finalExplanation && (
        <div className={`
          p-3 text-[10px] leading-relaxed border border-t-0 rounded-b-lg animate-in slide-in-from-top-1 break-words
          ${getRiskChipClasses(finalLevel)} bg-opacity-20 backdrop-blur-sm
        `}>
          {finalLevel !== 'safe' && <span className="font-bold uppercase mr-1">[{finalLevel}]</span>}
          {finalExplanation}
        </div>
      )}
    </div>
  );
}

export function Result() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { scans, bookmarkedProductIds, toggleBookmark, theme, profile, updateScanInState } = useAppContext();
  
  const scan = scans.find((s) => s.id === id || s.productId === id || s.product?.id === id);
  const product = scan?.product || (scan ? SAMPLE_PRODUCTS.find((p) => p.id === scan.productId) : null);
  
  const [showAllIngredients, setShowAllIngredients] = useState(false);
  const [showAllNutrients, setShowAllNutrients] = useState(false);

  if (!scan || !product) {
    return (
      <div className="flex flex-col h-full bg-navy-900 items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-brand-hazardous mb-4" />
        <h2 className="text-xl font-bold mb-2">Result Not Found</h2>
        <p className="text-content-secondary mb-6">
          This scan might have been deleted or doesn't exist.
        </p>
        <button
          onClick={() => navigate('/home')}
          className="bg-brand-primary px-6 py-3 rounded-xl font-medium">
          Go Home
        </button>
      </div>
    );
  }

  const handleShare = async () => {
    const text = `I scanned ${product.name} with Aavis. Health Score: ${scan.score}/100`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Aavis Scan Result', text });
      } catch (e) { /* ignore */ }
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Result copied to clipboard');
    }
  };

  const isBookmarked = bookmarkedProductIds.includes(product.id);

  const score = scan.score ?? 0;

  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [reanalyzeStatus, setReanalyzeStatus] = useState('');

  const handleReAnalyze = async () => {
    if (!scan || !product) return;
    setIsReanalyzing(true);
    
    try {
      setReanalyzeStatus('[REANALYZE] Running Scoring Engine...');
      await new Promise(r => setTimeout(r, 600));
      
      const updatedScoreData = computeHealthScore(product, profile);
      
      setReanalyzeStatus('[REANALYZE] Updating Database...');
      
      const { detectProductCategory } = await import('../lib/scoring');
      const category = detectProductCategory(product);
      
      const updatedNutrients = {
        ...product.nutrients,
        _productType: product.productType,
        _productGenre: category,
        _novaGroup: (product as any).novaGroup,
        _allNutrientsExpanded: (product as any).allNutrientsExpanded,
        _servingSize: product.servingSize,
        _rawNutrients: product.rawNutrients
      };

      const success = await updateScanScore(scan.id, {
        health_score: updatedScoreData.score,
        verdict: updatedScoreData.verdict,
        nutrients: updatedNutrients,
        diet_advice: updatedScoreData.dietAdvice || '',
      });
      
      if (!success) {
        toast.error('Failed to update database');
        setIsReanalyzing(false);
        return;
      }
      
      setReanalyzeStatus('[SCORE_RECALCULATED]');
      
      const updatedScan = {
        ...scan,
        score: updatedScoreData.score,
        verdict: updatedScoreData.verdict,
        warnings: updatedScoreData.warnings,
        dietAdvice: updatedScoreData.dietAdvice || scan.dietAdvice,
        scoreReasons: updatedScoreData.scoreReasons,
        mainConcerns: updatedScoreData.mainConcerns || scan.mainConcerns,
        personalizedWarnings: updatedScoreData.personalizedWarnings,
        scoreBreakdown: updatedScoreData.scoreBreakdown,
        product: {
          ...product,
          productGenre: category,
          nutrients: updatedNutrients
        }
      };
      
      updateScanInState(scan.id, updatedScan);
      
      await new Promise(r => setTimeout(r, 500));
      toast.success('Score Successfully Recalculated!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to re-analyze scan');
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleViewOriginal = () => {
    if (!scan.image_url && !product.imageUrl) {
      toast.error('No original label image found for this scan');
      return;
    }
    const url = scan.image_url || product.imageUrl;
    window.open(url, '_blank');
  };

  // ── Score ring config (SVG arc)
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;
  const ringColor = score <= 40 ? '#ef4444' : score <= 70 ? '#f59e0b' : '#10b981';
  const scoreBorderClass = score <= 40
    ? 'border-brand-hazardous/25'
    : score <= 70 ? 'border-brand-caution/25'
    : 'border-brand-safe/25';
  const scoreBgClass = score <= 40
    ? 'bg-brand-hazardous/5'
    : score <= 70 ? 'bg-brand-caution/5'
    : 'bg-brand-safe/5';
  const scoreEmoji = score <= 40 ? '🚫' : score <= 70 ? '⚡' : '✅';
  const scoreLabel = score <= 40 ? 'High Concern' : score <= 70 ? 'Moderate' : 'Good';

  return (
    <div className="flex flex-col h-full bg-navy-900 overflow-y-auto no-scrollbar pb-safe relative">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute top-[500px] right-0 w-72 h-72 bg-brand-secondary/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* ── Header ── */}
      <div className="sticky top-0 z-30 bg-navy-900/90 backdrop-blur-md pt-safe px-4 pb-4 flex justify-between items-center border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-content-secondary hover:text-white rounded-xl bg-white/5 border border-white/5 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-black text-lg text-white truncate px-4">Health Report</h1>
        <div className="flex items-center gap-1">
          <button onClick={() => toggleBookmark(product.id)} className={`p-2 rounded-xl transition-colors ${isBookmarked ? 'text-brand-primary bg-brand-primary/10' : 'text-content-secondary hover:text-white bg-white/5'}`}>
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
          <button onClick={handleShare} className="p-2 text-content-secondary hover:text-white rounded-xl bg-white/5 border border-white/5 transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-5 relative z-10 md:p-8 md:max-w-7xl md:mx-auto md:w-full md:grid md:grid-cols-12 md:gap-8 md:space-y-0">
        
        {/* Left Column: Identity, Score, Concerns, Warnings, Verdict */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-5">
          {/* ── 1. Product Identity Card ── */}
          <div className="glass-card rounded-3xl p-5 border border-white/5 flex items-center gap-4">
            <div className="w-16 h-16 glass-card rounded-2xl flex items-center justify-center text-3xl shrink-0 border border-white/10 shadow-xl relative">
              <div className="absolute inset-0 bg-brand-primary/5 rounded-2xl blur-md" />
              <span className="relative z-10">{product.imageEmoji}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-display font-black text-white leading-tight break-words line-clamp-2">{product.name}</h2>
              <p className="text-[11px] text-content-secondary font-bold uppercase tracking-widest mt-0.5">{product.brand}</p>
              {scan.verdict && (
                <span className={`inline-block mt-2 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                  scan.verdict === 'hazardous'
                    ? 'bg-brand-hazardous/10 border-brand-hazardous/30 text-brand-hazardous'
                    : scan.verdict === 'caution'
                    ? 'bg-brand-caution/10 border-brand-caution/30 text-brand-caution'
                    : 'bg-brand-safe/10 border-brand-safe/30 text-brand-safe'
                }`}>
                  {scan.verdict === 'hazardous' ? '🚫 Avoid' : scan.verdict === 'caution' ? '⚡ Moderate' : '✅ Good Choice'}
                </span>
              )}
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleReAnalyze}
              disabled={isReanalyzing}
              className={`glass-card p-3 rounded-2xl flex items-center justify-center gap-2 border border-white/5 transition-all text-xs font-bold uppercase tracking-wider ${isReanalyzing ? 'opacity-50' : 'hover:bg-white/5 active:scale-95'}`}
            >
              {isReanalyzing ? <Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> : <RotateCcw className="w-4 h-4 text-brand-primary" />}
              {isReanalyzing ? 'Re-analyzing...' : 'Re-Analyze'}
            </button>
            <button
              onClick={handleViewOriginal}
              className="glass-card p-3 rounded-2xl flex items-center justify-center gap-2 border border-white/5 transition-all text-xs font-bold uppercase tracking-wider hover:bg-white/5 active:scale-95"
            >
              <FileImage className="w-4 h-4 text-content-secondary" />
              Original Label
            </button>
          </div>

          {/* ── 2. Health Score (SVG Arc Ring) ── */}
          <div className={`rounded-3xl p-6 border text-center relative overflow-hidden shadow-2xl glass-card ${scoreBorderClass} ${scoreBgClass}`}>
            {/* Soft glow behind ring */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-44 h-44 rounded-full blur-3xl" style={{ background: ringColor }} />
            </div>

            <p className="text-[10px] font-black text-content-secondary uppercase tracking-[0.15em] mb-5">
              Aavis Health Score
            </p>

            {/* SVG Ring */}
            <div className="relative w-44 h-44 mx-auto mb-5">
              <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90" style={{ overflow: 'visible' }}>
                {/* Background track */}
                <circle cx="64" cy="64" r={radius} fill="none" stroke={theme === 'light' ? 'rgba(20, 24, 35, 0.08)' : 'rgba(255,255,255,0.07)'} strokeWidth="11" strokeLinecap="round" />
                {/* Animated score arc */}
                <circle
                  cx="64" cy="64" r={radius}
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{ transition: 'stroke-dashoffset 1.4s ease-out', filter: `drop-shadow(0 0 10px ${ringColor}99)` }}
                />
              </svg>
              {/* Centre */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[44px] font-display font-black leading-none" style={{ color: ringColor }}>{score}</span>
                <span className="text-[9px] text-content-secondary font-bold uppercase tracking-widest mt-1">/ 100</span>
              </div>
            </div>

            <div className="text-xl font-display font-black mb-1" style={{ color: ringColor }}>
              {scoreEmoji}&nbsp;{scoreLabel}
            </div>
            <p className="text-xs text-content-secondary max-w-[240px] mx-auto leading-relaxed">
              {score <= 40
                ? 'High concern. This product has notable health risks. See the analysis below.'
                : score <= 70
                ? 'Moderate. Occasional consumption is okay, but limit frequency.'
                : 'Good. This product has a relatively clean nutritional profile.'}
            </p>

            {/* Score reason breakdown */}
            {scan.scoreReasons && scan.scoreReasons.length > 0 && (
              <div className="text-left mt-5 pt-5 border-t border-white/5 space-y-2.5">
                <p className="text-[10px] font-black text-content-secondary uppercase tracking-[0.15em] mb-3">Score Breakdown</p>
                {scan.scoreReasons?.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${ringColor}22`, border: `1px solid ${ringColor}44` }}>
                      <span className="text-[8px]" style={{ color: ringColor }}>✦</span>
                    </div>
                    <p className="text-xs text-content-primary/80 leading-relaxed flex-1 min-w-0 break-words">{reason}</p>
                  </div>
                ))}
                
                <div className="flex items-center justify-between border-t border-white/10 mt-3 pt-3 px-1">
                  <span className="text-xs font-black text-white">Final Score:</span>
                  <span className="text-sm font-black" style={{ color: ringColor }}>{scan.scoreBreakdown?.finalScore ?? score}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* ── Consumption Impact ── */}
          {scan.consumptionImpact && (
            <div className={`rounded-3xl p-5 shadow-lg border ${
              scan.consumptionImpact === 'High' ? 'bg-brand-hazardous/5 border-brand-hazardous/20'
              : scan.consumptionImpact === 'Moderate' ? 'bg-brand-caution/5 border-brand-caution/20'
              : 'bg-brand-safe/5 border-brand-safe/20'
            }`}>
              <h3 className={`font-black text-sm mb-2 flex items-center gap-2 ${
                scan.consumptionImpact === 'High' ? 'text-brand-hazardous'
                : scan.consumptionImpact === 'Moderate' ? 'text-brand-caution'
                : 'text-brand-safe'
              }`}>
                <Sparkles className="w-4 h-4" /> Consumption Impact: {scan.consumptionImpact}
              </h3>
              <p className="text-xs text-content-primary leading-relaxed break-words">
                Based on the real-world serving size ({scan.product?.servingSize || 'Unknown'}), eating this product has a <strong>{scan.consumptionImpact.toLowerCase()} impact</strong> on your daily nutritional limits.
              </p>
              {scan.servingWarning && (
                <p className="text-[10px] text-content-secondary mt-2 italic border-t border-white/5 pt-2">
                  {scan.servingWarning}
                </p>
              )}
            </div>
          )}

          {/* ── 8. Smart Verdict ── */}
          {scan.dietAdvice && (
            <div className={`rounded-3xl p-5 shadow-lg border ${
              scan.verdict === 'hazardous' ? 'bg-brand-hazardous/5 border-brand-hazardous/20'
              : scan.verdict === 'caution' ? 'bg-brand-caution/5 border-brand-caution/20'
              : 'bg-brand-safe/5 border-brand-safe/20'
            }`}>
              <h3 className={`font-black text-sm mb-2 flex items-center gap-2 ${
                scan.verdict === 'hazardous' ? 'text-brand-hazardous'
                : scan.verdict === 'caution' ? 'text-brand-caution'
                : 'text-brand-safe'
              }`}>
                <Sparkles className="w-4 h-4" /> Aavis Verdict
              </h3>
              <p className="text-xs text-content-primary leading-relaxed break-words">{scan.dietAdvice}</p>
            </div>
          )}

          {/* ── 3. Main Health Concerns ── */}
          {scan.mainConcerns && scan.mainConcerns.length > 0 && (
            <div className="bg-brand-hazardous/5 border border-brand-hazardous/20 rounded-3xl p-5 shadow-lg">
              <h3 className="text-brand-hazardous font-black text-sm mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Key Health Concerns
              </h3>
              <ul className="space-y-2.5">
                {scan.mainConcerns.map((concern, idx) => (
                  <li key={idx} className="text-xs text-content-primary/90 flex gap-2 leading-relaxed">
                    <span className="text-brand-hazardous font-black mt-0.5 shrink-0">•</span>
                    <span className="flex-1 min-w-0 break-words">{concern}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── 4. Personalized Warnings ── */}
          {scan.personalizedWarnings && scan.personalizedWarnings.length > 0 && (
            <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-3xl p-5 shadow-lg">
              <h3 className="text-brand-primary font-black text-sm mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Personalized for You
              </h3>
              <div className="space-y-2.5">
                {scan.personalizedWarnings.map((warning, idx) => (
                  <div key={idx} className="glass-card rounded-2xl px-4 py-3 text-xs text-white/90 border border-white/5 leading-relaxed break-words overflow-hidden">
                    {warning}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Ingredients, Additives, Nutrition Facts */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-5">
          {/* ── 7. Ingredients — Color-Coded & Sorted ── */}
          <div className="glass-card rounded-3xl p-5 border border-white/5 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2 text-white">
                <ListChecks className="w-4 h-4 text-brand-primary" /> Ingredients
              </h3>
              <span className="text-[10px] text-content-secondary font-bold bg-white/5 px-2.5 py-1 rounded-lg">
                {product.ingredients.length} items
              </span>
            </div>

            <div className="flex items-center gap-3 mb-4 overflow-x-auto no-scrollbar pb-1">
              {[
                { color: 'bg-red-500',    label: 'Avoid' },
                { color: 'bg-rose-400',   label: 'Harmful' },
                { color: 'bg-amber-400',  label: 'Caution' },
                { color: 'bg-yellow-400', label: 'Mild' },
                { color: 'bg-emerald-400',label: 'Safe' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1 shrink-0">
                  <div className={`w-2 h-2 rounded-full ${l.color} shadow-sm`} />
                  <span className="text-[9px] text-content-secondary uppercase tracking-wider font-bold">{l.label}</span>
                </div>
              ))}
            </div>

            {product.ingredients.length === 0 || product.ingredients[0].includes('not clearly found') ? (
              <p className="text-xs text-brand-caution bg-brand-caution/5 p-3 rounded-2xl border border-brand-caution/10 text-center italic">
                Extraction failed. Ingredients list not detected in scan.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const riskOrder: Record<string, number> = { hazardous: 0, harmful: 1, caution: 2, moderate: 2, mild: 3, safe: 4 };
                    const sorted = [...product.ingredients].sort((a, b) => {
                      return riskOrder[classifyIngredient(a).level] - riskOrder[classifyIngredient(b).level];
                    });
                    const visible = showAllIngredients ? sorted : sorted.slice(0, 12);
                    return visible.map((ingr, idx) => {
                      const risk = classifyIngredient(ingr);
                      const dynamicInfo = product.dynamicAdditives
                        ? Object.entries(product.dynamicAdditives).find(([k]) =>
                            ingr.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(ingr.toLowerCase())
                          )?.[1]
                        : undefined;
                      return (
                        <IngredientChip key={idx} name={ingr} level={risk.level} explanation={risk.explanation} dynamicInfo={dynamicInfo} />
                      );
                    });
                  })()}
                </div>
                {product.ingredients.length > 12 && (
                  <button
                    onClick={() => setShowAllIngredients(!showAllIngredients)}
                    className="w-full mt-4 py-2.5 text-xs font-bold text-brand-primary bg-brand-primary/5 rounded-2xl border border-brand-primary/10 hover:bg-brand-primary/10 transition-colors"
                  >
                    {showAllIngredients ? 'Show Less ↑' : `Show All ${product.ingredients.length} Ingredients ↓`}
                  </button>
                )}
              </>
            )}
          </div>

          {/* ── 5. Additives Explained ── */}
          {(product.additives.length > 0 || (product.dynamicAdditives && Object.keys(product.dynamicAdditives).length > 0)) && (
            <div className="glass-card rounded-3xl p-5 border border-white/5 shadow-xl">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-white">
                <AlertTriangle className="w-4 h-4 text-brand-caution" /> Additives Explained
              </h3>
              <div className="space-y-3">
                {(() => {
                  const dynamicKeys = Object.keys(product.dynamicAdditives || {});
                  const allCodes = [...new Set([...product.additives, ...dynamicKeys])];
                  return allCodes.map(code => {
                    const aiAdditive = product.dynamicAdditives?.[code];
                    const localAdditive = ADDITIVES_DB[code];
                    const additive = {
                      name: aiAdditive?.name || localAdditive?.name || code,
                      hazard: aiAdditive?.hazard || localAdditive?.hazard || 'caution',
                      function: aiAdditive?.function || localAdditive?.function || 'Food Additive',
                      healthExplanation: aiAdditive?.healthExplanation || localAdditive?.healthExplanation || 'Industrial food additive.'
                    };
                    const leftBorder = getAdditiveCardBorder(additive.hazard);
                    return (
                      <div key={code} className={`bg-white/3 rounded-2xl p-4 border border-white/5 border-l-4 ${leftBorder} overflow-hidden`}>
                        <div className="flex items-start gap-2 mb-1.5">
                          <div className="flex-1 min-w-0">
                            <span className="font-black text-white text-sm">{code}</span>
                            <span className="text-content-secondary mx-2 text-xs">•</span>
                            <span className="text-[12px] font-bold text-white/90 break-words">{additive.name}</span>
                          </div>
                          <span className={`text-[8px] uppercase font-black px-2 py-0.5 rounded-md tracking-wider shrink-0 whitespace-nowrap ${getAdditiveBadgeClasses(additive.hazard)}`}>
                            {additive.hazard}
                          </span>
                        </div>
                        <p className="text-[10px] text-brand-primary font-bold mb-1 uppercase tracking-wider break-words">{additive.function}</p>
                        <p className="text-[11px] text-content-secondary leading-relaxed break-words">{additive.healthExplanation}</p>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* ── 6. Nutritional Facts ── */}
          <div className="glass-card rounded-3xl p-5 border border-white/5 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm flex items-center gap-2 text-white">
                <FileText className="w-4 h-4 text-brand-primary" /> Nutritional Facts
              </h3>
            </div>
            
            <div className="grid grid-cols-[1fr_80px_80px] gap-2 border-b border-white/10 pb-2 mb-3">
              <div className="text-[9px] text-content-secondary font-black tracking-wider uppercase">Nutrient</div>
              <div className="text-[9px] text-content-secondary font-black tracking-wider uppercase text-right leading-tight">Per 100{product.normalizedNutrients?.unit === '100ml' ? 'ml' : 'g'}<br/><span className="text-[8px] text-brand-primary">(Scored)</span></div>
              <div className="text-[9px] text-content-secondary font-black tracking-wider uppercase text-right leading-tight">
                {product.servingSize ? 'Per Serving' : 'Original Label'}<br/>
                <span className="text-[8px] opacity-60">({product.servingSize || product.rawNutrients?.unit || product.nutrients.unit || '-'})</span>
              </div>
            </div>

            {[
              { key: 'calories', label: 'Calories', icon: '🔥', unit: 'kcal' },
              { key: 'sugar', label: 'Sugars', icon: '🍬', unit: 'g' },
              { key: 'sodium', label: 'Sodium', icon: '🧂', unit: 'mg' },
              { key: 'satFat', label: 'Sat Fat', icon: '🧈', unit: 'g' },
              { key: 'protein', label: 'Protein', icon: '💪', unit: 'g' },
              { key: 'fiber', label: 'Fiber', icon: '🌿', unit: 'g' },
              { key: 'carbs', label: 'Carbs', icon: '🌾', unit: 'g' },
            ].map((item, idx) => {
              const normVal = (product.normalizedNutrients || product.nutrients)[item.key as keyof typeof product.nutrients] as number | null;
              const rawVal = (product.rawNutrients || product.nutrients)[item.key as keyof typeof product.nutrients] as number | null;
              
              const isDanger = (item.key === 'sugar' && normVal! > 10) || (item.key === 'sodium' && normVal! > 400) || (item.key === 'satFat' && normVal! > 5);
              const isGood = (item.key === 'protein' && normVal! > 10) || (item.key === 'fiber' && normVal! > 5);

              return (
                <div key={idx} className="grid grid-cols-[1fr_80px_80px] gap-2 items-center py-2.5 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-xs text-content-secondary font-medium truncate">{item.label}</span>
                  </div>
                  
                  {/* Normalized Column */}
                  <div className="flex items-center justify-end gap-1">
                    {normVal !== null ? (
                      <>
                        <span className={`text-[13px] font-black ${isDanger ? 'text-brand-hazardous' : isGood ? 'text-brand-safe' : 'text-white'}`}>
                          {normVal}
                        </span>
                        <span className="text-[9px] text-content-secondary">{item.unit}</span>
                      </>
                    ) : (
                      <span className="text-[10px] text-content-secondary opacity-50">-</span>
                    )}
                  </div>
                  
                  {/* Raw/Serving Column */}
                  <div className="flex items-center justify-end gap-1 opacity-75">
                    {rawVal !== null ? (
                      <>
                        <span className="text-[11px] font-bold text-white">
                          {rawVal}
                        </span>
                        <span className="text-[9px] text-content-secondary">{item.unit}</span>
                      </>
                    ) : (
                      <span className="text-[10px] text-content-secondary opacity-50">-</span>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Expanded Nutrients Section */}
            {product.allNutrientsExpanded && product.allNutrientsExpanded.some(n => !n.isStandard) && (
              <div className="mt-4 border-t border-white/5 pt-4">
                <button
                  onClick={() => setShowAllNutrients(!showAllNutrients)}
                  className="w-full flex items-center justify-between text-xs text-content-secondary hover:text-white font-bold transition-colors"
                >
                  <span>Show Other Extracted Nutrients (Vitamins/Minerals)</span>
                  <span className="text-brand-primary">{showAllNutrients ? 'Hide ↑' : 'Show ↓'}</span>
                </button>
                
                {showAllNutrients && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] bg-white/3 p-3 rounded-2xl border border-white/5">
                    {product.allNutrientsExpanded
                      .filter(item => !item.isStandard)
                      .map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1 border-b border-white/3 last:border-0">
                          <span className="text-content-secondary font-medium truncate pr-2">{item.name}</span>
                          <span className="font-bold text-white shrink-0">{item.value}</span>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            )}
            
            {(scan.nutritionConfidence && scan.nutritionConfidence < 100) && (
              <p className="text-[9px] text-brand-caution mt-4 bg-brand-caution/10 p-2 rounded-lg text-center font-medium border border-brand-caution/20">
                ⚠️ Nutrition data may contain OCR errors (Confidence: {scan.nutritionConfidence}%).
              </p>
            )}
            
            <p className="text-[9px] text-content-secondary mt-3 text-center italic opacity-60">
              Health score calculated exclusively using normalized values for fair comparison.
            </p>
          </div>

          {/* ── 7. Detailed Score Breakdown Card ── */}
          {scan.scoreBreakdown && (
            <div className="glass-card rounded-3xl p-5 border border-white/5 shadow-xl">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-white">
                <Sparkles className="w-4 h-4 text-brand-primary" /> Detailed Score Breakdown
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                  <span className="text-content-secondary font-medium">Base Starting Score</span>
                  <span className="font-bold text-white">100 pts</span>
                </div>

                {/* Penalties */}
                {scan.scoreBreakdown.sugarPenalty > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-content-secondary flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-hazardous" /> Sugar Penalty
                    </span>
                    <span className="font-bold text-brand-hazardous">-{scan.scoreBreakdown.sugarPenalty} pts</span>
                  </div>
                )}

                {scan.scoreBreakdown.sodiumPenalty > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-content-secondary flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-hazardous" /> Sodium Penalty
                    </span>
                    <span className="font-bold text-brand-hazardous">-{scan.scoreBreakdown.sodiumPenalty} pts</span>
                  </div>
                )}

                {scan.scoreBreakdown.satFatPenalty > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-content-secondary flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-hazardous" /> Saturated Fat Penalty
                    </span>
                    <span className="font-bold text-brand-hazardous">-{scan.scoreBreakdown.satFatPenalty} pts</span>
                  </div>
                )}

                {scan.scoreBreakdown.transFatPenalty && scan.scoreBreakdown.transFatPenalty > 0 ? (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-content-secondary flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-hazardous" /> Trans Fat Penalty
                    </span>
                    <span className="font-bold text-brand-hazardous">-{scan.scoreBreakdown.transFatPenalty} pts</span>
                  </div>
                ) : null}

                {scan.scoreBreakdown.energyDensityPenalty && scan.scoreBreakdown.energyDensityPenalty > 0 ? (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-content-secondary flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-caution" /> Energy Density Penalty
                    </span>
                    <span className="font-bold text-brand-caution">-{scan.scoreBreakdown.energyDensityPenalty} pts</span>
                  </div>
                ) : null}

                {scan.scoreBreakdown.flourPenalty && scan.scoreBreakdown.flourPenalty > 0 ? (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-content-secondary flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-caution" /> Refined Flour Penalty
                    </span>
                    <span className="font-bold text-brand-caution">-{scan.scoreBreakdown.flourPenalty} pts</span>
                  </div>
                ) : null}

                {scan.scoreBreakdown.oilPenalty && scan.scoreBreakdown.oilPenalty > 0 ? (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-content-secondary flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-hazardous" /> Palm/Bad Oil Penalty
                    </span>
                    <span className="font-bold text-brand-hazardous">-{scan.scoreBreakdown.oilPenalty} pts</span>
                  </div>
                ) : null}

                {scan.scoreBreakdown.processingPenalty > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-content-secondary flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-caution" /> Ultra-Processing (NOVA 4)
                    </span>
                    <span className="font-bold text-brand-caution">-{scan.scoreBreakdown.processingPenalty} pts</span>
                  </div>
                )}

                {scan.scoreBreakdown.additivePenalty > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-content-secondary flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-caution" /> Additives Penalty
                    </span>
                    <span className="font-bold text-brand-caution">-{scan.scoreBreakdown.additivePenalty} pts</span>
                  </div>
                )}

                {scan.scoreBreakdown.ingredientHazardPenalty && scan.scoreBreakdown.ingredientHazardPenalty > 0 ? (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-content-secondary flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-caution" /> Ingredient Risk Penalty
                    </span>
                    <span className="font-bold text-brand-caution">-{scan.scoreBreakdown.ingredientHazardPenalty} pts</span>
                  </div>
                ) : null}

                {scan.scoreBreakdown.allergenPenalty && scan.scoreBreakdown.allergenPenalty > 0 ? (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-content-secondary flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-hazardous" /> Personal Allergen Penalty
                    </span>
                    <span className="font-bold text-brand-hazardous">-{scan.scoreBreakdown.allergenPenalty} pts</span>
                  </div>
                ) : null}

                {/* Bonuses */}
                {scan.scoreBreakdown.fiberBonus > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-content-secondary flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-safe" /> Dietary Fiber Bonus
                    </span>
                    <span className="font-bold text-brand-safe">+{scan.scoreBreakdown.fiberBonus} pts</span>
                  </div>
                )}

                {scan.scoreBreakdown.proteinBonus > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-content-secondary flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-safe" /> Protein Bonus
                    </span>
                    <span className="font-bold text-brand-safe">+{scan.scoreBreakdown.proteinBonus} pts</span>
                  </div>
                )}

                {scan.scoreBreakdown.wholeFoodBonus > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-content-secondary flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-safe" /> Whole Food & Probiotic Bonus
                    </span>
                    <span className="font-bold text-brand-safe">+{scan.scoreBreakdown.wholeFoodBonus} pts</span>
                  </div>
                )}

                {/* Final Score visual bar */}
                <div className="border-t border-white/10 mt-4 pt-4 flex flex-col gap-2">
                  <div className="flex justify-between text-sm font-black text-white">
                    <span>Aavis Health Score:</span>
                    <span style={{ color: ringColor }}>{scan.scoreBreakdown.finalScore} / 100</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${scan.scoreBreakdown.finalScore}%`,
                        backgroundColor: ringColor,
                        boxShadow: `0 0 8px ${ringColor}80`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}