import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertOctagon } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export function HazardousProducts() {
  const navigate = useNavigate();
  const { scans } = useAppContext();
  
  // Filter for hazardous products in scans
  const hazardous = scans.filter(s => s.score < 40);

  return (
    <div className="flex flex-col h-full bg-navy-900 pb-24">
      <header className="pt-safe pt-8 px-6 pb-4 flex items-center gap-4 border-b border-navy-800 bg-red-500/5">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-navy-800 transition-colors">
          <ArrowLeft className="w-6 h-6 text-red-400" />
        </button>
        <h1 className="text-xl font-display font-bold text-red-400">Hazardous Consumed</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 space-y-6">
        <p className="text-content-secondary text-sm">
          These are products you've scanned that scored very low and contain potentially harmful additives.
        </p>

        <div className="space-y-4">
          {hazardous.length === 0 ? (
            <div className="text-center py-10 bg-navy-800 rounded-2xl border border-navy-700">
              <AlertOctagon className="w-8 h-8 text-brand-safe mx-auto mb-3" />
              <p className="text-white font-medium">Great job!</p>
              <p className="text-sm text-content-secondary">No hazardous products scanned recently.</p>
            </div>
          ) : (
            hazardous.map((scan) => (
              <div key={scan.id} className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20 flex items-center gap-4">
                <div className="text-3xl">{scan.product?.imageEmoji}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{scan.product?.name}</h4>
                  <p className="text-xs text-red-400/80">Score: {scan.score}/100</p>
                </div>
                <button
                  onClick={() => navigate(`/result/${scan.id}`)}
                  className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30"
                >
                  View
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
