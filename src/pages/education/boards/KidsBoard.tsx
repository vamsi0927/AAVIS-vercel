import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Baby, AlertTriangle, Scale, Droplets } from 'lucide-react';

const KIDS_PRODUCTS = [
  {
    category: "Children's Health Drinks",
    examples: "Malted Milk Powders, Protein Powders for Kids",
    reality: "Most of these 'health' drinks contain 40% to 50% sugar. They are effectively chocolate-flavored sugar with a tiny dusting of synthetic vitamins. Giving a child this is no different than giving them liquid candy for breakfast.",
    dangerLevel: "Extreme",
    color: "bg-brand-hazardous",
    text: "text-brand-hazardous",
    border: "border-brand-hazardous/30"
  },
  {
    category: "Breakfast Cereals",
    examples: "Choco Loops, Honey Rings, Frosted Flakes",
    reality: "Marketed with cartoon characters, these are ultra-processed refined grains coated in sugar. They cause a massive insulin spike, leading to a sugar crash and poor focus in school a few hours later.",
    dangerLevel: "High",
    color: "bg-orange-500",
    text: "text-orange-500",
    border: "border-orange-500/30"
  },
  {
    category: "Packaged Fruit Juices",
    examples: "Apple Juice Boxes, Mixed Fruit Nectars",
    reality: "Often perceived as healthy because they contain 'fruit'. But the fiber has been entirely removed, leaving only the sugar (fructose) which hits the liver as hard as a can of soda.",
    dangerLevel: "High",
    color: "bg-orange-500",
    text: "text-orange-500",
    border: "border-orange-500/30"
  },
  {
    category: "Kids' Yogurt Cups",
    examples: "Flavored Yogurt, Yogurt Tubes",
    reality: "While plain yogurt is healthy, the flavored versions marketed to children can contain as much added sugar as a serving of ice cream. Always buy plain and add your own fruit.",
    dangerLevel: "Medium",
    color: "bg-amber-400",
    text: "text-amber-400",
    border: "border-amber-400/30"
  }
];

export function KidsBoard() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-navy-900 relative overflow-y-auto no-scrollbar pb-24">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-gradient-to-b from-brand-safe/10 to-transparent pointer-events-none" />
      
      <header className="pt-safe pt-6 px-4 pb-4 flex flex-col relative z-10 md:max-w-3xl md:mx-auto md:w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button data-testid='btn-kidsboard-1'
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-content-secondary hover:text-white rounded-xl bg-white/5 border border-white/5 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="font-display font-black text-lg ml-3 text-white">Kids Products Board</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand-safe/10 flex items-center justify-center border border-brand-safe/30">
            <Baby className="w-5 h-5 text-brand-safe" />
          </div>
        </div>
        <div className="mt-4 glass-card rounded-2xl p-4 border border-brand-hazardous/30 bg-brand-hazardous/5 flex gap-3">
          <AlertTriangle className="w-6 h-6 text-brand-hazardous shrink-0 mt-0.5" />
          <div>
            <h2 className="font-bold text-brand-hazardous text-sm mb-1">The Predatory Marketing</h2>
            <p className="text-xs text-content-secondary">
              Products explicitly marketed to children are historically the <strong className="text-white">most unhealthful</strong> items in the supermarket. They combine bright colors, cartoon mascots, and massive amounts of sugar to hijack a child's developing reward system.
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 mt-2 space-y-6 md:max-w-3xl md:mx-auto md:w-full relative z-10">
        
        {KIDS_PRODUCTS.map((item, idx) => (
          <div key={idx} className={`glass-card rounded-3xl p-5 border ${item.border} relative overflow-hidden`}>
            <div className={`absolute -right-10 -top-10 w-40 h-40 ${item.color} opacity-10 rounded-full blur-3xl`} />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="font-display font-black text-xl text-white max-w-[70%]">{item.category}</h3>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md bg-white/5 ${item.text} border ${item.border}`}>
                Danger: {item.dangerLevel}
              </span>
            </div>
            
            <div className="space-y-4 relative z-10">
              <div className="bg-navy-800 rounded-xl p-3 border border-white/5">
                <span className="text-[10px] text-content-secondary uppercase font-bold tracking-wider mb-1 block">Examples</span>
                <span className="font-medium text-sm text-white">{item.examples}</span>
              </div>
              
              <div className="bg-navy-800 rounded-xl p-4 border border-brand-hazardous/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-hazardous/10 rounded-full blur-xl" />
                <span className="text-[10px] text-brand-hazardous uppercase font-bold tracking-wider mb-2 block flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> The Reality
                </span>
                <span className="text-sm text-content-secondary leading-relaxed block relative z-10">{item.reality}</span>
              </div>
            </div>
          </div>
        ))}

        <div className="glass-card rounded-3xl p-5 border border-brand-safe/30 mt-8 text-center bg-gradient-to-b from-brand-safe/5 to-transparent">
          <Scale className="w-8 h-8 text-brand-safe mx-auto mb-3" />
          <h3 className="font-bold text-white text-lg mb-2">The Golden Rule for Kids</h3>
          <p className="text-sm text-content-secondary leading-relaxed">
            If a product needs a cartoon character on the box to convince a child to eat it, it is almost certainly ultra-processed. Real food doesn't need mascots.
          </p>
        </div>

      </div>
    </div>
  );
}
