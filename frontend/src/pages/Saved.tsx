import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Bookmark, SlidersHorizontal, Image as ImageIcon, X, Trash2, ExternalLink } from 'lucide-react';
import { SAMPLE_PRODUCTS } from '../data/sampleProducts';
import { useAppContext } from '../context/AppContext';

export function Saved() {
  const navigate = useNavigate();
  const { bookmarkedProductIds, scans, toggleBookmark, loadCloudScans } = useAppContext();

  useEffect(() => {
    loadCloudScans().catch(() => {});
  }, [loadCloudScans]);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedImageProduct, setSelectedImageProduct] = useState<any | null>(null);

  // -- Products Logic --
  const savedProducts = useMemo(() => {
    const list: any[] = [];
    bookmarkedProductIds.forEach(id => {
      const sample = SAMPLE_PRODUCTS.find(p => p.id === id);
      if (sample) {
        list.push(sample);
      } else {
        const scan = scans.find(s => s.productId === id || s.id === id);
        if (scan?.product) {
          list.push(scan.product);
        }
      }
    });
    return list.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [bookmarkedProductIds, scans, searchQuery]);



  return (
    <div className="flex flex-col h-full bg-navy-900 pb-24">
      <header className="pt-safe pt-8 px-6 pb-4 bg-navy-900/95 backdrop-blur-md sticky top-0 z-20 md:max-w-3xl md:mx-auto md:w-full md:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-display font-bold">Saved</h1>
          <button data-testid='btn-saved-1' className="p-2 text-content-secondary hover:text-white rounded-full bg-navy-800">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        {bookmarkedProductIds.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-secondary" />
            <input data-testid='input-saved-1'
              type="text"
              placeholder="Search saved products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-navy-800 border border-navy-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-content-secondary focus:outline-none focus:border-brand-primary"
            />
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-4 flex flex-col md:max-w-3xl md:mx-auto md:w-full md:px-8 md:py-4">
        
        {/* PRODUCTS */}

        {bookmarkedProductIds.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center px-6">
            <div className="w-16 h-16 bg-navy-800 rounded-full flex items-center justify-center mb-4 border border-navy-700">
              <Bookmark className="w-6 h-6 text-brand-primary" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Saved Products</h3>
            <p className="text-content-secondary text-sm max-w-xs mb-6">
              Bookmark products after scanning to keep track of your favorites or items to avoid.
            </p>
            <button data-testid='btn-saved-2'
              onClick={() => navigate('/scan')}
              className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-[0.98]"
            >
              Scan a Product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {savedProducts.map((product) => {
              const isHazardous = product.additives.includes('E102') || product.additives.includes('E211');
              const isCaution = product.additives.length > 1 && !isHazardous;
              
              return (
                <div key={product.id} className="bg-navy-800 border border-navy-700 hover:border-navy-600 transition-colors rounded-2xl p-4 flex flex-col relative group cursor-pointer" onClick={() => navigate(`/result/${product.id}`)}>
                  <button data-testid='btn-saved-3' 
                    className="absolute top-3 right-3 text-brand-primary z-10 p-1"
                    onClick={(e) => { e.stopPropagation(); toggleBookmark(product.id); }}
                  >
                    <Bookmark className="w-4 h-4 fill-current" />
                  </button>
                  
                  <div 
                    className="w-16 h-16 mx-auto bg-navy-900 rounded-2xl flex items-center justify-center text-3xl border border-navy-700 mb-4 shadow-inner overflow-hidden cursor-pointer hover:border-brand-primary transition-colors shrink-0"
                    onClick={(e) => { e.stopPropagation(); setSelectedImageProduct(product); }}
                  >
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : product.imageEmoji ? (
                      <span>{product.imageEmoji}</span>
                    ) : (
                      <ImageIcon className="w-6 h-6 text-content-secondary/50" />
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <h3 className="font-bold text-sm text-white line-clamp-1 mb-1">{product.name}</h3>
                    <p className="text-xs text-content-secondary break-words whitespace-normal mb-3">{product.brand}</p>
                    
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
        )}
      </div>

      {/* Image Viewer Modal */}
      {selectedImageProduct && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
          onClick={() => setSelectedImageProduct(null)}
        >
          <button data-testid='btn-saved-4' 
            className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-black/50 hover:bg-black text-white rounded-full transition-colors z-10"
            onClick={() => setSelectedImageProduct(null)}
          >
            <X className="w-6 h-6" />
          </button>
          
          <div 
            className="w-full max-w-2xl bg-navy-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full bg-black/80 relative flex items-center justify-center border-b border-white/10" style={{ maxHeight: '50vh' }}>
              {selectedImageProduct.imageUrl ? (
                <img 
                  src={selectedImageProduct.imageUrl} 
                  alt="Original Label"
                  className="w-full h-auto max-h-[50vh] object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.classList.add('fallback-icon-container-modal');
                  }}
                />
              ) : (
                <div className="w-full py-20 flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-content-secondary/30" />
                </div>
              )}
              <div className="absolute inset-0 items-center justify-center hidden [.fallback-icon-container-modal_&]:flex">
                <ImageIcon className="w-16 h-16 text-content-secondary/30" />
              </div>
            </div>
            
            <div className="p-6 bg-navy-800/50 flex-shrink-0 overflow-y-auto">
              <h2 className="text-xl font-bold text-white mb-1">
                {selectedImageProduct.name}
              </h2>
              <div className="flex items-center gap-2 mb-4 text-sm text-content-secondary">
                <span>{selectedImageProduct.brand}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}