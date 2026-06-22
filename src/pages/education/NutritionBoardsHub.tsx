import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Droplets, AlertTriangle, Scale, Beaker, Baby, ChevronRight } from 'lucide-react';

const BOARDS = [
  {
    id: 'sugar',
    title: 'Sugar Board',
    description: 'See the physical sugar cubes hidden in your favorite drinks.',
    icon: Droplets,
    color: 'text-brand-hazardous',
    bg: 'bg-brand-hazardous/10',
    border: 'border-brand-hazardous/30',
    route: '/education/boards/sugar'
  },
  {
    id: 'salt',
    title: 'Salt Board',
    description: 'Visualize sodium equivalents and hypertension risks.',
    icon: Scale,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/30',
    route: '/education/boards/salt'
  },
  {
    id: 'fat',
    title: 'Fat & Oil Board',
    description: 'Saturated fats and processed seed oils exposed.',
    icon: AlertTriangle,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    route: '/education/boards/fat'
  },
  {
    id: 'additives',
    title: 'Additives Board',
    description: 'The chemical cocktail in ultra-processed foods.',
    icon: Beaker,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    route: '/education/boards/additives'
  },
  {
    id: 'kids',
    title: 'Kids Products Board',
    description: 'The truth behind "healthy" children\'s health drinks.',
    icon: Baby,
    color: 'text-brand-safe',
    bg: 'bg-brand-safe/10',
    border: 'border-brand-safe/30',
    route: '/education/boards/kids'
  }
];

export function NutritionBoardsHub() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-navy-900 relative overflow-y-auto no-scrollbar pb-24">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-gradient-to-b from-brand-hazardous/10 to-transparent pointer-events-none" />
      
      <header className="pt-safe pt-6 px-4 pb-4 flex flex-col relative z-10 md:max-w-3xl md:mx-auto md:w-full">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-content-secondary hover:text-white rounded-xl bg-white/5 border border-white/5 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-black text-lg ml-3 text-white">Physical Equivalents</h1>
        </div>
        <p className="mt-4 text-content-secondary text-sm leading-relaxed">
          The physical reality of junk food. We translate abstract numbers on a label into shocking, undeniable visual equivalents.
        </p>
        <div className="mt-2.5">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-brand-secondary bg-brand-secondary/10 border border-brand-secondary/20 px-2.5 py-1 rounded-full">
            Inspired by FoodPharmer
          </span>
        </div>
      </header>

      <div className="flex-1 px-4 mt-2 space-y-4 md:max-w-3xl md:mx-auto md:w-full relative z-10">
        {BOARDS.map((board) => {
          const Icon = board.icon;
          return (
            <div 
              key={board.id}
              onClick={() => navigate(board.route)}
              className={`glass-card rounded-2xl p-4 border ${board.border} flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors group`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${board.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${board.color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base mb-1">{board.title}</h3>
                  <p className="text-xs text-content-secondary line-clamp-2 pr-4">{board.description}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-content-secondary group-hover:text-white transition-colors" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
