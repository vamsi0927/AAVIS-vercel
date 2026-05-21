import React from 'react';
import { Additive } from '../lib/types';
import { AlertTriangle, Info } from 'lucide-react';
export function AdditiveCard({ additive }: {additive: Additive;}) {
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
    <div className="bg-navy-800 rounded-xl p-4 border border-navy-600">
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

}