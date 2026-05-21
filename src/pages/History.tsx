import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, History as HistoryIcon, Cloud, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SAMPLE_PRODUCTS } from '../data/sampleProducts';
import { EmptyState } from '../components/EmptyState';

export function History() {
  const navigate = useNavigate();
  const { scans, clearHistory, loadCloudScans, supabaseUserId } = useAppContext();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'safe' | 'caution' | 'hazardous'>('all');
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);

  // Load cloud scans on mount
  useEffect(() => {
    if (supabaseUserId) {
      setIsLoadingCloud(true);
      loadCloudScans().finally(() => setIsLoadingCloud(false));
    }
  }, [supabaseUserId]);

  const filteredScans = scans.filter((scan) => {
    // For AI scans, product data is embedded in the scan itself
    const product = scan.product || SAMPLE_PRODUCTS.find((p) => p.id === scan.productId);
    if (!product) return false;
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.brand.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || scan.verdict === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col h-full bg-navy-900 pb-24">
      <header className="pt-safe pt-8 px-6 pb-4">
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
                className="text-brand-hazardous p-2 hover:bg-brand-hazardous/10 rounded-full transition-colors">
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

        {/* Search & Filter */}
        {scans.length > 0 &&
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-secondary" />
              <input
                type="text"
                placeholder="Search scans..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-navy-800 border border-navy-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-content-secondary focus:outline-none focus:border-brand-primary transition-colors" />
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {(['all', 'safe', 'caution', 'hazardous'] as const).map((f) =>
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors ${filter === f ? 'bg-brand-primary text-white' : 'bg-navy-800 text-content-secondary border border-navy-700'}`}>
                  {f}
                </button>
              )}
            </div>
          </div>
        }
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6">
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
          filteredScans.length === 0 ?
            <div className="text-center py-12 text-content-secondary">
              No results found for your search.
            </div> :
            <div className="space-y-3 pb-6">
              {filteredScans.map((scan) => {
                const product = scan.product || SAMPLE_PRODUCTS.find((p) => p.id === scan.productId);
                if (!product) return null;
                const date = new Date(scan.date);
                const dateStr = date.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                return (
                  <button
                    key={scan.id}
                    onClick={() => navigate(`/result/${scan.id}`)}
                    className="w-full bg-navy-800 hover:bg-navy-700 transition-colors rounded-2xl p-4 border border-navy-700 flex items-center gap-4 text-left">
                    <div className="w-12 h-12 bg-navy-900 rounded-xl flex items-center justify-center text-2xl border border-navy-600 flex-shrink-0 overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        product.imageEmoji
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-content-primary truncate">
                        {product.name}
                      </h4>
                      <p className="text-xs text-content-secondary truncate">
                        {product.brand} • {dateStr}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${scan.verdict === 'safe' ? 'bg-brand-safe/20 text-brand-safe' : scan.verdict === 'caution' ? 'bg-brand-caution/20 text-brand-caution' : 'bg-brand-hazardous/20 text-brand-hazardous'}`}>
                        {scan.verdict}
                      </span>
                    </div>
                  </button>);
              })}
            </div>
        }
      </div>
    </div>);
}