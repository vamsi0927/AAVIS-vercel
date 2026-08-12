import React from 'react';
interface NutrientBarProps {
  label: string;
  value: number;
  unit: string;
  max: number;
  highThreshold: number;
  medThreshold: number;
  inverse?: boolean; // If true, higher is better (e.g., protein, fiber)
}
export function NutrientBar({
  label,
  value,
  unit,
  max,
  highThreshold,
  medThreshold,
  inverse = false
}: NutrientBarProps) {
  const percentage = Math.min(100, value / max * 100);
  let colorClass = 'bg-brand-safe';
  if (inverse) {
    if (value < medThreshold) colorClass = 'bg-brand-caution';
    if (value < highThreshold) colorClass = 'bg-brand-hazardous'; // highThreshold is actually the 'low' threshold here
  } else {
    if (value > medThreshold) colorClass = 'bg-brand-caution';
    if (value > highThreshold) colorClass = 'bg-brand-hazardous';
  }
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-content-secondary">{label}</span>
        <span className="font-medium text-content-primary">
          {value}
          {unit}
        </span>
      </div>
      <div className="h-2 w-full bg-navy-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass} transition-all duration-1000 ease-out`}
          style={{
            width: `${percentage}%`
          }} />
        
      </div>
    </div>);

}