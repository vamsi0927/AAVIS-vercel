import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronRight, User, Activity, Settings as SettingsIcon, Edit3, Save, X, Camera } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { PersonalizedInsights } from '../components/PersonalizedInsights';
import { motion, AnimatePresence } from 'framer-motion';

const DIET_OPTIONS = ['None', 'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Mediterranean'];
const ALLERGEN_OPTIONS = ['Peanuts', 'Tree Nuts', 'Dairy', 'Eggs', 'Soy', 'Wheat', 'Gluten', 'Fish', 'Shellfish'];
const CONDITION_OPTIONS = ['Diabetes', 'Hypertension', 'High Cholesterol', 'Heart Disease', 'IBS', 'Celiac'];
const GOAL_OPTIONS = ['Weight Loss', 'Muscle Gain', 'Maintenance', 'Energy', 'Heart Health'];

export function Profile() {
  const navigate = useNavigate();
  const { profile, updateProfile, logout } = useAppContext();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(profile);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const toggleArrayItem = (field: 'allergens' | 'conditions' | 'fitnessGoals', item: string) => {
    const current = editData[field] || [];
    const updated = current.includes(item) 
      ? current.filter(i => i !== item)
      : [...current, item];
    
    setEditData({ ...editData, [field]: updated });
  };

  const handleSave = () => {
    updateProfile(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(profile);
    setIsEditing(false);
  };

  const activeAllergens = profile.allergens || [];
  const activeConditions = profile.conditions || [];

  return (
    <div className="flex flex-col h-full bg-navy-900 pb-24 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-0 right-0 h-[40vh] bg-gradient-to-b from-brand-primary/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-0 w-72 h-72 bg-brand-secondary/5 rounded-full blur-[100px] pointer-events-none" />

      <header className="pt-safe pt-8 px-6 pb-4 flex justify-between items-center relative z-10">
        <h1 className="text-3xl font-display font-black text-white">Profile</h1>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button onClick={handleCancel} className="p-2 text-content-secondary hover:text-white rounded-xl bg-white/5 border border-white/5 transition-colors">
                <X className="w-5 h-5" />
              </button>
              <button onClick={handleSave} className="p-2 text-white bg-gradient-brand rounded-xl shadow-lg shadow-brand-primary/30 transition-transform active:scale-95">
                <Save className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-content-secondary hover:text-white transition-colors"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 space-y-6 pb-8 mt-2 relative z-10">
        
        {/* Profile Card */}
        <div className="glass-card rounded-3xl p-6 border border-white/5 relative overflow-hidden shadow-2xl">
          <div className="flex items-start justify-between mb-4">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-navy-900 border border-white/5 flex items-center justify-center text-brand-primary shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                  <User className="w-10 h-10" />
                </div>
              </div>
            </div>
            
            <div className="flex-1 ml-5">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    placeholder="Your Name"
                    className="w-full glass-input rounded-xl px-4 py-2 text-white placeholder:text-content-secondary font-bold text-base"
                  />
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={editData.age || ''}
                      onChange={(e) => setEditData({...editData, age: parseInt(e.target.value) || ''})}
                      placeholder="Age"
                      className="w-20 glass-input rounded-xl px-4 py-2 text-white placeholder:text-content-secondary text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-display font-black text-white leading-tight mb-1">{profile.name || 'Set your name'}</h2>
                    <p className="text-xs text-content-secondary font-bold uppercase tracking-wider">{profile.age ? `${profile.age} years old` : 'Age not set'}</p>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white hover:bg-brand-primary/20 hover:text-brand-primary transition-all active:scale-95"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {!isEditing && (
            <div className="mt-2">
              <div className="bg-navy-900/50 rounded-2xl p-4 border border-white/5">
                <p className="text-[10px] text-content-secondary uppercase tracking-widest mb-1.5 font-bold">Diet Preference</p>
                <p className="font-bold text-white text-sm">{profile.diet || 'None'}</p>
              </div>
            </div>
          )}
        </div>

        {/* INLINE EDITING SECTIONS */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6"
            >
              {/* Diet */}
              <section>
                <h3 className="text-xs font-bold text-content-secondary uppercase tracking-widest mb-3 px-1">Dietary Preference</h3>
                <div className="flex flex-wrap gap-2">
                  {DIET_OPTIONS.map(diet => (
                    <button
                      key={diet}
                      onClick={() => setEditData({...editData, diet})}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        editData.diet === diet ? 'bg-gradient-brand text-white shadow-lg shadow-brand-primary/20' : 'bg-white/5 text-content-secondary border border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {diet}
                    </button>
                  ))}
                </div>
              </section>

              {/* Allergies */}
              <section>
                <h3 className="text-xs font-bold text-content-secondary uppercase tracking-widest mb-3 px-1">Allergies</h3>
                <div className="flex flex-wrap gap-2">
                  {ALLERGEN_OPTIONS.map(allergen => (
                    <button
                      key={allergen}
                      onClick={() => toggleArrayItem('allergens', allergen)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        (editData.allergens || []).includes(allergen) ? 'bg-gradient-brand text-white shadow-lg shadow-brand-primary/20' : 'bg-white/5 text-content-secondary border border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {allergen}
                    </button>
                  ))}
                </div>
              </section>

              {/* Health Conditions */}
              <section>
                <h3 className="text-xs font-bold text-content-secondary uppercase tracking-widest mb-3 px-1">Health Conditions</h3>
                <div className="flex flex-wrap gap-2">
                  {CONDITION_OPTIONS.map(condition => (
                    <button
                      key={condition}
                      onClick={() => toggleArrayItem('conditions', condition)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        (editData.conditions || []).includes(condition) ? 'bg-gradient-brand text-white shadow-lg shadow-brand-primary/20' : 'bg-white/5 text-content-secondary border border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {condition}
                    </button>
                  ))}
                </div>
              </section>

              {/* Goals */}
              <section>
                <h3 className="text-xs font-bold text-content-secondary uppercase tracking-widest mb-3 px-1">Fitness Goals</h3>
                <div className="flex flex-wrap gap-2">
                  {GOAL_OPTIONS.map(goal => (
                    <button
                      key={goal}
                      onClick={() => toggleArrayItem('fitnessGoals', goal)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        (editData.fitnessGoals || []).includes(goal) ? 'bg-gradient-brand text-white shadow-lg shadow-brand-primary/20' : 'bg-white/5 text-content-secondary border border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* READ ONLY SECTIONS */}
        {!isEditing && (
          <>
            {/* Health Overview */}
            <section className="space-y-4">
              <h2 className="text-xs font-bold text-content-secondary uppercase tracking-widest px-1">
                Health Overview
              </h2>
              <div className="glass-card rounded-3xl border border-white/5 overflow-hidden shadow-lg">
                <div className="p-5">
                  <span className="font-bold text-xs uppercase tracking-wider block mb-3 text-white">Conditions & Allergies</span>
                  <div className="flex gap-2 flex-wrap">
                    {activeAllergens.length === 0 && activeConditions.length === 0 && (
                      <span className="text-sm text-content-secondary">No specific conditions set</span>
                    )}
                    {activeAllergens.map(a => <span key={a} className="text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg">{a}</span>)}
                    {activeConditions.map(c => <span key={c} className="text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg">{c}</span>)}
                  </div>
                </div>
              </div>
            </section>

            {/* Personalized Insights Section */}
            <PersonalizedInsights />

          </>
        )}
      </div>
    </div>
  );
}