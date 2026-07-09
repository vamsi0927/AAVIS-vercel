import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft } from 'lucide-react';
import { ADDITIVES_DB } from '../../data/additives';
import { AdditiveCard } from '../../components/AdditiveCard';
export function AdditivesList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<
    'all' | 'safe' | 'mild' | 'moderate' | 'caution' | 'hazardous'>(
    'all');
  const additives = Object.values(ADDITIVES_DB);
  const filtered = additives.filter((a) => {
    const matchesSearch =
    a.code.toLowerCase().includes(search.toLowerCase()) ||
    a.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || a.hazard === filter;
    return matchesSearch && matchesFilter;
  });
  return (
    <div className="flex flex-col h-full bg-navy-900 relative overflow-y-auto no-scrollbar pb-24">
      {/* Ambient backgrounds */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-gradient-to-b from-brand-primary/10 to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-brand-primary/20 rounded-full blur-[100px] pointer-events-none" />

      <header className="pt-safe pt-6 px-4 pb-4 flex flex-col relative z-10 md:max-w-3xl md:mx-auto md:w-full">
        <div className="flex items-center">
          <button data-testid='btn-additiveslist-1'
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-content-secondary hover:text-white rounded-xl bg-white/5 border border-white/5 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-black text-lg ml-3 text-white">Additives & E-Nos</h1>
        </div>
        <p className="mt-4 text-content-secondary text-sm">
          A comprehensive database of common food additives, artificial sweeteners, colorings, and preservatives.
        </p>
      </header>

      <div className="flex-1 px-4 space-y-6 md:max-w-3xl md:mx-auto md:w-full relative z-10">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-secondary" />
            <input data-testid='input-additiveslist-1'
              type="text"
              placeholder="Search by E-number or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-navy-800 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-content-secondary focus:outline-none focus:border-brand-primary transition-colors" />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {(['all', 'safe', 'mild', 'moderate', 'caution', 'hazardous'] as const).map((f) =>
              <button data-testid='btn-additiveslist-2'
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                  filter === f ? 'bg-brand-primary text-white font-bold' : 'bg-navy-800 text-content-secondary border border-white/5 hover:text-content-primary'
                }`}
              >
                {f}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3 pb-6">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-content-secondary text-sm">
              No additives found matching your search.
            </div>
          ) : (
            filtered.map((additive) => (
              <AdditiveCard key={additive.code} additive={additive} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}