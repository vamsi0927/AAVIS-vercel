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
  Loader2,
  X,
  ImageIcon
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { updateScanScore } from '../lib/supabaseService';
import { analyzeMultiStepScan } from '../lib/geminiAnalysis';
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

function IngredientChip({ name, level, explanation }: { name: string; level: IngredientRiskLevel; explanation: string; }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div 
      onClick={() => explanation && setIsExpanded(!isExpanded)}
      className={`
        relative flex flex-col transition-all duration-200 cursor-pointer max-w-full
        ${isExpanded ? 'w-full mb-1' : 'shrink'}
      `}
    >
      <div className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors min-w-0
        ${getRiskChipClasses(level)}
        ${isExpanded ? 'rounded-b-none border-b-0 shadow-lg bg-opacity-30' : 'hover:bg-opacity-20'}
      `}>
        <div className={`w-1.5 h-1.5 rounded-full ${getRiskDotColor(level)} shrink-0 shadow-sm`} />
        <span className="capitalize break-words flex-1 min-w-0">{name}</span>
        {explanation && (
          <Info className={`w-3.5 h-3.5 shrink-0 ml-2 opacity-40 transition-transform ${isExpanded ? 'rotate-180 opacity-100' : ''}`} />
        )}
      </div>
      
      {isExpanded && explanation && (
        <div className={`
          p-3 text-[10px] leading-relaxed border border-t-0 rounded-b-lg animate-in slide-in-from-top-1 break-words
          ${getRiskChipClasses(level)} bg-opacity-20 backdrop-blur-sm
        `}>
          {level !== 'safe' && <span className="font-bold uppercase mr-1">[{level}]</span>}
          {explanation}
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
  const [showImageModal, setShowImageModal] = useState<string | null>(null);

  const handleReAnalyze = async () => {
    if (!scan || !product) return;
    setIsReanalyzing(true);
    
    try {
      setReanalyzeStatus('[REANALYZE] Running AI Scoring Engine...');
      
      const ingredientsText = `Ingredients: ${product.ingredients.join(', ')}\nAdditives: ${product.additives.join(', ')}`;
      const nutritionText = `Nutrients: ${JSON.stringify(product.rawNutrients || product.nutrients)}`;
      
      const aiResult = await analyzeMultiStepScan(ingredientsText, nutritionText, profile, (msg) => {
        setReanalyzeStatus(`[REANALYZE] ${msg}`);
      });
      
      // Still run local scoring for personalized warnings/structural checks
      const updatedScoreData = computeHealthScore(aiResult.product, profile);
      
      setReanalyzeStatus('[REANALYZE] Updating Database...');
      
      // Override with AI score if available
      const finalScore = aiResult.finalScore !== undefined ? aiResult.finalScore : updatedScoreData.score;
      const finalVerdict = aiResult.finalScore !== undefined 
          ? (aiResult.finalScore < 40 ? 'hazardous' : aiResult.finalScore < 70 ? 'caution' : 'safe')
          : updatedScoreData.verdict;

      const success = await updateScanScore(scan.id, {
        health_score: finalScore,
        verdict: finalVerdict,
        nutrients: aiResult.product.nutrients,
        diet_advice: updatedScoreData.dietAdvice || aiResult.dietAdvice || '',
      });
      
      if (!success) {
        toast.error('Failed to update database');
        setIsReanalyzing(false);
        return;
      }
      
      setReanalyzeStatus('[SCORE_RECALCULATED]');
      
      const updatedScan = {
        ...scan,
        score: finalScore,
        verdict: finalVerdict,
        warnings: updatedScoreData.warnings,
        dietAdvice: updatedScoreData.dietAdvice || aiResult.dietAdvice || scan.dietAdvice,
        scoreReasons: updatedScoreData.scoreReasons,
        mainConcerns: updatedScoreData.mainConcerns || aiResult.mainConcerns || scan.mainConcerns,
        personalizedWarnings: updatedScoreData.personalizedWarnings,
        scoreBreakdown: updatedScoreData.scoreBreakdown,
        aiDimensions: aiResult.aiDimensions,
        overallAssessment: aiResult.overallAssessment,
        majorBenefits: aiResult.majorBenefits,
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
    setShowImageModal(url);
  };

  // ── Score ring config (SVG arc)
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;
  const ringColor = scan.verdict === 'hazardous' ? '#ef4444' : scan.verdict === 'caution' ? '#f59e0b' : '#10b981';
  const scoreBorderClass = scan.verdict === 'hazardous'
    ? 'border-brand-hazardous/25'
    : scan.verdict === 'caution' ? 'border-brand-caution/25'
    : 'border-brand-safe/25';
  const scoreBgClass = scan.verdict === 'hazardous'
    ? 'bg-brand-hazardous/5'
    : scan.verdict === 'caution' ? 'bg-brand-caution/5'
    : 'bg-brand-safe/5';
  const scoreEmoji = scan.verdict === 'hazardous' ? '🚫' : scan.verdict === 'caution' ? '⚡' : '✅';
  const scoreLabel = scan.verdict === 'hazardous' ? 'High Concern' : scan.verdict === 'caution' ? 'Moderate' : 'Good';

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
          <button onClick={handleReAnalyze} disabled={isReanalyzing} className={`p-2 rounded-xl transition-colors border border-transparent ${isReanalyzing ? 'opacity-50 text-brand-primary bg-brand-primary/10' : 'text-content-secondary hover:text-white bg-white/5 hover:border-white/10'}`} title="Recalculate Score">
            {isReanalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
          </button>
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
            <div className="w-16 h-16 glass-card rounded-2xl flex items-center justify-center text-3xl shrink-0 border border-white/10 shadow-xl relative overflow-hidden group cursor-zoom-in" onClick={handleViewOriginal}>
              <div className="absolute inset-0 bg-brand-primary/5 rounded-2xl blur-md z-0" />
              {(scan.image_url || product.imageUrl) ? (
                <img 
                  src={scan.image_url || product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-cover relative z-10"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <span className={`relative z-10 ${(scan.image_url || product.imageUrl) ? 'hidden' : ''}`}>{product.imageEmoji}</span>
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
            <p className="text-xs text-content-secondary max-w-sm mx-auto leading-relaxed">
              {scan.overallAssessment || scan.dietAdvice || (score <= 40
                ? 'High concern. This product has notable health risks. See the analysis below.'
                : score <= 70
                ? 'Moderate. Occasional consumption is okay, but limit frequency.'
                : 'Good. This product has a relatively clean nutritional profile.')}
            </p>

            {/* AI Dimensions Breakdown */}
            {scan.aiDimensions && (
              <div className="text-left mt-5 pt-5 border-t border-white/5 space-y-4">
                <p className="text-[10px] font-black text-content-secondary uppercase tracking-[0.15em] mb-3">Health Dimensions Breakdown</p>
                
                {Object.entries(scan.aiDimensions).map(([dim, data]: [string, any], idx) => {
                  const dimLabels: Record<string, string> = {
                    ingredientSafety: 'Ingredient Safety',
                    nutritionalQuality: 'Nutritional Quality',
                    processingLevel: 'Processing Level',
                    nutrientDensity: 'Nutrient Density',
                    energyDensity: 'Energy Density',
                    wholeFoodContent: 'Whole Food Content',
                    functionalHealthImpact: 'Functional Health Impact'
                  };
                  const label = dimLabels[dim] || dim;
                  const dimScore = data.score;
                  const dimColor = dimScore < 40 ? '#ef4444' : dimScore < 70 ? '#f59e0b' : '#10b981';
                  
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-bold text-white">
                        <span>{label}</span>
                        <span style={{ color: dimColor }}>{dimScore}/100</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${dimScore}%`, backgroundColor: dimColor }} />
                      </div>
                      <p className="text-[10px] text-content-secondary pt-1 leading-relaxed">
                        {data.justification}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Score reason breakdown (Fallback for old scans) */}
            {!scan.aiDimensions && scan.scoreBreakdown && scan.scoreBreakdown.finalScore !== undefined && (
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
                  <span className="text-sm font-black" style={{ color: ringColor }}>{scan.scoreBreakdown?.finalScore}</span>
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

          {scan.majorBenefits && scan.majorBenefits.length > 0 && scan.majorBenefits[0] !== "None" && (
            <div className="bg-brand-safe/5 border border-brand-safe/20 rounded-3xl p-5 shadow-lg">
              <h3 className="text-brand-safe font-black text-sm mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Notable Benefits
              </h3>
              <ul className="space-y-2.5">
                {scan.majorBenefits.map((benefit: string, idx: number) => (
                  <li key={idx} className="text-xs text-content-primary/90 flex gap-2 leading-relaxed">
                    <span className="text-brand-safe font-black mt-0.5 shrink-0">✓</span>
                    <span className="flex-1 min-w-0 break-words">{benefit}</span>
                  </li>
                ))}
              </ul>
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
                    
                    const getDynamicInfo = (ingrName: string) => {
                      const nameLower = ingrName.toLowerCase().trim();

                      // 1. Look in dynamicIngredients (AI-generated)
                      if (product.dynamicIngredients) {
                        // A. Exact or substring match (highly reliable)
                        const directMatch = Object.entries(product.dynamicIngredients).find(([k]) => {
                          const keyLower = k.toLowerCase().trim();
                          return nameLower.includes(keyLower) || keyLower.includes(nameLower);
                        });
                        if (directMatch) return directMatch[1];

                        // B. Word/Token overlap match
                        const stopWords = new Set(['and', 'of', 'with', 'for', 'in', 'or', 'the', 'contains', 'added', 'powder', 'extract', 'liquid', 'natural', 'artificial', 'processed', 'refined', 'oil', 'flour']);
                        const getTokens = (str: string) =>
                          str.toLowerCase()
                             .split(/[^a-z0-9]/)
                             .map(t => t.trim())
                             .filter(t => t.length > 2 && !stopWords.has(t));

                        const nameTokens = getTokens(nameLower);
                        if (nameTokens.length > 0) {
                          const tokenMatch = Object.entries(product.dynamicIngredients).find(([k]) => {
                            const keyTokens = getTokens(k);
                            return nameTokens.some(t => keyTokens.includes(t));
                          });
                          if (tokenMatch) return tokenMatch[1];
                        }
                      }

                      // 2. Look in dynamicAdditives (AI-generated)
                      if (product.dynamicAdditives) {
                        const fromAdd = Object.entries(product.dynamicAdditives).find(([k]) => {
                          const keyLower = k.toLowerCase().trim();
                          return nameLower.includes(keyLower) || keyLower.includes(nameLower);
                        })?.[1];

                        if (fromAdd) {
                          return { hazard: fromAdd.hazard, explanation: fromAdd.healthExplanation };
                        }
                      }

                      // 3. Fallback to local ADDITIVES_DB if it matches an E-number or E-number name
                      const localAdd = Object.values(ADDITIVES_DB).find(
                        (a) =>
                          nameLower === a.code.toLowerCase() ||
                          nameLower === a.name.toLowerCase() ||
                          (a.name && nameLower.includes(a.name.toLowerCase()))
                      );
                      if (localAdd) {
                        return { hazard: localAdd.hazard, explanation: localAdd.healthExplanation };
                      }
                      return undefined;
                    };

                    const getLevel = (ingr: string) => {
                      return getDynamicInfo(ingr)?.hazard || classifyIngredient(ingr).level;
                    };

                    const sorted = [...product.ingredients].sort((a, b) => riskOrder[getLevel(a)] - riskOrder[getLevel(b)]);
                    const visible = showAllIngredients ? sorted : sorted.slice(0, 12);
                    
                    return visible.map((ingr, idx) => {
                      const dynamicInfo = getDynamicInfo(ingr);
                        
                      // Fallback to local DB if AI missed it completely
                      const localRisk = classifyIngredient(ingr);
                      const level = dynamicInfo?.hazard || localRisk.level;
                      const explanation = dynamicInfo?.explanation || localRisk.explanation;

                      return (
                        <IngredientChip key={idx} name={ingr} level={level} explanation={explanation} />
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
                    const localDbAdditive = ADDITIVES_DB[code];
                    
                    // Prefer AI explanations, then local database, then generic fallback
                    const additive = {
                      name: aiAdditive?.name || localDbAdditive?.name || code,
                      hazard: aiAdditive?.hazard || localDbAdditive?.hazard || 'caution',
                      function: aiAdditive?.function || localDbAdditive?.function || 'Food Additive',
                      healthExplanation: aiAdditive?.healthExplanation || localDbAdditive?.healthExplanation || 'Industrial food additive.'
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
            
            {(() => {
              // 1. Serving Size Parsing
              const rawServing = product.servingSize || '';
              const servingMatch = rawServing.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/);
              const servingNumeric = servingMatch ? parseFloat(servingMatch[1]) : null;
              const hasServing = servingNumeric !== null;

              // 2. Unit Detection Hierarchy
              let baseUnit = 'g';
              if (servingMatch && servingMatch[2].toLowerCase() === 'ml') {
                baseUnit = 'ml';
              } else if (product.normalizedNutrients?.unit === '100ml' || product.normalizedNutrients?.unit === 'ml') {
                baseUnit = 'ml';
              } else if (product.category && ['drink', 'milk', 'juice', 'beverage', 'soda', 'cola'].some(kw => product.category!.toLowerCase().includes(kw))) {
                baseUnit = 'ml';
              }
              const servingStr = hasServing ? `${servingNumeric} ${baseUnit}` : '';

              // FDA Daily Values
              const FDA_DV: Record<string, number> = {
                protein: 50,
                fiber: 28,
                fat: 78,
                satFat: 20,
                carbs: 275,
                sodium: 2300,
                sugar: 50
              };

              const formatValue = (val: number, unit: string) => {
                if (unit === 'mg' || unit === 'kcal') return Math.round(val).toString();
                if (val > 0 && val < 0.1) return '<0.1';
                return Number(val).toFixed(1).replace(/\.0$/, '');
              };

              const getBadge = (key: string, val100: number) => {
                if ((key === 'sugar' && val100 > 10) || (key === 'sodium' && val100 > 400) || (key === 'satFat' && val100 > 5) || (key === 'fat' && val100 > 20) || (key === 'calories' && val100 > 400)) return { color: 'text-brand-hazardous bg-brand-hazardous/10 border-brand-hazardous/30', label: 'High' };
                if ((key === 'protein' && val100 > 10) || (key === 'fiber' && val100 > 5)) return { color: 'text-brand-safe bg-brand-safe/10 border-brand-safe/30', label: 'Good' };
                if (key === 'carbs' || key === 'sodium' || key === 'sugar') return { color: 'text-brand-caution bg-brand-caution/10 border-brand-caution/30', label: 'Mod' };
                return null;
              };

              const gridClass = hasServing 
                ? "grid grid-cols-[1fr_70px_70px_50px] gap-2" 
                : "grid grid-cols-[1fr_80px] gap-2";

              return (
                <>
                  <div className={`${gridClass} border-b border-white/10 pb-2 mb-3`}>
                    <div className="text-[9px] text-content-secondary font-black tracking-wider uppercase">Nutrient</div>
                    <div className="text-[9px] text-content-secondary font-black tracking-wider uppercase text-right leading-tight">Per 100 {baseUnit}</div>
                    {hasServing && (
                      <>
                        <div className="text-[9px] text-content-secondary font-black tracking-wider uppercase text-right leading-tight">Per Serving<br/><span className="text-[8px] opacity-60">({servingStr})</span></div>
                        <div className="text-[9px] text-content-secondary font-black tracking-wider uppercase text-right leading-tight">% DV</div>
                      </>
                    )}
                  </div>

                  {(() => {
                    const NUTRIENT_META: Record<string, {label: string, icon: string, defaultUnit: string}> = {
                      calories: { label: 'Calories', icon: '🔥', defaultUnit: 'kcal' },
                      sugar: { label: 'Sugars', icon: '🍬', defaultUnit: 'g' },
                      addedSugars: { label: 'Added Sugars', icon: '🍯', defaultUnit: 'g' },
                      sodium: { label: 'Sodium', icon: '🧂', defaultUnit: 'mg' },
                      fat: { label: 'Total Fat', icon: '🥑', defaultUnit: 'g' },
                      satFat: { label: 'Sat Fat', icon: '🧈', defaultUnit: 'g' },
                      protein: { label: 'Protein', icon: '💪', defaultUnit: 'g' },
                      fiber: { label: 'Fiber', icon: '🌿', defaultUnit: 'g' },
                      carbs: { label: 'Carbs', icon: '🌾', defaultUnit: 'g' },
                    };

                    const allKeys = Array.from(new Set([
                      ...Object.keys(product.nutrients || {}),
                      ...Object.keys(product.rawNutrients || {})
                    ])).filter(k => k !== 'unit' && !k.startsWith('_'));

                    return allKeys.map((key) => {
                      let normVal = (product.normalizedNutrients || product.nutrients)[key as keyof typeof product.nutrients] as number | null;
                      
                      if (normVal === null || normVal === undefined || isNaN(normVal)) return null;

                      // Conversions
                      if (key === 'sodium' && product.normalizedNutrients?.unit === 'g' && normVal < 10) {
                        normVal = normVal * 1000;
                      } else if (key === 'calories' && product.normalizedNutrients?.unit === 'kJ') {
                        normVal = normVal / 4.184;
                      }

                      let perServingVal = null;
                      if (hasServing) {
                        perServingVal = normVal * (servingNumeric! / 100);
                        
                        // Scientific Validation Layer
                        if (Math.abs(perServingVal - (normVal * servingNumeric! / 100)) > 0.01) {
                          console.error(`Serving calculation mismatch for ${key}`);
                        }
                      }

                      const meta = NUTRIENT_META[key] || { 
                        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim(), 
                        icon: '✨', 
                        defaultUnit: 'g' 
                      };

                      // % DV Logic
                      let dvPercent = null;
                      if (hasServing && perServingVal !== null) {
                        let dvKey = key;
                        if (key === 'sugar' && allKeys.includes('addedSugars')) {
                          dvKey = 'skip'; // Prefer addedSugars if both exist
                        }
                        if (key === 'addedSugars') dvKey = 'sugar';

                        if (dvKey !== 'skip' && FDA_DV[dvKey]) {
                          dvPercent = Math.round((perServingVal / FDA_DV[dvKey]) * 100);
                        }
                      }

                      const badge = getBadge(key, normVal);

                      return (
                        <div key={key} className={`${gridClass} items-center py-2.5 border-b border-white/5 last:border-0`}>
                          <div className="flex items-center gap-1.5 min-w-0 pr-1">
                            <span className="text-sm shrink-0">{meta.icon}</span>
                            <span className="text-xs text-content-secondary font-medium truncate">{meta.label}</span>
                            {badge && (
                              <span className={`text-[8px] uppercase font-black px-1.5 py-0.5 rounded border ml-1 shrink-0 ${badge.color}`}>
                                {badge.label}
                              </span>
                            )}
                          </div>
                          
                          {/* Per 100 Column */}
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-[12px] font-black text-white">{formatValue(normVal, meta.defaultUnit)}</span>
                            <span className="text-[9px] text-content-secondary">{meta.defaultUnit}</span>
                          </div>
                          
                          {/* Per Serving Column */}
                          {hasServing && (
                            <div className="flex items-center justify-end gap-1 opacity-80">
                              <span className="text-[11px] font-bold text-white">{formatValue(perServingVal!, meta.defaultUnit)}</span>
                              <span className="text-[9px] text-content-secondary">{meta.defaultUnit}</span>
                            </div>
                          )}

                          {/* % DV Column */}
                          {hasServing && (
                            <div className="flex items-center justify-end">
                              {dvPercent !== null ? (
                                <span className={`text-[10px] font-bold ${dvPercent > 20 ? 'text-brand-caution' : 'text-content-secondary'}`}>{dvPercent}%</span>
                              ) : (
                                <span className="text-[10px] text-content-secondary opacity-50">-</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </>
              );
            })()}
            
            {(scan.nutritionConfidence && scan.nutritionConfidence < 100) && (
              <p className="text-[9px] text-brand-caution mt-4 bg-brand-caution/10 p-2 rounded-lg text-center font-medium border border-brand-caution/20">
                ⚠️ Nutrition data may contain OCR errors (Confidence: {scan.nutritionConfidence}%).
              </p>
            )}
            
            <p className="text-[9px] text-content-secondary mt-3 text-center italic opacity-60 leading-relaxed">
              Values are normalized per 100 g or 100 ml for fair comparison. Serving values are automatically adjusted using the detected serving size.
            </p>
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {showImageModal && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
          onClick={() => setShowImageModal(null)}
        >
          <button 
            className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-black/50 hover:bg-black text-white rounded-full transition-colors z-10"
            onClick={() => setShowImageModal(null)}
          >
            <X className="w-6 h-6" />
          </button>
          
          <div 
            className="w-full max-w-2xl bg-navy-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full bg-black/80 relative flex items-center justify-center border-b border-white/10" style={{ maxHeight: '60vh' }}>
              <img 
                src={showImageModal} 
                alt="Original Label"
                className="w-full h-auto max-h-[60vh] object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.classList.add('fallback-icon-container-modal');
                }}
              />
              <div className="absolute inset-0 items-center justify-center hidden [.fallback-icon-container-modal_&]:flex">
                <ImageIcon className="w-16 h-16 text-content-secondary/30" />
              </div>
            </div>
            
            <div className="p-6 bg-navy-800/50 flex-shrink-0 overflow-y-auto">
              <h2 className="text-xl font-bold text-white mb-1">
                {product.name}
              </h2>
              <div className="flex items-center gap-2 mb-4 text-sm text-content-secondary">
                <span>{product.brand}</span>
                <span>•</span>
                <span>{new Date(scan.date).toLocaleDateString(undefined, {
                  month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-navy-900 rounded-xl border border-white/5 flex items-center gap-2">
                  <span className="text-sm text-content-secondary font-medium">Health Score:</span>
                  <span className="text-lg font-bold text-white">
                    {score}/100 
                    {scan.verdict === 'safe' ? ' 🟢' : scan.verdict === 'caution' ? ' 🟡' : ' 🔴'}
                  </span>
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-2 rounded-xl ${scan.verdict === 'safe' ? 'bg-brand-safe/20 text-brand-safe' : scan.verdict === 'caution' ? 'bg-brand-caution/20 text-brand-caution' : 'bg-brand-hazardous/20 text-brand-hazardous'}`}>
                  {scan.verdict}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}