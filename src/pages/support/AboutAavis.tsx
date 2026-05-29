import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Heart, Shield, Leaf, Activity } from 'lucide-react';

export function AboutAavis() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-navy-900 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-20 right-0 w-72 h-72 bg-brand-secondary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <header className="pt-safe pt-6 px-4 pb-4 flex items-center bg-navy-900/90 backdrop-blur-md sticky top-0 z-20 border-b border-white/5">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-content-secondary hover:text-white rounded-xl bg-white/5 border border-white/5 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-black text-lg ml-3 text-white">About Aavis</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 space-y-8 pb-32 mt-4 relative z-10">
        
        {/* Logo / Hero */}
        <div className="flex flex-col items-center justify-center pt-4 pb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center mb-4 shadow-xl shadow-brand-primary/20">
            <span className="text-4xl">🥑</span>
          </div>
          <h2 className="text-3xl font-display font-black text-white tracking-tight">Aavis</h2>
          <p className="text-content-secondary text-sm mt-1">Version 2.5.0</p>
          <p className="text-center text-white/80 mt-4 leading-relaxed px-4">
            Aavis is your intelligent companion for navigating the complex world of food labels. 
            In India, reading and understanding ingredient labels isn't yet a common habit—but it needs to be. 
            We created Aavis to change this by making label reading effortless, so everyone can know exactly what they are putting into their bodies.
          </p>
        </div>

        {/* Mission */}
        <section>
          <h3 className="text-xs font-bold text-content-secondary uppercase tracking-widest mb-3 px-1">
            Our Mission
          </h3>
          <div className="glass-card border border-white/5 rounded-3xl p-5 space-y-4 shadow-lg">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <h4 className="text-white font-bold mb-1">Empower Health</h4>
                <p className="text-sm text-content-secondary leading-relaxed">
                  We translate confusing chemical names and deceptive marketing into clear, actionable health insights.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-secondary/20 flex items-center justify-center shrink-0">
                <Leaf className="w-5 h-5 text-brand-secondary" />
              </div>
              <div>
                <h4 className="text-white font-bold mb-1">Promote Transparency</h4>
                <p className="text-sm text-content-secondary leading-relaxed">
                  By leveraging advanced AI, we expose hidden sugars, dangerous additives, and processed ingredients.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-white font-bold mb-1">Personalized Guidance</h4>
                <p className="text-sm text-content-secondary leading-relaxed">
                  Aavis adapts to your unique dietary needs, allergies, and health conditions for tailored recommendations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Credits */}
        <section className="text-center pb-8">
          <p className="text-xs text-content-secondary">
            Made with <Heart className="w-3 h-3 inline-block text-brand-primary mx-1" /> for a healthier tomorrow.
          </p>
          <p className="text-xs text-content-secondary mt-1">
            &copy; {new Date().getFullYear()} Aavis Health. All rights reserved.
          </p>
        </section>

      </div>
    </div>
  );
}
