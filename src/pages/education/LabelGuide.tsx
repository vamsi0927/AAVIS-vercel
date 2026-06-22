import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Scale, AlertTriangle, Droplets, PieChart, Info, ShieldAlert, CheckCircle2 } from 'lucide-react';

export function LabelGuide() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-navy-900 relative overflow-y-auto no-scrollbar pb-24">
      {/* Ambient backgrounds */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-gradient-to-b from-brand-primary/10 to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-brand-primary/20 rounded-full blur-[100px] pointer-events-none" />

      <header className="pt-safe pt-6 px-4 pb-4 flex flex-col relative z-10 md:max-w-3xl md:mx-auto md:w-full">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-content-secondary hover:text-white rounded-xl bg-white/5 border border-white/5 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-black text-lg ml-3 text-white">Label Literacy</h1>
        </div>
        <p className="mt-4 text-content-secondary text-sm">
          A definitive guide to reading ingredients, spotting hidden tricks, and understanding the nutrition facts panel.
        </p>
      </header>

      <div className="flex-1 px-4 space-y-6 md:max-w-3xl md:mx-auto md:w-full relative z-10">
        
        {/* Highlighted Note */}
        <div className="glass-card rounded-2xl p-5 border border-brand-primary/30 bg-gradient-to-r from-brand-primary/10 to-transparent flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center shrink-0 text-brand-primary shadow-lg shadow-brand-primary/10">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-black text-sm text-brand-primary uppercase tracking-wider mb-2">Golden Rule of Labels</h3>
            <p className="text-sm text-white font-medium leading-relaxed">
              <span className="text-brand-secondary font-bold font-display">Ingredients</span> tell you <span className="underline decoration-brand-secondary decoration-2 font-black">WHAT</span> you're eating.<br />
              <span className="text-brand-secondary font-bold font-display">Nutrition Facts</span> tell you <span className="underline decoration-brand-secondary decoration-2 font-black">HOW MUCH</span> you're eating.
            </p>
          </div>
        </div>
        
        {/* Section 1: The Ingredients List */}
        <section className="space-y-4">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-brand-primary" />
            The Ingredients List
          </h2>

          <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-brand-primary font-black">1</span>
              </div>
              <div>
                <h3 className="font-bold text-white text-[15px] mb-1">Listed by Weight</h3>
                <p className="text-sm text-content-secondary leading-relaxed">
                  Ingredients are listed in descending order by weight. The first 3 ingredients make up the vast majority of what you're eating. If sugar is in the top 3, it's essentially a dessert.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-emerald-400 font-black">2</span>
              </div>
              <div>
                <h3 className="font-bold text-white text-[15px] mb-1">Shorter is Better</h3>
                <p className="text-sm text-content-secondary leading-relaxed">
                  A list with 5 recognizable ingredients is generally much healthier than a list of 25 unpronounceable chemicals. If it sounds like a science experiment, it probably is.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-hazardous/10 flex items-center justify-center shrink-0 mt-0.5">
                <Droplets className="w-4 h-4 text-brand-hazardous" />
              </div>
              <div>
                <h3 className="font-bold text-white text-[15px] mb-1">Hidden Sugars</h3>
                <p className="text-sm text-content-secondary leading-relaxed">
                  Manufacturers split sugars into different names (Maltodextrin, Dextrose, Fructose, Corn Syrup) so they fall lower on the ingredients list. Combine them, and sugar is often the #1 ingredient.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Nutrition Facts */}
        <section className="space-y-4">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-brand-secondary" />
            Nutrition Facts Panel
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="glass-card rounded-2xl p-5 border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-secondary/10 blur-xl" />
              <h3 className="font-bold text-white text-[15px] mb-2">Serving Size Deception</h3>
              <p className="text-sm text-content-secondary leading-relaxed mb-4">
                Brands often make the serving size unrealistically small to make calories and sugar look low. Always check "Per 100g" to fairly compare products.
              </p>
              <div className="bg-navy-900 rounded-xl p-3 border border-white/5">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-content-secondary">Per Serving (10g)</span>
                  <span className="text-brand-safe font-bold">5g Sugar</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-content-secondary">Per 100g (Reality)</span>
                  <span className="text-brand-hazardous font-bold">50g Sugar</span>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <h3 className="font-bold text-white text-[15px] mb-2">Fiber-to-Carb Ratio</h3>
              <p className="text-sm text-content-secondary leading-relaxed mb-4">
                Look for a carbohydrate-to-fiber ratio of 10:1 or better. This indicates the food contains intact, whole grains and won't wildly spike your blood sugar.
              </p>
              <div className="flex items-center gap-2 text-xs font-bold bg-emerald-500/10 text-emerald-400 p-2 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" /> Good: 20g Carbs / 3g Fiber
              </div>
            </div>
          </div>
        </section>

        {/* Section 2.5: Marketing Buzzwords Decoded */}
        <section className="space-y-4">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-brand-primary" />
            Marketing Buzzwords Decoded
          </h2>
          <p className="text-sm text-content-secondary">
            Front-of-pack claims are legally regulated but often exploit loopholes. Here's what they actually mean:
          </p>

          <div className="space-y-3">
            {[
              {
                claim: "No Added Sugar",
                truth: "May still contain concentrated fruit juices (pure sugar), maltodextrin, or artificial sweeteners that disrupt gut health.",
                badge: "Sugar Trick"
              },
              {
                claim: "Made with Whole Grains",
                truth: "Usually contains 90% refined flour (Maida) and only 10% whole grains. Check the ingredients list to see which grain is listed first.",
                badge: "Fiber Trap"
              },
              {
                claim: "100% Natural",
                truth: "The term 'natural' has loose definitions. Poison ivy is natural, but you wouldn't eat it. It does not mean organic or pesticide-free.",
                badge: "Greenwashing"
              },
              {
                claim: "Fat Free / Low Fat",
                truth: "When manufacturers remove fat, they usually add massive amounts of sugar and starch to make the food taste good.",
                badge: "Taste Filler"
              }
            ].map((trick, index) => (
              <div key={index} className="glass-card rounded-2xl p-4 border border-white/5 bg-navy-800/30 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:border-white/10 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-brand-hazardous px-2 py-0.5 bg-brand-hazardous/10 rounded-lg">{trick.badge}</span>
                    <h3 className="font-bold text-white text-sm">"{trick.claim}"</h3>
                  </div>
                  <p className="text-xs text-content-secondary leading-relaxed">{trick.truth}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Traffic Light System */}
        <section className="space-y-4">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <Info className="w-5 h-5 text-amber-400" />
            The Traffic Light System
          </h2>
          <p className="text-sm text-content-secondary">
            Use this mental model when looking at the "Per 100g" column:
          </p>

          <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center gap-4">
               <div className="w-3 h-3 rounded-full bg-brand-safe shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
               <div>
                 <p className="font-bold text-white text-sm">Green (Low)</p>
                 <p className="text-xs text-content-secondary">Safe to consume regularly.</p>
               </div>
            </div>
            <div className="p-4 border-b border-white/5 flex items-center gap-4">
               <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
               <div>
                 <p className="font-bold text-white text-sm">Yellow (Medium)</p>
                 <p className="text-xs text-content-secondary">Consume in moderation.</p>
               </div>
            </div>
            <div className="p-4 flex items-center gap-4">
               <div className="w-3 h-3 rounded-full bg-brand-hazardous shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
               <div>
                 <p className="font-bold text-white text-sm">Red (High)</p>
                 <p className="text-xs text-content-secondary">Occasional treat only. High risk.</p>
               </div>
            </div>
          </div>
        </section>

        {/* Section 4: Allergens */}
        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-400" />
            Allergen Information
          </h2>
          <div className="glass-card rounded-2xl p-5 border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
            <p className="text-sm text-content-secondary leading-relaxed mb-4">
              Major allergens (Milk, Eggs, Fish, Crustacean shellfish, Tree nuts, Peanuts, Wheat, and Soy) must be explicitly declared on the packaging.
            </p>
            <p className="text-sm text-content-secondary leading-relaxed font-bold text-white">
              Beware of "May contain traces of..."
            </p>
            <p className="text-sm text-content-secondary leading-relaxed">
              This means the product is made in a facility that also processes those allergens, posing a cross-contamination risk for highly sensitive individuals.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
