import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { SAMPLE_PRODUCTS } from '../../data/sampleProducts';

export function ProductAlternatives() {
  const navigate = useNavigate();
  
  // Hardcode product to suggest alternatives for
  const targetProduct = SAMPLE_PRODUCTS[0]; // Spicy Ramen (Hazardous)
  
  // Fake alternative products
  const alternatives = [
    { id: 'alt_1', name: 'Organic Brown Rice Noodles', brand: 'NatureBowl', imageEmoji: '🍜', match: 95, verdict: 'safe', price: '₹120', highlights: ['No MSG', 'High Fiber', 'Organic'] },
    { id: 'alt_2', name: 'Buckwheat Soba Noodles', brand: 'ZenNoodles', imageEmoji: '🍜', match: 88, verdict: 'safe', price: '₹150', highlights: ['Gluten Free', 'Zero Additives'] },
    { id: 'alt_3', name: 'Millet Noodles', brand: 'HealthyWay', imageEmoji: '🥘', match: 82, verdict: 'caution', price: '₹90', highlights: ['Locally Sourced', 'Low Sodium'] },
  ];

  return (
    <div className="flex flex-col h-full bg-navy-900">
      <header className="pt-safe pt-6 px-4 pb-4 flex items-center border-b border-navy-800 bg-navy-900/90 backdrop-blur-md sticky top-0 z-20">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-content-secondary hover:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display font-bold text-lg ml-2">Healthier Alternatives</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6">
        
        {/* Context Banner */}
        <div className="bg-brand-hazardous/10 border border-brand-hazardous/30 rounded-2xl p-4 mb-8 flex gap-4 items-center">
          <div className="w-12 h-12 bg-navy-900 rounded-xl flex items-center justify-center text-2xl border border-navy-700 flex-shrink-0 grayscale">
            {targetProduct.imageEmoji}
          </div>
          <div>
            <p className="text-xs text-content-secondary uppercase tracking-wider mb-1">Alternatives for</p>
            <h3 className="font-bold text-white text-sm">{targetProduct.name}</h3>
            <p className="text-xs text-brand-hazardous flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3" /> High sodium & MSG
            </p>
          </div>
        </div>

        <h2 className="text-sm font-medium text-content-secondary uppercase tracking-wider mb-4 pl-1">
          AI Suggested Matches
        </h2>

        <div className="space-y-4 pb-10">
          {alternatives.map((alt) => (
            <div key={alt.id} className="bg-navy-800 border border-navy-700 hover:border-brand-primary/50 transition-colors rounded-3xl p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-brand-primary/10 text-brand-primary text-[10px] font-bold px-3 py-1.5 rounded-bl-xl border-b border-l border-brand-primary/20">
                {alt.match}% Match
              </div>

              <div className="flex gap-4">
                <div className="w-16 h-16 bg-navy-900 rounded-2xl flex items-center justify-center text-3xl border border-navy-600 shadow-inner flex-shrink-0 mt-2">
                  {alt.imageEmoji}
                </div>
                
                <div className="flex-1 pt-1">
                  <h3 className="font-bold text-white text-base leading-tight mb-1">{alt.name}</h3>
                  <p className="text-xs text-content-secondary mb-3">{alt.brand} • {alt.price}</p>
                  
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {alt.highlights.map(h => (
                      <span key={h} className="text-[10px] font-medium text-brand-safe bg-brand-safe/10 border border-brand-safe/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {h}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-navy-700 pt-4 flex gap-3 mt-1">
                <button 
                  onClick={() => navigate('/scan')} // Mock nav
                  className="flex-1 bg-navy-700 hover:bg-navy-600 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
                >
                  View Details
                </button>
                <button className="flex-1 bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1">
                  Compare <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Affiliate Disclosure Mock */}
        <p className="text-[10px] text-content-secondary/60 text-center px-4 leading-relaxed pb-8">
          Aavis AI suggests alternatives purely based on nutritional profiles and chemical composition. We do not accept sponsored placements.
        </p>

      </div>
    </div>
  );
}
