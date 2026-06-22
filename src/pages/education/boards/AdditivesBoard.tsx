import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Beaker, AlertOctagon, Info } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';

const ADDITIVE_EXAMPLES = [
  {
    name: "Artificial Colors (Red 40, Yellow 5)",
    foundIn: "Candy, Kids' Cereal, Sports Drinks",
    purpose: "To make dead, highly processed food look fresh and appealing to children.",
    riskLevel: "High",
    details: "Linked to hyperactivity in children. Banned or heavily restricted in many European countries, but still widely used in the US.",
    color: "bg-brand-hazardous",
    text: "text-brand-hazardous",
    border: "border-brand-hazardous/30"
  },
  {
    name: "Monosodium Glutamate (MSG)",
    foundIn: "Chips, Fast Food, Canned Soups",
    purpose: "A flavor enhancer that hacks your brain into thinking the food is savory and delicious.",
    riskLevel: "Medium",
    details: "While officially 'generally recognized as safe', it is specifically designed to make foods hyper-palatable so you cannot stop eating them.",
    color: "bg-amber-400",
    text: "text-amber-400",
    border: "border-amber-400/30"
  },
  {
    name: "Sodium Nitrite",
    foundIn: "Hot Dogs, Bacon, Deli Meats",
    purpose: "Prevents bacterial growth and keeps meat looking pink instead of grey.",
    riskLevel: "High",
    details: "When cooked at high temperatures, it can form nitrosamines, which are known carcinogens. Classified by the WHO as a Group 1 carcinogen.",
    color: "bg-brand-hazardous",
    text: "text-brand-hazardous",
    border: "border-brand-hazardous/30"
  },
  {
    name: "TBHQ",
    foundIn: "Microwave Popcorn, Crackers, Fast Food",
    purpose: "A synthetic preservative that extends shelf life for months or years.",
    riskLevel: "Medium",
    details: "A petroleum derivative. In very high doses, it has caused tumors in lab animals. It ensures the food never rots on the shelf.",
    color: "bg-orange-500",
    text: "text-orange-500",
    border: "border-orange-500/30"
  }
];

export function AdditivesBoard() {
  const navigate = useNavigate();
  const { scans } = useAppContext();
  const [activeTab, setActiveTab] = React.useState<'examples' | 'scans'>('examples');

  const scannedProductsWithAdditives = React.useMemo(() => {
    const seen = new Set<string>();
    const list: any[] = [];
    scans.forEach(scan => {
      if (!scan.product) return;
      const product = scan.product;
      const key = `${product.name}-${product.brand}`;
      if (seen.has(key)) return;
      seen.add(key);

      const hasAdditives = product.additives && product.additives.length > 0;
      if (hasAdditives) {
        list.push({
          name: `${product.name} (${product.brand})`,
          additivesCount: product.additives.length,
          additivesList: product.additives,
          details: product.additives.join(', '),
          riskLevel: product.additives.length > 3 ? 'High' : 'Medium',
          color: product.additives.length > 3 ? 'bg-brand-hazardous' : 'bg-amber-400',
          text: product.additives.length > 3 ? 'text-brand-hazardous' : 'text-amber-400',
          border: product.additives.length > 3 ? 'border-brand-hazardous/30' : 'border-amber-400/30'
        });
      }
    });
    return list;
  }, [scans]);

  return (
    <div className="flex flex-col h-full bg-navy-900 relative overflow-y-auto no-scrollbar pb-24">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />
      
      <header className="pt-safe pt-6 px-4 pb-4 flex flex-col relative z-10 md:max-w-3xl md:mx-auto md:w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-content-secondary hover:text-white rounded-xl bg-white/5 border border-white/5 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="font-display font-black text-lg ml-3 text-white">Additives Board</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/30">
            <Beaker className="w-5 h-5 text-purple-400" />
          </div>
        </div>
        <div className="mt-4 glass-card rounded-2xl p-4 border border-purple-500/30 bg-purple-500/5 flex gap-3">
          <AlertOctagon className="w-6 h-6 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-bold text-purple-400 text-sm mb-1">The Chemical Cocktail</h2>
            <p className="text-xs text-content-secondary">
              Ultra-processed foods rely on a massive array of industrial chemicals to create flavor, texture, and indefinite shelf-life. If you cannot pronounce it, your body probably doesn't want it.
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
            My Scans ({scannedProductsWithAdditives.length})
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 mt-2 space-y-6 md:max-w-3xl md:mx-auto md:w-full relative z-10">
        
        {activeTab === 'scans' && scannedProductsWithAdditives.length === 0 ? (
          <div className="glass-card rounded-3xl p-8 border border-white/5 text-center flex flex-col items-center justify-center">
            <Beaker className="w-12 h-12 text-content-secondary mb-3 opacity-50" />
            <h3 className="font-bold text-white mb-1">No Additive Scans Yet</h3>
            <p className="text-xs text-content-secondary max-w-xs mb-4">
              None of your scanned products have recorded additives, or you haven't scanned anything yet.
            </p>
            <button
              onClick={() => navigate('/scan')}
              className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-xs py-2 px-4 rounded-xl transition-colors">
              Scan a Product
            </button>
          </div>
        ) : activeTab === 'examples' ? (
          ADDITIVE_EXAMPLES.map((item, idx) => (
            <div key={idx} className={`glass-card rounded-3xl p-5 border ${item.border} relative overflow-hidden`}>
              <div className={`absolute -right-10 -top-10 w-40 h-40 ${item.color} opacity-10 rounded-full blur-3xl`} />
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <h3 className="font-display font-black text-xl text-white max-w-[70%]">{item.name}</h3>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md bg-white/5 ${item.text} border ${item.border}`}>
                  Risk: {item.riskLevel}
                </span>
              </div>
              
              <div className="space-y-4 relative z-10">
                <div className="bg-navy-800 rounded-xl p-3 border border-white/5">
                  <span className="text-[10px] text-content-secondary uppercase font-bold tracking-wider mb-1 block">Found In</span>
                  <span className="font-medium text-sm text-white">{item.foundIn}</span>
                </div>
                
                <div className="bg-navy-800 rounded-xl p-3 border border-white/5">
                  <span className="text-[10px] text-content-secondary uppercase font-bold tracking-wider mb-1 block">Industrial Purpose</span>
                  <span className="text-sm text-content-secondary">{item.purpose}</span>
                </div>

                <div className="flex gap-3 mt-4 pt-4 border-t border-white/5">
                  <Info className={`w-5 h-5 ${item.text} shrink-0 mt-0.5`} />
                  <p className="text-xs text-content-secondary leading-relaxed">
                    {item.details}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          scannedProductsWithAdditives.map((item, idx) => (
            <div key={idx} className={`glass-card rounded-3xl p-5 border ${item.border} relative overflow-hidden`}>
              <div className={`absolute -right-10 -top-10 w-40 h-40 ${item.color} opacity-10 rounded-full blur-3xl`} />
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <h3 className="font-display font-black text-xl text-white max-w-[70%]">{item.name}</h3>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md bg-white/5 ${item.text} border ${item.border}`}>
                  Additives: {item.additivesCount}
                </span>
              </div>
              
              <div className="space-y-4 relative z-10">
                <div className="bg-navy-800 rounded-xl p-3 border border-white/5">
                  <span className="text-[10px] text-content-secondary uppercase font-bold tracking-wider mb-1 block">Detected Additives</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {item.additivesList.map((add: string, i: number) => (
                      <span key={i} className="text-xs bg-navy-900 border border-white/10 px-2 py-0.5 rounded text-white font-mono">
                        {add}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-3 mt-4 pt-4 border-t border-white/5">
                  <Info className={`w-5 h-5 ${item.text} shrink-0 mt-0.5`} />
                  <p className="text-xs text-content-secondary leading-relaxed">
                    This product contains {item.additivesCount} food additive{item.additivesCount > 1 ? 's' : ''}. Check the E-Number Guide in the Education Hub to look up details about specific additives.
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
