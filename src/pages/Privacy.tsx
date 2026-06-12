import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
export function Privacy() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col h-full bg-navy-900 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-20 right-0 w-72 h-72 bg-brand-secondary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <header className="pt-safe pt-6 px-4 pb-4 flex items-center bg-navy-900/90 backdrop-blur-md sticky top-0 z-20 border-b border-white/5">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-content-secondary hover:text-white rounded-xl bg-white/5 border border-white/5 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-black text-lg ml-3 text-white">Privacy Policy</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 relative z-10 text-sm leading-relaxed text-content-secondary">
        <p className="text-xs text-content-secondary font-bold uppercase tracking-wider bg-white/5 px-3 py-1.5 rounded-full inline-block">
          Last updated: May 20, 2026
        </p>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">1. Data Collection & Local Storage</h3>
          <p>
            Aavis is designed with privacy-first principles. All your personal health details (dietary preferences, allergies, health conditions, profile name, and scan logs) are stored directly inside your device's local storage. We do not transmit or monetize this personal health data.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">2. Camera Usage & Processing</h3>
          <p>
            Aavis requests camera access solely to run optical character recognition (OCR) scans of food package labels and barcode scan operations. Label text detection is processed directly in the application's runtime. We do not store, upload, or share captured images.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">3. API Connections & Data Sync</h3>
          <p>
            To provide health ratings, the verified label text is analyzed by our integrated Aavis AI backend service, and barcode requests call public nutritional repositories (e.g., Open Food Facts API). Only anonymous product codes or ingredients strings are sent to perform analyses.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">4. Information Security</h3>
          <p>
            If you optionally configure and authenticate your account using Supabase cloud integration, your scan history is synced securely to your private table structure. You may delete this history or clear local app database records at any time from Settings.
          </p>
        </section>

        <div className="mt-8 p-5 glass-card border border-white/5 rounded-3xl text-center space-y-1">
          <p className="text-xs text-white font-bold">Have privacy questions?</p>
          <h3 className="text-white font-display font-black text-base">Contact Us</h3>
          <p>
            Send us a message at <a href="mailto:aavis.support@gmail.com" className="text-brand-primary font-bold hover:underline">aavis.support@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}