import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Box, LayoutPanelLeft, ListTree, PackageCheck, AlertOctagon } from 'lucide-react';

export function PackagingGuide() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-navy-900 relative overflow-y-auto no-scrollbar pb-24">
      {/* Ambient backgrounds */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-gradient-to-b from-brand-secondary/10 to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-brand-secondary/20 rounded-full blur-[100px] pointer-events-none" />

      <header className="pt-safe pt-6 px-4 pb-4 flex flex-col relative z-10 md:max-w-3xl md:mx-auto md:w-full">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-content-secondary hover:text-white rounded-xl bg-white/5 border border-white/5 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-black text-lg ml-3 text-white">Honest Packaging</h1>
        </div>
        <p className="mt-4 text-content-secondary text-sm">
          A guide for brands and creators on how to design transparent, honest labels without resorting to misleading marketing.
        </p>
      </header>

      <div className="flex-1 px-4 space-y-6 md:max-w-3xl md:mx-auto md:w-full relative z-10">

        {/* Section 1: Front of Pack */}
        <section className="space-y-4">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <LayoutPanelLeft className="w-5 h-5 text-brand-secondary" />
            Front of Pack (FOP)
          </h2>

          <div className="glass-card rounded-2xl p-5 border border-white/5">
            <p className="text-sm text-content-secondary mb-4">
              The front of your package is your first impression. It must be honest and compliant with standard regulations (like FSSAI/FDA).
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm mb-1">True Product Name</h3>
                  <p className="text-xs text-content-secondary">If it's mostly sugar and cocoa substitute, call it a "Chocolate Flavored Sugar Beverage," not just "Chocolate Drink."</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm mb-1">Honest Imagery</h3>
                  <p className="text-xs text-content-secondary">Don't show giant fresh strawberries on the front if the product only contains 0.1% strawberry extract.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm mb-1">Net Quantity</h3>
                  <p className="text-xs text-content-secondary">Must be clearly visible in metric units (grams, milliliters) on the principal display panel.</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* Section 2: Back of Pack */}
        <section className="space-y-4">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <ListTree className="w-5 h-5 text-brand-primary" />
            Back of Pack (BOP)
          </h2>

          <div className="glass-card rounded-2xl p-5 border border-white/5 bg-navy-800/50">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-bold text-white text-sm mb-2 border-b border-white/10 pb-2">Mandatory Elements</h3>
                <ul className="text-sm text-content-secondary space-y-2 list-disc pl-4">
                  <li>Full Ingredients List (by weight)</li>
                  <li>Nutrition Facts Table (per 100g)</li>
                  <li>Allergen Declaration</li>
                  <li>Manufacturing Date & Expiry</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm mb-2 border-b border-white/10 pb-2">Transparency Tips</h3>
                <ul className="text-sm text-content-secondary space-y-2 list-disc pl-4">
                  <li>Use a legible font size (min 1.5mm height).</li>
                  <li>Group multi-part ingredients in brackets.</li>
                  <li>Don't hide sugar behind 5 different chemical names.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Good vs Bad */}
        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <Box className="w-5 h-5 text-amber-400" />
            Good vs. Misleading
          </h2>
          
          <div className="grid gap-4">
            <div className="glass-card rounded-2xl p-4 border border-brand-hazardous/30 bg-brand-hazardous/5 flex gap-4">
              <div className="mt-1">
                <AlertOctagon className="w-6 h-6 text-brand-hazardous" />
              </div>
              <div>
                <h3 className="font-bold text-brand-hazardous text-sm mb-1">Misleading (The "Health Wash")</h3>
                <p className="text-xs text-content-secondary">
                  A front label screaming <strong className="text-white">"100% NATURAL & SUGAR-FREE"</strong> while the back reveals it contains Maltodextrin and Sucralose. This destroys consumer trust instantly when discovered.
                </p>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-brand-safe/30 bg-brand-safe/5 flex gap-4">
              <div className="mt-1">
                <PackageCheck className="w-6 h-6 text-brand-safe" />
              </div>
              <div>
                <h3 className="font-bold text-brand-safe text-sm mb-1">Honest (The Gold Standard)</h3>
                <p className="text-xs text-content-secondary">
                  A front label stating exactly what it is. The back features a short, clean ingredient list. If it has sugar, the brand owns it and displays exactly how much added sugar is present. Trust is built.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Transparency Checklist */}
        <section className="space-y-4 mb-8">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-brand-safe" />
            The Transparency Checklist
          </h2>
          <p className="text-sm text-content-secondary">
            If you are a brand owner or product creator, score your packaging against this checklist to ensure absolute integrity:
          </p>

          <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
            {[
              { title: "No Split Sugars", desc: "List total sugars together so consumers know the exact total weight without doing math." },
              { title: "Zero False Front Branding", desc: "If the product contains artificial strawberry flavor, the front clearly declares 'Artificial Flavor' in a readable font size." },
              { title: "Clean E-Numbers", desc: "Write the common name of additives (e.g., 'INS 150d Caramel Color') rather than just obscure codes." },
              { title: "Standardized Serving Sizes", desc: "Provide nutrition details based on actual normal consumption (e.g. per 100g or 1 pack) rather than artificially tiny servings." },
              { title: "Accurate Source Claims", desc: "Never claim 'Source of Protein' or 'High Fiber' unless the product meets the minimum statutory threshold (e.g. 6g protein per 100g)." }
            ].map((item, index) => (
              <div key={index} className="p-4 border-b last:border-0 border-white/5 flex items-start gap-3 bg-navy-800/20">
                <div className="w-5 h-5 rounded-md bg-brand-safe/10 border border-brand-safe/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-brand-safe">✓</span>
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{item.title}</p>
                  <p className="text-xs text-content-secondary leading-relaxed mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
