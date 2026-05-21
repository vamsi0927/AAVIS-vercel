import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Shield } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Chip } from '../../components/Chip';
import { toast } from 'sonner';

const DIETS = ['None', 'Veg', 'Nonveg', 'Vegan', 'Keto', 'Jain'];
const ALLERGENS = ['peanuts', 'gluten', 'dairy', 'soy', 'eggs', 'shellfish', 'tree nuts'];
const CONDITIONS = ['Diabetes', 'Hypertension', 'Heart Disease', 'High Cholesterol', 'Obesity'];

export function UpdateConditions() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAppContext();
  const [formData, setFormData] = useState({ diet: profile.diet, allergens: profile.allergens, conditions: profile.conditions });
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const isChanged = JSON.stringify(formData) !== JSON.stringify({ diet: profile.diet, allergens: profile.allergens, conditions: profile.conditions });
    setIsDirty(isChanged);
  }, [formData, profile]);

  const handleSave = () => {
    updateProfile({ ...profile, ...formData });
    setIsDirty(false);
    toast.success('Health preferences updated');
    navigate('/profile');
  };

  const toggleArrayItem = (field: 'allergens' | 'conditions', item: string) => {
    setFormData((prev) => {
      const array = prev[field];
      const newArray = array.includes(item) ? array.filter((i) => i !== item) : [...array, item];
      return { ...prev, [field]: newArray };
    });
  };

  return (
    <div className="flex flex-col h-full bg-navy-900 pb-24">
      <header className="pt-safe pt-8 px-6 pb-4 flex items-center gap-4 bg-navy-900/90 backdrop-blur-md sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-navy-800 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-display font-bold flex-1">Health Preferences</h1>
        <button
          onClick={handleSave}
          disabled={!isDirty}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
            isDirty ? 'bg-brand-primary text-white shadow-lg' : 'bg-navy-800 text-content-secondary'
          }`}
        >
          <Save className="w-4 h-4" />
          Save
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 space-y-8 py-6">
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-content-secondary uppercase tracking-wider">Dietary Preference</h2>
          <div className="flex flex-wrap gap-2">
            {DIETS.map((diet) => (
              <Chip
                key={diet}
                label={diet}
                selected={formData.diet === diet}
                onClick={() => setFormData({ ...formData, diet })}
              />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-content-secondary uppercase tracking-wider">Allergies to Avoid</h2>
          <div className="flex flex-wrap gap-2">
            {ALLERGENS.map((allergen) => (
              <Chip
                key={allergen}
                label={allergen}
                selected={formData.allergens.includes(allergen)}
                onClick={() => toggleArrayItem('allergens', allergen)}
              />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-content-secondary uppercase tracking-wider">Health Conditions</h2>
          <div className="bg-navy-800 rounded-2xl border border-navy-700 overflow-hidden">
            {CONDITIONS.map((condition, idx) => {
              const isSelected = formData.conditions.includes(condition);
              return (
                <div
                  key={condition}
                  onClick={() => toggleArrayItem('conditions', condition)}
                  className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
                    idx !== CONDITIONS.length - 1 ? 'border-b border-navy-700' : ''
                  } hover:bg-navy-700/50`}
                >
                  <span className="font-medium">{condition}</span>
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isSelected ? 'bg-brand-primary' : 'bg-navy-900 border border-navy-600'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isSelected ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-content-secondary mt-2 flex items-start gap-1">
            <Shield className="w-3 h-3 mt-0.5 flex-shrink-0" />
            Your health data is stored locally on your device.
          </p>
        </section>
      </div>
    </div>
  );
}
