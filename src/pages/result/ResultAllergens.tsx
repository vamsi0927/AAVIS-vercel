import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { SAMPLE_PRODUCTS } from '../../data/sampleProducts';
import { useAppContext } from '../../context/AppContext';

export function ResultAllergens() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { profile } = useAppContext();
  const product = SAMPLE_PRODUCTS.find((p) => p.id === id) || SAMPLE_PRODUCTS[0];

  const productAllergens = product.allergens || [];
  const userAllergies = profile.allergens || [];

  return (
    <div className="flex flex-col h-full bg-navy-900 pb-24">
      <header className="pt-safe pt-8 px-6 pb-4 flex items-center gap-4 bg-navy-900/90 backdrop-blur-md sticky top-0 z-10 border-b border-navy-800">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-navy-800 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-display font-bold">Allergens</h1>
          <p className="text-xs text-content-secondary">{product.name}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 space-y-6">
        {productAllergens.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-brand-safe/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8 text-brand-safe" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Allergens Detected</h3>
            <p className="text-content-secondary">This product does not list any common allergens.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-content-secondary">
              This product contains {productAllergens.length} known allergen{productAllergens.length > 1 ? 's' : ''}.
            </p>
            <div className="grid gap-3">
              {productAllergens.map((allergen) => {
                const isUserAllergic = userAllergies.includes(allergen.toLowerCase());
                return (
                  <div
                    key={allergen}
                    className={`p-4 rounded-xl border flex items-center gap-4 ${
                      isUserAllergic ? 'bg-red-500/10 border-red-500/30' : 'bg-navy-800 border-navy-700'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isUserAllergic ? 'bg-red-500/20 text-red-400' : 'bg-navy-700 text-content-secondary'}`}>
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className={`font-bold ${isUserAllergic ? 'text-red-400' : 'text-white'}`}>{allergen}</h4>
                      {isUserAllergic && <p className="text-xs text-red-400/80 mt-1">Matches your profile alert!</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
