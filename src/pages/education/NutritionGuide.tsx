import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, ChevronRight } from 'lucide-react';

const NUTRIENTS = [
  { name: 'Proteins', desc: 'Essential for building and repairing tissues.' },
  { name: 'Carbohydrates', desc: 'The body\'s main source of energy.' },
  { name: 'Fats', desc: 'Necessary for hormone production and nutrient absorption.' },
  { name: 'Fiber', desc: 'Helps maintain bowel health and controls blood sugar levels.' },
  { name: 'Sodium', desc: 'Regulates blood pressure, but too much is harmful.' },
  { name: 'Sugar', desc: 'Provides quick energy, but excess leads to health issues.' },
];

export function NutritionGuide() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-navy-900 pb-24">
      <header className="pt-safe pt-8 px-6 pb-4 flex items-center gap-4 border-b border-navy-800">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-navy-800 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-display font-bold">Nutrition Guide</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 space-y-4">
        <p className="text-content-secondary mb-4">
          Learn what each nutrient does for your body and why it's important to track them.
        </p>

        {NUTRIENTS.map((nutrient) => (
          <div key={nutrient.name} className="bg-navy-800 p-4 rounded-xl border border-navy-700">
            <h3 className="font-bold text-white mb-1">{nutrient.name}</h3>
            <p className="text-sm text-content-secondary">{nutrient.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
