import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { SAMPLE_PRODUCTS } from '../../data/sampleProducts';
import { ADDITIVES_DB } from '../../data/additives';
import { AdditiveCard } from '../../components/AdditiveCard';

export function ResultAdditives() {
  const navigate = useNavigate();
  const { id } = useParams();
  const product = SAMPLE_PRODUCTS.find((p) => p.id === id) || SAMPLE_PRODUCTS[0];

  const productAdditives = product.additives;

  return (
    <div className="flex flex-col h-full bg-navy-900 pb-24">
      <header className="pt-safe pt-8 px-6 pb-4 flex items-center gap-4 bg-navy-900/90 backdrop-blur-md sticky top-0 z-10 border-b border-navy-800">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-navy-800 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-display font-bold">Additives Detail</h1>
          <p className="text-xs text-content-secondary">{product.name}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 space-y-6">
        {productAdditives.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-brand-safe/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-brand-safe" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Additives Found</h3>
            <p className="text-content-secondary">This product appears to be free of E-number additives.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-content-secondary">
              We found {productAdditives.length} additive{productAdditives.length > 1 ? 's' : ''} in this product.
            </p>
            {productAdditives.map((additiveCode) => {
              const fullDetails = ADDITIVES_DB[additiveCode];
              if (!fullDetails) return null;
              return <AdditiveCard key={additiveCode} additive={fullDetails} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
