import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Info, AlertTriangle, Scale } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';

const SALT_EXAMPLES = [
  {
    name: "Instant Noodles (1 Packet)",
    sodiumMg: 1800,
    teaspoons: 0.75,
    dailyValue: 78, // based on 2300mg limit
    color: "bg-amber-400",
    text: "text-amber-400",
    border: "border-amber-400/30"
  },
  {
    name: "Restaurant Soup (1 Bowl)",
    sodiumMg: 2500,
    teaspoons: 1.1,
    dailyValue: 108,
    color: "bg-brand-hazardous",
    text: "text-brand-hazardous",
    border: "border-brand-hazardous/30"
  },
  {
    name: "Canned Beans (Half Can)",
    sodiumMg: 600,
    teaspoons: 0.25,
    dailyValue: 26,
    color: "bg-orange-500",
    text: "text-orange-500",
    border: "border-orange-500/30"
  }
];

export function SaltBoard() {
  const navigate = useNavigate();
  const { scans } = useAppContext();
  const [activeTab, setActiveTab] = React.useState<'examples' | 'scans'>('examples');

  // 1 tsp salt = ~2300mg sodium
  const renderSaltPiles = (teaspoons: number, color: string) => {
    const fullPiles = Math.floor(teaspoons);
    const hasFraction = teaspoons % 1 !== 0;
    
    return (
      <div className="flex flex-wrap gap-4 mt-3">
        {Array.from({ length: fullPiles }).map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full shadow-lg ${color} opacity-80 blur-[2px]`} />
            <span className="text-[10px] text-content-secondary mt-1">1 tsp</span>
          </div>
        ))}
        {hasFraction && (
          <div className="flex flex-col items-center">
            <div className={`w-4 h-4 rounded-full shadow-lg ${color} opacity-80 blur-[1px]`} />
            <span className="text-[10px] text-content-secondary mt-1">
              {Math.round((teaspoons % 1) * 100)}% tsp
            </span>
          </div>
        )}
      </div>
    );
  };

  const scannedProductsWithSalt = React.useMemo(() => {
    const seen = new Set<string>();
    const list: any[] = [];
    scans.forEach(scan => {
      if (!scan.product) return;
      const product = scan.product;
      const key = `${product.name}-${product.brand}`;
      if (seen.has(key)) return;
      seen.add(key);

      const sodiumMg = product.normalizedNutrients?.sodium ?? product.nutrients?.sodium ?? 0;
      if (sodiumMg > 0) {
        const teaspoons = Number((sodiumMg / 2300).toFixed(2));
        list.push({
          name: `${product.name} (${product.brand})`,
          sodiumMg: sodiumMg,
          teaspoons: teaspoons,
          dailyValue: Math.round((sodiumMg / 1500) * 100), // based on 1500mg daily ideal
          color: sodiumMg > 1000 ? 'bg-brand-hazardous' : sodiumMg > 400 ? 'bg-orange-500' : 'bg-brand-safe',
          text: sodiumMg > 1000 ? 'text-brand-hazardous' : sodiumMg > 400 ? 'text-orange-500' : 'text-brand-safe',
          border: sodiumMg > 1000 ? 'border-brand-hazardous/30' : sodiumMg > 400 ? 'border-orange-500/30' : 'border-brand-safe/30'
        });
      }
    });
    return list;
  }, [scans]);

  const displayedItems = activeTab === 'examples' ? SALT_EXAMPLES : scannedProductsWithSalt;

  return (
    <div className="flex flex-col h-full bg-navy-900 relative overflow-y-auto no-scrollbar pb-24">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-gradient-to-b from-amber-400/10 to-transparent pointer-events-none" />
      
      <header className="pt-safe pt-6 px-4 pb-4 flex flex-col relative z-10 md:max-w-3xl md:mx-auto md:w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button data-testid='btn-saltboard-1'
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-content-secondary hover:text-white rounded-xl bg-white/5 border border-white/5 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="font-display font-black text-lg ml-3 text-white">Salt Board</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center border border-amber-400/30">
            <Scale className="w-5 h-5 text-amber-400" />
          </div>
        </div>
        <div className="mt-4 glass-card rounded-2xl p-4 border border-amber-400/30 bg-amber-400/5 flex gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-bold text-amber-400 text-sm mb-1">AHA Recommendation</h2>
            <p className="text-xs text-content-secondary">
              The ideal limit is <strong className="text-white">1,500mg</strong> of sodium per day for most adults, with a strict absolute maximum of <strong className="text-white">2,300mg</strong> (about 1 teaspoon of salt).
            </p>
          </div>
        </div>
      </header>

      {/* Tabs Selector */}
      <div className="px-4 mb-4 md:max-w-3xl md:mx-auto md:w-full relative z-10">
        <div className="flex bg-navy-800 p-1 rounded-xl border border-white/5">
          <button data-testid='btn-saltboard-2'
            onClick={() => setActiveTab('examples')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'examples' ? 'bg-brand-primary text-white' : 'text-content-secondary hover:text-white'}`}
          >
            Standard Examples
          </button>
          <button data-testid='btn-saltboard-3'
            onClick={() => setActiveTab('scans')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'scans' ? 'bg-brand-primary text-white' : 'text-content-secondary hover:text-white'}`}
          >
            My Scans ({scannedProductsWithSalt.length})
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 mt-2 space-y-6 md:max-w-3xl md:mx-auto md:w-full relative z-10">
        
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-content-secondary" />
          <span className="text-xs font-bold text-content-secondary uppercase tracking-widest">1 Teaspoon Salt = 2,300mg Sodium</span>
        </div>

        {activeTab === 'scans' && scannedProductsWithSalt.length === 0 ? (
          <div className="glass-card rounded-3xl p-8 border border-white/5 text-center flex flex-col items-center justify-center">
            <Scale className="w-12 h-12 text-content-secondary mb-3 opacity-50" />
            <h3 className="font-bold text-white mb-1">No Salt Scans Yet</h3>
            <p className="text-xs text-content-secondary max-w-xs mb-4">
              None of your scanned products have recorded sodium contents, or you haven't scanned anything yet.
            </p>
            <button data-testid='btn-saltboard-4'
              onClick={() => navigate('/scan')}
              className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-xs py-2 px-4 rounded-xl transition-colors">
              Scan a Product
            </button>
          </div>
        ) : (
          displayedItems.map((item, idx) => (
            <div data-testid={`card-salt-${idx}`} key={idx} className={`glass-card rounded-3xl p-5 border ${item.border} relative overflow-hidden`}>
              <div className={`absolute -right-10 -top-10 w-40 h-40 ${item.color} opacity-10 rounded-full blur-3xl`} />
              
              <h3 className="font-display font-black text-xl text-white mb-4 relative z-10">{item.name}</h3>
              
              <div className="grid grid-cols-3 gap-3 mb-4 relative z-10">
                <div className="bg-navy-800 rounded-xl p-3 border border-white/5 flex flex-col items-center text-center">
                  <span className="text-[10px] text-content-secondary uppercase font-bold tracking-wider mb-1">Sodium</span>
                  <span className={`font-black text-lg ${item.text}`}>{item.sodiumMg}mg</span>
                </div>
                <div className="bg-navy-800 rounded-xl p-3 border border-white/5 flex flex-col items-center text-center">
                  <span className="text-[10px] text-content-secondary uppercase font-bold tracking-wider mb-1">Teaspoons</span>
                  <span className={`font-black text-lg ${item.text}`}>{item.teaspoons}</span>
                </div>
                <div className="bg-navy-800 rounded-xl p-3 border border-white/5 flex flex-col items-center text-center relative overflow-hidden">
                  <div className={`absolute bottom-0 left-0 w-full ${item.color} opacity-20`} style={{ height: `${Math.min(item.dailyValue, 100)}%` }} />
                  <span className="text-[10px] text-content-secondary uppercase font-bold tracking-wider mb-1 relative z-10">Daily Limit</span>
                  <span className={`font-black text-lg ${item.text} relative z-10`}>{item.dailyValue}%</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 relative z-10">
                <span className="text-xs font-bold text-white mb-2 block">Visual Salt Equivalent (Teaspoons):</span>
                {renderSaltPiles(item.teaspoons, item.color)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
