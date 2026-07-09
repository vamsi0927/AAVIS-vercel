import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, PieChart, Info, ArrowRight, Activity } from 'lucide-react';

export function PortionGuide() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-navy-900 relative overflow-y-auto no-scrollbar pb-24">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-gradient-to-b from-brand-secondary/10 to-transparent pointer-events-none" />
      
      <header className="pt-safe pt-6 px-4 pb-4 flex flex-col relative z-10 md:max-w-3xl md:mx-auto md:w-full">
        <div className="flex items-center">
          <button data-testid='btn-portionguide-1'
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-content-secondary hover:text-white rounded-xl bg-white/5 border border-white/5 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-black text-lg ml-3 text-white">Portion Size Guide</h1>
        </div>
        <p className="mt-4 text-content-secondary text-sm">
          Understanding the difference between "Per Serving" and "Per 100g" is the single most important skill for reading nutrition labels.
        </p>
      </header>

      <div className="flex-1 px-4 mt-2 space-y-6 md:max-w-3xl md:mx-auto md:w-full relative z-10">

        {/* The Deception */}
        <section className="space-y-4">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-brand-secondary" />
            The Serving Size Trap
          </h2>

          <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
            <p className="text-sm text-content-secondary leading-relaxed">
              Brands have the legal right to set their own "serving sizes." They often make these serving sizes ridiculously small so that the calories and sugar look healthy at a quick glance.
            </p>
            <div className="bg-navy-800 rounded-xl p-4 border border-white/5 flex flex-col gap-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-hazardous/10 rounded-full blur-2xl" />
              <h3 className="font-bold text-white text-sm">Example: A Standard Chocolate Bar (50g)</h3>
              
              <div className="flex flex-col gap-2 relative z-10">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <span className="text-xs text-content-secondary">Brand's "Serving Size"</span>
                  <span className="font-bold text-white">10g (1/5th of the bar)</span>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-brand-hazardous rotate-90 my-1" />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-brand-hazardous/10 border border-brand-hazardous/20">
                  <span className="text-xs text-brand-hazardous font-bold">Sugar displayed on front</span>
                  <span className="font-black text-brand-hazardous">5g</span>
                </div>
              </div>
              <p className="text-xs text-content-secondary mt-2">
                It looks healthy, but nobody eats 1/5th of a chocolate bar. If you eat the whole 50g bar, you are eating <strong className="text-white">25g of sugar</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* Per 100g */}
        <section className="space-y-4">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-safe" />
            Always Look at "Per 100g"
          </h2>

          <div className="glass-card rounded-2xl p-5 border border-white/5">
            <p className="text-sm text-content-secondary leading-relaxed mb-4">
              The "Per 100g" column is the great equalizer. It is the only way to compare two different products fairly, because it removes the brand's manipulation of serving sizes.
            </p>
            
            <div className="grid grid-cols-2 gap-3 text-center">
               <div className="bg-navy-800 rounded-xl p-3 border border-white/5">
                 <p className="text-xs text-content-secondary mb-1">Cereal A (30g serving)</p>
                 <p className="font-bold text-white">10g sugar / serving</p>
               </div>
               <div className="bg-navy-800 rounded-xl p-3 border border-white/5">
                 <p className="text-xs text-content-secondary mb-1">Cereal B (50g serving)</p>
                 <p className="font-bold text-white">12g sugar / serving</p>
               </div>
            </div>
            
            <div className="my-4 flex items-center justify-center">
              <Info className="w-5 h-5 text-brand-primary" />
              <span className="text-xs text-content-secondary ml-2">Which is healthier? Look at Per 100g:</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
               <div className="bg-brand-hazardous/10 rounded-xl p-3 border border-brand-hazardous/20">
                 <p className="text-[10px] uppercase text-brand-hazardous font-bold mb-1">Cereal A (Per 100g)</p>
                 <p className="font-black text-brand-hazardous">33g sugar</p>
               </div>
               <div className="bg-brand-safe/10 rounded-xl p-3 border border-brand-safe/20">
                 <p className="text-[10px] uppercase text-brand-safe font-bold mb-1">Cereal B (Per 100g)</p>
                 <p className="font-black text-brand-safe">24g sugar</p>
               </div>
            </div>
            <p className="text-xs text-content-secondary mt-4 text-center">
              Cereal B is actually much healthier, even though its "Per Serving" sugar looked higher initially.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
