import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronRight, User, Activity, Settings as SettingsIcon, Edit3, Save, X, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PersonalizedInsights } from '../components/PersonalizedInsights';
import { motion, AnimatePresence } from 'framer-motion';

const DIET_OPTIONS = ['None', 'Vegetarian', 'Non-Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Mediterranean'];
const ALLERGEN_OPTIONS = ['Peanuts', 'Tree Nuts', 'Dairy', 'Eggs', 'Soy', 'Wheat', 'Gluten', 'Fish', 'Shellfish'];
const CONDITION_OPTIONS = ['Diabetes', 'Hypertension', 'High Cholesterol', 'Heart Disease', 'Kidney Disease', 'Fatty Liver', 'IBS', 'Celiac Disease', 'PCOS', 'Thyroid Issues'];

export function Profile() {
  const navigate = useNavigate();
  const { profile, updateProfile, logout } = useAppContext();
  
  const [isEditing, setIsEditing] = useState(() => {
    const saved = sessionStorage.getItem('profile_isEditing');
    return saved ? JSON.parse(saved) : false;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState(() => {
    const saved = sessionStorage.getItem('profile_editData');
    return saved ? JSON.parse(saved) : profile;
  });
  
  // Avatar state
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(() => {
    return sessionStorage.getItem('profile_selectedFileUrl') || null;
  });
  const [selectedFileName, setSelectedFileName] = useState<string | null>(() => {
    return sessionStorage.getItem('profile_selectedFileName') || null;
  });
  
  const [showPreviewModal, setShowPreviewModal] = useState(() => {
    const saved = sessionStorage.getItem('profile_showPreviewModal');
    return saved ? JSON.parse(saved) : false;
  });
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  React.useEffect(() => {
    if (isEditing) {
      sessionStorage.setItem('profile_isEditing', JSON.stringify(isEditing));
      sessionStorage.setItem('profile_editData', JSON.stringify(editData));
      sessionStorage.setItem('profile_showPreviewModal', JSON.stringify(showPreviewModal));
      if (selectedFileUrl) sessionStorage.setItem('profile_selectedFileUrl', selectedFileUrl);
      if (selectedFileName) sessionStorage.setItem('profile_selectedFileName', selectedFileName);
    }
  }, [isEditing, editData, showPreviewModal, selectedFileUrl, selectedFileName]);

  const clearDraft = () => {
    sessionStorage.removeItem('profile_isEditing');
    sessionStorage.removeItem('profile_editData');
    sessionStorage.removeItem('profile_showPreviewModal');
    sessionStorage.removeItem('profile_selectedFileUrl');
    sessionStorage.removeItem('profile_selectedFileName');
  };

  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 512;
        let width = img.width;
        let height = img.height;
        
        const size = Math.min(width, height);
        const startX = (width - size) / 2;
        const startY = (height - size) / 2;
        
        canvas.width = Math.min(size, maxSize);
        canvas.height = Math.min(size, maxSize);
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Failed to get canvas context'));
        
        ctx.drawImage(img, startX, startY, size, size, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL(file.type, 0.9);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Maximum file size is 5 MB.');
      return;
    }

    try {
      const dataUrl = await processImage(file);
      setSelectedFileUrl(dataUrl);
      setSelectedFileName(file.name);
      setShowPreviewModal(true);
      setIsActionMenuOpen(false);
    } catch (err) {
      toast.error('Failed to process image');
    }
  };

  const dataURLtoBlob = (dataurl: string) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
  };

  const handleSaveAvatar = async () => {
    if (!selectedFileUrl || !isSupabaseConfigured() || !profile.name) return;
    
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const blob = dataURLtoBlob(selectedFileUrl);
      const fileExt = blob.type.split('/')[1];
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      const uniqueUrl = `${publicUrl}?t=${Date.now()}`;
      setEditData({...editData, avatarUrl: uniqueUrl});
      updateProfile({...editData, avatarUrl: uniqueUrl});
      toast.success('Profile picture updated successfully.');
      setShowPreviewModal(false);
      setSelectedFileUrl(null);
      setSelectedFileName(null);
      
    } catch (err: any) {
      toast.error('Failed to upload profile picture.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!isSupabaseConfigured()) return;
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const { data: files } = await supabase.storage.from('profile-images').list(userId);
      if (files && files.length > 0) {
        const filesToRemove = files.map(x => `${userId}/${x.name}`);
        await supabase.storage.from('profile-images').remove(filesToRemove);
      }

      setEditData({...editData, avatarUrl: undefined});
      updateProfile({...editData, avatarUrl: undefined});
      toast.success('Profile picture removed successfully.');
      setShowRemoveConfirm(false);
      setShowPreviewModal(false);
      setIsActionMenuOpen(false);
      setSelectedFileUrl(null);
      setSelectedFileName(null);
    } catch (err: any) {
      toast.error('Failed to remove profile picture.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const toggleArrayItem = (field: 'allergens' | 'conditions' | 'fitnessGoals', item: string) => {
    const current = editData[field] || [];
    const normalizedItem = item.toLowerCase();
    const isIncluded = current.some(i => i.toLowerCase() === normalizedItem);
    
    const updated = isIncluded 
      ? current.filter(i => i.toLowerCase() !== normalizedItem)
      : [...current, item];
    
    setEditData({ ...editData, [field]: updated });
  };

  const handleSave = () => {
    updateProfile(editData);
    setIsEditing(false);
    clearDraft();
  };

  const handleCancel = () => {
    setEditData(profile);
    setIsEditing(false);
    setShowPreviewModal(false);
    setSelectedFileUrl(null);
    setSelectedFileName(null);
    clearDraft();
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
              <button onClick={handleCancel} disabled={isSaving} className="p-2 text-content-secondary hover:text-white rounded-xl bg-white/5 border border-white/5 transition-colors disabled:opacity-50">
                <X className="w-5 h-5" />
              </button>
              <button onClick={handleSave} disabled={isSaving} className="p-2 text-white bg-gradient-to-r from-brand-primary to-brand-secondary rounded-xl shadow-lg shadow-brand-primary/30 transition-transform active:scale-95 disabled:opacity-50">
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

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-8 mt-2 relative z-10 md:px-8 md:max-w-7xl md:mx-auto md:w-full">
        
        <div className="md:grid md:grid-cols-12 md:gap-8">
          
          {/* Left Column: Profile Card */}
          <div className="md:col-span-5 lg:col-span-4 mb-6 md:mb-0">
            {/* Profile Card */}
            <div className="glass-card rounded-3xl p-6 border border-white/5 relative overflow-hidden shadow-2xl">
              <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div 
                      className={`relative ${isEditing ? 'group cursor-pointer' : ''}`}
                      onClick={() => isEditing && setIsActionMenuOpen(true)}
                    >
                      <div className="w-20 h-20 rounded-full bg-navy-900 border border-white/5 flex items-center justify-center text-brand-primary shadow-[0_0_20px_rgba(99,102,241,0.2)] overflow-hidden relative">
                        {previewUrl || profile.avatarUrl ? (
                          <img 
                            src={previewUrl || profile.avatarUrl} 
                            alt="Profile Avatar" 
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover rounded-full" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`absolute inset-0 w-full h-full bg-navy-900 flex items-center justify-center text-3xl font-bold ${previewUrl || profile.avatarUrl ? 'hidden' : ''}`}>
                          {profile.name ? profile.name.charAt(0).toUpperCase() : <User className="w-10 h-10" />}
                        </div>
                      </div>
                      {isEditing && (
                        <>
                          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <Camera className="w-6 h-6 text-white" />
                          </div>
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/jpeg, image/png, image/webp"
                            onChange={handleFileSelect}
                          />
                        </>
                      )}
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
                      <div className="flex gap-3 flex-wrap">
                        <input
                          type="number"
                          value={editData.age || ''}
                          onChange={(e) => setEditData({...editData, age: parseInt(e.target.value) || ''})}
                          placeholder="Age"
                          className="w-20 glass-input rounded-xl px-4 py-2 text-white placeholder:text-content-secondary text-sm"
                        />
                        <input
                          type="number"
                          value={editData.height || ''}
                          onChange={(e) => setEditData({...editData, height: parseInt(e.target.value) || ''})}
                          placeholder="Height (cm)"
                          className="w-28 glass-input rounded-xl px-4 py-2 text-white placeholder:text-content-secondary text-sm"
                        />
                        <input
                          type="number"
                          value={editData.weight || ''}
                          onChange={(e) => setEditData({...editData, weight: parseInt(e.target.value) || ''})}
                          placeholder="Weight (kg)"
                          className="w-28 glass-input rounded-xl px-4 py-2 text-white placeholder:text-content-secondary text-sm"
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
          </div>

          {/* Right Column: Edit Forms / Read Only Sections */}
          <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-6">
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                      {DIET_OPTIONS.map(diet => (
                        <button
                          key={diet}
                          onClick={() => setEditData({...editData, diet})}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all text-center ${
                            editData.diet === diet ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-lg shadow-brand-primary/20' : 'bg-white/5 text-content-secondary border border-white/5 hover:bg-white/10'
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                      {ALLERGEN_OPTIONS.map(allergen => (
                        <button
                          key={allergen}
                          onClick={() => toggleArrayItem('allergens', allergen)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all text-center ${
                            (editData.allergens || []).some(a => a.toLowerCase() === allergen.toLowerCase()) ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-lg shadow-brand-primary/20' : 'bg-white/5 text-content-secondary border border-white/5 hover:bg-white/10'
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                      {CONDITION_OPTIONS.map(condition => (
                        <button
                          key={condition}
                          onClick={() => toggleArrayItem('conditions', condition)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all text-center ${
                            (editData.conditions || []).some(c => c.toLowerCase() === condition.toLowerCase()) ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-lg shadow-brand-primary/20' : 'bg-white/5 text-content-secondary border border-white/5 hover:bg-white/10'
                          }`}
                        >
                          {condition}
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
      </div>
      {/* Modals */}
      <AnimatePresence>
        {isActionMenuOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-8 sm:p-0">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-navy-800 w-full sm:w-96 rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col gap-3"
            >
              <h3 className="text-lg font-bold text-white text-center mb-2">Profile Picture</h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors"
              >
                Change Photo
              </button>
              {profile.avatarUrl && (
                <button
                  onClick={() => { setIsActionMenuOpen(false); setShowRemoveConfirm(true); }}
                  className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-bold transition-colors"
                >
                  Remove Photo
                </button>
              )}
              <button
                onClick={() => setIsActionMenuOpen(false)}
                className="w-full py-3 mt-2 text-content-secondary hover:text-white rounded-xl font-bold transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}

        {showPreviewModal && selectedFileUrl && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-navy-800 w-full max-w-sm rounded-3xl p-8 border border-white/10 shadow-2xl flex flex-col items-center"
            >
              <h3 className="text-xl font-black text-white mb-6">Preview Photo</h3>
              
              <div className="w-40 h-40 rounded-full border-4 border-brand-primary overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.3)] mb-4">
                <img src={selectedFileUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
              
              <p className="text-content-secondary text-sm font-bold mb-8 truncate w-full text-center">
                {selectedFileName || 'avatar.jpg'}
              </p>

              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={handleSaveAvatar}
                  disabled={isSaving}
                  className="w-full py-3.5 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl font-bold shadow-lg shadow-brand-primary/30 transition-transform active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : 'Save Photo'}
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving}
                  className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                  Choose Another Photo
                </button>
                {profile.avatarUrl && (
                  <button
                    onClick={() => { setShowPreviewModal(false); setShowRemoveConfirm(true); }}
                    disabled={isSaving}
                    className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-bold transition-colors disabled:opacity-50"
                  >
                    Remove Current Photo
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    setSelectedFileUrl(null);
                    setSelectedFileName(null);
                    clearDraft();
                  }}
                  disabled={isSaving}
                  className="w-full py-3 text-content-secondary hover:text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showRemoveConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-navy-800 w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col gap-6"
            >
              <div>
                <h3 className="text-xl font-black text-white mb-2">Remove profile picture?</h3>
                <p className="text-content-secondary text-sm">
                  This action will revert your profile to the default avatar.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRemoveConfirm(false)}
                  disabled={isSaving}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemovePhoto}
                  disabled={isSaving}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex justify-center items-center"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Remove'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}