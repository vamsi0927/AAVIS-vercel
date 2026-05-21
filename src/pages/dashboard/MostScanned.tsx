import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { SAMPLE_PRODUCTS } from '../../data/sampleProducts';

export function MostScanned() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-navy-900 pb-24">
      <header className="pt-safe pt-8 px-6 pb-4 flex items-center gap-4 border-b border-navy-800">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-navy-800 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-display font-bold">Most Scanned</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 space-y-6">
        <div className="bg-navy-800 p-4 rounded-xl border border-navy-700 flex items-center gap-4">
          <div className="p-3 bg-brand-primary/20 text-brand-primary rounded-xl">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Your Habits</h3>
            <p className="text-sm text-content-secondary">Products you scan the most frequently.</p>
          </div>
        </div>

        <div className="space-y-3">
          {SAMPLE_PRODUCTS.slice(0, 3).map((product, index) => (
            <div key={product.id} className="bg-navy-800 p-4 rounded-2xl border border-navy-700 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-navy-900 flex items-center justify-center font-bold text-content-secondary border border-navy-600">
                #{index + 1}
              </div>
              <div className="text-3xl">{product.imageEmoji}</div>
              <div className="flex-1">
                <h4 className="font-semibold text-white">{product.name}</h4>
                <p className="text-xs text-content-secondary">{product.brand}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-brand-primary">{3 - index + 2} scans</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
