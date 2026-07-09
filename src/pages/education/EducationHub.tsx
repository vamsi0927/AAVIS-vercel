import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, BookOpen, Search, ShieldCheck, Box, Info, AlertTriangle, PieChart, Sparkles, Droplets } from 'lucide-react';

export function EducationHub() {
  const navigate = useNavigate();

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  return (
    <div className="flex flex-col h-full bg-navy-900 pb-24 relative overflow-y-auto no-scrollbar">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-secondary/10 to-transparent pointer-events-none" />
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <header className="pt-safe pt-8 px-6 pb-6 relative z-10 md:max-w-4xl md:mx-auto md:w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-display font-black text-white tracking-tight">Learning Center</h1>
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
            <BookOpen className="w-5 h-5 text-brand-secondary" />
          </div>
        </div>
        <p className="text-content-secondary text-sm font-medium leading-relaxed max-w-sm">
          Master the art of reading food labels and become immune to misleading packaging.
        </p>
      </header>

      <div className="flex-1 px-6 space-y-8 md:max-w-4xl md:mx-auto md:w-full relative z-10">

        {/* Section 1: The Core Guides */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-1">
            <Sparkles className="w-4 h-4 text-brand-primary" />
            <h2 className="text-xs font-bold text-content-secondary uppercase tracking-widest">
              Core Masterclasses
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Label Literacy Card */}
            <div 
              data-testid="card-educationhub-label-guide"
              onClick={() => handleCardClick('/education/label-guide')}
              className="group glass-card border border-white/10 rounded-3xl p-5 hover:bg-white/5 transition-all duration-300 cursor-pointer overflow-hidden relative"
            >
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-brand-primary/20 rounded-full blur-2xl group-hover:bg-brand-primary/40 transition-colors" />
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/20 flex items-center justify-center mb-4 border border-brand-primary/30">
                <Search className="w-6 h-6 text-brand-primary" />
              </div>
              <h3 className="text-lg font-display font-bold text-white mb-1">Label Literacy</h3>
              <p className="text-sm text-content-secondary font-medium">Learn to decode ingredients and nutrition panels like a pro.</p>
            </div>

            {/* Packaging Guide Card */}
            <div 
              data-testid="card-educationhub-packaging-guide"
              onClick={() => handleCardClick('/education/packaging-guide')}
              className="group glass-card border border-white/10 rounded-3xl p-5 hover:bg-white/5 transition-all duration-300 cursor-pointer overflow-hidden relative"
            >
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-brand-secondary/20 rounded-full blur-2xl group-hover:bg-brand-secondary/40 transition-colors" />
              <div className="w-12 h-12 rounded-2xl bg-brand-secondary/20 flex items-center justify-center mb-4 border border-brand-secondary/30">
                <Box className="w-6 h-6 text-brand-secondary" />
              </div>
              <h3 className="text-lg font-display font-bold text-white mb-1">Honest Packaging</h3>
              <p className="text-sm text-content-secondary font-medium">A guide for brands on how to create transparent, honest labels.</p>
            </div>
          </div>
        </section>

        {/* Section 2: Deep Dives */}
        <section>
          <div className="flex items-center gap-2 mb-4 px-1">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold text-content-secondary uppercase tracking-widest">
              Deep Dives
            </h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div data-testid="card-educationhub-hidden-sugars" onClick={() => handleCardClick('/education/hidden-sugars')} className="glass-card border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center hover:bg-white/5 cursor-pointer transition-colors">
              <Droplets className="w-6 h-6 text-emerald-400 mb-2" />
              <span className="font-bold text-white text-sm">Hidden Sugars</span>
            </div>
            
            <div data-testid="card-educationhub-food-claims" onClick={() => handleCardClick('/education/food-claims')} className="glass-card border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center hover:bg-white/5 cursor-pointer transition-colors">
              <ShieldCheck className="w-6 h-6 text-brand-primary mb-2" />
              <span className="font-bold text-white text-sm">Food Claims</span>
            </div>
            
            <div data-testid="card-educationhub-additives" onClick={() => handleCardClick('/education/additives')} className="glass-card border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center hover:bg-white/5 cursor-pointer transition-colors">
              <AlertTriangle className="w-6 h-6 text-amber-400 mb-2" />
              <span className="font-bold text-white text-sm">Additives & E-Nos</span>
            </div>

            <div data-testid="card-educationhub-portion-guide" onClick={() => handleCardClick('/education/portion-guide')} className="glass-card border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center hover:bg-white/5 cursor-pointer transition-colors">
              <PieChart className="w-6 h-6 text-brand-secondary mb-2" />
              <span className="font-bold text-white text-sm">Portion Sizes</span>
            </div>
          </div>
        </section>

        {/* Section 3: Visual Nutrition Boards */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-brand-hazardous" />
              <h2 className="text-xs font-bold text-content-secondary uppercase tracking-widest">
                Nutrition Boards
              </h2>
            </div>
          </div>
          
          <div 
             data-testid="card-educationhub-boards"
             onClick={() => handleCardClick('/education/boards')}
             className="glass-card border border-brand-hazardous/30 rounded-3xl p-5 bg-gradient-to-br from-navy-800 to-navy-900 cursor-pointer hover:border-brand-hazardous/50 transition-colors relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 w-32 h-32 bg-brand-hazardous/10 rounded-full blur-2xl" />
             <div className="flex items-center justify-between relative z-10">
                <div>
                  <h3 className="text-lg font-display font-black text-white mb-1">Physical Equivalents</h3>
                  <p className="text-sm text-content-secondary font-medium max-w-[240px]">See the shocking real-life equivalents of what's inside your foods.</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-brand-hazardous/20 flex items-center justify-center border border-brand-hazardous/30">
                  <AlertTriangle className="w-6 h-6 text-brand-hazardous" />
                </div>
             </div>
          </div>
        </section>

      </div>
    </div>
  );
}
