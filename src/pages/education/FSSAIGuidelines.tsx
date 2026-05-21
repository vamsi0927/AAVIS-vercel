import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export function FSSAIGuidelines() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-navy-900 pb-24">
      <header className="pt-safe pt-8 px-6 pb-4 flex items-center gap-4 border-b border-navy-800">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-navy-800 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-display font-bold">FSSAI Guidelines</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 space-y-6">
        <div className="bg-brand-safe/10 p-6 rounded-2xl border border-brand-safe/20 text-center">
          <ShieldCheck className="w-12 h-12 text-brand-safe mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">Indian Food Safety Standards</h2>
          <p className="text-sm text-content-secondary">
            Aavis uses FSSAI limits to determine if a product is safe, requires caution, or is hazardous.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-navy-800 p-5 rounded-xl border border-navy-700">
            <h3 className="font-bold text-white mb-2">Sugar Limits</h3>
            <p className="text-sm text-content-secondary">
              Products with more than 10g of added sugar per 100g are flagged as high sugar.
            </p>
          </div>
          
          <div className="bg-navy-800 p-5 rounded-xl border border-navy-700">
            <h3 className="font-bold text-white mb-2">Sodium Limits</h3>
            <p className="text-sm text-content-secondary">
              Products with more than 400mg of sodium per 100g are flagged as high sodium.
            </p>
          </div>

          <div className="bg-navy-800 p-5 rounded-xl border border-navy-700">
            <h3 className="font-bold text-white mb-2">Banned Additives</h3>
            <p className="text-sm text-content-secondary">
              Aavis flags additives like Potassium Bromate and certain artificial colors that are restricted or banned by FSSAI in specific food categories.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
