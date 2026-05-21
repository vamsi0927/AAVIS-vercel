import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, AlertTriangle, Info } from 'lucide-react';
import { ADDITIVES_DB } from '../../data/additives';
export function AdditivesList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<
    'all' | 'safe' | 'caution' | 'hazardous'>(
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
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 space-y-3 pb-6">
        {filtered.length === 0 ?
        <div className="text-center py-12 text-content-secondary">
            No additives found matching your search.
          </div> :

        filtered.map((additive) => {
          const isHazardous = additive.hazard === 'hazardous';
          const isCaution = additive.hazard === 'caution';
          let badgeColor = 'bg-brand-safe/20 text-brand-safe';
          let Icon = Info;
          if (isHazardous) {
            badgeColor = 'bg-brand-hazardous/20 text-brand-hazardous';
            Icon = AlertTriangle;
          } else if (isCaution) {
            badgeColor = 'bg-brand-caution/20 text-brand-caution';
            Icon = AlertTriangle;
          }
          return (
            <div
              key={additive.code}
              className="bg-navy-800 rounded-xl p-4 border border-navy-700">
              
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span
                    className={`px-2 py-1 rounded-md text-xs font-bold ${badgeColor}`}>
                    
                      {additive.code}
                    </span>
                    <h4 className="font-semibold text-content-primary">
                      {additive.name}
                    </h4>
                  </div>
                  <Icon
                  className={`w-5 h-5 ${isHazardous ? 'text-brand-hazardous' : isCaution ? 'text-brand-caution' : 'text-brand-safe'}`} />
                
                </div>
                <p className="text-xs text-content-secondary mb-2 uppercase tracking-wider">
                  {additive.category}
                </p>
                <p className="text-sm text-content-primary/80 leading-relaxed">
                  {additive.description}
                </p>
              </div>);

        })
        }
      </div>
    </div>);

}