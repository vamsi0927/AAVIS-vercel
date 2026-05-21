import React, { useState, createElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanLine, ShieldAlert, HeartPulse, ChevronRight, Droplet, Skull } from 'lucide-react';

const SLIDES = [
  {
    id: 'intro',
    icon: ScanLine,
    title: 'Your Food Has Secrets',
    description: 'Most people consume harmful additives, hidden sugars, and excessive sodium every single day without even realizing it.',
    color: 'from-brand-secondary/20 to-transparent',
    iconColor: 'text-brand-secondary'
  },
  {
    id: 'chemicals',
    icon: Skull,
    title: 'The Hidden Chemicals',
    description: 'Food labels are designed to be confusing. Preservatives, artificial colors, and trans fats hide behind complex E-numbers.',
    color: 'from-purple-500/20 to-transparent',
    iconColor: 'text-purple-400'
  },
  {
    id: 'risks',
    icon: Droplet,
    title: 'Long-term Health Risks',
    description: 'Excess sodium spikes blood pressure. Hidden sugars cause metabolic diseases. You deserve to know exactly what is fueling your body.',
    color: 'from-red-500/20 to-transparent',
    iconColor: 'text-red-400'
  },
  {
    id: 'solution',
    icon: ShieldAlert,
    title: 'Aavis AI decodes it all.',
    description: 'Instantly scan any label. Aavis AI translates confusing chemicals into clear, personalized health warnings.',
    color: 'from-brand-primary/20 to-transparent',
    iconColor: 'text-brand-primary'
  },
  {
    id: 'personalize',
    icon: HeartPulse,
    title: 'Personalized For You',
    description: 'Get custom health scores tailored strictly to your own allergies, diet, and health conditions.',
    color: 'from-emerald-500/20 to-transparent',
    iconColor: 'text-emerald-400'
  }
];

export function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = () => {
    navigate('/setup', { replace: true });
  };

  return (
    <div className="flex flex-col h-full bg-navy-900 relative overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className={`absolute top-0 left-0 right-0 h-[60vh] bg-gradient-to-b ${SLIDES[currentSlide].color} blur-3xl opacity-65 transition-all duration-1000 -z-10`} />

      {/* Skip Button */}
      <div className="absolute top-safe pt-6 right-6 z-20">
        <button
          onClick={finishOnboarding}
          className="text-content-secondary hover:text-white transition-colors text-sm font-semibold tracking-wide">
          Skip
        </button>
      </div>

      {/* Slides */}
      <div className="flex-1 relative flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col items-center text-center px-8 w-full"
          >
            <div className="w-32 h-32 bg-navy-800 rounded-full flex items-center justify-center mb-10 shadow-2xl border border-white/5 relative">
              <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${SLIDES[currentSlide].color} blur-md opacity-50`} />
              {createElement(SLIDES[currentSlide].icon, {
                className: `w-14 h-14 ${SLIDES[currentSlide].iconColor} relative z-10`
              })}
            </div>
            
            <h2 className="text-3xl font-display font-black mb-4 tracking-tight text-white leading-tight">
              {SLIDES[currentSlide].title}
            </h2>
            <p className="text-content-secondary text-[15px] leading-relaxed max-w-sm">
              {SLIDES[currentSlide].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="pb-safe pb-12 px-8 flex flex-col items-center z-20">
        {/* Indicators */}
        <div className="flex gap-2.5 mb-10">
          {SLIDES.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === currentSlide ? 'w-8 bg-brand-primary' : 'w-2 bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleNext}
          className="w-full bg-gradient-brand text-white hover:opacity-95 rounded-2xl py-4 font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-brand-primary/20">
          {currentSlide === SLIDES.length - 1 ? 'Build Your Profile' : 'Continue'}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}