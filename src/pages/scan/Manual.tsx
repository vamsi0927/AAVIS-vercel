import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { analyzeTextWithGemini, getGeminiErrorMessage } from '../../lib/geminiAnalysis';
import { computeHealthScore } from '../../lib/scoring';

export function ScanManual() {
  const navigate = useNavigate();
  const { profile, addScan } = useAppContext();
  
  const [productName, setProductName] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!ingredients.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Use Gemini to analyze text
      const aiResult = await analyzeTextWithGemini(productName, ingredients, profile);
      
      // Score it based on user's health profile
      const scoredResult = computeHealthScore(aiResult.product, profile);
      
      const scan: any = {
        id: `scan_${Date.now()}`,
        productId: aiResult.product.id,
        date: new Date().toISOString(),
        product: aiResult.product,
        aiSummary: aiResult.aiSummary,
        ...scoredResult,
        mainConcerns: scoredResult.mainConcerns || aiResult.mainConcerns,
        dietAdvice: scoredResult.dietAdvice || aiResult.dietAdvice,
      };
      
      let finalScanId = scan.id;
      const { supabase, isSupabaseConfigured } = await import('../../lib/supabase');
      if (isSupabaseConfigured()) {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (userId) {
          const { saveScan } = await import('../../lib/supabaseService');
          const savedRow = await saveScan(userId, {
            product_name: aiResult.product.name,
            brand: aiResult.product.brand,
            barcode: aiResult.product.id,
            ingredients: aiResult.product.ingredients,
            nutrients: aiResult.product.nutrients,
            additives: aiResult.product.additives,
            allergens_detected: aiResult.product.allergens,
            health_score: scoredResult.score,
            verdict: scoredResult.verdict,
            diet_advice: scan.dietAdvice,
            ai_summary: aiResult.aiSummary,
            image_url: aiResult.product.imageUrl,
          });
          if (savedRow) {
            finalScanId = savedRow.id;
            scan.id = finalScanId;
            scan.productId = finalScanId;
            scan.product.id = finalScanId;
          }
        }
      }

      addScan(scan);
      
      navigate(`/result/${finalScanId}`, { replace: true });
    } catch (err: any) {
      setError(getGeminiErrorMessage(err.message));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-navy-900 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-brand-primary/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-20 left-0 w-72 h-72 bg-brand-secondary/5 rounded-full blur-[100px]" />

      <header className="pt-safe pt-6 px-4 pb-4 flex items-center border-b border-white/5 relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-content-secondary hover:text-white rounded-xl bg-white/5 border border-white/5 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-black text-lg text-white ml-3">Manual Entry</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 space-y-6 relative z-10">
        
        {/* Error Alert */}
        {error && (
          <div className="bg-brand-hazardous/10 border border-brand-hazardous/30 rounded-2xl p-4 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-brand-hazardous flex-shrink-0 mt-0.5" />
            <p className="text-sm text-brand-hazardous/90 leading-relaxed">{error}</p>
          </div>
        )}

        <div className="glass-card rounded-3xl p-5 border border-white/5 shadow-2xl space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-content-secondary mb-2">
              Product name (optional)
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              disabled={isAnalyzing}
              placeholder="e.g. Spicy Tomato Soup"
              className="w-full glass-input rounded-2xl py-3 px-4 text-white text-sm placeholder:text-content-secondary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-content-secondary mb-2">
              Ingredients <span className="text-brand-hazardous font-black">*</span>
            </label>
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              disabled={isAnalyzing}
              placeholder="Paste ingredients separated by commas (e.g. Water, Sugar, Corn Syrup, E102)..."
              rows={8}
              className="w-full glass-input rounded-2xl py-3 px-4 text-white text-sm placeholder:text-content-secondary resize-none"
            />
            <p className="text-[11px] text-content-secondary mt-2.5 leading-relaxed">
              Our AI will analyze these ingredients and immediately flag any hazards based on your profile.
            </p>
          </div>
        </div>
      </div>

      <div className="pb-safe pb-6 px-6 border-t border-white/5 pt-4 relative z-10">
        <button
          onClick={handleAnalyze}
          disabled={!ingredients.trim() || isAnalyzing}
          className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white hover:opacity-95 disabled:opacity-50 rounded-2xl py-4 font-bold text-base flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-lg shadow-brand-primary/20"
        >
          {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {isAnalyzing ? 'AI is Analyzing...' : 'Analyze Ingredients'}
        </button>
      </div>
    </div>
  );
}