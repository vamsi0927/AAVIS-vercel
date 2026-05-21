import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { ADDITIVES_DB } from '../../data/additives';
import { AdditiveCard } from '../../components/AdditiveCard';

export function AdditiveDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const additive = ADDITIVES_DB[id || ''];

  return (
    <div className="flex flex-col h-full bg-navy-900 pb-24">
      <header className="pt-safe pt-8 px-6 pb-4 flex items-center gap-4 border-b border-navy-800">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-navy-800 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-display font-bold">Additive Detail</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6">
        {!additive ? (
          <div className="text-center py-10">
            <BookOpen className="w-8 h-8 text-navy-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Additive Not Found</h3>
            <p className="text-content-secondary">We don't have information on this E-number.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <AdditiveCard additive={additive} />
            
            <div className="bg-navy-800 p-6 rounded-2xl border border-navy-700">
              <h3 className="font-semibold text-white mb-3">Detailed Description</h3>
              <p className="text-content-secondary leading-relaxed">
                This additive is commonly found in packaged foods. {additive.description}
                Always check the ingredient list if you have a known sensitivity to it.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
