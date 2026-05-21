import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Search } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { SAMPLE_PRODUCTS } from '../../data/sampleProducts';
export function ResultIngredients() {
  const { id } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const { scans } = useAppContext();
  const [search, setSearch] = useState('');
  const scan = scans.find((s) => s.id === id);
  const product = scan ?
  SAMPLE_PRODUCTS.find((p) => p.id === scan.productId) :
  null;
  if (!product) return null;
  const filtered = product.ingredients.filter((i) =>
  i.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="flex flex-col h-full bg-navy-900">
      <header className="pt-safe pt-6 px-4 pb-4 flex items-center border-b border-navy-800">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-content-secondary hover:text-white">
          
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display font-bold text-lg ml-2">
          Full Ingredients
        </h1>
      </header>

      <div className="px-6 py-4 border-b border-navy-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-secondary" />
          <input
            type="text"
            placeholder="Search ingredients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-navy-800 border border-navy-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-content-secondary focus:outline-none focus:border-brand-primary" />
          
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-4">
        <p className="text-xs text-content-secondary uppercase tracking-wider mb-3">
          {filtered.length} ingredients
        </p>
        <div className="space-y-2">
          {filtered.map((ing, i) =>
          <div
            key={i}
            className="bg-navy-800 border border-navy-700 rounded-xl p-3 px-4 flex items-center justify-between">
            
              <span className="text-content-primary font-medium">{ing}</span>
              <span className="text-xs text-content-secondary">#{i + 1}</span>
            </div>
          )}
          {filtered.length === 0 &&
          <p className="text-center text-content-secondary py-8">
              No matching ingredients.
            </p>
          }
        </div>
      </div>
    </div>);

}