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
    <div className="flex flex-col h-full bg-navy-900 pb-safe">
      <header className="pt-safe pt-8 px-6 pb-4 sticky top-0 bg-navy-900/90 backdrop-blur-md z-10">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-content-secondary hover:text-white">
            
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-display font-bold ml-2">
            E-Numbers Guide
          </h1>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-secondary" />
            <input
              type="text"
              placeholder="Search by E-number or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-navy-800 border border-navy-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-content-secondary focus:outline-none focus:border-brand-primary transition-colors" />
            
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {(['all', 'safe', 'mild', 'moderate', 'caution', 'hazardous'] as const).map((f) =>
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors ${filter === f ? 'bg-brand-primary text-white' : 'bg-navy-800 text-content-secondary border border-navy-700'}`}>
                {f}
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 space-y-3 pb-6">
        {filtered.length === 0 ?
        <div className="text-center py-12 text-content-secondary">
            No additives found matching your search.
          </div> :

        filtered.map((additive) => (
          <AdditiveCard key={additive.code} additive={additive} />
        ))
        }
      </div>
    </div>);

}