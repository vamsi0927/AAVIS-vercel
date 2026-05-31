import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Bookmark, Filter, MoreVertical, SlidersHorizontal } from 'lucide-react';
import { SAMPLE_PRODUCTS } from '../data/sampleProducts';
import { useAppContext } from '../context/AppContext';

export function Saved() {
  const navigate = useNavigate();
  const { bookmarkedProductIds, scans, toggleBookmark } = useAppContext();

  // Find all products that are bookmarked.
  // Bookmarks can either be a sample product or a custom scanned product.
  const savedProducts = React.useMemo(() => {
    const list: any[] = [];
    bookmarkedProductIds.forEach(id => {
      // Look in sample products
      const sample = SAMPLE_PRODUCTS.find(p => p.id === id);
      if (sample) {
        list.push(sample);
      } else {
        // Look in actual scanned products
        const scan = scans.find(s => s.productId === id || s.id === id);
        if (scan?.product) {
          list.push(scan.product);
        }
      }
    });
    return list;
  }, [bookmarkedProductIds, scans]);

  return (
    <div className="flex flex-col h-full bg-navy-900 pb-24">
      <header className="pt-safe pt-8 px-6 pb-4 bg-navy-900/95 backdrop-blur-md sticky top-0 z-20 md:max-w-3xl md:mx-auto md:w-full md:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-display font-bold">Saved Items</h1>
          <button className="p-2 text-content-secondary hover:text-white rounded-full bg-navy-800">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {savedProducts.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-secondary" />
            <input
              type="text"
              placeholder="Search saved products..."
              className="w-full bg-navy-800 border border-navy-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-content-secondary focus:outline-none focus:border-brand-primary"
            />
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-4 flex flex-col md:max-w-3xl md:mx-auto md:w-full md:px-8 md:py-4">
        {savedProducts.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center px-6">
            <div className="w-16 h-16 bg-navy-800 rounded-full flex items-center justify-center mb-4 border border-navy-700">
              <Bookmark className="w-6 h-6 text-brand-primary" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Saved Items</h3>
            <p className="text-content-secondary text-sm max-w-xs mb-6">
              Bookmark products after scanning to keep track of your favorites or items to avoid.
            </p>
            <button
              onClick={() => navigate('/scan')}
              className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-[0.98]"
            >
              Scan a Product
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-2">
              {['All', 'Safe', 'Favorites', 'Snacks', 'Beverages'].map((filter, i) => (
                <button
                  key={filter}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    i === 0 ? 'bg-brand-primary text-white' : 'bg-navy-800 text-content-secondary border border-navy-700'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {savedProducts.map((product) => {
                const isHazardous = product.additives.includes('E102') || product.additives.includes('E211');
                const isCaution = product.additives.length > 1 && !isHazardous;
                
                return (
                  <div key={product.id} className="bg-navy-800 border border-navy-700 hover:border-navy-600 transition-colors rounded-2xl p-4 flex flex-col relative group cursor-pointer" onClick={() => navigate(`/result/${product.id}`)}>
                    <button 
                      className="absolute top-3 right-3 text-brand-primary z-10 p-1"
                      onClick={(e) => { e.stopPropagation(); toggleBookmark(product.id); }}
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>
                    
                    <div className="w-16 h-16 mx-auto bg-navy-900 rounded-2xl flex items-center justify-center text-3xl border border-navy-700 mb-4 shadow-inner">
                      {product.imageEmoji}
                    </div>
                    
                    <div className="flex-1 flex flex-col">
                      <h3 className="font-bold text-sm text-white line-clamp-1 mb-1">{product.name}</h3>
                      <p className="text-xs text-content-secondary truncate mb-3">{product.brand}</p>
                      
                      <div className="mt-auto">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                          isHazardous ? 'bg-brand-hazardous/20 text-brand-hazardous' : 
                          isCaution ? 'bg-brand-caution/20 text-brand-caution' : 
                          'bg-brand-safe/20 text-brand-safe'
                        }`}>
                          {isHazardous ? 'Hazardous' : isCaution ? 'Caution' : 'Safe'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}