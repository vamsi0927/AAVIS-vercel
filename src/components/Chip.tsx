import React from 'react';
interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}
export function Chip({ label, selected, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selected ? 'bg-brand-primary text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-navy-700 text-content-secondary hover:bg-navy-600'}`}>
      
      {label}
    </button>);

}