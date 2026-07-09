import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Droplets, Search, AlertCircle } from 'lucide-react';

const SUGAR_ALIASES = [
  { name: 'Sucrose', category: 'Basic Sugars', description: 'Table sugar. Half glucose, half fructose.' },
  { name: 'High Fructose Corn Syrup (HFCS)', category: 'Syrups', description: 'Cheaper than sugar, heavily processed from corn. Strongly linked to fatty liver disease.' },
  { name: 'Maltodextrin', category: 'Processed Starches', description: 'Technically a complex carb but acts like sugar in the body. Has a higher glycemic index than table sugar.' },
  { name: 'Dextrose', category: 'Basic Sugars', description: 'Chemically identical to glucose. Often used in baking and processed foods.' },
  { name: 'Fructose', category: 'Basic Sugars', description: 'Fruit sugar. When extracted and added to foods without fiber, it overworks the liver.' },
  { name: 'Agave Nectar', category: 'Syrups', description: 'Often marketed as healthy, but contains up to 90% fructose, which is worse for metabolic health than regular sugar.' },
  { name: 'Brown Rice Syrup', category: 'Syrups', description: 'Contains no fructose, only glucose. Still pure sugar, but breaks down slightly slower.' },
  { name: 'Invert Sugar', category: 'Syrups', description: 'Liquid sugar used by bakers to keep baked goods moist.' },
  { name: 'Cane Juice Crystals', category: 'Basic Sugars', description: 'A fancy, "natural" sounding name for plain old sugar.' },
  { name: 'Barley Malt', category: 'Syrups', description: 'A sweet syrup made from sprouted barley.' },
  { name: 'Glucose Syrup', category: 'Syrups', description: 'A thick, sweet syrup used heavily in commercial candy and snack production.' },
  { name: 'Corn Syrup', category: 'Syrups', description: 'A liquid sweetener made from corn starch.' },
  { name: 'Caramel', category: 'Other', description: 'Often used for coloring, but it is made by heating sugar.' },
  { name: 'Fruit Juice Concentrate', category: 'Other', description: 'Juice with all water and fiber removed. It is essentially pure sugar.' },
  { name: 'Maltose', category: 'Basic Sugars', description: 'Malt sugar. Less sweet than table sugar but spikes blood sugar rapidly.' },
  { name: 'Coconut Sugar', category: 'Basic Sugars', description: 'Retains trace minerals, but still contains the same amount of calories and fructose as regular sugar.' },
  { name: 'Treacle', category: 'Syrups', description: 'Uncrystallized syrup made during the refining of sugar.' },
  { name: 'Turbinado Sugar', category: 'Basic Sugars', description: 'Partially refined cane sugar. Not a health food.' },
  { name: 'Sorghum Syrup', category: 'Syrups', description: 'Sweet syrup extracted from the sorghum plant.' },
  { name: 'Galactose', category: 'Basic Sugars', description: 'A simple sugar usually found combining with glucose to form lactose.' },
];

export function HiddenSugarsGuide() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSugars = SUGAR_ALIASES.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-navy-900 relative overflow-y-auto no-scrollbar pb-24">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />
      
      <header className="pt-safe pt-6 px-4 pb-4 flex flex-col relative z-10 md:max-w-3xl md:mx-auto md:w-full">
        <div className="flex items-center">
          <button data-testid='btn-hiddensugarsguide-1'
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-content-secondary hover:text-white rounded-xl bg-white/5 border border-white/5 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-black text-lg ml-3 text-white">Hidden Sugars</h1>
        </div>
        <p className="mt-4 text-content-secondary text-sm">
          Food manufacturers use over 50 different names for sugar to hide how much is really in your food.
        </p>

        <div className="mt-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-secondary" />
          <input data-testid='input-hiddensugarsguide-1'
            type="text"
            placeholder="Search for an ingredient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-navy-800 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-content-secondary/50 focus:outline-none focus:border-brand-primary/50 transition-colors"
          />
        </div>
      </header>

      <div className="flex-1 px-4 mt-2 space-y-3 md:max-w-3xl md:mx-auto md:w-full relative z-10">
        {filteredSugars.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
             <AlertCircle className="w-12 h-12 text-content-secondary mb-3 opacity-50" />
             <p className="text-content-secondary font-medium">No hidden sugars found matching "{searchQuery}"</p>
          </div>
        ) : (
          filteredSugars.map((sugar, idx) => (
            <div key={idx} className="glass-card rounded-2xl p-4 border border-white/5 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-emerald-400" />
                  {sugar.name}
                </h3>
                <span className="text-[10px] uppercase tracking-wider font-bold text-content-secondary bg-white/5 px-2 py-1 rounded-md">
                  {sugar.category}
                </span>
              </div>
              <p className="text-sm text-content-secondary leading-relaxed">
                {sugar.description}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
