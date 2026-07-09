import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Info, AlertTriangle, Droplet } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';

const FAT_EXAMPLES = [
  {
    name: "Fast Food Burger & Fries",
    saturatedFatGrams: 20,
    dailyValue: 154, // based on 13g limit
    color: "bg-brand-hazardous",
    text: "text-brand-hazardous",
    border: "border-brand-hazardous/30"
  },
  {
    name: "Packaged Butter Cookies",
    saturatedFatGrams: 12,
    dailyValue: 92,
    color: "bg-orange-500",
    text: "text-orange-500",
    border: "border-orange-500/30"
  },
  {
    name: "Avocado Toast (Healthy Fat)",
    saturatedFatGrams: 3, // mostly unsaturated
    dailyValue: 23,
    color: "bg-brand-safe",
    text: "text-brand-safe",
    border: "border-brand-safe/30"
  }
];

export function FatBoard() {
  const navigate = useNavigate();
  const { scans } = useAppContext();
  const [activeTab, setActiveTab] = React.useState<'examples' | 'scans'>('examples');

  // 1 pat of butter = ~5g saturated fat
  const renderPats = (grams: number, color: string) => {
    const pats = Math.ceil(grams / 5);
    
    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {Array.from({ length: pats }).map((_, i) => (
          <div key={i} className={`w-8 h-6 rounded-sm shadow-md ${color} opacity-90 border border-white/20 flex items-center justify-center`}>
             <div className="w-full h-px bg-white/30" />
          </div>
        ))}
      </div>
    );
  };

  const scannedProductsWithFat = React.useMemo(() => {
    const seen = new Set<string>();
    const list: any[] = [];
    scans.forEach(scan => {
      if (!scan.product) return;
      const product = scan.product;
      const key = `${product.name}-${product.brand}`;
      if (seen.has(key)) return;
      seen.add(key);

      const satFat = product.normalizedNutrients?.satFat ?? product.nutrients?.satFat ?? 0;
      if (satFat > 0) {
        list.push({
          name: `${product.name} (${product.brand})`,
          saturatedFatGrams: satFat,
          dailyValue: Math.round((satFat / 13) * 100), // based on AHA 13g limit for 2000kcal diet
          color: satFat > 7 ? 'bg-brand-hazardous' : satFat > 3 ? 'bg-orange-500' : 'bg-brand-safe',
          text: satFat > 7 ? 'text-brand-hazardous' : satFat > 3 ? 'text-orange-500' : 'text-brand-safe',
          border: satFat > 7 ? 'border-brand-hazardous/30' : satFat > 3 ? 'border-orange-500/30' : 'border-brand-safe/30'
        });
      }
    });
    return list;
  }, [scans]);

  const displayedItems = activeTab === 'examples' ? FAT_EXAMPLES : scannedProductsWithFat;

  return (
    <div className="flex flex-col h-full bg-navy-900 relative overflow-y-auto no-scrollbar pb-24">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none" />
      
      <header className="pt-safe pt-6 px-4 pb-4 flex flex-col relative z-10 md:max-w-3xl md:mx-auto md:w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button data-testid='btn-fatboard-1'
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-content-secondary hover:text-white rounded-xl bg-white/5 border border-white/5 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="font-display font-black text-lg ml-3 text-white">Fat & Oil Board</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/30">
            <Droplet className="w-5 h-5 text-orange-500" />
          </div>
        </div>
        <div className="mt-4 glass-card rounded-2xl p-4 border border-orange-500/30 bg-orange-500/5 flex gap-3">
          <AlertTriangle className="w-6 h-6 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-bold text-orange-500 text-sm mb-1">AHA Saturated Fat Limit</h2>
            <p className="text-xs text-content-secondary">
              The American Heart Association recommends aiming for a dietary pattern that achieves 5% to 6% of calories from saturated fat. For a 2,000 calorie diet, that is about <strong className="text-white">13 grams</strong> a day.
            </p>
          </div>
        </div>
      </header>

      {/* Tabs Selector */}
      <div className="px-4 mb-4 md:max-w-3xl md:mx-auto md:w-full relative z-10">
        <div className="flex bg-navy-800 p-1 rounded-xl border border-white/5">
          <button data-testid='btn-fatboard-2'
            onClick={() => setActiveTab('examples')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'examples' ? 'bg-brand-primary text-white' : 'text-content-secondary hover:text-white'}`}
          >
            Standard Examples
          </button>
          <button data-testid='btn-fatboard-3'
            onClick={() => setActiveTab('scans')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'scans' ? 'bg-brand-primary text-white' : 'text-content-secondary hover:text-white'}`}
          >
            My Scans ({scannedProductsWithFat.length})
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 mt-2 space-y-6 md:max-w-3xl md:mx-auto md:w-full relative z-10">
        
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-content-secondary" />
          <span className="text-xs font-bold text-content-secondary uppercase tracking-widest">1 Butter Pat = ~5g Saturated Fat</span>
        </div>

        {activeTab === 'scans' && scannedProductsWithFat.length === 0 ? (
          <div className="glass-card rounded-3xl p-8 border border-white/5 text-center flex flex-col items-center justify-center">
            <Droplet className="w-12 h-12 text-content-secondary mb-3 opacity-50" />
            <h3 className="font-bold text-white mb-1">No Fat Scans Yet</h3>
            <p className="text-xs text-content-secondary max-w-xs mb-4">
              None of your scanned products have recorded saturated fat contents, or you haven't scanned anything yet.
            </p>
            <button data-testid='btn-fatboard-4'
              onClick={() => navigate('/scan')}
              className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-xs py-2 px-4 rounded-xl transition-colors">
              Scan a Product
            </button>
          </div>
        ) : (
          displayedItems.map((item, idx) => (
            <div key={idx} className={`glass-card rounded-3xl p-5 border ${item.border} relative overflow-hidden`}>
              <div className={`absolute -right-10 -top-10 w-40 h-40 ${item.color} opacity-10 rounded-full blur-3xl`} />
              
              <h3 className="font-display font-black text-xl text-white mb-4 relative z-10">{item.name}</h3>
              
              <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
                <div className="bg-navy-800 rounded-xl p-3 border border-white/5 flex flex-col items-center text-center">
                  <span className="text-[10px] text-content-secondary uppercase font-bold tracking-wider mb-1">Saturated Fat</span>
                  <span className={`font-black text-lg ${item.text}`}>{item.saturatedFatGrams}g</span>
                </div>
                <div className="bg-navy-800 rounded-xl p-3 border border-white/5 flex flex-col items-center text-center relative overflow-hidden">
                  <div className={`absolute bottom-0 left-0 w-full ${item.color} opacity-20`} style={{ height: `${Math.min(item.dailyValue, 100)}%` }} />
                  <span className="text-[10px] text-content-secondary uppercase font-bold tracking-wider mb-1 relative z-10">Daily Limit (13g)</span>
                  <span className={`font-black text-lg ${item.text} relative z-10`}>{item.dailyValue}%</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 relative z-10">
                <span className="text-xs font-bold text-white mb-2 block">Visual Equivalent (Butter Pats):</span>
                {renderPats(item.saturatedFatGrams, item.color)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
