import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, History as HistoryIcon, Cloud, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SAMPLE_PRODUCTS } from '../data/sampleProducts';
import { EmptyState } from '../components/EmptyState';
import { ScanResult } from '../lib/types';
import { deleteUserScan } from '../lib/supabaseService';
import { toast } from 'sonner';

export function History() {
  const navigate = useNavigate();
  const { scans, clearHistory, loadCloudScans, supabaseUserId, removeScan, restoreScans } = useAppContext();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'safe' | 'caution' | 'hazardous'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  
  // Modal states
  const [scanToDelete, setScanToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedImageScan, setSelectedImageScan] = useState<ScanResult | null>(null);

  // Keyboard shortcut for ESC to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setScanToDelete(null);
        setSelectedImageScan(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load cloud scans on mount
  useEffect(() => {
    if (supabaseUserId) {
      setIsLoadingCloud(true);
      loadCloudScans().finally(() => setIsLoadingCloud(false));
    }
  }, [supabaseUserId]);

  const filteredScans = scans.filter((scan) => {
    const product = scan.product || SAMPLE_PRODUCTS.find((p) => p.id === scan.productId);
    if (!product) return false;
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.brand.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || scan.verdict === filter;
    return matchesSearch && matchesFilter;
  });

  const sortedScans = [...filteredScans].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    if (sortBy === 'highest') {
      return b.score - a.score;
    }
    if (sortBy === 'lowest') {
      return a.score - b.score;
    }
    return 0;
  });

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setScanToDelete(id);
  };

  const handleImageClick = (e: React.MouseEvent, scan: ScanResult) => {
    e.stopPropagation();
    setSelectedImageScan(scan);
  };

  const confirmDelete = async () => {
    if (!scanToDelete || !supabaseUserId) return;
    
    // Capture state for rollback
    const previousScans = [...scans];
    const idToDelete = scanToDelete;
    
    // Optimistic UI update
    removeScan(idToDelete);
    setScanToDelete(null);
    setIsDeleting(true);

    try {
      const success = await deleteUserScan(idToDelete, supabaseUserId);
      if (success) {
        toast.success("Scan deleted successfully.");
      } else {
        throw new Error("Supabase delete failed");
      }
    } catch (err) {
      // Rollback
      restoreScans(previousScans);
      toast.error("Failed to delete scan.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-navy-900 pb-24 relative">
      <header className="pt-safe pt-8 px-6 pb-4 md:max-w-7xl md:mx-auto md:w-full md:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-display font-bold">History</h1>
          <div className="flex items-center gap-2">
            {isLoadingCloud && (
              <div className="flex items-center gap-1 text-brand-primary">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-[10px] font-bold uppercase">Syncing</span>
              </div>
            )}
            {scans.length > 0 &&
              <button
                onClick={clearHistory}
                className="text-brand-hazardous p-2 hover:bg-brand-hazardous/10 rounded-full transition-colors"
                title="Delete All History"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            }
          </div>
        </div>

        {/* Cloud sync indicator */}
        {supabaseUserId && scans.length > 0 && (
          <div className="flex items-center gap-1.5 mb-4 text-brand-safe/70">
            <Cloud className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Cloud synced</span>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        {scans.length > 0 &&
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-navy-800/40 p-4 rounded-2xl border border-white/5">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-secondary" />
              <input
                type="text"
                placeholder="Search scans by name or brand..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-navy-900/60 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder:text-content-secondary focus:outline-none focus:border-brand-primary transition-colors" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-navy-900 p-1 rounded-xl border border-white/5">
                {(['all', 'safe', 'caution', 'hazardous'] as const).map((f) =>
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-brand-primary text-white font-bold' : 'text-content-secondary hover:text-content-primary'}`}>
                    {f}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 bg-navy-900 px-3 py-1.5 rounded-xl border border-white/5">
                <span className="text-xs font-semibold text-content-secondary">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                >
                  <option value="newest" className="bg-navy-900 text-white">Newest</option>
                  <option value="oldest" className="bg-navy-900 text-white">Oldest</option>
                  <option value="highest" className="bg-navy-900 text-white">Highest Score</option>
                  <option value="lowest" className="bg-navy-900 text-white">Lowest Score</option>
                </select>
              </div>
            </div>
          </div>
        }
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 md:max-w-7xl md:mx-auto md:w-full md:px-8 md:py-4">
        {scans.length === 0 ?
          <EmptyState
            icon={HistoryIcon}
            title="No Scans Yet"
            description="Your scan history will appear here. Start scanning products to build your history."
            action={
              <button
                onClick={() => navigate('/scan')}
                className="mt-4 bg-brand-primary px-6 py-3 rounded-xl font-medium text-white">
                Scan a Product
              </button>
            } /> :
          sortedScans.length === 0 ?
            <div className="text-center py-12 text-content-secondary">
              No results found for your search.
            </div> :
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
              {sortedScans.map((scan) => {
                const product = scan.product || SAMPLE_PRODUCTS.find((p) => p.id === scan.productId);
                if (!product) return null;
                const date = new Date(scan.date);
                const dateStr = date.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                
                const scoreEmoji = scan.verdict === 'safe' ? '🟢' : scan.verdict === 'caution' ? '🟡' : '🔴';
                
                return (
                  <button
                    key={scan.id}
                    onClick={() => navigate(`/result/${scan.id}`)}
                    className="w-full bg-navy-800 hover:bg-navy-700 transition-colors rounded-2xl p-4 border border-navy-700 flex items-center gap-4 text-left group">
                    <div 
                      onClick={(e) => handleImageClick(e, scan)}
                      className="w-16 h-16 bg-navy-900 rounded-xl flex items-center justify-center border border-navy-600 flex-shrink-0 overflow-hidden cursor-zoom-in relative">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.classList.add('fallback-icon-container');
                          }}
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-content-secondary/50" />
                      )}
                      {/* Fallback icon injected via CSS if img fails */}
                      <div className="absolute inset-0 items-center justify-center hidden [.fallback-icon-container_&]:flex">
                        <ImageIcon className="w-6 h-6 text-content-secondary/50" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h4 className="font-semibold text-content-primary truncate">
                        {product.name}
                      </h4>
                      <p className="text-xs text-content-secondary truncate mb-1">
                        {product.brand} • {dateStr}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-bold text-white/90">
                          {scan.score}/100 {scoreEmoji}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${scan.verdict === 'safe' ? 'bg-brand-safe/20 text-brand-safe' : scan.verdict === 'caution' ? 'bg-brand-caution/20 text-brand-caution' : 'bg-brand-hazardous/20 text-brand-hazardous'}`}>
                          {scan.verdict}
                        </span>
                      </div>
                    </div>
                    <div 
                      onClick={(e) => handleDeleteClick(e, scan.id)}
                      className="p-2.5 rounded-xl hover:bg-brand-hazardous/10 text-content-secondary hover:text-brand-hazardous transition-colors cursor-pointer flex-shrink-0 ml-1">
                      <Trash2 className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>
        }
      </div>

      {/* Delete Confirmation Modal */}
      {scanToDelete && (
        <div 
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setScanToDelete(null)}
        >
          <div 
            className="bg-navy-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-2">Delete this scan?</h3>
            <p className="text-sm text-content-secondary mb-6">
              This action will permanently remove the scan from your history.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setScanToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-content-secondary bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-brand-hazardous hover:bg-brand-hazardous/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {selectedImageScan && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
          onClick={() => setSelectedImageScan(null)}
        >
          <button 
            className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-black/50 hover:bg-black text-white rounded-full transition-colors z-10"
            onClick={() => setSelectedImageScan(null)}
          >
            <X className="w-6 h-6" />
          </button>
          
          <div 
            className="w-full max-w-2xl bg-navy-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 overflow-hidden bg-black/50 relative min-h-[300px]">
              {selectedImageScan.product?.imageUrl ? (
                <img 
                  src={selectedImageScan.product.imageUrl} 
                  alt="Original Label"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.classList.add('fallback-icon-container-modal');
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-content-secondary/30" />
                </div>
              )}
              <div className="absolute inset-0 items-center justify-center hidden [.fallback-icon-container-modal_&]:flex">
                <ImageIcon className="w-16 h-16 text-content-secondary/30" />
              </div>
            </div>
            
            <div className="p-6 bg-navy-800/50">
              <h2 className="text-xl font-bold text-white mb-1">
                {selectedImageScan.product?.name}
              </h2>
              <div className="flex items-center gap-2 mb-4 text-sm text-content-secondary">
                <span>{selectedImageScan.product?.brand}</span>
                <span>•</span>
                <span>{new Date(selectedImageScan.date).toLocaleDateString(undefined, {
                  month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-navy-900 rounded-xl border border-white/5 flex items-center gap-2">
                  <span className="text-sm text-content-secondary font-medium">Health Score:</span>
                  <span className="text-lg font-bold text-white">
                    {selectedImageScan.score}/100 
                    {selectedImageScan.verdict === 'safe' ? ' 🟢' : selectedImageScan.verdict === 'caution' ? ' 🟡' : ' 🔴'}
                  </span>
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-2 rounded-xl ${selectedImageScan.verdict === 'safe' ? 'bg-brand-safe/20 text-brand-safe' : selectedImageScan.verdict === 'caution' ? 'bg-brand-caution/20 text-brand-caution' : 'bg-brand-hazardous/20 text-brand-hazardous'}`}>
                  {selectedImageScan.verdict}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}