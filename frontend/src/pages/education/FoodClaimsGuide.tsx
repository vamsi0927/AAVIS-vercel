import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, ArrowRight, XCircle, CheckCircle2, AlertCircle } from 'lucide-react';

const CLAIMS = [
  {
    claim: 'Sugar Free',
    reality: 'Often packed with artificial sweeteners (like Aspartame or Sucralose) which can disrupt gut microbiome and maintain sugar cravings.',
    dangerLevel: 'high'
  },
  {
    claim: 'No Added Sugar',
    reality: 'The product naturally contains high amounts of sugar (like fruit juice concentrate). It still spikes blood sugar identically to added sugar.',
    dangerLevel: 'medium'
  },
  {
    claim: 'Multigrain',
    reality: 'Just means multiple types of grains are used. Often they are all highly refined white grains stripped of fiber. Look for "Whole Grain" instead.',
    dangerLevel: 'high'
  },
  {
    claim: 'Made with Whole Grains',
    reality: 'It might contain 1% whole grain and 99% refined flour. Check the ingredients list to see if whole grain is the first ingredient.',
    dangerLevel: 'medium'
  },
  {
    claim: 'All Natural',
    reality: 'An unregulated marketing term. High Fructose Corn Syrup comes from corn, making it "natural", but it is terrible for metabolic health.',
    dangerLevel: 'high'
  },
  {
    claim: 'Fat Free',
    reality: 'When manufacturers remove fat, the food tastes like cardboard. They almost always compensate by adding massive amounts of sugar.',
    dangerLevel: 'high'
  },
  {
    claim: 'High Protein',
    reality: 'Often used to health-wash candy bars. A "high protein" bar might have 10g of protein but 25g of sugar and processed seed oils.',
    dangerLevel: 'medium'
  },
  {
    claim: 'Organic',
    reality: 'Organic sugar is still sugar. Organic junk food is still junk food. It just means the ingredients were grown without synthetic pesticides.',
    dangerLevel: 'low'
  }
];

export function FoodClaimsGuide() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-navy-900 relative overflow-y-auto no-scrollbar pb-24">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-gradient-to-b from-brand-primary/10 to-transparent pointer-events-none" />
      
      <header className="pt-safe pt-6 px-4 pb-4 flex flex-col relative z-10 md:max-w-3xl md:mx-auto md:w-full">
        <div className="flex items-center">
          <button data-testid='btn-foodclaimsguide-1'
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-content-secondary hover:text-white rounded-xl bg-white/5 border border-white/5 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-black text-lg ml-3 text-white">Food Claims Decoder</h1>
        </div>
        <p className="mt-4 text-content-secondary text-sm">
          The front of the package is a billboard designed to sell. Here is what those bold marketing claims actually mean.
        </p>
      </header>

      <div className="flex-1 px-4 mt-2 space-y-4 md:max-w-3xl md:mx-auto md:w-full relative z-10">
        {CLAIMS.map((item, idx) => (
          <div key={idx} className="glass-card rounded-2xl p-5 border border-white/5 flex flex-col gap-3">
            
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-primary" />
                <span className="font-bold text-white uppercase tracking-wider text-sm">Claim</span>
              </div>
              <h3 className="font-display font-black text-lg text-white">"{item.claim}"</h3>
            </div>

            <div className="pt-1 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-content-secondary" />
                <span className="font-bold text-content-secondary uppercase tracking-wider text-xs">Reality</span>
              </div>
              <p className="text-sm text-content-primary leading-relaxed">
                {item.reality}
              </p>
            </div>

            <div className="mt-2">
              {item.dangerLevel === 'high' && (
                <div className="flex items-center gap-2 text-xs font-bold text-brand-hazardous bg-brand-hazardous/10 px-3 py-2 rounded-lg border border-brand-hazardous/20 w-fit">
                  <XCircle className="w-4 h-4" /> Highly Misleading
                </div>
              )}
              {item.dangerLevel === 'medium' && (
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-2 rounded-lg border border-amber-400/20 w-fit">
                  <AlertCircle className="w-4 h-4" /> Often Misleading
                </div>
              )}
              {item.dangerLevel === 'low' && (
                <div className="flex items-center gap-2 text-xs font-bold text-brand-safe bg-brand-safe/10 px-3 py-2 rounded-lg border border-brand-safe/20 w-fit">
                  <CheckCircle2 className="w-4 h-4" /> True, but irrelevant
                </div>
              )}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
