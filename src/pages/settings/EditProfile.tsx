import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { toast } from 'sonner';

export function EditProfile() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAppContext();
  const [formData, setFormData] = useState<{
    name: string;
    age: number | '';
    gender: string;
    height: number | '';
    weight: number | '';
    activityLevel: string;
  }>({ 
    name: profile.name || '', 
    age: profile.age || '',
    gender: profile.gender || 'Prefer not to say',
    height: profile.height || '',
    weight: profile.weight || '',
    activityLevel: profile.activityLevel || 'Moderately Active'
  });
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const isChanged = 
      formData.name !== profile.name || 
      formData.age !== profile.age ||
      formData.gender !== profile.gender ||
      formData.height !== profile.height ||
      formData.weight !== profile.weight ||
      formData.activityLevel !== profile.activityLevel;
    setIsDirty(isChanged);
  }, [formData, profile]);

  const handleSave = () => {
    updateProfile({ ...profile, ...formData });
    setIsDirty(false);
    toast.success('Profile updated successfully');
    navigate('/profile');
  };

  return (
    <div className="flex flex-col h-full bg-navy-900">
      <header className="pt-safe pt-8 px-6 pb-4 flex items-center gap-4 bg-navy-900/90 backdrop-blur-md sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-navy-800 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-display font-bold flex-1">Edit Profile</h1>
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
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-2 ml-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
                className="w-full bg-navy-800 border border-navy-700 rounded-xl py-4 px-5 text-white placeholder:text-content-secondary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-content-secondary mb-2 ml-1">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value ? Number(e.target.value) : '' })}
                  placeholder="Age"
                  className="w-full bg-navy-800 border border-navy-700 rounded-xl py-4 px-5 text-white placeholder:text-content-secondary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-content-secondary mb-2 ml-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-navy-800 border border-navy-700 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                >
                  <option value="Prefer not to say" className="bg-navy-900 text-white">Prefer not to say</option>
                  <option value="Male" className="bg-navy-900 text-white">Male</option>
                  <option value="Female" className="bg-navy-900 text-white">Female</option>
                  <option value="Other" className="bg-navy-900 text-white">Other</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-content-secondary mb-2 ml-1">Height (cm)</label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value ? Number(e.target.value) : '' })}
                  placeholder="e.g. 175"
                  className="w-full bg-navy-800 border border-navy-700 rounded-xl py-4 px-5 text-white placeholder:text-content-secondary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-content-secondary mb-2 ml-1">Weight (kg)</label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value ? Number(e.target.value) : '' })}
                  placeholder="e.g. 70"
                  className="w-full bg-navy-800 border border-navy-700 rounded-xl py-4 px-5 text-white placeholder:text-content-secondary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-content-secondary mb-2 ml-1">Activity Level</label>
              <select
                value={formData.activityLevel}
                onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value })}
                className="w-full bg-navy-800 border border-navy-700 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
              >
                <option value="Sedentary" className="bg-navy-900 text-white">Sedentary</option>
                <option value="Lightly Active" className="bg-navy-900 text-white">Lightly Active</option>
                <option value="Moderately Active" className="bg-navy-900 text-white">Moderately Active</option>
                <option value="Very Active" className="bg-navy-900 text-white">Very Active</option>
                <option value="Super Active" className="bg-navy-900 text-white">Super Active</option>
              </select>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
