import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Scale, Info, AlertTriangle, ArrowRight } from 'lucide-react';
import { SAMPLE_PRODUCTS } from '../../data/sampleProducts';
import { isBeverage } from '../../lib/scoring';

export function CompareProducts() {
  const navigate = useNavigate();
  
  // Using hardcoded data from sample products for demonstration
  const product1 = SAMPLE_PRODUCTS[0]; // Spicy Ramen (Hazardous)
  const product2 = SAMPLE_PRODUCTS[2]; // Oat & Honey Granola (Safe)

  const getVerdictColor = (additives: string[]) => {
    if (additives.includes('E102') || additives.includes('E211')) return 'text-brand-hazardous border-brand-hazardous/30 bg-brand-hazardous/10';
    if (additives.length > 1) return 'text-brand-caution border-brand-caution/30 bg-brand-caution/10';
    return 'text-brand-safe border-brand-safe/30 bg-brand-safe/10';
  };

  const getVerdictText = (additives: string[]) => {
    if (additives.includes('E102') || additives.includes('E211')) return 'Hazardous';
    if (additives.length > 1) return 'Caution';
    return 'Safe';
  };

  return (
    <div className="flex flex-col h-full bg-navy-900">
      <header className="pt-safe pt-6 px-4 pb-4 flex items-center justify-between border-b border-navy-800 bg-navy-900/90 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-content-secondary hover:text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-display font-bold text-lg ml-2">Compare</h1>
        </div>
        <button className="text-brand-primary text-sm font-medium px-3 py-1 bg-brand-primary/10 rounded-full">
          Change
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        
        {/* Sticky Headers for Products */}
        <div className="sticky top-0 z-10 bg-navy-900/95 backdrop-blur-xl border-b border-navy-800 flex shadow-lg">
          <div className="w-1/2 p-4 border-r border-navy-800 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-navy-800 rounded-xl flex items-center justify-center text-2xl border border-navy-700 mb-2">
              {product1.imageEmoji}
            </div>
            <h3 className="font-bold text-sm text-white line-clamp-1">{product1.name}</h3>
            <p className="text-xs text-content-secondary truncate">{product1.brand}</p>
          </div>
          <div className="w-1/2 p-4 text-center flex flex-col items-center relative">
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-navy-700 border-4 border-navy-900 flex items-center justify-center z-10">
              <span className="text-[10px] font-bold text-content-secondary">VS</span>
            </div>
            <div className="w-12 h-12 bg-navy-800 rounded-xl flex items-center justify-center text-2xl border border-navy-700 mb-2">
              {product2.imageEmoji}
            </div>
            <h3 className="font-bold text-sm text-white line-clamp-1">{product2.name}</h3>
            <p className="text-xs text-content-secondary truncate">{product2.brand}</p>
          </div>
        </div>

        {/* Verdict Row */}
        <div className="flex border-b border-navy-800/50">
          <div className="w-1/2 p-4 flex justify-center border-r border-navy-800/50">
            <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider ${getVerdictColor(product1.additives)}`}>
              {getVerdictText(product1.additives)}
            </div>
          </div>
          <div className="w-1/2 p-4 flex justify-center">
            <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider ${getVerdictColor(product2.additives)}`}>
              {getVerdictText(product2.additives)}
            </div>
          </div>
        </div>

        {/* Nutritional Comparison */}
        <div className="px-4 py-6">
          <h4 className="text-xs font-medium text-content-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
            <Scale className="w-4 h-4" /> Nutrition per {product1.nutrients.unit || (isBeverage(product1) ? '100ml' : '100g')}
          </h4>
          
          <div className="space-y-1 border border-navy-700 rounded-2xl overflow-hidden bg-navy-800">
            {[
              { label: 'Calories', k1: 'calories', k2: 'calories', unit: 'kcal' },
              { label: 'Sugar', k1: 'sugar', k2: 'sugar', unit: 'g' },
              { label: 'Sodium', k1: 'sodium', k2: 'sodium', unit: 'mg' },
              { label: 'Protein', k1: 'protein', k2: 'protein', unit: 'g' },
              { label: 'Fiber', k1: 'fiber', k2: 'fiber', unit: 'g' },
            ].map((stat, i) => {
              const val1 = product1.nutrients[stat.k1 as keyof typeof product1.nutrients] ?? 0;
              const val2 = product2.nutrients[stat.k2 as keyof typeof product2.nutrients] ?? 0;
              const isP1Better = stat.label === 'Protein' || stat.label === 'Fiber' ? val1 > val2 : val1 < val2;
              const isP2Better = stat.label === 'Protein' || stat.label === 'Fiber' ? val2 > val1 : val2 < val1;
              
              return (
                <div key={i} className="flex border-b border-navy-700/50 last:border-0 bg-navy-900/30 p-3">
                  <div className={`w-1/3 text-center text-sm font-semibold ${isP1Better ? 'text-brand-safe' : isP2Better ? 'text-brand-hazardous/80' : 'text-white'}`}>
                    {val1}{stat.unit}
                  </div>
                  <div className="w-1/3 text-center text-xs text-content-secondary uppercase tracking-wider flex items-center justify-center">
                    {stat.label}
                  </div>
                  <div className={`w-1/3 text-center text-sm font-semibold ${isP2Better ? 'text-brand-safe' : isP1Better ? 'text-brand-hazardous/80' : 'text-white'}`}>
                    {val2}{stat.unit}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Additives Comparison */}
        <div className="px-4 py-2">
          <h4 className="text-xs font-medium text-content-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Harmful Additives
          </h4>
          
          <div className="flex gap-4">
            <div className="w-1/2 bg-navy-800 rounded-2xl p-4 border border-navy-700">
              {product1.additives.length > 0 ? (
                <ul className="space-y-2">
                  {product1.additives.map(a => (
                    <li key={a} className="text-xs flex items-start gap-2 bg-navy-900/50 p-2 rounded-lg border border-navy-700">
                      <span className="text-brand-hazardous font-bold">{a}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-brand-safe flex items-center gap-1"><Info className="w-3 h-3" /> None detected</div>
              )}
            </div>
            
            <div className="w-1/2 bg-navy-800 rounded-2xl p-4 border border-navy-700">
              {product2.additives.length > 0 ? (
                <ul className="space-y-2">
                  {product2.additives.map(a => (
                    <li key={a} className="text-xs flex items-start gap-2 bg-navy-900/50 p-2 rounded-lg border border-navy-700">
                      <span className="text-brand-caution font-bold">{a}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-brand-safe flex items-center gap-1"><Info className="w-3 h-3" /> None detected</div>
              )}
            </div>
          </div>
        </div>

        {/* AI Winner Banner */}
        <div className="m-4 mt-8 p-1 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-safe">
          <div className="bg-navy-900 rounded-xl p-5 text-center">
            <h3 className="text-sm font-medium text-content-secondary uppercase tracking-wider mb-2">AI Recommendation</h3>
            <p className="text-lg font-bold text-white mb-4">
              Choose <span className="text-brand-safe">{product2.name}</span>
            </p>
            <p className="text-sm text-content-secondary mb-5">
              It has significantly lower sodium, zero hazardous additives, and is safer for your health profile.
            </p>
            <button className="w-full py-3 bg-navy-800 hover:bg-navy-700 text-white rounded-xl font-medium border border-navy-700 flex items-center justify-center gap-2">
              View Detailed Report <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
