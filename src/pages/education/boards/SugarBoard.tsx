import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Info, AlertTriangle, Droplets } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';

const SUGAR_EXAMPLES = [
  {
    name: "Standard Cola (500ml)",
    sugarGrams: 54,
    cubes: 13.5,
    teaspoons: 13.5,
    dailyValue: 216, // based on 25g limit
    color: "bg-brand-hazardous",
    text: "text-brand-hazardous",
    border: "border-brand-hazardous/30"
  },
  {
    name: "Fruit Juice Box (200ml)",
    sugarGrams: 24,
    cubes: 6,
    teaspoons: 6,
    dailyValue: 96,
    color: "bg-orange-500",
    text: "text-orange-500",
    border: "border-orange-500/30"
  },
  {
    name: "Kids 'Health' Drink Powder (Per serve)",
    sugarGrams: 15,
    cubes: 3.75,
    teaspoons: 3.75,
    dailyValue: 60,
    color: "bg-amber-400",
    text: "text-amber-400",
    border: "border-amber-400/30"
  }
];

export function SugarBoard() {
  const navigate = useNavigate();
  const { scans } = useAppContext();
  const [activeTab, setActiveTab] = React.useState<'examples' | 'scans'>('examples');

  // 1 sugar cube = ~4g sugar
  const renderCubes = (count: number, color: string) => {
    const fullCubes = Math.floor(count);
    const hasHalf = count % 1 !== 0;
    
    return (
      <div className="flex flex-wrap gap-1 mt-3">
        {Array.from({ length: fullCubes }).map((_, i) => (
          <div key={i} className={`w-6 h-6 rounded-sm shadow-md ${color} opacity-90 border border-white/20`} />
        ))}
        {hasHalf && (
          <div className={`w-3 h-6 rounded-l-sm shadow-md ${color} opacity-90 border border-white/20`} />
        )}
      </div>
    );
  };

  const scannedProductsWithSugar = React.useMemo(() => {
    const seen = new Set<string>();
    const list: any[] = [];
    scans.forEach(scan => {
      if (!scan.product) return;
      const product = scan.product;
      const key = `${product.name}-${product.brand}`;
      if (seen.has(key)) return;
      seen.add(key);

      const sugarGrams = product.normalizedNutrients?.sugar ?? product.nutrients?.sugar ?? 0;
      if (sugarGrams > 0) {
        list.push({
          name: `${product.name} (${product.brand})`,
          sugarGrams: sugarGrams,
          cubes: sugarGrams / 4,
          teaspoons: sugarGrams / 4,
          dailyValue: Math.round((sugarGrams / 25) * 100),
          color: sugarGrams > 15 ? 'bg-brand-hazardous' : sugarGrams > 5 ? 'bg-orange-500' : 'bg-brand-safe',
          text: sugarGrams > 15 ? 'text-brand-hazardous' : sugarGrams > 5 ? 'text-orange-500' : 'text-brand-safe',
          border: sugarGrams > 15 ? 'border-brand-hazardous/30' : sugarGrams > 5 ? 'border-orange-500/30' : 'border-brand-safe/30'
        });
      }
    });
    return list;
  }, [scans]);

  const displayedItems = activeTab === 'examples' ? SUGAR_EXAMPLES : scannedProductsWithSugar;

  return (
    <div className="flex flex-col h-full bg-navy-900 relative overflow-y-auto no-scrollbar pb-24">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-gradient-to-b from-brand-hazardous/10 to-transparent pointer-events-none" />
      
      <header className="pt-safe pt-6 px-4 pb-4 flex flex-col relative z-10 md:max-w-3xl md:mx-auto md:w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-content-secondary hover:text-white rounded-xl bg-white/5 border border-white/5 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="font-display font-black text-lg ml-3 text-white">Sugar Board</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand-hazardous/10 flex items-center justify-center border border-brand-hazardous/30">
            <Droplets className="w-5 h-5 text-brand-hazardous" />
          </div>
        </div>
        <div className="mt-4 glass-card rounded-2xl p-4 border border-brand-hazardous/30 bg-brand-hazardous/5 flex gap-3">
          <AlertTriangle className="w-6 h-6 text-brand-hazardous shrink-0 mt-0.5" />
          <div>
            <h2 className="font-bold text-brand-hazardous text-sm mb-1">AHA Recommendation</h2>
            <p className="text-xs text-content-secondary">
              The American Heart Association recommends a strict limit of <strong className="text-white">25g</strong> (about 6 teaspoons) of added sugar per day for women and children, and <strong className="text-white">36g</strong> for men.
            </p>
          </div>
        </div>
      </header>

      {/* Tabs Selector */}
      <div className="px-4 mb-4 md:max-w-3xl md:mx-auto md:w-full relative z-10">
        <div className="flex bg-navy-800 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('examples')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'examples' ? 'bg-brand-primary text-white' : 'text-content-secondary hover:text-white'}`}
          >
            Standard Examples
          </button>
          <button
            onClick={() => setActiveTab('scans')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'scans' ? 'bg-brand-primary text-white' : 'text-content-secondary hover:text-white'}`}
          >
            My Scans ({scannedProductsWithSugar.length})
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 mt-2 space-y-6 md:max-w-3xl md:mx-auto md:w-full relative z-10">
        
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-content-secondary" />
          <span className="text-xs font-bold text-content-secondary uppercase tracking-widest">1 Cube = 4g Sugar = 1 Teaspoon</span>
        </div>

        {activeTab === 'scans' && scannedProductsWithSugar.length === 0 ? (
          <div className="glass-card rounded-3xl p-8 border border-white/5 text-center flex flex-col items-center justify-center">
            <Droplets className="w-12 h-12 text-content-secondary mb-3 opacity-50" />
            <h3 className="font-bold text-white mb-1">No Sugar Scans Yet</h3>
            <p className="text-xs text-content-secondary max-w-xs mb-4">
              None of your scanned products have recorded sugar contents, or you haven't scanned anything yet.
            </p>
            <button
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
              
              <div className="grid grid-cols-3 gap-3 mb-4 relative z-10">
                <div className="bg-navy-800 rounded-xl p-3 border border-white/5 flex flex-col items-center text-center">
                  <span className="text-[10px] text-content-secondary uppercase font-bold tracking-wider mb-1">Weight</span>
                  <span className={`font-black text-lg ${item.text}`}>{item.sugarGrams}g</span>
                </div>
                <div className="bg-navy-800 rounded-xl p-3 border border-white/5 flex flex-col items-center text-center">
                  <span className="text-[10px] text-content-secondary uppercase font-bold tracking-wider mb-1">Teaspoons</span>
                  <span className={`font-black text-lg ${item.text}`}>{item.teaspoons} tsp</span>
                </div>
                <div className="bg-navy-800 rounded-xl p-3 border border-white/5 flex flex-col items-center text-center relative overflow-hidden">
                  <div className={`absolute bottom-0 left-0 w-full ${item.color} opacity-20`} style={{ height: `${Math.min(item.dailyValue, 100)}%` }} />
                  <span className="text-[10px] text-content-secondary uppercase font-bold tracking-wider mb-1 relative z-10">Daily Limit</span>
                  <span className={`font-black text-lg ${item.text} relative z-10`}>{item.dailyValue}%</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 relative z-10">
                <span className="text-xs font-bold text-white mb-2 block">Visual Sugar Equivalent:</span>
                {renderCubes(item.cubes, item.color)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
