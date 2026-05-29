import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const DIET_OPTIONS = ['None', 'Vegetarian', 'Non-Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Mediterranean'];
const CONDITION_OPTIONS = ['Diabetes', 'Hypertension', 'High Cholesterol', 'Heart Disease', 'IBS', 'Celiac'];
const ALLERGEN_OPTIONS = ['Peanuts', 'Tree Nuts', 'Dairy', 'Eggs', 'Soy', 'Wheat', 'Gluten', 'Fish', 'Shellfish'];

export function ProfileSetup() {
  const navigate = useNavigate();
  const { profile, updateProfile, completeOnboarding } = useAppContext();
  
  const [step, setStep] = useState(0);
  const [setupData, setSetupData] = useState<{
    name: string;
    age: number | '';
    gender: string;
    height: number | '';
    weight: number | '';
    activityLevel: string;
    diet: string;
    conditions: string[];
    allergens: string[];
    fitnessGoals: string[];
  }>({
    name: profile.name || '',
    age: profile.age || '',
    gender: profile.gender || '',
    height: profile.height || '',
    weight: profile.weight || '',
    activityLevel: profile.activityLevel || 'Moderately Active',
    diet: profile.diet || 'None',
    conditions: profile.conditions || [],
    allergens: profile.allergens || [],
    fitnessGoals: profile.fitnessGoals || [],
  });

  const TOTAL_STEPS = 4;

  const handleNext = async () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      // Final save
      await updateProfile(setupData);
      completeOnboarding();
      navigate('/home', { replace: true });
    }
  };

  const toggleArrayItem = (field: 'conditions' | 'allergens' | 'fitnessGoals', item: string) => {
    const current = setupData[field] as string[];
    const updated = current.includes(item) 
      ? current.filter(i => i !== item)
      : [...current, item];
    
    setSetupData({ ...setupData, [field]: updated });
  };

  const isStepValid = () => {
    if (step === 0) return setupData.name.trim().length > 0 && setupData.age !== '';
    if (step === 1) return true; // diet & gender optional
    return true; // others optional
  };

  return (
    <div className="flex flex-col h-full bg-navy-900 relative overflow-hidden">
      {/* Dynamic background glow */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-brand-primary/10 to-transparent blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="pt-safe pt-6 px-6 flex items-center justify-between relative z-10">
        <button
          onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)}
          className="p-2 -ml-2 text-content-secondary hover:text-white rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-brand-primary' : i < step ? 'w-2 bg-brand-primary/50' : 'w-2 bg-navy-700'}`} />
          ))}
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 relative flex flex-col px-6 overflow-y-auto no-scrollbar mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            {/* STEP 0: Basic Info */}
            {step === 0 && (
              <div className="flex-1">
                <h1 className="text-3xl font-display font-bold mb-2 text-white">Let's get to know you</h1>
                <p className="text-content-secondary mb-10">This helps Aavis personalize your health analysis.</p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-content-secondary mb-3 uppercase tracking-wider">What should we call you?</label>
                    <input
                      type="text"
                      value={setupData.name}
                      onChange={(e) => setSetupData({...setupData, name: e.target.value})}
                      placeholder="Your Name"
                      className="w-full bg-navy-800 border border-navy-700 rounded-2xl py-4 px-5 text-white placeholder:text-content-secondary focus:border-brand-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-content-secondary mb-3 uppercase tracking-wider">Age</label>
                    <input
                      type="number"
                      value={setupData.age}
                      onChange={(e) => setSetupData({...setupData, age: e.target.value ? Number(e.target.value) : ''})}
                      placeholder="e.g. 28"
                      className="w-full bg-navy-800 border border-navy-700 rounded-2xl py-4 px-5 text-white placeholder:text-content-secondary focus:border-brand-primary focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 1: Diet & Gender */}
            {step === 1 && (
              <div className="flex-1">
                <h1 className="text-3xl font-display font-bold mb-2 text-white">Your Diet</h1>
                <p className="text-content-secondary mb-8">Select your primary dietary lifestyle.</p>
                
                <div className="flex flex-wrap gap-3">
                  {DIET_OPTIONS.map(diet => (
                    <button
                      key={diet}
                      onClick={() => setSetupData({...setupData, diet})}
                      className={`px-5 py-3 rounded-2xl font-bold transition-all ${
                        setupData.diet === diet 
                          ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-105 border border-brand-primary/50' 
                          : 'bg-navy-800 text-content-secondary border border-navy-700 hover:bg-navy-700'
                      }`}
                    >
                      {diet}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: Conditions */}
            {step === 2 && (
              <div className="flex-1">
                <h1 className="text-3xl font-display font-bold mb-2 text-white">Health Conditions</h1>
                <p className="text-content-secondary mb-8">We will flag foods that conflict with your conditions.</p>
                
                <div className="flex flex-wrap gap-3">
                  {CONDITION_OPTIONS.map(condition => (
                    <button
                      key={condition}
                      onClick={() => toggleArrayItem('conditions', condition)}
                      className={`px-5 py-3 rounded-2xl font-bold transition-all ${
                        setupData.conditions.includes(condition) 
                          ? 'bg-brand-primary text-white scale-105 border border-brand-primary/50 shadow-lg shadow-brand-primary/20' 
                          : 'bg-navy-800 text-content-secondary border border-navy-700 hover:bg-navy-700'
                      }`}
                    >
                      {condition}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: Allergies */}
            {step === 3 && (
              <div className="flex-1">
                <h1 className="text-3xl font-display font-bold mb-2 text-white">Any Allergies?</h1>
                <p className="text-content-secondary mb-8">Aavis will automatically warn you about these.</p>
                
                <div className="flex flex-wrap gap-3">
                  {ALLERGEN_OPTIONS.map(allergen => (
                    <button
                      key={allergen}
                      onClick={() => toggleArrayItem('allergens', allergen)}
                      className={`px-5 py-3 rounded-2xl font-bold transition-all ${
                        setupData.allergens.includes(allergen) 
                          ? 'bg-brand-primary text-white scale-105 border border-brand-primary/50 shadow-lg shadow-brand-primary/20' 
                          : 'bg-navy-800 text-content-secondary border border-navy-700 hover:bg-navy-700'
                      }`}
                    >
                      {allergen}
                    </button>
                  ))}
                </div>
                
                {/* Visual Finish Indicator */}
                <div className="mt-10 flex justify-center items-center pb-10">
                  <div className="w-24 h-24 bg-brand-safe/10 rounded-full flex items-center justify-center border border-brand-safe/20 animate-pulse">
                    <CheckCircle2 className="w-10 h-10 text-brand-safe" />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="pb-safe pb-8 pt-4">
          <button
            onClick={handleNext}
            disabled={!isStepValid()}
            className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95 rounded-2xl py-4 font-bold text-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-brand-primary/20"
          >
            {step === TOTAL_STEPS - 1 ? 'Complete Setup' : 'Continue'}
            {step < TOTAL_STEPS - 1 && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
