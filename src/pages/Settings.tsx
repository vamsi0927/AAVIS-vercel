import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  Moon,
  Camera,
  Trash2,
  Shield,
  HelpCircle,
  Mail,
  Info,
  LogOut,
  User,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { toast } from 'sonner';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function Settings() {
  const navigate = useNavigate();
  const { profile, updateProfile, logout, clearHistory, scans, theme, setTheme, cameraPermission, setCameraPermission } = useAppContext();
  const [userEmail, setUserEmail] = React.useState<string | null>(null);

  // Avatar state
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isRemoving, setIsRemoving] = React.useState(false);

  const processImage = (file: File): Promise<File> => {
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
        
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Canvas to Blob failed'));
          resolve(new File([blob], file.name, { type: file.type }));
        }, file.type, 0.9);
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
      const processedFile = await processImage(file);
      setSelectedFile(processedFile);
      setPreviewUrl(URL.createObjectURL(processedFile));
    } catch (err) {
      toast.error('Failed to process image');
    }
  };

  const handleSaveAvatar = async () => {
    if (!selectedFile || !isSupabaseConfigured() || !profile.name) return;
    
    setIsUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const fileExt = selectedFile.type.split('/')[1];
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      const uniqueUrl = `${publicUrl}?t=${Date.now()}`;
      updateProfile({ ...profile, avatarUrl: uniqueUrl });
      toast.success('Profile picture updated successfully.');
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to upload profile picture.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!isSupabaseConfigured()) return;
    setIsRemoving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const { data: files } = await supabase.storage.from('profile-images').list(userId);
      if (files && files.length > 0) {
        const filesToRemove = files.map(x => `${userId}/${x.name}`);
        await supabase.storage.from('profile-images').remove(filesToRemove);
      }

      updateProfile({ ...profile, avatarUrl: undefined });
      toast.success('Profile picture removed successfully.');
      setPreviewUrl(null);
      setSelectedFile(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove profile picture.');
    } finally {
      setIsRemoving(false);
    }
  };

  React.useEffect(() => {
    import('../lib/supabase').then(({ supabase }) => {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.email) setUserEmail(data.user.email);
      });
    });
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleClearHistory = () => {
    if (scans.length === 0) {
      toast.info('No scan history to clear.');
      return;
    }
    if (window.confirm(`Delete all ${scans.length} scan records? This cannot be undone.`)) {
      clearHistory();
      toast.success('Scan history cleared.');
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    toast.success(`Switched to ${nextTheme === 'dark' ? 'Dark' : 'Light'} Mode!`);
  };

  const requestCameraPermission = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Camera access is not supported by this browser/device.");
        setCameraPermission('denied');
        return;
      }
      
      toast.loading("Testing camera permission...", { id: 'camera-perm' });
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Stop all tracks immediately
      stream.getTracks().forEach(track => track.stop());
      
      setCameraPermission('granted');
      toast.success("Camera permission granted successfully!", { id: 'camera-perm' });
    } catch (err) {
      console.error("Camera request failed:", err);
      setCameraPermission('denied');
      toast.error("Camera access denied or blocked.", { id: 'camera-perm' });
    }
  };

  const handleFutureReady = () => {
    toast.info('This feature is coming in the next update!');
  };

  return (
    <div className="flex flex-col h-full bg-navy-900 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-20 right-0 w-72 h-72 bg-brand-secondary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <header className="pt-safe pt-6 px-4 pb-4 flex items-center bg-navy-900/90 backdrop-blur-md sticky top-0 z-20 border-b border-white/5 md:max-w-7xl md:mx-auto md:w-full md:px-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-content-secondary hover:text-white rounded-xl bg-white/5 border border-white/5 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-black text-lg ml-3 text-white">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 space-y-8 md:space-y-0 md:grid md:grid-cols-3 md:gap-6 pb-32 mt-2 relative z-10 md:max-w-7xl md:mx-auto md:w-full md:px-8 md:py-6">
        
        {/* Column 1: APP */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-content-secondary uppercase tracking-widest mb-3 px-1">
            App Settings
          </h3>
          <div className="glass-card border border-white/5 rounded-3xl overflow-hidden shadow-lg">
            <button
              onClick={() => navigate('/settings/notifications')}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-brand-primary" />
                <span className="font-bold text-sm text-content-primary">Notifications</span>
              </div>
              <ChevronRight className="w-4 h-4 text-content-secondary" />
            </button>
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5">
              <div className="flex items-center gap-3">
                <Moon className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-sm text-content-primary">Theme</span>
              </div>
              <span className="text-xs text-content-secondary flex items-center gap-2 capitalize">
                {theme} <ChevronRight className="w-4 h-4" />
              </span>
            </button>
            <button
              onClick={requestCameraPermission}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <Camera className="w-4 h-4 text-brand-safe" />
                <span className="font-bold text-sm text-content-primary">Camera Permissions</span>
              </div>
              <span className="text-xs text-content-secondary flex items-center gap-2 capitalize">
                {cameraPermission === 'unknown' ? 'Request' : cameraPermission} <ChevronRight className="w-4 h-4" />
              </span>
            </button>
          </div>
        </section>

        {/* Column 2: DATA & PRIVACY */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-content-secondary uppercase tracking-widest mb-3 px-1">
            Data & Privacy
          </h3>
          <div className="glass-card border border-white/5 rounded-3xl overflow-hidden shadow-lg">
            <button
              onClick={handleClearHistory}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5">
              <div className="flex items-center gap-3">
                <Trash2 className="w-4 h-4 text-red-400" />
                <div className="text-left">
                  <span className="font-bold text-sm text-content-primary block">Clear Scan History</span>
                  <span className="text-[10px] text-content-secondary block font-semibold">
                    {scans.length} scan{scans.length !== 1 ? 's' : ''} stored
                  </span>
                </div>
              </div>
            </button>
            <button
              onClick={() => navigate('/privacy')}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-content-secondary" />
                <span className="font-bold text-sm text-content-primary">Privacy Policy</span>
              </div>
              <ChevronRight className="w-4 h-4 text-content-secondary" />
            </button>
            <button
              onClick={() => navigate('/terms')}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-content-secondary" />
                <span className="font-bold text-sm text-content-primary">Terms & Conditions</span>
              </div>
              <ChevronRight className="w-4 h-4 text-content-secondary" />
            </button>
          </div>
        </section>

        {/* Column 3: SUPPORT & ACCOUNT */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-content-secondary uppercase tracking-widest mb-3 px-1">
            Support & Account
          </h3>

          <div className="glass-card border border-white/5 rounded-3xl p-5 flex flex-col items-center gap-4 shadow-lg mb-4">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-24 h-24 rounded-full bg-navy-900 border border-white/5 flex items-center justify-center text-brand-primary shadow-[0_0_20px_rgba(99,102,241,0.2)] overflow-hidden relative">
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
                <div className={`absolute inset-0 w-full h-full bg-navy-900 flex items-center justify-center text-4xl font-bold ${previewUrl || profile.avatarUrl ? 'hidden' : ''}`}>
                  {profile.name ? profile.name.charAt(0).toUpperCase() : <User className="w-12 h-12" />}
                </div>
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/jpeg, image/png, image/webp"
                onChange={handleFileSelect}
              />
            </div>
            
            <div className="flex flex-col items-center">
              {userEmail && <span className="text-sm font-bold text-white mb-2">{userEmail}</span>}
              
              {selectedFile && (
                <div className="flex gap-2">
                  <button 
                    onClick={handleSaveAvatar} 
                    disabled={isUploading}
                    className="px-4 py-2 bg-brand-primary text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-all hover:bg-brand-primary/90"
                  >
                    {isUploading ? 'Saving...' : 'Save Photo'}
                  </button>
                  <button 
                    onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                    disabled={isUploading}
                    className="px-4 py-2 bg-white/10 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-all hover:bg-white/20"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {!selectedFile && profile.avatarUrl && (
                <button 
                  onClick={handleRemoveAvatar}
                  disabled={isRemoving}
                  className="mt-2 text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
                >
                  {isRemoving ? 'Removing...' : 'Remove Photo'}
                </button>
              )}
            </div>
          </div>

          <div className="glass-card border border-white/5 rounded-3xl overflow-hidden shadow-lg mb-4">
            <button
              onClick={() => navigate('/help')}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-4 h-4 text-brand-primary" />
                <span className="font-bold text-sm text-white">Help & FAQ</span>
              </div>
              <ChevronRight className="w-4 h-4 text-content-secondary" />
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-brand-primary" />
                <span className="font-bold text-sm text-white">Contact Support</span>
              </div>
              <ChevronRight className="w-4 h-4 text-content-secondary" />
            </button>
            <button
              onClick={() => navigate('/about')}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <Info className="w-4 h-4 text-content-secondary" />
                <span className="font-bold text-sm text-white">About Aavis</span>
              </div>
              <ChevronRight className="w-4 h-4 text-content-secondary" />
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-3xl p-4 font-bold hover:bg-red-500/20 active:scale-[0.98] transition-all">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </section>

      </div>
    </div>
  );
}