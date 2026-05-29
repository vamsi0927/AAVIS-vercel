import React from 'react';
import { Additive } from '../lib/types';
import { AlertTriangle, Info } from 'lucide-react';
import { getAdditiveBadgeClasses } from '../lib/ingredientRisk';

export function AdditiveCard({ additive }: {additive: Additive;}) {
  const hazard = additive.hazard;
  const badgeColor = getAdditiveBadgeClasses(hazard);
  
  let Icon = Info;
  let iconColor = 'text-emerald-400';
  
  if (hazard === 'hazardous') {
    Icon = AlertTriangle;
    iconColor = 'text-red-500';
  } else if (hazard === 'harmful') {
    Icon = AlertTriangle;
    iconColor = 'text-rose-400';
  } else if (hazard === 'caution' || hazard === 'moderate') {
    Icon = AlertTriangle;
    iconColor = 'text-amber-400';
  } else if (hazard === 'mild') {
    Icon = Info;
    iconColor = 'text-yellow-400';
  }

  return (
    <div className="bg-navy-800 rounded-xl p-4 border border-navy-700">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-md text-xs font-bold ${badgeColor}`}>
            {additive.code}
          </span>
          <h4 className="font-semibold text-content-primary">
            {additive.name}
          </h4>
        </div>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <p className="text-xs text-content-secondary mb-2 uppercase tracking-wider">
        {additive.category}
      </p>
      <p className="text-sm text-content-primary/80 leading-relaxed">
        {additive.description}
      </p>
    </div>
  );
}